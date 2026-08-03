import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, LogOut, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function Inactive() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        setChecking(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate("/auth", { replace: true });
                return;
            }

            const { data: adminProfile } = await supabase
                .from('nx_admin_users')
                .select('id')
                .eq('user_id', session.user.id)
                .single();

            if (adminProfile) {
                navigate("/dashboard", { replace: true });
                return;
            }

            const { data: subProfile } = await supabase
                .from('nx_subscriptions')
                .select('expires_at, status')
                .eq('user_id', session.user.id)
                .single();

            let hasExpired = false;
            if (subProfile?.expires_at) {
                const expirationDate = new Date(subProfile.expires_at);
                if (new Date() > expirationDate) {
                    hasExpired = true;
                }
            }

            if (subProfile && subProfile.status === 'active' && !hasExpired) {
                navigate("/dashboard", { replace: true });
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error("Erro ao verificar status:", error);
            setLoading(false);
        } finally {
            setChecking(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/auth", { replace: true });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-medium animate-pulse">Verificando status da conta...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-surface flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-destructive/10 rounded-full blur-[120px]" />

            <div className="w-full max-w-md z-10 animate-fade-in shadow-2xl">
                <Card className="border-border/50 bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl border text-center">
                    <CardHeader className="space-y-4 items-center pt-8">
                        <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
                            <Lock className="h-8 w-8 text-destructive" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-foreground">Acesso Bloqueado</CardTitle>
                        <CardDescription className="text-base">
                            Sua conta de tatuador encontra-se <strong className="text-destructive">inativa</strong> no momento.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-8">
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Para liberar o seu acesso ao Noxus Gestão e aproveitar todos os recursos do seu estúdio, é necessário realizar ou confirmar o pagamento do sistema (PIX).
                        </p>
                        <div className="bg-muted p-4 rounded-xl text-left border border-border/50">
                            <p className="text-xs font-semibold text-foreground mb-2">Próximos passos:</p>
                            <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1.5 ml-1">
                                <li>Realize o pagamento caso ainda não o tenha feito.</li>
                                <li>Envie o comprovante para o administrador no WhatsApp.</li>
                                <li>Aguarde a liberação do acesso à sua conta.</li>
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 pb-8">
                        <Button
                            className="w-full h-12 rounded-xl group"
                            onClick={checkStatus}
                            disabled={checking}
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${checking ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                            {checking ? 'Verificando...' : 'Já paguei, verificar acesso'}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-12 rounded-xl"
                            onClick={handleLogout}
                            disabled={checking}
                        >
                            <LogOut className="mr-2 h-4 w-4" /> Sair da conta
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
