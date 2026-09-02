import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  FileText,
  Phone,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardStats {
  sessionsToday: string;
  monthlyRevenue: string;
  monthlyExpenses: string;
  ticketMedio: string;
  activeClients: string;
  totalWorkedTime: string;
  avgWorkedTime: string;
  pendingReceivables: string;
  anamnesisCompleted: string;
  topDiscoverySource: string;
}

const Index = () => {
  const [periodFilter, setPeriodFilter] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statsData, setStatsData] = useState<DashboardStats>({
    sessionsToday: "0",
    monthlyRevenue: "R$ 0",
    monthlyExpenses: "R$ 0",
    ticketMedio: "R$ 0",
    activeClients: "0",
    totalWorkedTime: "0h 00m",
    avgWorkedTime: "0h 00m",
    pendingReceivables: "R$ 0",
    anamnesisCompleted: "0",
    topDiscoverySource: "-",
  });
  const [todayClients, setTodayClients] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [yearlyChartData, setYearlyChartData] = useState<any[]>([]);
  const [appointmentsStatusData, setAppointmentsStatusData] = useState<any[]>([]);
  const [pendingAnamnesisAlerts, setPendingAnamnesisAlerts] = useState<any[]>([]);
  const [tomorrowAppointments, setTomorrowAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedCheckout, setSelectedCheckout] = useState<any>(null);
  const [checkoutData, setCheckoutData] = useState({
    status: 'Recebido',
    value: 0,
    paymentMethod: 'Pix'
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("noxus_token");
      if (!token) return;

      let url = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/dashboard?period=${periodFilter}`;
      if (periodFilter === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error("Falha ao buscar dados");
      const data = await res.json();

      setStatsData(data.stats);
      setRevenueChartData(data.revenueChartData || []);
      setYearlyChartData(data.yearlyChartData || []);
      setAppointmentsStatusData(data.appointmentsStatusData || []);
      setPendingAnamnesisAlerts(data.pendingAnamnesisAlerts || []);
      setTodayClients(data.todayClients || []);
      setRecentPayments(data.recentPayments || []);
      setTomorrowAppointments(data.tomorrowAppointments || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [periodFilter, startDate, endDate]);

  const openCheckout = (appt: any) => {
    setSelectedCheckout(appt);
    setCheckoutData({
      status: 'Recebido',
      value: appt.value || 0,
      paymentMethod: 'Pix'
    });
    setCheckoutModalOpen(true);
  };

  const handleCheckout = async () => {
    if (!selectedCheckout) return;
    try {
      const token = localStorage.getItem("noxus_token");
      if (!token) {
        toast.error("Você precisa estar logado.");
        return;
      }

      const res = await fetch((import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api/appointments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentId: selectedCheckout.id,
          status: checkoutData.status,
          value: checkoutData.value,
          paymentMethod: checkoutData.paymentMethod,
          name: selectedCheckout.name,
          date: selectedCheckout.date
        })
      });

      if (!res.ok) throw new Error("Falha no checkout");

      toast.success("Sessão baixada com sucesso!");
      setCheckoutModalOpen(false);
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao dar baixa na sessão.");
    }
  };

  const stats = [
    {
      label: "Faturamento Total",
      value: statsData.monthlyRevenue,
      icon: DollarSign,
      change: "No período",
      trend: "up" as const,
    },
    {
      label: "Custo do Mês (Despesas)",
      value: statsData.monthlyExpenses || "R$ 0",
      icon: ArrowDownRight,
      change: "Saídas",
      trend: "down" as const,
    },
    {
      label: "Ticket Médio",
      value: statsData.ticketMedio || "R$ 0",
      icon: TrendingUp,
      change: "Média por sessão",
      trend: "up" as const,
    },
    {
      label: "Tempo Médio de Trabalho",
      value: statsData.avgWorkedTime || "0h 00m",
      icon: Clock,
      change: "Média por sessão",
      trend: "up" as const,
    },
    {
      label: "Tempo Total Trabalhado",
      value: statsData.totalWorkedTime || "0h 00m",
      icon: Clock,
      change: "No período",
      trend: "up" as const,
    },
    {
      label: "Sessões Hoje",
      value: statsData.sessionsToday,
      icon: Calendar,
      change: "Hoje",
      trend: "up" as const,
    },
    {
      label: "A Receber",
      value: statsData.pendingReceivables,
      icon: DollarSign,
      change: "Agendado",
      trend: "down" as const,
    },
    {
      label: "Clientes Ativos",
      value: statsData.activeClients,
      icon: Users,
      change: "Total",
      trend: "up" as const,
    },
  ];

  return (
    <>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Bem-vindo de volta! Aqui está o resumo do seu estúdio.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[180px] bg-card">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent className="bg-card text-foreground">
              <SelectItem value="month">Mês Atual</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
              <SelectItem value="custom">Data Específica</SelectItem>
            </SelectContent>
          </Select>

          {periodFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[140px] bg-card text-xs"
                placeholder="Início"
              />
              <span className="text-xs text-muted-foreground font-bold">até</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[140px] bg-card text-xs"
                placeholder="Fim"
              />
            </div>
          )}
        </div>
      </div>

      {/* Pending Anamnesis Alert */}
      {pendingAnamnesisAlerts.length > 0 && (
        <div className="mb-4 p-4 rounded-xl border border-warning/20 bg-warning/5 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Anamneses Pendentes ({pendingAnamnesisAlerts.length})</h3>
              <p className="text-sm text-muted-foreground">Clientes com sessão nos próximos 7 dias sem ficha preenchida.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {pendingAnamnesisAlerts.slice(0, 2).map((alert, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-sm bg-background p-2 rounded-lg border shadow-sm">
                <div className="min-w-0">
                  <span className="font-medium text-foreground truncate block">{alert.name}</span>
                  <span className="text-xs text-muted-foreground">Dia {alert.date}</span>
                </div>
                <Link to={`/clientes?id=${alert.client_id}`} className="text-xs text-primary font-medium hover:underline shrink-0">
                  Ver Perfil
                </Link>
              </div>
            ))}
            {pendingAnamnesisAlerts.length > 2 && (
              <Link to="/clientes" className="text-xs text-center text-muted-foreground hover:text-foreground">
                + {pendingAnamnesisAlerts.length - 2} outros
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Tomorrow Confirmation Alert */}
      {tomorrowAppointments.length > 0 && (
        <div className="mb-4 p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Confirmações para Amanhã ({tomorrowAppointments.length})</h3>
              <p className="text-sm text-muted-foreground">Envie mensagem rápida para confirmar presença dos clientes de amanhã.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {tomorrowAppointments.slice(0, 2).map((appt, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-sm bg-background p-3 rounded-lg border shadow-sm">
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-foreground truncate">{appt.name}</span>
                  <span className="text-xs text-muted-foreground">Amanhã às {appt.time}</span>
                </div>
                <a
                  href={`https://wa.me/55${(appt.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá ${appt.name || 'Cliente'}! Passando para confirmar seu horário amanhã, dia ${new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString('pt-BR')}, às ${appt.time}. Podemos confirmar?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-md text-xs font-bold transition-colors shrink-0"
                >
                  <Phone className="h-3 w-3" /> Confirmar
                </a>
              </div>
            ))}
            {tomorrowAppointments.length > 2 && (
              <p className="text-xs text-center text-muted-foreground">
                + {tomorrowAppointments.length - 2} outros agendamentos para amanhã
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid — 2 colunas no mobile, 3-4 no desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card group">
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-accent p-2 md:p-2.5">
                <stat.icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium ${stat.trend === "up"
                  ? "text-success"
                  : "text-muted-foreground"
                  }`}
              >
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {stat.change}
              </span>
            </div>
            <div className="mt-2 md:mt-4">
              <p className="text-xl md:text-2xl font-bold text-foreground">
                {loading ? "..." : (stat.value || "-")}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Clients */}
        <div className="lg:col-span-2 bg-card rounded-xl border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-foreground">
              Próximos Clientes Hoje
            </h2>
          </div>
          <div className="divide-y min-h-[200px]">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Carregando...</div>
            ) : todayClients.length > 0 ? (
              todayClients.map((client, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 px-6 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                      {(client.name || "C").charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {client.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {client.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-foreground">
                      {client.time}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${client.status === "Confirmado" || client.status === "Concluído"
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                        }`}
                    >
                      {client.status}
                    </span>
                    {client.status !== 'Concluído' && client.status !== 'Cancelado' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 rounded-full border-primary/20 text-primary hover:bg-primary/10 ml-2"
                        onClick={() => openCheckout(client)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Dar Baixa
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground">Nenhum agendamento para hoje.</div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-foreground">
              Pagamentos Recentes
            </h2>
          </div>
          <div className="divide-y min-h-[200px]">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Carregando...</div>
            ) : recentPayments.length > 0 ? (
              recentPayments.map((payment, i) => (
                <div key={i} className="p-4 px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {payment.client}
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {payment.value}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">
                      {payment.date}
                    </p>
                    <span className="text-xs font-medium text-success">
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground">Nenhum pagamento recente.</div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Revenue Trend Chart (Daily Bar Chart) */}
        <div className="bg-card rounded-xl border shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-foreground">Desempenho Financeiro (No Período)</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-accent text-muted-foreground">Por dia</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Receitas e despesas diárias do período selecionado</p>
            <div className="h-[220px] lg:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                  <RechartsTooltip
                    formatter={(value: number, name: string) => {
                      const label = name === 'income' ? 'Receita' : name === 'expense' ? 'Despesa' : 'Lucro';
                      return [`R$ ${value}`, label];
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="income" name="income" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="expense" name="expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-success" />
              <span className="text-xs font-semibold text-foreground">Receita</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-destructive" />
              <span className="text-xs font-semibold text-foreground">Despesa</span>
            </div>
          </div>
        </div>

        {/* Yearly Revenue Trend Chart (12 Months Line Chart) */}
        <div className="bg-card rounded-xl border shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-foreground">Desempenho Financeiro Anual (12 Meses)</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-accent text-muted-foreground">Por mês</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Evolução do faturamento e lucro líquido mês a mês</p>
            <div className="h-[220px] lg:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={yearlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorYearIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorYearProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                  <RechartsTooltip
                    formatter={(value: number, name: string) => {
                      const label = name === 'income' ? 'Receita Mensal' : name === 'profit' ? 'Lucro Líquido' : 'Despesa';
                      return [`R$ ${value}`, label];
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="income" stroke="hsl(var(--success))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorYearIncome)" />
                  <Area type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorYearProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-xs font-semibold text-foreground">Receita Mensal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs font-semibold text-foreground">Lucro Líquido</span>
            </div>
          </div>
        </div>

        {/* Appointments Status Chart */}
        <div className="bg-card rounded-xl border shadow-sm p-6 relative lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground mb-4">Status de Agendamentos no Período</h2>
          <div className="h-[220px] lg:h-[280px] flex justify-center items-center">
            {appointmentsStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appointmentsStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {appointmentsStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground gap-2">
                <Calendar className="h-8 w-8 opacity-20" />
                <p>Sem dados no período selecionado</p>
              </div>
            )}

            {/* Custom Legend */}
            {appointmentsStatusData.length > 0 && (
              <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                {appointmentsStatusData.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground font-medium leading-tight">{entry.name}</span>
                      <span className="text-xs text-muted-foreground leading-tight">{entry.value} agendamentos</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <Dialog open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Finalizar Sessão (Dar Baixa)</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="bg-muted p-3 rounded-md flex flex-col gap-1 text-sm">
              <span className="font-semibold text-foreground">Cliente: {selectedCheckout?.name}</span>
              <span className="text-muted-foreground">Horário: {selectedCheckout?.time} - {selectedCheckout?.type}</span>
            </div>

            <div className="space-y-2">
              <Label>Resultado da Sessão</Label>
              <Select
                value={checkoutData.status}
                onValueChange={(val) => setCheckoutData(prev => ({ ...prev, status: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o resultado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Recebido">Realizada / Pago</SelectItem>
                  <SelectItem value="Apenas Consulta">Apenas Consulta (Sem Custo)</SelectItem>
                  <SelectItem value="Cancelado">Faltou / Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {checkoutData.status === 'Recebido' && (
              <>
                <div className="space-y-2">
                  <Label>Valor Recebido (R$)</Label>
                  <Input
                    type="number"
                    value={checkoutData.value}
                    onChange={(e) => setCheckoutData(prev => ({ ...prev, value: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Método de Pagamento</Label>
                  <Select
                    value={checkoutData.paymentMethod}
                    onValueChange={(val) => setCheckoutData(prev => ({ ...prev, paymentMethod: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pix">Pix</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                      <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCheckout}>Confirmar Baixa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Index;
