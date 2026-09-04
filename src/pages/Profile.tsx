import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Shield, Phone, Key, Copy, CheckCircle2 } from "lucide-react";

const Profile = () => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [fullName, setFullName] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [accessCode, setAccessCode] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [joinedDate, setJoinedDate] = useState("");

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setFetching(true);
            const token = localStorage.getItem("noxus_token");
            if (!token) return;

            const res = await fetch((import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api/me", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Falha ao carregar perfil");

            const data = await res.json();
            const user = data.user;

            if (user) {
                setFullName(user.name || "");
                setWhatsapp(user.whatsapp || "");
                setAccessCode(user.access_code || "NOXUS-USER");
                
                if (user.expires_at) {
                    const exp = new Date(user.expires_at);
                    setExpiresAt(exp.toLocaleDateString('pt-BR'));
                }

                if (user.createdAt) {
                    const createdAt = new Date(user.createdAt);
                    setJoinedDate(createdAt.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }));
                } else {
                    setJoinedDate("Recente");
                }
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setFetching(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("noxus_token");
            if (!token) {
                toast.error("Você precisa estar logado.");
                return;
            }

            const res = await fetch((import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api/me", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: fullName,
                    whatsapp: whatsapp
                })
            });

            if (!res.ok) throw new Error("Erro ao atualizar perfil");

            toast.success("Perfil atualizado com sucesso!");
            fetchProfile();
        } catch (error: any) {
            toast.error("Erro ao atualizar perfil: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyAccessCode = () => {
        if (accessCode) {
            navigator.clipboard.writeText(accessCode);
            toast.success("Chave de acesso copiada para a área de transferência!");
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-8 w-8 border-4 border-primary/30 border-t-primary animate-spin rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-16">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">Perfil</h1>
                    <p className="page-subtitle">Gerencie suas informações de conta e estúdio</p>
                </div>
                <Button
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = "/auth";
                  }}
                >
                  Sair da Conta
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Card: Avatar & Status */}
                <Card className="md:col-span-1 border-border/50 bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm border">
                    <CardHeader className="text-center">
                        <div className="mx-auto relative w-24 h-24 mb-4">
                            <Avatar className="w-24 h-24 border-4 border-background shadow-md">
                                <AvatarFallback className="text-2xl bg-primary text-primary-foreground font-bold">
                                    {fullName?.charAt(0) || "T"}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <CardTitle className="text-xl font-bold">{fullName || "Tatuador(a)"}</CardTitle>
                        <CardDescription>Membro desde {joinedDate}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            <Shield className="h-5 w-5 shrink-0" />
                            <div className="text-left">
                                <p className="text-sm font-semibold">Plano Noxus Pro</p>
                                <p className="text-xs opacity-90">
                                    {expiresAt ? `Válido até ${expiresAt}` : "Assinatura Ativa"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Card: Profile Info & Access Key */}
                <Card className="md:col-span-2 border-border/50 bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm border">
                    <CardHeader>
                        <CardTitle className="text-lg">Dados do Perfil</CardTitle>
                        <CardDescription>Atualize seu nome de trabalho e telefone</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="perf-name">Nome do Tatuador / Estúdio</Label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="perf-name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Seu nome ou nome do seu estúdio"
                                        className="pl-10 rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="perf-whatsapp">WhatsApp / Telefone</Label>
                                <div className="relative group">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="perf-whatsapp"
                                        value={whatsapp}
                                        onChange={(e) => setWhatsapp(e.target.value)}
                                        placeholder="(00) 00000-0000"
                                        className="pl-10 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleUpdateProfile}
                                disabled={loading}
                                className="rounded-xl px-6 font-semibold shadow-xs"
                            >
                                {loading ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                        </div>

                        {/* Security / Access Code Section */}
                        <div className="space-y-4 pt-6 border-t border-border/50">
                            <div>
                                <h3 className="text-md font-semibold text-foreground flex items-center gap-2">
                                    <Key className="h-4 w-4 text-primary" /> Chave de Acesso da Conta
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Esta é a sua chave exclusiva de acesso. Use-a para entrar no aplicativo em qualquer dispositivo.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3 bg-accent/30 p-4 rounded-xl border border-border/50">
                                <div className="flex-1 min-w-0">
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Sua Chave Mestra</span>
                                    <span className="font-mono text-xl font-bold tracking-wider text-foreground select-all">
                                        {accessCode}
                                    </span>
                                </div>
                                <Button
                                    onClick={handleCopyAccessCode}
                                    variant="outline"
                                    size="sm"
                                    className="w-full sm:w-auto h-9 font-semibold text-xs border-border/60"
                                >
                                    <Copy className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                    Copiar Chave
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Profile;
