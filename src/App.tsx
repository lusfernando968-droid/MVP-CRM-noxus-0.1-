import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import Index from "./pages/Index";
import Agenda from "./pages/Agenda";
import Clients from "./pages/Clients";
import Financial from "./pages/Financial";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import { SupportAdmin } from "./pages/SupportAdmin";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";
import AnamnesisForm from "./pages/AnamnesisForm";
import SuperAdmin from "./pages/SuperAdmin";
import Inactive from "./pages/Inactive";
import Landing from "./pages/Landing";
import { DevDashboard } from "./pages/DevDashboard";
import { Layout } from "@/components/Layout";
import { Outlet } from "react-router-dom";

import MasterAdmin from "./pages/MasterAdmin";

// Authenticated layout wrapper
const AuthLayout = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SidebarProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/inativo" element={<Inactive />} />
            <Route path="/anamnese/:clientId" element={<AnamnesisForm />} />
            <Route path="/master" element={<MasterAdmin />} />

            {/* Authenticated Routes with Persistent Layout */}
            <Route element={<AuthLayout />}>
              <Route path="/dashboard" element={<Index />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/clientes" element={<Clients />} />
              <Route path="/financeiro" element={<Financial />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/suporte-admin" element={<SupportAdmin />} />
              <Route path="/dev-dashboard" element={<DevDashboard />} />
              <Route path="/usuarios" element={<Users />} />
              <Route path="/admin-noxus" element={<SuperAdmin />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
