import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ErrorBoundary } from "react-error-boundary";
import {
    Search,
    MessageSquare,
    Send,
    User as UserIcon,
    ChevronRight,
    Loader2,
    Phone,
    Mail,
    MoreVertical,
    AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const safeFormatDate = (dateString: string, formatStr: string, options?: any) => {
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return "Data inválida";
        return format(d, formatStr, options);
    } catch (e) {
        return "Erro na data";
    }
};

interface ChatUser {
    id: string;
    nome: string;
    email: string;
    last_message?: string;
    last_message_at?: string;
    unread_count?: number;
}

interface Message {
    id: string;
    user_id: string;
    message: string;
    is_from_support: boolean;
    created_at: string;
}

export function SupportAdmin() {
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchUsers();

        // Subscribe to new messages globally for the list
        const channel = supabase
            .channel('support_admin_global')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'nx_support_messages' },
                () => fetchUsers()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser.id);

            const channel = supabase
                .channel(`support_chat_${selectedUser.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'nx_support_messages',
                        filter: `user_id=eq.${selectedUser.id}`
                    },
                    (payload) => {
                        const msg = payload.new as Message;
                        setMessages((prev) => {
                            if (prev.some(m => m.id === msg.id)) return prev;
                            return [...prev, msg];
                        });
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [selectedUser]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchUsers = async () => {
        try {
            // 1. Get all unique user IDs who sent messages
            const { data: messageData, error: messageError } = await supabase
                .from('nx_support_messages')
                .select('user_id, message, created_at')
                .order('created_at', { ascending: false });

            if (messageError) throw messageError;

            const userIds = Array.from(new Set(messageData.map(m => m.user_id)));

            if (userIds.length === 0) {
                setUsers([]);
                setLoading(false);
                return;
            }

            // 2. Get user details from users table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, nome, email')
                .in('id', userIds);

            if (userError) throw userError;

            // 3. Combine
            const chatUsers: ChatUser[] = userData.map(u => {
                const lastMsg = messageData.find(m => m.user_id === u.id);
                return {
                    id: u.id,
                    nome: u.nome || "Usuário",
                    email: u.email || "",
                    last_message: lastMsg?.message,
                    last_message_at: lastMsg?.created_at
                };
            });

            setUsers(chatUsers);
        } catch (error) {
            console.error("Error fetching chat users:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (userId: string) => {
        try {
            setLoadingMessages(true);
            const { data, error } = await supabase
                .from('nx_support_messages')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error("Error fetching messages via Supabase:", error);
            } else if (data) {
                setMessages(data);
            }
        } catch (err) {
            console.error("Critical error in fetchMessages:", err);
        } finally {
            setLoadingMessages(false);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser || sending) return;

        setSending(true);
        const { data, error } = await supabase
            .from('nx_support_messages')
            .insert({
                user_id: selectedUser.id,
                message: newMessage.trim(),
                is_from_support: true
            })
            .select()
            .single();

        if (error) {
            console.error("Error sending response:", error);
        } else {
            setNewMessage("");
            if (data) {
                setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data as Message]);
            }
        }
        setSending(false);
    };

    const filteredUsers = users.filter(u =>
        u.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <ErrorBoundary fallbackRender={({ error }: { error: any }) => (
            <>
                <div className="p-8 h-full flex flex-col items-center justify-center text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                    <h2 className="text-xl font-bold mb-2">Ops! Ocorreu um erro na tela.</h2>
                    <p className="text-sm text-muted-foreground mb-4">Um problema inesperado quebrou essa interface.</p>
                    <div className="bg-muted p-4 rounded-xl text-left overflow-auto max-w-2xl w-full text-xs text-red-400 font-mono">
                        {error?.message}
                        <br /><br />
                        {error?.stack?.split('\n').slice(0, 5).join('\n')}
                    </div>
                </div>
            </>
        )}>
            <>
                <div className="flex flex-col lg:flex-row h-[calc(100vh-2rem)] gap-4 p-4 lg:p-6 animate-fade-in max-w-[1600px] mx-auto overflow-hidden">
                    {/* Lista de Usuários */}
                    <div className="w-80 flex flex-col bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-border/50 bg-muted/30">
                            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Suporte
                            </h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar usuário..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 bg-background/50 border-border/30 focus-visible:ring-primary/30"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-2">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    <span className="text-xs text-muted-foreground">Carregando conversas...</span>
                                </div>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => setSelectedUser(user)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-4 border-b border-border/30 transition-all hover:bg-muted/50 text-left relative group",
                                            selectedUser?.id === user.id ? "bg-primary/5 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                                        )}
                                    >
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                            {user.nome.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                                                    {user.nome}
                                                </p>
                                                {user.last_message_at && (
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                        {safeFormatDate(user.last_message_at, "HH:mm")}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate italic">
                                                {user.last_message || "Nenhuma mensagem"}
                                            </p>
                                        </div>
                                        {selectedUser?.id !== user.id && <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/50" />}
                                    </button>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 p-8 text-center">
                                    <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                        <Search className="h-8 w-8 text-muted-foreground/30" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">Nenhum chamado encontrado</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Área de Chat */}
                    <div className="flex-1 flex flex-col bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm relative">
                        {selectedUser ? (
                            <>
                                {/* Header do Chat */}
                                <div className="p-4 border-b border-border/50 bg-muted/30 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                            {selectedUser.nome.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold leading-none">{selectedUser.nome}</h3>
                                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                                <Mail className="h-3 w-3" /> {selectedUser.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-muted-foreground hover:text-primary">
                                            <Phone className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-muted-foreground hover:text-primary">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Mensagens */}
                                <div
                                    ref={scrollRef}
                                    className="flex-1 overflow-y-auto p-6 space-y-4 bg-dots-grid custom-scrollbar"
                                >
                                    {loadingMessages ? (
                                        <div className="flex items-center justify-center h-full">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                                        </div>
                                    ) : messages.length > 0 ? (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={cn(
                                                    "flex flex-col max-w-[80%] group",
                                                    msg.is_from_support ? "ml-auto items-end" : "mr-auto items-start"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2",
                                                        msg.is_from_support
                                                            ? "bg-primary text-primary-foreground rounded-tr-none hover:bg-primary/90"
                                                            : "bg-muted text-foreground rounded-tl-none hover:bg-muted/80"
                                                    )}
                                                >
                                                    {msg.message}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {safeFormatDate(msg.created_at, "HH:mm", { locale: ptBR })}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center p-12">
                                            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                                <MessageSquare className="h-6 w-6 text-muted-foreground/30" />
                                            </div>
                                            <p className="text-sm text-muted-foreground">Inicie uma conversa com {selectedUser.nome.split(' ')[0]}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Input */}
                                <form
                                    onSubmit={sendMessage}
                                    className="p-4 bg-muted/30 border-t border-border/50"
                                >
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Escreva sua resposta..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            className="flex-1 bg-background border-border/30 focus-visible:ring-primary/30"
                                        />
                                        <Button
                                            type="submit"
                                            disabled={!newMessage.trim() || sending}
                                            className="rounded-xl px-6 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
                                        >
                                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-dots-grid">
                                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
                                    <MessageSquare className="h-10 w-10 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Central de Suporte</h3>
                                <p className="text-sm text-muted-foreground max-w-sm">
                                    Selecione uma conversa ao lado para visualizar o histórico e responder aos usuários.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </>
        </ErrorBoundary>
    );
}
