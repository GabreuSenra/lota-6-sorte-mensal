import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ResponsibleGaming() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Header isAuthenticated={!!user} />
      
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Jogo Responsável
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> Jogos de azar podem causar dependência. 
                Jogue com responsabilidade e dentro de suas possibilidades financeiras.
              </AlertDescription>
            </Alert>

            <div>
              <h2 className="text-xl font-semibold mb-3">O que é Jogo Responsável?</h2>
              <p>
                Jogo responsável significa participar de atividades de apostas de forma consciente, 
                controlada e dentro de limites financeiros que não comprometam sua qualidade de vida.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Sinais de Alerta</h2>
              <p>Fique atento aos seguintes sinais que podem indicar problemas com jogos:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Apostar mais dinheiro do que pode perder</li>
                <li>Perseguir perdas com apostas maiores</li>
                <li>Negligenciar responsabilidades familiares ou profissionais</li>
                <li>Mentir sobre gastos com jogos</li>
                <li>Sentir ansiedade ou irritação quando não pode jogar</li>
                <li>Usar dinheiro destinado a necessidades básicas</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Dicas para Jogar com Responsabilidade</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Estabeleça limites:</strong> Defina quanto pode gastar mensalmente e não ultrapasse este valor
                </li>
                <li>
                  <strong>Veja como entretenimento:</strong> Considere o valor gasto como custo de diversão, não investimento
                </li>
                <li>
                  <strong>Não persiga perdas:</strong> Aceite as perdas como parte do jogo
                </li>
                <li>
                  <strong>Faça pausas:</strong> Não jogue todos os dias, tire intervalos regulares
                </li>
                <li>
                  <strong>Mantenha outras atividades:</strong> Não deixe o jogo ser sua única fonte de diversão
                </li>
                <li>
                  <strong>Jogue sóbrio:</strong> Nunca aposte sob influência de álcool ou drogas
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Limites Recomendados</h2>
              <div className="bg-blue-500 p-4 rounded-lg">
                <p className="font-medium mb-2">Para o Lota 6 Sorte especificamente:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Limite máximo sugerido: R$ 20,00 por mês (4 apostas)</li>
                  <li>Nunca aposte dinheiro que precisa para despesas essenciais</li>
                  <li>Considere pausar se estiver enfrentando dificuldades financeiras</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Quando Buscar Ajuda</h2>
              <p>Se você ou alguém que conhece apresenta sinais de jogo problemático, procure ajuda:</p>
              
              <div className="bg-yellow-500 p-4 rounded-lg mt-4">
                <h3 className="font-medium mb-2">Recursos de Apoio:</h3>
                <ul className="space-y-2">
                  <li>
                    <strong>Jogadores Anônimos:</strong> Grupos de apoio gratuitos
                    <br />
                    <span className="text-sm text-gray-600">Site: www.jogadoresanonimos.org.br</span>
                  </li>
                  <li>
                    <strong>CVV (Centro de Valorização da Vida):</strong> 188
                    <br />
                    <span className="text-sm text-gray-600">Apoio emocional 24 horas</span>
                  </li>
                  <li>
                    <strong>Profissionais especializados:</strong> Psicólogos e psiquiatras
                    <br />
                    <span className="text-sm text-gray-600">Busque ajuda no SUS ou planos de saúde</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Autoexclusão</h2>
              <p>
                Se você sente que precisa parar de jogar, entre em contato conosco para solicitar 
                a exclusão temporária ou permanente de sua conta.
              </p>
            </div>

            <Alert className="mt-6">
              <AlertDescription>
                <strong>Lembre-se:</strong> O jogo deve ser sempre uma atividade de lazer. 
                Se deixou de ser divertido, é hora de parar e buscar ajuda.
              </AlertDescription>
            </Alert>

            <p className="text-sm text-muted-foreground mt-8">
              Última atualização: Janeiro de 2025
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}