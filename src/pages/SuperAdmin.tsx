import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, ShieldAlert, Key, Users, UserPlus, User, Plus, CheckCircle, Clock, Smartphone, Phone, Mail, DollarSign, Calendar, CreditCard, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

export default function SuperAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasAnyAdmin, setHasAnyAdmin] = useState(true);
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  
  // Novos estados para o cadastro completo
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [subscriptionValue, setSubscriptionValue] = useState('');

  const isDemoMode = localStorage.getItem("noxus_demo_mode") === "true";

  useEffect(() => {
    const demoRole = localStorage.getItem("noxus_demo_role");
    if (isDemoMode && demoRole === "admin") {
      setHasAnyAdmin(true);
      setIsAdmin(true);
      fetchCodes();
      fetchSubscriptions();
      setLoading(false);
      return;
    }
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const userStr = localStorage.getItem("noxus_user");
      if (!userStr) {
        setHasAnyAdmin(false);
        setLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      
      if (user && (user.role === 'MASTER' || user.role === 'SUPERADMIN')) {
        setIsAdmin(true);
        setHasAnyAdmin(true);
        fetchCodes();
        fetchSubscriptions();
      } else {
        setHasAnyAdmin(false);
      }
    } catch (error) {
      console.error(error);
      setHasAnyAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    if (!newStudentName || !paymentMethod || !subscriptionValue) {
      toast.error("Preencha o nome, método de pagamento e valor.");
      return;
    }
    const randomCode = 'NOXUS-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const newClientData = {
      code: randomCode,
      clientName: newStudentName,
      clientPhone: newStudentPhone,
      clientEmail: newStudentEmail,
      paymentMethod: paymentMethod,
      subscriptionValue: Number(subscriptionValue),
      status: 'available'
    };

    try {
      if (isDemoMode) {
        const localCodes = JSON.parse(localStorage.getItem("mock_nx_codes") || "[]");
        localCodes.push({ id: Math.random(), ...newClientData, created_at: new Date().toISOString() });
        localStorage.setItem("mock_nx_codes", JSON.stringify(localCodes));
        
        toast.success(`Cliente registrado e Código ${randomCode} gerado com sucesso!`);
        clearForm();
        fetchCodes();
        return;
      }

      // Create a simulated user first so they appear in Gestão de Usuários immediately
      const simulatedUserId = crypto.randomUUID();
      
      const { error: userErr } = await supabase.from('noxus_users').insert({
        id: simulatedUserId,
        name: newStudentName,
        email: newStudentEmail,
        whatsapp: newStudentPhone,
        role: 'USER',
        isActive: true
      });

      if (userErr) {
        console.error("Erro ao criar usuário", userErr);
      }

      const clientDataWithUserId = {
        ...newClientData,
        usedById: simulatedUserId,
        isUsed: true
      };

      const { error } = await supabase
        .from('noxus_access_codes')
        .insert([clientDataWithUserId]);

      if (error) throw error;
      
      // Generate initial subscription of 30 days
      let newDate = new Date();
      newDate.setDate(newDate.getDate() + 30);
      
      await supabase.from('noxus_subscriptions').insert({ 
          userId: simulatedUserId, 
          expiresAt: newDate.toISOString() 
      });

      toast.success(`Código ${randomCode} gerado com sucesso!`);
      clearForm();
      fetchCodes();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar código e registrar cliente.");
    }
  };

  const clearForm = () => {
    setNewStudentName('');
    setNewStudentPhone('');
    setNewStudentEmail('');
    setPaymentMethod('');
    setSubscriptionValue('');
  };

  const fetchCodes = async () => {
    if (isDemoMode) {
      const localCodes = JSON.parse(localStorage.getItem("mock_nx_codes") || "[]");
      setCodes(localCodes.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('noxus_access_codes')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      if (data) setCodes(data);
    } catch (error) {
      console.error("Erro ao buscar códigos", error);
    }
  };

  const fetchSubscriptions = async () => {
    if (isDemoMode) {
      const localSubs = JSON.parse(localStorage.getItem("mock_nx_subs") || "[]");
      setSubscriptions(localSubs);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('noxus_subscriptions')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      if (data) setSubscriptions(data);
    } catch (error) {
      console.error("Erro ao buscar assinaturas", error);
    }
  };

  const renewSubscription = async (id: string, currentExpiry: string) => {
    try {
      const date = new Date(currentExpiry);
      date.setDate(date.getDate() + 30);

      if (isDemoMode) {
        toast.success("Assinatura renovada por +30 dias!");
        return;
      }

      const { error } = await supabase
        .from('noxus_subscriptions')
        .update({ expiresAt: date.toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success("Assinatura renovada por +30 dias!");
      fetchSubscriptions();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao renovar assinatura.");
    }
  };

  const handleConfirmCode = async (codeId: string) => {
    try {
      if (isDemoMode) {
        toast.success("Pagamento confirmado!");
        fetchCodes();
        return;
      }

      const { error } = await supabase
        .from('noxus_access_codes')
        .update({ status: 'used' })
        .eq('id', codeId);
      
      if (error) throw error;
      toast.success("Pagamento confirmado e acesso liberado!");
      fetchCodes();
      fetchSubscriptions();
    } catch (error: any) {
      toast.error("Erro ao confirmar pagamento: " + error.message);
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    try {
      if (isDemoMode) {
        toast.success("Cadastro excluído com sucesso!");
        fetchCodes();
        return;
      }

      const { error } = await supabase
        .from('noxus_access_codes')
        .delete()
        .eq('id', codeId);
        
      if (error) throw error;
      toast.success("Cadastro excluído com sucesso!");
      fetchCodes();
    } catch (error: any) {
      toast.error("Erro ao excluir cadastro: " + error.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando painel admin...</div>;

  if (!isAdmin && !isDemoMode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center text-destructive">
        <Shield className="w-16 h-16 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Acesso Negado</h1>
        <p>Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary" /> Painel Administrativo
          </h1>
          <p className="text-muted-foreground text-sm">Gerencie o cadastro, assinaturas e vendas do seu software para outros tatuadores.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Formulário de Cadastro de Venda */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" /> Cadastrar Novo Cliente</CardTitle>
            <CardDescription>Registre a venda da assinatura e gere a chave de acesso do tatuador.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground"/> Nome do Cliente</Label>
              <Input 
                placeholder="Ex: João Tatuador" 
                value={newStudentName}
                onChange={e => setNewStudentName(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground"/> Telefone / WhatsApp</Label>
              <Input 
                placeholder="(00) 00000-0000" 
                value={newStudentPhone}
                onChange={e => setNewStudentPhone(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground"/> E-mail (Opcional)</Label>
              <Input 
                type="email"
                placeholder="email@exemplo.com" 
                value={newStudentEmail}
                onChange={e => setNewStudentEmail(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-muted-foreground"/> Valor (R$)</Label>
                <Input 
                  type="number"
                  placeholder="97.00" 
                  value={subscriptionValue}
                  onChange={e => setSubscriptionValue(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-muted-foreground"/> Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pix">Pix</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={generateCode} className="w-full mt-4 h-12 text-md font-semibold">
              <Key className="w-5 h-5 mr-2" /> Registrar Venda e Gerar Chave
            </Button>
          </CardContent>
        </Card>

        {/* Histórico e Gestão de Clientes */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Assinaturas Ativas na Plataforma</CardTitle>
              <CardDescription>Controle quem tem acesso liberado ao aplicativo e realize renovações.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {subscriptions.map(sub => (
                  <div key={sub.id} className="flex justify-between items-center p-4 bg-secondary/30 rounded-xl border border-border/50 hover:bg-secondary/50 transition-colors">
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold text-foreground">ID do Aluno: <span className="font-mono text-xs text-muted-foreground ml-1 bg-background px-2 py-0.5 rounded">{sub.userId ? sub.userId.substring(0,8) : ''}</span></p>
                      <p className={`text-sm flex items-center gap-1.5 font-medium ${new Date(sub.expiresAt) < new Date() ? 'text-destructive' : 'text-emerald-600'}`}>
                        <Clock className="w-4 h-4" /> Vence em: {new Date(sub.expiresAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-colors font-bold" onClick={() => renewSubscription(sub.id, sub.expiresAt)}>
                      +30 Dias
                    </Button>
                  </div>
                ))}
                {subscriptions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    Nenhum aluno ativo encontrado. Registre sua primeira venda ao lado!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" /> Histórico de Cadastros e Chaves</CardTitle>
              <CardDescription>Relação de todas as vendas e códigos gerados para seus clientes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {codes.map((code, idx) => (
                  <div key={code.id || idx} className="p-5 border rounded-xl flex flex-col justify-between gap-3 bg-card relative overflow-hidden group hover:border-primary/50 transition-colors shadow-xs">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${code.status === 'used' ? 'bg-emerald-500' : 'bg-primary'}`} />
                    
                    <div>
                      <div className="flex justify-between items-start pl-2 gap-2">
                        <div>
                          <span className="font-mono font-bold text-xl tracking-wider">{code.code}</span>
                          <p className="text-sm font-semibold text-foreground mt-1">{code.clientName}</p>
                        </div>
                        {code.status === 'used' ? (
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-500/20 shrink-0">
                            <CheckCircle className="w-3.5 h-3.5" /> ATIVADO
                          </span>
                        ) : (
                          <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-bold border border-primary/20 shrink-0">
                            AGUARDANDO
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 pl-2 border-t pt-3 border-border/40">
                        {code.createdAt && (
                          <div className="text-xs flex flex-col">
                            <span className="text-muted-foreground uppercase text-[10px] font-bold">Data da Venda</span>
                            <span className="font-medium">{new Date(code.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                        {code.subscriptionValue && (
                          <div className="text-xs flex flex-col">
                            <span className="text-muted-foreground uppercase text-[10px] font-bold">Valor</span>
                            <span className="font-medium text-emerald-600">R$ {code.subscriptionValue}</span>
                          </div>
                        )}
                        {code.paymentMethod && (
                          <div className="text-xs flex flex-col">
                            <span className="text-muted-foreground uppercase text-[10px] font-bold">Forma de Pag.</span>
                            <span className="font-medium">{code.paymentMethod}</span>
                          </div>
                        )}
                        {code.clientPhone && (
                          <div className="text-xs flex flex-col">
                            <span className="text-muted-foreground uppercase text-[10px] font-bold">Telefone</span>
                            <span className="font-medium">{code.clientPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40 pl-2">
                      {code.status !== 'used' ? (
                        <Button
                          size="sm"
                          onClick={() => handleConfirmCode(code.id)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 shadow-xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Confirmar (+30d)
                        </Button>
                      ) : (
                        <div className="flex-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
                          <CheckCircle className="w-3.5 h-3.5" /> Pagamento Confirmado
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCode(code.id)}
                        className="h-8 text-xs font-medium text-destructive hover:bg-destructive/10 border-destructive/20 shrink-0 px-2.5"
                        title="Excluir cadastro"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
                {codes.length === 0 && (
                  <div className="md:col-span-2 text-center py-10 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    Você ainda não gerou nenhuma chave de acesso.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
