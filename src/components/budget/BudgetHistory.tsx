
import React, { useEffect, useState } from "react";
import { fetchBudgetHistory } from "@/services/budgetService";
import { BudgetHistoryEntry } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface BudgetHistoryProps {
  className?: string;
}

const BudgetHistory: React.FC<BudgetHistoryProps> = ({ className }) => {
  const [history, setHistory] = useState<BudgetHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const data = await fetchBudgetHistory();
        setHistory(data);
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: error.message || "Impossible de charger l'historique",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [toast]);

  return (
    <div className={className}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Utilisateur</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Action</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Détails</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-4 text-muted-foreground">
                  Aucun historique disponible
                </td>
              </tr>
            ) : (
              history.map((entry) => (
                <tr key={entry.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm">
                    {format(new Date(entry.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                  </td>
                  <td className="px-4 py-3 text-sm">{entry.user_name || "Utilisateur"}</td>
                  <td className="px-4 py-3 text-sm">{entry.action}</td>
                  <td className="px-4 py-3 text-sm">{entry.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BudgetHistory;
