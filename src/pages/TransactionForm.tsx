
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TransactionForm from "@/components/transactions/TransactionForm";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

const TransactionFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const handleSuccess = () => {
    navigate("/transactions");
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">
            {id ? "Modifier la transaction" : "Nouvelle transaction"}
          </h1>
          
          <div className="bg-white rounded-lg shadow p-6">
            <TransactionForm 
              onSuccess={handleSuccess}
              transactionId={id}
            />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default TransactionFormPage;
