import { useState } from "react";
import { Header } from "@/components/Header";
import { NumberPicker } from "@/components/NumberPicker";
import { PrizeInfo } from "@/components/PrizeInfo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import heroImage from "@/assets/hero-lottery.jpg";
import { Play, Shield, Clock, Trophy } from "lucide-react";

const Index = () => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [showNumberPicker, setShowNumberPicker] = useState(false);

  const handlePlayNow = () => {
    setShowNumberPicker(true);
  };

  const handleLogin = () => {
    // TODO: Implement login modal/page
    console.log("Login clicked");
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header onLoginClick={handleLogin} />
      
      <main>
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src={heroImage} 
              alt="Lota 6 Sorte - Bolão da Sorte"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-hero/80" />
          </div>
          
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-foreground">
                  <span className="bg-gradient-lucky bg-clip-text text-transparent">
                    Lota 6 Sorte
                  </span>
                </h1>
                <h2 className="text-2xl lg:text-3xl font-semibold text-secondary">
                  O Bolão Mensal da Sorte
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Escolha 6 dezenas e concorra a prêmios baseados na Lotomania. 
                  Sorteio todo último sábado do mês!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  variant="hero" 
                  size="xl" 
                  onClick={handlePlayNow}
                  className="shadow-glow"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Jogar Agora - R$ 5,00
                </Button>
                <Button 
                  variant="lucky" 
                  size="xl"
                >
                  <Trophy className="mr-2 h-5 w-5" />
                  Ver Resultados
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="container py-16">
          <PrizeInfo />

          {showNumberPicker && (
            <section className="mb-16">
              <Card className="bg-gradient-card border-border shadow-elegant max-w-6xl mx-auto">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-card-foreground">
                    Sua Aposta da Sorte
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <NumberPicker
                    selectedNumbers={selectedNumbers}
                    onNumberSelect={setSelectedNumbers}
                  />
                  
                  {selectedNumbers.length === 6 && (
                    <div className="mt-8 text-center">
                      <Button variant="prize" size="xl">
                        Confirmar Aposta - R$ 5,00
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* Features Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="bg-gradient-card border-border shadow-elegant">
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-card-foreground">100% Seguro</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Plataforma segura com pagamentos via PIX e total transparência nos resultados.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border shadow-elegant">
              <CardHeader className="text-center">
                <Clock className="h-12 w-12 text-accent mx-auto mb-4" />
                <CardTitle className="text-card-foreground">Sorteio Mensal</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Todo último sábado do mês, baseado no resultado oficial da Lotomania.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border shadow-elegant">
              <CardHeader className="text-center">
                <Trophy className="h-12 w-12 text-secondary mx-auto mb-4" />
                <CardTitle className="text-card-foreground">Grandes Prêmios</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  80% da arrecadação para 6 acertos e 20% para 5 acertos. Prêmios que acumulam!
                </p>
              </CardContent>
            </Card>
          </section>

          {/* How it Works */}
          <section className="text-center space-y-8">
            <h2 className="text-3xl font-bold text-foreground">Como Funciona</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-gradient-lucky rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg mx-auto">
                  1
                </div>
                <h3 className="font-semibold text-foreground">Escolha</h3>
                <p className="text-sm text-muted-foreground">
                  Selecione 6 números de 00 a 99
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="w-12 h-12 bg-gradient-lucky rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg mx-auto">
                  2
                </div>
                <h3 className="font-semibold text-foreground">Pague</h3>
                <p className="text-sm text-muted-foreground">
                  R$ 5,00 via PIX de forma segura
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="w-12 h-12 bg-gradient-lucky rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg mx-auto">
                  3
                </div>
                <h3 className="font-semibold text-foreground">Aguarde</h3>
                <p className="text-sm text-muted-foreground">
                  Sorteio no último sábado do mês
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="w-12 h-12 bg-gradient-prize rounded-full flex items-center justify-center text-secondary-foreground font-bold text-lg mx-auto">
                  4
                </div>
                <h3 className="font-semibold text-foreground">Ganhe</h3>
                <p className="text-sm text-muted-foreground">
                  Receba via PIX se acertar 5 ou 6
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-border bg-background/50 py-8 mt-16">
        <div className="container text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            © 2024 Lota 6 Sorte. Sistema independente sem vínculo com a Caixa Econômica Federal.
          </p>
          <p className="text-xs text-muted-foreground">
            Utilizamos apenas os resultados oficiais da Lotomania como referência para nossos sorteios.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
