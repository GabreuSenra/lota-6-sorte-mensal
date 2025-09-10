import { Button } from "@/components/ui/button";
import { Trophy, User, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import icon from "../icon.png";

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

  const navigateToHomepage = () => {
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="container flex h-24 items-center justify-between">
        <div className="flex items-center space-x-2">
          <img
            src={icon}
            onClick={navigateToHomepage}
            className="h-24 w-24 text-secondary transition-transform transform hover:scale-110 duration-200 ease-in-out"
          />
        </div>

        <nav className="flex items-center space-x-4">
          <ThemeToggle />
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