
import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types";

// Transformation des données de la base vers notre modèle Article
const mapToArticle = (item: any): Article => ({
  id: item.id,
  name: item.name,
  description: item.description,
  priceHT: item.price_ht,
  vatRate: item.vat_rate,
  created_at: item.created_at,
  updated_at: item.updated_at,
  user_id: item.user_id,
});

// Fonction pour récupérer tous les articles
export const fetchArticles = async (): Promise<Article[]> => {
  try {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return data.map(mapToArticle);
  } catch (error: any) {
    console.error("Error fetching articles:", error);
    return [];
  }
};

// Fonction pour créer un nouvel article
export const createArticle = async (article: Omit<Article, "id" | "created_at" | "updated_at" | "user_id">): Promise<Article> => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error("Utilisateur non authentifié");

    const { data, error } = await supabase
      .from("articles")
      .insert({
        name: article.name,
        description: article.description || "",
        price_ht: article.priceHT,
        vat_rate: article.vatRate,
        user_id: user.data.user.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    return mapToArticle(data);
  } catch (error: any) {
    console.error("Error creating article:", error);
    throw error;
  }
};

// Fonction pour mettre à jour un article
export const updateArticle = async (id: string, article: Partial<Omit<Article, "id" | "created_at" | "updated_at" | "user_id">>): Promise<Article> => {
  try {
    const updateData: any = {};
    if (article.name !== undefined) updateData.name = article.name;
    if (article.description !== undefined) updateData.description = article.description;
    if (article.priceHT !== undefined) updateData.price_ht = article.priceHT;
    if (article.vatRate !== undefined) updateData.vat_rate = article.vatRate;

    const { data, error } = await supabase
      .from("articles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    return mapToArticle(data);
  } catch (error: any) {
    console.error("Error updating article:", error);
    throw error;
  }
};

// Fonction pour supprimer un article
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
