import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Calendar, Users, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Agenda", path: "/agenda", icon: Calendar },
  { title: "Clientes", path: "/clientes", icon: Users },
  { title: "Financeiro", path: "/financeiro", icon: DollarSign },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-sidebar border-t border-sidebar-border safe-area-bottom">
      <div className="flex items-stretch h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-all duration-200 relative",
                isActive
                  ? "text-primary"
                  : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
              )}
            >
              {/* Active indicator line on top */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
              <item.icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive && "scale-110"
                )}
              />
              <span className={cn(isActive && "font-semibold")}>{item.title}</span>
            </NavLink>
          );
        })}
      </div>
      {/* Safe area spacer for iPhone home indicator */}
      <div className="h-safe-bottom bg-sidebar" />
    </nav>
  );
}
