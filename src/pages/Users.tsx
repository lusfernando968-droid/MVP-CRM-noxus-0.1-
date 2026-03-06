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
    Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserAccount {
    id: string;
    nome: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
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
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
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
                .from('users')
                .update({ is_active: !currentStatus })
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

    const filteredUsers = users.filter(u =>
        u.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <div className="p-8 max-w-7xl mx-auto animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <UsersIcon className="h-8 w-8 text-primary" />
                            Gestão de Usuários
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Ative ou desative o acesso dos tatuadores à plataforma Noxus.
                        </p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome ou e-mail..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-card border-border/50 rounded-xl"
                        />
                    </div>
                </div>

                <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl overflow-hidden rounded-2xl">
                    <CardHeader className="bg-muted/30 border-b border-border/50">
                        <CardTitle className="text-lg">Tatuadores Cadastrados</CardTitle>
                        <CardDescription>Gerencie o status de ativação baseado no pagamento (PIX Externo)</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/20 text-muted-foreground text-xs uppercase tracking-wider">
                                        <th className="px-6 py-4 font-semibold">Tatuador</th>
                                        <th className="px-6 py-4 font-semibold">Cargo</th>
                                        <th className="px-6 py-4 font-semibold">Cadastro</th>
                                        <th className="px-6 py-4 font-semibold">Status de Acesso</th>
                                        <th className="px-6 py-4 font-semibold text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
                                                    <p className="text-sm text-muted-foreground">Carregando usuários...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
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
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="rounded-md font-medium">
                                                        {user.role === 'ADMIN' ? (
                                                            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> ADMIN</span>
                                                        ) : 'TATUADOR'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <CalendarIcon className="h-3 w-3" />
                                                        {user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR }) : "--"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {user.is_active ? (
                                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 px-2 py-0.5 rounded-full flex w-fit items-center gap-1">
                                                            <CheckCircle2 className="h-3 w-3" /> Ativo
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 px-2 py-0.5 rounded-full flex w-fit items-center gap-1">
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
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground">
                                                Nenhum usuário encontrado na busca.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
