
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TransactionForm from "@/components/transactions/TransactionForm";
import { Button } from "@/components/ui/button";
import { fetchTransactions, deleteTransaction } from "@/services/transactionService";
import DataCard from "@/components/ui-custom/DataCard";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@/types";
import { AlertTriangle, Plus, Edit, Trash2 } from "lucide-react";
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
import ProtectedRoute from "@/components/layout/ProtectedRoute";

const Transactions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isNewTransactionDialogOpen, setIsNewTransactionDialogOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await fetchTransactions();
      setTransactions(data);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleTransactionCreated = () => {
    setIsNewTransactionDialogOpen(false);
    setSelectedTransactionId(null);
    loadTransactions();
  };

  const handleEditTransaction = (id: string) => {
    navigate(`/transactions/edit/${id}`);
  };
  
  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return;
    
    try {
      await deleteTransaction(transactionToDelete);
      toast({
        title: "Transaction supprimée",
        description: "La transaction a été supprimée avec succès.",
      });
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
      loadTransactions();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la transaction",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Transactions</h1>
            <Button onClick={() => navigate("/transactions/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle transaction
            </Button>
          </div>

          <DataCard title="Liste des transactions">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-8 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                <h3 className="text-lg font-medium">Aucune transaction</h3>
                <p className="text-muted-foreground">
                  Vous n'avez pas encore créé de transactions.
                </p>
                <Button className="mt-4" onClick={() => navigate("/transactions/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une transaction
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Catégorie</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Montant</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm">{transaction.description}</td>
                        <td className="px-4 py-3 text-sm">{transaction.category || '-'}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          {Number(transaction.amount).toLocaleString('fr-FR')} €
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(transaction.date), 'dd MMM yyyy', { locale: fr })}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditTransaction(transaction.id)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => confirmDelete(transaction.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DataCard>

          {/* Confirmation dialog for deletion */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer la transaction ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. La transaction sera définitivement supprimée.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default Transactions;
