import { getDb, serialized } from "./database";
import { Invoice } from "../types";

export function getInvoices(): Promise<Invoice[]> {
  return serialized(async () => {
    const db = await getDb();
    return db.getAllAsync<Invoice>("SELECT * FROM invoices ORDER BY createdAt DESC");
  });
}

export function getInvoice(id: number): Promise<Invoice | null> {
  return serialized(async () => {
    const db = await getDb();
    return db.getFirstAsync<Invoice>("SELECT * FROM invoices WHERE id = ?", [id]);
  });
}

export function addInvoice(
  projectId: number,
  clientId: number,
  amount: number,
  hours: number,
  hourlyRate: number
): Promise<void> {
  return serialized(async () => {
    const db = await getDb();
    const result = await db.getFirstAsync<{ next: number }>(
      "SELECT COALESCE(MAX(invoiceNumber), 0) + 1 as next FROM invoices"
    );
    const invoiceNumber = result?.next ?? 1;
    await db.runAsync(
      "INSERT INTO invoices (projectId, clientId, amount, hours, hourlyRate, invoiceNumber, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, 'unpaid', ?)",
      [projectId, clientId, amount, hours, hourlyRate, invoiceNumber, Date.now()]
    );
  });
}

export function markInvoicePaid(id: number): Promise<void> {
  return serialized(async () => {
    const db = await getDb();
    await db.runAsync(
      "UPDATE invoices SET status = 'paid', paidAt = ? WHERE id = ?",
      [Date.now(), id]
    );
  });
}

export function deleteInvoice(id: number): Promise<void> {
  return serialized(async () => {
    const db = await getDb();
    await db.runAsync("DELETE FROM invoices WHERE id = ?", [id]);
  });
}

export function getInvoicedHours(projectId: number): Promise<number> {
  return serialized(async () => {
    const db = await getDb();
    const result = await db.getFirstAsync<{ total: number }>(
      "SELECT COALESCE(SUM(hours), 0) as total FROM invoices WHERE projectId = ?",
      [projectId]
    );
    return result?.total ?? 0;
  });
}

export function getEarnings(): Promise<{ paid: number; unpaid: number }> {
  return serialized(async () => {
    const db = await getDb();
    const paid = await db.getFirstAsync<{ total: number }>(
      "SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'paid'"
    );
    const unpaid = await db.getFirstAsync<{ total: number }>(
      "SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'unpaid'"
    );
    return {
      paid: paid?.total ?? 0,
      unpaid: unpaid?.total ?? 0,
    };
  });
}

export function getMonthlyEarnings(): Promise<{ label: string; amount: number }[]> {
  return serialized(async () => {
    const db = await getDb();
    const rows = await db.getAllAsync<{ month: string; total: number }>(
      "SELECT strftime('%Y-%m', createdAt/1000, 'unixepoch') as month, SUM(amount) as total FROM invoices WHERE status = 'paid' GROUP BY month ORDER BY month DESC LIMIT 6"
    );
    return rows.reverse().map((r) => ({ label: r.month, amount: r.total }));
  });
}

export function getWeeklyEarnings(): Promise<{ label: string; amount: number }[]> {
  return serialized(async () => {
    const db = await getDb();
    const rows = await db.getAllAsync<{ week: string; total: number }>(
      "SELECT strftime('%Y-W%W', createdAt/1000, 'unixepoch') as week, SUM(amount) as total FROM invoices WHERE status = 'paid' GROUP BY week ORDER BY week DESC LIMIT 6"
    );
    return rows.reverse().map((r) => {
      const num = parseInt(r.week.split("W")[1], 10);
      return { label: `Week ${num}`, amount: r.total };
    });
  });
}
