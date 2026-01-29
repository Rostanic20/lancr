import { getDb, serialized } from "./database";
import { TimeEntry } from "../types";

export function getTimeEntries(projectId: number): Promise<TimeEntry[]> {
  return serialized(async () => {
    const db = await getDb();
    return db.getAllAsync<TimeEntry>(
      "SELECT * FROM time_entries WHERE projectId = ? ORDER BY startedAt DESC",
      [projectId]
    );
  });
}

export function getActiveTimer(): Promise<TimeEntry | null> {
  return serialized(async () => {
    const db = await getDb();
    return db.getFirstAsync<TimeEntry>(
      "SELECT * FROM time_entries WHERE endedAt IS NULL"
    );
  });
}

export function startTimer(projectId: number): Promise<void> {
  return serialized(async () => {
    const db = await getDb();
    const existing = await db.getFirstAsync<TimeEntry>(
      "SELECT * FROM time_entries WHERE endedAt IS NULL"
    );
    if (existing) {
      const now = Date.now();
      const duration = Math.floor((now - existing.startedAt) / 1000);
      await db.runAsync(
        "UPDATE time_entries SET endedAt = ?, duration = ? WHERE id = ?",
        [now, duration, existing.id]
      );
    }
    await db.runAsync(
      "INSERT INTO time_entries (projectId, startedAt) VALUES (?, ?)",
      [projectId, Date.now()]
    );
  });
}

export function stopTimer(id: number): Promise<void> {
  return serialized(async () => {
    const db = await getDb();
    const now = Date.now();
    const entry = await db.getFirstAsync<TimeEntry>(
      "SELECT * FROM time_entries WHERE id = ?",
      [id]
    );
    if (entry) {
      const duration = Math.floor((now - entry.startedAt) / 1000);
      await db.runAsync(
        "UPDATE time_entries SET endedAt = ?, duration = ? WHERE id = ?",
        [now, duration, id]
      );
    }
  });
}

export function getTotalSeconds(projectId: number): Promise<number> {
  return serialized(async () => {
    const db = await getDb();
    const result = await db.getFirstAsync<{ total: number }>(
      "SELECT COALESCE(SUM(duration), 0) as total FROM time_entries WHERE projectId = ? AND endedAt IS NOT NULL",
      [projectId]
    );
    return result?.total ?? 0;
  });
}
