import PhoneInputWithPicker from "@/components/InputPhoneText";
import OtpPopup from "@/components/OtpPopup";
import GeneralStyles from "@/styles/GeneralStyles";
import RegisterStyles from "@/styles/RegisterStyles";
import { baseUrl } from "@/utils/config";
import useStore from "@/zustand/store";
import auth from "@react-native-firebase/auth";
import axios from "axios";
import * as Google from "expo-auth-session/providers/google";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
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

const INITIAL_FORM = {
  name: "",
  phoneNumber: "",
  phoneData: null as PhoneData | null,
};

const INITIAL_ERRORS = {
  name: "",
  phone: "",
};

export default function Register() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [otpVisible, setOtpVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [confirmation, setConfirmation] = useState<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId:
      "723221915171-galo0rgnakv8a4fk2i0j836j0aim40pc.apps.googleusercontent.com",
    androidClientId:
      "723221915171-9de4ta6tbvjphia4s5mnl8n622gpa30a.apps.googleusercontent.com",
    webClientId:
      "723221915171-9ggjhvc6stlt7bd80l3ijbg057rh85ak.apps.googleusercontent.com",
  });

  const { login } = useStore();

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication }: any = response;
      fetchUserInfo(authentication.accessToken);
      console.log("response info:", response);
    }
  }, [response]);

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

  const fetchUserInfo = async (token: any) => {
    console.log("Token:", token);
    const res = await fetch("https://www.googleapis.com/userinfo/v2/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userInfo = await res.json();
    console.log("User Info:", userInfo);
    // Call this before your signup
    googleSignUp(userInfo);
  };

  const handleGoogleSignUp = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  const googleSignUp = async (userInfo: any) => {
    const value = {
      name: userInfo.given_name || userInfo.name,
      email: userInfo.email,
    };

    console.log("=== Starting Google Signup ===");
    console.log("Base URL:", baseUrl);
    console.log("Request URL:", `${baseUrl}auth/google-signup`);
    console.log("Request Data:", JSON.stringify(value, null, 2));

    try {
      const response = await axios.post(`${baseUrl}auth/google-signup`, value, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 10000,
        validateStatus: (status) => status < 500, // Reject only if status is 500 or higher
      });

      console.log("=== Response ===");
      console.log("Status:", response.status);
      console.log("Headers:", JSON.stringify(response.headers, null, 2));
      console.log("Data:", response.data);
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

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({
      ...prev,
      [field === "name" ? "name" : "phone"]: "",
    }));
  };

  const validateForm = () => {
    let valid = true;
    let newErrors = { ...INITIAL_ERRORS };

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
      valid = false;
    }

    if (!form.phoneData || !form.phoneData.isValid) {
      newErrors.phone = "Please enter a valid phone number";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

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

  const startResendTimer = () => {
    setResendTimer(30); // 30 seconds
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
      startResendTimer();

      // Focus OTP input after a short delay
      setTimeout(() => {
        // You'll need to add a ref to your OTP input in the OtpPopup component
        // and pass it here to focus
      }, 500);

      Alert.alert("Success", "OTP sent to your phone number");
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleOtpVerified = async (otp: string) => {
    if (!confirmation) {
      Alert.alert(
        "Error",
        "No confirmation available. Please request OTP again."
      );
      return Promise.reject("No confirmation available");
    }

    setLoading(true);

    try {
      const userCredential = await confirmation.confirm(otp);

      if (!userCredential?.user) {
        throw new Error("Failed to verify OTP");
      }

      const user: any = userCredential.user;
      console.log("User verified successfully:", user.uid);

      // Here you would typically send the verified phone number to your backend
      // along with the user's name to complete registration
      const registrationData = {
        name: form.name,
        phoneNumber:
          form.phoneData?.fullNumber || `+91${form.phoneData?.phoneNumber}`,
        uid: user.uid,
      };

      // Call your registration API here
      // const response = await axios.post(`${baseUrl}auth/register`, registrationData);
      // const { accessToken, refreshToken } = response.data;
      // Remove the unused variable warning by using the variable
      console.log("Registration data:", registrationData);

      // For now, just show success and navigate to login
      Alert.alert("Success", "Registration successful! Please login.");
      router.replace("/login");

      return Promise.resolve();
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      let errorMessage = "Failed to verify OTP. Please try again.";

      if (error.code === "auth/invalid-verification-code") {
        errorMessage = "Invalid verification code. Please check and try again.";
      } else if (error.code === "auth/code-expired") {
        errorMessage =
          "Verification code has expired. Please request a new one.";
      }

      Alert.alert("Error", errorMessage);
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={GeneralStyles.mainContainer}>
      <View style={RegisterStyles.container}>
        <ImageBackground
          source={require("../../assets/images/loginBg.png")}
          resizeMode="cover"
          style={RegisterStyles.backgroundImage}
        >
          <View style={RegisterStyles.formContainer}>
            <Text style={RegisterStyles.title}>Sign Up</Text>

            {/* Name Input */}
            <View style={RegisterStyles.inputContainer}>
              <Text style={RegisterStyles.label}>Name*</Text>
              <TextInput
                style={[
                  RegisterStyles.textInput,
                  errors.name ? RegisterStyles.inputError : null,
                ]}
                value={form.name}
                onChangeText={(text) => handleChange("name", text)}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                autoCapitalize="words"
                autoCorrect={false}
              />
              {!!errors.name && (
                <Text style={RegisterStyles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Phone Input */}
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
              label="Phone Number*"
              placeholder="7991162753"
              error={errors.phone}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                RegisterStyles.submitButton,
                loading && RegisterStyles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={RegisterStyles.submitButtonText}>
                  {otpVisible ? "Resend OTP" : "Get OTP"}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={RegisterStyles.otherSignUpText}>
              Other Sign Up Options
            </Text>
            <TouchableOpacity
              onPress={handleGoogleSignUp}
              activeOpacity={0.8}
              style={RegisterStyles.googleButton}
            >
              <Image
                source={require("../../assets/images/google.png")}
                style={RegisterStyles.googleIcon}
              />
              <Text style={RegisterStyles.googleButtonText}>
                Google Sign Up
              </Text>
            </TouchableOpacity>
            <View>
              <Text style={RegisterStyles.otherSignUpText}>
                Already have an account?{" "}
                <Text
                  onPress={() => router.replace("/login")}
                  style={[
                    RegisterStyles.otherSignUpText,
                    { color: "#2E674D", backgroundColor: "transparent" },
                  ]}
                >
                  Login
                </Text>
              </Text>
            </View>
            <OtpPopup
              visible={otpVisible}
              onClose={() => setOtpVisible(false)}
              onVerified={handleOtpVerified}
              resendTimer={resendTimer}
              onResend={handleSubmit}
              loading={loading}
            />
          </View>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
}
