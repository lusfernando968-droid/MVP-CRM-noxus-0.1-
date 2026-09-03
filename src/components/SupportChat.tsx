import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface Message {
    id: string;
    message: string;
    is_from_support: boolean;
    created_at: string;
    user_id: string;
}

export function SupportChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isOpenRef = useRef(isOpen);

    useEffect(() => {
        isOpenRef.current = isOpen;
        if (isOpen) {
            setUnreadCount(0);
        }
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

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
                        const newMsgs = data.slice(prev.length);
                        const hasNewFromSupport = newMsgs.some((m: Message) => m.is_from_support);
                        if (!isOpenRef.current && hasNewFromSupport) {
                            setUnreadCount(c => c + 1);
                        }
                    }
                    return data;
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

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        const token = localStorage.getItem("noxus_token");
        if (!token) return;

        try {
            const res = await fetch((import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api/support", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ message: newMessage.trim() })
            });

            if (res.ok) {
                const data = await res.json();
                setNewMessage("");
                setMessages(prev => [...prev, data]);
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
        setSending(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            {/* Tooltip/Label */}
            {!isOpen && unreadCount === 0 && (
                <div className="absolute right-full mr-4 bottom-2 px-3 py-1.5 bg-card border border-border/50 rounded-lg shadow-xl text-xs font-medium text-foreground whitespace-nowrap animate-in fade-in slide-in-from-right-2 duration-300 pointer-events-none">
                    Suporte Noxus
                </div>
            )}

            {/* Unread Notifier Tooltip */}
            {!isOpen && unreadCount > 0 && (
                <div className="absolute right-full mr-4 bottom-2 px-3 py-1.5 bg-primary border border-primary-foreground/20 rounded-lg shadow-xl shadow-primary/20 text-xs font-bold text-primary-foreground whitespace-nowrap animate-in fade-in slide-in-from-right-2 duration-300 pointer-events-none flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    {unreadCount} nova{unreadCount > 1 ? 's' : ''} mensagem!
                </div>
            )}

            {/* Main Button */}
            <div className="relative">
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 p-0",
                        isOpen ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90 scale-110 shadow-primary/20"
                    )}
                >
                    {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
                </Button>

                {/* Red Badge Indicator */}
                {!isOpen && unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-background animate-in zoom-in spin-in-12 duration-300 shadow-sm">
                        {unreadCount}
                    </div>
                )}
            </div>

            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-[350px] sm:w-96 h-[500px] flex flex-col bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in slide-in-from-bottom-5 duration-300 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 bg-primary text-primary-foreground flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs ring-2 ring-white/10">
                            N
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm leading-none">Suporte Noxus</h3>
                            <p className="text-[10px] opacity-70 mt-1 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                                Online agora
                            </p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-muted/5 font-sans"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-40">
                                <MessageCircle className="h-10 w-10 mb-2" />
                                <p className="text-sm font-medium">Nenhuma mensagem ainda.</p>
                                <p className="text-xs px-10 leading-relaxed">Olá! Como podemos te ajudar com o sistema Noxus hoje?</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2",
                                        msg.is_from_support ? "self-start items-start" : "self-end items-end ml-auto"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                                            msg.is_from_support
                                                ? "bg-muted text-foreground rounded-tl-none border border-border/10"
                                                : "bg-primary text-primary-foreground rounded-tr-none"
                                        )}
                                    >
                                        {msg.message}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Input */}
                    <form
                        onSubmit={sendMessage}
                        className="p-4 border-t border-border/50 bg-card flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
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

                    {/* Copyright */}
                    <div className="px-4 py-2 bg-muted/20 border-t border-border/5 text-center">
                        <span className="text-[9px] uppercase tracking-widest font-bold opacity-20">Noxus Solutions © 2026</span>
                    </div>
                </div>
            )}
        </div>
    );
}
