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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getClients, addClient, updateClient, deleteClient, searchClients } from "../services/clientService";
import { Client } from "../types";
import { WorkStackParams } from "../types/navigation";
import { SwipeableRow } from "../components/SwipeableRow";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { colors } from "../utils/colors";

export function ClientsScreen() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const navigation = useNavigation<NativeStackNavigationProp<WorkStackParams>>();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [])
  );

  async function loadClients() {
    try {
      if (search.trim()) {
        setClients(await searchClients(search.trim()));
      } else {
        setClients(await getClients());
      }
    } catch {}
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  }

  async function handleSearch(query: string) {
    setSearch(query);
    try {
      if (query.trim()) {
        setClients(await searchClients(query.trim()));
      } else {
        setClients(await getClients());
      }
    } catch {}
  }

  function openAdd() {
    setEditingClient(null);
    setName("");
    setEmail("");
    setCompany("");
    setNotes("");
    setModalVisible(true);
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    setName(client.name);
    setEmail(client.email || "");
    setCompany(client.company || "");
    setNotes(client.notes || "");
    setModalVisible(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Name required", "Enter a client name.");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("Invalid email", "Enter a valid email address.");
      return;
    }
    try {
      if (editingClient) {
        await updateClient(editingClient.id, name.trim(), email.trim(), company.trim(), notes.trim());
      } else {
        await addClient(name.trim(), email.trim(), company.trim(), notes.trim());
      }
      setModalVisible(false);
      loadClients();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save client.");
    }
  }

  async function handleDelete(id: number) {
    Alert.alert("Delete client?", "This will remove the client.", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteClient(id);
          loadClients();
        },
      },
    ]);
  }

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
        <Text style={[styles.header, { color: text }]}>Clients</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.searchBar, { backgroundColor: inputBg, color: text }]}
        placeholder="Search clients..."
        placeholderTextColor="#999"
        value={search}
        onChangeText={handleSearch}
      />

      <FlatList
        data={clients}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => (
          <SwipeableRow onDelete={() => handleDelete(item.id)}>
            <TouchableOpacity
              style={[styles.card, { backgroundColor: card }]}
              onPress={() => navigation.navigate("Projects", { clientId: item.id, clientName: item.name })}
            >
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.clientName, { color: text }]}>{item.name}</Text>
                  {item.company ? (
                    <Text style={[styles.clientInfo, { color: text }]}>{item.company}</Text>
                  ) : null}
                  {item.email ? (
                    <Text style={[styles.clientInfo, { color: text }]}>{item.email}</Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => openEdit(item)}>
                  <Ionicons name="pencil-outline" size={20} color={text} style={{ opacity: 0.5 }} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </SwipeableRow>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No clients yet"
            subtitle="Tap + to add your first client"
          />
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: bg }]}>
            <Text style={[styles.modalTitle, { color: text }]}>
              {editingClient ? "Edit Client" : "New Client"}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: text }]}
              placeholder="Name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: text }]}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: text }]}
              placeholder="Company"
              placeholderTextColor="#999"
              value={company}
              onChangeText={setCompany}
            />
            <TextInput
              style={[styles.input, styles.notesInput, { backgroundColor: inputBg, color: text }]}
              placeholder="Notes"
              placeholderTextColor="#999"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
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
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  clientName: {
    fontSize: 18,
    fontWeight: "600",
  },
  clientInfo: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
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
});
