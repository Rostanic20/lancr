import { Component, ReactNode } from "react";
import { View, Text, TouchableOpacity, Appearance } from "react-native";
import { colors } from "../utils/colors";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      const dark = Appearance.getColorScheme() === "dark";
      const bg = dark ? colors.dark.bg : colors.light.bg;
      const text = dark ? colors.dark.text : colors.light.text;

      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40, backgroundColor: bg }}>
          <Text style={{ fontSize: 22, fontWeight: "bold", color: text, marginBottom: 8 }}>Something went wrong</Text>
          <Text style={{ fontSize: 15, color: colors.muted, textAlign: "center", marginBottom: 24 }}>The app ran into an unexpected error.</Text>
          <TouchableOpacity
            style={{ backgroundColor: colors.button, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 }}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: "bold" }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
