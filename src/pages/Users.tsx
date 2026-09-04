import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    Users as UsersIcon,
    Search,
    CheckCircle2,
    XCircle,
    Loader2,
    ShieldCheck,
    Mail,
    Calendar as CalendarIcon,
    Key,
    Phone,
    DollarSign,
    UserPlus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";

interface UserAccount {
    id: string;
    nome: string | null;
    email: string;
    whatsapp?: string | null;
    role: string;
    is_active: boolean | null;
    created_at: string;
    access_code?: string | null;
    subscription_value?: number;
    expires_at?: string | null;
}

export default function Users() {
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newUserName, setNewUserName] = useState("");
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserPhone, setNewUserPhone] = useState("");
    const [isAddingUser, setIsAddingUser] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const [
                { data: usersData, error: usersErr },
                { data: codesData },
                { data: subsData }
            ] = await Promise.all([
                supabase.from('noxus_users').select('*').neq('role', 'SUPERADMIN'),
                supabase.from('noxus_access_codes').select('*'),
                supabase.from('noxus_subscriptions').select('*')
            ]);

            if (usersErr) throw usersErr;

            const mapped = (usersData || []).map((u: any) => {
                const myCode = (codesData || []).find((c: any) => c.usedById === u.id);
                const mySub = (subsData || []).find((s: any) => s.userId === u.id);

                return {
                    id: u.id,
                    nome: u.name,
                    email: u.email,
                    whatsapp: u.whatsapp,
                    role: u.role,
                    is_active: u.isActive,
                    created_at: u.createdAt,
                    access_code: myCode?.code,
                    subscription_value: myCode?.subscriptionValue,
                    expires_at: mySub?.expiresAt
                };
            });

            setUsers(mapped);
        } catch (error: any) {
            toast.error("Erro ao carregar usuários: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        setUpdatingId(userId);
        try {
            const { error } = await supabase
                .from('noxus_users')
                .update({ isActive: !currentStatus })
                .eq('id', userId);

            if (error) throw error;
            
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, is_active: !currentStatus } : u
            ));

            toast.success(`Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
        } catch (error: any) {
            toast.error("Erro ao atualizar status: " + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleRenewUser = async (userId: string) => {
        setUpdatingId(userId);
        try {
            const { data: sub, error: fetchErr } = await supabase
                .from('noxus_subscriptions')
                .select('*')
                .eq('userId', userId)
                .single();
                
            if (fetchErr && fetchErr.code !== 'PGRST116') throw fetchErr; // PGRST116 = not found

            let newDate = new Date();
            if (sub && sub.expiresAt) {
                const currentExpires = new Date(sub.expiresAt);
                if (currentExpires > newDate) {
                    newDate = currentExpires;
                }
            }
            newDate.setDate(newDate.getDate() + 30);
            const expiresAtStr = newDate.toISOString();

            if (sub) {
                const { error: upErr } = await supabase
                    .from('noxus_subscriptions')
                    .update({ expiresAt: expiresAtStr })
                    .eq('id', sub.id);
                if (upErr) throw upErr;
            } else {
                const { error: insErr } = await supabase
                    .from('noxus_subscriptions')
                    .insert({ userId, expiresAt: expiresAtStr });
                if (insErr) throw insErr;
            }
            
            toast.success("Pagamento confirmado! Acesso liberado por +30 dias.");
            fetchUsers();
        } catch (error: any) {
            toast.error("Erro ao renovar acesso: " + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserName || !newUserEmail) {
            toast.error("Preencha o nome e o e-mail.");
            return;
        }

        setIsAddingUser(true);
        try {
            // Generate a random code: NOXUS-XXXX
            const randomString = Math.random().toString(36).substring(2, 6).toUpperCase();
            const generatedCode = `NOXUS-${randomString}`;

            // Create user in noxus_users (simulate a new auth UUID for the system)
            const simulatedUserId = crypto.randomUUID();

            const { error: insErr } = await supabase.from('noxus_users').insert({
                id: simulatedUserId,
                name: newUserName,
                email: newUserEmail,
                whatsapp: newUserPhone,
                role: 'USER',
                isActive: true
            });

            if (insErr) throw insErr;

            const { error: codeErr } = await supabase.from('noxus_access_codes').insert({
                code: generatedCode,
                usedById: simulatedUserId,
                isUsed: true,
                subscriptionValue: 50.00,
                clientName: newUserName,
                clientEmail: newUserEmail,
                clientPhone: newUserPhone,
                status: 'available',
                paymentMethod: 'Manual'
            });

            if (codeErr) throw codeErr;

            // Generate initial subscription of 30 days
            let newDate = new Date();
            newDate.setDate(newDate.getDate() + 30);
            
            await supabase.from('noxus_subscriptions').insert({ 
                userId: simulatedUserId, 
                expiresAt: newDate.toISOString() 
            });

            toast.success(`Tatuador adicionado! Chave gerada: ${generatedCode}`);
            setIsAddModalOpen(false);
            setNewUserName("");
            setNewUserEmail("");
            setNewUserPhone("");
            fetchUsers();
        } catch (error: any) {
            toast.error("Erro ao adicionar usuário: " + error.message);
        } finally {
            setIsAddingUser(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-card border-border/50">
                    <DialogHeader>
                        <DialogTitle>Adicionar Tatuador</DialogTitle>
                        <DialogDescription>
                            Cadastre um novo tatuador e gere uma chave de acesso para ele.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddUser}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo / Estúdio</Label>
                                <Input
                                    id="name"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    placeholder="Ex: João Silva"
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    placeholder="joao@estudio.com"
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="whatsapp">WhatsApp (Opcional)</Label>
                                <Input
                                    id="whatsapp"
                                    value={newUserPhone}
                                    onChange={(e) => setNewUserPhone(e.target.value)}
                                    placeholder="(11) 99999-9999"
                                    className="rounded-xl"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isAddingUser} className="w-full rounded-xl">
                                {isAddingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                                Criar Acesso
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
                            <UsersIcon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                            Gestão de Usuários
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm md:text-base">
                            Ative ou desative o acesso dos tatuadores à plataforma Noxus.
                        </p>
                    </div>

                    <div className="flex w-full md:w-auto items-center gap-3">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-card border-border/50 rounded-xl w-full"
                            />
                        </div>
                        <Button 
                          onClick={() => setIsAddModalOpen(true)}
                          className="rounded-xl flex items-center gap-2"
                        >
                            <UserPlus className="h-4 w-4" />
                            <span className="hidden md:inline">Novo Tatuador</span>
                        </Button>
                    </div>
                </div>

                <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl overflow-hidden rounded-2xl">
                    <CardHeader className="bg-muted/30 border-b border-border/50 p-4 md:p-6">
                        <CardTitle className="text-lg">Tatuadores Cadastrados</CardTitle>
                        <CardDescription>Gerencie o status de ativação</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-12 gap-3">
                                <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
                                <p className="text-sm text-muted-foreground">Carregando usuários...</p>
                            </div>
                        ) : filteredUsers.length > 0 ? (
                            <>
                                {/* Mobile View (Cards) */}
                                <div className="md:hidden divide-y divide-border/30">
                                    {filteredUsers.map((user) => (
                                        <div key={user.id} className="p-4 flex flex-col gap-3 hover:bg-muted/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                                                    {user.nome?.charAt(0) || "U"}
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-sm font-bold truncate">
                                                        {user.nome || "Novo Usuário"}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1 truncate mt-0.5">
                                                        <Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{user.email}</span>
                                                    </span>
                                                    {user.whatsapp && (
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1 truncate mt-0.5">
                                                            <Phone className="h-3 w-3 shrink-0" /> <span className="truncate">{user.whatsapp}</span>
                                                        </span>
                                                    )}
                                                    
                                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                        {user.access_code && (
                                                            <span className="text-[10px] text-primary/90 flex items-center gap-1 truncate font-mono bg-primary/10 w-fit px-1.5 py-0.5 rounded">
                                                                <Key className="h-3 w-3 shrink-0" /> {user.access_code}
                                                            </span>
                                                        )}
                                                        {user.role === 'USER' && user.subscription_value && (
                                                            <span className="text-[10px] text-emerald-600 flex items-center gap-1 bg-emerald-50 w-fit px-1.5 py-0.5 rounded dark:bg-emerald-500/10 dark:text-emerald-400">
                                                                <DollarSign className="h-3 w-3 shrink-0" /> R$ {user.subscription_value},00/mês
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between pt-2 border-t border-border/30">
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant={user.role !== 'USER' ? 'default' : 'secondary'} className="rounded-md font-medium w-fit text-[10px]">
                                                        {user.role !== 'USER' ? (
                                                            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> ADMIN</span>
                                                        ) : 'TATUADOR'}
                                                    </Badge>
                                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                                                        <CalendarIcon className="h-3 w-3" />
                                                        Entrou: {user.created_at ? format(new Date(user.created_at), "dd/MM") : "--"}
                                                    </span>
                                                    {user.role === 'USER' && user.expires_at && (
                                                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                            <CalendarIcon className="h-3 w-3 text-orange-400" />
                                                            Vence: {format(new Date(user.expires_at), "dd/MM/yyyy")}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleRenewUser(user.id)}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] h-7 px-2.5 shadow-xs"
                                                    >
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Confirmar (+30d)
                                                    </Button>
                                                    <div className="flex items-center gap-2">
                                                        {updatingId === user.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                        ) : user.is_active ? (
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => toggleUserStatus(user.id, true)}
                                                                className="font-bold text-[11px] h-7 px-2.5 shadow-xs"
                                                            >
                                                                <XCircle className="h-3 w-3 mr-1" />
                                                                Cancelar
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => toggleUserStatus(user.id, false)}
                                                                className="text-emerald-600 hover:text-emerald-700 font-bold text-[11px] h-7 px-2.5 shadow-xs"
                                                            >
                                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                Reativar
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop View (Table) */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-muted/20 text-muted-foreground text-xs uppercase tracking-wider">
                                                <th className="px-6 py-4 font-semibold">Tatuador</th>
                                                <th className="px-6 py-4 font-semibold">Cargo</th>
                                                <th className="px-6 py-4 font-semibold">Cadastro</th>
                                                <th className="px-6 py-4 font-semibold">Plano</th>
                                                <th className="px-6 py-4 font-semibold">Status</th>
                                                <th className="px-6 py-4 font-semibold text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            {filteredUsers.map((user) => (
                                                <tr key={user.id} className="hover:bg-muted/10 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                                                                {user.nome?.charAt(0) || "U"}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold group-hover:text-primary transition-colors">
                                                                    {user.nome || "Novo Usuário"}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <Mail className="h-3 w-3" /> {user.email}
                                                                </span>
                                                                {user.whatsapp && (
                                                                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                        <Phone className="h-3 w-3" /> {user.whatsapp}
                                                                    </span>
                                                                )}
                                                                {user.access_code && (
                                                                    <span className="text-[11px] text-primary/80 flex items-center gap-1 mt-0.5 font-mono bg-primary/5 w-fit px-1.5 py-0.5 rounded">
                                                                        <Key className="h-3 w-3" /> {user.access_code}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={user.role !== 'USER' ? 'default' : 'secondary'} className="rounded-md font-medium">
                                                            {user.role !== 'USER' ? (
                                                                <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> ADMIN</span>
                                                            ) : 'TATUADOR'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <CalendarIcon className="h-3 w-3" />
                                                            {user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy") : "--"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {user.role === 'USER' ? (
                                                            <div className="flex flex-col gap-1">
                                                                {user.subscription_value && (
                                                                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                                                        R$ {user.subscription_value},00 <span className="text-[10px] font-normal text-muted-foreground">/mês</span>
                                                                    </span>
                                                                )}
                                                                {user.expires_at ? (
                                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                        Vence {format(new Date(user.expires_at), "dd/MM")}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] text-muted-foreground">Sem vencimento</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {user.is_active ? (
                                                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5 rounded-full flex w-fit items-center gap-1">
                                                                <CheckCircle2 className="h-3 w-3" /> Ativo
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 px-2 py-0.5 rounded-full flex w-fit items-center gap-1">
                                                                <XCircle className="h-3 w-3" /> Inativo
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            {updatingId === user.id ? (
                                                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                                            ) : (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleRenewUser(user.id)}
                                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 shadow-xs"
                                                                    >
                                                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                                                        Confirmar (+30d)
                                                                    </Button>
                                                                    {user.is_active ? (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="destructive"
                                                                            onClick={() => toggleUserStatus(user.id, true)}
                                                                            className="font-bold text-xs h-8 shadow-xs ml-1"
                                                                        >
                                                                            <XCircle className="h-3.5 w-3.5 mr-1" />
                                                                            Cancelar
                                                                        </Button>
                                                                    ) : (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => toggleUserStatus(user.id, false)}
                                                                            className="text-emerald-600 hover:text-emerald-700 font-bold text-xs h-8 shadow-xs ml-1"
                                                                        >
                                                                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                                                            Reativar
                                                                        </Button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="p-12 text-center text-muted-foreground">
                                Nenhum usuário encontrado na busca.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
