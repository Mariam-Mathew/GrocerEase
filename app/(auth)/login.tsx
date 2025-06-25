import PhoneInputWithPicker from "@/components/InputPhoneText";
import { baseUrl } from "@/utils/config";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import axios from "axios";
import * as Google from "expo-auth-session/providers/google";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

interface PhoneData {
  isValid: boolean;
  countryCode: string;
  nationalNumber: string;
  phoneNumber: string;
  fullNumber: string;
}

interface FormState {
  phoneNumber: string;
  phoneData: PhoneData | null;
  otp: string;
  [key: string]: any;
}

const INITIAL_FORM: FormState = {
  phoneNumber: "",
  phoneData: null,
  otp: "",
};

const INITIAL_ERRORS = {
  phone: "",
};

export default function Login() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [otpVisible, setOtpVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  // Store the confirmation result from Firebase
  const [confirmation, setConfirmation] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId:
      "723221915171-galo0rgnakv8a4fk2i0j836j0aim40pc.apps.googleusercontent.com",
    androidClientId:
      "723221915171-9de4ta6tbvjphia4s5mnl8n622gpa30a.apps.googleusercontent.com",
    webClientId:
      "723221915171-9ggjhvc6stlt7bd80l3ijbg057rh85ak.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication }: any = response;
      googleSignIn(authentication.idToken);
      console.log("response info:", response);
    }
  }, [response]);

  const handleGoogleLogin = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error("Google login error:", error);
      Alert.alert("Error", "Failed to sign in with Google. Please try again.");
    }
  };

  const googleSignIn = async (token: any) => {
    console.log("=== Starting Google Signin ===");
    console.log("Base URL:", baseUrl);
    console.log("Request URL:", `${baseUrl}/auth/google-login`);

    try {
      const response = await axios.post(
        `${baseUrl}auth/google-login`,
        {
          idToken: token,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 10000,
          validateStatus: (status) => status < 500, // Reject only if status is 500 or higher
        }
      );

      console.log("=== Response ===");
      console.log("Status:", response.status);
      console.log("Headers:", JSON.stringify(response.headers, null, 2));
      console.log("Data:", response.data);

      return response.data;
    } catch (error) {
      console.error("=== Error Details ===");
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error("Response Error:", {
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers,
            data: error.response.data,
          });
        } else if (error.request) {
          console.error("No Response Received:", {
            message: error.message,
            code: error.code,
            request: error.request._response || "No response data",
          });
        } else {
          console.error("Request Setup Error:", error.message);
        }
      } else {
        console.error("Unexpected Error:", error);
      }
      throw error;
    }
  };

  const handleChange = (field: any, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({
      ...prev,
      phone: "",
    }));
  };

  const handleFormattedChange = (data: PhoneData) => {
    console.log("Phone data received:", data);
    setForm((prev) => ({
      ...prev,
      phoneData: data,
      phoneNumber: data.fullNumber || data.phoneNumber,
    }));
  };

  const validateForm = () => {
    let valid = true;
    let newErrors = { ...INITIAL_ERRORS };

    if (!form.phoneData || !form.phoneData.isValid) {
      newErrors.phone = "Please enter a valid phone number";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // Start the resend timer
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setTimeout(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearTimeout(interval);
    };
  }, [resendTimer]);

  const startResendTimer = () => {
    setResendTimer(30); // 30 seconds cooldown
  };

  const handleSubmit = async () => {
    console.log("Form data:", form);
    if (!validateForm() || !form.phoneData) {
      console.log("Validation failed");
      return;
    }

    setLoading(true);
    try {
      // Get phone number from phoneData
      const phoneNumber =
        form.phoneData.nationalNumber || form.phoneData.phoneNumber;

      console.log("Sending OTP to: +91" + phoneNumber);
      console.log("Initiating phone number verification...");

      // Request a verification code to be sent to the user's phone
      console.log("Sending verification code to:", `+91${phoneNumber}`);

      // Use the auth instance directly
      const authInstance = auth();

      // Request the verification code
      const confirmationResult = await authInstance.signInWithPhoneNumber(
        `+91${phoneNumber}`
      );

      if (!confirmationResult) {
        throw new Error("Failed to send verification code");
      }

      console.log("Verification code sent successfully");
      console.log("OTP sent successfully");

      // Store confirmation result
      setConfirmation(confirmationResult);
      setOtpVisible(true);
      startResendTimer();

      Alert.alert("Success", "OTP sent to your phone number");
    } catch (error: any) {
      console.error("Error sending OTP:", error);

      // Handle specific Firebase errors
      let errorMessage = "Failed to send OTP. Please try again.";

      if (error.code === "auth/invalid-phone-number") {
        errorMessage = "Invalid phone number format. Please check your number.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many requests. Please try again later.";
      } else if (error.code === "auth/quota-exceeded") {
        errorMessage = "SMS quota exceeded. Please try again later.";
      } else if (error.code === "auth/app-not-authorized") {
        errorMessage =
          "App not authorized for SMS verification. Please contact support.";
      } else if (error.code === "auth/captcha-check-failed") {
        errorMessage = "Captcha verification failed. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (!confirmation) {
      Alert.alert(
        "Error",
        "No confirmation available. Please request OTP again."
      );
      return;
    }

    if (!form.otp || form.otp.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      // Verify the OTP using React Native Firebase
      const userCredential = await confirmation?.confirm(form.otp);
      if (!userCredential) {
        throw new Error("Failed to verify OTP");
      }
      const user = userCredential.user;
      console.log("User signed in successfully:", user);

      // Navigate to home screen
      router.replace("/");

      Alert.alert("Success", "Phone number verified successfully!");
    } catch (error: any) {
      console.error("Error verifying OTP:", error);

      let errorMessage = "Invalid OTP. Please try again.";

      if (error.code === "auth/invalid-verification-code") {
        errorMessage = "Invalid verification code";
      } else if (error.code === "auth/code-expired") {
        errorMessage =
          "Verification code has expired. Please request a new one.";
      } else if (error.code === "auth/session-expired") {
        errorMessage = "Session expired. Please request a new OTP.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) {
      Alert.alert(
        "Please wait",
        `You can resend OTP in ${resendTimer} seconds`
      );
      return;
    }

    // Reset OTP visibility and resend
    setOtpVisible(false);
    setConfirmation(null);
    setForm((prev) => ({ ...prev, otp: "" }));

    // Resend OTP by calling handleSubmit again
    await handleSubmit();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <ImageBackground
          source={require("../../assets/images/loginBg.png")}
          resizeMode="cover"
          style={styles.backgroundImage}
        >
          <View style={styles.formContainer}>
            <Text style={styles.title}>Login with Number</Text>

            {/* Phone Input */}
            <PhoneInputWithPicker
              onChangeText={(text: string) => handleChange("phoneNumber", text)}
              onChangeFormattedText={handleFormattedChange}
              placeholder="7991162753"
              label="Phone Number*"
              maxLength={10}
              defaultCountryCode="IN"
              error={errors.phone}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-500 py-3 rounded-lg"
            >
              <Text style={styles.submitButtonText}>
                {loading ? "Sending..." : "Get OTP"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.otherSignUpText}>Other Sign In Options</Text>
            <TouchableOpacity
              onPress={handleGoogleLogin}
              style={styles.googleButton}
            >
              <Image
                source={require("@/assets/images/google.png")}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </TouchableOpacity>

            {otpVisible && (
              <View style={styles.otpContainer}>
                <Text style={styles.otpText}>
                  Enter OTP sent to{" "}
                  {form.phoneData?.fullNumber || form.phoneNumber}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={form.otp}
                  onChangeText={(text) => setForm({ ...form, otp: text })}
                />
                <TouchableOpacity
                  style={[styles.button, loading && styles.disabledButton]}
                  onPress={handleOtpVerify}
                  disabled={loading || form.otp.length !== 6}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify OTP</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                >
                  <Text
                    style={[
                      styles.resendText,
                      (resendTimer > 0 || loading) && styles.disabledText,
                    ]}
                  >
                    {resendTimer > 0
                      ? `Resend OTP in ${resendTimer}s`
                      : "Resend OTP"}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  otpContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 3,
  },
  otpText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2E674D",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  resendText: {
    color: "#2E674D",
    textAlign: "center",
    textDecorationLine: "underline",
  },
  disabledText: {
    color: "#ccc",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  backgroundImage: {
    flex: 1,
  },
  formContainer: {
    marginTop: Dimensions.get("window").height * 0.3,
    paddingHorizontal: "5%",
  },
  title: {
    fontSize: 24,
    color: "black",
    fontWeight: "bold",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: "black",
    marginBottom: 5,
    fontWeight: "500",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 18,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
    color: "black",
  },
  inputError: {
    borderColor: "#ff4444",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: "#2E674D",
    borderRadius: 20,
    paddingVertical: 15,
    marginTop: 15,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  otherSignUpText: {
    marginTop: "8%",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  googleButton: {
    marginTop: "5%",
    alignItems: "center",
    justifyContent: "space-evenly",
    width: "50%",
    padding: "2%",
    borderRadius: 100,
    alignSelf: "center",
    flexDirection: "row",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    backgroundColor: "white",
  },
  googleIcon: {
    width: 35,
    height: 35,
    padding: "2%",
  },
  googleButtonText: {
    color: "black",
  },
});
