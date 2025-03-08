
import { supabase } from "@/integrations/supabase/client";
import { Transaction, TransactionStatus } from "@/types";
import { updateBudget, fetchBudget } from "@/services/budgetService";

export const fetchTransactions = async (
  status?: TransactionStatus | "all",
  search?: string,
  category?: string,
) => {
  let query = supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  if (search) {
    query = query.or(`description.ilike.%${search}%,id.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as Transaction[];
};

export const createTransaction = async (transaction: Partial<Transaction>): Promise<Transaction> => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        amount: transaction.amount || 0,
        description: transaction.description || '',
        category: transaction.category || '',
        date: transaction.date?.toISOString() || new Date().toISOString(),
        status: transaction.status || TransactionStatus.COMPLETED,
        invoiceId: transaction.invoiceId
      })
      .select()
      .single();

    if (error) throw error;

    // Update budget after creating transaction
    await updateBudgetFromTransaction(data as Transaction);

    return data as Transaction;
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

export const updateTransaction = async (id: string, transaction: Partial<Transaction>): Promise<Transaction> => {
  try {
    // Get the original transaction to calculate the difference
    const { data: originalTransaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // Update the transaction
    const { data, error } = await supabase
      .from("transactions")
      .update({
        amount: transaction.amount !== undefined ? transaction.amount : (originalTransaction as Transaction).amount,
        description: transaction.description || (originalTransaction as Transaction).description,
        category: transaction.category || (originalTransaction as Transaction).category,
        date: transaction.date?.toISOString() || (originalTransaction as Transaction).date,
        status: transaction.status || (originalTransaction as Transaction).status,
        invoiceId: transaction.invoiceId
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Update budget after updating transaction
    await updateBudgetFromTransactionChange(
      originalTransaction as Transaction, 
      data as Transaction
    );

    return data as Transaction;
  } catch (error: any) {
    console.error("Error updating transaction:", error);
    throw error;
  }
};

export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    // Get the transaction to remove its amount from the budget
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // Delete the transaction
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Update budget after deleting transaction by negating the amount
    await updateBudgetFromTransaction({
      ...transaction as Transaction,
      amount: -(transaction as Transaction).amount
    });

    return true;
  } catch (error: any) {
    console.error("Error deleting transaction:", error);
    throw error;
  }
};

// Helper function to update budget based on a transaction
export const updateBudgetFromTransaction = async (transaction: Transaction): Promise<void> => {
  try {
    const currentBudget = await fetchBudget();
    
    // Only process completed transactions
    if (transaction.status !== TransactionStatus.COMPLETED) {
      return;
    }

    // For positive amounts (income), add to total available
    // For negative amounts (expense), add to total spent
    let updatedBudget = { ...currentBudget };
    
    if (transaction.amount > 0) {
      updatedBudget.totalAvailable += transaction.amount;
    } else {
      updatedBudget.totalSpent += Math.abs(transaction.amount);
      
      // If transaction has a category, update the category spending
      if (transaction.category && updatedBudget.categories) {
        const categories = { ...updatedBudget.categories };
        
        if (categories[transaction.category]) {
          categories[transaction.category] = {
            ...categories[transaction.category],
            spent: (categories[transaction.category].spent || 0) + Math.abs(transaction.amount),
            lastUpdated: new Date().toISOString()
          };
        } else {
          categories[transaction.category] = {
            allocated: 0,
            spent: Math.abs(transaction.amount),
            lastUpdated: new Date().toISOString()
          };
        }
        
        updatedBudget.categories = categories;
      }
    }
    
    await updateBudget(updatedBudget);
  } catch (error) {
    console.error("Error updating budget from transaction:", error);
    throw error;
  }
};

// Helper function to update budget based on transaction changes
const updateBudgetFromTransactionChange = async (
  oldTransaction: Transaction, 
  newTransaction: Transaction
): Promise<void> => {
  // Only handle completed transactions
  if (oldTransaction.status !== TransactionStatus.COMPLETED &&
      newTransaction.status !== TransactionStatus.COMPLETED) {
    return;
  }
  
  try {
    // First reverse the effect of the old transaction
    if (oldTransaction.status === TransactionStatus.COMPLETED) {
      await updateBudgetFromTransaction({
        ...oldTransaction,
        amount: -oldTransaction.amount // Negate the amount to reverse
      });
    }
    
    // Then apply the new transaction
    if (newTransaction.status === TransactionStatus.COMPLETED) {
      await updateBudgetFromTransaction(newTransaction);
    }
  } catch (error) {
    console.error("Error updating budget from transaction change:", error);
    throw error;
  }
};
