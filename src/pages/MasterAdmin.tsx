import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Shield, Key, ArrowRight, Database } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

export default function MasterAdmin() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Estados para configuração manual
  const [manualUrl, setManualUrl] = useState('');
  const [manualKey, setManualKey] = useState('');

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl || !manualKey) {
      toast.error("Preencha ambos os campos!");
      return;
    }
    localStorage.setItem('noxus_supabase_url', manualUrl);
    localStorage.setItem('noxus_supabase_key', manualKey);
    toast.success("Configuração salva localmente!");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured) {
      toast.error("O Supabase não está configurado!");
      return;
    }

    setLoading(true);

    try {
      const masterEmail = 'admin@noxus.app';
      
      let { data, error } = await supabase.auth.signInWithPassword({
        email: masterEmail,
        password: password,
      });

      if (error && error.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: masterEmail,
          password: password,
          options: { data: { full_name: 'Super Admin Noxus' } }
        });
        
        if (signUpError) throw signUpError;
        
        if (signUpData.user) {
          await supabase.from('nx_admin_users').insert({ user_id: signUpData.user.id });
          
          const expiry = new Date();
          expiry.setFullYear(expiry.getFullYear() + 10);
          await supabase.from('nx_subscriptions').insert({ 
            user_id: signUpData.user.id, 
            expires_at: expiry.toISOString(),
            status: 'active'
          });

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
      toast.error(`Erro: ${err.message || 'Erro desconhecido'} (Verifique as chaves)`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      
      <Card className="w-full max-w-md border-border/50 bg-black/50 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-2xl border z-10">
        
        {!isSupabaseConfigured ? (
          <form onSubmit={handleSaveConfig}>
            <CardHeader className="space-y-2 text-center pb-8 pt-8">
              <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <Database className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-500">Banco Desconectado</CardTitle>
              <CardDescription className="text-sm">
                A Vercel não conseguiu injetar as variáveis de ambiente. Insira as chaves manualmente abaixo para salvar no seu navegador e forçar o acesso.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Project URL</label>
                <Input
                  type="text"
                  placeholder="https://sua-url.supabase.co"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  className="bg-background/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Anon / Public Key</label>
                <Input
                  type="text"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                  value={manualKey}
                  onChange={(e) => setManualKey(e.target.value)}
                  className="bg-background/50"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="pb-8">
              <Button type="submit" className="w-full h-12 bg-red-600 hover:bg-red-700">
                Salvar Chaves e Recarregar
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <CardHeader className="space-y-2 text-center pb-8 pt-8">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">Acesso Mestre</CardTitle>
              <CardDescription className="text-base">
                Área restrita ao proprietário oficial do sistema.
              </CardDescription>
            </CardHeader>
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
            <div className="text-center pb-6">
               <button 
                 type="button" 
                 onClick={() => {
                   localStorage.removeItem('noxus_supabase_url');
                   localStorage.removeItem('noxus_supabase_key');
                   window.location.reload();
                 }}
                 className="text-xs text-muted-foreground hover:text-red-500 underline"
               >
                 Apagar chaves locais
               </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
