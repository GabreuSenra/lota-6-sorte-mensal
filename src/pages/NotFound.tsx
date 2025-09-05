import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-8 max-w-md">
          <div className="space-y-4">
            <AlertCircle className="h-24 w-24 text-secondary mx-auto" />
            <h1 className="text-6xl font-bold text-foreground">404</h1>
            <h2 className="text-2xl font-semibold text-secondary">
              Página Não Encontrada
            </h2>
            <p className="text-muted-foreground">
              Ops! A página que você está procurando não existe ou foi movida.
            </p>
          </div>

          <div className="space-y-4">
            <Button 
              variant="hero" 
              size="lg" 
              asChild
              className="w-full"
            >
              <a href="/">
                <Home className="mr-2 h-4 w-4" />
                Voltar ao Início
              </a>
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Que tal tentar a sorte no nosso bolão mensal?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
