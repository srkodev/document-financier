
import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types";

export const fetchArticles = async (): Promise<Article[]> => {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching articles:", error);
    throw new Error(error.message);
  }

  // Transformer les données pour ajouter les propriétés en camelCase pour compatibilité
  return data.map(article => ({
    ...article,
    priceHT: article.price_ht,
    vatRate: article.vat_rate
  })) as Article[];
};
