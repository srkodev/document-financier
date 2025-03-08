
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TransactionFormComponent from "@/components/transactions/TransactionForm";

const TransactionForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">
          {id ? "Modifier la transaction" : "Nouvelle transaction"}
        </h1>
        
        <Card>
          <CardHeader>
            <CardTitle>{id ? "Modifier la transaction" : "Créer une nouvelle transaction"}</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionFormComponent 
              transactionId={id} 
              onSuccess={() => {
                navigate("/transactions");
              }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TransactionForm;
