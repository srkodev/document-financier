
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import BudgetOverview from "@/components/dashboard/BudgetOverview";
import { Budget, Transaction, InvoiceStatus, TransactionStatus, Invoice } from "@/types";
import { fetchBudget } from "@/services/budgetService";
import { fetchTransactions } from "@/services/transactionService";
import { fetchInvoices } from "@/services/invoiceService";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalInvoices: 0,
    pendingInvoices: 0,
    totalSpent: 0,
    totalBudget: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [budgetData, setBudgetData] = useState<Budget>({
    id: "budget1",
    totalAvailable: 0,
    totalSpent: 0,
    categories: {}
  });

  const { toast } = useToast();

  // Load data from database
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch budget data
        const budget = await fetchBudget();
        setBudgetData(budget);

        // Fetch recent transactions
        const transactions = await fetchTransactions();
        setRecentTransactions(transactions.slice(0, 5)); // Show only 5 most recent

        // Fetch invoices for summary
        const allInvoices = await fetchInvoices();
        const pendingInvoices = await fetchInvoices(InvoiceStatus.PENDING);

        // Update dashboard data
        setDashboardData({
          totalInvoices: allInvoices.length,
          pendingInvoices: pendingInvoices.length,
          totalSpent: budget.totalSpent,
          totalBudget: budget.totalAvailable
        });

      } catch (error: any) {
        console.error("Error loading dashboard data:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du tableau de bord",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <DashboardSummary 
              totalInvoices={dashboardData.totalInvoices}
              pendingInvoices={dashboardData.pendingInvoices}
              totalSpent={dashboardData.totalSpent}
              totalBudget={dashboardData.totalBudget}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <RecentTransactions transactions={recentTransactions} />
              <BudgetOverview budget={budgetData} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Index;
