
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireRespPole?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireRespPole = false,
}) => {
  const { user, loading, isAdmin, isRespPole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast({
          title: "Accès refusé",
          description: "Veuillez vous connecter pour accéder à cette page.",
          variant: "destructive",
        });
        navigate("/auth");
      } else if (requireAdmin && !isAdmin) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les droits administrateur nécessaires.",
          variant: "destructive",
        });
        navigate("/");
      } else if (requireRespPole && !isRespPole) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les droits nécessaires.",
          variant: "destructive",
        });
        navigate("/");
      }
    }
  }, [user, loading, isAdmin, isRespPole, navigate, requireAdmin, requireRespPole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
