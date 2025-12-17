import { Monitor, Apple, Chrome } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Install() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Instalar MAXEASE</h1>
        <p className="text-muted-foreground mt-1">
          Siga as instruções abaixo para instalar o MAXEASE como aplicativo no seu dispositivo.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Windows / Chrome */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Windows (Chrome/Edge)</CardTitle>
                <CardDescription>Instalação via navegador</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>
                Abra o <strong>link publicado</strong> do MAXEASE no <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong>
              </li>
              <li>
                Clique no ícone de <strong>instalação</strong> na barra de endereços (ícone de monitor com seta)
              </li>
              <li>
                Ou acesse o <strong>menu do navegador</strong> (três pontos) e clique em <strong>"Instalar MAXEASE"</strong>
              </li>
              <li>
                Confirme clicando em <strong>"Instalar"</strong>
              </li>
              <li>
                O app será instalado e abrirá automaticamente. Um atalho será criado na área de trabalho.
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* macOS / Chrome */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <Apple className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">macOS (Chrome/Edge)</CardTitle>
                <CardDescription>Instalação via navegador</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>
                Abra o <strong>link publicado</strong> do MAXEASE no <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong>
              </li>
              <li>
                Clique no ícone de <strong>instalação</strong> na barra de endereços
              </li>
              <li>
                Ou acesse <strong>Chrome → Arquivo → Instalar MAXEASE</strong>
              </li>
              <li>
                Confirme clicando em <strong>"Instalar"</strong>
              </li>
              <li>
                O app será instalado na pasta <strong>Aplicativos</strong> e pode ser aberto pelo Launchpad.
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Chrome específico */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <Chrome className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Google Chrome</CardTitle>
                <CardDescription>Atalho rápido</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>
                Acesse o <strong>link publicado</strong> do MAXEASE
              </li>
              <li>
                Pressione <strong>Ctrl + Shift + I</strong> (Windows) ou <strong>Cmd + Shift + I</strong> (Mac) para abrir DevTools
              </li>
              <li>
                Vá na aba <strong>"Application"</strong> → <strong>"Manifest"</strong>
              </li>
              <li>
                Clique em <strong>"Add to homescreen"</strong> ou <strong>"Install"</strong>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Requisitos */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Requisitos</CardTitle>
                <CardDescription>O que você precisa</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>
                <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong> (versão atualizada)
              </li>
              <li>
                Acesso ao <strong>link publicado</strong> do MAXEASE (não funciona no preview do Lovable)
              </li>
              <li>
                Conexão com a internet na primeira instalação
              </li>
            </ul>
            <div className="mt-4 p-3 rounded-lg bg-accent/50 text-sm">
              <strong>Nota:</strong> O Safari (macOS/iOS) não suporta PWA da mesma forma. Use Chrome ou Edge para a melhor experiência.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
