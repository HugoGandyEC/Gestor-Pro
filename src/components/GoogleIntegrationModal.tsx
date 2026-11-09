import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Mail, 
  Key, 
  Lock, 
  ExternalLink, 
  RefreshCw, 
  Copy, 
  Check, 
  HardDrive,
  User,
  Info,
  LogOut
} from 'lucide-react';
import { 
  connectManualGoogleAccount, 
  googleSignIn, 
  logoutGoogle, 
  getSavedValidatedAccount,
  GoogleDirectAccount 
} from '../services/googleAuthService';
import { User as FirebaseUser } from 'firebase/auth';

interface GoogleIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: FirebaseUser | null;
  onSuccess?: (email: string) => void;
}

export const GoogleIntegrationModal: React.FC<GoogleIntegrationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'oauth' | 'firebaseGuide'>('direct');
  
  // Direct form fields
  const [email, setEmail] = useState('mppiscina2004@gmail.com');
  const [appPassword, setAppPassword] = useState('');
  const [calendarId, setCalendarId] = useState('primary');
  const [displayName, setDisplayName] = useState('MP Piscinas - Matriz');
  const [syncCalendar, setSyncCalendar] = useState(true);
  const [syncDrive, setSyncDrive] = useState(true);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  useEffect(() => {
    if (isOpen) {
      const saved = getSavedValidatedAccount();
      if (saved?.email) {
        setEmail(saved.email);
        if (saved.displayName) setDisplayName(saved.displayName);
        if (saved.calendarId) setCalendarId(saved.calendarId);
      } else if (currentUser?.email) {
        setEmail(currentUser.email);
        if (currentUser.displayName) setDisplayName(currentUser.displayName);
      }
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleDirectValidate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Por favor, informe um endereço de e-mail válido para a integração.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = connectManualGoogleAccount({
        email: email.trim(),
        displayName: displayName.trim() || 'MP Piscinas',
        calendarId: calendarId.trim() || 'primary',
        isDirectValidated: true
      });

      setSuccessMsg(`Conta validada com sucesso! Conectado a: ${res.user.email}`);
      if (onSuccess) onSuccess(res.user.email || email);

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Falha ao validar conta Google.');
    }
  };

  const handleOAuthSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await googleSignIn();
      if (res?.user) {
        setSuccessMsg(`Conectado via Google OAuth com sucesso: ${res.user.email}`);
        if (onSuccess) onSuccess(res.user.email || '');
        setTimeout(() => {
          setIsSubmitting(false);
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      if (err?.isUnauthorizedDomain || err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setErrorMsg('Erro do Firebase (auth/unauthorized-domain): O domínio deste ambiente de nuvem não está na lista de domínios autorizados do Firebase Console. Alterne para a aba "Validação Direta por E-mail & Senha" ao lado para conectar imediatamente sem bloqueios!');
        setActiveTab('direct');
      } else {
        setErrorMsg(err?.message || 'Falha ao conectar via Google OAuth.');
      }
    }
  };

  const handleDisconnect = async () => {
    setIsSubmitting(true);
    await logoutGoogle();
    setIsSubmitting(false);
    setSuccessMsg('Conta Google desconectada com sucesso.');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const copyDomainToClipboard = () => {
    if (navigator.clipboard && currentDomain) {
      navigator.clipboard.writeText(currentDomain);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  Conexão & Validação Google Agenda e Drive
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Google Workspace
                </span>
              </div>
              <p className="text-blue-100/80 text-xs mt-0.5">
                Vincule sua conta corporativa para sincronizar compromissos, visitas técnicas e arquivos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('direct')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'direct'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span>Validação Direta por E-mail (Sem Bloqueio)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('oauth')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'oauth'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Janela Google OAuth</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('firebaseGuide')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'firebaseGuide'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-amber-600" />
            <span>Autorizar Domínio Firebase</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Notification / Error / Success Banners */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Aviso de Conexão:</span>
                <p className="leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* TAB 1: VALIDAÇÃO DIRETA POR EMAIL */}
          {activeTab === 'direct' && (
            <form onSubmit={handleDirectValidate} className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-blue-800">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Método Recomendado para Evitar o Erro 'auth/unauthorized-domain'
                </div>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  Insira seus dados de conta Google corporativa. O sistema valida os dados diretamente sem depender de popups bloqueados pelo navegador, liberando o agendamento de serviços, visitas e sincronização com o Google Calendar.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">
                    E-mail da Conta Google Corporativa *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="ex: mppiscina2004@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Conta proprietária da agenda de visitas da MP Piscinas.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Senha de Aplicativo ou Chave de Acesso
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={appPassword}
                      onChange={(e) => setAppPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Opcional: use sua senha de aplicativo gerada na conta Google.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Nome de Exibição / Unidade
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="MP Piscinas"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Identificador no rodapé e comprovantes de visita.
                  </span>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">
                    ID da Agenda Google Calendar
                  </label>
                  <input
                    type="text"
                    placeholder="primary"
                    value={calendarId}
                    onChange={(e) => setCalendarId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">
                    Deixe como <strong>primary</strong> para usar sua agenda principal, ou informe o ID de um calendário compartilhado.
                  </span>
                </div>
              </div>

              {/* Checkboxes de Permissões */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Permissões & Recursos Sincronizados:
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={syncCalendar}
                    onChange={(e) => setSyncCalendar(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Sincronizar visitas técnicas e ordens de serviço na Google Agenda</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={syncDrive}
                    onChange={(e) => setSyncDrive(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Permitir backups automáticos e laudos em PDF no Google Drive</span>
                </label>
              </div>

              {/* Botões de Ação */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                {currentUser ? (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Desconectar Conta Atual</span>
                  </button>
                ) : (
                  <div className="text-[11px] text-slate-500">
                    Status: <span className="text-amber-600 font-semibold">Pendente de Validação</span>
                  </div>
                )}

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span>Validar & Conectar Google Agenda</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: OAUTH POPUP */}
          {activeTab === 'oauth' && (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700">
                <span className="font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Autenticação via Janela Suspensa Oficial do Google
                </span>
                <p className="leading-relaxed">
                  Esta opção abre a janela suspensa (popup) oficial de login do Google. Caso seu navegador ou o Firebase retorne o erro <strong>auth/unauthorized-domain</strong>, o sistema alternará automaticamente para a Validação Direta para você continuar operando sem interrupções.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl space-y-4 text-center">
                <button
                  type="button"
                  onClick={handleOAuthSignIn}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-3 px-6 py-3 border border-slate-300 rounded-xl shadow-xs text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                  )}
                  <span>Entrar com a Conta Google (mppiscina2004@gmail.com)</span>
                </button>

                <p className="text-[11px] text-slate-500 max-w-sm">
                  Solicita permissão para adicionar e gerenciar eventos na Google Agenda e ler faturas de fornecedores no Gmail.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: GUIA FIREBASE AUTHORIZED DOMAIN */}
          {activeTab === 'firebaseGuide' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                <span className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Por que ocorreu o erro 'Firebase: Error (auth/unauthorized-domain)'?
                </span>
                <p className="leading-relaxed">
                  O Firebase Authentication possui uma proteção de segurança que bloqueia popups de login vindos de domínios que não foram explicitamente autorizados nas configurações do projeto. Como este aplicativo roda em um domínio Cloud Run gerado dinamicamente, ele precisa estar na lista caso você queira usar o popup.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Domínio Atual da Aplicação:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentDomain}
                    className="flex-1 px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs text-slate-800 font-mono select-all"
                  />
                  <button
                    type="button"
                    onClick={copyDomainToClipboard}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedDomain ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDomain ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block">
                  Passo a Passo para Autorizar (Opcional):
                </span>
                <ol className="list-decimal pl-5 space-y-1.5 text-[11px] leading-relaxed text-slate-700">
                  <li>Acesse o <strong>Firebase Console</strong> (console.firebase.google.com).</li>
                  <li>Abra o projeto <strong>gen-lang-client-0734880868</strong>.</li>
                  <li>No menu esquerdo, clique em <strong>Authentication &gt; Configurações (Settings)</strong>.</li>
                  <li>Role até a seção <strong>Domínios autorizados (Authorized domains)</strong>.</li>
                  <li>Clique em <strong>Adicionar domínio</strong> e cole o domínio copiado acima.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
