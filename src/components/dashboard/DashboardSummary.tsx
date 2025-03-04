
import React from "react";
import DataCard from "../ui-custom/DataCard";
import { TrendingUp, TrendingDown, FileText, AlertCircle } from "lucide-react";

interface DashboardSummaryProps {
  totalInvoices: number;
  pendingInvoices: number;
  totalSpent: number;
  totalBudget: number;
}

const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  totalInvoices,
  pendingInvoices,
  totalSpent,
  totalBudget
}) => {
  const cards = [
    {
      title: "Budget disponible",
      value: `${(totalBudget - totalSpent).toLocaleString('fr-FR')} €`,
      description: `sur ${totalBudget.toLocaleString('fr-FR')} €`,
      icon: <TrendingUp className="h-8 w-8 text-status-approved" />,
      percentUsed: Math.round((totalSpent / totalBudget) * 100),
      color: "bg-green-50 dark:bg-green-900/20"
    },
    {
      title: "Dépenses totales",
      value: `${totalSpent.toLocaleString('fr-FR')} €`,
      description: `${Math.round((totalSpent / totalBudget) * 100)}% du budget utilisé`,
      icon: <TrendingDown className="h-8 w-8 text-status-processing" />,
      color: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Factures enregistrées",
      value: totalInvoices.toString(),
      description: "Factures totales dans le système",
      icon: <FileText className="h-8 w-8 text-primary" />,
      color: "bg-primary-50 dark:bg-primary-900/20"
    },
    {
      title: "Factures en attente",
      value: pendingInvoices.toString(),
      description: "Factures nécessitant une action",
      icon: <AlertCircle className="h-8 w-8 text-status-pending" />,
      color: "bg-yellow-50 dark:bg-yellow-900/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <DataCard
          key={index}
          title={card.title}
          description={card.description}
          className={`${card.color} border-none`}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-2xl font-semibold">{card.value}</p>
            </div>
            <div className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm">
              {card.icon}
            </div>
          </div>
          
          {card.percentUsed !== undefined && (
            <div className="mt-4">
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${card.percentUsed}%` }}
                />
              </div>
            </div>
          )}
        </DataCard>
      ))}
    </div>
  );
};

export default DashboardSummary;
