export interface Client {
  id: number;
  name: string;
  email: string | null;
  company: string | null;
  notes: string | null;
  createdAt: number;
}

export interface Project {
  id: number;
  clientId: number;
  name: string;
  status: "active" | "paused" | "completed";
  hourlyRate: number;
  deadline: string | null;
  notes: string | null;
  createdAt: number;
}

export interface TimeEntry {
  id: number;
  projectId: number;
  startedAt: number;
  endedAt: number | null;
  duration: number;
}

export interface Invoice {
  id: number;
  projectId: number;
  clientId: number;
  amount: number;
  hours: number;
  hourlyRate: number;
  invoiceNumber: number;
  status: "unpaid" | "paid" | "overdue";
  createdAt: number;
  paidAt: number | null;
}
