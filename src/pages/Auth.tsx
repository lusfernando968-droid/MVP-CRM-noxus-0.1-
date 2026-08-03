import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pen, Mail, Lock, User, ArrowRight, MessageCircle, Phone, FlaskConical, Key } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

const Auth = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showPixModal, setShowPixModal] = useState(false);

    useEffect(() => {
        const checkExistingSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            // Evitamos redirecionar se o modal PIX precisa aparecer pra quem acabou de se registrar
            if (session && !showPixModal) {
                navigate("/dashboard", { replace: true });
            }
        };
        checkExistingSession();
    }, [navigate, showPixModal]);

    // Login states
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // Register states
    const [regName, setRegName] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [regWhatsapp, setRegWhatsapp] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regAccessCode, setRegAccessCode] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isSupabaseConfigured) {
            toast({ variant: "destructive", title: "Erro Crítico", description: "O Banco de Dados não está conectado." });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: loginPassword,
            });

            if (error) throw error;

            toast({
                title: "Bem-vindo de volta!",
                description: "Login realizado com sucesso.",
            });
            navigate("/dashboard");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro no login",
                description: error.message || "Verifique suas credenciais.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isSupabaseConfigured) {
            toast({ variant: "destructive", title: "Erro Crítico", description: "O Banco de Dados não está conectado." });
            return;
        }

        if (!regAccessCode) {
            toast({ variant: "destructive", title: "Acesso Negado", description: "Um Código de Acesso é obrigatório." });
            return;
        }

        setLoading(true);
        try {
            // Verifica o código ANTES de criar a conta
            const { data: codeData, error: codeError } = await supabase
                .from('nx_access_codes')
                .select('*')
                .eq('code', regAccessCode)
                .eq('status', 'available')
                .single();

            if (codeError || !codeData) {
                throw new Error("Código de Acesso inválido ou já utilizado.");
            }

            const { data, error } = await supabase.auth.signUp({
                email: regEmail,
                password: regPassword,
                options: {
                    data: {
                        full_name: regName,
                        whatsapp: regWhatsapp,
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                // Marca o código como usado
                await supabase
                    .from('nx_access_codes')
                    .update({ status: 'used', used_by: data.user.id })
                    .eq('id', codeData.id);
                
                // Cria a assinatura de 30 dias
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + 30);
                await supabase
                    .from('nx_subscriptions')
                    .insert({ user_id: data.user.id, expires_at: expiry.toISOString() });
            }

            toast({
                title: "Conta criada com sucesso!",
                description: "Seja bem-vindo(a) ao Noxus.",
            });

            if (data.session || data.user) {
                setShowPixModal(true);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro no cadastro",
                description: error.message || "Tente novamente mais tarde.",
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
                <DialogContent className="sm:max-w-md bg-card/60 backdrop-blur-2xl border-white/10 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            🎉 Quase lá!
                        </DialogTitle>
                        <DialogDescription className="text-base pt-2">
                            Sua conta foi criada, mas o acesso completo ao Noxus Gestão é restrito. <br /><br />
                            O pagamento é realizado via <strong>PIX</strong> diretamente com nossa equipe. Para liberar sua conta de Tatuador agora mesmo, nos chame no WhatsApp e envie o comprovante!
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:justify-start gap-2 mt-4">
                        <Button
                            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center gap-2 h-12 rounded-xl text-md font-bold"
                            onClick={() => window.open('https://api.whatsapp.com/send?phone=YOUR_PHONE_NUMBER&text=Ol%C3%A1!%20Acabei%20de%20me%20cadastrar%20no%20Noxus%20Gest%C3%A3o%20e%20gostaria%20de%20fazer%20o%20pagamento%20para%20ativar%20minha%20conta.', '_blank')}
                        >
                            <MessageCircle className="h-5 w-5" />
                            Falar no WhatsApp
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            className="w-full"
                            onClick={closePixModalAndRedirect}
                        >
                            Entendi, fecharei por agora
                        </Button>
                    </DialogFooter>
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

                <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-muted/50 rounded-xl">
                        <TabsTrigger value="login" className="rounded-lg py-2.5">Login</TabsTrigger>
                        <TabsTrigger value="register" className="rounded-lg py-2.5">Cadastro</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="animate-in slide-in-from-left-4 duration-300">
                        <Card className="border-border/50 bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl border">
                            <CardHeader className="space-y-1">
                                <CardTitle className="text-2xl font-bold">Bem-vindo de volta</CardTitle>
                                <CardDescription>Acesse sua conta para gerenciar seu estúdio</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleLogin}>
                                <CardContent className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="seu@email.com"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl py-6"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password">Senha</Label>
                                            <button type="button" className="text-xs text-primary hover:underline font-medium">Esqueceu a senha?</button>
                                        </div>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                            <Input
                                                id="password"
                                                type="password"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl py-6"
                                                required
                                            />
                                        </div>
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
                    </TabsContent>

                    <TabsContent value="register" className="animate-in slide-in-from-right-4 duration-300">
                        <Card className="border-border/50 bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl border">
                            <CardHeader className="space-y-1">
                                <CardTitle className="text-2xl font-bold">Criar conta</CardTitle>
                                <CardDescription>Junte-se ao Noxus e organize seu trabalho</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleRegister}>
                                <CardContent className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nome Completo</Label>
                                        <div className="relative group">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                            <Input
                                                id="name"
                                                placeholder="Como devemos te chamar?"
                                                value={regName}
                                                onChange={(e) => setRegName(e.target.value)}
                                                className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl py-6"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-email">E-mail Profissional</Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                            <Input
                                                id="reg-email"
                                                type="email"
                                                placeholder="contato@estudio.com"
                                                value={regEmail}
                                                onChange={(e) => setRegEmail(e.target.value)}
                                                className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl py-6"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-whatsapp">WhatsApp</Label>
                                        <div className="relative group">
                                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                            <Input
                                                id="reg-whatsapp"
                                                type="tel"
                                                placeholder="(11) 99999-9999"
                                                value={regWhatsapp}
                                                onChange={(e) => setRegWhatsapp(e.target.value)}
                                                className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl py-6"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-password">Senha segura</Label>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                            <Input
                                                id="reg-password"
                                                type="password"
                                                value={regPassword}
                                                onChange={(e) => setRegPassword(e.target.value)}
                                                className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl py-6"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-access-code" className="text-primary font-bold">Código de Acesso VIP</Label>
                                        <div className="relative group">
                                            <Key className="absolute left-3 top-3 h-4 w-4 text-primary transition-colors group-focus-within:text-primary" />
                                            <Input
                                                id="reg-access-code"
                                                type="text"
                                                placeholder="NOXUS-XXXX"
                                                value={regAccessCode}
                                                onChange={(e) => setRegAccessCode(e.target.value)}
                                                className="pl-10 bg-primary/5 border-primary/30 focus:border-primary transition-all rounded-xl py-6 uppercase font-mono tracking-wider"
                                                required
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Fornecido pelo administrador do sistema.</p>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col pt-4">
                                    <Button className="w-full h-12 rounded-xl text-md font-semibold shadow-lg shadow-primary/20 relative overflow-hidden group" disabled={loading}>
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin rounded-full" />
                                                Criando...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                Começar agora <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </span>
                                        )}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Botão de Modo Demo */}
                <div className="mt-6 border-t border-border/30 pt-6">
                    <button
                        onClick={() => {
                            localStorage.setItem("noxus_demo_mode", "true");
                            navigate("/dashboard");
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/80 transition-all duration-200 text-sm font-medium group"
                    >
                        <FlaskConical className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                        Entrar no Modo Demo (sem login)
                    </button>
                    <p className="text-center text-xs text-muted-foreground mt-2">
                        Apenas para testes locais. Dados não são salvos na nuvem.
                    </p>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-6 px-8 leading-relaxed">
                    Ao continuar, você concorda com nossos <button className="underline hover:text-primary transition-colors">Termos de Serviço</button> e <button className="underline hover:text-primary transition-colors">Política de Privacidade</button>.
                </p>
            </div>
        </div>
    );
};

export default Auth;
