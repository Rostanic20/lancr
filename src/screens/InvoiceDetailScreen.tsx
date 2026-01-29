import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getInvoice, markInvoicePaid } from "../services/invoiceService";
import { getClient } from "../services/clientService";
import { getProject } from "../services/projectService";
import { exportInvoicePdf } from "../services/pdfService";
import { Invoice, Client, Project } from "../types";
import { MoneyStackParams } from "../types/navigation";
import { LoadingState } from "../components/LoadingState";
import { colors } from "../utils/colors";

export function InvoiceDetailScreen() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const route = useRoute<RouteProp<MoneyStackParams, "InvoiceDetail">>();
  const navigation = useNavigation<NativeStackNavigationProp<MoneyStackParams>>();
  const { invoiceId } = route.params;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    try {
      const inv = await getInvoice(invoiceId);
      if (inv) {
        setInvoice(inv);
        const [c, p] = await Promise.all([
          getClient(inv.clientId),
          getProject(inv.projectId),
        ]);
        setClient(c);
        setProject(p);
      }
    } catch {}
    setLoading(false);
  }

  async function handleMarkPaid() {
    if (!invoice) return;
    await markInvoicePaid(invoice.id);
    loadData();
  }

  const bg = dark ? colors.dark.bg : colors.light.bg;
  const text = dark ? colors.dark.text : colors.light.text;
  const card = dark ? colors.dark.card : colors.light.card;

  if (loading || !invoice) {
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
        <Text style={[styles.header, { color: text }]}>Invoice #{invoice.invoiceNumber || invoice.id}</Text>
      </View>

      <ScrollView>
        <View style={[styles.card, { backgroundColor: card }]}>
          <Text style={[styles.label, { color: text }]}>Client</Text>
          <Text style={[styles.value, { color: client ? text : colors.red }]}>{client?.name || "Deleted client"}</Text>
          {client?.company ? (
            <Text style={[styles.subValue, { color: text }]}>{client.company}</Text>
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: card }]}>
          <Text style={[styles.label, { color: text }]}>Project</Text>
          <Text style={[styles.value, { color: project ? text : colors.red }]}>{project?.name || "Deleted project"}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: card }]}>
          <Text style={[styles.label, { color: text }]}>Line Items</Text>
          <View style={styles.lineItem}>
            <Text style={[styles.lineDesc, { color: text }]}>{project?.name || "Work"}</Text>
            <Text style={[styles.lineDetail, { color: text }]}>
              {(invoice.hours ?? 0).toFixed(2)} hrs x {(invoice.hourlyRate ?? 0).toFixed(2)} EUR
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: text }]}>Total</Text>
            <Text style={[styles.totalAmount, { color: text }]}>{invoice.amount.toFixed(2)} EUR</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: card }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: text }]}>Status</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: invoice.status === "paid" ? colors.green : colors.orange },
              ]}
            >
              <Text style={styles.statusText}>{invoice.status.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: text }]}>Created</Text>
            <Text style={[styles.infoValue, { color: text }]}>
              {new Date(invoice.createdAt).toLocaleDateString()}
            </Text>
          </View>
          {invoice.paidAt ? (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: text }]}>Paid</Text>
              <Text style={[styles.infoValue, { color: text }]}>
                {new Date(invoice.paidAt).toLocaleDateString()}
              </Text>
            </View>
          ) : null}
        </View>

        {invoice.status === "unpaid" && (
          <TouchableOpacity style={styles.payBtn} onPress={handleMarkPaid}>
            <Text style={styles.payBtnText}>Mark as Paid</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.exportBtn}
          onPress={async () => {
            if (invoice && client && project) {
              try {
                await exportInvoicePdf(invoice, client, project);
              } catch (e: any) {
                Alert.alert("Error", e.message || "Failed to export PDF.");
              }
            }
          }}
        >
          <Ionicons name="download-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.payBtnText}>Export PDF</Text>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backBtn: {
    marginRight: 12,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    flex: 1,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    opacity: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: "600",
  },
  subValue: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  lineItem: {
    marginTop: 8,
  },
  lineDesc: {
    fontSize: 16,
    fontWeight: "500",
  },
  lineDetail: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.muted,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: "bold",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 15,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  payBtn: {
    backgroundColor: colors.green,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  payBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  exportBtn: {
    backgroundColor: colors.button,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "center",
  },
});
