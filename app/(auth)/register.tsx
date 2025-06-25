import PhoneInputWithPicker from "@/components/InputPhoneText";
import OtpPopup from "@/components/OtpPopup";
import GeneralStyles from "@/styles/GeneralStyles";
import { baseUrl } from "@/utils/config";
import axios from "axios";
import * as Google from "expo-auth-session/providers/google";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
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
      fetchUserInfo(authentication.accessToken);
      console.log("response info:", response);
    }
  }, [response]);

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

  const handleFormattedChange = (data: PhoneData) => {
    setForm((prev) => ({ ...prev, phoneData: data }));
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

  const handleSubmit = () => {
    if (validateForm()) {
      setOtpVisible(true);
      //   Alert.alert(
      //     "Registration",
      //     `Name: ${form.name}\nPhone: ${form.phoneData?.phoneNumber}`,
      //     [
      //       {
      //         text: "OK",
      //         onPress: () => {
      //           // API call here
      //           // console.log("Registration data:", { ...form });
      //         },
      //       },
      //     ]
      //   );
    }
  };
  const handleOtpVerified = async (otp: string) => {
    // In a real app, you would verify the OTP here
    // For now, just navigate to login
    router.push("/login");
    return Promise.resolve();
  };
  return (
    <SafeAreaView style={GeneralStyles.mainContainer}>
      <View style={styles.container}>
        <ImageBackground
          source={require("../../assets/images/loginBg.png")}
          resizeMode="cover"
          style={styles.backgroundImage}
        >
          <View style={styles.formContainer}>
            <Text style={styles.title}>Sign Up</Text>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name*</Text>
              <TextInput
                style={[
                  styles.textInput,
                  errors.name ? styles.inputError : null,
                ]}
                value={form.name}
                onChangeText={(text) => handleChange("name", text)}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                autoCapitalize="words"
                autoCorrect={false}
              />
              {!!errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

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
              style={styles.submitButton}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>Get OTP</Text>
            </TouchableOpacity>

            <Text style={styles.otherSignUpText}>Other Sign Up Options</Text>
            <TouchableOpacity
              onPress={handleGoogleSignUp}
              activeOpacity={0.8}
              style={styles.googleButton}
            >
              <Image
                source={require("../../assets/images/google.png")}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>Google Sign Up</Text>
            </TouchableOpacity>
            <OtpPopup
              visible={otpVisible}
              onClose={() => setOtpVisible(false)}
              onVerified={handleOtpVerified}
            />
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
