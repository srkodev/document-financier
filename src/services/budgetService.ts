
import { supabase } from "@/integrations/supabase/client";
import { TransactionStatus } from "@/types";

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

export * from "@/services/budgetService";
