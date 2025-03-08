
import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BudgetHistory from "@/components/budget/BudgetHistory";
import BudgetAnalytics from "@/components/budget/BudgetAnalytics";
import BudgetManagement from "@/components/budget/BudgetManagement";

const BudgetPage = () => {
  return (
    <ProtectedRoute requireRespPole>
      <DashboardLayout>
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold mb-6">Budget</h1>
          
          <Tabs defaultValue="management" className="w-full space-y-6">
            <TabsList className="mb-4">
              <TabsTrigger value="management">Gestion</TabsTrigger>
              <TabsTrigger value="analytics">Analyse</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>
            
            <TabsContent value="management" className="mt-0">
              <BudgetManagement />
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-0">
              <BudgetAnalytics />
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
