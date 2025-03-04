
import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DataCard from "@/components/ui-custom/DataCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { 
  Plus, 
  Download, 
  Save
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Budget = () => {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  
  // Mock budget data - in a real app, this would come from an API
  const [budgetData, setBudgetData] = useState({
    totalAvailable: 50000,
    totalSpent: 28000,
    categories: {
      "Matériel": { allocated: 20000, spent: 15000 },
      "Voyages": { allocated: 15000, spent: 7000 },
      "Fournitures": { allocated: 8000, spent: 4000 },
      "Services": { allocated: 5000, spent: 2000 },
      "Divers": { allocated: 2000, spent: 0 }
    }
  });
  
  // Mock monthly data
  const monthlyData = [
    { name: "Jan", dépenses: 2000, budget: 5000 },
    { name: "Fév", dépenses: 3000, budget: 5000 },
    { name: "Mar", dépenses: 4500, budget: 5000 },
    { name: "Avr", dépenses: 3800, budget: 5000 },
    { name: "Mai", dépenses: 5200, budget: 5000 },
    { name: "Juin", dépenses: 4100, budget: 5000 },
    { name: "Juil", dépenses: 3700, budget: 5000 },
    { name: "Août", dépenses: 1800, budget: 5000 },
    { name: "Sep", dépenses: 0, budget: 5000 },
    { name: "Oct", dépenses: 0, budget: 5000 },
    { name: "Nov", dépenses: 0, budget: 5000 },
    { name: "Déc", dépenses: 0, budget: 5000 }
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Extract data for the pie chart
  const pieData = Object.entries(budgetData.categories).map(([name, { allocated, spent }], index) => ({
    name,
    value: spent,
    allocated,
    color: COLORS[index % COLORS.length]
  }));
  
  // Handle save of budget allocation
  const handleSaveBudget = () => {
    setEditMode(false);
    toast({
      title: "Budget sauvegardé",
      description: "Les modifications du budget ont été enregistrées avec succès.",
    });
  };
  
  // Handle category allocation update
  const handleCategoryChange = (category: string, value: number) => {
    setBudgetData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: {
          ...prev.categories[category],
          allocated: value
        }
      }
    }));
  };
  
  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Budget</h1>
            <p className="text-muted-foreground">Gestion et suivi du budget</p>
          </div>
          
          <div className="flex gap-3">
            {editMode ? (
              <Button onClick={handleSaveBudget} className="gap-2">
                <Save className="h-4 w-4" />
                <span>Enregistrer</span>
              </Button>
            ) : (
              <>
                <Button variant="outline" className="gap-2" onClick={() => setEditMode(true)}>
                  <Plus className="h-4 w-4" />
                  <span>Modifier le budget</span>
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  <span>Exporter</span>
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <DataCard
            title="Budget total"
            description="Budget disponible pour l'année en cours"
            className="lg:col-span-1"
          >
            <div className="flex flex-col justify-center items-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {budgetData.totalAvailable.toLocaleString('fr-FR')} €
              </div>
              <div className="text-lg text-muted-foreground">
                Restant: {(budgetData.totalAvailable - budgetData.totalSpent).toLocaleString('fr-FR')} €
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(budgetData.totalSpent / budgetData.totalAvailable) * 100}%` }}
                />
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {Math.round((budgetData.totalSpent / budgetData.totalAvailable) * 100)}% utilisé
              </div>
            </div>
          </DataCard>
          
          <DataCard 
            title="Répartition par catégorie" 
            description="Distribution des dépenses par catégorie"
            className="lg:col-span-2"
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `${value.toLocaleString('fr-FR')} €`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </DataCard>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <DataCard
            title="Évolution mensuelle"
            description="Suivi des dépenses mensuelles par rapport au budget"
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `${value.toLocaleString('fr-FR')} €`}
                  />
                  <Legend />
                  <Bar dataKey="budget" name="Budget mensuel" fill="#8884d8" />
                  <Bar dataKey="dépenses" name="Dépenses" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DataCard>
          
          <DataCard
            title={editMode ? "Modifier l'allocation" : "Allocation du budget"}
            description={editMode ? "Modifier le budget alloué à chaque catégorie" : "Budget alloué à chaque catégorie"}
          >
            <div className="space-y-4">
              {Object.entries(budgetData.categories).map(([category, { allocated, spent }]) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{category}</span>
                    {editMode ? (
                      <Input
                        type="number"
                        value={allocated}
                        onChange={(e) => handleCategoryChange(category, Number(e.target.value))}
                        className="w-32 text-right"
                      />
                    ) : (
                      <span>{allocated.toLocaleString('fr-FR')} €</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Dépensé: {spent.toLocaleString('fr-FR')} €</span>
                    <span>Restant: {(allocated - spent).toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(spent / allocated) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </DataCard>
        </div>
        
        <DataCard
          title="Historique des modifications du budget"
          description="Dernières modifications apportées au budget"
        >
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
                <tr className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm">01/01/2023</td>
                  <td className="px-4 py-3 text-sm">SuperAdmin</td>
                  <td className="px-4 py-3 text-sm">Création</td>
                  <td className="px-4 py-3 text-sm">Budget initial de 50 000 €</td>
                </tr>
                <tr className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm">15/02/2023</td>
                  <td className="px-4 py-3 text-sm">Admin</td>
                  <td className="px-4 py-3 text-sm">Modification</td>
                  <td className="px-4 py-3 text-sm">Augmentation du budget Matériel de 15 000 € à 20 000 €</td>
                </tr>
                <tr className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm">20/03/2023</td>
                  <td className="px-4 py-3 text-sm">RespPôle</td>
                  <td className="px-4 py-3 text-sm">Rapport</td>
                  <td className="px-4 py-3 text-sm">Rapport trimestriel généré</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DataCard>
      </div>
    </DashboardLayout>
  );
};

export default Budget;
