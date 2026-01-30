import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";

interface Props {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
}

export function EmptyState({ icon, title, subtitle }: Props) {
  const dark = useColorScheme() === "dark";
  const color = dark ? "#fff" : "#000";

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={color} style={{ opacity: 0.3 }} />
      <Text style={[styles.title, { color }]}>{title}</Text>
      <Text style={[styles.subtitle, { color }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    opacity: 0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    opacity: 0.35,
    textAlign: "center",
  },
});
