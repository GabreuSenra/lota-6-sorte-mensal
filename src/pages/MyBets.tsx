import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Trophy, Calendar } from "lucide-react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Bet {
  id: string;
  chosen_numbers: number[];
  amount: number;
  hits: number | null;
  prize_amount: number | null;
  prize_paid: boolean | null;
  created_at: string;
  contest: {
    month_year: string;
    draw_date: string;
    status: string;
    lotomania_numbers: number[] | null;
  };
}

export default function MyBets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchBets();
  }, [user, navigate]);

  const fetchBets = async () => {
    try {
      const { data: betsData, error } = await supabase
        .from("bets")
        .select(`
          *,
          contest:contests(
            month_year,
            draw_date,
            status,
            lotomania_numbers
          )
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBets(betsData || []);
    } catch (error) {
      console.error("Error fetching bets:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-800";
      case "closed": return "bg-yellow-100 text-yellow-800";
      case "drawn": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open": return "Aberto";
      case "closed": return "Fechado";
      case "drawn": return "Sorteado";
      default: return status;
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Header isAuthenticated={!!user} />
      
      <div className="container mx-auto p-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Minhas Apostas</h1>
          <p className="text-muted-foreground">Histórico de todas as suas apostas</p>
        </div>

        {bets.length === 0 ? (
          <Alert>
            <AlertDescription>
              Você ainda não fez nenhuma aposta. 
              <Button 
                variant="link" 
                className="p-0 h-auto ml-1"
                onClick={() => navigate("/bet")}
              >
                Fazer sua primeira aposta
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4">
            {bets.map((bet) => (
              <Card key={bet.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {bet.contest.month_year}
                      </CardTitle>
                      <CardDescription>
                        Sorteio: {new Date(bet.contest.draw_date).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(bet.contest.status)}>
                      {getStatusText(bet.contest.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        Seus números:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {bet.chosen_numbers.sort((a, b) => a - b).map((number) => (
                          <span
                            key={number}
                            className="inline-flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold"
                          >
                            {number.toString().padStart(2, '0')}
                          </span>
                        ))}
                      </div>
                    </div>

                    {bet.contest.lotomania_numbers && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">
                          Números sorteados:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {bet.contest.lotomania_numbers.sort((a, b) => a - b).map((number) => {
                            const isHit = bet.chosen_numbers.includes(number);
                            return (
                              <span
                                key={number}
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                  isHit 
                                    ? "bg-green-500 text-white" 
                                    : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {number.toString().padStart(2, '0')}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Valor apostado: </span>
                        <span className="font-medium">R$ {bet.amount.toFixed(2)}</span>
                      </div>
                      
                      {bet.hits !== null && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Acertos: </span>
                          <span className="font-bold text-primary">{bet.hits}</span>
                        </div>
                      )}

                      {bet.prize_amount && bet.prize_amount > 0 && (
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <div className="text-sm">
                            <span className="text-muted-foreground">Prêmio: </span>
                            <span className="font-bold text-green-600">
                              R$ {bet.prize_amount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Aposta feita em {new Date(bet.created_at).toLocaleDateString('pt-BR')} às {new Date(bet.created_at).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}