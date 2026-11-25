import React from 'react';
import { CheckCircle2, Receipt, X } from 'lucide-react';
import { PendingReceiptPrompt } from '../types';
import { formatBRL } from '../context/AppContext';

interface OsPaymentReceiptPromptModalProps {
  prompt: PendingReceiptPrompt | null;
  onConfirm: () => void;
  onDismiss: () => void;
}

export const OsPaymentReceiptPromptModal: React.FC<OsPaymentReceiptPromptModalProps> = ({
  prompt,
  onConfirm,
  onDismiss,
}) => {
  if (!prompt) return null;

  const { receipt, classificationLabel, receiptTitle } = prompt;
  const badgeTone =
    classificationLabel === 'Quitação'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
      : classificationLabel === 'Entrada'
      ? 'bg-blue-100 text-blue-800 border-blue-300'
      : 'bg-amber-100 text-amber-800 border-amber-300';

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">
                  Lançamento Financeiro Registrado
                </h3>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${badgeTone}`}>
                  {classificationLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ordem de Serviço Nº <strong>{receipt.sourceCode}</strong> · {receipt.clientName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-800 leading-relaxed">
            Identificamos um lançamento de{' '}
            <strong className="text-slate-950">{classificationLabel}</strong> no valor de{' '}
            <strong className="font-mono text-emerald-700">{formatBRL(receipt.amountPaidNow)}</strong>.{' '}
            Deseja gerar o <strong>Recibo de Pagamento</strong> agora?
          </p>

          {/* Resumo Rápido */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-500">Total da OS</div>
              <div className="font-mono font-bold text-slate-900 mt-0.5">
                {formatBRL(receipt.orderTotal)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-emerald-700">Pago Agora</div>
              <div className="font-mono font-bold text-emerald-700 mt-0.5">
                {formatBRL(receipt.amountPaidNow)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-500">Saldo Restante</div>
              <div
                className={`font-mono font-bold mt-0.5 ${
                  receipt.remainingBalance > 0.01 ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {formatBRL(receipt.remainingBalance)}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              Documento pronto: <strong>{receiptTitle}</strong> ({receipt.receiptNumber}). Mesmo escolhendo &ldquo;Não&rdquo;, o recibo fica salvo no histórico da OS.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            Não
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>Sim, Gerar Recibo Agora</span>
          </button>
        </div>
      </div>
    </div>
  );
};
