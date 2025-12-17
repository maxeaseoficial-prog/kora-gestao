import { useState } from 'react';
import { Folder, FileText, Upload, ChevronRight, Edit2, Trash2, Plus } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface FolderReport {
  id: string;
  name: string;
  date: string;
}

interface ClientFolder {
  id: string;
  name: string;
  reports: FolderReport[];
}

export function Relatorios() {
  const { clients } = useApp();
  const [folders, setFolders] = useState<ClientFolder[]>(
    clients.map((c) => ({
      id: c.id,
      name: c.company,
      reports: [],
    }))
  );
  const [selectedFolder, setSelectedFolder] = useState<ClientFolder | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<FolderReport | null>(null);
  const [newReportName, setNewReportName] = useState('');
  const [uploadName, setUploadName] = useState('');

  const handleUpload = () => {
    if (!selectedFolder || !uploadName.trim()) return;

    const newReport: FolderReport = {
      id: `report-${Date.now()}`,
      name: uploadName,
      date: new Date().toISOString(),
    };

    setFolders(folders.map((f) =>
      f.id === selectedFolder.id
        ? { ...f, reports: [...f.reports, newReport] }
        : f
    ));

    setSelectedFolder({
      ...selectedFolder,
      reports: [...selectedFolder.reports, newReport],
    });

    setUploadName('');
    setIsUploadDialogOpen(false);
  };

  const handleRename = () => {
    if (!selectedFolder || !selectedReport || !newReportName.trim()) return;

    const updatedReports = selectedFolder.reports.map((r) =>
      r.id === selectedReport.id ? { ...r, name: newReportName } : r
    );

    setFolders(folders.map((f) =>
      f.id === selectedFolder.id
        ? { ...f, reports: updatedReports }
        : f
    ));

    setSelectedFolder({
      ...selectedFolder,
      reports: updatedReports,
    });

    setIsRenameDialogOpen(false);
    setSelectedReport(null);
    setNewReportName('');
  };

  const handleDelete = (reportId: string) => {
    if (!selectedFolder) return;

    const updatedReports = selectedFolder.reports.filter((r) => r.id !== reportId);

    setFolders(folders.map((f) =>
      f.id === selectedFolder.id
        ? { ...f, reports: updatedReports }
        : f
    ));

    setSelectedFolder({
      ...selectedFolder,
      reports: updatedReports,
    });
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const addNewFolder = () => {
    const folderName = prompt('Nome da nova pasta:');
    if (!folderName?.trim()) return;

    const newFolder: ClientFolder = {
      id: `folder-${Date.now()}`,
      name: folderName,
      reports: [],
    };

    setFolders([...folders, newFolder]);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => setSelectedFolder(null)}
          className={cn(
            "text-muted-foreground hover:text-foreground transition-colors",
            !selectedFolder && "text-foreground font-medium"
          )}
        >
          Relatórios
        </button>
        {selectedFolder && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{selectedFolder.name}</span>
          </>
        )}
      </div>

      {selectedFolder ? (
        /* Reports View */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Relatórios de {selectedFolder.name}</h2>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>

          {selectedFolder.reports.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {selectedFolder.reports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 bg-card rounded-xl border border-border hover:border-foreground/20 transition-all animate-fade-in group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-secondary rounded-lg">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{report.name}</h3>
                      <p className="text-sm text-muted-foreground">{formatDate(report.date)}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setSelectedReport(report);
                        setNewReportName(report.name);
                        setIsRenameDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Nenhum relatório</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Faça upload do primeiro relatório para este cliente
              </p>
              <Button className="mt-4" onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Folders View */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Pastas de Clientes</h2>
            <Button variant="outline" onClick={addNewFolder}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Pasta
            </Button>
          </div>

          {folders.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder)}
                  className="p-4 bg-card rounded-xl border border-border hover:border-foreground/20 hover:shadow-sm transition-all text-left animate-fade-in group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary rounded-lg group-hover:bg-foreground group-hover:text-background transition-colors">
                      <Folder className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{folder.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {folder.reports.length} {folder.reports.length === 1 ? 'relatório' : 'relatórios'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <Folder className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Nenhuma pasta</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Crie uma pasta para organizar os relatórios
              </p>
              <Button className="mt-4" onClick={addNewFolder}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Pasta
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload de Relatório</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium">Nome do Relatório</label>
              <Input
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="Ex: Relatório Outubro 2025"
                className="mt-1"
              />
            </div>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Arraste um arquivo PDF ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                (Simulação - o upload será implementado com backend)
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpload} className="flex-1">
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Relatório</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium">Novo Nome</label>
              <Input
                value={newReportName}
                onChange={(e) => setNewReportName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRename} className="flex-1">
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
