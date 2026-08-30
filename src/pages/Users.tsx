import { useState, useEffect } from "react";
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
    DollarSign
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const token = localStorage.getItem("noxus_token");
        try {
            const res = await fetch("http://localhost:3000/api/admin/users", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Falha ao buscar usuários");
            const data = await res.json();
            setUsers(data || []);
        } catch (error: any) {
            toast.error("Erro ao carregar usuários: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        setUpdatingId(userId);
        const token = localStorage.getItem("noxus_token");
        try {
            const res = await fetch(`http://localhost:3000/api/admin/users/${userId}/toggle`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ is_active: !currentStatus })
            });

            if (!res.ok) throw new Error("Falha ao atualizar");
            
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

    const filteredUsers = users.filter(u =>
        u.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
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

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome ou e-mail..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-card border-border/50 rounded-xl w-full"
                        />
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
                                            
                                            <div className="flex items-center justify-between">
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
                                                    {user.is_active ? (
                                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5 rounded-full flex w-fit items-center gap-1 text-[10px]">
                                                            <CheckCircle2 className="h-3 w-3" /> Ativo
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-red-500/10 text-red-500 border-red-500/20 px-2 py-0.5 rounded-full flex w-fit items-center gap-1 text-[10px]">
                                                            <XCircle className="h-3 w-3" /> Inativo
                                                        </Badge>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        {updatingId === user.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                        ) : (
                                                            <Switch
                                                                checked={user.is_active}
                                                                onCheckedChange={() => toggleUserStatus(user.id, !!user.is_active)}
                                                                className="data-[state=checked]:bg-emerald-500 scale-75 origin-right"
                                                            />
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
                                                                    <span className="text-xs font-medium text-muted-foreground mr-2">
                                                                        {user.is_active ? "Desativar" : "Ativar"}
                                                                    </span>
                                                                    <Switch
                                                                        checked={user.is_active}
                                                                        onCheckedChange={() => toggleUserStatus(user.id, !!user.is_active)}
                                                                        className="data-[state=checked]:bg-emerald-500"
                                                                    />
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
