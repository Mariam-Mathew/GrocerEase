import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CountryPicker, {
  Country,
  CountryCode,
} from "react-native-country-picker-modal";

type PhoneInputWithPickerProps = {
  value?: string;
  onChangeText?: (fullNumber: string) => void;
  onChangeFormattedText?: (details: {
    countryCode: CountryCode;
    callingCode: string;
    phoneNumber: string;
    fullNumber: string;
    isValid: boolean;
  }) => void;
  placeholder?: string;
  label?: string;
  maxLength?: number;
  defaultCountryCode?: CountryCode;
  style?: any;
  inputStyle?: any;
  labelStyle?: any;
  containerStyle?: any;
  error?: string | null;
  disabled?: boolean;
};

const PhoneInputWithPicker: React.FC<PhoneInputWithPickerProps> = ({
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
}) => {
  const [countryCode, setCountryCode] =
    useState<CountryCode>(defaultCountryCode);
  const [callingCode, setCallingCode] = useState<string>("91"); // default India
  const [phoneNumber, setPhoneNumber] = useState(value);
  const [showPicker, setShowPicker] = useState(false);

  const onSelect = (country: Country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0] || ""); // Take first calling code

    // Trigger parent's callbacks with updated value
    const fullNumber = `+${country.callingCode[0] || ""}${phoneNumber}`;

    if (onChangeText) {
      onChangeText(fullNumber);
    }
    if (onChangeFormattedText) {
      onChangeFormattedText({
        countryCode: country.cca2,
        callingCode: country.callingCode[0] || "",
        phoneNumber,
        fullNumber,
        isValid: phoneNumber.length >= 10,
      });
    }
  };

  const handlePhoneChange = (text: string) => {
    // Cleanup input to digits only and limit characters
    const cleanedText = text.replace(/[^0-9]/g, "").slice(0, maxLength);
    setPhoneNumber(cleanedText);

    const fullNumber = `+${callingCode}${cleanedText}`;

    if (onChangeText) {
      onChangeText(fullNumber);
    }
    if (onChangeFormattedText) {
      onChangeFormattedText({
        countryCode,
        callingCode,
        phoneNumber: cleanedText,
        fullNumber,
        isValid: cleanedText.length >= 10,
      });
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {!!label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          style,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
      >
        <TouchableOpacity
          onPress={() => !disabled && setShowPicker(true)}
          style={styles.countrySelector}
          disabled={disabled}
        >
          <CountryPicker
            {...{
              countryCode,
              withFlag: true,
              withCallingCode: true,
              withFilter: true,
              withEmoji: true,
              onSelect,
              visible: showPicker,
              onClose: () => setShowPicker(false),
            }}
            containerButtonStyle={{
              justifyContent: "center",
              alignItems: "center",
            }}
            translation="common"
          />
          <Text style={styles.callingCode}>+{callingCode}</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <TextInput
          value={phoneNumber}
          onChangeText={handlePhoneChange}
          placeholder={placeholder}
          keyboardType="phone-pad"
          maxLength={maxLength}
          editable={!disabled}
          style={[
            styles.phoneInput,
            inputStyle,
            disabled && styles.disabledInput,
          ]}
          placeholderTextColor="#999"
        />

        <Text
          style={[
            styles.characterCount,
            {
              color:
                phoneNumber.length === maxLength
                  ? "#28a745"
                  : phoneNumber.length > 0
                  ? "#ffc107"
                  : "#6c757d",
            },
          ]}
        >
          {`${phoneNumber.length}/${maxLength}`}
        </Text>
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
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
  callingCode: {
    fontSize: 16,
    marginLeft: 6,
    color: "#333",
    fontWeight: "500",
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
