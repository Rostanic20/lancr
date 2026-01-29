import { getDb, serialized } from "./database";
import { Project } from "../types";

export function getProjects(): Promise<Project[]> {
  return serialized(async () => {
    const db = await getDb();
    return db.getAllAsync<Project>("SELECT * FROM projects ORDER BY createdAt DESC");
  });
}

export function getProjectsByClient(clientId: number): Promise<Project[]> {
  return serialized(async () => {
    const db = await getDb();
    return db.getAllAsync<Project>(
      "SELECT * FROM projects WHERE clientId = ? ORDER BY createdAt DESC",
      [clientId]
    );
  });
}

export function getProject(id: number): Promise<Project | null> {
  return serialized(async () => {
    const db = await getDb();
    return db.getFirstAsync<Project>("SELECT * FROM projects WHERE id = ?", [id]);
  });
}

export function addProject(
  clientId: number,
  name: string,
  hourlyRate: number,
  deadline: string | null,
  notes: string
): Promise<void> {
  return serialized(async () => {
    const db = await getDb();
    await db.runAsync(
      "INSERT INTO projects (clientId, name, hourlyRate, deadline, notes, status, createdAt) VALUES (?, ?, ?, ?, ?, 'active', ?)",
      [clientId, name, hourlyRate, deadline, notes, Date.now()]
    );
  });
}

export function updateProject(
  id: number,
  name: string,
  hourlyRate: number,
  deadline: string | null,
  notes: string
): Promise<void> {
  return serialized(async () => {
    const db = await getDb();
    await db.runAsync(
      "UPDATE projects SET name = ?, hourlyRate = ?, deadline = ?, notes = ? WHERE id = ?",
      [name, hourlyRate, deadline, notes, id]
    );
  });
}

export function updateProjectStatus(id: number, status: "active" | "paused" | "completed"): Promise<void> {
  return serialized(async () => {
    const db = await getDb();
    await db.runAsync("UPDATE projects SET status = ? WHERE id = ?", [status, id]);
  });
}

export function deleteProject(id: number): Promise<void> {
  return serialized(async () => {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync("DELETE FROM invoices WHERE projectId = ?", [id]);
      await db.runAsync("DELETE FROM time_entries WHERE projectId = ?", [id]);
      await db.runAsync("DELETE FROM projects WHERE id = ?", [id]);
    });
  });
}
