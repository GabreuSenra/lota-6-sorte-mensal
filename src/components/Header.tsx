import { Button } from "@/components/ui/button";
import { Trophy, User, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  isAuthenticated?: boolean;
  onLoginClick?: () => void;
  onDashboardClick?: () => void;
}


export const Header = ({ 
  isAuthenticated = false, 
  onLoginClick, 
  onDashboardClick 
}: HeaderProps) => {

  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <Trophy className="h-8 w-8 text-secondary" />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold bg-gradient-lucky bg-clip-text text-transparent">
              Credimania
            </h1>
            <span className="text-xs text-muted-foreground">Bolão Mensal</span>
          </div>
        </div>

        <nav className="flex items-center space-x-4">
          {isAuthenticated ? (
            <Button 
              variant="ghost" 
              onClick={() => navigate("/dashboard")}
              className="text-foreground"
            >
              <User className="h-4 w-4 mr-2" />
              Minha Conta
            </Button>
          ) : (
            <Button 
              variant="hero" 
              onClick={onLoginClick}
              size="sm"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Entrar
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};