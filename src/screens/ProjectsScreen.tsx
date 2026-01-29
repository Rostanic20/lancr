import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getProjectsByClient, addProject, updateProject, updateProjectStatus, deleteProject } from "../services/projectService";
import { getTotalSeconds } from "../services/timeService";
import { Project } from "../types";
import { WorkStackParams } from "../types/navigation";
import { SwipeableRow } from "../components/SwipeableRow";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { useTimer } from "../context/TimerContext";
import { formatTime } from "../utils/format";
import { colors } from "../utils/colors";

function isOverdue(deadline: string | null, status: string): boolean {
  if (!deadline || status !== "active") return false;
  return new Date(deadline) < new Date();
}

function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

export function ProjectsScreen() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const route = useRoute<RouteProp<WorkStackParams, "Projects">>();
  const navigation = useNavigation<NativeStackNavigationProp<WorkStackParams>>();
  const { clientId, clientName } = route.params;
  const { activeTimer, elapsed, start, stop, refresh: refreshTimer } = useTimer();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"active" | "paused" | "completed">("active");
  const [projectHours, setProjectHours] = useState<Record<number, number>>({});

  useFocusEffect(
    useCallback(() => {
      loadProjects();
      refreshTimer();
    }, [])
  );

  async function loadProjects() {
    try {
      const list = await getProjectsByClient(clientId);
      setProjects(list);
      const hours: Record<number, number> = {};
      for (const p of list) {
        hours[p.id] = await getTotalSeconds(p.id);
      }
      setProjectHours(hours);
    } catch {}
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadProjects();
    await refreshTimer();
    setRefreshing(false);
  }

  async function handleStartStop(projectId: number) {
    try {
      if (activeTimer) {
        await stop();
      } else {
        await start(projectId);
      }
    } catch {}
    await refreshTimer();
    await loadProjects();
  }

  function openAdd() {
    setEditingProject(null);
    setName("");
    setRate("");
    setDeadline("");
    setNotes("");
    setStatus("active");
    setModalVisible(true);
  }

  function openEdit(project: Project) {
    setEditingProject(project);
    setName(project.name);
    setRate(project.hourlyRate.toString());
    setDeadline(project.deadline || "");
    setNotes(project.notes || "");
    setStatus(project.status);
    setModalVisible(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Name required", "Enter a project name.");
      return;
    }
    const parsedRate = parseFloat(rate);
    if (rate.trim() && (isNaN(parsedRate) || parsedRate < 0)) {
      Alert.alert("Invalid rate", "Hourly rate must be a positive number.");
      return;
    }
    const dl = deadline.trim() || null;
    try {
      if (editingProject) {
        await updateProject(editingProject.id, name.trim(), parseFloat(rate) || 0, dl, notes.trim());
        await updateProjectStatus(editingProject.id, status);
      } else {
        await addProject(clientId, name.trim(), parseFloat(rate) || 0, dl, notes.trim());
      }
      setModalVisible(false);
      loadProjects();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save project.");
    }
  }

  async function handleDelete(id: number) {
    Alert.alert("Delete project?", "This will remove the project.", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteProject(id);
          loadProjects();
        },
      },
    ]);
  }

  function handleDeadlineChange(value: string) {
    setDeadline(formatDateInput(value));
  }

  const filtered = search.trim()
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  const bg = dark ? colors.dark.bg : colors.light.bg;
  const text = dark ? colors.dark.text : colors.light.text;
  const card = dark ? colors.dark.card : colors.light.card;
  const inputBg = dark ? colors.dark.input : colors.light.input;

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
        <Text style={[styles.header, { color: text }]} numberOfLines={1}>{clientName}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.searchBar, { backgroundColor: inputBg, color: text }]}
        placeholder="Search projects..."
        placeholderTextColor="#999"
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => {
          const isTimerOn = activeTimer?.projectId === item.id;
          const totalSecs = projectHours[item.id] ?? 0;
          const earnings = ((totalSecs + (isTimerOn ? elapsed : 0)) / 3600) * item.hourlyRate;
          const overdue = isOverdue(item.deadline, item.status);
          const isActive = item.status === "active";
          const dimmed = !isActive && !isTimerOn;

          return (
            <SwipeableRow onDelete={() => handleDelete(item.id)}>
              <View style={[styles.card, { backgroundColor: card, opacity: dimmed ? 0.5 : 1 }]}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={[styles.projectName, { color: text, flex: 1 }]}>{item.name}</Text>
                      {!isActive && (
                        <View style={[styles.statusBadge, { backgroundColor: item.status === "paused" ? colors.orange : colors.green }]}>
                          <Text style={styles.statusBadgeText}>{item.status.toUpperCase()}</Text>
                        </View>
                      )}
                      <TouchableOpacity onPress={() => openEdit(item)} style={{ marginLeft: 8 }}>
                        <Ionicons name="pencil-outline" size={18} color={text} style={{ opacity: 0.5 }} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.projectInfo, { color: text }]}>
                      {item.hourlyRate} EUR/hr
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("TimeHistory", { projectId: item.id, projectName: item.name })}
                    >
                      <Text style={[styles.projectInfo, { color: text, textDecorationLine: "underline" }]}>
                        {formatTime(isTimerOn ? totalSecs + elapsed : totalSecs)} tracked
                      </Text>
                    </TouchableOpacity>
                    <Text style={[styles.projectInfo, { color: colors.green }]}>
                      {earnings.toFixed(2)} EUR earned
                    </Text>
                    {item.deadline ? (
                      <Text style={[styles.projectInfo, { color: overdue ? colors.red : text }]}>
                        {overdue ? "OVERDUE " : ""}Due: {item.deadline}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={[styles.timerBtn, isTimerOn && styles.timerBtnActive, !isActive && !isTimerOn && { opacity: 0.3 }]}
                    onPress={() => handleStartStop(item.id)}
                    disabled={(!isActive && !isTimerOn) || (activeTimer !== null && !isTimerOn)}
                  >
                    <Text style={styles.timerBtnText}>
                      {isTimerOn ? "STOP" : "START"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </SwipeableRow>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="folder-outline"
            title="No projects"
            subtitle="Tap + to add your first project"
          />
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: bg }]}>
            <Text style={[styles.modalTitle, { color: text }]}>
              {editingProject ? "Edit Project" : "New Project"}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: text }]}
              placeholder="Project name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: text }]}
              placeholder="Hourly rate (EUR)"
              placeholderTextColor="#999"
              value={rate}
              onChangeText={setRate}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: text }]}
              placeholder="Deadline (YYYY-MM-DD)"
              placeholderTextColor="#999"
              value={deadline}
              onChangeText={handleDeadlineChange}
              keyboardType="number-pad"
              maxLength={10}
            />
            <TextInput
              style={[styles.input, styles.notesInput, { backgroundColor: inputBg, color: text }]}
              placeholder="Notes"
              placeholderTextColor="#999"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
            {editingProject && (
              <View style={styles.statusRow}>
                {(["active", "paused", "completed"] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusOption, { backgroundColor: inputBg }, status === s && styles.statusOptionActive]}
                    onPress={() => setStatus(s)}
                  >
                    <Text style={[styles.statusOptionText, status === s && styles.statusOptionTextActive]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={[styles.cancelText, { color: text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.button,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  searchBar: {
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  projectName: {
    fontSize: 18,
    fontWeight: "600",
  },
  projectInfo: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  timerBtn: {
    backgroundColor: colors.button,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  timerBtnActive: {
    backgroundColor: colors.red,
  },
  timerBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modal: {
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveBtn: {
    backgroundColor: colors.button,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelText: {
    textAlign: "center",
    marginTop: 14,
    fontSize: 16,
    opacity: 0.6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  statusOptionActive: {
    backgroundColor: colors.button,
  },
  statusOptionText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  statusOptionTextActive: {
    color: colors.white,
  },
});
