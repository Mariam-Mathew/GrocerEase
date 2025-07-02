import useAuth from "@/hooks/useAuth";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View } from "react-native";

// Keep the splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const [appIsReady, setAppIsReady] = useState(false);
  const router = useRouter();
  const { isInitialized, isAuthenticated } = useAuth();

  useEffect(() => {
    async function prepare() {
      try {
        // Wait for auth to initialize
        console.log("Index: Waiting for auth initialization...");

        // Add any other initialization logic here (fonts, assets, etc.)
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Minimum splash time
      } catch (e) {
        console.warn("Index: Preparation error:", e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    async function handleNavigation() {
      // Wait for both app preparation and auth initialization
      if (appIsReady && isInitialized) {
        console.log("Index: App ready and auth initialized", {
          isAuthenticated,
        });

        try {
          await SplashScreen.hideAsync();

          // Navigate based on auth state
          if (isAuthenticated) {
            console.log("Index: User authenticated, navigating to home");
            router.replace("/(tabs)");
          } else {
            console.log(
              "Index: User not authenticated, navigating to onboarding"
            );
            router.replace("/onboarding");
          }
        } catch (error) {
          console.error("Index: Navigation error:", error);
          // Fallback navigation
          router.replace("/onboarding");
        }
      }
    }

    handleNavigation();
  }, [appIsReady, isInitialized, isAuthenticated, router]);

  return <View style={{ flex: 1, backgroundColor: "#fff" }} />;
}
