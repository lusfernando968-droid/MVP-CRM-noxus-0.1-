import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { MessageCircle, User, LogOut, X, Send, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Message {
  id: string;
  message: string;
  is_from_support: boolean;
  created_at: string;
  user_id: string;
}

type SheetView = "menu" | "chat";

export function MobileHeader() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<SheetView>("menu");
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Load user info
  useEffect(() => {
    const isDemoMode = localStorage.getItem("noxus_demo_mode") === "true";
    if (isDemoMode) {
      setUser({ name: "Modo Demo", email: "demo@noxus.app" });
      return;
    }
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          email: session.user.email,
          name: session.user.user_metadata?.full_name || "Usuário",
        });
        const { data: profile } = await supabase
          .from("users")
          .select("nome")
          .eq("id", session.user.id)
          .single();
        if (profile) setUser(prev => ({ ...prev, name: profile.nome || prev?.name }));
      }
    };
    fetchUser();
  }, []);

  // Subscribe to support messages for unread badge
  useEffect(() => {
    const subscription = supabase
      .channel("mobile_header_support")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "nx_support_messages" },
        (payload) => {
          const msg = payload.new as Message;
          if (!isOpenRef.current && msg.is_from_support) {
            setUnreadCount((prev) => prev + 1);
          }
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("nx_support_messages")
      .select("*")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: true });
    if (!error && data) setMessages(data);
    setLoading(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { setSending(false); return; }
    const { data, error } = await supabase
      .from("nx_support_messages")
      .insert({ user_id: authUser.id, message: newMessage.trim(), is_from_support: false })
      .select()
      .single();
    if (!error && data) {
      setMessages((prev) => prev.some((m) => m.id === data.id) ? prev : [...prev, data as Message]);
    }
    setNewMessage("");
    setSending(false);
  };

  const openSheet = (v: SheetView) => {
    setIsOpen(true);
    setView(v);
    if (v === "chat") {
      setUnreadCount(0);
      fetchMessages();
    }
  };

  const handleLogout = async () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/auth", { replace: true });
    try { await supabase.auth.signOut(); } catch (_) { }
    toast.success("Sessão encerrada");
  };

  const initials = user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <>
      {/* Header fixo no topo — apenas mobile */}
      <header className="fixed top-0 left-0 right-0 z-50 lg:hidden h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4">
        {/* Logo / título */}
        <div className="flex items-center gap-2">
          <img
            src="/logo-app-noxus.png"
            alt="Noxus"
            className="h-7 w-auto object-contain"
          />
        </div>

        {/* Botão perfil + badge de suporte */}
        <button
          onClick={() => openSheet("menu")}
          className="relative flex items-center justify-center h-9 w-9 rounded-full bg-sidebar-primary/20 text-sidebar-foreground hover:bg-sidebar-primary/40 transition-colors font-semibold text-sm"
        >
          {initials}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-sidebar">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sheet deslizante de cima */}
      <div
        className={cn(
          "fixed top-0 right-0 z-[70] h-full w-[85vw] max-w-sm bg-card flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header do sheet */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50">
          {view === "chat" ? (
            <button
              onClick={() => setView("menu")}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Voltar
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{user?.name || "Usuário"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Conteúdo — Menu */}
        {view === "menu" && (
          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => { setIsOpen(false); navigate("/perfil"); }}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-muted/60 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Meu Perfil</p>
                  <p className="text-xs text-muted-foreground">Edite seus dados</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => openSheet("chat")}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-muted/60 transition-colors text-left group relative"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Suporte Noxus</p>
                  <p className="text-xs text-muted-foreground">Fale com nossa equipe</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <span className="h-5 min-w-[20px] px-1 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            <div className="pt-2 border-t border-border/40 mt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-destructive/5 transition-colors text-left text-destructive"
              >
                <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <LogOut className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Sair</p>
                  <p className="text-xs opacity-70">Encerrar sessão</p>
                </div>
              </button>
            </div>
          </nav>
        )}

        {/* Conteúdo — Chat de Suporte */}
        {view === "chat" && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Status online */}
            <div className="px-5 py-3 bg-primary/5 border-b border-border/30 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground font-medium">Suporte online</span>
            </div>

            {/* Mensagens */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-40">
                  <MessageCircle className="h-10 w-10 mb-2" />
                  <p className="text-sm font-medium">Nenhuma mensagem ainda.</p>
                  <p className="text-xs px-6 leading-relaxed">Como podemos te ajudar com o Noxus hoje?</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[85%] animate-in fade-in",
                      msg.is_from_support ? "self-start items-start" : "self-end items-end ml-auto"
                    )}
                  >
                    <div className={cn(
                      "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                      msg.is_from_support
                        ? "bg-muted text-foreground rounded-tl-none border border-border/10"
                        : "bg-primary text-primary-foreground rounded-tr-none"
                    )}>
                      {msg.message}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={sendMessage}
              className="p-4 border-t border-border/50 flex items-center gap-2"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
              />
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl"
                disabled={!newMessage.trim() || sending}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
