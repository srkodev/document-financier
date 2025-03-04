
import React from "react";
import DataCard from "../ui-custom/DataCard";
import { Budget } from "@/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface BudgetOverviewProps {
  budget: Budget;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const BudgetOverview: React.FC<BudgetOverviewProps> = ({ budget }) => {
  // Extract data for the pie chart
  const data = budget.categories 
    ? Object.entries(budget.categories).map(([name, { allocated, spent }], index) => ({
        name,
        value: spent,
        allocated,
        color: COLORS[index % COLORS.length]
      }))
    : [{ name: "Total", value: budget.totalSpent, allocated: budget.totalAvailable, color: COLORS[0] }];
  
  return (
    <DataCard
      title="Répartition du budget"
      description="Vue d'ensemble des dépenses par catégorie"
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex justify-between items-center p-2 rounded bg-secondary/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.name}</span>
            </div>
            <div className="text-sm font-medium">
              {item.value.toLocaleString('fr-FR')} € / {item.allocated.toLocaleString('fr-FR')} €
            </div>
          </div>
        ))}
      </div>
    </DataCard>
  );
};

export default BudgetOverview;
