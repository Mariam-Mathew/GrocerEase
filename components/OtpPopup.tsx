import React, { useRef, useState } from "react";
import {
  Image,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const OTP_LENGTH = 4;

const OtpPopup = ({ visible, onClose, onVerified }: any) => {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [verified, setVerified] = useState(false);
  const inputs: any = useRef([]);

  React.useEffect(() => {
    if (visible) {
      setOtp(Array(OTP_LENGTH).fill(""));
      setVerified(false);
      setTimeout(() => inputs.current[0]?.focus(), 200);
    }
  }, [visible]);

  const handleChange = (text: any, index: any) => {
    if (text.length > 1) {
      // If user pastes the OTP
      const chars = text.split("").slice(0, OTP_LENGTH);
      setOtp(chars);
      inputs.current[chars.length - 1]?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: any) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    if (otp.join("").length === OTP_LENGTH) {
      setVerified(true);
      Keyboard.dismiss();
      setTimeout(() => {
        onVerified();
        onClose();
      }, 2000);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={otpStyles.overlay}>
        <View style={otpStyles.popup}>
          <Text style={otpStyles.title}>Enter OTP</Text>
          <View style={otpStyles.otpContainer}>
            {otp.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(ref) => (inputs.current[idx] = ref)}
                style={otpStyles.otpBox}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleChange(text, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                autoFocus={idx === 0}
                returnKeyType="next"
                textAlign="center"
                placeholder="•"
                placeholderTextColor="#ccc"
              />
            ))}
          </View>
          <TouchableOpacity
            style={[
              otpStyles.verifyButton,
              verified && otpStyles.verifiedButton,
              otp.join("").length !== OTP_LENGTH && { opacity: 0.5 },
            ]}
            onPress={handleVerify}
            disabled={verified || otp.join("").length !== OTP_LENGTH}
          >
            {verified ? (
              <Image
                source={require("../assets/images/check.png")}
                style={{ width: 24, height: 24 }}
              />
            ) : (
              <Text style={otpStyles.verifyText}>Verify</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const otpStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  otpBox: {
    width: 40,
    height: 48,
    borderWidth: 1,
    borderColor: "#2E674D",
    borderRadius: 8,
    marginHorizontal: 6,
    fontSize: 22,
    color: "#2E674D",
    backgroundColor: "#f8f9fa",
  },
  verifyButton: {
    backgroundColor: "#2E674D",
    paddingVertical: 10,
    width: "80%",
    borderRadius: 20,
    alignItems: "center",
  },
  verifiedButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#2E674D",
  },
  verifyText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default OtpPopup;
