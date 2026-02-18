import { useState, useEffect, useCallback, useRef } from 'react';
import { Folder, FileText, Upload, ChevronRight, Edit2, Trash2, Plus, Download, Loader2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ReportItem {
  id: string;
  title: string;
  file_name: string | null;
  file_url: string | null;
  report_type: string | null;
  created_at: string;
}

interface ClientFolder {
  id: string;
  name: string;
}

function Relatorios() {
  const { clients } = useApp();
  const { user } = useAuth();
  const [folders, setFolders] = useState<ClientFolder[]>([]);
  const [customFolders, setCustomFolders] = useState<ClientFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<ClientFolder | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [newReportName, setNewReportName] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build folders from clients + custom folders
  useEffect(() => {
    const clientFolders: ClientFolder[] = clients.map((c) => ({
      id: c.id,
      name: c.company || c.name,
    }));
    setFolders([...clientFolders, ...customFolders]);
  }, [clients, customFolders]);

  // Fetch reports for selected folder
  const fetchReports = useCallback(async () => {
    if (!user || !selectedFolder) return;
    setLoadingReports(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .eq('report_type', selectedFolder.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoadingReports(false);
    }
  }, [user, selectedFolder]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadName.trim()) {
        setUploadName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFolder || !uploadName.trim() || !selectedFile || !user) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${user.id}/${selectedFolder.id}/${crypto.randomUUID()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Save report record
      const { error: insertError } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          title: uploadName,
          file_name: selectedFile.name,
          file_url: filePath,
          report_type: selectedFolder.id,
        });

      if (insertError) throw insertError;

      toast.success('Relatório enviado com sucesso!');
      setUploadName('');
      setSelectedFile(null);
      setIsUploadDialogOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchReports();
    } catch (error) {
      console.error('Error uploading report:', error);
      toast.error('Erro ao enviar relatório');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (report: ReportItem) => {
    if (!report.file_url) return;
    try {
      const { data, error } = await supabase.storage
        .from('reports')
        .download(report.file_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.file_name || report.title;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Erro ao baixar relatório');
    }
  };

  const handleRename = async () => {
    if (!selectedReport || !newReportName.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('reports')
        .update({ title: newReportName })
        .eq('id', selectedReport.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Relatório renomeado');
      setIsRenameDialogOpen(false);
      setSelectedReport(null);
      setNewReportName('');
      fetchReports();
    } catch (error) {
      console.error('Error renaming report:', error);
      toast.error('Erro ao renomear relatório');
    }
  };

  const handleDelete = async (report: ReportItem) => {
    if (!user) return;

    try {
      // Delete file from storage
      if (report.file_url) {
        await supabase.storage.from('reports').remove([report.file_url]);
      }

      // Delete record
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', report.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Relatório excluído');
      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Erro ao excluir relatório');
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const addNewFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder: ClientFolder = {
      id: crypto.randomUUID(),
      name: newFolderName,
    };

    setCustomFolders((prev) => [...prev, newFolder]);
    setNewFolderName('');
    setIsNewFolderDialogOpen(false);
  };

  const openRenameDialog = (report: ReportItem) => {
    setSelectedReport(report);
    setNewReportName(report.title);
    setIsRenameDialogOpen(true);
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

          {loadingReports ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 bg-card rounded-xl border border-border hover:border-foreground/20 transition-all animate-fade-in group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-secondary rounded-lg">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{report.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">{report.file_name}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(report.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {report.file_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(report)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openRenameDialog(report)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(report)}
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
            <Button variant="outline" onClick={() => setIsNewFolderDialogOpen(true)}>
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
              <Button className="mt-4" onClick={() => setIsNewFolderDialogOpen(true)}>
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
            <div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-foreground/30 transition-colors"
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                {selectedFile ? (
                  <p className="mt-2 text-sm font-medium">{selectedFile.name}</p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Clique para selecionar um arquivo
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOC, XLS, PNG, JPG
                </p>
              </button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                className="flex-1"
                disabled={uploading || !selectedFile || !uploadName.trim()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
              <Button variant="outline" onClick={() => {
                setIsUploadDialogOpen(false);
                setSelectedFile(null);
                setUploadName('');
              }}>
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

      {/* New Folder Dialog */}
      <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium">Nome da Pasta</label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Ex: Nome do cliente"
                className="mt-1"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && addNewFolder()}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addNewFolder} className="flex-1" disabled={!newFolderName.trim()}>
                Criar Pasta
              </Button>
              <Button variant="outline" onClick={() => {
                setIsNewFolderDialogOpen(false);
                setNewFolderName('');
              }}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Relatorios;
