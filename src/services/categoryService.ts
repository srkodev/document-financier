
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

export const createCategory = async (name: string, description: string = ""): Promise<Category> => {
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name,
      description,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Category;
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
};

export const updateCategory = async (id: string, name: string, description: string = ""): Promise<Category> => {
  const { data, error } = await supabase
    .from("categories")
    .update({
      name,
      description,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Category;
};
