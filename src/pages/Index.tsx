
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import BudgetOverview from "@/components/dashboard/BudgetOverview";
import { Budget, Transaction, InvoiceStatus, TransactionStatus } from "@/types";

const Index = () => {
  // State for data that would normally come from an API
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

  // Mock API request to get dashboard data
  useEffect(() => {
    // Simulate API delay
    const loadData = setTimeout(() => {
      // Dashboard summary data
      setDashboardData({
        totalInvoices: 75,
        pendingInvoices: 12,
        totalSpent: 28000,
        totalBudget: 50000
      });

      // Recent transactions
      setRecentTransactions([
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
        }
      ]);

      // Budget data
      setBudgetData({
        id: "budget1",
        totalAvailable: 50000,
        totalSpent: 28000,
        categories: {
          "Matériel": { allocated: 20000, spent: 15000 },
          "Voyages": { allocated: 15000, spent: 7000 },
          "Fournitures": { allocated: 8000, spent: 4000 },
          "Services": { allocated: 5000, spent: 2000 },
          "Divers": { allocated: 2000, spent: 0 }
        }
      });

      setIsLoading(false);
    }, 1000);

    // Cleanup function
    return () => clearTimeout(loadData);
  }, []);

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
