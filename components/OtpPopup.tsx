import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';

type TextInputRef = TextInput | null;

const OTP_LENGTH = 6; // Firebase OTP is typically 6 digits

interface OtpPopupProps {
  visible: boolean;
  onClose: () => void;
  onVerified: (otp: string) => Promise<void>;
  onResend?: () => void;
  resendTimer?: number;
  loading?: boolean;
}

const OtpPopup: React.FC<OtpPopupProps> = ({
  visible,
  onClose,
  onVerified,
  onResend,
  resendTimer = 0,
  loading = false,
}) => {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [verificationError, setVerificationError] = useState('');
  const inputs = useRef<TextInputRef[]>(Array(OTP_LENGTH).fill(null));
  
  // Initialize refs
  useEffect(() => {
    if (visible) {
      setOtp(Array(OTP_LENGTH).fill(''));
      setVerificationError('');
      const timer = setTimeout(() => {
        if (inputs.current[0]) {
          inputs.current[0]?.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);



  const handleChange = (text: string, index: number) => {
    // Handle pasted OTP
    if (text.length > 1) {
      const chars = text.split('').slice(0, OTP_LENGTH);
      const newOtp = [...otp];
      chars.forEach((char, i) => {
        if (i + index < OTP_LENGTH) {
          newOtp[i + index] = char;
        }
      });
      setOtp(newOtp);
      
      // Focus the last input or verify if complete
      const nextIndex = Math.min(index + text.length, OTP_LENGTH - 1);
      inputs.current[nextIndex]?.focus();
      
      // Auto-verify if OTP is complete
      if (newOtp.every(digit => digit !== '')) {
        handleVerify(newOtp.join(''));
      }
      return;
    }
    
    // Handle single digit input
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    
    // Clear any previous errors
    if (verificationError) {
      setVerificationError('');
    }
    
    // Auto-focus next input or verify if complete
    if (text && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    } else if (index === OTP_LENGTH - 1 && text) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode: string) => {
    if (otpCode.length === OTP_LENGTH) {
      try {
        await onVerified(otpCode);
        // onClose will be called after successful verification
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Invalid code. Please try again.';
        setVerificationError(errorMessage);
        // Clear OTP on error
        setOtp(Array(OTP_LENGTH).fill(''));
        inputs.current[0]?.focus();
      }
    }
  };
  
  const handleResend = () => {
    if (onResend && resendTimer === 0) {
      onResend();
      // Reset OTP and focus first input
      setOtp(Array(OTP_LENGTH).fill(''));
      setVerificationError('');
      inputs.current[0]?.focus();
    }
  };

  return (
    <Modal 
      transparent 
      visible={visible} 
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={otpStyles.overlay}>
        <View style={otpStyles.popup}>
          <Text style={otpStyles.title}>Verify Phone Number</Text>
          <Text style={otpStyles.subtitle}>
            Enter the 6-digit code sent to your phone
          </Text>
          
          <View style={otpStyles.otpContainer}>
            {otp.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={el => {
                  if (el) {
                    inputs.current[idx] = el;
                  }
                }}
                style={[
                  otpStyles.otpBox,
                  verificationError && otpStyles.otpBoxError
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleChange(text, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                autoFocus={idx === 0 && !verificationError}
                returnKeyType={idx === OTP_LENGTH - 1 ? "done" : "next"}
                textAlign="center"
                placeholder="•"
                placeholderTextColor="#ccc"
                editable={!loading}
                selectTextOnFocus={false}
              />
            ))}
          </View>
          
          {verificationError ? (
            <Text style={otpStyles.errorText}>{verificationError}</Text>
          ) : null}
          
          <View style={otpStyles.resendContainer}>
            <Text style={otpStyles.resendText}>
              Didn&apos;t receive the code? 
            </Text>
            <TouchableOpacity 
              onPress={handleResend} 
              disabled={resendTimer > 0 || loading}
            >
              <Text 
                style={[
                  otpStyles.resendButton,
                  (resendTimer > 0 || loading) && otpStyles.resendButtonDisabled
                ]}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={otpStyles.buttonContainer}>
            <TouchableOpacity
              style={otpStyles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={otpStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                otpStyles.verifyButton,
                (otp.join("").length !== OTP_LENGTH || loading) && otpStyles.verifyButtonDisabled,
              ]}
              onPress={() => handleVerify(otp.join(""))}
              disabled={otp.join("").length !== OTP_LENGTH || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={otpStyles.verifyText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const otpStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  popup: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#2E674D",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    width: "100%",
    paddingHorizontal: 10,
  },
  otpBox: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    fontSize: 22,
    color: "#2E674D",
    backgroundColor: "#fff",
    textAlign: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  otpBoxError: {
    borderColor: "#FF3B30",
    backgroundColor: "#FFF5F5",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: -10,
    marginBottom: 10,
    textAlign: "center",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: "#666",
  },
  resendButton: {
    fontSize: 14,
    color: "#2E674D",
    fontWeight: "600",
  },
  resendButtonDisabled: {
    color: "#999",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 16,
  },
  verifyButton: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#2E674D",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  verifyButtonDisabled: {
    backgroundColor: "#A0C3B9",
  },
  verifyText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default OtpPopup;
