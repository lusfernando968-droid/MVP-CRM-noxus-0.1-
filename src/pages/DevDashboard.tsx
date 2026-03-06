import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DollarSign, Users, Calendar, AlertCircle, Search, CreditCard, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface UserSubscription {
    id: string;
    nome: string;
    email: string;
    is_active: boolean;
    subscription_ends_at: string | null;
    created_at: string;
    role: string | null;
    whatsapp: string | null;
}

export function DevDashboard() {
    const [users, setUsers] = useState<UserSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [monthlyRevenue, setMonthlyRevenue] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
    const [selectedUserForRenewal, setSelectedUserForRenewal] = useState<{ id: string, name: string } | null>(null);
    const [renewalAmount, setRenewalAmount] = useState<string>("50.00");
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expiring'>('all');

    const fetchUsersAndStats = async () => {
        try {
            setLoading(true);

            // 1. Buscar todos os usuários
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (usersError) throw usersError;

            // 2. Buscar pagamentos registrados pelo dev (usando sua tabela financial_transactions como repositório macro macro)
            const { data: { user } } = await supabase.auth.getUser();
            let totalRev = 0;
            let monthRev = 0;

            if (user) {
                const { data: transactions, error: transError } = await supabase
                    .from('nx_financial_transactions')
                    .select('value, date, type, status')
                    .eq('user_id', user.id)
                    .eq('type', 'entrada')
                    .eq('status', 'Pago');
                // .eq('category_id', 'mensalidade_noxus') - idealmente ter uma categoria

                if (!transError && transactions) {
                    totalRev = transactions.reduce((acc, curr) => acc + Number(curr.value), 0);

                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();

                    monthRev = transactions
                        .filter(t => {
                            const d = new Date(t.date);
                            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                        })
                        .reduce((acc, curr) => acc + Number(curr.value), 0);
                }
            }

            if (usersData) {
                setUsers(usersData);

                // Calcular estatísticas de usuários
                const activeUsersCount = usersData.filter(u => {
                    if (u.role === 'ADMIN') return false; // Nao contar admins como assinantes pagantes
                    if (!u.is_active) return false;
                    if (!u.subscription_ends_at) return false;

                    const expDate = new Date(u.subscription_ends_at);
                    return expDate > new Date();
                }).length;

                const totalRegularUsers = usersData.filter(u => u.role !== 'ADMIN').length;

                setMonthlyRevenue(monthRev);
                setTotalRevenue(totalRev);
            }

        } catch (error: any) {
            console.error("Erro ao carregar dados do Dev:", error);
            toast.error("Erro ao carregar os dados. Verifique console.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsersAndStats();
    }, []);

    const openRenewModal = (userId: string, userName: string) => {
        setSelectedUserForRenewal({ id: userId, name: userName });
        setRenewalAmount("50.00"); // Reset to default when opening
        setIsRenewModalOpen(true);
    };

    const handleConfirmRenewal = async () => {
        if (!selectedUserForRenewal) return;

        // Trata número com ponto ou vírgula
        const VALOR_ASSINATURA = parseFloat(renewalAmount.replace(',', '.'));

        if (isNaN(VALOR_ASSINATURA) || VALOR_ASSINATURA < 0) {
            toast.error("Por favor, digite um valor numérico válido (ex: 50.00).");
            return;
        }

        try {
            setIsRenewModalOpen(false); // Close modal right away
            const toastId = toast.loading("Renovando assinatura...");

            const { data: { user: adminUser } } = await supabase.auth.getUser();
            if (!adminUser) throw new Error("Acesso negado");

            // 1. Inserir a entrada financeira pro DEV
            const { error: insertError } = await supabase.from('nx_financial_transactions').insert({
                user_id: adminUser.id,
                description: `Renovação de Assinatura - ${selectedUserForRenewal.name}`,
                value: VALOR_ASSINATURA,
                type: 'entrada',
                status: 'Pago',
                date: new Date().toISOString().split('T')[0]
            });

            if (insertError) {
                console.error("Erro ao inserir transação financeira:", insertError);
                toast.error(`Falha no financeiro: ${insertError.message}`);
                toast.dismiss(toastId);
                return;
            }

            // 2. Atualizar o usuário (+30 dias e is_active = true)
            // Definir data + 30 dias a partir de agora
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30);

            const { error: updateError } = await supabase
                .from('users')
                .update({
                    is_active: true,
                    subscription_ends_at: expirationDate.toISOString()
                })
                .eq('id', selectedUserForRenewal.id);

            if (updateError) {
                console.error("Erro ao atualizar o estúdio:", updateError);
                toast.error("Erro ao estender os 30 dias do estúdio.");
                toast.dismiss(toastId);
                return;
            }

            toast.dismiss(toastId);
            toast.success(`Assinatura de ${selectedUserForRenewal.name} renovada por +30 dias!`);
            fetchUsersAndStats(); // Atualizar lista
            setSelectedUserForRenewal(null); // Clear selected user
        } catch (error: any) {
            toast.dismiss();
            console.error(error);
            toast.error("Erro ao renovar assinatura.");
        }
    };

    const getDaysRemaining = (endsAt: string | null) => {
        if (!endsAt) return -1;
        const diff = differenceInDays(new Date(endsAt), new Date());
        return diff;
    };

    const filteredUsers = users.filter(user => {
        if (user.role === 'ADMIN') return false;

        const matchesSearch = user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        const daysLeft = getDaysRemaining(user.subscription_ends_at);
        const isExpired = daysLeft < 0;

        switch (filterStatus) {
            case 'active':
                return user.is_active && !isExpired;
            case 'inactive':
                return !user.is_active || isExpired;
            case 'expiring':
                return daysLeft >= 1 && daysLeft <= 5 && user.is_active;
            default:
                return true;
        }
    });

    return (
        <>
            <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                            Central de Vendas Noxus
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Gerencie assinaturas e faturamento da plataforma.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">Total de Estúdios</p>
                            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-500" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-bold">{users.filter(u => u.role !== 'ADMIN').length}</h3>
                            <p className="text-xs text-muted-foreground mt-1">cadastros efetuados</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">Assinaturas Ativas</p>
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-bold text-primary">{users.filter(u => u.role !== 'ADMIN' && u.is_active && u.subscription_ends_at && new Date(u.subscription_ends_at) > new Date()).length}</h3>
                            <p className="text-xs text-muted-foreground mt-1">pagantes neste mês</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">Faturamento Mês</p>
                            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-green-500" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-bold">R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                            <p className="text-xs text-green-500 mt-1 flex items-center gap-1 font-medium">
                                Vendas recentes
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">Faturamento Total</p>
                            <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-yellow-500" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-bold">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                            <p className="text-xs text-muted-foreground mt-1">acumulado histórico</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                    <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-xl font-semibold">Tatuadores Cadastrados</h2>
                        <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-3">
                            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                                <SelectTrigger className="w-full sm:w-[220px] bg-background border-border rounded-xl">
                                    <SelectValue placeholder="Filtrar por Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Filtro: Todos</SelectItem>
                                    <SelectItem value="active">✓ Ativos</SelectItem>
                                    <SelectItem value="inactive">✕ Bloqueados / Inativos</SelectItem>
                                    <SelectItem value="expiring">⚠️ Vencendo (1 a 5 dias)</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome ou e-mail..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Cliente</th>
                                    <th className="px-6 py-4 font-medium">WhatsApp</th>
                                    <th className="px-6 py-4 font-medium">Status do Acesso</th>
                                    <th className="px-6 py-4 font-medium">Validade</th>
                                    <th className="px-6 py-4 font-medium text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                            Carregando clientes...
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                            Nenhum cliente encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((client) => {
                                        const daysLeft = getDaysRemaining(client.subscription_ends_at);
                                        const isExpired = daysLeft < 0;
                                        const isNearExpiry = daysLeft >= 0 && daysLeft <= 5;

                                        return (
                                            <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-foreground">{client.nome || "Estúdio Sem Nome"}</div>
                                                    <div className="text-xs text-muted-foreground mt-0.5">{client.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {client.whatsapp ? (
                                                        <a
                                                            href={`https://wa.me/55${client.whatsapp.replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                                                        >
                                                            {client.whatsapp}
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground/50 italic">Não informado</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {isExpired || !client.is_active ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                                                            <XCircle className="h-3.5 w-3.5" />
                                                            Bloqueado
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            Ativo
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {client.subscription_ends_at ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-foreground">
                                                                {format(new Date(client.subscription_ends_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                                            </span>
                                                            <span className={isExpired ? "text-destructive text-xs font-medium" : isNearExpiry ? "text-yellow-500 text-xs font-medium" : "text-muted-foreground text-xs"}>
                                                                {isExpired
                                                                    ? `Expirou há ${Math.abs(daysLeft)} dias`
                                                                    : `Faltam ${daysLeft} dias`}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground/50 text-xs italic">Sem assinatura</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => openRenewModal(client.id, client.nome || client.email)}
                                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                                                    >
                                                        <CreditCard className="h-4 w-4" />
                                                        Reg. Pagamento (+30d)
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Dialog open={isRenewModalOpen} onOpenChange={setIsRenewModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Renovar Assinatura</DialogTitle>
                        <DialogDescription>
                            Confirme o valor cobrado para adicionar +30 dias de acesso para <strong>{selectedUserForRenewal?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 mt-2">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="amount" className="text-sm font-medium">
                                Valor Cobrado (R$)
                            </label>
                            <input
                                id="amount"
                                type="text"
                                value={renewalAmount}
                                onChange={(e) => setRenewalAmount(e.target.value)}
                                className="col-span-3 bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono text-lg"
                            />
                            <p className="text-xs text-muted-foreground">Use ponto para centavos (ex: 50.00)</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <button
                            type="button"
                            onClick={() => setIsRenewModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-transparent hover:bg-muted/50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmRenewal}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            Confirmar Renovação
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </>
    );
}
