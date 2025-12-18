import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallButton() {
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast({
        title: "MAXEASE instalado!",
        description: "O aplicativo foi instalado com sucesso.",
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
          setIsInstalled(true);
          setIsInstallable(false);
        }
      } catch (error) {
        console.log("PWA install prompt error:", error);
      } finally {
        setDeferredPrompt(null);
      }
      return;
    }

    toast({
      title: "Instalação não disponível aqui",
      description:
        "Para instalar: abra o link publicado (HTTPS) no Chrome ou Edge, depois clique no ícone de instalação na barra de endereços ou vá em Menu → Instalar aplicativo.",
      duration: 8000,
    });
  };

  const isDesktop = window.matchMedia?.("(pointer: fine)")?.matches ?? true;

  // No PC, mantém o botão visível para o usuário ter um ponto fixo de instalação.
  // Se o navegador não liberar instalação (beforeinstallprompt), o botão fica desabilitado.
  const shouldShowButton = !isInstalled && (isInstallable || isDesktop);
  if (!shouldShowButton) return null;

  return (
    <Button
      onClick={handleInstallClick}
      variant="outline"
      className={`fixed bottom-4 left-4 z-50 bg-background border-foreground/20 hover:bg-foreground hover:text-background transition-all duration-300 shadow-lg ${
        !isInstallable ? "opacity-60" : ""
      }`}
      title={
        isInstallable
          ? "Instalar MAXEASE"
          : "Abra o link publicado no Chrome/Edge para habilitar a instalação (ou veja instruções ao clicar)"
      }
    >
      <Download className="h-4 w-4 mr-2" />
      Instalar MAXEASE
    </Button>
  );
}

