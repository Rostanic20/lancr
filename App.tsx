import "react-native-gesture-handler";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TimerProvider } from "./src/context/TimerContext";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { AppNavigator } from "./src/navigation";
import { initNotifications } from "./src/services/notificationService";

export default function App() {
  const dark = useColorScheme() === "dark";

  useEffect(() => {
    initNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: dark ? "#111" : "#fff" }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <TimerProvider>
            <AppNavigator />
          </TimerProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
