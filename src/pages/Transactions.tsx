
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
import { fetchTransactions, deleteTransaction } from "@/services/transactionService";
import { CalendarIcon, Edit, Trash, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TransactionStatus, Transaction } from "@/types";
import { useToast } from "@/hooks/use-toast";
import TransactionForm from "@/components/transactions/TransactionForm";

const TransactionsPage: React.FC = () => {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
  });

  const handleEdit = (id: string) => {
    setEditingTransactionId(id);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setSelectedTransactionId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTransactionId) return;

    try {
      await deleteTransaction(selectedTransactionId);
      toast({
        title: "Transaction supprimée",
        description: "La transaction a été supprimée avec succès",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedTransactionId(null);
    }
  };

  const addNewTransaction = () => {
    setEditingTransactionId(null);
    setIsFormOpen(true);
  };

  const onFormSuccess = () => {
    refetch();
    setIsFormOpen(false);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    if (activeTab === "all") return true;
    return transaction.status === activeTab;
  });

  const getStatusBadgeClass = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return "bg-green-100 text-green-800";
      case TransactionStatus.CANCELLED:
        return "bg-red-100 text-red-800";
      case TransactionStatus.PENDING:
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Transactions</h1>
          <Button onClick={addNewTransaction} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle transaction
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des transactions</CardTitle>
            <CardDescription>Historique de toutes les transactions financières</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value={TransactionStatus.PENDING}>En attente</TabsTrigger>
                <TabsTrigger value={TransactionStatus.COMPLETED}>Terminées</TabsTrigger>
                <TabsTrigger value={TransactionStatus.CANCELLED}>Annulées</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                {renderTransactionsTable()}
              </TabsContent>
              <TabsContent value={TransactionStatus.PENDING} className="mt-0">
                {renderTransactionsTable()}
              </TabsContent>
              <TabsContent value={TransactionStatus.COMPLETED} className="mt-0">
                {renderTransactionsTable()}
              </TabsContent>
              <TabsContent value={TransactionStatus.CANCELLED} className="mt-0">
                {renderTransactionsTable()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <TransactionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        transactionId={editingTransactionId || undefined}
        onSuccess={onFormSuccess}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement la transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );

  function renderTransactionsTable() {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (filteredTransactions.length === 0) {
      return (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">Aucune transaction trouvée</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Description</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Montant</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Catégorie</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Date</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Statut</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-muted/50">
                <td className="py-3 px-4 align-top">{transaction.description}</td>
                <td className="py-3 px-4 font-medium">
                  {parseFloat(transaction.amount.toString()).toFixed(2)} €
                </td>
                <td className="py-3 px-4">{transaction.category || "-"}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                    <span>{format(new Date(transaction.date), "dd MMMM yyyy", { locale: fr })}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                      transaction.status
                    )}`}
                  >
                    {transaction.status === TransactionStatus.COMPLETED
                      ? "Terminée"
                      : transaction.status === TransactionStatus.CANCELLED
                      ? "Annulée"
                      : "En attente"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(transaction.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(transaction.id)}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
};

export default TransactionsPage;
