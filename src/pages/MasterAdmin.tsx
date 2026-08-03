import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Shield, Key, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

export default function MasterAdmin() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // O e-mail mestre será fixo para simplificar o acesso
      const masterEmail = 'admin@noxus.app';
      
      // Tenta logar
      let { data, error } = await supabase.auth.signInWithPassword({
        email: masterEmail,
        password: password,
      });

      // Se der erro de credenciais inválidas, e for a PRIMEIRA vez, tenta registrar
      if (error && error.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: masterEmail,
          password: password,
          options: { data: { full_name: 'Super Admin Noxus' } }
        });
        
        if (signUpError) throw signUpError;
        
        if (signUpData.user) {
          // Garante que é admin
          await supabase.from('nx_admin_users').insert({ user_id: signUpData.user.id });
          
          // Dá assinatura vitalícia (10 anos)
          const expiry = new Date();
          expiry.setFullYear(expiry.getFullYear() + 10);
          await supabase.from('nx_subscriptions').insert({ 
            user_id: signUpData.user.id, 
            expires_at: expiry.toISOString(),
            status: 'active'
          });

          // Faz login logo após criar
          const loginData = await supabase.auth.signInWithPassword({
            email: masterEmail,
            password: password,
          });
          data = loginData.data;
          error = loginData.error;
        }
      }

      if (error) {
        throw error;
      }

      toast.success("Acesso Master liberado!");
      navigate('/admin-noxus');
    } catch (err: any) {
      console.error(err);
      toast.error("Senha incorreta ou erro de conexão. (Verifique as chaves da Vercel)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      
      <Card className="w-full max-w-md border-border/50 bg-black/50 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-2xl border z-10">
        <CardHeader className="space-y-2 text-center pb-8 pt-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Acesso Mestre</CardTitle>
          <CardDescription className="text-base">
            Área restrita ao proprietário do sistema.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6 pb-8">
            <div className="space-y-2">
              <div className="relative group">
                <Key className="absolute left-4 top-4 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  type="password"
                  placeholder="Digite a senha de administrador"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 bg-background/50 border-border/50 focus:border-primary transition-all rounded-xl py-7 text-lg tracking-widest"
                  required
                />
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                A senha será registrada no primeiro acesso.
              </p>
            </div>
          </CardContent>
          <CardFooter className="pb-8">
            <Button 
              className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 group transition-all hover:scale-[1.02]" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin rounded-full" />
                  Verificando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Entrar no Sistema <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
