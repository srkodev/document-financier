
import React, { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 overflow-auto pt-16 md:pl-64 transition-all duration-300">
        <div className="container mx-auto p-4 md:p-6 max-w-7xl">
          {children}
        </div>
      </main>
      
      <Toaster />
    </div>
  );
};

export default DashboardLayout;
