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

  const [role, setRole] = useState<string | null>(null);

  // Load user info
  useEffect(() => {
    const loadUser = () => {
      try {
        const userStr = localStorage.getItem("noxus_user");
        if (userStr) {
          const parsedUser = JSON.parse(userStr);
          setUser({ email: parsedUser.email, name: parsedUser.name });
          setRole(parsedUser.role);
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    };
    loadUser();
  }, []);

  // Polling for support messages
  const fetchMessages = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    const userStr = localStorage.getItem("noxus_user");
    if (!userStr) return;
    
    try {
      const parsedUser = JSON.parse(userStr);
      const { data, error } = await supabase
        .from('noxus_support_messages')
        .select('*')
        .eq('userId', parsedUser.id)
        .order('createdAt', { ascending: true });

      if (error) throw error;
      
      if (data) {
        const formattedData = data.map((msg: any) => ({
          id: msg.id,
          message: msg.message,
          is_from_support: msg.is_from_support,
          created_at: msg.createdAt,
          user_id: msg.userId
        }));
        setMessages(prev => {
          if (formattedData.length > prev.length) {
            const newMsgs = formattedData.slice(prev.length);
            const hasNewFromSupport = newMsgs.some((m: Message) => m.is_from_support);
            if (!isOpenRef.current && hasNewFromSupport) {
              setUnreadCount(c => c + 1);
            }
          }
          return formattedData;
        });
      }
    } catch (e) {
      console.error(e);
    }
    if (isInitial) setLoading(false);
  };

  useEffect(() => {
    fetchMessages(true);
    const intervalId = setInterval(() => {
      fetchMessages(false);
    }, 3000);
    return () => clearInterval(intervalId);
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);

    const userStr = localStorage.getItem("noxus_user");
    if (!userStr) { setSending(false); return; }

    try {
      const parsedUser = JSON.parse(userStr);
      const { data, error } = await supabase
        .from('noxus_support_messages')
        .insert({
          message: newMessage.trim(),
          userId: parsedUser.id,
          is_from_support: false
        })
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        const formattedData = {
          id: data.id,
          message: data.message,
          is_from_support: data.is_from_support,
          created_at: data.createdAt,
          user_id: data.userId
        };
        setMessages((prev) => [...prev, formattedData]);
        setNewMessage("");
      }
    } catch (error) {
      console.error(error);
    }
    setSending(false);
  };

  const openSheet = () => {
    setIsOpen(true);
    setUnreadCount(0);
    fetchMessages();
  };

  return (
    <>
      {/* Header fixo no topo — apenas mobile */}
      <header className="fixed top-0 left-0 right-0 z-50 lg:hidden h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 pt-safe-top">
        <div className="flex items-center gap-2">
          <img
            src="/logo-app-noxus.png"
            alt="Noxus"
            className="h-7 w-auto object-contain"
          />
        </div>

        <button
          onClick={openSheet}
          className="relative flex items-center justify-center h-9 w-9 rounded-full bg-sidebar-primary/20 text-sidebar-foreground hover:bg-sidebar-primary/40 transition-colors"
        >
          <MessageCircle className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-sidebar">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </header>

      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed top-0 right-0 z-[70] h-full w-[85vw] max-w-sm bg-card flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Central de Suporte
            </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Conteúdo — Chat */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30" ref={scrollRef}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-3 opacity-50">
                <MessageCircle className="h-10 w-10" />
                <p className="text-sm text-center">Nenhuma mensagem ainda.<br />Como podemos ajudar?</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-sm",
                    msg.is_from_support
                      ? "bg-card border border-border/50 self-start text-foreground rounded-tl-sm"
                      : "bg-primary text-primary-foreground self-end rounded-tr-sm"
                  )}
                >
                  <p className="leading-relaxed">{msg.message}</p>
                  <span className={cn(
                    "text-[10px] mt-1 text-right opacity-70",
                    msg.is_from_support ? "text-muted-foreground" : "text-primary-foreground"
                  )}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {(role === 'MASTER' || role === 'SUPERADMIN') && (
              <>
                <button
                  onClick={() => { setIsOpen(false); navigate("/admin-noxus"); }}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-muted/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Gestão de Clientes</p>
                      <p className="text-xs text-muted-foreground">Admin Noxus</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => { setIsOpen(false); navigate("/admin-dashboard"); }}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-muted/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Dashboard Admin</p>
                      <p className="text-xs text-muted-foreground">Métricas Geriais</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </button>
              </>
            )}

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
