import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Key, Users, Plus, CheckCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export default function SuperAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasAnyAdmin, setHasAnyAdmin] = useState(true);
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [newStudentName, setNewStudentName] = useState('');

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: adminData } = await supabase
        .from('nx_admin_users')
        .select('*');
      
      if (!adminData || adminData.length === 0) {
        setHasAnyAdmin(false);
      } else {
        const isMe = adminData.some(a => a.user_id === user.id);
        setIsAdmin(isMe);
        if (isMe) {
          fetchCodes();
          fetchSubscriptions();
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const claimAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('nx_admin_users')
        .insert({ user_id: user.id });

      if (error) throw error;
      toast.success("Parabéns! Você agora é o Super Admin.");
      checkAdminStatus();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao clamar admin. Talvez já exista um.");
    }
  };

  const generateCode = async () => {
    if (!newStudentName) {
      toast.error("Digite o nome do aluno.");
      return;
    }
    const randomCode = 'NOXUS-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    try {
      const { error } = await supabase
        .from('nx_access_codes')
        .insert({ code: randomCode, student_name: newStudentName });

      if (error) throw error;
      toast.success(`Código ${randomCode} gerado com sucesso!`);
      setNewStudentName('');
      fetchCodes();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar código.");
    }
  };

  const fetchCodes = async () => {
    const { data } = await supabase.from('nx_access_codes').select('*').order('created_at', { ascending: false });
    if (data) setCodes(data);
  };

  const fetchSubscriptions = async () => {
    const { data } = await supabase.from('nx_subscriptions').select('*').order('expires_at', { ascending: true });
    if (data) setSubscriptions(data);
  };

  const renewSubscription = async (id: string, currentExpiry: string) => {
    try {
      const date = new Date(currentExpiry);
      date.setDate(date.getDate() + 30); // Adiciona 30 dias

      const { error } = await supabase
        .from('nx_subscriptions')
        .update({ expires_at: date.toISOString(), status: 'active' })
        .eq('id', id);

      if (error) throw error;
      toast.success("Assinatura renovada por +30 dias!");
      fetchSubscriptions();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao renovar assinatura.");
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando painel admin...</div>;

  if (!hasAnyAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
        <Shield className="w-16 h-16 text-primary mb-4" />
        <h1 className="text-3xl font-bold mb-2">Sistema Sem Dono</h1>
        <p className="text-muted-foreground mb-8">Nenhum administrador foi definido ainda. Reivindique o controle do aplicativo agora.</p>
        <Button size="lg" onClick={claimAdmin}>Reivindicar Super Admin</Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center text-destructive">
        <Shield className="w-16 h-16 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Acesso Negado</h1>
        <p>Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="text-primary" />
          Painel Super Admin
        </h1>
        <p className="text-muted-foreground">Gerencie o acesso dos seus alunos e renovações de assinatura.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key className="w-5 h-5" /> Gerar Código de Acesso</CardTitle>
            <CardDescription>Crie um convite para um novo aluno se cadastrar no aplicativo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Aluno</Label>
              <Input 
                placeholder="Ex: João Tatuador" 
                value={newStudentName}
                onChange={e => setNewStudentName(e.target.value)}
              />
            </div>
            <Button onClick={generateCode} className="w-full">
              <Plus className="w-4 h-4 mr-2" /> Gerar Código Único
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Assinaturas Ativas</CardTitle>
            <CardDescription>Controle quem tem acesso liberado ao aplicativo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {subscriptions.map(sub => (
                <div key={sub.id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Usuário ID: <span className="text-xs text-muted-foreground">{sub.user_id.substring(0,8)}...</span></p>
                    <p className={`text-xs flex items-center gap-1 ${new Date(sub.expires_at) < new Date() ? 'text-destructive' : 'text-success'}`}>
                      <Clock className="w-3 h-3" /> Vence em: {new Date(sub.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => renewSubscription(sub.id, sub.expires_at)}>
                    +30 Dias
                  </Button>
                </div>
              ))}
              {subscriptions.length === 0 && <p className="text-sm text-muted-foreground">Nenhum aluno cadastrado ainda.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Histórico de Códigos Gerados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {codes.map(code => (
                <div key={code.id} className="p-4 border rounded-lg flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-lg">{code.code}</span>
                    {code.status === 'used' ? (
                      <span className="bg-success/20 text-success px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Usado
                      </span>
                    ) : (
                      <span className="bg-blue-500/20 text-blue-500 px-2 py-1 rounded-full text-xs font-medium">
                        Disponível
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Para: {code.student_name}</p>
                </div>
              ))}
              {codes.length === 0 && <p className="text-sm text-muted-foreground">Nenhum código gerado.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
