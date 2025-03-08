
import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types";

// Function to map database fields to our Article model
const mapToArticle = (item: any): Article => ({
  id: item.id,
  name: item.name,
  description: item.description,
  price_ht: item.price_ht,
  vat_rate: item.vat_rate,
  created_at: item.created_at,
  user_id: item.user_id,
});

// Function to fetch all articles
export const fetchArticles = async (): Promise<Article[]> => {
  try {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return data as Article[];
  } catch (error: any) {
    console.error("Error fetching articles:", error);
    return [];
  }
};

// Function to create a new article
export const createArticle = async (article: Omit<Article, "id" | "created_at" | "user_id">): Promise<Article> => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error("Utilisateur non authentifié");

    const { data, error } = await supabase
      .from("articles")
      .insert({
        name: article.name,
        description: article.description || "",
        price_ht: article.price_ht,
        vat_rate: article.vat_rate,
        user_id: user.data.user.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    return data as Article;
  } catch (error: any) {
    console.error("Error creating article:", error);
    throw error;
  }
};

// Function to update an article
export const updateArticle = async (id: string, article: Partial<Omit<Article, "id" | "created_at" | "user_id">>): Promise<Article> => {
  try {
    const updateData: any = {};
    if (article.name !== undefined) updateData.name = article.name;
    if (article.description !== undefined) updateData.description = article.description;
    if (article.price_ht !== undefined) updateData.price_ht = article.price_ht;
    if (article.vat_rate !== undefined) updateData.vat_rate = article.vat_rate;

    const { data, error } = await supabase
      .from("articles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    return data as Article;
  } catch (error: any) {
    console.error("Error updating article:", error);
    throw error;
  }
};

// Function to delete an article
export const deleteArticle = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
    return true;
  } catch (error: any) {
    console.error("Error deleting article:", error);
    throw error;
  }
};
