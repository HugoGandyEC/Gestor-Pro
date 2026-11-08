import React from 'react';
import { ShieldCheck, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  SYSTEM_VERSION, 
  SYSTEM_BUILD, 
  SYSTEM_AUTHOR, 
  SYSTEM_NAME 
} from '../constants/version';

interface SystemFooterProps {
  onOpenDoc?: () => void;
}

export const SystemFooter: React.FC<SystemFooterProps> = ({ onOpenDoc }) => {
  const { companySettings } = useApp();

  return (
    <footer className="mt-8 pt-4 pb-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
      {/* Esquerda: Identificação do Sistema e Versionamento */}
      <div className="flex items-center gap-2 flex-wrap text-center sm:text-left justify-center sm:justify-start">
        <span className="font-bold text-slate-800 tracking-tight">
          {SYSTEM_NAME}
        </span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200/90 text-slate-800 border border-slate-300 shadow-2xs">
          {SYSTEM_VERSION}
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          (Build {SYSTEM_BUILD})
        </span>
        <span className="text-slate-300 hidden sm:inline">·</span>
        <span className="text-slate-600 text-[11px]">
          Desenvolvido por <strong className="text-slate-900 font-extrabold tracking-wider">{SYSTEM_AUTHOR}</strong>
        </span>
      </div>

      {/* Direita: Empresa, Status de Conexão e Atalhos */}
      <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap justify-center sm:justify-end">
        <span className="text-slate-600 font-medium truncate max-w-xs">
          {companySettings.tradeName || companySettings.companyName || 'GestãoPro'}
        </span>
        <span className="text-slate-300">·</span>
        <span className="flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Online · HTTPS</span>
        </span>
        {onOpenDoc && (
          <button
            type="button"
            onClick={onOpenDoc}
            className="text-slate-500 hover:text-slate-900 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3 h-3 text-slate-400" />
            <span>Manual & Funções</span>
          </button>
        )}
      </div>
    </footer>
  );
};
