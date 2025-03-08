
import { supabase } from "@/integrations/supabase/client";
import { ReimbursementRequest } from "@/types";

// Fonction pour récupérer toutes les demandes de remboursement
export const fetchReimbursementRequests = async (status?: string) => {
  try {
    let query = supabase
      .from("reimbursement_requests")
      .select("*, invoices(*)");
    
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data as any[];
  } catch (error: any) {
    console.error("Error fetching reimbursement requests:", error);
    return [];
  }
};

// Fonction pour créer une nouvelle demande de remboursement
export const createReimbursementRequest = async (
  invoiceId: string, 
  amount: number, 
  description: string
) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error("Utilisateur non authentifié");

    const { data, error } = await supabase
      .from("reimbursement_requests")
      .insert({
        invoice_id: invoiceId,
        user_id: user.data.user.id,
        amount: amount,
        description: description,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ReimbursementRequest;
  } catch (error: any) {
    console.error("Error creating reimbursement request:", error);
    throw error;
  }
};

// Fonction pour mettre à jour le statut d'une demande de remboursement
export const updateReimbursementStatus = async (id: string, status: "approved" | "rejected") => {
  try {
    const { data, error } = await supabase
      .from("reimbursement_requests")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ReimbursementRequest;
  } catch (error: any) {
    console.error("Error updating reimbursement status:", error);
    throw error;
  }
};

// Fonction pour supprimer une demande de remboursement
export const deleteReimbursementRequest = async (id: string) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error("Utilisateur non authentifié");

    const { error } = await supabase
      .from("reimbursement_requests")
      .delete()
      .eq("id", id)
      .eq("user_id", user.data.user.id);

    if (error) throw new Error(error.message);
    return true;
  } catch (error: any) {
    console.error("Error deleting reimbursement request:", error);
    throw error;
  }
};
