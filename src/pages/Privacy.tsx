import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Privacy() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Header isAuthenticated={!!user} />
      
      <div className="container mx-auto p-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Política de Privacidade
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h2>1. Informações que Coletamos</h2>
            <p>Coletamos as seguintes informações para fornecer nossos serviços:</p>
            <ul>
              <li><strong>Informações de conta:</strong> nome completo, e-mail, CPF</li>
              <li><strong>Informações financeiras:</strong> chave PIX para pagamentos</li>
              <li><strong>Dados de uso:</strong> apostas realizadas, transações financeiras</li>
              <li><strong>Informações técnicas:</strong> endereço IP, dados de navegação</li>
            </ul>

            <h2>2. Como Usamos suas Informações</h2>
            <p>Utilizamos seus dados para:</p>
            <ul>
              <li>Processar apostas e pagamentos</li>
              <li>Verificar identidade e prevenir fraudes</li>
              <li>Enviar comunicações sobre sorteios e resultados</li>
              <li>Melhorar nossos serviços</li>
              <li>Cumprir obrigações legais</li>
            </ul>

            <h2>3. Compartilhamento de Informações</h2>
            <p>Não vendemos ou alugamos seus dados pessoais. Podemos compartilhar informações apenas:</p>
            <ul>
              <li>Com prestadores de serviços autorizados (processamento de pagamentos)</li>
              <li>Quando exigido por lei ou ordem judicial</li>
              <li>Para proteger nossos direitos legais</li>
              <li>Com seu consentimento explícito</li>
            </ul>

            <h2>4. Segurança dos Dados</h2>
            <p>
              Implementamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
            </p>
            <ul>
              <li>Criptografia de dados sensíveis</li>
              <li>Acesso restrito por funcionários autorizados</li>
              <li>Monitoramento de segurança contínuo</li>
              <li>Backups seguros e regulares</li>
            </ul>

            <h2>5. Retenção de Dados</h2>
            <p>
              Mantemos seus dados pelo tempo necessário para fornecer nossos serviços e cumprir 
              obrigações legais. Dados financeiros são mantidos conforme exigido pela legislação brasileira.
            </p>

            <h2>6. Seus Direitos</h2>
            <p>Você tem o direito de:</p>
            <ul>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir informações incorretas</li>
              <li>Solicitar exclusão de dados (sujeito a limitações legais)</li>
              <li>Revogar consentimentos</li>
              <li>Solicitar portabilidade de dados</li>
            </ul>

            <h2>7. Cookies e Tecnologias Similares</h2>
            <p>
              Utilizamos cookies para melhorar sua experiência, analisar uso do site e personalizar conteúdo. 
              Você pode gerenciar cookies através das configurações do seu navegador.
            </p>

            <h2>8. Transferências Internacionais</h2>
            <p>
              Seus dados podem ser processados em servidores localizados fora do Brasil, 
              sempre com garantias adequadas de proteção conforme a LGPD.
            </p>

            <h2>9. Menores de Idade</h2>
            <p>
              Nossos serviços são destinados apenas a maiores de 18 anos. 
              Não coletamos intencionalmente dados de menores de idade.
            </p>

            <h2>10. Alterações na Política</h2>
            <p>
              Esta política pode ser atualizada periodicamente. Notificaremos sobre mudanças 
              significativas através do site ou e-mail.
            </p>

            <h2>11. Contato</h2>
            <p>
              Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, 
              entre em contato através dos canais oficiais disponibilizados.
            </p>

            <h2>12. Base Legal (LGPD)</h2>
            <p>O processamento de seus dados é baseado em:</p>
            <ul>
              <li>Execução de contrato (apostas e pagamentos)</li>
              <li>Cumprimento de obrigação legal</li>
              <li>Legítimo interesse (segurança e prevenção de fraudes)</li>
              <li>Consentimento (comunicações promocionais)</li>
            </ul>

            <p className="text-sm text-muted-foreground mt-8">
              Última atualização: Janeiro de 2025
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}