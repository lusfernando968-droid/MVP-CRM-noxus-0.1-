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

      const res = await fetch("http://localhost:3000/api/financial", {
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

      const res = await fetch("http://localhost:3000/api/financial", {
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
    // t.date is formatted as "dd/mm/yyyy"
    const parts = t.date.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return month === selectedMonth && year === selectedYear;
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">Controle seu fluxo de caixa</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-success/10 p-2.5">
              <ArrowUpRight className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entradas</p>
              <p className="text-xl font-bold text-foreground">R$ {totalEntradas.toLocaleString("pt-BR")}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-destructive/10 p-2.5">
              <ArrowDownRight className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saídas</p>
              <p className="text-xl font-bold text-foreground">R$ {totalSaidas.toLocaleString("pt-BR")}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lucro</p>
              <p className={`text-xl font-bold ${saldo >= 0 ? "text-success" : "text-destructive"}`}>
                R$ {saldo.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card rounded-xl border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b">
          <div className="flex items-center gap-1">
            {(["all", "entrada", "saida"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
              >
                {t === "all" ? "Todas" : t === "entrada" ? "Entradas" : "Saídas"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-32 text-center">
              {MONTHS[selectedMonth]} {selectedYear}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Carregando transações...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-accent/30">
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descrição</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-accent/30 transition-colors">
                    <td className="p-4 text-sm text-foreground">{t.description}</td>
                    <td className="p-4 text-sm text-muted-foreground">{t.date}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${t.type === "entrada" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                        }`}>
                        {t.type === "entrada" ? "Entrada" : "Saída"}
                      </span>
                    </td>
                    <td className={`p-4 text-sm text-right font-medium ${t.type === "entrada" ? "text-success" : "text-destructive"
                      }`}>
                      {t.type === "entrada" ? "+" : "-"} R$ {t.value.toLocaleString("pt-BR")}
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-xs text-muted-foreground bg-accent px-2 py-1 rounded">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
