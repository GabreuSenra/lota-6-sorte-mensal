import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Bet from "./pages/Bet";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import MyBets from "./pages/MyBets";
import Admin from "./pages/Admin";
import Terms from "./pages/Terms";
import ResponsibleGaming from "./pages/ResponsibleGaming";
import Privacy from "./pages/Privacy";
import Transactions from "./pages/Transactions";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/apostar" element={<Bet />} />
            <Route path="/depositar" element={<Deposit />} />
            <Route path="/sacar" element={<Withdraw />} />
            <Route path="/minhas-apostas" element={<MyBets />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/termos" element={<Terms />} />
            <Route path="/jogo-responsavel" element={<ResponsibleGaming />} />
            <Route path="/privacidade" element={<Privacy />} />
            <Route path="/transacoes" element={<Transactions />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
