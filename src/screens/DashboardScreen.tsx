import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useColorScheme, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { getClients } from "../services/clientService";
import { getProjects } from "../services/projectService";
import { getEarnings, getMonthlyEarnings, getWeeklyEarnings } from "../services/invoiceService";
import { exportBackup, importBackup } from "../services/backupService";
import * as DocumentPicker from "expo-document-picker";
import { LoadingState } from "../components/LoadingState";
import { EarningsChart } from "../components/EarningsChart";
import { useTimer } from "../context/TimerContext";
import { formatTime } from "../utils/format";
import { colors } from "../utils/colors";

export function DashboardScreen() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const { activeTimer, elapsed, projectName } = useTimer();
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<"monthly" | "weekly">("monthly");
  const [monthlyData, setMonthlyData] = useState<{ label: string; amount: number }[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ label: string; amount: number }[]>([]);
  const [stats, setStats] = useState({
    clients: 0,
    activeProjects: 0,
    paid: 0,
    unpaid: 0,
  });

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  async function loadStats() {
    try {
      const clients = await getClients();
      const projects = await getProjects();
      const earnings = await getEarnings();
      setStats({
        clients: clients.length,
        activeProjects: projects.filter((p) => p.status === "active").length,
        paid: earnings.paid,
        unpaid: earnings.unpaid,
      });
      setMonthlyData(await getMonthlyEarnings());
      setWeeklyData(await getWeeklyEarnings());
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load dashboard data.");
    }
    setLoading(false);
  }

  const bg = dark ? colors.dark.bg : colors.light.bg;
  const text = dark ? colors.dark.text : colors.light.text;
  const card = dark ? colors.dark.card : colors.light.card;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.header, { color: text }]}>Lancr</Text>

        {activeTimer && (
          <View style={styles.timerBanner}>
            <View style={styles.timerDot} />
            <Text style={styles.timerText}>{projectName || "Timer running"} — {formatTime(elapsed)}</Text>
          </View>
        )}

        <View style={styles.grid}>
          <View style={[styles.card, { backgroundColor: card }]}>
            <Text style={[styles.cardValue, { color: text }]}>{stats.clients}</Text>
            <Text style={[styles.cardLabel, { color: text }]}>Clients</Text>
          </View>
          <View style={[styles.card, { backgroundColor: card }]}>
            <Text style={[styles.cardValue, { color: text }]}>{stats.activeProjects}</Text>
            <Text style={[styles.cardLabel, { color: text }]}>Active Projects</Text>
          </View>
          <View style={[styles.card, { backgroundColor: card }]}>
            <Text style={[styles.cardValue, { color: colors.green }]}>{stats.paid.toFixed(2)} EUR</Text>
            <Text style={[styles.cardLabel, { color: text }]}>Earned</Text>
          </View>
          <View style={[styles.card, { backgroundColor: card }]}>
            <Text style={[styles.cardValue, { color: colors.orange }]}>{stats.unpaid.toFixed(2)} EUR</Text>
            <Text style={[styles.cardLabel, { color: text }]}>Unpaid</Text>
          </View>
        </View>

        <View style={[styles.chartSection, { backgroundColor: card }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: text }]}>Earnings</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, chartMode === "monthly" && styles.toggleActive]}
                onPress={() => setChartMode("monthly")}
              >
                <Text style={[styles.toggleText, chartMode === "monthly" && styles.toggleTextActive]}>
                  Monthly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, chartMode === "weekly" && styles.toggleActive]}
                onPress={() => setChartMode("weekly")}
              >
                <Text style={[styles.toggleText, chartMode === "weekly" && styles.toggleTextActive]}>
                  Weekly
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <EarningsChart data={chartMode === "monthly" ? monthlyData : weeklyData} />
        </View>

        <TouchableOpacity
          style={[styles.backupBtn, { backgroundColor: card }]}
          onPress={async () => {
            try {
              await exportBackup();
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to export backup.");
            }
          }}
        >
          <Ionicons name="cloud-download-outline" size={20} color={text} style={{ marginRight: 10 }} />
          <Text style={[styles.backupText, { color: text }]}>Export Backup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.backupBtn, { backgroundColor: card, marginTop: 10 }]}
          onPress={async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({ type: "application/json" });
              if (result.canceled) return;
              Alert.alert(
                "Import Backup",
                "This will replace all current data. Continue?",
                [
                  { text: "Cancel" },
                  {
                    text: "Import",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await importBackup(result.assets[0].uri);
                        await loadStats();
                        Alert.alert("Success", "Backup imported successfully.");
                      } catch (e: any) {
                        Alert.alert("Error", e.message || "Failed to import backup.");
                      }
                    },
                  },
                ]
              );
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to open file picker.");
            }
          }}
        >
          <Ionicons name="cloud-upload-outline" size={20} color={text} style={{ marginRight: 10 }} />
          <Text style={[styles.backupText, { color: text }]}>Import Backup</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  card: {
    width: "47%",
    padding: 20,
    borderRadius: 12,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 14,
    opacity: 0.6,
  },
  chartSection: {
    borderRadius: 12,
    padding: 16,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    gap: 4,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: colors.button,
  },
  toggleText: {
    fontSize: 13,
    color: colors.muted,
  },
  toggleTextActive: {
    color: colors.white,
  },
  timerBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.red,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  timerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    marginRight: 10,
  },
  timerText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 15,
  },
  backupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  backupText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
