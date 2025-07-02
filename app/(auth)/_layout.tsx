import { Stack } from "expo-router";
import { View } from "react-native";

export default function AuthLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: 'white' },
        }}
      >
        <Stack.Screen 
          name="login" 
          options={{
            title: 'Login',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="register" 
          options={{
            title: 'Register',
            headerShown: false,
          }}
        />
        {/* Uncomment and configure these as needed
        <Stack.Screen 
          name="otpLogin" 
          options={{
            title: 'OTP Login',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="forgotPassword" 
          options={{
            title: 'Forgot Password',
            headerShown: false,
          }}
        />
        */}
      </Stack>
    </View>
  );
}
