import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Shield, Camera, Phone, Lock } from "lucide-react";

const Profile = () => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [joinedDate, setJoinedDate] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    // Security states
    const [newPassword, setNewPassword] = useState("");

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
                setEmail(user.email || "");
                setWhatsapp(user.whatsapp || "");
                
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
                    whatsapp: whatsapp,
                    email: email
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

    const handleUpdatePassword = async () => {
        if (!newPassword) {
            toast.error("Digite a nova senha.");
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem("noxus_token");
            if (!token) return;

            const res = await fetch((import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api/me", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ newPassword })
            });

            if (!res.ok) throw new Error("Erro ao atualizar senha");

            toast.success("Senha alterada com sucesso!");
            setNewPassword("");
        } catch (error: any) {
            toast.error("Erro ao atualizar senha: " + error.message);
        } finally {
            setLoading(false);
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
                <Card className="md:col-span-1 border-border/50 bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm border">
                    <CardHeader className="text-center">
                        <div className="mx-auto relative w-24 h-24 mb-4">
                            <Avatar className="w-24 h-24 border-4 border-background shadow-md">
                                <AvatarImage src={avatarUrl} />
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
                                <p className="text-xs opacity-90">Sua assinatura está ativa</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 border-border/50 bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm border">
                    <CardHeader>
                        <CardTitle className="text-lg">Dados do Perfil</CardTitle>
                        <CardDescription>Atualize suas informações de contato e conta</CardDescription>
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
                            <div className="space-y-2">
                                <Label htmlFor="perf-email">E-mail / Usuário</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="perf-email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 rounded-xl"
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
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
                                {loading ? "Salvando..." : "Atualizar Perfil"}
                            </Button>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border/50">
                            <h3 className="text-md font-semibold text-foreground flex items-center gap-2">
                                <Lock className="h-4 w-4 text-muted-foreground" /> Segurança da Conta
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-2 max-w-md">
                                    <Label htmlFor="new-pass">Nova Senha</Label>
                                    <Input
                                        id="new-pass"
                                        type="password"
                                        placeholder="Digite uma nova senha para sua conta"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button
                                variant="outline"
                                onClick={handleUpdatePassword}
                                disabled={loading}
                                className="rounded-xl px-6 font-semibold"
                            >
                                {loading ? "Atualizando..." : "Alterar Senha"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Profile;
