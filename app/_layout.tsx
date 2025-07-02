import AuthProvider from "@/components/AuthProvider";
import useAuth from "@/hooks/useAuth";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Text, View } from "react-native";

const PUBLIC_ROUTES = ["(auth)", "onboarding", "index"];

function NavigationController() {
  const segments = useSegments();
  const router = useRouter();
  const { isInitialized, isAuthenticated } = useAuth();
  const navigationTimeoutRef: any = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any pending navigation
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    if (!isInitialized) {
      console.log("NavigationController: Auth not initialized, waiting...");
      return;
    }

    const currentRoute: any = segments[0] || "index";
    const isPublicRoute = PUBLIC_ROUTES.includes(currentRoute);

    console.log("NavigationController: Navigation check", {
      currentRoute,
      isPublicRoute,
      isAuthenticated,
      segments: segments.join("/"),
    });

    // Handle navigation with a small delay to ensure state is settled
    navigationTimeoutRef.current = setTimeout(() => {
      try {
        if (isAuthenticated) {
          // User is authenticated
          if (isPublicRoute && currentRoute !== "index") {
            console.log(
              "NavigationController: Authenticated user in public route, redirecting to home"
            );
            router.replace("/(tabs)");
          }
        } else {
          // User is not authenticated
          if (!isPublicRoute) {
            console.log(
              "NavigationController: Unauthenticated user in protected route, redirecting to login"
            );
            router.replace("/(auth)/login");
          }
        }
      } catch (error) {
        console.error("NavigationController: Navigation error:", error);
      }
    }, 100);

    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [isInitialized, isAuthenticated, segments, router]);

  // Show loading only while initializing
  if (!isInitialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#2E674D" />
        <Text style={{ marginTop: 10, color: "#666" }}>Loading...</Text>
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NavigationController />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
