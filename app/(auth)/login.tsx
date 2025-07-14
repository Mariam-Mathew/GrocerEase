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
  Platform,
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
      user_id?: string;
    };
  };
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    _id?: string;
    id?: string;
    user_id?: string;
  };
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
  const otpInputRef = useRef<TextInput>(null);

  // Use individual selectors to prevent infinite loops
  const isLoggedIn = useStore((state: any) => state.isLoggedIn);
  const user = useStore((state: any) => state.user);
  const tokens = useStore((state: any) => state.tokens);

  // Google Auth Request with enhanced configuration
  const [request, response, promptAsync]: any = Google.useAuthRequest({
    iosClientId:
      "200626670415-70qcnevflirmq55e8soi75csaa42i6e3.apps.googleusercontent.com",
    androidClientId:
      "200626670415-54ilrn5uaj5o0kl4jl23l3qqnq9jbpf9.apps.googleusercontent.com",
    webClientId:
      "200626670415-2ng40sq10raoh0n47i7q6afvhdjq96b8.apps.googleusercontent.com",

    scopes: ["openid", "profile", "email"],
  });

  // FIXED: Improved network check with fallback endpoints
  const checkNetworkAndAPI = useCallback(async () => {
    try {
      console.log("=== Network Check ===");
      console.log("Base URL:", baseUrl);

      // Try multiple endpoints to check connectivity
      const endpoints = [
        `${baseUrl}auth/test`,
        `${baseUrl}`, // Root endpoint
      ];

      let connected = false;
      for (const endpoint of endpoints) {
        try {
          const testResponse = await axios.get(endpoint, {
            timeout: 5000,
          });
          console.log(
            `API check successful at ${endpoint}:`,
            testResponse.status
          );
          connected = true;
          break;
        } catch (err) {
          console.log(`Failed to connect to ${endpoint}`);
        }
      }

      if (!connected) {
        // Try a basic internet connectivity test
        try {
          await axios.get("https://www.google.com", {
            timeout: 5000,
          });
          console.log("Internet connectivity: OK");
          console.log("API server appears to be down or unreachable");
          return false;
        } catch (internetError) {
          console.error("No internet connectivity:", internetError);
          return false;
        }
      }

      return connected;
    } catch (error) {
      console.error("Network/API check failed:", error);
      return false;
    }
  }, []);

  // Config check remains the same
  const checkGoogleAuthConfig = useCallback(() => {
    console.log("=== Google Auth Config Check ===");
    console.log("Platform:", Platform.OS);
    console.log("Request object:", request);
    console.log("Request ready:", !!request);

    const configs = {
      ios: "200626670415-70qcnevflirmq55e8soi75csaa42i6e3.apps.googleusercontent.com",
      android:
        "200626670415-54ilrn5uaj5o0kl4jl23l3qqnq9jbpf9.apps.googleusercontent.com",
      web: "200626670415-2ng40sq10raoh0n47i7q6afvhdjq96b8.apps.googleusercontent.com",
    };

    console.log("Using config:", configs);
  }, [request]);

  // Enhanced login success handler
  const handleLoginSuccess = useCallback(
    async (tokens: {
      accessToken: string;
      refreshToken: string;
      userID: string;
    }) => {
      console.log("=== Login Success Handler ===");
      console.log("Tokens received:", {
        accessToken: tokens.accessToken ? "✓" : "✗",
        refreshToken: tokens.refreshToken ? "✓" : "✗",
        userID: tokens.userID ? "✓" : "✗",
      });

      try {
        await login(tokens);
        console.log("Login state updated successfully");

        // Show success message
        Alert.alert("Success", "Signed in successfully!", [
          {
            text: "OK",
            onPress: () => {
              console.log("Attempting navigation to tabs");
              router.replace("/(tabs)");
            },
          },
        ]);
      } catch (error) {
        console.error("Login failed:", error);
        Alert.alert("Error", "Failed to save login information");
      }
    },
    [login]
  );

  // FIXED: Enhanced Google Sign-In with better error handling
  const googleSignIn = useCallback(
    async (token: string) => {
      console.log("=== Starting Google Signin ===");
      console.log("Token received:", token ? "✓" : "✗");
      console.log("Environment:", __DEV__ ? "DEV" : "PROD");
      console.log("Platform:", Platform.OS);

      try {
        setLoading(true);

        // Check network first
        const networkOk = await checkNetworkAndAPI();
        if (!networkOk) {
          Alert.alert(
            "Network Error",
            "Cannot connect to server. Please check your internet connection and try again.",
            [
              { text: "Retry", onPress: () => googleSignIn(token) },
              { text: "Cancel", style: "cancel" },
            ]
          );
          return;
        }

        console.log("Making request to:", `${baseUrl}auth/google-login`);

        const response = await axios.post<ApiResponse>(
          `${baseUrl}auth/google-login`,
          { idToken: token },
          {
            headers: { "Content-Type": "application/json" },
            timeout: API_TIMEOUT,
          }
        );

        console.log("=== Google Login Response ===");
        console.log("Status:", response.status);
        console.log("Response structure:", {
          hasData: !!response.data,
          hasDataProperty: !!response.data?.data,
          hasAccessToken: !!(
            response.data?.data?.accessToken || response.data?.accessToken
          ),
          hasRefreshToken: !!(
            response.data?.data?.refreshToken || response.data?.refreshToken
          ),
          hasUser: !!(response.data?.data?.user || response.data?.user),
        });

        const responseData = response.data;
        let accessToken, refreshToken, user;

        // Handle different response structures
        if (responseData?.data) {
          // Response has nested data structure
          accessToken = responseData.data.accessToken;
          refreshToken = responseData.data.refreshToken;
          user = responseData.data.user;
        } else {
          // Response has flat structure
          accessToken = responseData?.accessToken;
          refreshToken = responseData?.refreshToken;
          user = responseData?.user;
        }

        console.log("Extracted data:", {
          accessToken: accessToken ? "✓" : "✗",
          refreshToken: refreshToken ? "✓" : "✗",
          user: user ? "✓" : "✗",
        });

        if (accessToken && user) {
          await handleLoginSuccess({
            accessToken,
            refreshToken: refreshToken || "",
            userID: user?.user_id || user?.id || user?._id || "",
          });
        } else {
          throw new Error("Invalid response structure from server");
        }
      } catch (error: any) {
        console.error("=== Google Sign-in Error ===");
        console.error("Error type:", error?.constructor?.name);
        console.error("Error message:", error?.message);
        console.error("Full error:", error);

        let errorMessage = "Failed to sign in with Google. Please try again.";
        let showRetry = false;

        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<{ message?: string }>;
          console.error("Response status:", axiosError.response?.status);
          console.error("Response data:", axiosError.response?.data);

          if (axiosError.response?.status === 404) {
            errorMessage = "Server endpoint not found. Please contact support.";
          } else if (axiosError.response?.status === 500) {
            errorMessage = "Server error. Please try again later.";
            showRetry = true;
          } else if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message;
          } else if (axiosError.code === "ECONNABORTED") {
            errorMessage =
              "Request timeout. Please check your internet connection.";
            showRetry = true;
          } else if (axiosError.code === "NETWORK_ERROR") {
            errorMessage =
              "Network error. Please check your internet connection.";
            showRetry = true;
          } else if (!axiosError.response) {
            errorMessage =
              "Cannot connect to server. Please check your internet connection.";
            showRetry = true;
          }
        }

        if (showRetry) {
          Alert.alert("Error", errorMessage, [
            { text: "Retry", onPress: () => googleSignIn(token) },
            { text: "Cancel", style: "cancel" },
          ]);
        } else {
          Alert.alert("Error", errorMessage);
        }
      } finally {
        setLoading(false);
      }
    },
    [checkNetworkAndAPI, handleLoginSuccess]
  );

  // Enhanced Google login handler
  const handleGoogleLogin = useCallback(async () => {
    if (loading) return;

    console.log("=== Starting Google Login Process ===");

    try {
      setLoading(true);

      // Check if request is ready
      if (!request) {
        console.error("Google auth request not ready");
        Alert.alert(
          "Error",
          "Google authentication not ready. Please try again."
        );
        return;
      }

      console.log("Prompting Google auth...");
      const result = await promptAsync();
      console.log("Prompt result:", result);
    } catch (error) {
      console.error("Google login initialization error:", error);
      Alert.alert(
        "Error",
        "Failed to initialize Google sign-in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [loading, request, promptAsync]);

  // Form handlers remain the same
  const handleChange = useCallback((field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, phone: "", otp: "" }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = { ...INITIAL_ERRORS };
    let valid = true;

    if (!form.phoneData?.isValid) {
      newErrors.phone = "Please enter a valid phone number";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }, [form.phoneData?.isValid]);

  const validateOtp = useCallback(() => {
    const newErrors = { ...INITIAL_ERRORS };
    let valid = true;

    if (!form.otp || form.otp.length !== OTP_LENGTH) {
      newErrors.otp = `Please enter a valid ${OTP_LENGTH}-digit OTP`;
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }, [form.otp]);

  const startResendTimer = useCallback(() => {
    setResendTimer(RESEND_TIMER_DURATION);
  }, []);

  const handleFirebaseError = useCallback((error: any, action: string) => {
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
  }, []);

  const handleSubmit = useCallback(async () => {
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
  }, [
    loading,
    validateForm,
    form.phoneData,
    startResendTimer,
    handleFirebaseError,
  ]);

  // FIXED: Enhanced OTP verification with better error handling
  const handleOtpVerify = useCallback(async () => {
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

      try {
        // Try to exchange tokens with backend
        const response = await axios.post<ApiResponse>(
          `${baseUrl}auth/phone-login`,
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

          await handleLoginSuccess({
            accessToken: accessToken || idToken,
            refreshToken: refreshToken || "",
            userID: userData?._id || userData?.id || user.uid,
          });
        } else {
          // Fallback to Firebase tokens
          await handleLoginSuccess({
            accessToken: idToken,
            refreshToken: user.refreshToken || "",
            userID: user.uid,
          });
        }
      } catch (backendError) {
        console.log("Backend token exchange failed, using Firebase tokens");
        // Use Firebase tokens as fallback
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
      handleFirebaseError(error, "verify OTP");
    } finally {
      setLoading(false);
    }
  }, [
    loading,
    validateOtp,
    confirmation,
    form.otp,
    form.phoneData,
    form.phoneNumber,
    handleLoginSuccess,
    handleFirebaseError,
  ]);

  const handleResendOtp = useCallback(async () => {
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
  }, [resendTimer, loading, handleSubmit]);

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setErrors(INITIAL_ERRORS);
    setOtpVisible(false);
    setConfirmation(null);
    setResendTimer(0);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Run initialization checks only once
  useEffect(() => {
    checkGoogleAuthConfig();
    checkNetworkAndAPI();
  }, [checkGoogleAuthConfig, checkNetworkAndAPI]);

  // Debug store state changes
  useEffect(() => {
    console.log("=== Store State Change ===");
    console.log("Store state:", { isLoggedIn, user, tokens });
  }, [isLoggedIn, user, tokens]);

  // Enhanced Google auth response handler
  useEffect(() => {
    if (!response) return;

    console.log("=== Google Auth Response ===");
    console.log("Response type:", response?.type);
    console.log("Response params:", response?.params);
    console.log("Response error:", response?.error);
    console.log("Response authentication:", response?.authentication);

    if (response?.type === "success") {
      const { authentication } = response;
      console.log("Authentication object:", authentication);

      if (authentication?.idToken) {
        console.log("ID Token received, proceeding with sign-in");
        googleSignIn(authentication.idToken);
      } else {
        console.error("No ID token in authentication object");
        Alert.alert("Error", "Failed to get authentication token from Google");
      }
    } else if (response?.type === "error") {
      console.error("Google auth error:", response.error);
      Alert.alert(
        "Error",
        `Google authentication failed: ${
          response.error?.message || "Unknown error"
        }`
      );
    } else if (response?.type === "cancel") {
      console.log("User cancelled Google authentication");
    }
  }, [response, googleSignIn]);

  // Resend timer effect
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [resendTimer]);

  // Phone data handlers
  const handlePhoneDataChange = useCallback(
    (text: string) => {
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
    },
    [form.phoneData]
  );

  const handleFormattedPhoneChange = useCallback((data: any) => {
    const phoneData: PhoneData = {
      countryCode: data.countryCode || "IN",
      callingCode: data.callingCode || "91",
      nationalNumber: data.phoneNumber,
      phoneNumber: data.phoneNumber,
      fullNumber: data.fullNumber || `+${data.callingCode}${data.phoneNumber}`,
      isValid: data.phoneNumber ? data.phoneNumber.length >= 10 : false,
    };

    setForm((prev) => ({
      ...prev,
      phoneData,
      phoneNumber: phoneData.fullNumber,
    }));
  }, []);

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
                  onChangeText={handlePhoneDataChange}
                  onChangeFormattedText={handleFormattedPhoneChange}
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
                    (loading || !request) && LoginStyles.disabledButton,
                  ]}
                  disabled={loading || !request}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require("@/assets/images/google.png")}
                    style={LoginStyles.googleIcon}
                  />
                  <Text style={LoginStyles.googleButtonText}>
                    {!request ? "Loading..." : "Sign in with Google"}
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
                  activeOpacity={0.7}
                >
                  <Text>← Change Phone Number</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
}
