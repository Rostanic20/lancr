import { getDb, serialized } from "./database";
import { Client } from "../types";

export function getClients(): Promise<Client[]> {
  return serialized(async () => {
    const db = await getDb();
    return db.getAllAsync<Client>("SELECT * FROM clients ORDER BY createdAt DESC");
  });
}

export function getClient(id: number): Promise<Client | null> {
  return serialized(async () => {
    const db = await getDb();
    return db.getFirstAsync<Client>("SELECT * FROM clients WHERE id = ?", [id]);
  });
}

export function addClient(name: string, email: string, company: string, notes: string): Promise<void> {
  return serialized(async () => {
    const db = await getDb();
    await db.runAsync(
      "INSERT INTO clients (name, email, company, notes, createdAt) VALUES (?, ?, ?, ?, ?)",
      [name, email, company, notes, Date.now()]
    );
  });
}

export function updateClient(id: number, name: string, email: string, company: string, notes: string): Promise<void> {
  return serialized(async () => {
    const db = await getDb();
    await db.runAsync(
      "UPDATE clients SET name = ?, email = ?, company = ?, notes = ? WHERE id = ?",
      [name, email, company, notes, id]
    );
  });
}

export function deleteClient(id: number): Promise<void> {
  return serialized(async () => {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      const projects = await db.getAllAsync<{ id: number }>("SELECT id FROM projects WHERE clientId = ?", [id]);
      for (const p of projects) {
        await db.runAsync("DELETE FROM time_entries WHERE projectId = ?", [p.id]);
      }
      await db.runAsync("DELETE FROM invoices WHERE clientId = ?", [id]);
      await db.runAsync("DELETE FROM projects WHERE clientId = ?", [id]);
      await db.runAsync("DELETE FROM clients WHERE id = ?", [id]);
    });
  });
}

export function searchClients(query: string): Promise<Client[]> {
  return serialized(async () => {
    const db = await getDb();
    const q = `%${query}%`;
    return db.getAllAsync<Client>(
      "SELECT * FROM clients WHERE name LIKE ? OR email LIKE ? OR company LIKE ? ORDER BY createdAt DESC",
      [q, q, q]
    );
  });
}
