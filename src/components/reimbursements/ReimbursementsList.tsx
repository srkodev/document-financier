
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ReimbursementRequest, Invoice } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { PlusCircle, X, CheckCheck, Clock, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import ReimbursementForm from "./ReimbursementForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Type pour les données jointes
interface ReimbursementWithInvoice extends ReimbursementRequest {
  invoice: Invoice;
}

// Fonction pour récupérer les demandes avec les factures associées
const fetchReimbursements = async (user_id: string, isAdmin: boolean) => {
  // Construire la requête base
  let query = supabase
    .from("reimbursement_requests")
    .select(`
      *,
      invoice:invoices (*)
    `);

  // Filtrer par utilisateur si pas admin
  if (!isAdmin) {
    query = query.eq("user_id", user_id);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;

  // Transformer les données pour respecter l'interface
  return data.map((item) => ({
    id: item.id,
    invoice_id: item.invoice_id,
    user_id: item.user_id,
    amount: item.amount,
    status: item.status,
    description: item.description,
    created_at: item.created_at,
    updated_at: item.updated_at,
    invoice: item.invoice
  })) as ReimbursementWithInvoice[];
};

const ReimbursementsList: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);

  const queryClient = useQueryClient();
  
  const { data: reimbursements = [], isLoading, error } = useQuery({
    queryKey: ["reimbursements", user?.id, isAdmin],
    queryFn: () => fetchReimbursements(user?.id || "", isAdmin),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reimbursement_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reimbursements"] });
      toast({
        title: "Demande supprimée",
        description: "La demande de remboursement a été supprimée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("reimbursement_requests")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reimbursements"] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la demande a été mis à jour avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    setRequestToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (requestToDelete) {
      deleteMutation.mutate(requestToDelete);
      setDeleteDialogOpen(false);
      setRequestToDelete(null);
    }
  };

  const handleUpdateStatus = (id: string, status: "approved" | "rejected") => {
    updateStatusMutation.mutate({ id, status });
  };

  const filteredReimbursements = reimbursements.filter((reimbursement) =>
    reimbursement.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reimbursement.invoice.number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Approuvée</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rejetée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-destructive/20 rounded-md">
        <p className="text-destructive">Erreur: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative w-full sm:w-auto flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une demande..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouvelle demande
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredReimbursements.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? "Aucune demande ne correspond à votre recherche" : "Aucune demande de remboursement. Créez votre première demande !"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReimbursements.map((reimbursement) => (
            <Card key={reimbursement.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Demande du {format(new Date(reimbursement.created_at), "dd MMMM yyyy", { locale: fr })}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Facture n° {reimbursement.invoice.number}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(reimbursement.status)}
                    {reimbursement.status === "pending" && !isAdmin && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(reimbursement.id)}>
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm font-medium">Montant</p>
                      <p className="text-lg font-semibold">{reimbursement.amount.toFixed(2)} €</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Date</p>
                      <p>{format(new Date(reimbursement.created_at), "dd/MM/yyyy")}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Justification</p>
                    <p className="text-sm">{reimbursement.description}</p>
                  </div>
                  
                  {isAdmin && reimbursement.status === "pending" && (
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-500 text-red-500 hover:bg-red-50"
                        onClick={() => handleUpdateStatus(reimbursement.id, "rejected")}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Rejeter
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-green-500 text-green-500 hover:bg-green-50"
                        onClick={() => handleUpdateStatus(reimbursement.id, "approved")}
                      >
                        <CheckCheck className="mr-1 h-4 w-4" />
                        Approuver
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ReimbursementForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["reimbursements"] })}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette demande ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La demande sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReimbursementsList;
