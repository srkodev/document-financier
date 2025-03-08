
import { supabase } from "@/integrations/supabase/client";
import { ReimbursementRequest } from "@/types";
import { createTransaction } from "@/services/transactionService";

export const fetchReimbursements = async (): Promise<ReimbursementRequest[]> => {
  const { data, error } = await supabase
    .from("reimbursement_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reimbursements:", error);
    throw error;
  }

  return data || [];
};

export const getReimbursementById = async (id: string): Promise<ReimbursementRequest | null> => {
  const { data, error } = await supabase
    .from("reimbursement_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching reimbursement with ID ${id}:`, error);
    return null;
  }

  return data as ReimbursementRequest;
};

export const createReimbursementRequest = async (
  reimbursement: Omit<ReimbursementRequest, "id" | "created_at" | "updated_at">
): Promise<ReimbursementRequest | null> => {
  try {
    const { data, error } = await supabase
      .from("reimbursement_requests")
      .insert([reimbursement])
      .select()
      .single();

    if (error) throw error;
    return data as ReimbursementRequest;
  } catch (error) {
    console.error("Error creating reimbursement request:", error);
    throw error;
  }
};

export const updateReimbursementStatus = async (
  id: string,
  status: string,
  description?: string
): Promise<ReimbursementRequest | null> => {
  try {
    const { data, error } = await supabase
      .from("reimbursement_requests")
      .update({
        status,
        description: description || undefined,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    
    // Si le remboursement est approuvé, créons une transaction correspondante
    if (status === "approved") {
      const reimbursement = data as ReimbursementRequest;
      
      try {
        // Créer une transaction correspondant au remboursement
        await createTransaction({
          amount: reimbursement.amount,
          description: `Remboursement approuvé: ${reimbursement.description || 'Sans description'}`,
          category: reimbursement.category || 'Remboursements',
          date: new Date().toISOString(),
          status: "completed",
          invoice_id: reimbursement.invoice_id
        });
        
        console.log("Transaction créée pour le remboursement:", reimbursement.id);
      } catch (transactionError) {
        console.error("Erreur lors de la création de la transaction pour le remboursement:", transactionError);
        // On continue néanmoins le processus, le remboursement est approuvé même si la transaction échoue
      }
    }
    
    return data as ReimbursementRequest;
  } catch (error) {
    console.error("Error updating reimbursement status:", error);
    throw error;
  }
};

export const deleteReimbursementRequest = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("reimbursement_requests")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting reimbursement request:", error);
    return false;
  }
};

export const getReimbursementSummary = async (): Promise<{
  totalCount: number;
  pendingCount: number;
  totalAmount: number;
}> => {
  try {
    const { data, error } = await supabase
      .from("reimbursement_requests")
      .select("*");

    if (error) throw error;

    const reimbursements = data || [];
    const totalAmount = reimbursements.reduce(
      (sum, request) => sum + Number(request.amount),
      0
    );
    const pendingCount = reimbursements.filter(
      (request) => request.status === "pending"
    ).length;

    return {
      totalCount: reimbursements.length,
      pendingCount,
      totalAmount,
    };
  } catch (error) {
    console.error("Error in getReimbursementSummary:", error);
    return {
      totalCount: 0,
      pendingCount: 0,
      totalAmount: 0,
    };
  }
};
