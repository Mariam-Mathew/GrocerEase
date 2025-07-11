import { Dimensions, StyleSheet } from "react-native";

const RegisterStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  disabledButton: {
    opacity: 0.7,
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

export default RegisterStyles;
