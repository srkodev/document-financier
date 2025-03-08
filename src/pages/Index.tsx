
import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import BudgetOverview from "@/components/dashboard/BudgetOverview";
import { Budget, Transaction, InvoiceStatus } from "@/types";
import { fetchBudget } from "@/services/budgetService";
import { fetchTransactions } from "@/services/transactionService";
import { fetchInvoices } from "@/services/invoiceService";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const Index = () => {
  const { toast } = useToast();

  // Fetch budget data with React Query
  const { data: budgetData, isLoading: budgetLoading } = useQuery({
    queryKey: ['budget'],
    queryFn: fetchBudget,
    meta: {
      onError: (error: Error) => {
        console.error("Error loading budget data:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du budget",
          variant: "destructive",
        });
      }
    }
  });

  // Fetch transactions with React Query
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
    meta: {
      onError: (error: Error) => {
        console.error("Error loading transactions:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les transactions",
          variant: "destructive",
        });
      }
    }
  });

  // Fetch invoices for summary with React Query
  const { data: allInvoices = [], isLoading: allInvoicesLoading } = useQuery({
    queryKey: ['invoices', 'all'],
    queryFn: () => fetchInvoices(),
    meta: {
      onError: (error: Error) => {
        console.error("Error loading invoices:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les factures",
          variant: "destructive",
        });
      }
    }
  });

  // Fetch pending invoices with React Query
  const { data: pendingInvoices = [], isLoading: pendingInvoicesLoading } = useQuery({
    queryKey: ['invoices', 'pending'],
    queryFn: () => fetchInvoices(InvoiceStatus.PENDING),
    meta: {
      onError: (error: Error) => {
        console.error("Error loading pending invoices:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les factures en attente",
          variant: "destructive",
        });
      }
    }
  });

  const isLoading = budgetLoading || transactionsLoading || allInvoicesLoading || pendingInvoicesLoading;
  const recentTransactions = transactions.slice(0, 5); // Show only 5 most recent

  const dashboardData = {
    totalInvoices: allInvoices.length,
    pendingInvoices: pendingInvoices.length,
    totalSpent: budgetData?.total_spent || 0,
    totalBudget: budgetData?.total_available || 0
  };

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
              {budgetData && <BudgetOverview budget={budgetData} />}
              {!budgetData && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-medium mb-4">Budget Vue d'ensemble</h2>
                  <p className="text-muted-foreground">Aucune donnée de budget disponible</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Index;
