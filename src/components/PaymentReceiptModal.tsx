import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Receipt,
  FileText,
  User,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { PaymentReceipt } from '../types';
import { formatBRL, useApp } from '../context/AppContext';
import {
  buildReceiptShareText,
  downloadReceiptPdf,
  RECEIPT_KIND_LABELS,
  RECEIPT_METHOD_LABELS
} from '../utils/receiptPdfGenerator';
import { WhatsAppModal } from './WhatsAppModal';

interface PaymentReceiptModalProps {
  receipt: PaymentReceipt | null;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({ receipt, onClose }) => {
  const { companySettings } = useApp();
  const [formatMode, setFormatMode] = useState<'thermal' | 'a4'>('a4');
  const [copiedFeedback, setCopiedFeedback] = useState<string | null>(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  if (!receipt) return null;

  const formattedDateTime = (() => {
    const d = new Date(receipt.createdAt);
    if (Number.isNaN(d.getTime())) return receipt.createdAt;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  })();

  const handlePrint = () => {
    const isThermal = formatMode === 'thermal';
    let styleEl = document.getElementById('receipt-dynamic-page-style') as HTMLStyleElement | null;

    if (isThermal) {
      document.documentElement.classList.add('printing-receipt-thermal');
      document.body.classList.add('printing-receipt-thermal');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'receipt-dynamic-page-style';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = '@page { size: 80mm auto; margin: 2mm; }';
    } else {
      document.documentElement.classList.remove('printing-receipt-thermal');
      document.body.classList.remove('printing-receipt-thermal');
      if (styleEl) styleEl.remove();
    }

    const cleanup = () => {
      document.documentElement.classList.remove('printing-receipt-thermal');
      document.body.classList.remove('printing-receipt-thermal');
      const el = document.getElementById('receipt-dynamic-page-style');
      if (el) el.remove();
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 1500);
    }, 80);
  };

  const handleCopyText = async () => {
    const txt = buildReceiptShareText(receipt, companySettings);
    try {
      await navigator.clipboard.writeText(txt);
      setCopiedFeedback('Recibo copiado para a área de transferência!');
    } catch {
      setCopiedFeedback('Texto gerado com sucesso.');
    }
    setTimeout(() => setCopiedFeedback(null), 2600);
  };

