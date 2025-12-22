import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import CRM from "@/pages/CRM";
import Clientes from "@/pages/Clientes";
import Caixa from "@/pages/Caixa";
import Relatorios from "@/pages/Relatorios";
import Install from "@/pages/Install";
import MapasMentais from "@/pages/MapasMentais";
import MindMapEditor from "@/pages/MindMapEditor";
import Auth from "@/pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AppProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/crm"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CRM />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Clientes />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/caixa"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Caixa />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/relatorios"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Relatorios />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/install"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Install />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mapas-mentais"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <MapasMentais />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mapas-mentais/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <MindMapEditor />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
