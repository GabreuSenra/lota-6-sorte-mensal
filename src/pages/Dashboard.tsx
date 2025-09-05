import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { NumberPicker } from "@/components/NumberPicker";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Contest { id: string; month_year: string; draw_date: string; status: string; }
interface Profile { id: string; user_id: string; full_name: string | null; cpf: string | null; phone: string | null; pix_key: string | null; }
interface Bet { id: string; chosen_numbers: number[]; payment_status: string; amount: number; }

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState({ full_name: "", cpf: "", phone: "", pix_key: "" });
  const [contest, setContest] = useState<Contest | null>(null);
  const [bet, setBet] = useState<Bet | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [placingBet, setPlacingBet] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      // Load profile
      const { data: prof, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (pErr) console.error(pErr);
      if (prof) {
        setProfile(prof as unknown as Profile);
        setProfileForm({
          full_name: (prof as any).full_name ?? "",
          cpf: (prof as any).cpf ?? "",
          phone: (prof as any).phone ?? "",
          pix_key: (prof as any).pix_key ?? "",
        });
      }

      // Load current contest
      const { data: openContest } = await supabase
        .from("contests")
        .select("*")
        .eq("status", "open")
        .order("draw_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (openContest) setContest(openContest as unknown as Contest);

      // Load existing bet
      if (openContest) {
        const { data: existingBet } = await supabase
          .from("bets")
          .select("id, chosen_numbers, payment_status, amount")
          .eq("user_id", user.id)
          .eq("contest_id", (openContest as any).id)
          .maybeSingle();
        if (existingBet) setBet(existingBet as unknown as Bet);
      }
    };
    load();
  }, [user]);

  const canPlaceBet = useMemo(() => selectedNumbers.length === 6 && !!contest && !!user && !bet, [selectedNumbers, contest, user, bet]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const payload = { user_id: user.id, ...profileForm };
    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
    setSavingProfile(false);
    if (error) {
      toast({ title: "Erro ao salvar perfil", description: error.message });
    } else {
      toast({ title: "Perfil atualizado", description: "Seus dados foram salvos." });
    }
  };

  const placeBet = async () => {
    if (!user || !contest) return;
    setPlacingBet(true);
    const { error, data } = await supabase
      .from("bets")
      .insert({
        user_id: user.id,
        contest_id: contest.id,
        chosen_numbers: selectedNumbers,
        amount: 5.0,
        payment_status: "pending",
      })
      .select("id, chosen_numbers, payment_status, amount")
      .maybeSingle();
    setPlacingBet(false);
    if (error) {
      toast({ title: "Erro ao registrar aposta", description: error.message });
    } else if (data) {
      setBet(data as any);
      toast({ title: "Aposta registrada!", description: "Finalize com o pagamento PIX." });
    }
  };

  const handlePixPayment = async () => {
    // Pending: Needs Stripe Secret Key and price config to enable PIX Checkout
    toast({
      title: "Pagamento PIX",
      description: "Configuração pendente. Envie sua Stripe Secret Key e valor para ativar o Checkout PIX.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header
        isAuthenticated={!!user}
        onLoginClick={() => navigate("/auth")}
        onDashboardClick={() => navigate("/dashboard")}
      />

      <div className="container py-10 space-y-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Minha Conta</h1>
          <Button variant="outline" onClick={signOut}>Sair</Button>
        </div>

        {/* Perfil */}
        <Card className="bg-gradient-card border-border shadow-elegant">
          <CardHeader>
            <CardTitle className="text-card-foreground">Seus Dados</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input id="full_name" value={profileForm.full_name} onChange={(e) => setProfileForm(v => ({ ...v, full_name: e.target.value }))} placeholder="Ex: Maria Silva" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" value={profileForm.cpf} onChange={(e) => setProfileForm(v => ({ ...v, cpf: e.target.value }))} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={profileForm.phone} onChange={(e) => setProfileForm(v => ({ ...v, phone: e.target.value }))} placeholder="(00) 90000-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pix_key">Chave PIX</Label>
              <Input id="pix_key" value={profileForm.pix_key} onChange={(e) => setProfileForm(v => ({ ...v, pix_key: e.target.value }))} placeholder="CPF/E-mail/Celular/Random" />
            </div>
            <div className="md:col-span-2">
              <Button variant="hero" onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? "Salvando..." : "Salvar Perfil"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Aposta Atual */}
        <Card className="bg-gradient-card border-border shadow-elegant">
          <CardHeader>
            <CardTitle className="text-card-foreground">Aposta do Mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {contest ? (
              <p className="text-muted-foreground">Concurso atual: {contest.month_year} • Sorteio em {new Date(contest.draw_date).toLocaleDateString("pt-BR")}</p>
            ) : (
              <p className="text-muted-foreground">Nenhum concurso disponível no momento.</p>
            )}

            {bet ? (
              <div className="space-y-4">
                <p className="text-foreground">Você já possui uma aposta registrada.</p>
                <div className="flex flex-wrap gap-2">
                  {bet.chosen_numbers.map((n) => (
                    <span key={n} className="inline-flex items-center justify-center w-8 h-8 bg-gradient-lucky text-primary-foreground rounded-full text-sm font-bold shadow-glow">
                      {n.toString().padStart(2, "0")}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="prize" onClick={handlePixPayment}>
                    {bet.payment_status === "paid" ? "Pago" : "Pagar via PIX"}
                  </Button>
                  <span className="text-sm text-muted-foreground">Valor: R$ 5,00</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <NumberPicker selectedNumbers={selectedNumbers} onNumberSelect={setSelectedNumbers} />
                <Button variant="prize" disabled={!canPlaceBet || placingBet} onClick={placeBet}>
                  {placingBet ? "Registrando..." : "Confirmar Aposta - R$ 5,00"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;