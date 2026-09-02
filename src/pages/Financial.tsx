import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Plus, ArrowUpRight, ArrowDownRight, DollarSign, ChevronLeft, ChevronRight, FileText, Banknote, Calendar, RefreshCw, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Transaction {
  id: string;
  description: string;
  value: number;
  date: string;
  type: "entrada" | "saida";
  status: string;
}

const Financial = () => {
  const [tab, setTab] = useState<"all" | "entrada" | "saida">("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [periodFilter, setPeriodFilter] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    value: 0,
    date: new Date().toISOString().split("T")[0],
    type: "entrada" as "entrada" | "saida",
    status: "Pago"
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("noxus_token");
      if (!token) return;

      const res = await fetch((import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api/financial", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error fetching transactions");
      
      const data = await res.json();
      const formatted = data.map((t: any) => ({
        id: t.id,
        description: t.description,
        value: Number(t.value),
        date: t.date?.includes('-') ? t.date.substring(0, 10).split('-').reverse().join('/') : new Date(t.date).toLocaleDateString('pt-BR'),
        type: t.type as "entrada" | "saida",
        status: t.status
      }));

      setTransactions(formatted);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSaveTransaction = async () => {
    try {
      if (!formData.description) {
        toast.error("A descrição é obrigatória");
        return;
      }
      if (formData.value <= 0) {
        toast.error("O valor deve ser maior que zero");
        return;
      }

      const token = localStorage.getItem("noxus_token");
      if (!token) {
        toast.error("Você precisa estar logado.");
        return;
      }

      const res = await fetch((import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api/financial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error("Error saving");

      toast.success("Transação salva com sucesso!");
      setModalOpen(false);
      setFormData({
        description: "",
        value: 0,
        date: new Date().toISOString().split("T")[0],
        type: "entrada",
        status: "Pago"
      });
      fetchTransactions();
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast.error("Erro ao salvar a transação.");
    }
  };

  const filteredByDate = transactions.filter((t) => {
    const parts = t.date.split('/');
    if (parts.length !== 3) return true;
    
    const formattedIso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    const txDateObj = new Date(formattedIso + 'T00:00:00');

    if (periodFilter === 'month') {
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return month === selectedMonth && year === selectedYear;
    }

    const todayObj = new Date();
    const todayStr = todayObj.toISOString().split('T')[0];

    if (periodFilter === 'today') {
      return formattedIso === todayStr;
    }

    if (periodFilter === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(todayObj.getDate() - 7);
      return txDateObj >= sevenDaysAgo && txDateObj <= todayObj;
    }

    if (periodFilter === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(todayObj.getDate() - 30);
      return txDateObj >= thirtyDaysAgo && txDateObj <= todayObj;
    }

    if (periodFilter === 'custom' && startDate && endDate) {
      return formattedIso >= startDate && formattedIso <= endDate;
    }

    return true;
  });

  const filtered = tab === "all" ? filteredByDate : filteredByDate.filter((t) => t.type === tab);
  const totalEntradas = filteredByDate.filter((t) => t.type === "entrada").reduce((s, t) => s + t.value, 0);
  const totalSaidas = filteredByDate.filter((t) => t.type === "saida").reduce((s, t) => s + t.value, 0);
  const saldo = totalEntradas - totalSaidas;

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">Controle seu fluxo de caixa de forma simples</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[170px] bg-card text-xs">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="bg-card text-foreground">
              <SelectItem value="month">Navegar Mês</SelectItem>
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
                className="w-[135px] bg-card text-xs"
                placeholder="Início"
              />
              <span className="text-xs text-muted-foreground font-bold">até</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[135px] bg-card text-xs"
                placeholder="Fim"
              />
            </div>
          )}

          <Button onClick={() => setModalOpen(true)} size="sm" className="shadow-xs">
            <Plus className="h-4 w-4 mr-1.5" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        <div className="rounded-xl bg-card border border-border/50 p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Entradas</p>
            <p className="text-2xl font-bold text-foreground mt-1">R$ {totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2.5 border border-emerald-500/20">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border/50 p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saídas</p>
            <p className="text-2xl font-bold text-foreground mt-1">R$ {totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-lg bg-destructive/10 text-destructive p-2.5 border border-destructive/20">
            <ArrowDownRight className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border/50 p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resultado (Lucro)</p>
            <p className={`text-2xl font-bold mt-1 ${saldo >= 0 ? "text-foreground" : "text-destructive"}`}>
              R$ {saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg bg-accent text-muted-foreground p-2.5 border border-border/40">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card rounded-xl border border-border/50 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-border/40">
          <div className="inline-flex p-1 bg-accent/40 rounded-lg border border-border/40 gap-1">
            {(["all", "entrada", "saida"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${tab === t
                  ? "bg-card text-foreground shadow-xs border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {t === "all" ? "Todas" : t === "entrada" ? "Entradas" : "Saídas"}
              </button>
            ))}
          </div>

          {periodFilter === 'month' && (
            <div className="flex items-center gap-1 bg-accent/30 p-1 rounded-lg border border-border/40">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-7 w-7">
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-semibold px-2 text-center min-w-[110px] text-foreground">
                {MONTHS[selectedMonth]} {selectedYear}
              </span>
              <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7">
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs font-medium text-muted-foreground">Carregando transações...</div>
          ) : filtered.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40 bg-accent/20">
                  <th className="text-left p-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descrição</th>
                  <th className="text-left p-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
                  <th className="text-left p-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</th>
                  <th className="text-right p-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
                  <th className="text-right p-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-accent/20 transition-colors">
                    <td className="p-3.5 text-sm font-medium text-foreground">{t.description}</td>
                    <td className="p-3.5 text-xs font-medium text-muted-foreground">{t.date}</td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${t.type === "entrada"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                        }`}>
                        {t.type === "entrada" ? "Entrada" : "Saída"}
                      </span>
                    </td>
                    <td className={`p-3.5 text-sm text-right font-semibold ${t.type === "entrada" ? "text-foreground" : "text-destructive"}`}>
                      {t.type === "entrada" ? "+" : "-"} R$ {t.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="text-xs font-medium text-muted-foreground bg-accent/40 border border-border/40 px-2.5 py-0.5 rounded-full">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-xs font-medium text-muted-foreground">Nenhuma transação encontrada no período.</div>
          )}
        </div>
      </div>

      {/* Transaction Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-muted-foreground" /> Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Compra de materiais, Sessão..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1.5"><Banknote className="w-4 h-4 text-muted-foreground" /> Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.value || ""}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-muted-foreground" /> Data</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1.5"><RefreshCw className="w-4 h-4 text-muted-foreground" /> Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v: "entrada" | "saida") => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-muted-foreground" /> Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pago">Pago</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveTransaction}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Financial;
