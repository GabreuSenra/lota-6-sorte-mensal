import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, ArrowLeft, CreditCard } from "lucide-react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Wallet {
  balance: number;
}

export default function Deposit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchWallet();
  }, [user, navigate]);

  const fetchWallet = async () => {
    try {
      const { data: walletData } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user!.id)
        .single();

      setWallet(walletData);
    } catch (error) {
      console.error("Error fetching wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    
    if (!depositAmount || depositAmount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor válido para depósito.",
        variant: "destructive",
      });
      return;
    }

    if (depositAmount < 5) {
      toast({
        title: "Valor mínimo",
        description: "O valor mínimo para depósito é R$ 5,00.",
        variant: "destructive",
      });
      return;
    }

    setDepositing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          amount: depositAmount,
          description: `Depósito na carteira`
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // Show QR code or PIX copy-paste code
      if (data.qr_code) {
        toast({
          title: "PIX gerado com sucesso!",
          description: "Use o código PIX abaixo para realizar o pagamento.",
        });
        
        // You can show the QR code here or redirect to a payment page
        // For now, we'll show the ticket URL
        if (data.ticket_url) {
          window.open(data.ticket_url, '_blank');
        }
      }

      setAmount("");
      fetchWallet(); // Refresh wallet data
      
    } catch (error) {
      console.error("Error creating PIX payment:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível processar sua solicitação.",
        variant: "destructive",
      });
    } finally {
      setDepositing(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Carregando...</div>;
  }

  return (
    <div className="min-h-screen">
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
                Saldo Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                R$ {wallet?.balance.toFixed(2) || "0,00"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Fazer Depósito
              </CardTitle>
              <CardDescription>
                Solicite um depósito via PIX
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Valor do Depósito</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="5"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Valor mínimo: R$ 5,00
                </p>
              </div>

              <Button
                onClick={handleDeposit}
                disabled={depositing || !amount}
                className="w-full"
                size="lg"
              >
                {depositing ? "Processando..." : "Solicitar Depósito"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Alert className="mt-6">
          <AlertDescription>
            <strong>Como funciona:</strong> Após solicitar o depósito, você receberá as instruções 
            de pagamento via PIX. O valor será creditado em sua carteira após a confirmação do pagamento.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}