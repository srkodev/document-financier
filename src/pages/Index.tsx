
import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import BudgetOverview from "@/components/dashboard/BudgetOverview";
import { InvoiceStatus, TransactionStatus } from "@/types";

const Index = () => {
  // Mock data (in a real app, this would come from an API)
  const mockData = {
    totalInvoices: 147,
    pendingInvoices: 23,
    totalSpent: 85600,
    totalBudget: 120000,
    recentTransactions: [
      {
        id: "tx1",
        amount: -2500,
        status: TransactionStatus.COMPLETED,
        date: new Date(2023, 6, 15),
        description: "Achat matériel informatique"
      },
      {
        id: "tx2",
        amount: -750,
        status: TransactionStatus.PENDING,
        date: new Date(2023, 6, 14),
        description: "Frais de déplacement"
      },
      {
        id: "tx3",
        amount: 1200,
        status: TransactionStatus.PROCESSING,
        date: new Date(2023, 6, 12),
        description: "Remboursement client"
      },
      {
        id: "tx4",
        amount: -320,
        status: TransactionStatus.COMPLETED,
        date: new Date(2023, 6, 10),
        description: "Fournitures de bureau"
      }
    ],
    budget: {
      id: "budget1",
      totalAvailable: 120000,
      totalSpent: 85600,
      categories: {
        "Matériel": {
          allocated: 50000,
          spent: 42000
        },
        "Personnel": {
          allocated: 30000,
          spent: 23000
        },
        "Marketing": {
          allocated: 25000,
          spent: 15000
        },
        "Autres": {
          allocated: 15000,
          spent: 5600
        }
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>
        
        <DashboardSummary
          totalInvoices={mockData.totalInvoices}
          pendingInvoices={mockData.pendingInvoices}
          totalSpent={mockData.totalSpent}
          totalBudget={mockData.totalBudget}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentTransactions transactions={mockData.recentTransactions} />
          </div>
          <div>
            <BudgetOverview budget={mockData.budget} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
