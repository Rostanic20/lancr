import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getInvoices, addInvoice, markInvoicePaid, deleteInvoice, getEarnings, getInvoicedHours } from "../services/invoiceService";
import { getProjects } from "../services/projectService";
import { getTotalSeconds } from "../services/timeService";
import { Invoice, Project } from "../types";
import { MoneyStackParams } from "../types/navigation";
import { SwipeableRow } from "../components/SwipeableRow";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { colors } from "../utils/colors";

export function MoneyScreen() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const navigation = useNavigation<NativeStackNavigationProp<MoneyStackParams>>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [earnings, setEarnings] = useState({ paid: 0, unpaid: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    try {
      setInvoices(await getInvoices());
      setProjects(await getProjects());
      setEarnings(await getEarnings());
    } catch {}
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleCreateInvoice(project: Project) {
    const totalSecs = await getTotalSeconds(project.id);
    const totalHours = totalSecs / 3600;
    const alreadyInvoiced = await getInvoicedHours(project.id);
    const hours = totalHours - alreadyInvoiced;
    const amount = hours * project.hourlyRate;

    if (hours <= 0) {
      Alert.alert("No new hours", "All tracked hours have already been invoiced.");
      return;
    }

    await addInvoice(project.id, project.clientId, amount, hours, project.hourlyRate);
    setModalVisible(false);
    loadData();
  }

  async function handleMarkPaid(id: number) {
    await markInvoicePaid(id);
    loadData();
  }

  async function handleDelete(id: number) {
    Alert.alert("Delete invoice?", "This cannot be undone.", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteInvoice(id);
          loadData();
        },
      },
    ]);
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
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color: text }]}>Money</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: card }]}>
          <Text style={{ color: colors.green, fontSize: 20, fontWeight: "bold" }}>
            {earnings.paid.toFixed(2)} EUR
          </Text>
          <Text style={[styles.summaryLabel, { color: text }]}>Paid</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: card }]}>
          <Text style={{ color: colors.orange, fontSize: 20, fontWeight: "bold" }}>
            {earnings.unpaid.toFixed(2)} EUR
          </Text>
          <Text style={[styles.summaryLabel, { color: text }]}>Unpaid</Text>
        </View>
      </View>

      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => (
          <SwipeableRow onDelete={() => handleDelete(item.id)}>
            <TouchableOpacity
              style={[styles.card, { backgroundColor: card }]}
              onPress={() => navigation.navigate("InvoiceDetail", { invoiceId: item.id })}
            >
              <View style={styles.invoiceRow}>
                <View>
                  <Text style={[styles.invoiceAmount, { color: text }]}>
                    {item.amount.toFixed(2)} EUR
                  </Text>
                  <Text style={[styles.invoiceDate, { color: text }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: item.status === "paid" ? colors.green : colors.orange },
                  ]}
                >
                  <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </SwipeableRow>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="cash-outline"
            title="No invoices yet"
            subtitle="Create an invoice from tracked project hours"
          />
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: bg }]}>
            <Text style={[styles.modalTitle, { color: text }]}>Create Invoice</Text>
            <Text style={[styles.modalSub, { color: text }]}>
              Pick a project to invoice based on tracked hours:
            </Text>
            {projects.filter((p) => p.status === "active").map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.projectOption, { backgroundColor: card }]}
                onPress={() => handleCreateInvoice(p)}
              >
                <Text style={[styles.projectOptionText, { color: text }]}>{p.name}</Text>
                <Text style={[styles.projectOptionRate, { color: text }]}>
                  {p.hourlyRate} EUR/hr
                </Text>
              </TouchableOpacity>
            ))}
            {projects.filter((p) => p.status === "active").length === 0 && (
              <EmptyState
                icon="briefcase-outline"
                title="No active projects"
                subtitle="Create a project first"
              />
            )}
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
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
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 4,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  invoiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: "600",
  },
  invoiceDate: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
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
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 16,
  },
  projectOption: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  projectOptionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  projectOptionRate: {
    fontSize: 14,
    opacity: 0.6,
  },
  cancelText: {
    textAlign: "center",
    marginTop: 14,
    fontSize: 16,
    opacity: 0.6,
  },
});
