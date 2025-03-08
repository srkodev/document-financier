
import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types";

// Fonction pour récupérer tous les articles d'un utilisateur
export const fetchArticles = async () => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error("Utilisateur non authentifié");

    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("user_id", user.data.user.id)
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return data as Article[];
  } catch (error: any) {
    console.error("Error fetching articles:", error);
    return [];
  }
};

// Fonction pour créer un nouvel article
export const createArticle = async (article: Omit<Article, "id" | "created_at" | "updated_at" | "user_id">) => {
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
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      priceHT: data.price_ht,
      vatRate: data.vat_rate,
      created_at: data.created_at,
      updated_at: data.updated_at,
      user_id: data.user_id,
    } as Article;
  } catch (error: any) {
    console.error("Error creating article:", error);
    throw error;
  }
};

// Fonction pour mettre à jour un article
export const updateArticle = async (id: string, article: Partial<Omit<Article, "id" | "created_at" | "updated_at" | "user_id">>) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error("Utilisateur non authentifié");

    const updateData: any = {};
    if (article.name !== undefined) updateData.name = article.name;
    if (article.description !== undefined) updateData.description = article.description;
    if (article.priceHT !== undefined) updateData.price_ht = article.priceHT;
    if (article.vatRate !== undefined) updateData.vat_rate = article.vatRate;

    const { data, error } = await supabase
      .from("articles")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.data.user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      priceHT: data.price_ht,
      vatRate: data.vat_rate,
      created_at: data.created_at,
      updated_at: data.updated_at,
      user_id: data.user_id,
    } as Article;
  } catch (error: any) {
    console.error("Error updating article:", error);
    throw error;
  }
};

// Fonction pour supprimer un article
export const deleteArticle = async (id: string) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error("Utilisateur non authentifié");

    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", id)
      .eq("user_id", user.data.user.id);

    if (error) throw new Error(error.message);
    return true;
  } catch (error: any) {
    console.error("Error deleting article:", error);
    throw error;
  }
};
