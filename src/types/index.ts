
export interface User {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  role: "super_admin" | "admin" | "resp_pole" | "agent";
  created_at: string;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  description: string;
  status: InvoiceStatus;
  user_id: string;
  created_at: string;
  category?: string | null;
  pdf_url?: string | null;
  updated_at?: string;
}

export interface Article {
  id: string;
  name: string;
  description: string | null;
  price_ht: number;
  vat_rate: number;
  // Propriétés en camelCase pour compatibilité avec les composants existants
  priceHT: number;
  vatRate: number;
  user_id: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category?: string | null;
  date: string;
  status: TransactionStatus;
  invoice_id?: string | null;
  created_at: string;
}

export interface Budget {
  id: string;
  total_available: number;
  total_spent: number;
  categories: { [key: string]: BudgetCategory };
  fiscal_year?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BudgetCategory {
  allocated: number;
  spent: number;
  description?: string;
  lastUpdated?: string;
}

export interface BudgetHistoryEntry {
  id: string;
  user_id: string;
  user_name?: string;
  action: string;
  details: string;
  created_at: string;
}

export interface ReimbursementRequest {
  id: string;
  invoice_id: string;
  user_id: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
  updated_at: string;
  category?: string | null;
}

export type Role = "super_admin" | "admin" | "resp_pole" | "agent";

export enum InvoiceStatus {
  PENDING = "pending",
  PAID = "paid",
  DRAFT = "draft",
  APPROVED = "approved",
  REJECTED = "rejected",
  PROCESSING = "processing"
}

export enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  PROCESSING = "processing"
}

export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  RESP_POLE = "resp_pole",
  AGENT = "agent"
}
