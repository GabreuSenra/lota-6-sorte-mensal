import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, ArrowLeft } from "lucide-react";
import { NumberPicker } from "@/components/NumberPicker";
import { PrizeInfo } from "@/components/PrizeInfo";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Contest {
  id: string;
  month_year: string;
  draw_date: string;
  status: string;
  closing_date: string;
  total_collected: number;
}

interface Wallet {
  balance: number;
}

interface Bet {
  id: string;
  chosen_numbers: number[];
}

export default function Bet() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentContest, setCurrentContest] = useState<Contest | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [existingBet, setExistingBet] = useState<Bet | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      // Fetch current contest
      const { data: contests } = await supabase
        .from("contests")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1);

      if (contests && contests.length > 0) {
        setCurrentContest(contests[0]);
      }

      // Fetch user wallet
      const { data: walletData } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user!.id)
        .single();

      setWallet(walletData);

      // Check for existing bet
      if (contests && contests.length > 0) {
        const { data: betData } = await supabase
          .from("bets")
          .select("id, chosen_numbers")
          .eq("contest_id", contests[0].id)
          .eq("user_id", user!.id)
          .single();

        setExistingBet(betData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const placeBet = async () => {
    if (!currentContest || selectedNumbers.length !== 25) return;

    setPlacing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-bet', {
        body: {
          chosenNumbers: selectedNumbers,
          contestId: currentContest.id
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Aposta realizada!",
        description: data.message || "Sua aposta foi registrada com sucesso.",
      });

      navigate("/dashboard");
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error placing bet:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível realizar a aposta.",
        variant: "destructive",
      });
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Carregando...</div>;
  }

  if (!currentContest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <Header isAuthenticated={!!user} />
        <div className="container mx-auto p-4">
          <Alert>
            <AlertDescription>
              Não há sorteios abertos no momento.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (existingBet) {
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
          
          <Alert>
            <AlertDescription>
              Você já possui uma aposta neste sorteio. Números escolhidos: {existingBet.chosen_numbers.join(", ")}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
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

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Saldo da Carteira
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                R$ {wallet?.balance.toFixed(2) || "0,00"}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => navigate("/deposit")}
              >
                Depositar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Prêmio do Sorteio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-primary">
                R$ {currentContest.total_collected.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentContest.month_year}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Escolha seus 25 números</CardTitle>
            <CardDescription>
              Selecione exatamente 25 números de 00 a 99 para participar do sorteio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NumberPicker
              selectedNumbers={selectedNumbers}
              onNumberSelect={setSelectedNumbers}
              maxNumbers={25}
            />
            
            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Valor da aposta: R$ 5,00
              </p>
              <Button
                onClick={placeBet}
                disabled={selectedNumbers.length !== 25 || placing || !wallet || wallet.balance < 5}
                size="lg"
              >
                {placing ? "Processando..." : "Apostar R$ 5,00"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}