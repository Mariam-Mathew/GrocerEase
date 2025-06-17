import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

// Simple Text Input Component - Matching Phone Input Design
const SimpleTextInput = ({
  value,
  onChangeText,
  placeholder = "Enter text...",
  label,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  keyboardType = "default",
  autoCapitalize = "sentences",
  secureTextEntry = false,
  editable = true,
  style,
  inputStyle,
  labelStyle,
  containerStyle,
  error,
  helperText,
  showCharacterCount = false,
  required = false,
}: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value || "");

  const handleTextChange = (text: any) => {
    setInternalValue(text);
    if (onChangeText) {
      onChangeText(text);
    }
  };

  const getCharacterCount = () => {
    const currentLength = internalValue.length;
    return maxLength ? `${currentLength}/${maxLength}` : `${currentLength}`;
  };

  const getCharacterCountColor = () => {
    if (!maxLength) return "#28a745";
    if (internalValue.length === maxLength) return "#28a745"; // Green when complete
    if (internalValue.length > 0) return "#ffc107"; // Yellow when typing
    return "#6c757d"; // Gray when empty
  };

  const getBorderColor = () => {
    if (error) return "#dc3545";
    if (isFocused) return "#007AFF";
    return "#e9ecef";
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label - Same style as phone component */}
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      {/* Input Container - Same style as phone component */}
      <View
        style={[
          styles.inputContainer,
          style,
          { borderColor: getBorderColor() },
          isFocused && styles.inputFocused,
          error && styles.inputError,
          !editable && styles.inputDisabled,
        ]}
      >
        <TextInput
          style={[
            styles.textInput,
            inputStyle,
            multiline && styles.multilineInput,
            !editable && styles.disabledText,
          ]}
          value={internalValue}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {/* Character Count - Same position as phone component */}
        {showCharacterCount && (
          <Text
            style={[styles.characterCount, { color: getCharacterCountColor() }]}
          >
            {getCharacterCount()}
          </Text>
        )}
      </View>

      {/* Error/Helper Text - Below input like phone component */}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!error && helperText && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
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
  required: {
    color: "#dc3545",
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
  inputFocused: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  inputError: {
    borderColor: "#dc3545",
    backgroundColor: "#fff5f5",
  },
  inputDisabled: {
    backgroundColor: "#f1f3f4",
    opacity: 0.6,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 0,
    textAlignVertical: "top",
  },
  multilineInput: {
    minHeight: 60,
    paddingTop: 4,
  },
  disabledText: {
    color: "#6c757d",
  },
  characterCount: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
    color: "#28a745",
  },
  errorText: {
    color: "#dc3545",
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    color: "#6c757d",
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },

  // Mock Phone Input Styles (for demonstration)
  mockCountrySelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },
  mockFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  mockDialCode: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginRight: 6,
  },
  mockDropdownArrow: {
    fontSize: 10,
    color: "#666",
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: "#ddd",
    marginHorizontal: 12,
  },
});

export default SimpleTextInput;
