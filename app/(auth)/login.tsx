import PhoneInputWithPicker from "@/components/InputPhoneText";
import LoginStyles from "@/styles/LoginStyles";
import { baseUrl } from "@/utils/config";
import useStore from "@/zustand/store";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import axios, { AxiosError } from "axios";
import * as Google from "expo-auth-session/providers/google";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Keyboard,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

interface PhoneData {
  isValid: boolean;
  countryCode: string;
  callingCode: string;
  nationalNumber: string;
  phoneNumber: string;
  fullNumber: string;
}

interface FormState {
  phoneNumber: string;
  phoneData: PhoneData | null;
  otp: string;
}

interface ApiResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      _id?: string;
      id?: string;
    };
  };
  message?: string;
}

const INITIAL_FORM: FormState = {
  phoneNumber: "",
  phoneData: null,
  otp: "",
};

const INITIAL_ERRORS = {
  phone: "",
  otp: "",
};

const OTP_LENGTH = 6;
const RESEND_TIMER_DURATION = 30;
const API_TIMEOUT = 15000;

export default function Login() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [otpVisible, setOtpVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [confirmation, setConfirmation] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  const { login } = useStore();
  const timerRef: any = useRef<NodeJS.Timeout | null>(null);

  const handleLoginSuccess = async (tokens: {
    accessToken: string;
    refreshToken: string;
    userID: string;
  }) => {
    try {
      await login(tokens);
      // Navigation will be handled automatically by the NavigationController
      Alert.alert("Success", "Signed in successfully!");
    } catch (error) {
      console.error("Login failed:", error);
      Alert.alert("Error", "Failed to save login information");
    }
  };
  const otpInputRef: any = useRef<TextInput>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId:
      "723221915171-galo0rgnakv8a4fk2i0j836j0aim40pc.apps.googleusercontent.com",
    androidClientId:
      "723221915171-9de4ta6tbvjphia4s5mnl8n622gpa30a.apps.googleusercontent.com",
    webClientId:
      "723221915171-9ggjhvc6stlt7bd80l3ijbg057rh85ak.apps.googleusercontent.com",
  });

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Handle Google auth response
  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.idToken) {
        googleSignIn(authentication.idToken);
      } else {
        Alert.alert("Error", "Failed to get authentication token from Google");
      }
    } else if (response?.type === "error") {
      console.error("Google auth error:", response.error);
      Alert.alert("Error", "Google authentication failed. Please try again.");
    }
  }, [response]);

  // Resend timer effect
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [resendTimer]);

  const handleGoogleLogin = async () => {
    if (loading) return;

    try {
      setLoading(true);
      await promptAsync();
    } catch (error) {
      console.error("Google login error:", error);
      Alert.alert(
        "Error",
        "Failed to initialize Google sign-in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = useCallback(
    async (token: string) => {
      console.log("=== Starting Google Signin ===");

      try {
        setLoading(true);
        const response = await axios.post<ApiResponse>(
          `${baseUrl}auth/google-login`,
          { idToken: token },
          {
            headers: { "Content-Type": "application/json" },
            timeout: API_TIMEOUT,
          }
        );

        console.log("=== Google Login Response ===");
        console.log("Status:", response.data);
        const res: any = response.data;
        if (response.data) {
          console.log("User Data:", res);
          // if (!res.accessToken || !res.refreshToken) {
          //   throw new Error("Invalid tokens received from server");
          // }

          // Store tokens and navigate
          await handleLoginSuccess({
            accessToken: res?.accessToken,
            refreshToken: res.refreshToken,
            userID: res.user?.user_id || res.user?.id,
          });
        } else {
          throw new Error("Invalid response structure from server");
        }
      } catch (error) {
        console.error("Google sign-in error:", error);

        let errorMessage = "Failed to sign in with Google. Please try again.";

        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<{ message?: string }>;
          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message;
          } else if (axiosError.code === "ECONNABORTED") {
            errorMessage =
              "Request timeout. Please check your internet connection.";
          } else if (!axiosError.response) {
            errorMessage =
              "Network error. Please check your internet connection.";
          }
        }

        Alert.alert("Error", errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [login]
  );

  const handleChange = useCallback((field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, phone: "", otp: "" }));
  }, []);

  const validateForm = () => {
    const newErrors = { ...INITIAL_ERRORS };
    let valid = true;

    if (!form.phoneData?.isValid) {
      newErrors.phone = "Please enter a valid phone number";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const validateOtp = () => {
    const newErrors = { ...INITIAL_ERRORS };
    let valid = true;

    if (!form.otp || form.otp.length !== OTP_LENGTH) {
      newErrors.otp = `Please enter a valid ${OTP_LENGTH}-digit OTP`;
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const startResendTimer = () => {
    setResendTimer(RESEND_TIMER_DURATION);
  };

  const handleSubmit = async () => {
    if (loading || !validateForm() || !form.phoneData) {
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      const phoneNumber =
        form.phoneData.nationalNumber || form.phoneData.phoneNumber;
      const fullPhoneNumber = `+91${phoneNumber}`;

      console.log("Sending OTP to:", fullPhoneNumber);

      const authInstance = auth();
      const confirmationResult = await authInstance.signInWithPhoneNumber(
        fullPhoneNumber
      );

      if (!confirmationResult) {
        throw new Error("Failed to send verification code");
      }

      console.log("Verification code sent successfully");
      setConfirmation(confirmationResult);
      setOtpVisible(true);
      setForm((prev) => ({ ...prev, otp: "" }));
      startResendTimer();

      // Focus OTP input after a short delay
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 500);

      Alert.alert("Success", "OTP sent to your phone number");
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      handleFirebaseError(error, "send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (loading || !validateOtp() || !confirmation) {
      if (!confirmation) {
        Alert.alert(
          "Error",
          "No confirmation available. Please request OTP again."
        );
      }
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      const userCredential = await confirmation.confirm(form.otp);

      if (!userCredential?.user) {
        throw new Error("Failed to verify OTP");
      }

      const user: any = userCredential.user;
      console.log("User signed in successfully:", user.uid);

      // Send phone auth data to backend for token exchange
      const idToken = await user.getIdToken();
      const phoneNumber = form.phoneData?.fullNumber || form.phoneNumber;

      // Call your backend API to exchange Firebase token for your app tokens
      const response = await axios.post<ApiResponse>(
        `${baseUrl}/auth/phone-login`,
        {
          idToken,
          phoneNumber,
          uid: user.uid,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: API_TIMEOUT,
        }
      );

      if (response.data?.data) {
        const {
          accessToken,
          refreshToken,
          user: userData,
        } = response.data.data;

        if (!accessToken || !refreshToken) {
          // Fallback to Firebase tokens if backend doesn't provide them
          await handleLoginSuccess({
            accessToken: idToken,
            refreshToken: user.refreshToken || "",
            userID: user.uid,
          });
        } else {
          await handleLoginSuccess({
            accessToken,
            refreshToken,
            userID: userData?._id || userData?.id || user.uid,
          });
        }
      } else {
        // Fallback to Firebase tokens
        await handleLoginSuccess({
          accessToken: idToken,
          refreshToken: user.refreshToken || "",
          userID: user.uid,
        });
      }

      Alert.alert("Success", "Phone number verified successfully!", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (error: any) {
      console.error("Error verifying OTP:", error);

      if (axios.isAxiosError(error)) {
        // Backend error, but Firebase auth succeeded
        console.log("Backend token exchange failed, using Firebase tokens");
        try {
          const user: any = auth().currentUser;
          if (user) {
            const idToken = await user.getIdToken();
            await login({
              accessToken: idToken,
              refreshToken: user.refreshToken || "",
              userID: user.uid,
            });

            Alert.alert("Success", "Phone number verified successfully!", [
              { text: "OK", onPress: () => router.replace("/(tabs)") },
            ]);
            return;
          }
        } catch (fallbackError) {
          console.error("Fallback auth failed:", fallbackError);
        }
      }

      handleFirebaseError(error, "verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseError = (error: any, action: string) => {
    let errorMessage = `Failed to ${action}. Please try again.`;

    switch (error.code) {
      case "auth/invalid-phone-number":
        errorMessage = "Invalid phone number format. Please check your number.";
        break;
      case "auth/too-many-requests":
        errorMessage = "Too many requests. Please try again later.";
        break;
      case "auth/quota-exceeded":
        errorMessage = "SMS quota exceeded. Please try again later.";
        break;
      case "auth/app-not-authorized":
        errorMessage =
          "App not authorized for SMS verification. Please contact support.";
        break;
      case "auth/captcha-check-failed":
        errorMessage = "Captcha verification failed. Please try again.";
        break;
      case "auth/invalid-verification-code":
        errorMessage = "Invalid verification code. Please check and try again.";
        break;
      case "auth/code-expired":
        errorMessage =
          "Verification code has expired. Please request a new one.";
        break;
      case "auth/session-expired":
        errorMessage = "Session expired. Please request a new OTP.";
        break;
      default:
        if (error.message) {
          errorMessage = error.message;
        }
    }

    Alert.alert("Error", errorMessage);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) {
      if (resendTimer > 0) {
        Alert.alert(
          "Please wait",
          `You can resend OTP in ${resendTimer} seconds`
        );
      }
      return;
    }

    // Reset OTP state
    setOtpVisible(false);
    setConfirmation(null);
    setForm((prev) => ({ ...prev, otp: "" }));
    setErrors(INITIAL_ERRORS);

    // Resend OTP
    await handleSubmit();
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setErrors(INITIAL_ERRORS);
    setOtpVisible(false);
    setConfirmation(null);
    setResendTimer(0);
  };

  return (
    <SafeAreaView style={LoginStyles.container}>
      <View style={LoginStyles.container}>
        <ImageBackground
          source={require("../../assets/images/loginBg.png")}
          resizeMode="cover"
          style={LoginStyles.backgroundImage}
        >
          <View style={LoginStyles.formContainer}>
            <Text style={LoginStyles.title}>Login with Number</Text>

            {!otpVisible && (
              <>
                <PhoneInputWithPicker
                  value={form.phoneData?.phoneNumber || ""}
                  onChangeText={(text) => {
                    const phoneData: PhoneData = {
                      ...(form.phoneData || {
                        countryCode: "IN",
                        callingCode: "91",
                        nationalNumber: "",
                        phoneNumber: "",
                        fullNumber: "",
                        isValid: false,
                      }),
                      nationalNumber: text,
                      phoneNumber: text,
                      fullNumber: `+91${text}`,
                      isValid: text.length === 10,
                      countryCode: "IN",
                      callingCode: "91",
                    };
                    setForm((prev) => ({
                      ...prev,
                      phoneData,
                      phoneNumber: phoneData.fullNumber,
                    }));
                  }}
                  onChangeFormattedText={(data) => {
                    const phoneData: PhoneData = {
                      countryCode: data.countryCode || "IN",
                      callingCode: data.callingCode || "91",
                      nationalNumber: data.phoneNumber,
                      phoneNumber: data.phoneNumber,
                      fullNumber:
                        data.fullNumber ||
                        `+${data.callingCode}${data.phoneNumber}`,
                      isValid: data.phoneNumber
                        ? data.phoneNumber.length >= 10
                        : false,
                    };

                    setForm((prev) => ({
                      ...prev,
                      phoneData,
                      phoneNumber: phoneData.fullNumber,
                    }));
                  }}
                  maxLength={10}
                  defaultCountryCode="IN"
                  label="Mobile Number"
                  placeholder="7891235460"
                  error={errors.phone}
                />

                <TouchableOpacity
                  style={[
                    LoginStyles.submitButton,
                    loading && LoginStyles.disabledButton,
                  ]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={LoginStyles.submitButtonText}>Get OTP</Text>
                  )}
                </TouchableOpacity>

                <Text style={LoginStyles.otherSignUpText}>
                  Other Sign In Options
                </Text>

                <TouchableOpacity
                  onPress={handleGoogleLogin}
                  style={[
                    LoginStyles.googleButton,
                    loading && LoginStyles.disabledButton,
                  ]}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require("@/assets/images/google.png")}
                    style={LoginStyles.googleIcon}
                  />
                  <Text style={LoginStyles.googleButtonText}>
                    Sign in with Google
                  </Text>
                </TouchableOpacity>
                <View>
                  <Text style={LoginStyles.otherSignUpText}>
                    Don&apos;t have an account?{" "}
                    <Text
                      onPress={() => router.replace("/register")}
                      style={[
                        LoginStyles.otherSignUpText,
                        { color: "#2E674D", backgroundColor: "transparent" },
                      ]}
                    >
                      Register
                    </Text>
                  </Text>
                </View>
              </>
            )}

            {otpVisible && (
              <View style={LoginStyles.otpContainer}>
                <Text style={LoginStyles.otpText}>
                  Enter OTP sent to{" "}
                  {form.phoneData?.fullNumber || form.phoneNumber}
                </Text>

                <TextInput
                  ref={otpInputRef}
                  style={[
                    LoginStyles.input,
                    errors.otp ? LoginStyles.inputError : null,
                  ]}
                  placeholder={`Enter ${OTP_LENGTH}-digit OTP`}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  value={form.otp}
                  onChangeText={(text) =>
                    handleChange("otp", text.replace(/[^0-9]/g, ""))
                  }
                  autoFocus
                  selectTextOnFocus
                />

                {errors.otp ? (
                  <Text style={LoginStyles.errorText}>{errors.otp}</Text>
                ) : null}

                <TouchableOpacity
                  style={[
                    LoginStyles.button,
                    (loading || form.otp.length !== OTP_LENGTH) &&
                      LoginStyles.disabledButton,
                  ]}
                  onPress={handleOtpVerify}
                  disabled={loading || form.otp.length !== OTP_LENGTH}
                  activeOpacity={0.7}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={LoginStyles.buttonText}>Verify OTP</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      LoginStyles.resendText,
                      (resendTimer > 0 || loading) && LoginStyles.disabledText,
                    ]}
                  >
                    {resendTimer > 0
                      ? `Resend OTP in ${resendTimer}s`
                      : "Resend OTP"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={resetForm}
                  disabled={loading}
                  // style={LoginStyles.backButton}
                  activeOpacity={0.7}
                >
                  <Text
                  // style={LoginStyles.backButtonText}
                  >
                    ← Change Phone Number
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
}
