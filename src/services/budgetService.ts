
import { supabase } from "@/integrations/supabase/client";
import { Budget, BudgetHistoryEntry } from "@/types";

// Fonction pour récupérer le budget actuel
export const fetchBudget = async (): Promise<Budget> => {
  try {
    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Aucun budget trouvé, renvoyer un budget par défaut
        return {
          id: "default",
          totalAvailable: 0,
          totalSpent: 0,
          categories: {}
        };
      }
      throw new Error(error.message);
    }

    return mapToBudget(data);
  } catch (error) {
    console.error("Error fetching budget:", error);
    return {
      id: "default",
      totalAvailable: 0,
      totalSpent: 0,
      categories: {}
    };
  }
};

// Fonction pour mettre à jour le budget
export const updateBudget = async (budget: Budget): Promise<Budget> => {
  // Si c'est un nouveau budget (sans ID ou avec ID par défaut)
  if (!budget.id || budget.id === "default") {
    const { data, error } = await supabase
      .from("budgets")
      .insert({
        total_available: budget.totalAvailable,
        total_spent: budget.totalSpent,
        categories: budget.categories,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapToBudget(data);
  } 
  // Sinon, c'est une mise à jour
  else {
    const { data, error } = await supabase
      .from("budgets")
      .update({
        total_available: budget.totalAvailable,
        total_spent: budget.totalSpent,
        categories: budget.categories,
        updated_at: new Date().toISOString(),
      })
      .eq("id", budget.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapToBudget(data);
  }
};

// Fonction pour récupérer l'historique des modifications du budget
export const fetchBudgetHistory = async (): Promise<BudgetHistoryEntry[]> => {
  try {
    const { data, error } = await supabase
      .from("budget_history")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data as BudgetHistoryEntry[];
  } catch (error) {
    console.error("Error fetching budget history:", error);
    return [];
  }
};

// Fonction pour enregistrer une modification dans l'historique
export const saveBudgetHistoryEntry = async (description: string, details: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("budget_history")
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: description,
        details: details,
      });

    if (error) throw new Error(error.message);
    return true;
  } catch (error) {
    console.error("Error saving budget history:", error);
    return false;
  }
};

// Fonction utilitaire pour convertir les données de la base en objet Budget
const mapToBudget = (data: any): Budget => {
  return {
    id: data.id,
    totalAvailable: data.total_available,
    totalSpent: data.total_spent,
    categories: data.categories || {},
    fiscalYear: data.fiscal_year,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};
