import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { getDb, serialized } from "./database";

export function exportBackup(): Promise<void> {
  return serialized(async () => {
    const db = await getDb();
    const clients = await db.getAllAsync("SELECT * FROM clients");
    const projects = await db.getAllAsync("SELECT * FROM projects");
    const timeEntries = await db.getAllAsync("SELECT * FROM time_entries");
    const invoices = await db.getAllAsync("SELECT * FROM invoices");

    const data = JSON.stringify({ clients, projects, timeEntries, invoices }, null, 2);
    const file = new File(Paths.cache, "lancr-backup.json");
    file.write(data);

    const available = await Sharing.isAvailableAsync();
    if (!available) {
      throw new Error("Sharing is not available on this device.");
    }

    await Sharing.shareAsync(file.uri, { mimeType: "application/json" });
  });
}

export function importBackup(uri: string): Promise<void> {
  return serialized(async () => {
    const source = new File(uri);
    const copy = new File(Paths.cache, "lancr-import.json");
    source.copy(copy);
    const content = copy.text();
    const data = JSON.parse(content);
    if (!data || typeof data !== "object") {
      throw new Error("Invalid backup file.");
    }
    const db = await getDb();

    await db.withTransactionAsync(async () => {
      await db.execAsync("DELETE FROM invoices");
      await db.execAsync("DELETE FROM time_entries");
      await db.execAsync("DELETE FROM projects");
      await db.execAsync("DELETE FROM clients");

      for (const c of data.clients || []) {
        await db.runAsync(
          "INSERT INTO clients (id, name, email, company, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
          [c.id, c.name, c.email, c.company, c.notes, c.createdAt]
        );
      }

      for (const p of data.projects || []) {
        await db.runAsync(
          "INSERT INTO projects (id, clientId, name, status, hourlyRate, deadline, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [p.id, p.clientId, p.name, p.status, p.hourlyRate, p.deadline, p.notes, p.createdAt]
        );
      }

      for (const t of data.timeEntries || []) {
        await db.runAsync(
          "INSERT INTO time_entries (id, projectId, startedAt, endedAt, duration) VALUES (?, ?, ?, ?, ?)",
          [t.id, t.projectId, t.startedAt, t.endedAt, t.duration]
        );
      }

      for (const i of data.invoices || []) {
        await db.runAsync(
          "INSERT INTO invoices (id, projectId, clientId, amount, hours, hourlyRate, invoiceNumber, status, createdAt, paidAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [i.id, i.projectId, i.clientId, i.amount, i.hours, i.hourlyRate, i.invoiceNumber || 0, i.status, i.createdAt, i.paidAt]
        );
      }
    });
  });
}
