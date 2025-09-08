import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Terms() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen ">
      <Header isAuthenticated={!!user} />
      
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Termos e Condições</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h2>1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar este serviço, você aceita estar vinculado aos termos e condições 
              de uso descritos aqui.
            </p>

            <h2>2. Descrição do Serviço</h2>
            <p>
              O Lota 6 Sorte é um bolão mensal baseado nos resultados oficiais da Lotomania. 
              Os participantes escolhem 25 números de 00 a 99 por R$ 5,00.
            </p>

            <h2>3. Regras do Jogo</h2>
            <ul>
              <li>Cada aposta custa R$ 5,00</li>
              <li>Participantes devem escolher exatamente 25 números (00-99)</li>
              <li>Apostas encerram às 19h30 da última sexta-feira do mês</li>
              <li>Resultado baseado no sorteio oficial da Lotomania</li>
              <li>Prêmio é 80% do total arrecadado (20% taxa administrativa)</li>
            </ul>

            <h2>4. Sistema de Carteira</h2>
            <p>
              Todos os usuários possuem uma carteira virtual para depósitos, apostas e saques. 
              Valores mínimos: depósito R$ 5,00, saque R$ 10,00.
            </p>

            <h2>5. Pagamentos e Saques</h2>
            <p>
              Depósitos e saques são realizados via PIX. Saques são processados em até 24 horas úteis.
            </p>

            <h2>6. Responsabilidades</h2>
            <p>
              Os usuários são responsáveis por manter suas informações atualizadas, 
              especialmente a chave PIX para recebimento de prêmios.
            </p>

            <h2>7. Limitações</h2>
            <p>
              O serviço não se responsabiliza por problemas técnicos que impeçam a participação, 
              desde que não sejam de nossa responsabilidade direta.
            </p>

            <h2>8. Modificações</h2>
            <p>
              Estes termos podem ser modificados a qualquer momento. 
              Alterações entram em vigor imediatamente após publicação.
            </p>

            <h2>9. Contato</h2>
            <p>
              Para dúvidas ou suporte, entre em contato através dos canais oficiais disponibilizados.
            </p>

            <p className="text-sm text-muted-foreground mt-8">
              Última atualização: Janeiro de 2025
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}