import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CountryPicker from "react-native-country-picker-modal";

// Enhanced PhoneInput Component
const PhoneInputWithPicker = ({
  value = "",
  onChangeText,
  onChangeFormattedText,
  placeholder = "Phone number",
  label = "Phone number*",
  maxLength = 10,
  defaultCountryCode = "IN",
  style,
  inputStyle,
  labelStyle,
  containerStyle,
  error,
  disabled = false,
}: any) => {
  const [countryCode, setCountryCode] = useState(defaultCountryCode);
  const [country, setCountry] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(value);
  const [showPicker, setShowPicker] = useState(false);
  const [callingCode, setCallingCode] = useState("91"); // Default for India

  const handlePhoneChange = (text: any) => {
    // Remove any non-numeric characters
    const cleanedText = text.replace(/[^0-9]/g, "");

    // Limit to maxLength
    const limitedText = cleanedText.slice(0, maxLength);

    setPhoneNumber(limitedText);

    // Call the parent's onChangeText with full phone number
    if (onChangeText) {
      onChangeText(`+${callingCode}${limitedText}`);
    }

    // Also provide formatted text if callback exists
    if (onChangeFormattedText) {
      onChangeFormattedText({
        countryCode: countryCode,
        callingCode: callingCode,
        phoneNumber: limitedText,
        fullNumber: `+${callingCode}${limitedText}`,
        isValid: limitedText.length >= 10, // Basic validation
      });
    }
  };

  const onSelectCountry = (selectedCountry: any) => {
    setCountry(selectedCountry);
    setCountryCode(selectedCountry.cca2);
    setCallingCode(selectedCountry.callingCode[0]);

    // Update parent with new country code
    if (onChangeText) {
      onChangeText(`+${selectedCountry.callingCode[0]}${phoneNumber}`);
    }

    if (onChangeFormattedText) {
      onChangeFormattedText({
        countryCode: selectedCountry.cca2,
        callingCode: selectedCountry.callingCode[0],
        phoneNumber: phoneNumber,
        fullNumber: `+${selectedCountry.callingCode[0]}${phoneNumber}`,
        isValid: phoneNumber.length >= 10,
      });
    }
  };

  const getCharacterCount = () => {
    return `${phoneNumber.length}/${maxLength}`;
  };

  const getCharacterCountColor = () => {
    if (phoneNumber.length === maxLength) return "#28a745"; // Green when complete
    if (phoneNumber.length > 0) return "#ffc107"; // Yellow when typing
    return "#6c757d"; // Gray when empty
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          style,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
      >
        {/* Country Code Selector */}
        <TouchableOpacity
          style={styles.countrySelector}
          onPress={() => !disabled && setShowPicker(true)}
          disabled={disabled}
        >
          <CountryPicker
            countryCode={countryCode}
            withFilter
            withFlag
            withCountryNameButton={false}
            withCallingCodeButton
            onSelect={onSelectCountry}
            visible={showPicker}
            onClose={() => setShowPicker(false)}
            containerButtonStyle={styles.countryPickerButton}
            renderFlagButton={() => (
              <View style={styles.flagContainer}>
                <CountryPicker
                  countryCode={countryCode}
                  withFlag
                  withEmoji
                  withCountryNameButton={false}
                  withCallingCodeButton={false}
                />
                <Text style={styles.callingCode}>+{callingCode}</Text>
              </View>
            )}
          />
          {!disabled && <Text style={styles.dropdownArrow}>▼</Text>}
        </TouchableOpacity>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Phone Number Input */}
        <TextInput
          style={[
            styles.phoneInput,
            inputStyle,
            disabled && styles.disabledInput,
          ]}
          value={phoneNumber}
          onChangeText={handlePhoneChange}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          maxLength={maxLength}
          editable={!disabled}
        />

        {/* Character Count */}
        <Text
          style={[styles.characterCount, { color: getCharacterCountColor() }]}
        >
          {getCharacterCount()}
        </Text>
      </View>

      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  // PhoneInput Styles
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  inputError: {
    borderColor: "#dc3545",
    backgroundColor: "#fff5f5",
  },
  inputDisabled: {
    backgroundColor: "#f1f3f4",
    opacity: 0.6,
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },
  countryPickerButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  flagContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  callingCode: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 6,
  },
  dropdownArrow: {
    fontSize: 10,
    color: "#666",
    marginLeft: 6,
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: "#ddd",
    marginHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 0,
  },
  disabledInput: {
    color: "#6c757d",
  },
  characterCount: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default PhoneInputWithPicker;
