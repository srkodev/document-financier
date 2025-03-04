
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
    [key: string]: {
      allocated: number;
      spent: number;
    };
  };
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
