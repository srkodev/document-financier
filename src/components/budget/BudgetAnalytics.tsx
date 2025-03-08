
import React from "react";
import { Budget, BudgetCategory } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface BudgetAnalyticsProps {
  budget: Budget;
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ea489e'];

const BudgetAnalytics: React.FC<BudgetAnalyticsProps> = ({ budget, className }) => {
  // Prepare data for the bar chart
  const barData = budget.categories ? 
    Object.entries(budget.categories).map(([name, category]) => ({
      name,
      allocated: category.allocated,
      spent: category.spent,
      remaining: category.allocated - category.spent
    })) : [];

  // Prepare data for the pie chart
  const pieData = budget.categories ? 
    Object.entries(budget.categories).map(([name, category], index) => ({
      name,
      value: category.spent,
      color: COLORS[index % COLORS.length]
    })) : [];

  const totalSpent = pieData.reduce((acc, item) => acc + item.value, 0);
  const percentageFormatter = (value: number) => `${Math.round((value / totalSpent) * 100)}%`;

  const moneyFormatter = (value: number) => `${value.toLocaleString('fr-FR')} €`;

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Répartition du budget par catégorie</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={moneyFormatter} />
                <Tooltip formatter={(value: number) => moneyFormatter(value)} />
                <Legend />
                <Bar dataKey="allocated" name="Budget alloué" fill="#8884d8" />
                <Bar dataKey="spent" name="Dépenses" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Répartition des dépenses</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => moneyFormatter(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Résumé du budget</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-secondary/30 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground">Budget total</h4>
            <p className="text-2xl font-bold">{moneyFormatter(budget.total_available)}</p>
          </div>
          <div className="bg-secondary/30 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground">Dépenses totales</h4>
            <p className="text-2xl font-bold">{moneyFormatter(budget.total_spent)}</p>
          </div>
          <div className="bg-secondary/30 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground">Restant</h4>
            <p className="text-2xl font-bold">{moneyFormatter(budget.total_available - budget.total_spent)}</p>
          </div>
          <div className="bg-secondary/30 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground">Utilisation</h4>
            <p className="text-2xl font-bold">{Math.round((budget.total_spent / budget.total_available) * 100)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetAnalytics;
