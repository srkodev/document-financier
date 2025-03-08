
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Invoices from "@/pages/Invoices";
import Articles from "@/pages/Articles";
import Reimbursements from "@/pages/Reimbursements";
import Budget from "@/pages/Budget";
import Transactions from "@/pages/Transactions";
import Settings from "@/pages/Settings";
import Users from "@/pages/Users";
import NotFound from "@/pages/NotFound";

import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/reimbursements" element={<Reimbursements />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transactions/new" element={<Transactions />} />
            <Route path="/transactions/:id/edit" element={<Transactions />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/users" element={<Users />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
