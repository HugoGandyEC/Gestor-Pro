import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  FolderPlus, 
  FileText, 
  FileSpreadsheet, 
  File as FileGenericIcon, 
  UploadCloud, 
  Download, 
  ExternalLink, 
  Trash2, 
  Search, 
  RefreshCw, 
  HardDrive, 
  AlertCircle, 
  CheckCircle2, 
  Database, 
  ArrowLeft,
  ChevronRight,
  LogOut,
  Image as ImageIcon
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logoutGoogle, 
  getAccessToken 
} from '../services/googleAuthService';
import { 
  listDriveFiles, 
  createDriveFolder, 
  uploadFileToDrive, 
  uploadTextToDrive, 
  deleteDriveFile, 
  getDriveStorageQuota, 
  DriveFile, 
  DriveQuota 
} from '../services/googleDriveService';
import { useApp, formatBRL } from '../context/AppContext';

export const GoogleDriveView: React.FC = () => {
  const { 
    serviceOrders, 
    directSales, 
    clients, 
    products, 
    companySettings, 
    selectedMonthYear 
  } = useApp();

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Drive Navigation & Files State
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderHistory, setFolderHistory] = useState<{ id: string; name: string }[]>([
    { id: 'root', name: 'Meu Google Drive' }
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mimeFilter, setMimeFilter] = useState<'all' | 'folders' | 'docs' | 'sheets' | 'images'>('all');
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [quota, setQuota] = useState<DriveQuota | null>(null);

  // Modals & User Actions
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Destructive Confirmation Modal (MANDATORY per workspace-integration rules)
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (authenticatedUser, accessToken) => {
        setUser(authenticatedUser);
        setToken(accessToken);
        loadFiles(accessToken, 'root');
        loadQuota(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setFiles([]);
        setQuota(null);
      }
    );

    return () => unsubscribe();
  }, []);

  const showFeedback = (success: boolean, message: string) => {
    setFeedback({ success, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        await loadFiles(result.accessToken, 'root');
        await loadQuota(result.accessToken);
        showFeedback(true, `Conectado com sucesso como ${result.user.email}`);
      }
    } catch (err: any) {
      console.error('Falha no login com Google:', err);
      setAuthError(err.message || 'Não foi possível conectar ao Google Drive.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutGoogle();
      setUser(null);
      setToken(null);
      setFiles([]);
      setQuota(null);
      showFeedback(true, 'Google Drive desconectado com segurança.');
    } catch (err: any) {
      console.error('Erro ao sair:', err);
    }
  };

  const loadQuota = async (accessToken: string) => {
    try {
      const q = await getDriveStorageQuota(accessToken);
      setQuota(q);
    } catch (err) {
      console.warn('Não foi possível carregar a cota do Drive:', err);
    }
  };

  const loadFiles = async (accessToken: string, folderId: string, search?: string, filter?: string) => {
    setIsLoadingFiles(true);
    try {
      const res = await listDriveFiles(accessToken, {
        folderId,
        searchQuery: search,
        mimeTypeFilter: filter || mimeFilter
      });
      setFiles(res.files);
    } catch (err: any) {
      console.error('Erro ao listar arquivos:', err);
      showFeedback(false, err.message || 'Falha ao buscar arquivos do Google Drive.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleRefresh = () => {
    if (token) {
      loadFiles(token, currentFolderId, searchQuery, mimeFilter);
      loadQuota(token);
    }
  };

  const handleOpenFolder = (folder: DriveFile) => {
    if (!token) return;
    const newHistory = [...folderHistory, { id: folder.id, name: folder.name }];
    setFolderHistory(newHistory);
    setCurrentFolderId(folder.id);
    setSearchQuery('');
    loadFiles(token, folder.id);
  };

  const handleNavigateBreadcrumb = (index: number) => {
    if (!token) return;
    const target = folderHistory[index];
    const newHistory = folderHistory.slice(0, index + 1);
    setFolderHistory(newHistory);
    setCurrentFolderId(target.id);
    setSearchQuery('');
    loadFiles(token, target.id);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newFolderName.trim()) return;

    try {
      await createDriveFolder(token, newFolderName.trim(), currentFolderId);
      setIsNewFolderOpen(false);
      setNewFolderName('');
      showFeedback(true, `Pasta "${newFolderName}" criada com sucesso no Google Drive.`);
      loadFiles(token, currentFolderId);
    } catch (err: any) {
      showFeedback(false, err.message || 'Falha ao criar pasta.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsUploading(true);
    try {
      await uploadFileToDrive(token, file, currentFolderId);
      showFeedback(true, `Arquivo "${file.name}" enviado com sucesso ao Google Drive!`);
      loadFiles(token, currentFolderId);
    } catch (err: any) {
      showFeedback(false, err.message || 'Falha no upload do arquivo.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Explicit User Confirmation Dialog for File Deletion
  const confirmDeleteFile = async () => {
    if (!token || !fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(token, fileToDelete.id);
      showFeedback(true, `Arquivo "${fileToDelete.name}" excluído com sucesso do Google Drive.`);
      setFileToDelete(null);
      loadFiles(token, currentFolderId);
    } catch (err: any) {
      showFeedback(false, err.message || 'Falha ao excluir arquivo.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick Action: Export ERP JSON Backup to Drive
  const handleExportERPBackup = async () => {
    if (!token) return;
    setIsUploading(true);
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        company: companySettings,
        serviceOrders,
        directSales,
        clients,
        products,
        version: '1.0'
      };

      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `Backup_ERP_GestaoPro_${dateStr}.json`;
      const jsonContent = JSON.stringify(backupData, null, 2);

      await uploadTextToDrive(token, fileName, jsonContent, 'application/json', currentFolderId);
      showFeedback(true, `Backup completo do ERP exportado para o Google Drive: "${fileName}".`);
      loadFiles(token, currentFolderId);
    } catch (err: any) {
      showFeedback(false, err.message || 'Falha ao exportar backup para o Drive.');
    } finally {
      setIsUploading(false);
    }
  };

  const [isUploadingZip, setIsUploadingZip] = useState(false);

  // Baixar arquivo ZIP completo diretamente para o computador
  const handleDownloadZipToComputer = () => {
    const link = document.createElement('a');
    link.href = '/gestaopro-sistema-completo.zip';
    link.download = `gestaopro-sistema-completo-${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback(true, 'Download do arquivo ZIP completo iniciado para seu computador!');
  };

  // Enviar arquivo ZIP completo diretamente para o Google Drive
  const handleUploadZipToGoogleDrive = async () => {
    if (!token) {
      showFeedback(false, 'Por favor, conecte sua conta Google Drive primeiro para salvar na nuvem.');
      return;
    }
    setIsUploadingZip(true);
    try {
      const response = await fetch('/gestaopro-sistema-completo.zip');
      if (!response.ok) throw new Error('Arquivo ZIP não localizado no servidor.');
      const blob = await response.blob();
      const dateStr = new Date().toISOString().split('T')[0];
      const zipFileName = `gestaopro-sistema-completo-${dateStr}.zip`;
      const file = new File([blob], zipFileName, { type: 'application/zip' });

      await uploadFileToDrive(token, file, currentFolderId);
      showFeedback(true, `Arquivo ZIP "${zipFileName}" enviado com sucesso para seu Google Drive!`);
      loadFiles(token, currentFolderId);
    } catch (err: any) {
      console.error('Erro ao enviar ZIP para o Google Drive:', err);
      showFeedback(false, err.message || 'Falha ao salvar o arquivo ZIP no Google Drive.');
    } finally {
      setIsUploadingZip(false);
    }
  };

  // Quick Action: Export Accounting Report to Drive
  const handleExportAccountingReport = async () => {
    if (!token) return;
    setIsUploading(true);
    try {
      const monthOrders = serviceOrders.filter(o => {
        const d = o.completionDate || o.openDate;
        return d.startsWith(selectedMonthYear) && (o.status === 'concluida_aguardando_retirada' || o.status === 'entregue_finalizada');
      });
      const monthSales = directSales.filter(s => s.date.startsWith(selectedMonthYear) && s.paymentStatus === 'pago');

      const grossServicesRevenue = monthOrders.reduce((acc, o) => {
        const srv = o.services.reduce((a, b) => a + Number(b.price || 0), 0) + Number(o.visitFee || 0);
        return acc + srv - Number(o.calculatedDiscount || 0);
      }, 0);
      const grossGoodsRevenue = monthOrders.reduce((acc, o) => {
        return acc + o.parts.reduce((a, b) => a + (Number(b.price || 0) * Number(b.quantity || 1)), 0);
      }, 0) + monthSales.reduce((acc, s) => acc + s.total, 0);

      const totalGross = grossServicesRevenue + grossGoodsRevenue;

      const reportContent = `
========================================================================
RELATÓRIO FISCAL & CONTÁBIL - GESTÃOPRO
========================================================================
Empresa: ${companySettings.companyName || companySettings.tradeName || 'Não informada'}
CNPJ: ${companySettings.cnpj || 'Não informado'}
Competência: ${selectedMonthYear}
Emissão: ${new Date().toLocaleString('pt-BR')}
------------------------------------------------------------------------
1. SEGREGAÇÃO DO FATURAMENTO BRUTO
- Serviços Prestados (NFS-e / ISS): ${formatBRL(grossServicesRevenue)}
- Venda de Peças / Mercadorias (NF-e / ICMS): ${formatBRL(grossGoodsRevenue)}
- FATURAMENTO BRUTO TOTAL: ${formatBRL(totalGross)}

2. QUANTITATIVOS
- Ordens de Serviço Concluídas: ${monthOrders.length}
- Vendas Diretas Faturadas: ${monthSales.length}

3. TRIBUTOS ESTIMADOS (DAS - SIMPLES NACIONAL)
- Serviços (Anexo III - ~6%): ${formatBRL(grossServicesRevenue * 0.06)}
- Comércio (Anexo I - ~4%): ${formatBRL(grossGoodsRevenue * 0.04)}
- TOTAL ESTIMADO A RECOLHER: ${formatBRL(grossServicesRevenue * 0.06 + grossGoodsRevenue * 0.04)}
========================================================================
Documento gerado e salvo automaticamente no Google Drive pelo ERP GestãoPro.
`;

      const fileName = `Fechamento_Contabil_${selectedMonthYear}_${companySettings.tradeName || 'GestaoPro'}.txt`;
      await uploadTextToDrive(token, fileName, reportContent, 'text/plain', currentFolderId);
      showFeedback(true, `Fechamento fiscal salvo com sucesso no Google Drive: "${fileName}".`);
      loadFiles(token, currentFolderId);
    } catch (err: any) {
      showFeedback(false, err.message || 'Falha ao salvar relatório contábil.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '-';
    const num = Number(bytes);
    if (isNaN(num)) return '-';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
    return `${(num / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="w-5 h-5 text-amber-500 fill-amber-100" />;
    }
    if (mimeType.includes('pdf') || mimeType.includes('document')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('sheet') || mimeType.includes('csv')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    if (mimeType.includes('image')) {
      return <ImageIcon className="w-5 h-5 text-purple-600" />;
    }
    return <FileGenericIcon className="w-5 h-5 text-slate-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-white/20 text-blue-200 border border-white/20">
              Google Workspace
            </span>
            <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
              user ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {user ? 'Google Drive Conectado' : 'Aguardando Conexão'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-blue-400" />
            Armazenamento em Nuvem & Google Drive
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Acesse, organize e armazene arquivos, ordens de serviço, comprovantes fiscais e cópias de segurança do ERP diretamente no seu Google Drive corporativo.
          </p>
        </div>

        {/* User Info / Sign In Controls */}
        <div className="shrink-0 flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 bg-white/10 p-2.5 rounded-xl border border-white/15">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'Usuário'} className="w-8 h-8 rounded-full border border-white/30" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight">
                  {user.displayName || 'Conta Google'}
                </div>
                <div className="text-[10px] text-slate-300 font-mono">
                  {user.email}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer ml-1"
                title="Desconectar do Google Drive"
              >
                <LogOut className="w-4 h-4 text-rose-300" />
              </button>
            </div>
          ) : (
            <div>
              {/* Official Google Sign In Button */}
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer border border-slate-300 disabled:opacity-50"
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoggingIn ? 'Conectando...' : 'Conectar com Google Drive'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Auth Error Banner */}
      {authError && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{authError}</span>
          </div>
          <button onClick={() => setAuthError(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
        </div>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs transition-all ${
          feedback.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
        </div>
      )}

      {/* CARD DE PACOTE ZIP COMPLETO (COMPUTADOR & GOOGLE DRIVE) */}
      <div className="bg-gradient-to-br from-slate-900 via-[#1e2330] to-slate-900 text-white rounded-2xl p-5 border border-slate-700 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0 shadow-inner">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  Pacote ZIP Completo de Todos os Arquivos do Sistema
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                  ZIP Compactado (~592 KB)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Arquivo compactado com todo o código-fonte (React, TypeScript, Tailwind CSS), configurações, regras fiscais, temas e dados do ERP prontos para download no seu computador ou arquivamento em nuvem no seu Google Drive.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Download para o computador */}
            <button
              onClick={handleDownloadZipToComputer}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              title="Baixar arquivo ZIP compactado para o seu computador"
            >
              <Download className="w-4 h-4" />
              <span>Baixar ZIP para Computador</span>
            </button>

            {/* Enviar para o Google Drive */}
            {user ? (
              <button
                onClick={handleUploadZipToGoogleDrive}
                disabled={isUploadingZip}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                title="Salvar arquivo ZIP compactado diretamente na pasta atual do Google Drive"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{isUploadingZip ? 'Salvando no Drive...' : 'Salvar ZIP no Google Drive'}</span>
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Conecte seu Google Drive para salvar o arquivo diretamente na nuvem"
              >
                <HardDrive className="w-4 h-4 text-blue-400" />
                <span>Conectar Drive para Salvar na Nuvem</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!user ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <HardDrive className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Conecte sua conta do Google Drive
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Com sua permissão, o sistema sincronizará pastas, salvará comprovantes e relatórios em PDF/XML, e manterá cópias de segurança do ERP sempre acessíveis na sua nuvem.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-3 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0 bg-white rounded-full p-0.5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isLoggingIn ? 'Iniciando Conexão...' : 'Conectar com Google Drive'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick ERP Actions Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-600" />
                Ações Rápidas ERP:
              </span>
              <button
                onClick={handleExportERPBackup}
                disabled={isUploading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Exportar Backup do ERP em JSON</span>
              </button>

              <button
                onClick={handleExportAccountingReport}
                disabled={isUploading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Salvar Fechamento Fiscal no Drive</span>
              </button>
            </div>

            {quota && quota.usage && quota.limit && (
              <div className="text-[11px] text-slate-500 font-medium">
                Cota em uso: <strong className="text-slate-800 font-mono">{formatFileSize(quota.usage)}</strong> de <strong className="text-slate-800 font-mono">{formatFileSize(quota.limit)}</strong>
              </div>
            )}
          </div>

          {/* Explorer Section */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-1.5 text-xs overflow-x-auto py-1">
                {folderHistory.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    <button
                      onClick={() => handleNavigateBreadcrumb(idx)}
                      className={`font-semibold cursor-pointer truncate max-w-[150px] ${
                        idx === folderHistory.length - 1
                          ? 'text-blue-700 font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {item.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsNewFolderOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-amber-600" />
                  <span>Nova Pasta</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Enviando...' : 'Fazer Upload'}</span>
                </button>

                <button
                  onClick={handleRefresh}
                  disabled={isLoadingFiles}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                  title="Atualizar lista"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar arquivos no Drive..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (token) loadFiles(token, currentFolderId, e.target.value, mimeFilter);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {(['all', 'folders', 'docs', 'sheets', 'images'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => {
                      setMimeFilter(tab);
                      if (token) loadFiles(token, currentFolderId, searchQuery, tab);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      mimeFilter === tab
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab === 'all' && 'Todos'}
                    {tab === 'folders' && 'Pastas'}
                    {tab === 'docs' && 'Docs / PDFs'}
                    {tab === 'sheets' && 'Planilhas'}
                    {tab === 'images' && 'Imagens'}
                  </button>
                ))}
              </div>
            </div>

            {/* Files Table */}
            {isLoadingFiles ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span>Carregando arquivos do Google Drive...</span>
              </div>
            ) : files.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                <Folder className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="font-semibold text-slate-600">Nenhum arquivo encontrado nesta pasta.</div>
                <p className="text-[11px] text-slate-400">
                  Clique em <strong>Fazer Upload</strong> ou crie uma <strong>Nova Pasta</strong> para começar.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Nome do Arquivo / Pasta</th>
                      <th className="py-2.5 px-3">Tamanho</th>
                      <th className="py-2.5 px-3">Última Modificação</th>
                      <th className="py-2.5 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {files.map(file => {
                      const isFolder = file.mimeType === 'application/vnd.google-apps.folder';

                      return (
                        <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2.5">
                              {getFileIcon(file.mimeType)}
                              {isFolder ? (
                                <button
                                  onClick={() => handleOpenFolder(file)}
                                  className="font-bold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer truncate max-w-md text-left"
                                >
                                  {file.name}
                                </button>
                              ) : (
                                <span className="font-medium text-slate-800 truncate max-w-md">
                                  {file.name}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                            {isFolder ? 'Pasta' : formatFileSize(file.size)}
                          </td>

                          <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                            {new Date(file.modifiedTime).toLocaleString('pt-BR')}
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Abrir no Google Drive"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {/* Delete button triggers explicit confirmation dialog */}
                              <button
                                onClick={() => setFileToDelete(file)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Excluir arquivo do Google Drive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {isNewFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
              <FolderPlus className="w-4 h-4 text-amber-500" />
              Criar Nova Pasta no Google Drive
            </h3>
            <form onSubmit={handleCreateFolder} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nome da Pasta</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ordens de Serviço 2026"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Criar Pasta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory User Confirmation Dialog for Destructive Operations (Delete) */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Confirmar Exclusão no Google Drive
                </h3>
                <p className="text-xs text-slate-500">
                  Esta ação excluirá o item selecionado permanentemente.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="text-slate-500 mb-0.5">Item a ser excluído:</div>
              <div className="font-bold text-slate-900 break-all flex items-center gap-2">
                {getFileIcon(fileToDelete.mimeType)}
                <span>{fileToDelete.name}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Tem certeza que deseja prosseguir com a exclusão deste {fileToDelete.mimeType === 'application/vnd.google-apps.folder' ? 'diretório' : 'arquivo'} da sua conta do Google Drive?
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteFile}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                {isDeleting ? 'Excluindo...' : 'Confirmar e Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
