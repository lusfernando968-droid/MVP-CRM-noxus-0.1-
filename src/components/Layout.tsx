import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
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

    // ✅ MODO DEMO: Ignora autenticação para testes locais
    const isDemoMode = localStorage.getItem("noxus_demo_mode") === "true";
    if (isDemoMode) {
      if (mounted) setIsInitializing(false);
      return;
    }

    const checkSession = async () => {
      const token = localStorage.getItem("noxus_token");
      if (!token) {
        if (mounted) setIsInitializing(false);
        navigate("/auth", { replace: true });
        return;
      }
      
      // Temporário: Assume que se tem o token, está ativo para a migração inicial
      if (mounted) setIsInitializing(false);
    };

    checkSession();

    return () => {
      mounted = false;
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
      {/* Sidebar — apenas desktop */}
      <AppSidebar />

      {/* Header — apenas mobile */}
      <MobileHeader />

      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300 relative",
        // Desktop: margem para sidebar
        collapsed ? "lg:ml-[72px]" : "lg:ml-64",
        // Mobile: padding inferior para a bottom nav + superior para o header fixo
        "pb-20 pt-14 lg:pb-0 lg:pt-0"
      )}>
        <div className="page-container animate-fade-in">
          {children}
        </div>
        {/* SupportChat — apenas desktop */}
        <div className="hidden lg:block">
          <SupportChat />
        </div>
      </main>

      {/* Bottom Navigation — apenas mobile */}
      <BottomNav />
    </div>
  );
}
