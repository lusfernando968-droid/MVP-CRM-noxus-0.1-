import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Shield, Phone, Key, Copy, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
            const userStr = localStorage.getItem("noxus_user");
            if (!userStr) return;
            
            const currentUser = JSON.parse(userStr);

            // Fetch latest user details from supabase
            const { data: user, error: userErr } = await supabase
                .from('noxus_users')
                .select('*')
                .eq('id', currentUser.id)
                .single();

            if (userErr) throw userErr;

            if (user) {
                setFullName(user.name || "");
                setWhatsapp(user.whatsapp || "");

                // Fetch access code
                const { data: codeData } = await supabase
                    .from('noxus_access_codes')
                    .select('code')
                    .eq('usedById', currentUser.id)
                    .single();
                
                if (codeData) {
                    setAccessCode(codeData.code);
                } else if (currentUser.role === 'MASTER' || currentUser.role === 'SUPERADMIN') {
                    setAccessCode('SUA CHAVE MESTRA');
                } else {
                    setAccessCode('Não encontrada');
                }
                
                // Fetch subscription
                const { data: subData } = await supabase
                    .from('noxus_subscriptions')
                    .select('expiresAt')
                    .eq('userId', currentUser.id)
                    .single();

                if (subData && subData.expiresAt) {
                    const exp = new Date(subData.expiresAt);
                    setExpiresAt(exp.toLocaleDateString('pt-BR'));
                } else if (currentUser.role === 'MASTER') {
                    setExpiresAt("Vitalício");
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
            const userStr = localStorage.getItem("noxus_user");
            if (!userStr) {
                toast.error("Você precisa estar logado.");
                return;
            }
            const currentUser = JSON.parse(userStr);

            const { error } = await supabase
                .from('noxus_users')
                .update({ name: fullName, whatsapp: whatsapp })
                .eq('id', currentUser.id);

            if (error) throw error;

            toast.success("Perfil atualizado com sucesso!");
            
            // Update local storage user
            currentUser.name = fullName;
            currentUser.whatsapp = whatsapp;
            localStorage.setItem("noxus_user", JSON.stringify(currentUser));
            
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
            <div className="page-header">
                <div>
                    <h1 className="page-title">Perfil</h1>
                    <p className="page-subtitle">Gerencie suas informações de conta e estúdio</p>
                </div>
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
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Sua Chave de Acesso</span>
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
            <div className="flex justify-center pt-8 pb-10">
                <Button
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive/10 w-full sm:w-auto min-w-[200px]"
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = "/auth";
                  }}
                >
                  Sair da Conta
                </Button>
            </div>
        </div>
    );
};

export default Profile;
