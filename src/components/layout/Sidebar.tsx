
import React from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  LayoutDashboard, 
  FileText, 
  ArrowLeftRight, 
  Users, 
  Settings,
  LogOut,
  CreditCard,
  BarChart4
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserRole } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  {
    name: "Tableau de bord",
    path: "/",
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RESP_POLE, UserRole.AGENT],
  },
  {
    name: "Factures",
    path: "/invoices",
    icon: <FileText className="h-5 w-5" />,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RESP_POLE, UserRole.AGENT],
  },
  {
    name: "Transactions",
    path: "/transactions",
    icon: <ArrowLeftRight className="h-5 w-5" />,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RESP_POLE],
  },
  {
    name: "Budget",
    path: "/budget",
    icon: <CreditCard className="h-5 w-5" />,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RESP_POLE],
  },
  {
    name: "Rapports",
    path: "/reports",
    icon: <BarChart4 className="h-5 w-5" />,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    name: "Utilisateurs",
    path: "/users",
    icon: <Users className="h-5 w-5" />,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    name: "Paramètres",
    path: "/settings",
    icon: <Settings className="h-5 w-5" />,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RESP_POLE, UserRole.AGENT],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { profile, signOut } = useAuth();
  
  // Récupérer le rôle de l'utilisateur du contexte d'authentification
  const userRole = profile?.role || UserRole.AGENT;
  
  const filteredNavigationItems = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );
  
  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 pt-16 pb-4 transform transition-transform duration-300 ease-in-out bg-white dark:bg-gray-950 border-r",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-full flex flex-col">
          {profile && (
            <div className="px-4 py-2 border-b">
              <p className="font-medium truncate">{profile.name || profile.email}</p>
              <p className="text-xs text-muted-foreground">
                {userRole === UserRole.SUPER_ADMIN ? "Super Administrateur" : 
                 userRole === UserRole.ADMIN ? "Administrateur" :
                 userRole === UserRole.RESP_POLE ? "Responsable de pôle" : "Agent"}
              </p>
            </div>
          )}
          
          <div className="px-4 py-4">
            <p className="text-xs font-medium text-muted-foreground">MENU PRINCIPAL</p>
          </div>
          
          <nav className="space-y-1 px-2">
            {filteredNavigationItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                onClick={isMobile ? onClose : undefined}
              >
                <Button
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 mb-1",
                    location.pathname === item.path
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Button>
              </Link>
            ))}
          </nav>
          
          <div className="mt-auto px-4">
            <Separator className="my-4" />
            <Button variant="ghost" className="w-full justify-start gap-3 text-destructive" onClick={signOut}>
              <LogOut className="h-5 w-5" />
              <span>Déconnexion</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
