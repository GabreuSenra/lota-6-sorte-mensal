import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { NumberPicker } from "@/components/NumberPicker";
import { PrizeInfo } from "@/components/PrizeInfo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-lottery.jpg";
import { Play, Shield, Clock, Trophy, TrendingUp, Users, Calendar, ArrowRight } from "lucide-react";

const Index = () => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [showNumberPicker, setShowNumberPicker] = useState(false);
  const [currentContest, setCurrentContest] = useState<any>(null);
  const [totalBets, setTotalBets] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchContestData();
  }, []);

  const fetchContestData = async () => {
    try {
      // Fetch current open contest
      const { data: contest } = await supabase
        .from('contests')
        .select('*')
        .eq('status', 'open')
        .single();

      if (contest) {
        setCurrentContest(contest);
        
        // Count total bets for this contest
        const { count } = await supabase
          .from('bets')
          .select('*', { count: 'exact', head: true })
          .eq('contest_id', contest.id);

        setTotalBets(count || 0);
      }
    } catch (error) {
      console.error('Error fetching contest data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayNow = () => {
    setShowNumberPicker(true);
  };

  const handleLogin = () => {
    navigate("/auth");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateDaysUntilDraw = () => {
    if (!currentContest?.draw_date) return null;
    
    const drawDate = new Date(currentContest.draw_date);
    const today = new Date();
    const diffTime = drawDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* SEO Meta Tags would be added in the head via React Helmet */}
      <Header onLoginClick={handleLogin} />
      
      <main>
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src={heroImage} 
              alt="Credimania - Bolão da Sorte Mensal - Escolha 6 números e ganhe prêmios baseados na Lotomania"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-hero/80" />
          </div>
          
          <div className="container relative z-10">
            <div className="max-w-5xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-7xl font-bold text-foreground">
                  <span className="bg-gradient-lucky bg-clip-text text-transparent">
                    Credimania
                  </span>
                </h1>
                <h2 className="text-2xl lg:text-4xl font-semibold text-secondary">
                  O Bolão Mensal da Sorte
                </h2>
                <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Escolha 6 dezenas e concorra a prêmios baseados na Lotomania oficial. 
                  <strong className="text-foreground"> Sorteio todo último sábado do mês!</strong>
                </p>
              </div>

              {/* Contest Info Cards */}
              {!loading && currentContest && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
                  <Card className="bg-gradient-card border-border shadow-glow">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold text-foreground">
                        {formatCurrency(currentContest.total_collected || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Acumulado</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-card border-border shadow-glow">
                    <CardContent className="p-6 text-center">
                      <Users className="h-8 w-8 text-accent mx-auto mb-2" />
                      <div className="text-2xl font-bold text-foreground">{totalBets}</div>
                      <div className="text-sm text-muted-foreground">Apostas Realizadas</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-card border-border shadow-glow">
                    <CardContent className="p-6 text-center">
                      <Calendar className="h-8 w-8 text-secondary mx-auto mb-2" />
                      <div className="text-2xl font-bold text-foreground">
                        {calculateDaysUntilDraw()}
                      </div>
                      <div className="text-sm text-muted-foreground">Dias para o Sorteio</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  variant="hero" 
                  size="xl" 
                  onClick={() => navigate("/bet")}
                  className="shadow-glow animate-pulse hover:animate-none"
                >
                  <Play className="mr-2 h-5 w-5" />
                  🎯 Apostar Agora - R$ 5,00
                </Button>
                <Button 
                  variant="lucky" 
                  size="xl"
                  onClick={() => navigate("/dashboard")}
                >
                  <Trophy className="mr-2 h-5 w-5" />
                  Ver Meus Jogos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {currentContest && (
                <div className="bg-background/20 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    🏆 Sorteio: {currentContest.month_year}
                  </h3>
                  <p className="text-muted-foreground">
                    Baseado no resultado oficial da Lotomania do último sábado do mês
                  </p>
                  {currentContest.draw_date && (
                    <Badge variant="secondary" className="mt-2">
                      Sorteio em: {new Date(currentContest.draw_date).toLocaleDateString('pt-BR')}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Prize Distribution Section */}
        <section className="py-16 bg-background/50">
          <div className="container">
            <div className="text-center space-y-8 mb-12">
              <h2 className="text-4xl font-bold text-foreground">
                💰 Como Funciona a Premiação
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Premiação justa e transparente baseada na arrecadação total
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="bg-gradient-prize border-border shadow-elegant">
                <CardHeader className="text-center">
                  <div className="text-4xl mb-4">🥇</div>
                  <CardTitle className="text-2xl text-card-foreground">6 Acertos</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="text-3xl font-bold text-primary">80%</div>
                  <p className="text-muted-foreground">
                    da arrecadação total dividida entre os ganhadores
                  </p>
                  <Badge variant="secondary" className="text-sm">
                    Taxa admin: 20% por prêmio
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border shadow-elegant">
                <CardHeader className="text-center">
                  <div className="text-4xl mb-4">🥈</div>
                  <CardTitle className="text-2xl text-card-foreground">5 Acertos</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="text-3xl font-bold text-accent">20%</div>
                  <p className="text-muted-foreground">
                    da arrecadação total dividida entre os ganhadores
                  </p>
                  <Badge variant="secondary" className="text-sm">
                    Taxa admin: 20% por prêmio
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-8">
              <Card className="bg-background/80 border-border max-w-2xl mx-auto">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">📈 Prêmios Acumulados</h3>
                  <p className="text-muted-foreground">
                    Se não houver ganhadores com 5 ou 6 acertos, o valor total acumula para o próximo sorteio!
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <div className="container py-16">
          {showNumberPicker && (
            <section className="mb-16">
              <Card className="bg-gradient-card border-border shadow-elegant max-w-6xl mx-auto">
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl text-card-foreground">
                    🎲 Sua Aposta da Sorte
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Selecione 6 números de 00 a 99 e boa sorte!
                  </p>
                </CardHeader>
                <CardContent className="p-8">
                  <NumberPicker
                    selectedNumbers={selectedNumbers}
                    onNumberSelect={setSelectedNumbers}
                  />
                  
                  {selectedNumbers.length === 6 && (
                    <div className="mt-8 text-center space-y-4">
                      <div className="text-lg text-foreground">
                        Números selecionados: <strong>{selectedNumbers.join(', ')}</strong>
                      </div>
                      <Button variant="prize" size="xl" onClick={() => navigate("/bet")}>
                        <Play className="mr-2 h-5 w-5" />
                        Confirmar Aposta - R$ 5,00
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* Call to Action Section */}
          <section className="text-center space-y-8 mb-16">
            <div className="bg-gradient-lucky rounded-2xl p-8 text-primary-foreground">
              <h2 className="text-3xl font-bold mb-4">🚀 Não Perca a Chance!</h2>
              <p className="text-lg mb-6 opacity-90">
                Cada aposta custa apenas R$ 5,00 e você pode ganhar uma fortuna!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="secondary" 
                  size="xl"
                  onClick={() => navigate("/bet")}
                  className="shadow-lg"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Fazer Minha Aposta
                </Button>
                <Button 
                  variant="outline" 
                  size="xl"
                  onClick={handlePlayNow}
                  className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  Simular Números
                </Button>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="bg-gradient-card border-border shadow-elegant hover:shadow-glow transition-all duration-300">
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-card-foreground">🔒 100% Seguro</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Plataforma segura com pagamentos via PIX e total transparência nos resultados oficiais da Lotomania.
                </p>
                <Button variant="link" className="mt-4 p-0" onClick={() => navigate("/termos")}>
                  Ver Termos de Segurança
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border shadow-elegant hover:shadow-glow transition-all duration-300">
              <CardHeader className="text-center">
                <Clock className="h-12 w-12 text-accent mx-auto mb-4" />
                <CardTitle className="text-card-foreground">📅 Sorteio Mensal</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Todo último sábado do mês, baseado no resultado oficial da Lotomania da Caixa Econômica Federal.
                </p>
                <Button variant="link" className="mt-4 p-0" onClick={() => navigate("/dashboard")}>
                  Ver Próximos Sorteios
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border shadow-elegant hover:shadow-glow transition-all duration-300">
              <CardHeader className="text-center">
                <Trophy className="h-12 w-12 text-secondary mx-auto mb-4" />
                <CardTitle className="text-card-foreground">💎 Grandes Prêmios</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  80% da arrecadação para 6 acertos e 20% para 5 acertos. Prêmios que acumulam quando não há ganhadores!
                </p>
                <Button variant="link" className="mt-4 p-0" onClick={() => navigate("/dashboard")}>
                  Ver Histórico de Prêmios
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* How it Works */}
          <section className="text-center space-y-8">
            <h2 className="text-4xl font-bold text-foreground">🎯 Como Jogar</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simples, rápido e seguro. Em poucos cliques você já está participando!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-lucky rounded-full flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto shadow-glow">
                  1
                </div>
                <h3 className="font-semibold text-foreground text-lg">🎲 Escolha</h3>
                <p className="text-muted-foreground">
                  Selecione 6 números de 00 a 99 para sua aposta da sorte
                </p>
                <Button variant="outline" size="sm" onClick={handlePlayNow}>
                  Escolher Agora
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-lucky rounded-full flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto shadow-glow">
                  2
                </div>
                <h3 className="font-semibold text-foreground text-lg">💳 Pague</h3>
                <p className="text-muted-foreground">
                  R$ 5,00 via PIX de forma 100% segura e instantânea
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate("/bet")}>
                  Ver Formas de Pagamento
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-lucky rounded-full flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto shadow-glow">
                  3
                </div>
                <h3 className="font-semibold text-foreground text-lg">⏰ Aguarde</h3>
                <p className="text-muted-foreground">
                  Sorteio no último sábado do mês baseado na Lotomania oficial
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
                  Acompanhar Sorteio
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-prize rounded-full flex items-center justify-center text-secondary-foreground font-bold text-2xl mx-auto shadow-glow">
                  4
                </div>
                <h3 className="font-semibold text-foreground text-lg">🎉 Ganhe</h3>
                <p className="text-muted-foreground">
                  Receba automaticamente via PIX se acertar 5 ou 6 números
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
                  Ver Meus Prêmios
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-border bg-background/50 py-12 mt-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="font-bold text-foreground text-xl">🎯 Credimania</h3>
              <p className="text-sm text-muted-foreground">
                O bolão mensal oficial baseado na Lotomania. Transparente, seguro e confiável.
              </p>
              <div className="flex space-x-2">
                <Badge variant="secondary">Licenciado</Badge>
                <Badge variant="secondary">Seguro</Badge>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">📋 Links Úteis</h3>
              <div className="space-y-2">
                <Button 
                  variant="link" 
                  className="p-0 h-auto justify-start text-sm"
                  onClick={() => navigate("/termos")}
                >
                  Termos e Condições
                </Button>
                <Button 
                  variant="link" 
                  className="p-0 h-auto justify-start text-sm"
                  onClick={() => navigate("/jogo-responsavel")}
                >
                  Jogo Responsável
                </Button>
                <Button 
                  variant="link" 
                  className="p-0 h-auto justify-start text-sm"
                  onClick={() => navigate("/privacidade")}
                >
                  Política de Privacidade
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">👤 Sua Conta</h3>
              <div className="space-y-2">
                <Button 
                  variant="link" 
                  className="p-0 h-auto justify-start text-sm"
                  onClick={() => navigate("/auth")}
                >
                  Entrar / Cadastrar
                </Button>
                <Button 
                  variant="link" 
                  className="p-0 h-auto justify-start text-sm"
                  onClick={() => navigate("/dashboard")}
                >
                  Minha Conta
                </Button>
                <Button 
                  variant="link" 
                  className="p-0 h-auto justify-start text-sm"
                  onClick={() => navigate("/withdraw")}
                >
                  Sacar Prêmios
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">🎲 Ações Rápidas</h3>
              <div className="space-y-2">
                <Button 
                  size="sm"
                  onClick={() => navigate("/bet")}
                  className="w-full"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Apostar R$ 5,00
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                  className="w-full"
                >
                  Ver Meus Jogos
                </Button>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-8 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Credimania. Sistema independente sem vínculo com a Caixa Econômica Federal.
            </p>
            <p className="text-xs text-muted-foreground">
              Utilizamos apenas os resultados oficiais da Lotomania como referência para nossos sorteios mensais.
              Jogue com responsabilidade. Proibido para menores de 18 anos.
            </p>
            <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
              <span>🔒 Pagamentos Seguros</span>
              <span>⚡ PIX Instantâneo</span>
              <span>🏆 Prêmios Automáticos</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;