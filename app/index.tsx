import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View } from "react-native";

// Keep the splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const [appIsReady, setAppIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function prepare() {
      try {
        // Simulate loading, or load fonts/assets
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    async function hideSplashAndNavigate() {
      if (appIsReady) {
        await SplashScreen.hideAsync();
        router.replace("/onboarding"); // Navigate to onboarding
      }
    }

    hideSplashAndNavigate();
  }, [appIsReady]);

  return <View style={{ flex: 1 }} />;
}
