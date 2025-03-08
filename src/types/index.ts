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
  status: "pending" | "paid" | "draft";
  user_id: string;
  created_at: string;
  category?: string | null;
  pdf_url?: string | null;
}

export interface Article {
  id: string;
  name: string;
  description: string | null;
  price_ht: number;
  vat_rate: number;
  user_id: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category?: string;
  date: string;
  status: string;
  invoice_id?: string;
  created_at: string;
}

export interface Budget {
  id: string;
  total_available: number;
  total_spent: number;
  categories: { [key: string]: number };
  fiscal_year: string;
  created_at: string;
  updated_at: string;
}

export type Role = "super_admin" | "admin" | "resp_pole" | "agent";
