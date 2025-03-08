
import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ArticlesList from "@/components/articles/ArticlesList";

const Articles: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">Articles & Services</h1>
        <p className="text-muted-foreground">
          Gérez vos articles et services pour les utiliser facilement lors de la création de factures.
        </p>
        
        <ArticlesList />
      </div>
    </DashboardLayout>
  );
};

export default Articles;
