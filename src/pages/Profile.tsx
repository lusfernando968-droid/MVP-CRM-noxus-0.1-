import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Shield, Camera } from "lucide-react";

const Profile = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [joinedDate, setJoinedDate] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    // Security states
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setFetching(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setEmail(user.email || "");
                const createdAt = new Date(user.created_at);
                setJoinedDate(createdAt.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }));

                const { data: profile, error } = await supabase
                    .from('nx_profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setFullName(profile.full_name || "");
                    setAvatarUrl(profile.avatar_url || "");
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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('nx_profiles')
                .update({
                    full_name: fullName,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            toast({
                title: "Sucesso",
                description: "Perfil atualizado com sucesso.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro ao atualizar",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!newPassword) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Digite uma nova senha.",
            });
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.auth.updateUser({ password: newPassword });

            if (error) throw error;

            toast({
                title: "Sucesso",
                description: "Senha atualizada com sucesso.",
            });
            setOldPassword("");
            setNewPassword("");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro ao atualizar senha",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setLoading(true);
            const file = event.target.files?.[0];
            if (!file) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id} -${Math.random()}.${fileExt} `;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('nx_profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setAvatarUrl(publicUrl);
            toast({
                title: "Sucesso",
                description: "Foto de perfil atualizada.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro no upload",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="h-8 w-8 border-4 border-primary/30 border-t-primary animate-spin rounded-full" />
                </div>
            </>
        );
    }

    return (
        <>
            <div className="page-header relative">
                <div>
                    <h1 className="page-title">Perfil</h1>
                    <p className="page-subtitle">Gerencie suas informações pessoais</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1 border-border/50 bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl border">
                    <CardHeader className="text-center">
                        <div className="mx-auto relative w-24 h-24 mb-4">
                            <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                    {fullName?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <label className="absolute bottom-0 right-0 rounded-full h-8 w-8 shadow-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center cursor-pointer transition-colors">
                                <Camera className="h-4 w-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={loading} />
                            </label>
                        </div>
                        <CardTitle>{fullName || "Usuário"}</CardTitle>
                        <CardDescription>Membro desde {joinedDate}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                            <Shield className="h-5 w-5 text-primary" />
                            <div className="text-left">
                                <p className="text-sm font-medium">Plano Pro</p>
                                <p className="text-xs text-muted-foreground">Sua assinatura está ativa</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 border-border/50 bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl border">
                    <CardHeader>
                        <CardTitle>Dados do Perfil</CardTitle>
                        <CardDescription>Atualize suas informações de contato e segurança</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="perf-name">Nome Completo</Label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="perf-name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="pl-10 rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="perf-email">E-mail</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="perf-email"
                                        value={email}
                                        disabled
                                        className="pl-10 rounded-xl bg-muted/50"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleUpdateProfile}
                                disabled={loading}
                                className="rounded-xl px-8 shadow-lg shadow-primary/20"
                            >
                                {loading ? "Salvando..." : "Atualizar Perfil"}
                            </Button>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border/50">
                            <h3 className="text-lg font-semibold text-foreground">Segurança</h3>
                            <div className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="old-pass">Senha Atual (opcional para check)</Label>
                                        <Input
                                            id="old-pass"
                                            type="password"
                                            placeholder="••••••••"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-pass">Nova Senha</Label>
                                        <Input
                                            id="new-pass"
                                            type="password"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                variant="outline"
                                onClick={handleUpdatePassword}
                                disabled={loading}
                                className="rounded-xl px-8"
                            >
                                {loading ? "Atualizando..." : "Alterar Senha"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default Profile;
