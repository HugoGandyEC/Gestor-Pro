import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DetailModalField {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}

export interface DetailModalSection {
  heading: string;
  fields: DetailModalField[];
}

interface RecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  statusText?: string;
  statusClassName?: string;
  sections: DetailModalSection[];
  customContent?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Modal global padronizada para exibição de todos os detalhes de um registro
 * aberta ao clicar no botão (+) da listagem abreviada em linha única.
 */
export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  statusText,
  statusClassName,
  sections,
  customContent,
  actions
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 sm:p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3 bg-slate-50/70 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-base leading-snug">{title}</h3>
              {statusText && (
                <span className={`text-xs font-semibold ${statusClassName || 'text-slate-600'}`}>
                  · {statusText}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Fechar (Esc)"
            aria-label="Fechar detalhes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {sections.map((section, sIdx) => {
            const validFields = section.fields.filter(
              f => f.value !== undefined && f.value !== null && f.value !== ''
            );
            if (validFields.length === 0) return null;

            return (
              <div
                key={sIdx}
                className={sIdx > 0 ? 'pt-4 border-t border-slate-100' : ''}
              >
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  {section.heading}
                </h4>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  {validFields.map((field, fIdx) => (
                    <div
                      key={fIdx}
                      className={field.fullWidth ? 'sm:col-span-2' : ''}
                    >
                      <dt className="text-[11px] text-slate-500 font-medium">{field.label}</dt>
                      <dd className="text-slate-900 font-semibold mt-0.5 break-words tabular-nums">
                        {field.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            );
          })}

          {customContent && (
            <div className="pt-4 border-t border-slate-100">{customContent}</div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">{actions}</div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer ml-auto"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
