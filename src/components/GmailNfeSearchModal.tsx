import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Search, 
  FileCode, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Building,
  Package,
  Percent
} from 'lucide-react';
import { 
  searchGmailNfeInvoices, 
  downloadGmailXmlAttachment, 
  GmailNfeAttachment 
} from '../services/gmailNfeService';
import { 
  googleSignIn, 
  initAuth, 
  getAccessToken, 
  logoutGoogle 
} from '../services/googleAuthService';
import { useApp, formatBRL } from '../context/AppContext';
import { ParsedXmlNFe } from '../types';

interface GmailNfeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectXmlContent: (xmlContent: string) => void;
}

export const GmailNfeSearchModal: React.FC<GmailNfeSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectXmlContent
}) => {
  const { parseNFeXml } = useApp();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('mppiscina2004@gmail.com');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('filename:xml');
  const [isSearching, setIsSearching] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<GmailNfeAttachment[]>([]);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // Sample XML generator for instant testing with genuine supplier structure
  const sampleSupplierXml = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35261061423789000115550010000452311000452312" versao="4.00">
      <ide>
        <nNF>45231</nNF>
        <dhEmi>2026-10-25T14:30:00-03:00</dhEmi>
        <tpNF>1</tpNF>
      </ide>
      <emit>
        <CNPJ>61.423.789/0001-15</CNPJ>
        <xNome>TermoMax Industria e Comercio de Aquecedores Ltda</xNome>
        <xFant>TermoMax Solar & Piscinas</xFant>
        <enderEmit>
          <xLgr>Avenida Industrial dos Reservatórios</xLgr>
          <nro>1500</nro>
          <xBairro>Distrito Industrial</xBairro>
          <xMun>São Paulo</xMun>
          <UF>SP</UF>
          <CEP>04571-000</CEP>
          <fone>(11) 3300-8800</fone>
        </enderEmit>
      </emit>
      <dest>
        <CNPJ>12.345.678/0001-90</CNPJ>
        <xNome>MP Piscinas e Aquecedores Ltda</xNome>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>BOILER-600L-INOX316</cProd>
          <xProd>Reservatorio Termico Solar Boiler 600L Alta Pressao Inox 316</xProd>
          <NCM>8419.19.10</NCM>
          <uCom>UN</uCom>
          <qCom>2.0000</qCom>
          <vUnCom>2850.00</vUnCom>
          <vProd>5700.00</vProd>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>BOMBA-1CV-CENTRIF</cProd>
          <xProd>Motobomba Centrífuga 1.0 CV Monofásica 220V com Pré-Filtro</xProd>
          <NCM>8413.70.80</NCM>
          <uCom>UN</uCom>
          <qCom>4.0000</qCom>
          <vUnCom>620.00</vUnCom>
          <vProd>2480.00</vProd>
        </prod>
      </det>
      <det nItem="3">
        <prod>
          <cProd>VALV-RETENCAO-1P</cProd>
          <xProd>Valvula de Retencao Vertical Portinhola Bronze 1 Polegada</xProd>
          <NCM>8481.30.00</NCM>
          <uCom>UN</uCom>
          <qCom>10.0000</qCom>
          <vUnCom>45.00</vUnCom>
          <vProd>450.00</vProd>
        </prod>
      </det>
      <total>
        <ICMSTot>
          <vNF>8630.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;

  useEffect(() => {
    initAuth(
      (user, token) => {
        setIsAuthenticated(true);
        if (user.email) {
          setCurrentUserEmail(user.email);
        }
      },
      () => {
        setIsAuthenticated(false);
      }
    );
  }, []);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setFeedback(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setIsAuthenticated(true);
        if (res.user.email) {
          setCurrentUserEmail(res.user.email);
        }
        setFeedback(`Conectado com sucesso como ${res.user.email}! Pronto para buscar NF-e.`);
        handleSearch();
      }
    } catch (err: any) {
      setFeedback('Erro ao conectar com Google: ' + (err.message || 'tente novamente'));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setFeedback(null);
    try {
      const result = await searchGmailNfeInvoices(searchQuery);
      if (result.success) {
        setAttachments(result.attachments);
        setFeedback(result.message);
      } else {
        setFeedback(result.message);
      }
    } catch (err: any) {
      setFeedback('Erro durante a busca: ' + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportAttachment = async (att: GmailNfeAttachment) => {
    setIsDownloading(att.attachmentId);
    try {
      const res = await downloadGmailXmlAttachment(att.messageId, att.attachmentId);
      if (res.success && res.xmlContent) {
        onSelectXmlContent(res.xmlContent);
        onClose();
      } else {
        setFeedback('Erro ao baixar anexo: ' + (res.error || 'conteúdo vazio'));
      }
    } catch (e: any) {
      setFeedback('Falha no download: ' + e.message);
    } finally {
      setIsDownloading(null);
    }
  };

  const handleUseSampleXml = () => {
    onSelectXmlContent(sampleSupplierXml);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 border border-slate-200 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Buscar NF-e no Gmail
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  Google Workspace
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Localize notas fiscais enviadas por fornecedores para <strong>{currentUserEmail}</strong> e importe produtos com 55% no varejo e 35% no atacado.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Banner */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-700">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isAuthenticated ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <div>
              <div className="font-semibold text-slate-900">
                {isAuthenticated ? 'Conectado ao Gmail' : 'Conexão com Google Workspace'}
              </div>
              <div className="text-[11px] text-slate-500">
                {isAuthenticated 
                  ? `Conta autorizada: ${currentUserEmail}` 
                  : 'Autorize o acesso com segurança para pesquisar e-mails de fornecedores.'}
              </div>
            </div>
          </div>

          {!isAuthenticated ? (
            <button
              onClick={handleGoogleLogin}
              disabled={isSigningIn}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isSigningIn ? 'Conectando...' : 'Entrar com Google'}</span>
            </button>
          ) : (
            <button
              onClick={logoutGoogle}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline"
            >
              Desconectar
            </button>
          )}
        </div>

        {/* Search Input Box */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar termos (ex: filename:xml, TermoMax, nota fiscal)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !isAuthenticated}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs ${
              isAuthenticated
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
            <span>{isSearching ? 'Buscando...' : 'Pesquisar'}</span>
          </button>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Results List */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Anexos XML de NF-e Encontrados ({attachments.length})</span>
            <span className="text-[10px] text-emerald-700 font-semibold">
              Regra Oficial: 55% Varejo · 35% Atacado
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {attachments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                <FileCode className="w-8 h-8 mx-auto text-slate-300" />
                <p>Nenhum anexo XML listado ainda. Faça a pesquisa ou use a amostra de fornecedor abaixo.</p>
              </div>
            ) : (
              attachments.map((att, idx) => (
                <div key={idx} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{att.filename}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      <span>De: {att.sender}</span> · <span>Assunto: {att.subject}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleImportAttachment(att)}
                    disabled={isDownloading === att.attachmentId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloading === att.attachmentId ? 'Baixando...' : 'Importar & Precificar (+55% / +35%)'}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Test with Sample NF-e XML */}
        <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-emerald-950">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>NF-e de Exemplo de Fornecedor (TermoMax Solar & Piscinas)</span>
            </div>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Simule instantaneamente a conferência de 3 produtos (Boiler 600L Inox 316, Motobomba 1.0 CV e Válvulas) com precificação automática de 55% e 35%.
            </p>
          </div>

          <button
            onClick={handleUseSampleXml}
            className="px-3.5 py-2 text-xs font-bold text-emerald-900 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            Carregar NF-e de Exemplo
          </button>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
