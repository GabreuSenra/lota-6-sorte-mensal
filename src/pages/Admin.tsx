import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, DollarSign, Calendar } from "lucide-react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WithdrawRequest {
  id: string;
  user_id: string;
  amount: number;
  created_at: string;
  description: string;
  profiles: {
    full_name: string;
    pix_key: string;
  };
}

interface Contest {
  id: string;
  month_year: string;
  draw_date: string;
  status: string;
  closing_date: string;
  total_collected: number;
  winning_numbers: number[] | null;
  bet_price?: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [currentContest, setCurrentContest] = useState<Contest | null>(null);
  const [winningNumbers, setWinningNumbers] = useState<string>("");
  const [newContestData, setNewContestData] = useState({
    monthYear: "",
    drawDate: "",
    closingDate: "",
    betPrice: "5.00"
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkAdminStatus();
  }, [user, navigate]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('is_admin');

      if (error) throw error;

      if (!data) {
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      await fetchData();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('withdrawals-admin')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions', filter: 'type=eq.withdrawal' }, (payload) => {
        const record: any = (payload as any).new;
        if (record?.status === 'pending') {
          toast({
            title: 'Novo saque solicitado',
            description: `R$ ${Number(record.amount).toFixed(2)} aguardando aprovação`,
          });
          fetchData();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      // Fetch pending withdrawals with profile data
      const { data: withdrawData } = await supabase
        .from("transactions")
        .select(`
          id,
          user_id,
          amount,
          created_at,
          description
        `)
        .eq("type", "withdrawal")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      // Fetch profile data separately for each withdrawal
      const withdrawRequestsWithProfiles = [];
      if (withdrawData) {
        for (const withdrawal of withdrawData) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, pix_key")
            .eq("user_id", withdrawal.user_id)
            .single();

          withdrawRequestsWithProfiles.push({
            ...withdrawal,
            profiles: profileData || { full_name: "N/A", pix_key: "N/A" }
          });
        }
      }

      setWithdrawRequests(withdrawRequestsWithProfiles);

      // Fetch current contest
      const { data: contestData } = await supabase
        .from("contests")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setCurrentContest(contestData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const approveWithdrawal = async (withdrawalId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('approve-withdrawal', {
        body: { transactionId: withdrawalId }
      });
      if (error) throw error;
      toast({
        title: "Saque aprovado",
        description: "PIX enviado e carteira atualizada.",
      });
      await fetchData();
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      toast({
        title: "Erro",
        description: "Não foi possível processar o saque.",
        variant: "destructive",
      });
    }
  };

  const rejectWithdrawal = async (withdrawalId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('reject-withdrawal', {
        body: { transactionId: withdrawalId }
      });
      if (error) throw error;
      toast({
        title: "Saque rejeitado",
        description: "Solicitação de saque foi rejeitada.",
      });
      await fetchData();
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o saque.",
        variant: "destructive",
      });
    }
  };

  const finalizeContest = async () => {
    if (!currentContest || !winningNumbers) return;

    try {
      const numbers = winningNumbers.split(",").map((n) => parseInt(n.trim()));

      if (numbers.length !== 20 || numbers.some((n) => isNaN(n) || n < 0 || n > 99)) {
        toast({
          title: "Erro",
          description: "Digite exatamente 20 números válidos separados por vírgula (0-99).",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('handle-contest-end', {
        body: { contestId: currentContest.id, winningNumbers: numbers },
      });
      if (error) throw error;

      toast({
        title: "Sorteio finalizado",
        description: data?.hadWinners
          ? `Prêmios pagos automaticamente. Vencedores 6: ${data.winners6} | Vencedores 5: ${data.winners5}`
          : "Sem vencedores (5+). Valor acumula para o próximo sorteio.",
      });

      setCurrentContest(null);
      setWinningNumbers("");
    } catch (error) {
      console.error("Error finalizing contest:", error);
      toast({
        title: "Erro",
        description: "Não foi possível finalizar o sorteio.",
        variant: "destructive",
      });
    }
  };

  const createNewContest = async () => {
    if (!newContestData.monthYear || !newContestData.drawDate || !newContestData.closingDate || !newContestData.betPrice) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    const betPriceValue = parseFloat(newContestData.betPrice);
    if (isNaN(betPriceValue) || betPriceValue <= 0) {
      toast({
        title: "Erro",
        description: "Digite um preço válido para a aposta.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Determina o valor inicial (carryover) baseado no último sorteio fechado
      let initialCollected = 0;
      const { data: lastClosed } = await supabase
        .from('contests')
        .select('id, total_collected')
        .eq('status', 'closed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastClosed) {
        const { count } = await supabase
          .from('bets')
          .select('id', { count: 'exact', head: true })
          .eq('contest_id', lastClosed.id)
          .gte('hits', 5);
        initialCollected = count && count > 0 ? 0 : Number(lastClosed.total_collected || 0);
      }

      const { error } = await supabase
        .from("contests")
        .insert({
          month_year: newContestData.monthYear,
          draw_date: newContestData.drawDate,
          closing_date: newContestData.closingDate,
          bet_price: betPriceValue,
          status: "open",
          total_collected: initialCollected
        });

      if (error) throw error;

      toast({
        title: "Novo sorteio criado",
        description: initialCollected > 0
          ? `Sorteio criado com acumulado de R$ ${initialCollected.toFixed(2)} e preço da aposta R$ ${betPriceValue.toFixed(2)}`
          : `Sorteio foi criado com preço da aposta R$ ${betPriceValue.toFixed(2)} e está aberto para apostas.`,
      });

      setNewContestData({ monthYear: "", drawDate: "", closingDate: "", betPrice: "5.00" });
      await fetchData();
    } catch (error) {
      console.error("Error creating contest:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o novo sorteio.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Carregando...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <Header isAuthenticated={!!user} />
        <div className="container mx-auto p-4">
          <Alert>
            <AlertDescription>
              Acesso negado. Você não tem permissão para acessar esta página.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
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
          <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie saques e sorteios</p>
        </div>

        <Tabs defaultValue="withdrawals" className="space-y-6">
          <TabsList>
            <TabsTrigger value="withdrawals">Solicitações de Saque</TabsTrigger>
            <TabsTrigger value="contests">Gerenciar Sorteios</TabsTrigger>
          </TabsList>

          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Solicitações de Saque Pendentes
                </CardTitle>
                <CardDescription>
                  Processe os saques solicitados pelos usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                {withdrawRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma solicitação de saque pendente.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {withdrawRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{request.profiles.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Chave PIX: {request.profiles.pix_key}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Data: {new Date(request.created_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                              R$ {request.amount.toFixed(2)}
                            </p>
                            <Badge variant="outline">Pendente</Badge>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => approveWithdrawal(request.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectWithdrawal(request.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contests">
            <div className="grid gap-6 md:grid-cols-1">
              {currentContest && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Finalizar Sorteio Atual
                    </CardTitle>
                    <CardDescription>
                      {currentContest.month_year} - R$ {currentContest.total_collected.toFixed(2)} arrecadado - Preço da aposta: R$ {(currentContest.bet_price || 5.00).toFixed(2)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Números Sorteados - 20 dezenas (separados por vírgula)</label>
                      <Input
                        placeholder="Ex: 1, 5, 8, 12, 15, 23, 28, 34, 37, 45, 52, 59, 63, 67, 71, 78, 82, 89, 94, 97"
                        value={winningNumbers}
                        onChange={(e) => setWinningNumbers(e.target.value)}
                      />
                    </div>
                    <Button onClick={finalizeContest} className="w-full">
                      Finalizar Sorteio
                    </Button>
                  </CardContent>
                </Card>
              )}
              {!currentContest && (<Card>
                <CardHeader>
                  <CardTitle>Criar Novo Sorteio</CardTitle>
                  <CardDescription>
                    Configure um novo sorteio para receber apostas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nome do novo Sorteio</label>
                    <Input
                      placeholder="Ex: Janeiro 2026"
                      value={newContestData.monthYear}
                      onChange={(e) => setNewContestData({ ...newContestData, monthYear: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Data de abertuda do novo Sorteio</label>
                    <Input
                      type="date"
                      value={newContestData.drawDate}
                      onChange={(e) => setNewContestData({ ...newContestData, drawDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Data e hora de Encerramento do novo Sorteio</label>
                    <Input
                      type="datetime-local"
                      value={newContestData.closingDate}
                      onChange={(e) => setNewContestData({ ...newContestData, closingDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Preço da Aposta (R$)</label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="5.00"
                      value={newContestData.betPrice}
                      onChange={(e) => setNewContestData({ ...newContestData, betPrice: e.target.value })}
                    />
                  </div>
                  <Button onClick={createNewContest} className="w-full">
                    Criar Sorteio
                  </Button>
                </CardContent>
              </Card>)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}