import { NotificationPush } from "@/lib/NotificationPush";
import { baseUrl } from "@/utils/config";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

/// Notification registration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

TaskManager.defineTask<null>(
  BACKGROUND_NOTIFICATION_TASK,
  async ({ data, error, executionInfo }) => {
    console.log("✅ Received a notification in the background!", {
      data,
      error,
      executionInfo,
    });
    // Do something with the notification data
  }
);

Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

export default function HomeScreen() {
  // Create refs for notification listeners
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    NotificationPush().then((token: any) => {
      setExpoPushToken(token);
    });
  }, []);
  console.log("expoPushToken", expoPushToken);

  // Notification event manager
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      NotificationPush().then(
        (token: any) => setExpoPushToken(token),
        (error: any) => console.log(error)
      );
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification: any) => {
          console.log("🔔 Notification Received: ", notification);
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const notificationData = response.notification.request.content.data;
          console.log("🔔 Notification clicked:", notificationData);

          // Check if the app is already on the notification screen
          // const currentRouteName =
          //   navigation.getState()?.routes[navigation.getState()?.index ?? 0]
          //     ?.name;

          // if (currentRouteName !== "Notification") {
          //   // Navigate to notification screen on notification click
          //   // navigation.navigate("Notification");
          // }
        });
      return () => {
        isMounted = false;
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(
            notificationListener.current
          );
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(
            responseListener.current
          );
        }
      };
    }, [])
  );

  useEffect(() => {
    let isMounted = true;
    if (expoPushToken !== null) {
      setToken();
    }
    return () => {
      isMounted = false;
    };
  }, [expoPushToken]);

  // api call for pushtoken
  const setToken = async () => {
    try {
      const response = await axios.post(`${baseUrl}/auth/test/notification`, {
        fcm_token: expoPushToken,
      });
      console.log("response", response);
    } catch (error) {
      console.log("fcm error", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to GrocerEase</Text>
      <Text style={styles.subtitle}>Your grocery shopping made easy</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
});