  const handleQuickShare = async () => {
    const txt = buildReceiptShareText(receipt, companySettings);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Recibo ${receipt.receiptNumber} - ${receipt.clientName}`,
          text: txt
        });
        return;
      } catch {
        // Fallback to copy if share canceled/unsupported inside iframe
      }
    }
    await handleCopyText();
  };

  const originTitle =
    receipt.sourceType === 'os'
      ? `Ordem de Serviço Nº ${receipt.sourceCode}`
      : `Venda Direta Nº ${receipt.sourceCode}`;

  const companyDisplayName = companySettings.tradeName || companySettings.companyName || 'FIRE GESTÃO';

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 backdrop-blur-xs p-2 sm:p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col border border-[#d8d8d8] overflow-hidden">
          {/* Top Modal Controls (Non-printable) */}
          <div className="no-print px-4 sm:px-6 py-3.5 bg-[#f4f5f6] border-b border-[#d8d8d8] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-[#363739]">
                    Recibo de Pagamento
                  </h2>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#53383e] text-white">
                    {receipt.receiptNumber}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                      receipt.isFullyPaid
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    {receipt.isFullyPaid ? 'Quitado' : 'Parcial · Saldo Aberto'}
                  </span>
                </div>
                <p className="text-[11px] text-[#707174] truncate">
                  Gerado automaticamente · {originTitle} · Operador: {receipt.operatorName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Format Switcher: Thermal 80mm vs A4 */}
              <div className="inline-flex rounded-lg bg-white border border-[#d8d8d8] p-0.5">
                <button
                  type="button"
                  onClick={() => setFormatMode('a4')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md cursor-pointer transition-colors ${
                    formatMode === 'a4'
                      ? 'bg-[#53383e] text-white'
                      : 'text-[#5a5b5e] hover:bg-[#f4f5f6]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Folha A4</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormatMode('thermal')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md cursor-pointer transition-colors ${
                    formatMode === 'thermal'
                      ? 'bg-[#53383e] text-white'
                      : 'text-[#5a5b5e] hover:bg-[#f4f5f6]'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Térmica 80mm</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-[#707174] hover:text-[#363739] hover:bg-white rounded-lg cursor-pointer"
                title="Fechar recibo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Printable Preview Area */}
          <div className="flex-1 overflow-y-auto bg-slate-100 p-3 sm:p-6 flex justify-center">
            {formatMode === 'a4' ? (
              /* ===================== FORMATO A4 COMPLETO ===================== */
              <div
                id="printable-document"
                className="w-full max-w-[740px] bg-white border border-slate-200 rounded-xl shadow-sm p-5 sm:p-7 space-y-5 text-xs text-slate-800"
              >
                {/* Cabeçalho da Empresa + Número do Recibo */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b-2 border-[#53383e]">
                  <div className="flex items-start gap-3">
                    {companySettings.logoUrl && (
                      <img
                        src={companySettings.logoUrl}
                        alt={companyDisplayName}
                        className="w-12 h-12 object-contain rounded-lg border border-slate-200 bg-white p-1 shrink-0"
                      />
                    )}
                    <div className="space-y-0.5">
                      <h3 className="text-base font-black text-[#363739] tracking-tight">
                        {companyDisplayName}
                      </h3>
                      {companySettings.companyName && companySettings.companyName !== companyDisplayName && (
                        <p className="text-[11px] text-slate-500">{companySettings.companyName}</p>
                      )}
                      <p className="text-[11px] text-slate-600 font-mono">
                        {companySettings.cnpj ? `CNPJ: ${companySettings.cnpj}` : ''}
                        {companySettings.phone ? ` · Tel: ${companySettings.phone}` : ''}
                      </p>
                      {(companySettings.street || companySettings.city) && (
                        <p className="text-[11px] text-slate-500">
                          {[companySettings.street, companySettings.number, companySettings.neighborhood]
                            .filter(Boolean)
                            .join(', ')}
                          {companySettings.city ? ` - ${companySettings.city}/${companySettings.state}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="sm:text-right bg-[#f6eff1] border border-[#53383e]/25 rounded-xl px-4 py-2.5 shrink-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#53383e]">
                      Recibo de Pagamento
                    </div>
                    <div className="text-lg font-black font-mono text-[#363739]">
                      {receipt.receiptNumber}
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono">{formattedDateTime}</div>
                  </div>
                </div>

                {/* Carimbo / Controle de Quitação ou Saldo Restante */}
                {receipt.isFullyPaid ? (
                  <div className="relative overflow-hidden p-4 rounded-xl bg-emerald-50 border-2 border-emerald-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border-2 border-emerald-700 text-emerald-900 font-black tracking-wider text-xs uppercase bg-white/90 shadow-2xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>QUITADO / INTEGRALMENTE PAGO</span>
                        </div>
                        <p className="text-[11px] text-emerald-800 mt-1 font-medium">
                          Operação liquidada em sua totalidade. Nenhum saldo devedor pendente.
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right shrink-0">
                      <div className="text-[10px] font-bold uppercase text-emerald-700">Valor Quitado</div>
                      <div className="text-xl font-black font-mono tabular-nums text-emerald-900">
                        {formatBRL(receipt.amountPaidNow)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-400 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 border border-amber-400 text-amber-900 font-extrabold uppercase text-[11px]">
                        <AlertCircle className="w-4 h-4 text-amber-700" />
                        <span>Pagamento Parcial · {RECEIPT_KIND_LABELS[receipt.paymentKind]}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-900">
                        Operação possui saldo restante em aberto
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-2.5 rounded-lg bg-white border border-amber-200">
                        <div className="text-[10px] font-bold uppercase text-slate-500">Valor Total</div>
                        <div className="text-sm font-black font-mono tabular-nums text-slate-900 mt-0.5">
                          {formatBRL(receipt.orderTotal)}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300">
                        <div className="text-[10px] font-bold uppercase text-emerald-700">Pago Agora</div>
                        <div className="text-sm font-black font-mono tabular-nums text-emerald-800 mt-0.5">
                          {formatBRL(receipt.amountPaidNow)}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                        <div className="text-[10px] font-bold uppercase text-slate-500">Total Já Pago</div>
                        <div className="text-sm font-bold font-mono tabular-nums text-slate-800 mt-0.5">
                          {formatBRL(receipt.totalPaidAccumulated)}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-rose-50 border-2 border-rose-300">
                        <div className="text-[10px] font-bold uppercase text-rose-700">Falta Restante</div>
                        <div className="text-sm font-black font-mono tabular-nums text-rose-700 mt-0.5">
                          {formatBRL(receipt.remainingBalance)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dados Completos do Cliente & Origem */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#53383e]">
                      <User className="w-3.5 h-3.5" />
                      <span>Dados do Cliente / Pagador</span>
                    </div>
                    <div className="font-bold text-sm text-slate-900">{receipt.clientName}</div>
                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <div>
                        <span className="font-semibold text-slate-700">CPF / CNPJ:</span>{' '}
                        <span className="font-mono">{receipt.clientDocument || 'Não informado'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Telefone:</span>{' '}
                        <span className="font-mono">{receipt.clientPhone || 'Não informado'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Endereço:</span>{' '}
                        <span>{receipt.clientAddress || 'Não informado'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#53383e]">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Detalhes da Origem & Caixa</span>
                    </div>
                    <div className="font-bold text-sm text-slate-900">{originTitle}</div>
                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <div>
                        <span className="font-semibold text-slate-700">Modalidade:</span>{' '}
                        <span>{RECEIPT_KIND_LABELS[receipt.paymentKind]}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Operador do Caixa:</span>{' '}
                        <span>{receipt.operatorName}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Terminal / Sessão:</span>{' '}
                        <span>
                          {receipt.terminalName}
                          {receipt.cashSessionCode ? ` (${receipt.cashSessionCode})` : ''}
                        </span>
                      </div>
                      {receipt.nsu && (
                        <div>
                          <span className="font-semibold text-slate-700">Autenticação / NSU:</span>{' '}
                          <span className="font-mono">{receipt.nsu}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Itens e Serviços da Operação */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Itens / Serviços Vinculados ({originTitle})
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Descrição</th>
                          <th className="py-2 px-2 text-center w-14">Qtd</th>
                          <th className="py-2 px-3 text-right w-24">Unitário</th>
                          <th className="py-2 px-3 text-right w-24">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {receipt.items.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-3 px-3 text-slate-500 text-center">
                              {originTitle}
                            </td>
                          </tr>
                        ) : (
                          receipt.items.map((item, idx) => (
                            <tr key={idx} className={item.kind === 'desconto' ? 'text-rose-600' : ''}>
                              <td className="py-2 px-3 font-medium">{item.name}</td>
                              <td className="py-2 px-2 text-center font-mono tabular-nums">{item.quantity}</td>
                              <td className="py-2 px-3 text-right font-mono tabular-nums">
                                {formatBRL(item.unitPrice)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold">
                                {formatBRL(item.totalPrice)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Formas de Pagamento + Resumo Final */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Forma(s) de Pagamento Utilizada(s)
                    </div>
                    <div className="space-y-1.5">
                      {(receipt.payments && receipt.payments.length > 0
                        ? receipt.payments
                        : [
                            {
                              id: 'main',
                              method: receipt.paymentMethod,
                              amount: receipt.amountPaidNow,
                              netAmount: receipt.amountPaidNow
                            }
                          ]
                      ).map((p, idx) => (
                        <div
                          key={p.id || idx}
                          className="flex items-center justify-between text-xs py-1 border-b border-dashed border-slate-200 last:border-0"
                        >
                          <span className="font-semibold text-slate-700">
                            {RECEIPT_METHOD_LABELS[p.method] || p.method}
                            {p.cardBrand ? ` · ${p.cardBrand.toUpperCase()}` : ''}
                            {p.installments && p.installments > 1 ? ` (${p.installments}x)` : ''}
                          </span>
                          <span className="font-mono font-bold tabular-nums text-slate-900">
                            {formatBRL(p.amount)}
                          </span>
                        </div>
                      ))}
                      {receipt.amountReceived !== undefined && receipt.amountReceived > 0 && (
                        <div className="pt-1 text-[11px] text-slate-600 flex justify-between font-mono">
                          <span>Entregue em Espécie:</span>
                          <span>{formatBRL(receipt.amountReceived)}</span>
                        </div>
                      )}
                      {receipt.changeAmount !== undefined && receipt.changeAmount > 0 && (
                        <div className="text-[11px] text-emerald-700 font-bold flex justify-between font-mono">
                          <span>Troco Devolvido:</span>
                          <span>{formatBRL(receipt.changeAmount)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#f6eff1] border border-[#53383e]/30 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-700">
                      <span>Valor Total da Operação:</span>
                      <span className="font-mono font-semibold tabular-nums">
                        {formatBRL(receipt.orderTotal)}
                      </span>
                    </div>
                    {receipt.previouslyPaid > 0 && (
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Pago Anteriormente:</span>
                        <span className="font-mono tabular-nums">{formatBRL(receipt.previouslyPaid)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black text-[#53383e] pt-1 border-t border-[#53383e]/20">
                      <span>VALOR PAGO AGORA:</span>
                      <span className="font-mono tabular-nums">{formatBRL(receipt.amountPaidNow)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-700">
                      <span>Total Já Pago (Acumulado):</span>
                      <span className="font-mono font-bold tabular-nums">
                        {formatBRL(receipt.totalPaidAccumulated)}
                      </span>
                    </div>
                    <div
                      className={`flex justify-between text-xs font-black pt-1 border-t border-[#53383e]/20 ${
                        receipt.isFullyPaid ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      <span>{receipt.isFullyPaid ? 'SALDO RESTANTE:' : 'SALDO DEVEDOR RESTANTE:'}</span>
                      <span className="font-mono tabular-nums">{formatBRL(receipt.remainingBalance)}</span>
                    </div>
                  </div>
                </div>

                {receipt.notes && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                    <strong>Observações:</strong> {receipt.notes}
                  </div>
                )}

                {/* Assinaturas */}
                <div className="grid grid-cols-2 gap-6 pt-6 text-center text-[11px] text-slate-500">
                  <div>
                    <div className="border-t border-slate-400 pt-1.5 font-semibold text-slate-700">
                      {companyDisplayName}
                    </div>
                    <div>Operador: {receipt.operatorName}</div>
                  </div>
                  <div>
                    <div className="border-t border-slate-400 pt-1.5 font-semibold text-slate-700">
                      {receipt.clientName}
                    </div>
                    <div>{receipt.clientDocument || 'Recebedor / Cliente'}</div>
                  </div>
                </div>
              </div>
            ) : (
              /* ===================== FORMATO CUPOM TÉRMICO 80MM ===================== */
              <div
                id="printable-document"
                className="w-full max-w-[330px] bg-white border border-dashed border-slate-400 rounded-lg shadow-sm p-4 font-mono text-[11px] text-slate-900 space-y-2.5 leading-snug"
              >
                <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                  <div className="font-bold text-xs uppercase">{companyDisplayName}</div>
                  {companySettings.cnpj && <div className="text-[10px]">CNPJ: {companySettings.cnpj}</div>}
                  {companySettings.phone && <div className="text-[10px]">Tel: {companySettings.phone}</div>}
                  {(companySettings.street || companySettings.city) && (
                    <div className="text-[10px]">
                      {[companySettings.street, companySettings.number, companySettings.neighborhood]
                        .filter(Boolean)
                        .join(', ')}
                      {companySettings.city ? ` - ${companySettings.city}/${companySettings.state}` : ''}
                    </div>
                  )}
                </div>

                <div className="text-center border-b border-dashed border-slate-400 pb-2 space-y-0.5">
                  <div className="font-bold text-xs">RECIBO DE PAGAMENTO</div>
                  <div className="font-bold">Nº {receipt.receiptNumber}</div>
                  <div className="text-[10px] text-slate-600">{formattedDateTime}</div>
                  <div className="text-[10px] text-slate-600">
                    {receipt.terminalName} · Op: {receipt.operatorName}
                  </div>
                </div>

                {/* Dados do Cliente */}
                <div className="border-b border-dashed border-slate-400 pb-2 space-y-0.5 text-[10px]">
                  <div className="font-bold text-[11px]">CLIENTE: {receipt.clientName}</div>
                  <div>CPF/CNPJ: {receipt.clientDocument || 'Não informado'}</div>
                  <div>TEL: {receipt.clientPhone || 'Não informado'}</div>
                  <div>END: {receipt.clientAddress || 'Não informado'}</div>
                </div>

                {/* Origem e Itens */}
                <div className="border-b border-dashed border-slate-400 pb-2 space-y-1">
                  <div className="font-bold text-[10px]">
                    ORIGEM: {receipt.sourceType === 'os' ? 'O.S.' : 'VENDA'} {receipt.sourceCode}
                  </div>
                  <div className="text-[10px] uppercase text-slate-600">
                    {RECEIPT_KIND_LABELS[receipt.paymentKind]}
                  </div>
                  <div className="space-y-0.5 pt-1">
                    {receipt.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between gap-2 text-[10px]">
                        <span className="truncate">
                          {it.quantity}x {it.name}
                        </span>
                        <span className="shrink-0 font-semibold">{formatBRL(it.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Controle Financeiro & Saldo */}
                <div className="border-b border-dashed border-slate-400 pb-2 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>TOTAL OPERAÇÃO:</span>
                    <span>{formatBRL(receipt.orderTotal)}</span>
                  </div>
                  {receipt.previouslyPaid > 0 && (
                    <div className="flex justify-between text-[10px]">
                      <span>JÁ PAGO ANTES:</span>
                      <span>{formatBRL(receipt.previouslyPaid)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xs pt-0.5">
                    <span>VALOR PAGO AGORA:</span>
                    <span>{formatBRL(receipt.amountPaidNow)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>TOTAL ACUMULADO:</span>
                    <span>{formatBRL(receipt.totalPaidAccumulated)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>{receipt.isFullyPaid ? 'SALDO RESTANTE:' : 'FALTA RESTANTE:'}</span>
                    <span>{formatBRL(receipt.remainingBalance)}</span>
                  </div>
                </div>

                {/* Carimbo / Selo */}
                {receipt.isFullyPaid ? (
                  <div className="border-2 border-emerald-700 bg-emerald-50 text-emerald-900 rounded p-2 text-center font-extrabold text-[11px] tracking-wide">
                    *** QUITADO / INTEGRALMENTE PAGO ***
                  </div>
                ) : (
                  <div className="border-2 border-amber-600 bg-amber-50 text-amber-900 rounded p-2 text-center font-bold text-[10px]">
                    PAGAMENTO PARCIAL · SALDO A RECEBER: {formatBRL(receipt.remainingBalance)}
                  </div>
                )}

                {/* Pagamentos */}
                <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                  <div className="font-bold">FORMA(S) DE PAGAMENTO:</div>
                  {(receipt.payments && receipt.payments.length > 0
                    ? receipt.payments
                    : [{ id: '1', method: receipt.paymentMethod, amount: receipt.amountPaidNow, netAmount: receipt.amountPaidNow }]
                  ).map((p, i) => (
                    <div key={p.id || i} className="flex justify-between">
                      <span>{RECEIPT_METHOD_LABELS[p.method] || p.method}</span>
                      <span>{formatBRL(p.amount)}</span>
                    </div>
                  ))}
                  {receipt.changeAmount !== undefined && receipt.changeAmount > 0 && (
                    <div className="flex justify-between font-bold">
                      <span>TROCO:</span>
                      <span>{formatBRL(receipt.changeAmount)}</span>
                    </div>
                  )}
                  {receipt.nsu && <div>NSU / AUT: {receipt.nsu}</div>}
                </div>

                <div className="text-center text-[10px] text-slate-600 pt-1">
                  Obrigado pela preferência!
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Bar (Non-printable) */}
          <div className="no-print px-4 sm:px-6 py-3.5 bg-white border-t border-[#d8d8d8] flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir ({formatMode === 'thermal' ? 'Térmica 80mm' : 'Folha A4'})</span>
              </button>

              <button
                type="button"
                onClick={() => downloadReceiptPdf(receipt, companySettings, formatMode)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#363739] bg-[#f4f5f6] hover:bg-[#e5e6e8] border border-[#d8d8d8] rounded-lg cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar PDF ({formatMode === 'thermal' ? '80mm' : 'A4'})</span>
              </button>

              <button
                type="button"
                onClick={handleQuickShare}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#363739] bg-[#f4f5f6] hover:bg-[#e5e6e8] border border-[#d8d8d8] rounded-lg cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Compartilhar</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#363739] bg-white hover:bg-[#f4f5f6] border border-[#d8d8d8] rounded-lg cursor-pointer"
              >
                {copiedFeedback ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedFeedback ? 'Copiado!' : 'Copiar'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsWhatsAppOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {copiedFeedback && (
                <span className="text-[11px] font-semibold text-emerald-700">{copiedFeedback}</span>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-[#363739] bg-[#f4f5f6] hover:bg-[#e5e6e8] border border-[#d8d8d8] rounded-lg cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Modal with pre-populated Receipt Summary */}
      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        recipientPhone={receipt.clientPhone || ''}
        recipientName={receipt.clientName}
        defaultTemplateId="comprovante_pdv"
        initialCustomMessage={buildReceiptShareText(receipt, companySettings)}
      />
    </>
  );
};
