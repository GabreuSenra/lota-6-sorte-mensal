import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

const signupSchema = loginSchema;
type SignupForm = z.infer<typeof signupSchema>;

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const onLogin = async (values: LoginForm) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email!,
      password: values.password!,
    });
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message });
    } else {
      toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
      navigate("/dashboard");
    }
  };

  const onSignup = async (values: SignupForm) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { emailRedirectTo: redirectUrl },
    });
    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message });
    } else {
      toast({
        title: "Cadastro iniciado",
        description: "Verifique seu e-mail para confirmar o cadastro.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      <div className="container py-12">
        <Card className="max-w-xl mx-auto bg-gradient-card border-border shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-card-foreground">Acesse sua conta</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" placeholder="voce@email.com" {...loginForm.register("email")}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input id="password" type="password" placeholder="Sua senha" {...loginForm.register("password")}/>
                  </div>
                  <Button type="submit" variant="hero" className="w-full">Entrar</Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email2">E-mail</Label>
                    <Input id="email2" type="email" placeholder="voce@email.com" {...signupForm.register("email")}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password2">Senha</Label>
                    <Input id="password2" type="password" placeholder="Mínimo 6 caracteres" {...signupForm.register("password")}/>
                  </div>
                  <Button type="submit" variant="prize" className="w-full">Criar conta</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;