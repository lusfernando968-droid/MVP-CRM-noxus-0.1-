import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { SupportChat } from "@/components/SupportChat";
import { Loader2 } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { open } = useSidebar();
  const collapsed = !open;
  const navigate = useNavigate();
  const location = useLocation();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async (session: any) => {
      if (!session) {
        if (mounted) setIsInitializing(false); // <= CRÍTICO: Libera o lock visual da tela
        // Sem sessão: manda para login (independente da rota)
        navigate("/auth", { replace: true });
        return;
      }

      // Tem sessão: verifica se usuário está ativo
      try {
        const { data: profile, error } = await supabase
          .from('users')
          .select('is_active, subscription_ends_at, role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error("Layout Session Check Error:", error);
          if (mounted) setIsInitializing(false);
          return;
        }

        if (!mounted) return;

        let hasExpired = false;
        if (profile?.subscription_ends_at && profile.role !== 'ADMIN') {
          const expirationDate = new Date(profile.subscription_ends_at);
          if (new Date() > expirationDate) {
            hasExpired = true;
          }
        }

        if (profile && (profile.is_active === false || hasExpired)) {
          if (mounted) setIsInitializing(false);
          // Podemos passar um state pro Inactive.tsx saber se foi bloqueado ou expirado depois, mas manda pra mesma tela de "Inativo" por hora.
          navigate("/inativo", { replace: true });
        } else {
          if (mounted) setIsInitializing(false);
        }
      } catch (err) {
        // Em caso de erro estrutural na query, libera a tela mesmo assim
        console.error("Layout catch err:", err);
        if (mounted) setIsInitializing(false);
      }
    };

    // 1. Check initial session right away
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Auth getSession Error:", error);
      }
      if (mounted) {
        checkSession(session);
      }
    });

    // 2. Listen to future auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Layout auth event:", event, session ? "COM sessão" : "SEM sessão");
      if (mounted) {
        checkSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (isInitializing && location.pathname !== "/auth") {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Autenticando sessão...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex w-full">
      <AppSidebar />
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300 relative",
        collapsed ? "lg:ml-[72px]" : "lg:ml-64"
      )}>
        <div className="page-container animate-fade-in">
          {children}
        </div>
        <SupportChat />
      </main>
    </div>
  );
}
