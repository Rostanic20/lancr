import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function initNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("timer", {
      name: "Timer",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
      vibrationPattern: [],
    });
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  await Notifications.requestPermissionsAsync();
}

export async function showTimerNotification(projectName: string) {
  await Notifications.scheduleNotificationAsync({
    identifier: "active-timer",
    content: {
      title: "Timer running",
      body: projectName,
      sticky: true,
      sound: false,
      ...(Platform.OS === "android" && { channelId: "timer" }),
    },
    trigger: null,
  });
}

export async function dismissTimerNotification() {
  await Notifications.dismissNotificationAsync("active-timer");
}
