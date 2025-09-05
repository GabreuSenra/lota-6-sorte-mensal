import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Calendar } from "lucide-react";

export const PrizeInfo = () => {
  // Mock data - in real app this would come from backend
  const currentPrize = 15420;
  const participants = 347;
  const nextDraw = "Último sábado de janeiro";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <Card className="bg-gradient-card border-border shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-card-foreground">
            Prêmio Acumulado
          </CardTitle>
          <Trophy className="h-4 w-4 text-secondary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-secondary">
            R$ {currentPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            80% para 6 acertos • 20% para 5 acertos
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-border shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-card-foreground">
            Participantes
          </CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {participants}
          </div>
          <p className="text-xs text-muted-foreground">
            apostas confirmadas este mês
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-border shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-card-foreground">
            Próximo Sorteio
          </CardTitle>
          <Calendar className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-accent">
            {nextDraw}
          </div>
          <p className="text-xs text-muted-foreground">
            baseado na Lotomania
          </p>
        </CardContent>
      </Card>
    </div>
  );
};