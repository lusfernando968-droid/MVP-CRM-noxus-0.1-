import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  Image,
  Menu,
  MessageSquare,
  X,
  LogOut,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";


export function AppSidebar() {
  const { open, setOpen, openMobile, setOpenMobile } = useSidebar();
  const collapsed = !open;
  const setCollapsed = (value: boolean) => setOpen(!value);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("Buscando sessão inicial...");
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user;

        if (currentUser) {
          console.log("Usuário logado:", currentUser.email);
          setUser({
            email: currentUser.email,
            name: currentUser.user_metadata?.full_name || "Usuário",
          });

          // Buscar perfil de forma assíncrona sem travar a UI básica
          supabase
            .from('users')
            .select('nome, role')
            .eq('id', currentUser.id)
            .single()
            .then(({ data: profile, error: profileError }) => {
              if (profile && !profileError) {
                console.log("Perfil carregado com sucesso");
                setUser(prev => ({
                  ...prev,
                  name: profile.nome || prev?.name || "Usuário"
                }));
                setRole(profile.role);
              }
            });
        } else {
          console.log("Nenhuma sessão encontrada no carregamento inicial");
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email,
          name: session.user.user_metadata?.full_name || "Usuário",
        });

        const { data: profile } = await supabase
          .from('users')
          .select('nome, role')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUser({
            email: session.user.email,
            name: profile.nome || session.user.user_metadata?.full_name || "Usuário",
          });
          setRole(profile.role);
        }
      } else {
        setUser(null);
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const navItems = role === 'ADMIN'
    ? [
      { title: "Usuários", path: "/usuarios", icon: Users },
      { title: "Suporte Interno", path: "/suporte-admin", icon: MessageSquare },
      { title: "Vendas Noxus", path: "/dev-dashboard", icon: DollarSign },
    ]
    : [
      { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { title: "Agenda", path: "/agenda", icon: Calendar },
      { title: "Clientes", path: "/clientes", icon: Users },
      { title: "Financeiro", path: "/financeiro", icon: DollarSign },
    ];

  const handleLogout = async () => {
    const loadingToast = toast.loading("Saindo...");
    console.log("Iniciando logout otimista...");

    // Flag para garantir disparar a navegação apenas uma vez
    let navigated = false;
    const forceNavigate = () => {
      if (!navigated) {
        navigated = true;
        console.log("Forçando navegação para /auth");
        toast.dismiss(loadingToast);
        localStorage.clear();
        sessionStorage.clear();
        navigate("/auth", { replace: true });
      }
    };

    // Timeout de segurança: se o Supabase não responder em 3s, sai de qualquer jeito
    const logoutTimeout = setTimeout(() => {
      console.warn("Timeout no signOut do Supabase. Forçando saída.");
      toast.error("Servidor demorou a responder, saindo localmente...");
      forceNavigate();
    }, 3000);

    try {
      // Tentar avisar o servidor, mas não deixar isso travar o usuário para sempre
      await supabase.auth.signOut();
      clearTimeout(logoutTimeout);
      console.log("Logout confirmado pelo Supabase");
      toast.success("Sessão encerrada");
      forceNavigate();
    } catch (error) {
      console.error("Erro durante signOut:", error);
      clearTimeout(logoutTimeout);
      forceNavigate();
    }
  };

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setOpenMobile(true)}
        className="fixed top-4 left-4 z-50 lg:hidden rounded-lg bg-sidebar p-2 text-sidebar-foreground shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {openMobile && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setOpenMobile(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "w-[72px]" : "w-64",
          openMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Subtle Background Detail */}
        {!openMobile && (
          <div
            className="absolute inset-x-0 top-48 bottom-20 pointer-events-none opacity-[0.35] overflow-hidden"
            style={{
              backgroundImage: 'url(/sidebar-bg.png)',
              backgroundSize: '400px',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat',
              maskImage: 'linear-gradient(to bottom, transparent, black 25%, black 85%, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 25%, black 85%, transparent)',
            }}
          />
        )}
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <div className="flex items-center select-none cursor-default h-full py-2 overflow-hidden">
            <img
              src="/logo-app-noxus.png"
              alt="Noxus Logo"
              className={cn(
                "h-8 object-left transition-all duration-300",
                collapsed ? "w-8 object-cover" : "w-auto object-contain"
              )}
            />
          </div>
          <button
            onClick={() => {
              setOpenMobile(false);
              setCollapsed(!collapsed);
            }}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-300 group"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            ) : (
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            )}
          </button>
          <button
            onClick={() => setOpenMobile(false)}
            className="lg:hidden h-7 w-7 flex items-center justify-center rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setOpenMobile(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-primary-foreground shadow-md shadow-sidebar-primary/30"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-3 w-full p-2 rounded-xl transition-all duration-300 outline-none group text-left",
                location.pathname === "/perfil" ? "bg-primary/20" : "hover:bg-sidebar-accent"
              )}>
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                  location.pathname === "/perfil" ? "bg-primary text-primary-foreground" : "bg-sidebar-primary/20 text-sidebar-foreground group-hover:bg-sidebar-primary group-hover:text-primary-foreground"
                )}>
                  {user?.name?.charAt(0) || "U"}
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {user?.name || "Carregando..."}
                    </p>
                    <p className="text-xs text-sidebar-foreground/50 truncate">
                      {user?.email || "Seu e-mail aparecerá aqui"}
                    </p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-4 rounded-xl border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl" align="start">
              <DropdownMenuLabel className="font-normal p-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || "Usuário"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="opacity-50" />
              <DropdownMenuItem
                onSelect={() => navigate("/perfil")}
                className="p-3 cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg mx-1"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Acessar Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={handleLogout}
                className="p-3 cursor-pointer focus:bg-destructive/10 focus:text-destructive rounded-lg mx-1 text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
