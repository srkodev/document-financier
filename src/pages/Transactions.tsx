
import React, { useState } from "react";
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
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TransactionStatus } from "@/types";

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Mock data (in a real app, this would come from an API)
  const mockTransactions = [
    {
      id: "TX001",
      invoiceId: "INV001",
      amount: -2500,
      status: TransactionStatus.COMPLETED,
      date: new Date(2023, 6, 15),
      description: "Achat matériel informatique",
      category: "Matériel"
    },
    {
      id: "TX002",
      invoiceId: "INV002",
      amount: -750,
      status: TransactionStatus.PENDING,
      date: new Date(2023, 6, 14),
      description: "Frais de déplacement",
      category: "Voyage"
    },
    {
      id: "TX003",
      invoiceId: "INV003",
      amount: 1200,
      status: TransactionStatus.PROCESSING,
      date: new Date(2023, 6, 12),
      description: "Remboursement client",
      category: "Remboursement"
    },
    {
      id: "TX004",
      invoiceId: "INV004",
      amount: -320,
      status: TransactionStatus.COMPLETED,
      date: new Date(2023, 6, 10),
      description: "Fournitures de bureau",
      category: "Fournitures"
    },
    {
      id: "TX005",
      invoiceId: "INV005",
      amount: -890,
      status: TransactionStatus.CANCELLED,
      date: new Date(2023, 6, 8),
      description: "Équipement de présentation",
      category: "Matériel"
    },
    {
      id: "TX006",
      amount: 5000,
      status: TransactionStatus.COMPLETED,
      date: new Date(2023, 6, 5),
      description: "Ajout de budget",
      category: "Budget"
    }
  ];
  
  // Filter transactions based on search term
  const filteredTransactions = mockTransactions.filter(transaction => 
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
            
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              <span>Filtrer</span>
            </Button>
            
            <Button className="gap-2">
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
                  {Math.abs(
                    mockTransactions
                      .filter(t => t.amount < 0)
                      .reduce((sum, t) => sum + t.amount, 0)
                  ).toLocaleString('fr-FR')} €
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
                  {mockTransactions
                    .filter(t => t.amount > 0)
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toLocaleString('fr-FR')} €
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
                  {mockTransactions
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toLocaleString('fr-FR')} €
                </p>
              </div>
              <div className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm">
                <ArrowDownLeft className="h-8 w-8 text-primary" />
              </div>
            </div>
          </DataCard>
        </div>
        
        <DataCard title="Liste des transactions">
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
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted-foreground">
                      Aucune transaction trouvée
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction, index) => (
                    <tr key={index} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
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
                        {format(transaction.date, 'dd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <StatusBadge status={transaction.status} />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-secondary rounded-full text-xs">
                          {transaction.category}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DataCard>
      </div>
    </DashboardLayout>
  );
};

export default Transactions;
