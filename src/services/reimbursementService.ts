
import { supabase } from "@/integrations/supabase/client";
import { ReimbursementRequest, TransactionStatus } from "@/types";

// Fetch all reimbursement requests
export const fetchReimbursements = async (): Promise<ReimbursementRequest[]> => {
  try {
    const { data, error } = await supabase
      .from("reimbursement_requests")
      .select("*, profiles(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reimbursements:", error);
      throw error;
    }

    return (data || []) as ReimbursementRequest[];
  } catch (error) {
    console.error("Error in fetchReimbursements:", error);
    throw error;
  }
};

// Get reimbursement request by ID
export const getReimbursementById = async (id: string): Promise<ReimbursementRequest | null> => {
  try {
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
  } catch (error) {
    console.error("Error in getReimbursementById:", error);
    return null;
  }
};

// Update reimbursement status
export const updateReimbursementStatus = async (
  id: string,
  status: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("reimbursement_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error(`Error updating reimbursement status:`, error);
      throw error;
    }

    // If the reimbursement is approved, create a transaction
    if (status === "approved") {
      const { data: reimbursement } = await supabase
        .from("reimbursement_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (reimbursement) {
        // Create a transaction for the reimbursement
        const { error: transactionError } = await supabase
          .from("transactions")
          .insert([
            {
              amount: reimbursement.amount,
              description: `Remboursement: ${reimbursement.description}`,
              category: reimbursement.category || "Remboursement",
              date: new Date().toISOString(),
              status: TransactionStatus.COMPLETED,
              user_id: reimbursement.user_id,
              invoice_id: reimbursement.invoice_id
            }
          ]);

        if (transactionError) {
          console.error("Error creating transaction for reimbursement:", transactionError);
        } else {
          // Mettre à jour le budget
          try {
            // Récupérer le budget actuel
            const { data: budgetData, error: budgetError } = await supabase
              .from("budgets")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            if (!budgetError && budgetData) {
              // Mettre à jour le budget de la catégorie
              const categories = budgetData.categories || {};
              const category = reimbursement.category || "Remboursement";
              
              if (categories[category]) {
                categories[category].spent = 
                  (parseFloat(categories[category].spent) || 0) + reimbursement.amount;
                categories[category].lastUpdated = new Date().toISOString();
              }

              // Mettre à jour le budget total dépensé
              const totalSpent = (parseFloat(budgetData.total_spent) || 0) + reimbursement.amount;

              // Enregistrer les modifications
              await supabase
                .from("budgets")
                .update({
                  total_spent: totalSpent,
                  categories: categories
                })
                .eq("id", budgetData.id);
            }
          } catch (budgetError) {
            console.error("Erreur lors de la mise à jour du budget:", budgetError);
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error("Error in updateReimbursementStatus:", error);
    return false;
  }
};

// Delete reimbursement
export const deleteReimbursement = async (id: string): Promise<boolean> => {
  try {
    // First delete attachments
    const { data: attachments } = await supabase
      .from("reimbursement_attachments")
      .select("file_path")
      .eq("reimbursement_id", id);
      
    if (attachments && attachments.length > 0) {
      // Delete files from storage
      for (const attachment of attachments) {
        await supabase.storage
          .from("reimbursement_attachments")
          .remove([attachment.file_path]);
      }
      
      // Delete attachment records
      await supabase
        .from("reimbursement_attachments")
        .delete()
        .eq("reimbursement_id", id);
    }
    
    // Then delete the reimbursement
    const { error } = await supabase
      .from("reimbursement_requests")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting reimbursement:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteReimbursement:", error);
    return false;
  }
};

// Get reimbursement attachments
export const getReimbursementAttachments = async (reimbursementId: string) => {
  try {
    const { data, error } = await supabase
      .from("reimbursement_attachments")
      .select("*")
      .eq("reimbursement_id", reimbursementId);
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error getting reimbursement attachments:", error);
    return [];
  }
};

// Get reimbursement summary
export const getReimbursementSummary = async () => {
  try {
    const { data, error } = await supabase
      .from("reimbursement_requests")
      .select("status, COUNT(*), SUM(amount)")
      .group("status");
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error getting reimbursement summary:", error);
    return [];
  }
};
