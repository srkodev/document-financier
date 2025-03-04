
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Bell, 
  Search,
  Menu
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  return (
    <header className="w-full h-16 flex items-center justify-between px-4 md:px-6 border-b bg-white dark:bg-gray-950 animate-slide-down fixed top-0 left-0 right-0 z-10">
      <div className="flex items-center gap-4">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="flex-1 font-medium text-lg md:text-xl">DocuFinance</div>
      </div>
      
      <div className="hidden md:flex items-center mx-4 relative max-w-md w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="Rechercher..." 
          className="pl-10 bg-secondary/50 border-none focus-visible:ring-1"
        />
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
        </Button>
        
        <Avatar className="cursor-pointer" onClick={() => navigate('/settings')}>
          <AvatarImage src="" />
          <AvatarFallback className="bg-primary text-primary-foreground">AD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};

export default Header;
