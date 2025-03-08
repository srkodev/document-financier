
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DataCard from "@/components/ui-custom/DataCard";
import StatusBadge from "@/components/ui-custom/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Plus, 
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Edit,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TransactionStatus, Transaction } from "@/types";
import { fetchTransactions, createTransaction, updateTransaction, deleteTransaction } from "@/services/transactionService";
import { useToast } from "@/hooks/use-toast";
import TransactionForm from "@/components/transactions/TransactionForm";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TransactionsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const { toast } = useToast();
  
  // Get unique categories from transactions
  const categories = Array.from(new Set(transactions.map(t => t.category || "Autre").filter(Boolean)));
  
  useEffect(() => {
    loadTransactions();
  }, [activeTab, selectedCategory, searchTerm]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const status = activeTab !== "all" ? activeTab as TransactionStatus : undefined;
      const category = selectedCategory !== "all" ? selectedCategory : undefined;
      const data = await fetchTransactions(status, searchTerm, category);
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleDelete = async () => {
    if (!selectedTransactionId) return;

    try {
      await deleteTransaction(selectedTransactionId);
      toast({
        title: "Transaction supprimée",
        description: "La transaction a été supprimée avec succès.",
      });
      setDeleteDialogOpen(false);
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
    setSelectedTransactionId(id);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsFormOpen(true);
  };
  
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setActiveTab("all");
  };
  
  const calculateTotals = () => {
    const filteredTransactions = transactions;
    
    const expenses = filteredTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const income = filteredTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const balance = filteredTransactions
      .reduce((sum, t) => sum + t.amount, 0);
      
    return { expenses, income, balance };
  };
  
  const { expenses, income, balance } = calculateTotals();
  
  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">Historique de toutes les transactions</p>
          </div>
          
          <div className="flex gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Rechercher..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button variant="outline" className="gap-2" onClick={resetFilters}>
              <Filter className="h-4 w-4" />
              <span>Réinitialiser</span>
            </Button>
            
            <Button 
              className="gap-2" 
              onClick={() => {
                setSelectedTransaction(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              <span>Nouvelle transaction</span>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <DataCard
            title="Total des dépenses"
            description="Somme de toutes les dépenses"
            className="bg-rose-50 dark:bg-rose-900/20 border-none"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-semibold text-status-rejected">
                  {expenses.toLocaleString('fr-FR')} €
                </p>
              </div>
              <div className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm">
                <ArrowUpRight className="h-8 w-8 text-status-rejected" />
              </div>
            </div>
          </DataCard>
          
          <DataCard
            title="Total des entrées"
            description="Somme de toutes les entrées"
            className="bg-emerald-50 dark:bg-emerald-900/20 border-none"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-semibold text-status-approved">
                  {income.toLocaleString('fr-FR')} €
                </p>
              </div>
              <div className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm">
                <ArrowDownLeft className="h-8 w-8 text-status-approved" />
              </div>
            </div>
          </DataCard>
          
          <DataCard
            title="Solde net"
            description="Différence entre entrées et sorties"
            className="bg-blue-50 dark:bg-blue-900/20 border-none"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-semibold">
                  {balance.toLocaleString('fr-FR')} €
                </p>
              </div>
              <div className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm">
                <ArrowDownLeft className="h-8 w-8 text-primary" />
              </div>
            </div>
          </DataCard>
        </div>
        
        <DataCard title="Liste des transactions">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value={TransactionStatus.COMPLETED}>Terminées</TabsTrigger>
                <TabsTrigger value={TransactionStatus.PENDING}>En attente</TabsTrigger>
                <TabsTrigger value={TransactionStatus.CANCELLED}>Annulées</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex gap-3">
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Montant</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Catégorie</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted-foreground">
                      Aucune transaction trouvée
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm">{transaction.id}</td>
                      <td className="px-4 py-3 text-sm">{transaction.description}</td>
                      <td className={`px-4 py-3 text-sm font-medium ${
                        transaction.amount > 0 
                          ? 'text-status-approved' 
                          : 'text-status-rejected'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}
                        {transaction.amount.toLocaleString('fr-FR')} €
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {format(new Date(transaction.date), 'dd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <StatusBadge status={transaction.status} />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-secondary rounded-full text-xs">
                          {transaction.category || "Autre"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Modifier" 
                            onClick={() => handleEdit(transaction)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Supprimer" 
                            onClick={() => confirmDelete(transaction.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DataCard>
      </div>
      
      <TransactionForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        onSuccess={loadTransactions}
        transaction={selectedTransaction}
      />
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cette transaction sera définitivement supprimée et le budget sera mis à jour en conséquence.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default TransactionsPage;
