import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, ArrowLeft, DollarSign } from "lucide-react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Wallet {
  balance: number;
}

interface Profile {
  pix_key: string | null;
}

export default function Withdraw() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [walletResponse, profileResponse] = await Promise.all([
        supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", user!.id)
          .single(),
        supabase
          .from("profiles")
          .select("pix_key")
          .eq("user_id", user!.id)
          .single()
      ]);

      setWallet(walletResponse.data);
      setProfile(profileResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor válido para saque.",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.pix_key) {
      toast({
        title: "Chave PIX necessária",
        description: "Você precisa cadastrar uma chave PIX no seu perfil.",
        variant: "destructive",
      });
      return;
    }

    if (!wallet || withdrawAmount > wallet.balance) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não possui saldo suficiente para este saque.",
        variant: "destructive",
      });
      return;
    }

    if (withdrawAmount < 10) {
      toast({
        title: "Valor mínimo",
        description: "O valor mínimo para saque é R$ 10,00.",
        variant: "destructive",
      });
      return;
    }

    setWithdrawing(true);
    try {
      // Create withdrawal transaction
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user!.id,
          type: "withdrawal",
          amount: withdrawAmount,
          status: "pending",
          description: `Solicitação de saque via PIX: ${profile.pix_key}`,
        });

      if (transactionError) throw transactionError;

      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de saque foi registrada. O valor será processado em até 24 horas.",
      });

      setAmount("");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating withdrawal:", error);
      toast({
        title: "Erro",
        description: "Não foi possível processar sua solicitação.",
        variant: "destructive",
      });
    } finally {
      setWithdrawing(false);
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

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Saldo Disponível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                R$ {wallet?.balance.toFixed(2) || "0,00"}
              </p>
              {profile?.pix_key && (
                <p className="text-sm text-muted-foreground mt-2">
                  PIX: {profile.pix_key}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Solicitar Saque
              </CardTitle>
              <CardDescription>
                Saque via PIX para sua chave cadastrada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!profile?.pix_key ? (
                <Alert>
                  <AlertDescription>
                    Você precisa cadastrar uma chave PIX no seu perfil antes de poder sacar.
                    <Button 
                      variant="link" 
                      className="p-0 h-auto"
                      onClick={() => navigate("/dashboard")}
                    >
                      Ir para perfil
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div>
                    <Label htmlFor="amount">Valor do Saque</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="10"
                      max={wallet?.balance || 0}
                      placeholder="0,00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Valor mínimo: R$ 10,00
                    </p>
                  </div>

                  <Button
                    onClick={handleWithdraw}
                    disabled={withdrawing || !amount || !wallet || parseFloat(amount) > wallet.balance}
                    className="w-full"
                    size="lg"
                  >
                    {withdrawing ? "Processando..." : "Solicitar Saque"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Alert className="mt-6">
          <AlertDescription>
            <strong>Importante:</strong> Os saques são processados em até 24 horas úteis. 
            Certifique-se de que sua chave PIX esteja correta.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}