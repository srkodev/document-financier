
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TransactionForm from "@/components/transactions/TransactionForm";
import { Button } from "@/components/ui/button";

const Transactions = () => {
  const navigate = useNavigate();
  const [isNewTransactionDialogOpen, setIsNewTransactionDialogOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  const handleTransactionCreated = () => {
    setIsNewTransactionDialogOpen(false);
    setSelectedTransactionId(null);
    // Refresh transactions or other logic here
  };

  const handleEditTransaction = (id: string) => {
    setSelectedTransactionId(id);
    setIsNewTransactionDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Transactions</h1>
          <Button onClick={() => setIsNewTransactionDialogOpen(true)}>
            Nouvelle transaction
          </Button>
        </div>

        {/* Transaction list would go here */}
        <div className="bg-white rounded-lg shadow p-6">
          <p>Liste des transactions...</p>
        </div>

        {/* New Transaction Dialog */}
        {isNewTransactionDialogOpen && (
          <TransactionForm
            open={isNewTransactionDialogOpen}
            onOpenChange={setIsNewTransactionDialogOpen}
            transactionId={selectedTransactionId || undefined}
            onSuccess={handleTransactionCreated}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Transactions;
