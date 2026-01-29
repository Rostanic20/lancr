import { useColorScheme } from "react-native";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { WorkStackParams, MoneyStackParams } from "../types/navigation";
import { DashboardScreen } from "../screens/DashboardScreen";
import { ClientsScreen } from "../screens/ClientsScreen";
import { ProjectsScreen } from "../screens/ProjectsScreen";
import { TimeHistoryScreen } from "../screens/TimeHistoryScreen";
import { MoneyScreen } from "../screens/MoneyScreen";
import { InvoiceDetailScreen } from "../screens/InvoiceDetailScreen";

const Tab = createBottomTabNavigator();
const WorkStack = createNativeStackNavigator<WorkStackParams>();
const MoneyStack = createNativeStackNavigator<MoneyStackParams>();

function WorkNavigator() {
  return (
    <WorkStack.Navigator screenOptions={{ headerShown: false }}>
      <WorkStack.Screen name="Clients" component={ClientsScreen} />
      <WorkStack.Screen name="Projects" component={ProjectsScreen} />
      <WorkStack.Screen name="TimeHistory" component={TimeHistoryScreen} />
    </WorkStack.Navigator>
  );
}

function MoneyNavigator() {
  return (
    <MoneyStack.Navigator screenOptions={{ headerShown: false }}>
      <MoneyStack.Screen name="MoneyList" component={MoneyScreen} />
      <MoneyStack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
    </MoneyStack.Navigator>
  );
}

export function AppNavigator() {
  const scheme = useColorScheme();

  return (
    <NavigationContainer theme={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            borderTopWidth: 0,
            elevation: 0,
          },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarLabel: "Dashboard",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Work"
          component={WorkNavigator}
          options={{
            tabBarLabel: "Work",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="briefcase-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Money"
          component={MoneyNavigator}
          options={{
            tabBarLabel: "Money",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cash-outline" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
