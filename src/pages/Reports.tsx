
import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DataCard from "@/components/ui-custom/DataCard";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
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
import { 
  Download,
  Filter,
  Calendar
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Reports = () => {
  const [period, setPeriod] = useState("year");
  
  // Mock data - in a real app, this would come from an API
  const monthlyData = [
    { name: "Jan", dépenses: 2000, factures: 5 },
    { name: "Fév", dépenses: 3000, factures: 7 },
    { name: "Mar", dépenses: 4500, factures: 10 },
    { name: "Avr", dépenses: 3800, factures: 8 },
    { name: "Mai", dépenses: 5200, factures: 12 },
    { name: "Juin", dépenses: 4100, factures: 9 },
    { name: "Juil", dépenses: 3700, factures: 7 },
    { name: "Août", dépenses: 1800, factures: 4 },
    { name: "Sep", dépenses: 0, factures: 0 },
    { name: "Oct", dépenses: 0, factures: 0 },
    { name: "Nov", dépenses: 0, factures: 0 },
    { name: "Déc", dépenses: 0, factures: 0 }
  ];
  
  const quarterlyData = [
    { name: "Q1", dépenses: 9500, factures: 22 },
    { name: "Q2", dépenses: 13100, factures: 29 },
    { name: "Q3", dépenses: 5500, factures: 11 },
    { name: "Q4", dépenses: 0, factures: 0 }
  ];
  
  const categoryData = [
    { name: "Matériel", value: 15000 },
    { name: "Voyages", value: 7000 },
    { name: "Fournitures", value: 4000 },
    { name: "Services", value: 2000 },
    { name: "Divers", value: 0 }
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  const statusData = [
    { name: "Approuvées", value: 45 },
    { name: "En attente", value: 15 },
    { name: "Refusées", value: 5 },
    { name: "En cours", value: 10 }
  ];
  
  // Choose data based on selected period
  const chartData = period === "year" ? monthlyData : quarterlyData;
  
  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Rapports</h1>
            <p className="text-muted-foreground">Analyse et tableaux de bord</p>
          </div>
          
          <div className="flex gap-3">
            <Select defaultValue={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="year">Année</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span>Période</span>
            </Button>
            
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              <span>Filtrer</span>
            </Button>
            
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              <span>Exporter</span>
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="overview" className="w-full space-y-6">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="invoices">Factures</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DataCard 
                title="Évolution des dépenses" 
                description={`Dépenses ${period === "year" ? "mensuelles" : "trimestrielles"} totales`}
              >
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `${value.toLocaleString('fr-FR')} €`} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="dépenses" 
                        name="Dépenses"
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </DataCard>
              
              <DataCard 
                title="Nombre de factures" 
                description={`Factures ${period === "year" ? "mensuelles" : "trimestrielles"} traitées`}
              >
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="factures" 
                        name="Nombre de factures" 
                        fill="#82ca9d" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </DataCard>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DataCard 
                title="Répartition par catégorie" 
                description="Distribution des dépenses par catégorie"
              >
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value.toLocaleString('fr-FR')} €`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </DataCard>
              
              <DataCard 
                title="Statut des factures" 
                description="Distribution des factures par statut"
              >
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </DataCard>
            </div>
          </TabsContent>
          
          <TabsContent value="invoices" className="mt-0">
            <DataCard title="Statistiques des factures">
              <p className="py-4 text-center text-muted-foreground">Rapport détaillé sur les factures en cours d'implémentation.</p>
            </DataCard>
          </TabsContent>
          
          <TabsContent value="transactions" className="mt-0">
            <DataCard title="Statistiques des transactions">
              <p className="py-4 text-center text-muted-foreground">Rapport détaillé sur les transactions en cours d'implémentation.</p>
            </DataCard>
          </TabsContent>
          
          <TabsContent value="budget" className="mt-0">
            <DataCard title="Statistiques du budget">
              <p className="py-4 text-center text-muted-foreground">Rapport détaillé sur le budget en cours d'implémentation.</p>
            </DataCard>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
