import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pen, Mail, Lock, User, ArrowRight, MessageCircle, Phone, FlaskConical, Key } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

import { useToast } from "@/components/ui/use-toast";

const Auth = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showPixModal, setShowPixModal] = useState(false);

    useEffect(() => {
        const checkExistingSession = async () => {
            const token = localStorage.getItem("noxus_token");
            const userStr = localStorage.getItem("noxus_user");
            if (token && !showPixModal) {
                if (userStr) {
                    try {
                        const parsedUser = JSON.parse(userStr);
                        if (parsedUser.role === 'SUPERADMIN' || parsedUser.role === 'MASTER') {
                            navigate('/admin-dashboard');
                            return;
                        }
                    } catch (e) {}
                }
                navigate('/dashboard');
            }
        };
        checkExistingSession();
    }, [navigate]);

    // Login states
    const [loginAccessCode, setLoginAccessCode] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('noxus_login', {
                p_access_code: loginAccessCode
            });

            if (error) throw error;
            
            if (data && data.error) {
                throw new Error(data.error);
            }

            if (!data || !data.user) {
                throw new Error("Erro desconhecido ao realizar login.");
            }

            const user = data.user;

            // Salva o token (simulado) e user localmente
            localStorage.setItem("noxus_token", "supabase-direct-auth");
            localStorage.setItem("noxus_user", JSON.stringify(user));

            toast({
                title: "Bem-vindo de volta!",
                description: "Login realizado com sucesso.",
            });
            
            if (user.role === 'MASTER' || user.role === 'SUPERADMIN') {
                navigate("/admin-dashboard");
            } else {
                navigate("/dashboard");
            }
        } catch (error: any) {
            console.error("Login error details:", error);
            toast({
                variant: "destructive",
                title: "Erro no login",
                description: error.message || "Erro ao realizar login.",
            });
        } finally {
            setLoading(false);
        }
    };



    const closePixModalAndRedirect = () => {
        setShowPixModal(false);
        navigate("/dashboard");
    };

    return (
        <div className="min-h-screen w-full bg-surface flex items-center justify-center p-4 relative overflow-hidden">
            {/* Modal de Finalização do PIX */}
            <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
                <DialogContent className="sm:max-w-md bg-[#0a192f] border border-blue-900/50 shadow-2xl p-0 overflow-hidden">
                    <div className="bg-gradient-to-br from-primary/20 via-primary/5 to-transparent p-6 pb-8 border-b border-white/5">
                        <DialogHeader>
                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 border border-primary/30 shadow-lg shadow-primary/10">
                                <Lock className="w-6 h-6 text-primary" />
                            </div>
                            <DialogTitle className="text-2xl font-bold text-white tracking-tight">
                                Conta Criada com Sucesso!
                            </DialogTitle>
                            <DialogDescription className="text-gray-300 text-sm mt-2 leading-relaxed">
                                Você já faz parte do sistema Noxus. Para garantir segurança e exclusividade, a liberação total da sua conta é feita manualmente.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Como ativar minha conta?
                            </h3>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Trabalhamos com assinaturas via <strong>PIX</strong> direto com nosso time de atendimento. Basta nos chamar no WhatsApp, enviar o comprovante de ativação e sua conta é liberada na hora.
                            </p>
                        </div>

                        <DialogFooter className="flex-col gap-3">
                            <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/20"
                                onClick={() => window.open('https://api.whatsapp.com/send?phone=YOUR_PHONE_NUMBER&text=Ol%C3%A1!%20Acabei%20de%20me%20cadastrar%20no%20Noxus%20Gest%C3%A3o%20e%20gostaria%20de%20fazer%20o%20pagamento%20para%20ativar%20minha%20conta.', '_blank')}
                            >
                                <MessageCircle className="h-5 w-5" />
                                Chamar no WhatsApp para Liberar
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full h-12 rounded-xl text-gray-400 hover:text-white hover:bg-white/5"
                                onClick={closePixModalAndRedirect}
                            >
                                Acessar com restrições por enquanto
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />

            <div className="w-full max-w-md z-10 animate-fade-in shadow-2xl">
                <div className="flex flex-col items-center mb-8 select-none cursor-default">
                    <div className="flex h-16 w-auto items-center justify-center mb-4 overflow-hidden p-3 bg-[#0a192f] rounded-2xl border border-blue-900/50 shadow-xl shadow-blue-900/10">
                        <img src="/logo-app-noxus.png" alt="Noxus Logo" className="h-full w-auto object-contain" />
                    </div>
                    <p className="text-muted-foreground mt-2">Gestão inteligente para artistas</p>
                </div>

                <div className="w-full">
                    <div className="animate-in slide-in-from-left-4 duration-300">
                        <Card className="border-border/50 bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl border">
                            <CardHeader className="space-y-1">
                                <CardTitle className="text-2xl font-bold">Bem-vindo de volta</CardTitle>
                                <CardDescription>Acesse sua conta para gerenciar seu estúdio</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleLogin}>
                                <CardContent className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="accessCode" className="text-sm font-medium">Chave de Acesso</Label>
                                        <div className="relative group">
                                            <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                            <Input
                                                id="accessCode"
                                                type="text"
                                                placeholder="NOXUS-XXXX"
                                                value={loginAccessCode}
                                                onChange={(e) => setLoginAccessCode(e.target.value)}
                                                className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl py-6 uppercase font-mono tracking-wider"
                                                required
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Insira a chave fornecida pela administração.</p>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col pt-4">
                                    <Button className="w-full h-12 rounded-xl text-md font-semibold shadow-lg shadow-primary/20 relative overflow-hidden group" disabled={loading}>
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin rounded-full" />
                                                Entrando...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                Entrar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </span>
                                        )}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>
                </div>



                <p className="text-center text-xs text-muted-foreground mt-6 px-8 leading-relaxed">
                    Ao continuar, você concorda com nossos <button className="underline hover:text-primary transition-colors">Termos de Serviço</button> e <button className="underline hover:text-primary transition-colors">Política de Privacidade</button>.
                </p>
            </div>
        </div>
    );
};

export default Auth;
