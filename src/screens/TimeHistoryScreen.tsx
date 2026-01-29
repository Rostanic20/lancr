import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getTimeEntries } from "../services/timeService";
import { TimeEntry } from "../types";
import { WorkStackParams } from "../types/navigation";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { formatTime } from "../utils/format";
import { colors } from "../utils/colors";

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function TimeHistoryScreen() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const route = useRoute<RouteProp<WorkStackParams, "TimeHistory">>();
  const navigation = useNavigation<NativeStackNavigationProp<WorkStackParams>>();
  const { projectId, projectName } = route.params;

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [])
  );

  async function loadEntries() {
    try {
      setEntries(await getTimeEntries(projectId));
    } catch {}
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  }

  const totalSeconds = entries.reduce((sum, e) => sum + (e.duration || 0), 0);

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
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={text} />
        </TouchableOpacity>
        <Text style={[styles.header, { color: text }]} numberOfLines={1}>{projectName}</Text>
      </View>

      <View style={[styles.totalCard, { backgroundColor: card }]}>
        <Text style={[styles.totalLabel, { color: text }]}>Total tracked</Text>
        <Text style={[styles.totalValue, { color: text }]}>{formatTime(totalSeconds)}</Text>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: card }]}>
            <View style={styles.entryRow}>
              <View>
                <Text style={[styles.entryDate, { color: text }]}>
                  {formatDateTime(item.startedAt)}
                </Text>
                {item.endedAt ? (
                  <Text style={[styles.entryEnd, { color: text }]}>
                    to {formatDateTime(item.endedAt)}
                  </Text>
                ) : (
                  <Text style={[styles.entryEnd, { color: colors.green }]}>Running...</Text>
                )}
              </View>
              <Text style={[styles.entryDuration, { color: text }]}>
                {item.endedAt ? formatTime(item.duration) : "--:--:--"}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title="No time entries"
            subtitle="Start tracking time on this project"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backBtn: {
    marginRight: 12,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    flex: 1,
  },
  totalCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    opacity: 0.6,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 4,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryDate: {
    fontSize: 15,
    fontWeight: "500",
  },
  entryEnd: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  entryDuration: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
