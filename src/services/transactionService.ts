
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types";

// Fetch all transactions
export const fetchTransactions = async (): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchTransactions:", error);
    throw error;
  }
};

// Create new transaction
export const createTransaction = async (
  transaction: Omit<Transaction, "id" | "created_at">
): Promise<Transaction | null> => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .insert([transaction])
      .select()
      .single();

    if (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }

    return data as Transaction;
  } catch (error) {
    console.error("Error in createTransaction:", error);
    throw error;
  }
};

// Get transaction by ID
export const getTransactionById = async (id: string): Promise<Transaction | null> => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching transaction with ID ${id}:`, error);
      return null;
    }

    return data as Transaction;
  } catch (error) {
    console.error("Error in getTransactionById:", error);
    return null;
  }
};

// Update existing transaction
export const updateTransaction = async (
  id: string,
  updates: Partial<Omit<Transaction, "id" | "created_at">>
): Promise<Transaction | null> => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }

    return data as Transaction;
  } catch (error) {
    console.error("Error in updateTransaction:", error);
    throw error;
  }
};

// Delete transaction
export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteTransaction:", error);
    return false;
  }
};

// Get transactions summary for dashboard
export const getTransactionsSummary = async (): Promise<{
  totalCount: number;
  totalAmount: number;
  recentTransactions: Transaction[];
}> => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching transactions for summary:", error);
      throw error;
    }

    const transactions = data as Transaction[];
    const totalAmount = transactions.reduce(
      (sum, transaction) => sum + parseFloat(transaction.amount.toString()),
      0
    );

    return {
      totalCount: transactions.length,
      totalAmount,
      recentTransactions: transactions.slice(0, 5),
    };
  } catch (error) {
    console.error("Error in getTransactionsSummary:", error);
    return {
      totalCount: 0,
      totalAmount: 0,
      recentTransactions: [],
    };
  }
};
