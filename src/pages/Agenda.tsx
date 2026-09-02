import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronLeft, ChevronRight, Plus, Check, User, Calendar, Clock, Banknote, CalendarDays, Activity, CheckCircle2, Trash2, Search, ChevronsUpDown } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

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
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileViewType, setMobileViewType] = useState<string>("timeGridDay");
  const calendarRef = useRef<any>(null);
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  });
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedCheckout, setSelectedCheckout] = useState<Appointment | null>(null);
  const [checkoutData, setCheckoutData] = useState({
    status: 'Recebido',
    value: 0,
    paymentMethod: 'Pix'
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      calendarRef.current?.getApi()?.changeView(mobileViewType);
    }
  }, [mobileViewType, isMobile]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("noxus_token");
      if (!token) return;

      const res = await fetch((import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api/appointments", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erro");
      const data = await res.json();
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem("noxus_token");
      if (!token) return;
      const res = await fetch((import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api/clients", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erro");
      const data = await res.json();
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



  const handleDelete = async () => {
    if (!editingAppointment) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("noxus_token");
      if (!token) return;

      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/appointments/${editingAppointment.id}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Erro ao excluir agendamento.");

      toast.success("Agendamento excluído com sucesso.");
      setModalOpen(false);
      setDeleteAlertOpen(false);
      await fetchAppointments();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir agendamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.client_id) {
        alert("Por favor, selecione um cliente.");
        return;
      }

      const token = localStorage.getItem("noxus_token");
      if (!token) {
        alert("Sessão expirada.");
        return;
      }

      if (editingAppointment) {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/appointments/${editingAppointment.id}`, {
          method: 'PUT',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error("Erro ao atualizar");
      } else {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/appointments`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error("Erro ao criar");
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
      const token = localStorage.getItem("noxus_token");
      if (!token) return;

      const appt = appointments.find(a => a.id === event.id);
      if (!appt) return;

      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/appointments/${event.id}`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          client_id: appt.client_id,
          date: event.startStr.split("T")[0],
          startTime: event.startStr.split("T")[1].substring(0, 5),
          endTime: event.endStr ? event.endStr.split("T")[1].substring(0, 5) : appt.endTime,
          status: appt.status,
          value: appt.value,
          deposit: appt.deposit,
          deposit_date: appt.deposit_date
        })
      });

      if (!res.ok) throw new Error("Erro");
      await fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      changeInfo.revert();
    }
  };

  const handleConfirmAppointment = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("noxus_token");
      if (!token) return;
      const appt = appointments.find(a => a.id === id);
      if (!appt) return;
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/appointments/${id}`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          client_id: appt.client_id,
          date: appt.date,
          startTime: appt.startTime,
          endTime: appt.endTime,
          status: 'Confirmado',
          value: appt.value,
          deposit: appt.deposit,
          deposit_date: appt.deposit_date
        })
      });
      if (!res.ok) throw new Error("Erro");

      await fetchAppointments();
      toast.success("Agendamento confirmado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao confirmar agendamento.");
    }
  };

  const openCheckout = (appt: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCheckout(appt);
    setCheckoutData({
      status: 'Recebido',
      value: Math.max(0, (appt.value || 0) - (appt.deposit || 0)),
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

      const res = await fetch((import.meta.env.VITE_API_URL || "http://localhost:3000") + '/api/appointments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          appointmentId: selectedCheckout.id,
          status: checkoutData.status,
          value: checkoutData.value,
          paymentMethod: checkoutData.paymentMethod,
          name: selectedCheckout.client_name,
          date: selectedCheckout.date
        })
      });

      if (!res.ok) throw new Error("Erro");

      toast.success("Sessão baixada com sucesso!");
      setCheckoutModalOpen(false);
      fetchAppointments();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao dar baixa na sessão.");
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments
    .filter(a => a.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // ── Week Strip helpers (Google Calendar style) ──
  const WEEK_DAYS_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];

  const getWeekDays = (weekStart: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays(currentWeekStart);

  const navigateWeek = (direction: number) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + direction * 7);
    setCurrentWeekStart(newStart);
    const today = new Date(); today.setHours(0,0,0,0);
    const weekEnd = new Date(newStart); weekEnd.setDate(newStart.getDate() + 6);
    const todayInWeek = today >= newStart && today <= weekEnd;
    const newDay = todayInWeek ? today : new Date(newStart);
    setSelectedDay(newDay);
    calendarRef.current?.getApi()?.gotoDate(newDay);
  };

  const selectDay = (day: Date) => {
    const d = new Date(day); d.setHours(0,0,0,0);
    setSelectedDay(d);
    calendarRef.current?.getApi()?.gotoDate(d);
  };

  const daysWithEvents = useMemo(
    () => new Set(appointments.map(a => a.date)),
    [appointments]
  );

  return (
    <>
      {/* Page header — compacto no mobile */}
      <div className={cn("page-header", isMobile && "mb-2")}>
        <div>
          <h1 className="page-title">Agenda</h1>
          <p className="page-subtitle hidden sm:block">Gerencie seus agendamentos</p>
        </div>
        <div className="flex items-center gap-2">
          {isMobile && (
            <div className="flex bg-muted p-1 rounded-md">
              <button
                onClick={() => setMobileViewType("timeGridDay")}
                className={cn("px-3 py-1 text-xs font-medium rounded-sm transition-colors", mobileViewType === "timeGridDay" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
              >
                Dia
              </button>
              <button
                onClick={() => setMobileViewType("timeGridWeek")}
                className={cn("px-3 py-1 text-xs font-medium rounded-sm transition-colors", mobileViewType === "timeGridWeek" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
              >
                Semana
              </button>
            </div>
          )}
          <Button
            size="sm"
            onClick={() => {
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
            }}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="ml-1.5 hidden sm:inline">Novo Agendamento</span>
            <span className="ml-1.5 sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Agendamentos de Hoje — apenas desktop */}
      {todayAppointments.length > 0 && (
        <div className="mb-2 hidden lg:block">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Agendamentos de Hoje</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                {appt.status !== 'Concluído' && appt.status !== 'Cancelado' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs px-3 rounded-full border-primary/20 text-primary hover:bg-primary/10 ml-2"
                    onClick={(e) => openCheckout(appt, e)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Dar Baixa
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendário — edge-to-edge no mobile, card no desktop */}
      <div className={cn(
        "bg-card border shadow-sm overflow-hidden flex flex-col",
        isMobile
          ? "-mx-4 -mb-4 mt-0 rounded-none border-x-0 border-b-0 h-[calc(100dvh-12rem)]"
          : "rounded-xl p-4"
      )}>

        {/* Week Strip — apenas mobile (estilo Google Calendar) */}
        {isMobile && (
          <div className="border-b border-border/50 bg-card">
            {/* Cabeçalho do mês + navegação */}
            <div className="flex items-center justify-between px-3 pt-2 pb-0.5">
              <button
                onClick={() => navigateWeek(-1)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold text-muted-foreground capitalize">
                {weekDays[0].toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </span>
              <button
                onClick={() => navigateWeek(1)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Linha de dias */}
            <div className="grid grid-cols-7 px-1 pb-2">
              {weekDays.map((day, i) => {
                const dayStr = day.toISOString().split("T")[0];
                const isSelected = dayStr === selectedDay.toISOString().split("T")[0];
                const isToday = dayStr === todayStr;
                const hasEvents = daysWithEvents.has(dayStr);
                return (
                  <button
                    key={i}
                    onClick={() => selectDay(day)}
                    className="flex flex-col items-center gap-0.5 py-1"
                  >
                    <span className={cn(
                      "text-[10px] font-semibold uppercase",
                      isToday && !isSelected ? "text-primary" : "text-muted-foreground"
                    )}>
                      {WEEK_DAYS_SHORT[day.getDay()]}
                    </span>
                    <span className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-150",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md"
                        : isToday
                        ? "text-primary font-bold"
                        : "text-foreground"
                    )}>
                      {day.getDate()}
                    </span>
                    <span className={cn(
                      "h-1 w-1 rounded-full transition-all",
                      hasEvents
                        ? isSelected ? "bg-primary-foreground" : "bg-primary"
                        : "bg-transparent"
                    )} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* FullCalendar */}
        <div className={cn(isMobile ? "flex-1 overflow-hidden" : "")} style={{ height: isMobile ? '100%' : '720px' }}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
            initialDate={selectedDay}
            events={calendarEvents}
            locale="pt-br"
            headerToolbar={isMobile ? false : {
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay"
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
            selectLongPressDelay={500}
            eventLongPressDelay={500}
            editable={true}
            eventDrop={handleEventChange}
            eventResize={handleEventChange}
          />
        </div>
      </div>

      {/* New Appointment Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAppointment ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label className="flex items-center gap-1.5"><User className="w-4 h-4 text-muted-foreground" /> Cliente</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(val) => setFormData({ ...formData, client_id: val })}
                >
                  <SelectTrigger className="w-full mt-1.5">
                    <SelectValue placeholder="Selecione um cliente..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card text-foreground" style={{ zIndex: 9999 }}>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.phone && c.phone !== "Não informado" ? `(${c.phone})` : ""}
                      </SelectItem>
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
            
            <div className="flex items-center gap-2 mt-2">
              {editingAppointment && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteAlertOpen(true)}
                  disabled={loading}
                  title="Excluir Agendamento"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
              <Button className="w-full h-10" onClick={handleSave} disabled={loading}>
                {editingAppointment ? "Atualizar Agendamento" : "Salvar Agendamento"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso removerá o agendamento e todos os dados financeiros associados (como sinais pagos).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Checkout Modal */}
      <Dialog open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Finalizar Sessão (Dar Baixa)</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="bg-muted p-3 rounded-md flex flex-col gap-1 text-sm">
              <span className="font-semibold text-foreground">Cliente: {selectedCheckout?.client_name}</span>
              <span className="text-muted-foreground">Horário: {selectedCheckout?.startTime} - {selectedCheckout?.endTime}</span>
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

export default Agenda;
