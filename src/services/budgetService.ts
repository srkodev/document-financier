
import { supabase } from "@/integrations/supabase/client";
import { Budget, BudgetCategory, BudgetHistoryEntry } from "@/types";
import { Json } from "@/integrations/supabase/types";

// Function to fetch the current budget
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
        // No budget found, return a default budget
        return {
          id: "default",
          total_available: 0,
          total_spent: 0,
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
      total_available: 0,
      total_spent: 0,
      categories: {}
    };
  }
};

// Function to update the budget
export const updateBudget = async (budget: Budget): Promise<Budget> => {
  // Convert categories to JSON compatible with Supabase
  const categoriesJson = convertCategoriesToJson(budget.categories || {});
  
  // If it's a new budget (without ID or with default ID)
  if (!budget.id || budget.id === "default") {
    const { data, error } = await supabase
      .from("budgets")
      .insert({
        total_available: budget.total_available,
        total_spent: budget.total_spent,
        categories: categoriesJson,
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
        total_available: budget.total_available,
        total_spent: budget.total_spent,
        categories: categoriesJson,
        updated_at: new Date().toISOString(),
      })
      .eq("id", budget.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapToBudget(data);
  }
};

// Convert budget categories to JSON format compatible with Supabase
const convertCategoriesToJson = (categories: Record<string, BudgetCategory>): Json => {
  // Create a simple object that can be serialized to JSON
  const jsonCategories: Record<string, any> = {};
  
  Object.entries(categories).forEach(([key, category]) => {
    jsonCategories[key] = {
      allocated: category.allocated,
      spent: category.spent,
      description: category.description || '',
      lastUpdated: category.lastUpdated || new Date().toISOString()
    };
  });
  
  return jsonCategories as Json;
};

// Function to fetch budget history
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

// Function to save a history entry
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

// Utility function to convert database data to Budget object
const mapToBudget = (data: any): Budget => {
  // Convert JSON categories to BudgetCategory objects
  const categories: Record<string, BudgetCategory> = {};
  
  if (data.categories) {
    Object.entries(data.categories as Record<string, any>).forEach(([key, value]) => {
      categories[key] = {
        allocated: value.allocated || 0,
        spent: value.spent || 0,
        description: value.description || '',
        lastUpdated: value.lastUpdated || new Date().toISOString()
      };
    });
  }
  
  return {
    id: data.id,
    total_available: data.total_available,
    total_spent: data.total_spent,
    categories: categories,
    fiscal_year: data.fiscal_year,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
};
