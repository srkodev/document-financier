
import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ReimbursementsList from "@/components/reimbursements/ReimbursementsList";

const Reimbursements: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">Demandes de remboursement</h1>
        <p className="text-muted-foreground">
          Gérez vos demandes de remboursement et suivez leur statut.
        </p>
        
        <ReimbursementsList />
      </div>
    </DashboardLayout>
  );
};

export default Reimbursements;
