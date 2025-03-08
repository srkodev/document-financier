
import React from "react";
import DataCard from "../ui-custom/DataCard";
import StatusBadge from "../ui-custom/StatusBadge";
import { Transaction, TransactionStatus } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  const navigate = useNavigate();
  
  return (
    <DataCard
      title="Transactions récentes"
      description="Les dernières transactions du système"
      footer={
        <Button 
          onClick={() => navigate("/transactions")}
          className="flex items-center gap-2"
          variant="outline"
        >
          Voir toutes les transactions
          <ArrowRight className="h-4 w-4" />
        </Button>
      }
    >
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Aucune transaction récente</p>
        ) : (
          transactions.map((transaction, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <div className="flex flex-col">
                <span className="font-medium">{transaction.description}</span>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(transaction.date, { addSuffix: true, locale: fr })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-semibold ${transaction.amount > 0 ? 'text-status-approved' : 'text-status-rejected'}`}>
                  {transaction.amount.toLocaleString('fr-FR')} €
                </span>
                <StatusBadge status={transaction.status as TransactionStatus} />
              </div>
            </div>
          ))
        )}
      </div>
    </DataCard>
  );
};

export default RecentTransactions;
