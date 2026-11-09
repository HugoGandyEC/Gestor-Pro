import React from 'react';
import { 
  AlertTriangle, 
  X, 
  FileText, 
  Clock, 
  Building2, 
  ShieldAlert, 
  ArrowRight, 
  RefreshCw,
  Copy,
  Check,
  Package,
  DollarSign
} from 'lucide-react';
import { UploadedFileRecord, formatBytes } from '../services/fileUploadTracker';
import { formatBRL } from '../context/AppContext';

interface DuplicateUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedAnyway: () => void;
  duplicateRecord: UploadedFileRecord;
  currentFileName: string;
  currentFileSize?: number;
}

export const DuplicateUploadModal: React.FC<DuplicateUploadModalProps> = ({
  isOpen,
  onClose,
  onProceedAnyway,
  duplicateRecord,
  currentFileName,
  currentFileSize
}) => {
  const [copiedKey, setCopiedKey] = React.useState(false);

  if (!isOpen) return null;

  const isNFe = duplicateRecord.category === 'nfe_xml';
  const meta = duplicateRecord.metadata || {};

  const handleCopyKey = () => {
    if (meta.chNFe) {
      navigator.clipboard.writeText(meta.chNFe);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-amber-300 flex flex-col">
        {/* Header de Alerta */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  Arquivo Duplicado Detectado!
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/30 text-amber-200 border border-amber-400/30">
                  {isNFe ? 'XML de NF-e' : 'Cadastro'}
                </span>
              </div>
              <p className="text-amber-100 text-xs mt-0.5">
                O sistema identificou que este arquivo já foi enviado e processado anteriormente.
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

        {/* Corpo com Detalhes do Arquivo */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Card Informativo do Envio Anterior */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-700" />
                Dados do Primeiro Envio Registrado:
              </span>
              <span className="text-[11px] font-mono text-amber-800 font-semibold">
                {new Date(duplicateRecord.uploadedAt).toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Arquivo Original</span>
                <span className="font-semibold text-slate-800 truncate block" title={duplicateRecord.fileName}>
                  {duplicateRecord.fileName}
                </span>
                <span className="text-[10px] text-slate-500">
                  {formatBytes(duplicateRecord.fileSize)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Arquivo Atual Selecionado</span>
                <span className="font-semibold text-slate-800 truncate block" title={currentFileName}>
                  {currentFileName}
                </span>
                {currentFileSize && (
                  <span className="text-[10px] text-slate-500">
                    {formatBytes(currentFileSize)}
                  </span>
                )}
              </div>
            </div>

            {/* Metadados específicos de NF-e */}
            {isNFe && (
              <div className="mt-3 pt-3 border-t border-amber-200/70 space-y-2 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {meta.nNF && (
                    <div className="bg-white p-2 rounded-lg border border-amber-200">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Nº NF-e</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {meta.nNF} {meta.serie ? `(Série ${meta.serie})` : ''}
                      </span>
                    </div>
                  )}

                  {meta.totalValue !== undefined && (
                    <div className="bg-white p-2 rounded-lg border border-amber-200">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Valor Total</span>
                      <span className="font-bold text-emerald-700 font-mono">
                        {formatBRL(meta.totalValue)}
                      </span>
                    </div>
                  )}

                  {meta.emissionDate && (
                    <div className="bg-white p-2 rounded-lg border border-amber-200 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Data Emissão</span>
                      <span className="font-semibold text-slate-800">
                        {meta.emissionDate}
                      </span>
                    </div>
                  )}
                </div>

                {meta.supplierName && (
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200 flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Fornecedor / Emitente</span>
                      <span className="font-bold text-slate-900">{meta.supplierName}</span>
                      {meta.supplierCnpj && (
                        <span className="text-[11px] text-slate-600 font-mono block">
                          CNPJ: {meta.supplierCnpj}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {meta.chNFe && (
                  <div className="bg-white p-2 rounded-lg border border-amber-200 flex items-center justify-between gap-2">
                    <div className="truncate">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Chave de Acesso</span>
                      <span className="font-mono text-[10px] text-slate-700 truncate block">
                        {meta.chNFe}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-600 shrink-0 cursor-pointer"
                      title="Copiar Chave da NF-e"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Metadados de Cadastro Geral */}
            {!isNFe && duplicateRecord.recordCount !== undefined && (
              <div className="bg-white p-2.5 rounded-lg border border-amber-200 flex items-center justify-between text-xs">
                <span className="text-slate-600">Registros Importados na Versão Anterior:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {duplicateRecord.recordCount} linhas
                </span>
              </div>
            )}
          </div>

          {/* Alerta de Riscos */}
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Atenção aos Riscos de Duplicidade:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-rose-800">
              {isNFe 
                ? 'Importar novamente a mesma NF-e pode somar estoques indevidamente e gerar uma nova Conta a Pagar duplicada no Financeiro.' 
                : 'Processar novamente a mesma planilha pode gerar cadastros duplicados no banco de dados.'
              }
            </p>
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Cancelar Upload (Recomendado)
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onProceedAnyway();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <span>Prosseguir Mesmo Assim</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
