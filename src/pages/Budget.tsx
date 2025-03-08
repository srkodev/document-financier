
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BudgetHistory from "@/components/budget/BudgetHistory";
import BudgetAnalytics from "@/components/budget/BudgetAnalytics";
import BudgetManagement from "@/components/budget/BudgetManagement";
import CategoryManager from "@/components/categories/CategoryManager";
import { fetchBudget } from "@/services/budgetService";
import { Budget } from "@/types";
import { useToast } from "@/hooks/use-toast";

const BudgetPage = () => {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadBudget = async () => {
      try {
        setLoading(true);
        const data = await fetchBudget();
        setBudget(data);
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: error.message || "Impossible de charger les données du budget",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadBudget();
  }, [toast]);

  return (
    <ProtectedRoute requireRespPole>
      <DashboardLayout>
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold mb-6">Budget</h1>
          
          <Tabs defaultValue="management" className="w-full space-y-6">
            <TabsList className="mb-4">
              <TabsTrigger value="management">Gestion</TabsTrigger>
              <TabsTrigger value="categories">Catégories</TabsTrigger>
              <TabsTrigger value="analytics">Analyse</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>
            
            <TabsContent value="management" className="mt-0">
              <BudgetManagement />
            </TabsContent>
            
            <TabsContent value="categories" className="mt-0">
              <CategoryManager />
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-0">
              {budget && <BudgetAnalytics budget={budget} />}
              {loading && (
                <div className="flex justify-center items-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              )}
              {!loading && !budget && (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">Aucune donnée de budget disponible</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="mt-0">
              <BudgetHistory />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default BudgetPage;
