
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  Home,
  FileText,
  Receipt,
  Settings,
  Users,
  PieChart,
  LineChart,
  CreditCard,
  Package,
  RefreshCcw
} from 'lucide-react';

type SidebarProps = {
  className?: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  requireAdmin?: boolean;
  requireRespPole?: boolean;
};

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { isAdmin, isRespPole } = useAuth();

  const navItems: NavItem[] = [
    {
      label: 'Tableau de bord',
      href: '/',
      icon: Home,
    },
    {
      label: 'Factures',
      href: '/invoices',
      icon: FileText,
    },
    {
      label: 'Articles',
      href: '/articles',
      icon: Package,
    },
    {
      label: 'Remboursements',
      href: '/reimbursements',
      icon: RefreshCcw,
    },
    {
      label: 'Transactions',
      href: '/transactions',
      icon: CreditCard,
      requireRespPole: true,
    },
    {
      label: 'Budget',
      href: '/budget',
      icon: PieChart,
      requireRespPole: true,
    },
    {
      label: 'Rapports',
      href: '/reports',
      icon: LineChart,
      requireAdmin: true,
    },
    {
      label: 'Utilisateurs',
      href: '/users',
      icon: Users,
      requireAdmin: true,
    },
    {
      label: 'Paramètres',
      href: '/settings',
      icon: Settings,
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) =>
      (!item.requireAdmin || isAdmin) && (!item.requireRespPole || isRespPole)
  );

  return (
    <aside
      className={cn(
        'bg-background border-r border-border h-screen p-4 w-64 flex flex-col',
        className
      )}
    >
      <div className="flex items-center mb-6 px-2">
        <Receipt className="h-6 w-6 text-primary mr-2" />
        <h1 className="text-xl font-bold">Budget App</h1>
      </div>
      <nav className="space-y-1 flex-1">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-4 text-xs text-muted-foreground px-3">
        Budget App v1.0.0
      </div>
    </aside>
  );
};

export default Sidebar;
