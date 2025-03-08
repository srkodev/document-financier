
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types";

export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return data as Category[];
};

export const createCategory = async (name: string, description: string = ""): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .insert([{
        name,
        description
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creating category:", error);
      throw new Error(error.message);
    }

    return data as Category;
  } catch (error) {
    console.error("Error in createCategory:", error);
    return null;
  }
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting category:", error);
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    console.error("Error in deleteCategory:", error);
    return false;
  }
};

export const updateCategory = async (id: string, name: string, description: string = ""): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .update({
        name,
        description,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating category:", error);
      throw new Error(error.message);
    }

    return data as Category;
  } catch (error) {
    console.error("Error in updateCategory:", error);
    return null;
  }
};
