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
import Saidas from "@/pages/Saidas";
import MindMapEditor from "@/pages/MindMapEditor";
import Servicos from "@/pages/Servicos";
import Produtos from "@/pages/Produtos";
import Orcamentos from "@/pages/Orcamentos";
import Planejamento from "@/pages/Planejamento";
import Projetos from "@/pages/Projetos";
import ProjetoDetalhe from "@/pages/ProjetoDetalhe";
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
                path="/saidas"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Saidas />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/servicos"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Servicos />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/produtos"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Produtos />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projetos"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Projetos />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projetos/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProjetoDetalhe />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projetos/:projectId/mapas-mentais/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <MindMapEditor />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orcamentos"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Orcamentos />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/faturamento"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Planejamento />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/planejamento"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Planejamento />
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
