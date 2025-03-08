
// User Roles
export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  RESP_POLE = "resp_pole",
  AGENT = "agent"
}

// Invoice Status
export enum InvoiceStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  PROCESSING = "processing"
}

// Transaction Status
export enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  PROCESSING = "processing"
}

// Budget Category
export interface BudgetCategory {
  allocated: number;
  spent: number;
  description?: string;
  lastUpdated?: string;
}

// Budget History Entry
export interface BudgetHistoryEntry {
  id: string;
  user_id: string;
  user_name?: string;
  action: string;
  details: string;
  created_at: string;
}

// User Interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

// Invoice Interface
export interface Invoice {
  id: string;
  number: string;
  user_id: string;
  amount: number;
  status: InvoiceStatus;
  created_at: string;
  updated_at: string;
  pdf_url?: string;
  description: string;
  category?: string;
}

// Transaction Interface
export interface Transaction {
  id: string;
  invoiceId?: string;
  amount: number;
  status: TransactionStatus;
  date: Date;
  description: string;
  category?: string;
}

// Budget Interface
export interface Budget {
  id: string;
  totalAvailable: number;
  totalSpent: number;
  categories?: {
    [key: string]: BudgetCategory;
  };
  fiscalYear?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Profile Interface
export interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Article Interface (pour la création de factures)
export interface Article {
  id: string;
  name: string;
  description?: string;
  priceHT: number;
  vatRate: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Reimbursement Request Interface
export interface ReimbursementRequest {
  id: string;
  user_id: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  description?: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

// Reimbursement Attachment Interface
export interface ReimbursementAttachment {
  id: string;
  reimbursement_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  created_at: string;
}

// Category Interface
export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}
