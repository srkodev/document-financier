
// User Roles
export enum UserRole {
  SUPER_ADMIN = "SuperAdmin",
  ADMIN = "Admin",
  RESP_POLE = "RespPôle",
  AGENT = "Agent"
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
  userId: string;
  amount: number;
  status: InvoiceStatus;
  createdAt: Date;
  pdfUrl?: string;
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
