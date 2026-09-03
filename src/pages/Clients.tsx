import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, Phone, Instagram, ChevronRight, Camera, User, CheckCircle2, AlertCircle, Pencil, Trash2, Calendar, Clock, DollarSign, Users, Share2 } from "lucide-react";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  phone: string;
  instagram: string;
  age: number;
  birth_date?: string;
  sessions: number;
  lastVisit: string;
  avatar_url?: string;
  referred_by_id?: string;
  referrer_name?: string;
}

const calculateAgeFromDate = (birthDateStr?: string) => {
  if (!birthDateStr) return 0;
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
};

const Clients = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('id');
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // New states for sessions
  const [clientSessions, setClientSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // New states for referrals
  const [referredClients, setReferredClients] = useState<any[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  // New states for Anamnesis
  const [clientAnamnesis, setClientAnamnesis] = useState<any>(null);
  const [loadingAnamnesis, setLoadingAnamnesis] = useState(false);

  // New Client States
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: "",
    phone: "",
    instagram: "",
    birth_date: "",
    avatar_url: "",
    referred_by_id: ""
  });

  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editClientData, setEditClientData] = useState({
    id: "",
    name: "",
    phone: "",
    instagram: "",
    birth_date: "",
    avatar_url: "",
    referred_by_id: ""
  });

  const fetchClients = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem("noxus_user");
      if (!userStr) return;
      const parsedUser = JSON.parse(userStr);

      const { data, error } = await supabase
        .from('noxus_clients')
        .select(`
          *,
          noxus_appointments ( date, status )
        `)
        .eq('userId', parsedUser.id)
        .order('createdAt', { ascending: false });

      if (error) {
        console.error("Supabase fetch error:", error);
        throw error;
      }

      const formatted = (data || []).map((c: any) => {
        const validSessions = (c.noxus_appointments || []).filter((a: any) => a.status !== 'Cancelado');
        const sortedSessions = validSessions.sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""));
        const lastVisit = sortedSessions.length > 0 ? sortedSessions[0].date : null;
        
        const referrer = c.referred_by_id ? data.find((r: any) => r.id === c.referred_by_id) : null;

        return {
          id: c.id,
          name: c.name,
          phone: c.phone || "Não informado",
          instagram: c.instagram || "@",
          birth_date: c.birth_date || "",
          age: c.birth_date ? calculateAgeFromDate(c.birth_date) : (c.age || 0),
          sessions: c.noxus_appointments ? c.noxus_appointments.length : 0,
          lastVisit: lastVisit ? (lastVisit.includes('-') ? lastVisit.split('-').reverse().join('/') : lastVisit) : "Sem visitas",
          avatar_url: c.avatar_url,
          referred_by_id: c.referred_by_id,
          referrer_name: referrer ? referrer.name : null
        };
      });

      setClients(formatted);

      if (selectedClient) {
        const updated = formatted.find((c: any) => c.id === selectedClient.id);
        if (updated) setSelectedClient(updated);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Auto-select client if ID is in URL
  useEffect(() => {
    if (targetId && clients.length > 0 && !selectedClient) {
      const target = clients.find(c => c.id === targetId);
      if (target) {
        setSelectedClient(target);
      }
    }
  }, [targetId, clients, selectedClient]);

  useEffect(() => {
    if (selectedClient) {
      fetchClientSessions(selectedClient.id);
      fetchReferredClients(selectedClient.id);
      fetchClientAnamnesis(selectedClient.id);
    }
  }, [selectedClient]);

  const fetchClientAnamnesis = async (clientId: string) => {
    try {
      setLoadingAnamnesis(true);
      const { data, error } = await supabase
        .from('noxus_anamnesis')
        .select('*')
        .eq('clientId', clientId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows
      
      if (data) {
        let answers = data.answers || {};
        if (typeof answers === 'string') {
          try { answers = JSON.parse(answers); } catch(e) {}
        }
        setClientAnamnesis({
          medical_history: {
            diabetes: answers.diabetes,
            hepatitis: answers.hepatitis,
            pregnancy: answers.pregnancy,
            bleeding_disorders: answers.bleeding_disorders,
            keloids: answers.keloids,
          },
          birth_date: answers.birth_date,
          discovery_source: data.discoverySource || answers.discovery_source,
          allergies: answers.allergies,
          medications: answers.medications,
          emergency_contact: answers.emergency_contact,
          has_contract_signed: true,
          signed_at: data.createdAt
        });
      } else {
        setClientAnamnesis(null);
      }
    } catch (error) {
      console.error('Error fetching anamnesis:', error);
    } finally {
      setLoadingAnamnesis(false);
    }
  };

  const fetchClientSessions = async (clientId: string) => {
    try {
      setLoadingSessions(true);
      const { data, error } = await supabase
        .from('noxus_appointments')
        .select('*')
        .eq('clientId', clientId)
        .order('date', { ascending: false });
        
      if (error) throw error;
      setClientSessions(data || []);
    } catch (error) {
      console.error('Error fetching client sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchReferredClients = async (clientId: string) => {
    try {
      setLoadingReferrals(true);
      const { data, error } = await supabase
        .from('noxus_clients')
        .select('id, name, phone')
        .eq('referred_by_id', clientId)
        .order('createdAt', { ascending: false });
        
      if (error) throw error;
      setReferredClients(data || []);
    } catch (error) {
      console.error('Error fetching referred clients:', error);
    } finally {
      setLoadingReferrals(false);
    }
  };

  const handleCopyAnamnesisLink = async () => {
    if (!selectedClient) return;
    const url = `${window.location.origin}/anamnese/${selectedClient.id}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado para a área de transferência!");
      } else {
        // Fallback for non-HTTPS or older browsers
        const textArea = document.createElement("textarea");
        textArea.value = url;

        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand('copy');
          if (successful) {
            toast.success("Link copiado para a área de transferência!");
          } else {
            toast.error("Não foi possível copiar o link.", { description: "Copie manualmente: " + url });
          }
        } catch (err) {
          toast.error("Não foi possível copiar o link.", { description: "Copie manualmente: " + url });
        }

        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error("Failed to copy", error);
      toast.error("Não foi possível copiar o link.", { description: "Copie manualmente: " + url });
    }
  };

  const handleSendAnamnesisWhatsApp = () => {
    if (!selectedClient || !selectedClient.phone) {
      alert("O cliente não possui um telefone cadastrado.");
      return;
    }
    const url = `${window.location.origin}/anamnese/${selectedClient.id}`;
    const text = `Olá ${selectedClient.name}! Aqui está o link para você preencher sua ficha de anamnese e assinar as autorizações do estúdio antes da sua sessão: ${url}`;
    const phoneValid = selectedClient.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phoneValid}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setNewClientData({ ...newClientData, avatar_url: publicUrl });
    } catch (error) {
      alert('Erro ao carregar imagem.');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!selectedClient || !event.target.files || event.target.files.length === 0) return;
      setIsUpdatingAvatar(true);

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedClient.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('nx_clients')
        .update({ avatar_url: publicUrl })
        .eq('id', selectedClient.id);

      if (updateError) throw updateError;

      // Update local state
      const updatedClient = { ...selectedClient, avatar_url: publicUrl };
      setSelectedClient(updatedClient);

      // Update in the clients list
      setClients(clients.map(c => c.id === selectedClient.id ? updatedClient : c));

    } catch (error) {
      console.error('Error updating avatar:', error);
      alert('Erro ao atualizar a foto de perfil.');
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleCreateClient = async () => {
    try {
      if (!newClientData.name) {
        alert("O nome é obrigatório.");
        return;
      }

      const userStr = localStorage.getItem("noxus_user");
      if (!userStr) {
        alert("Sessão expirada. Faça login novamente.");
        return;
      }
      const parsedUser = JSON.parse(userStr);

      const { error } = await supabase
        .from('noxus_clients')
        .insert({
          name: newClientData.name,
          phone: newClientData.phone,
          instagram: newClientData.instagram,
          birth_date: newClientData.birth_date,
          avatar_url: newClientData.avatar_url,
          referred_by_id: newClientData.referred_by_id === "none" ? null : (newClientData.referred_by_id || null),
          userId: parsedUser.id
        });

      if (error) {
        throw new Error(error.message || "Erro ao criar cliente");
      }

      await fetchClients();
      setIsAddingClient(false);
      setNewClientData({
        name: "",
        phone: "",
        instagram: "",
        birth_date: "",
        avatar_url: "",
        referred_by_id: ""
      });
      toast.success("Cliente cadastrado com sucesso!");
    } catch (error: any) {
      console.error('Error creating client:', error);
      alert('Erro ao criar cliente: ' + (error?.message || 'Erro desconhecido.'));
    }
  };

  const openEditModal = () => {
    if (!selectedClient) return;
    setEditClientData({
      id: selectedClient.id,
      name: selectedClient.name,
      phone: selectedClient.phone === "Não informado" ? "" : selectedClient.phone,
      instagram: selectedClient.instagram === "@" ? "" : selectedClient.instagram,
      birth_date: selectedClient.birth_date || "",
      avatar_url: selectedClient.avatar_url || "",
      referred_by_id: selectedClient.referred_by_id || "none"
    });
    setIsEditingClient(true);
  };

  const handleUpdateClient = async () => {
    try {
      if (!editClientData.name) {
        alert("O nome é obrigatório.");
        return;
      }

      setUploading(true);
      const { error } = await supabase
        .from('noxus_clients')
        .update({
          name: editClientData.name,
          phone: editClientData.phone,
          instagram: editClientData.instagram,
          birth_date: editClientData.birth_date,
          referred_by_id: editClientData.referred_by_id === "none" ? null : (editClientData.referred_by_id || null)
        })
        .eq('id', editClientData.id);

      if (error) throw error;

      await fetchClients();
      setIsEditingClient(false);
      toast.success("Cliente atualizado com sucesso!");
    } catch (error: any) {
      console.error('Error updating client:', error);
      alert('Erro ao atualizar cliente: ' + (error?.message || 'Erro desconhecido.'));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    if (!window.confirm(`Tem certeza que deseja excluir o cliente ${selectedClient.name}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('noxus_clients')
        .delete()
        .eq('id', selectedClient.id);

      if (error) throw error;

      setSelectedClient(null);
      await fetchClients();
      toast.success("Cliente excluído com sucesso!");
    } catch (error: any) {
      console.error('Error deleting client:', error);
      alert('Erro ao excluir cliente (Pode haver sessões ou dados associados que precisam ser excluídos antes).');
    } finally {
      setLoading(false);
    }
  };

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">Gerencie seus clientes e fichas</p>
        </div>
        <Button onClick={() => setIsAddingClient(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client List */}
        <div className="lg:col-span-1 bg-card rounded-xl border shadow-sm text-foreground">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground font-medium">Carregando...</div>
            ) : filtered.length > 0 ? (
              filtered.map((client) => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors text-left ${selectedClient?.id === client.id ? "bg-accent" : ""
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {client.avatar_url ? (
                      <img src={client.avatar_url} alt={client.name} className="h-10 w-10 rounded-full object-cover border border-accent/20" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-primary">
                        {client.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.sessions} sessões</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground font-medium">Nenhum cliente encontrado</div>
            )}
          </div>
        </div>

        {/* Client Profile */}
        <div className="lg:col-span-2">
          {selectedClient ? (
            <div className="space-y-6">
              {/* Info Card */}
              <div className="bg-card rounded-xl border shadow-sm p-6 text-foreground">
                <div className="flex items-start gap-4">
                  <div className="relative group shrink-0">
                    <label
                      htmlFor="update-avatar"
                      className="cursor-pointer block relative rounded-full overflow-hidden h-20 w-20 border-2 border-primary/20 shadow-lg"
                    >
                      {selectedClient.avatar_url ? (
                        <img src={selectedClient.avatar_url} alt={selectedClient.name} className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500" />
                      ) : (
                        <div className="h-full w-full bg-accent flex items-center justify-center text-2xl font-bold text-primary">
                          {selectedClient.name.charAt(0)}
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="h-6 w-6 text-white" />
                      </div>

                      {/* Loading State */}
                      {isUpdatingAvatar && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                          <div className="h-5 w-5 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
                        </div>
                      )}
                    </label>
                    <input
                      id="update-avatar"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUpdateAvatar}
                      disabled={isUpdatingAvatar}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Top Row: Name, Age & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground tracking-tight">{selectedClient.name}</h2>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          {selectedClient.age > 0 ? `${selectedClient.age} anos` : 'Idade não informada'} 
                          {selectedClient.birth_date ? ` • Nascido(a) em ${selectedClient.birth_date.split('-').reverse().join('/')}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={openEditModal} className="h-8 text-xs font-medium border-border/60">
                          <Pencil className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleDeleteClient} className="h-8 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          Excluir
                        </Button>
                      </div>
                    </div>

                    {/* Middle Row: Clean Minimal Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {selectedClient.phone && selectedClient.phone !== "Não informado" && (
                        <a
                          href={`https://wa.me/55${selectedClient.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/40 hover:bg-accent border border-border/40 text-xs font-medium text-foreground transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {selectedClient.phone}
                        </a>
                      )}

                      {selectedClient.instagram && selectedClient.instagram !== "@" && (
                        <a
                          href={`https://instagram.com/${selectedClient.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/40 hover:bg-accent border border-border/40 text-xs font-medium text-foreground transition-colors"
                        >
                          <Instagram className="h-3.5 w-3.5 text-muted-foreground" />
                          {selectedClient.instagram}
                        </a>
                      )}

                      {clientAnamnesis?.emergency_contact && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/40 border border-border/40 text-xs font-medium text-foreground">
                          <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          Emergência: {clientAnamnesis.emergency_contact}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/40 border border-border/40 text-xs font-medium text-foreground">
                        <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {selectedClient.referrer_name ? (
                          `Indicado por: ${selectedClient.referrer_name}`
                        ) : clientAnamnesis?.discovery_source ? (
                          `Origem: ${clientAnamnesis.discovery_source}`
                        ) : (
                          `Veio por conta própria`
                        )}
                      </span>

                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/40 border border-border/40 text-xs font-medium text-foreground">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        Indicou {referredClients.length} {referredClients.length === 1 ? 'pessoa' : 'pessoas'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Minimal Metric Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-border/40">
                  <div className="rounded-xl bg-accent/20 p-4 text-center border border-border/40">
                    <p className="text-2xl font-bold text-foreground tracking-tight">
                      {clientSessions.length > 0
                        ? clientSessions.filter(s => s.status !== 'Cancelado').length
                        : (selectedClient.sessions || 0)}
                    </p>
                    <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
                      Sessões Realizadas
                    </p>
                  </div>

                  <div className="rounded-xl bg-accent/20 p-4 text-center border border-border/40">
                    <p className="text-xl font-bold text-foreground tracking-tight">
                      {(() => {
                        const validSessions = clientSessions.filter(s => s.status !== 'Cancelado');
                        if (validSessions.length === 0) return selectedClient.lastVisit || "Sem visitas";
                        const sorted = [...validSessions].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
                        const last = sorted[0];
                        if (!last || !last.date) return selectedClient.lastVisit || "Sem visitas";
                        return last.date.includes('-') ? last.date.split('-').reverse().join('/') : last.date;
                      })()}
                    </p>
                    <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
                      Última Visita
                    </p>
                  </div>

                  <div className="rounded-xl bg-accent/20 p-4 text-center border border-border/40">
                    <p className="text-2xl font-bold text-foreground tracking-tight">
                      R$ {clientSessions
                        .filter(s => s.status !== 'Cancelado')
                        .reduce((acc, curr) => {
                          const val = typeof curr.value === 'string' ? parseFloat(curr.value) : (curr.value || 0);
                          return acc + val;
                        }, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
                      Faturamento Total
                    </p>
                  </div>
                </div>
              </div>

              {/* Referrals (Indicados) */}
              <div className="bg-card rounded-xl border shadow-sm p-6 text-foreground">
                <h3 className="text-lg font-semibold text-foreground mb-4">Pessoas Indicadas</h3>
                <div className="space-y-3">
                  {loadingReferrals ? (
                    <div className="p-4 text-center text-sm text-muted-foreground font-medium">Carregando indicações...</div>
                  ) : referredClients.length > 0 ? (
                    referredClients.map((client: any) => (
                      <div key={client.id} className="flex items-center justify-between p-3 rounded-lg border bg-accent/20">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center font-bold text-primary text-xs">
                            {client.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{client.name}</p>
                            <p className="text-xs text-muted-foreground">{client.phone || 'Sem telefone'}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Este cliente ainda não indicou ninguém.</p>
                  )}
                </div>
              </div>

              {/* Anamnesis & Contract */}
              <div className="bg-card rounded-xl border shadow-sm p-6 text-foreground">
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <h3 className="text-lg font-semibold text-foreground">Ficha de Anamnese e Contrato</h3>
                  {loadingAnamnesis ? (
                    <span className="text-sm text-muted-foreground">Carregando...</span>
                  ) : clientAnamnesis ? (
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Preenchida
                    </span>
                  ) : (
                    <span className="bg-warning text-warning-foreground px-3 py-1 rounded-full text-xs font-bold shadow flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Pendente
                    </span>
                  )}
                </div>

                {!clientAnamnesis && !loadingAnamnesis && (
                  <div className="space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Este cliente ainda não preencheu a ficha. Envie o link exclusivo abaixo para ele:
                    </p>
                    <div className="flex items-center gap-2 justify-center">
                      <Button variant="outline" onClick={handleCopyAnamnesisLink} className="w-full font-semibold border-primary/50 text-primary hover:bg-primary/10">
                        Copiar Link
                      </Button>
                      <Button onClick={handleSendAnamnesisWhatsApp} className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-bold shadow-lg">
                        Mandar no WhatsApp
                      </Button>
                    </div>
                  </div>
                )}

                {clientAnamnesis && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Histórico Clínico Positivo</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(clientAnamnesis.medical_history || {}).map(([key, value]) => {
                          if (!value) return null;
                          const labels: Record<string, string> = {
                            diabetes: "Diabetes",
                            hepatitis: "Hepatite",
                            pregnancy: "Gestante/Lactante",
                            bleeding_disorders: "Prob. Coagulação",
                            keloids: "Queloide"
                          };
                          return (
                            <span key={key} className="bg-destructive/10 text-destructive border border-destructive/20 px-3 py-1 rounded-md text-sm font-bold">
                              {labels[key] || key}
                            </span>
                          );
                        })}
                        {Object.values(clientAnamnesis.medical_history || {}).every(v => !v) && (
                          <span className="text-sm font-medium text-muted-foreground">Nenhuma condição reportada.</span>
                        )}
                      </div>

                      {/* Care Tips / Recommendations */}
                      {Object.values(clientAnamnesis.medical_history || {}).some(v => v) && (
                        <div className="mt-4 bg-warning/10 border border-warning/20 rounded-xl p-4">
                          <h4 className="text-sm font-bold text-warning flex items-center gap-2 mb-2">
                            <AlertCircle className="h-4 w-4" /> Recomendações e Cuidados
                          </h4>
                          <ul className="list-disc list-inside text-sm text-foreground/80 space-y-1">
                            {clientAnamnesis.medical_history?.diabetes && (
                              <li><strong>Diabetes:</strong> Cicatrização pode ser mais lenta. Recomende cuidados redobrados com a assepsia na cicatrização.</li>
                            )}
                            {clientAnamnesis.medical_history?.keloids && (
                              <li><strong>Queloide:</strong> Alto risco de cicatrização hipertrófica. Evite agredir muito a pele e discuta os riscos com o cliente.</li>
                            )}
                            {clientAnamnesis.medical_history?.pregnancy && (
                              <li><strong>Gestante/Lactante:</strong> Necessário liberação médica por escrito para tatuar. Risco de infecções sistêmicas.</li>
                            )}
                            {clientAnamnesis.medical_history?.bleeding_disorders && (
                              <li><strong>Prob. Coagulação:</strong> O cliente pode sangrar mais que o normal, dificultando a pigmentação. Esteja preparado.</li>
                            )}
                            {clientAnamnesis.medical_history?.hepatitis && (
                              <li><strong>Hepatite:</strong> Atenção máxima aos protocolos de biossegurança e descarte de materiais perfurocortantes.</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Data de Nascimento</h4>
                        <p className="text-sm font-medium text-foreground">
                          {clientAnamnesis.birth_date ? new Date(clientAnamnesis.birth_date).toLocaleDateString('pt-BR') : "Não informada"}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Como nos conheceu</h4>
                        <p className="text-sm font-medium text-foreground">{clientAnamnesis.discovery_source || "Não informado"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Alergias</h4>
                        <p className="text-sm font-medium text-foreground">{clientAnamnesis.allergies || "Nenhuma"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Medicamentos</h4>
                        <p className="text-sm font-medium text-foreground">{clientAnamnesis.medications || "Nenhum"}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Contato de Emergência</h4>
                      <p className="text-sm font-medium text-foreground">{clientAnamnesis.emergency_contact || "Não informado"}</p>
                    </div>

                    <div className="bg-accent/10 p-4 border border-accent/20 rounded-xl mt-4 text-center">
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Assinatura Digital de Contrato</p>
                      <p className="text-sm text-foreground font-medium">Contrato lido e aceito pelo cliente dia <span className="font-bold text-primary">{new Date(clientAnamnesis.signed_at || clientAnamnesis.created_at).toLocaleString('pt-BR')}</span></p>
                    </div>
                  </div>
                )}
              </div>

              {/* Session History */}
              <div className="bg-card rounded-xl border shadow-sm p-6 text-foreground">
                <h3 className="text-lg font-semibold text-foreground mb-4">Histórico de Sessões</h3>
                <div className="space-y-3">
                  {loadingSessions ? (
                    <div className="p-4 text-center text-sm text-muted-foreground font-medium">Carregando sessões...</div>
                  ) : clientSessions.length > 0 ? (
                    clientSessions.map((session, i) => (
                      <div key={session.id || i} className="flex items-center justify-between p-4 rounded-xl bg-accent/20 transition-all hover:bg-accent/40 border border-transparent hover:border-accent/10">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Sessão</p>
                          <p className="text-xs text-muted-foreground font-medium">
                            {session.date?.includes('-') ? session.date.split('-').reverse().join('/') : session.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">R$ {Number(session.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <span className={`text-xs font-bold uppercase ${session.status === 'Concluído' ? 'text-success' :
                            session.status === 'Cancelado' ? 'text-destructive' :
                              session.status === 'Confirmado' ? 'text-purple-500' : 'text-primary'
                            }`}>{session.status === 'Pendente' ? 'Agendado' : (session.status || 'Agendado')}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground font-medium">Nenhuma sessão registrada.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl border shadow-sm p-12 text-center text-foreground h-[600px] flex flex-col items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-accent/30 mx-auto flex items-center justify-center mb-4">
                <User className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Selecione um cliente</h3>
              <p className="text-muted-foreground font-medium mt-2 max-w-xs mx-auto">
                Escolha um cliente na lista à esquerda para visualizar seu perfil completo e histórico.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Client Modal */}
      <Dialog open={isAddingClient} onOpenChange={setIsAddingClient}>
        <DialogContent className="sm:max-w-lg bg-card text-foreground border-border shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold">Novo Cliente</DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {/* Photo Upload Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="h-24 w-24 rounded-full bg-accent/50 flex items-center justify-center border-2 border-dashed border-accent/40 overflow-hidden relative">
                  {newClientData.avatar_url ? (
                    <img src={newClientData.avatar_url} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <Camera className="h-8 w-8 text-muted-foreground/50" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <div className="h-5 w-5 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
                    </div>
                  )}
                </div>
                <Label
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform"
                >
                  <Plus className="h-4 w-4" />
                </Label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </div>
              <p className="text-xs text-muted-foreground font-medium italic">Adicionar foto do cliente</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-bold">Nome Completo *</Label>
                <Input
                  id="name"
                  placeholder="Ex: João Silva"
                  value={newClientData.name}
                  onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                  className="bg-accent/20 border-accent/20 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-bold">Telefone (WhatsApp) *</Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={newClientData.phone}
                  onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                  className="bg-accent/20 border-accent/20 h-11"
                />
                <p className="text-xs text-muted-foreground">Usado para enviar a ficha de anamnese e lembretes da sessão.</p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-accent/10 gap-3">
            <Button variant="ghost" onClick={() => setIsAddingClient(false)} className="hover:bg-accent/20 font-bold">
              Cancelar
            </Button>
            <Button
              onClick={handleCreateClient}
              disabled={uploading || !newClientData.name}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-11 shadow-lg"
            >
              Criar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Modal */}
      <Dialog open={isEditingClient} onOpenChange={setIsEditingClient}>
        <DialogContent className="sm:max-w-lg bg-card text-foreground border-border shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold">Editar Cliente</DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-bold">Nome Completo *</Label>
                <Input
                  id="edit-name"
                  placeholder="Ex: João Silva"
                  value={editClientData.name}
                  onChange={(e) => setEditClientData({ ...editClientData, name: e.target.value })}
                  className="bg-accent/20 border-accent/20 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone" className="text-sm font-bold">Telefone</Label>
                <Input
                  id="edit-phone"
                  placeholder="(11) 99999-9999"
                  value={editClientData.phone}
                  onChange={(e) => setEditClientData({ ...editClientData, phone: e.target.value })}
                  className="bg-accent/20 border-accent/20 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-birth_date" className="text-sm font-bold">Data de Nascimento</Label>
                <Input
                  id="edit-birth_date"
                  type="date"
                  value={editClientData.birth_date}
                  onChange={(e) => setEditClientData({ ...editClientData, birth_date: e.target.value })}
                  className="bg-accent/20 border-accent/20 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-instagram" className="text-sm font-bold">Instagram</Label>
                <Input
                  id="edit-instagram"
                  placeholder="@usuario"
                  value={editClientData.instagram}
                  onChange={(e) => setEditClientData({ ...editClientData, instagram: e.target.value })}
                  className="bg-accent/20 border-accent/20 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-referrer" className="text-sm font-bold">Indicação</Label>
                <Select
                  value={editClientData.referred_by_id}
                  onValueChange={(val) => setEditClientData({ ...editClientData, referred_by_id: val })}
                >
                  <SelectTrigger className="bg-accent/20 border-accent/20 h-11">
                    <SelectValue placeholder="Busque um cliente..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card text-foreground">
                    <SelectItem value="none" className="font-medium italic">Ninguém (Novidade)</SelectItem>
                    {clients.filter(c => c.id !== editClientData.id).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-accent/10 gap-3">
            <Button variant="ghost" onClick={() => setIsEditingClient(false)} className="hover:bg-accent/20 font-bold">
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateClient}
              disabled={uploading || !editClientData.name}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-11 shadow-lg"
            >
              Cofirmar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Clients;
