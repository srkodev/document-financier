
import { supabase } from "@/integrations/supabase/client";
import { Budget, BudgetHistoryEntry, TransactionStatus, BudgetCategory } from "@/types";

// Fetch the current budget
export const fetchBudget = async (): Promise<Budget> => {
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .limit(1)
    .single();

  if (error) throw error;

  // Ensure categories is properly typed
  const budget: Budget = {
    id: data.id,
    total_available: data.total_available,
    total_spent: data.total_spent,
    categories: data.categories as { [key: string]: BudgetCategory },
    created_at: data.created_at,
    updated_at: data.updated_at,
    fiscal_year: data.fiscal_year,
  };

  return budget;
};

// Update budget in the database
export const updateBudget = async (budget: Budget): Promise<Budget> => {
  const { data, error } = await supabase
    .from("budgets")
    .update({
      total_available: budget.total_available,
      total_spent: budget.total_spent,
      categories: budget.categories as any, // Cast to any to avoid type issues with JSONB
      updated_at: new Date().toISOString()
    })
    .eq("id", budget.id)
    .select()
    .single();

  if (error) throw error;

  // Ensure categories is properly typed in the response
  const updatedBudget: Budget = {
    id: data.id,
    total_available: data.total_available,
    total_spent: data.total_spent,
    categories: data.categories as { [key: string]: BudgetCategory },
    created_at: data.created_at,
    updated_at: data.updated_at,
    fiscal_year: data.fiscal_year,
  };

  return updatedBudget;
};

// Save an entry in the budget history
export const saveBudgetHistoryEntry = async (
  action: string,
  details: string,
  userId: string = "system"
): Promise<void> => {
  const { error } = await supabase
    .from("budget_history")
    .insert({
      action,
      details,
      user_id: userId
    });

  if (error) throw error;
};

// Fetch budget history entries
export const fetchBudgetHistory = async (): Promise<BudgetHistoryEntry[]> => {
  const { data, error } = await supabase
    .from("budget_history")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Try to get user names for each entry
  const historyWithUserNames = await Promise.all(
    data.map(async (entry) => {
      if (entry.user_id === "system") {
        return {
          ...entry,
          user_name: "Système"
        };
      }
      
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", entry.user_id)
        .maybeSingle();

      return {
        ...entry,
        user_name: userData?.name || "Utilisateur"
      };
    })
  );

  return historyWithUserNames as BudgetHistoryEntry[];
};

// Mise à jour du budget après une transaction
export const updateBudgetAfterTransaction = async (transaction: {
  amount: number;
  category: string;
  description: string;
  date: string;
  status: TransactionStatus;
  id: string;
}) => {
  // Récupérer le budget actuel
  const { data: budgetData, error: budgetError } = await supabase
    .from("budgets")
    .select("*")
    .limit(1)
    .single();

  if (budgetError) throw budgetError;

  // Mettre à jour le montant dépensé
  const budget = budgetData;
  const updatedBudget = { ...budget };

  // Mise à jour du total dépensé
  updatedBudget.total_spent = Number(budget.total_spent) + Number(transaction.amount);

  // Mise à jour de la catégorie si elle existe
  if (transaction.category && budget.categories && budget.categories[transaction.category]) {
    const categoryBudget = budget.categories[transaction.category];
    categoryBudget.spent = Number(categoryBudget.spent) + Number(transaction.amount);
    categoryBudget.lastUpdated = new Date().toISOString();
    updatedBudget.categories[transaction.category] = categoryBudget;
  }

  // Enregistrer les modifications
  const { error: updateError } = await supabase
    .from("budgets")
    .update(updatedBudget)
    .eq("id", budget.id);

  if (updateError) throw updateError;

  // Enregistrer l'historique de la modification
  const { error: historyError } = await supabase
    .from("budget_history")
    .insert({
      action: "transaction_created",
      details: JSON.stringify({
        transaction_id: transaction.id,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description
      }),
      user_id: "system" // Remplacer par l'ID de l'utilisateur actuel si disponible
    });

  if (historyError) throw historyError;

  return updatedBudget;
};
