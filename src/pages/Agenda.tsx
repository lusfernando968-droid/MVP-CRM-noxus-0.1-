import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, Check, User, Calendar, Clock, Banknote, CalendarDays, Activity } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Appointment {
  id: string;
  client_id: string;
  client_name?: string;
  date: string;
  startTime: string;
  endTime: string;
  value: number;
  deposit: number;
  deposit_date?: string;
  status: string;
}

const Agenda = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('nx_appointments')
        .select(`
          *,
          clients (
            name
          )
        `);

      if (error) throw error;

      const formatted = data.map((appt: any) => ({
        id: appt.id,
        client_id: appt.client_id,
        client_name: appt.clients?.name || "Cliente Desconhecido",
        date: appt.date,
        startTime: appt.start_time.substring(0, 5),
        endTime: appt.end_time.substring(0, 5),
        value: Number(appt.value),
        deposit: Number(appt.deposit),
        deposit_date: appt.deposit_date,
        status: appt.status
      }));

      setAppointments(formatted);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('nx_clients')
        .select('id, name')
        .order('name');
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchClients();
  }, []);

  const [formData, setFormData] = useState({
    client_id: "",
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    status: "Agendado",
    value: 0,
    deposit: 0,
    deposit_date: ""
  });

  const getEventColors = (status: string) => {
    // We use the HSL variables from tailwind theme via standard CSS color mapping or hex
    // Using CSS variables directly so it adapts to light/dark mode if they change
    switch (status) {
      case "Pendente":
      case "Agendado": return { backgroundColor: "hsl(var(--primary))", borderColor: "hsl(var(--primary))" };
      case "Confirmado": return { backgroundColor: "#9333ea", borderColor: "#9333ea" }; // Purple
      case "Concluído": return { backgroundColor: "hsl(var(--success))", borderColor: "hsl(var(--success))" };
      case "Cancelado": return { backgroundColor: "hsl(var(--destructive))", borderColor: "hsl(var(--destructive))" };
      default: return { backgroundColor: "hsl(var(--muted))", borderColor: "hsl(var(--muted))" };
    }
  };

  const calendarEvents = appointments.map(appt => {
    const colors = getEventColors(appt.status);
    return {
      id: appt.id,
      title: appt.client_name,
      start: appt.date + 'T' + appt.startTime,
      end: appt.date + 'T' + appt.endTime,
      backgroundColor: colors.backgroundColor,
      borderColor: colors.borderColor,
      textColor: "#ffffff",
      extendedProps: {
        status: appt.status,
        value: appt.value,
        deposit: appt.deposit,
        deposit_date: appt.deposit_date
      }
    };
  });

  const statusColor = (status: string) => {
    switch (status) {
      case "Confirmado": return "bg-purple-500/10 text-purple-500";
      case "Pendente":
      case "Agendado": return "bg-primary/10 text-primary";
      case "Concluído": return "bg-success/10 text-success";
      case "Cancelado": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getEventClass = (status: string) => {
    switch (status) {
      case "Confirmado": return "px-2 py-0.5 rounded-md text-xs font-medium";
      case "Pendente":
      case "Agendado": return "px-2 py-0.5 rounded-md text-xs font-medium";
      case "Concluído": return "px-2 py-0.5 rounded-md text-xs font-medium";
      case "Cancelado": return "px-2 py-0.5 rounded-md text-xs font-medium";
      default: return "px-2 py-0.5 rounded-md text-xs font-medium";
    }
  };

  const handleDateClick = (arg: { dateStr: string }) => {
    setEditingAppointment(null);
    setSelectedDate(arg.dateStr);
    setFormData({
      client_id: "",
      date: arg.dateStr.includes("T") ? arg.dateStr.split("T")[0] : arg.dateStr,
      startTime: arg.dateStr.includes("T") ? arg.dateStr.split("T")[1].substring(0, 5) : "09:00",
      endTime: arg.dateStr.includes("T") ?
        new Date(new Date(arg.dateStr).getTime() + 60 * 60 * 1000).toTimeString().substring(0, 5) :
        "10:00",
      status: "Agendado",
      value: 0,
      deposit: 0,
      deposit_date: ""
    });
    setModalOpen(true);
  };

  const handleEventClick = (arg: any) => {
    const appt = appointments.find(a => a.id === arg.event.id);
    if (appt) {
      setEditingAppointment(appt);
      setFormData({
        client_id: appt.client_id || "",
        date: appt.date,
        startTime: appt.startTime,
        endTime: appt.endTime,
        status: appt.status,
        value: appt.value,
        deposit: appt.deposit,
        deposit_date: appt.deposit_date || ""
      });
      setModalOpen(true);
    }
  };

  const confirmAppointmentAndFinance = async (id: string, clientId: string, value: number, date: string, clientName: string, newStatus?: string, deposit: number = 0, depositDate?: string) => {
    // 1. Update appointment status (if called externally with quick confirm)
    if (newStatus) {
      const { error: apptError } = await supabase.from('nx_appointments').update({ status: newStatus }).eq('id', id);
      if (apptError) throw apptError;
    }

    // 2. Check/Insert financial transaction
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: existingTxs } = await supabase
        .from('nx_financial_transactions')
        .select('id, description')
        .eq('appointment_id', id);

      const depositTx = existingTxs?.find(tx => tx.description.startsWith('Sinal'));
      const sessionTx = existingTxs?.find(tx => tx.description.startsWith('Sessão'));

      if (deposit > 0) {
        if (depositTx) {
          await supabase.from('nx_financial_transactions').update({ value: deposit, date: depositDate || date }).eq('id', depositTx.id);
        } else {
          await supabase.from('nx_financial_transactions').insert({
            description: `Sinal - ${clientName}`,
            value: deposit,
            type: 'entrada',
            status: 'Pago',
            date: depositDate || date,
            appointment_id: id,
            user_id: user.id
          });
        }
      } else if (depositTx) {
        await supabase.from('nx_financial_transactions').delete().eq('id', depositTx.id);
      }

      const remainingValue = value - deposit;
      if (remainingValue > 0) {
        if (sessionTx) {
          await supabase.from('nx_financial_transactions').update({ value: remainingValue, date: date }).eq('id', sessionTx.id);
        } else {
          await supabase.from('nx_financial_transactions').insert({
            description: `Sessão - ${clientName}`,
            value: remainingValue,
            type: 'entrada',
            status: 'Pago',
            date: date,
            appointment_id: id,
            user_id: user.id
          });
        }
      } else if (sessionTx) {
        await supabase.from('nx_financial_transactions').delete().eq('id', sessionTx.id);
      }
    }

    // 3. Increment client session count and update last visit
    const { data: clientData } = await supabase
      .from('nx_clients')
      .select('sessions')
      .eq('id', clientId)
      .single();

    if (clientData) {
      await supabase.from('nx_clients').update({
        sessions: (clientData.sessions || 0) + 1,
        last_visit: date
      }).eq('id', clientId);
    }
  };

  const handleSave = async () => {
    try {
      // 1. Get user session (mock for now or real if Auth is ready)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Você precisa estar logado para salvar.");
        return;
      }

      // 2. Validation
      if (!formData.client_id) {
        alert("Por favor, selecione um cliente.");
        return;
      }

      // 3. Save appointment
      const appointmentData = {
        client_id: formData.client_id,
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        value: formData.value,
        deposit: formData.deposit,
        deposit_date: formData.deposit_date || null,
        status: formData.status,
        user_id: user.id
      };

      if (editingAppointment) {
        const { error } = await supabase
          .from('nx_appointments')
          .update(appointmentData)
          .eq('id', editingAppointment.id);
        if (error) throw error;

        if (formData.status === 'Confirmado' || formData.status === 'Concluído') {
          const clientName = clients.find(c => c.id === formData.client_id)?.name || 'Cliente';
          await confirmAppointmentAndFinance(editingAppointment.id, formData.client_id, formData.value, formData.date, clientName, undefined, formData.deposit, formData.deposit_date);
        } else if (formData.status === 'Cancelado' || formData.status === 'Agendado') {
          await supabase.from('nx_financial_transactions').delete().eq('appointment_id', editingAppointment.id);
        }
      } else {
        const { data, error } = await supabase
          .from('nx_appointments')
          .insert(appointmentData)
          .select()
          .single();
        if (error) throw error;

        if (formData.status === 'Confirmado' || formData.status === 'Concluído') {
          const clientName = clients.find(c => c.id === formData.client_id)?.name || 'Cliente';
          await confirmAppointmentAndFinance(data.id, formData.client_id, formData.value, formData.date, clientName, undefined, formData.deposit, formData.deposit_date);
        }
      }

      await fetchAppointments();
      setModalOpen(false);
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert('Erro ao salvar agendamento.');
    }
  };

  const handleSelect = (arg: any) => {
    setEditingAppointment(null);
    setSelectedDate(arg.startStr.split("T")[0]);
    setFormData({
      client_id: "",
      date: arg.startStr.split("T")[0],
      startTime: arg.startStr.includes("T") ? arg.startStr.split("T")[1].substring(0, 5) : "09:00",
      endTime: arg.endStr.includes("T") ? arg.endStr.split("T")[1].substring(0, 5) : "10:00",
      status: "Agendado",
      value: 0,
      deposit: 0,
      deposit_date: ""
    });
    setModalOpen(true);
  };

  const handleEventChange = async (changeInfo: any) => {
    const { event } = changeInfo;
    try {
      const { error } = await supabase
        .from('nx_appointments')
        .update({
          date: event.startStr.split("T")[0],
          start_time: event.startStr.split("T")[1].substring(0, 5),
          end_time: event.endStr ? event.endStr.split("T")[1].substring(0, 5) : undefined
        })
        .eq('id', event.id);

      if (error) throw error;
      await fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      changeInfo.revert();
    }
  };

  const handleConfirmAppointment = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const appt = appointments.find(a => a.id === id);
      if (!appt) return;
      await confirmAppointmentAndFinance(id, appt.client_id, appt.value, appt.date, appt.client_name || 'Cliente', 'Confirmado', appt.deposit, appt.deposit_date);
      toast.success('Agendamento confirmado!');
      await fetchAppointments();
    } catch (error) {
      console.error('Error confirming appointment:', error);
      toast.error('Erro ao confirmar agendamento.');
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments
    .filter(a => a.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Agenda</h1>
          <p className="page-subtitle">Gerencie seus agendamentos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => {
            setEditingAppointment(null);
            setFormData({
              client_id: "",
              date: new Date().toISOString().split("T")[0],
              startTime: "09:00",
              endTime: "10:00",
              status: "Agendado",
              value: 0,
              deposit: 0,
              deposit_date: ""
            });
            setModalOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {todayAppointments.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Agendamentos de Hoje</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayAppointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-card rounded-xl border shadow-sm p-4 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => {
                  setEditingAppointment(appt);
                  setFormData({
                    client_id: appt.client_id || "",
                    date: appt.date,
                    startTime: appt.startTime,
                    endTime: appt.endTime,
                    status: appt.status,
                    value: appt.value,
                    deposit: appt.deposit,
                    deposit_date: appt.deposit_date || ""
                  });
                  setModalOpen(true);
                }}
              >
                <div>
                  <p className="font-bold text-foreground">{appt.startTime} - {appt.endTime}</p>
                  <p className="text-sm text-muted-foreground">{appt.client_name}</p>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded-md text-xs font-semibold ${statusColor(appt.status)}`}>
                    {appt.status}
                  </span>
                </div>
                {appt.status === 'Agendado' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-success text-success hover:bg-success hover:text-white"
                    onClick={(e) => handleConfirmAppointment(appt.id, e)}
                  >
                    <Check className="h-4 w-4 mr-1.5" />
                    Confirmar
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border shadow-sm p-4 h-[750px] overflow-x-hidden">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
          events={calendarEvents}
          locale="pt-br"
          headerToolbar={{
            left: isMobile ? "prev,next" : "prev,next today",
            center: "title",
            right: isMobile ? "timeGridDay" : "dayGridMonth,timeGridWeek,timeGridDay"
          }}
          height="100%"
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          nowIndicator={true}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            omitZeroMinute: false,
            meridiem: false
          }}
          eventClassNames={(arg) => {
            const status = arg.event.extendedProps?.status || "Agendado";
            return getEventClass(status);
          }}
          buttonText={{
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            list: 'Lista'
          }}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          selectable={true}
          selectMirror={true}
          select={handleSelect}
          editable={true}
          eventDrop={handleEventChange}
          eventResize={handleEventChange}
        />
      </div>

      {/* New Appointment Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAppointment ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="flex items-center gap-1.5"><User className="w-4 h-4 text-muted-foreground" /> Cliente</Label>
              <Select
                value={formData.client_id}
                onValueChange={(v) => setFormData({ ...formData, client_id: v })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecione um cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-muted-foreground" /> Data</Label>
                <Input
                  type="date"
                  className="mt-1.5"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
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
                    <SelectItem value="Agendado">Agendado</SelectItem>
                    <SelectItem value="Confirmado">Confirmado</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-muted-foreground" /> Início</Label>
                <Input
                  type="time"
                  className="mt-1.5"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-muted-foreground" /> Fim</Label>
                <Input
                  type="time"
                  className="mt-1.5"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1.5"><Banknote className="w-4 h-4 text-muted-foreground" /> Valor Total + Sinal (R$)</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  className="mt-1.5"
                  value={formData.value || ""}
                  onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="flex items-center gap-1.5"><Banknote className="w-4 h-4 text-muted-foreground opacity-70" /> Sinal (R$)</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  className="mt-1.5"
                  value={formData.deposit || ""}
                  onChange={(e) => setFormData({ ...formData, deposit: Number(e.target.value) })}
                />
              </div>
            </div>

            {formData.deposit > 0 && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-muted-foreground" /> Data do Pagamento do Sinal</Label>
                <Input
                  type="date"
                  className="mt-1.5 w-full"
                  value={formData.deposit_date}
                  onChange={(e) => setFormData({ ...formData, deposit_date: e.target.value })}
                />
              </div>
            )}
            <Button className="w-full mt-2" onClick={handleSave} disabled={loading}>
              {editingAppointment ? "Atualizar Agendamento" : "Salvar Agendamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Agenda;
