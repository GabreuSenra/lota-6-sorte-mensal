import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, CreditCard, DollarSign, FileText, Trophy, Settings, Gamepad2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile { 
  id: string; 
  user_id: string; 
  full_name: string | null; 
  cpf: string | null; 
  phone: string | null; 
  pix_key: string | null; 
  role: string;
}

interface Wallet {
  balance: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [profileForm, setProfileForm] = useState({ 
    full_name: "", 
    cpf: "", 
    phone: "", 
    pix_key: "" 
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setProfileForm({
          full_name: profileData.full_name || "",
          cpf: profileData.cpf || "",
          phone: profileData.phone || "",
          pix_key: profileData.pix_key || "",
        });
      }

      // Load wallet
      const { data: walletData } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      setWallet(walletData);

      // Load recent transactions
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentTransactions(transactionsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(profileForm)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Seus dados foram salvos com sucesso.",
      });

      loadData(); // Reload data
    } catch (error: any) {
      toast({
        title: "Erro ao salvar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const getTransactionColor = (type: string, status: string) => {
    if (status === "pending") return "bg-yellow-100 text-yellow-800";
    if (status === "rejected") return "bg-red-100 text-red-800";
    
    switch (type) {
      case "deposit": return "bg-green-100 text-green-800";
      case "withdrawal": return "bg-blue-100 text-blue-800";
      case "bet": return "bg-purple-100 text-purple-800";
      case "prize": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTransactionText = (type: string) => {
    switch (type) {
      case "deposit": return "Depósito";
      case "withdrawal": return "Saque";
      case "bet": return "Aposta";
      case "prize": return "Prêmio";
      default: return type;
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Carregando...</div>;
  }

  return (
    <div className="min-h-screen">
      <Header
        isAuthenticated={!!user}
        onLoginClick={() => navigate("/auth")}
        onDashboardClick={() => navigate("/dashboard")}
      />

      <div className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Minha Conta</h1>
          <div className="flex gap-2">
            {profile?.role === "admin" && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/admin")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}
            <Button variant="outline" onClick={signOut}>Sair</Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="h-24 flex-col"
            onClick={() => navigate("/apostar")}
          >
            <Gamepad2 className="h-6 w-6 mb-2" />
            Apostar
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex-col"
            onClick={() => navigate("/depositar")}
          >
            <CreditCard className="h-6 w-6 mb-2" />
            Depositar
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex-col"
            onClick={() => navigate("/sacar")}
          >
            <DollarSign className="h-6 w-6 mb-2" />
            Sacar
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex-col"
            onClick={() => navigate("/minhas-apostas")}
          >
            <Trophy className="h-6 w-6 mb-2" />
            Minhas Apostas
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Carteira */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Minha Carteira
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-4">
                R$ {wallet?.balance.toFixed(2) || "0,00"}
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => navigate("/depositar")}
                >
                  Depositar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/sacar")}
                >
                  Sacar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transações Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Transações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma transação ainda</p>
              ) : (
                <div className="space-y-2">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center">
                      <div>
                        <Badge className={getTransactionColor(transaction.type, transaction.status)}>
                          {getTransactionText(transaction.type)}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className={`font-medium ${
                        transaction.type === 'withdrawal' || transaction.type === 'bet' 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {transaction.type === 'withdrawal' || transaction.type === 'bet' ? '-' : '+'}
                        R$ {transaction.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Perfil */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Dados</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input 
                id="full_name" 
                value={profileForm.full_name} 
                onChange={(e) => setProfileForm(v => ({ ...v, full_name: e.target.value }))} 
                placeholder="Ex: Maria Silva" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input 
                id="cpf" 
                value={profileForm.cpf} 
                onChange={(e) => setProfileForm(v => ({ ...v, cpf: e.target.value }))} 
                placeholder="000.000.000-00" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input 
                id="phone" 
                value={profileForm.phone} 
                onChange={(e) => setProfileForm(v => ({ ...v, phone: e.target.value }))} 
                placeholder="(00) 90000-0000" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pix_key">Chave PIX</Label>
              <Input 
                id="pix_key" 
                value={profileForm.pix_key} 
                onChange={(e) => setProfileForm(v => ({ ...v, pix_key: e.target.value }))} 
                placeholder="CPF/E-mail/Celular/Random" 
              />
            </div>
            <div className="md:col-span-2">
              <Button onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? "Salvando..." : "Salvar Perfil"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Links Importantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="ghost" 
                className="justify-start h-auto p-4"
                onClick={() => navigate("/termos")}
              >
                <div className="text-left">
                  <div className="font-medium">Termos e Condições</div>
                  <div className="text-sm text-muted-foreground">Regras do bolão</div>
                </div>
              </Button>
              <Button 
                variant="ghost" 
                className="justify-start h-auto p-4"
                onClick={() => navigate("/jogo-responsavel")}
              >
                <div className="text-left">
                  <div className="font-medium">Jogo Responsável</div>
                  <div className="text-sm text-muted-foreground">Joghe com consciência</div>
                </div>
              </Button>
              <Button 
                variant="ghost" 
                className="justify-start h-auto p-4"
                onClick={() => navigate("/privacidade")}
              >
                <div className="text-left">
                  <div className="font-medium">Privacidade</div>
                  <div className="text-sm text-muted-foreground">Proteção de dados</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;