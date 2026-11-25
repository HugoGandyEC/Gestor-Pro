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
  ShieldCheck,
  History
} from 'lucide-react';
import { PaymentReceipt } from '../types';
import { formatBRL, formatDateBR, useApp } from '../context/AppContext';
import {
  buildReceiptShareText,
  downloadReceiptPdf,
  RECEIPT_METHOD_LABELS
} from '../utils/receiptPdfGenerator';
import { getOsReceiptClassificationTitle } from '../utils/pixBrCode';
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

  const classificationTitle = getOsReceiptClassificationTitle(
    receipt.paymentKind,
    receipt.isFullyPaid
  );
  const isEntry = !receipt.isFullyPaid && receipt.paymentKind === 'entrada';

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
          title: `${classificationTitle} ${receipt.receiptNumber} - ${receipt.clientName}`,
          text: txt
        });
        return;
      } catch {}
    }
    await handleCopyText();
  };

  const originTitle =
    receipt.sourceType === 'os'
      ? `Ordem de Serviço Nº ${receipt.sourceCode}`
      : `Venda Direta Nº ${receipt.sourceCode}`;

  const originShortCode =
    receipt.sourceType === 'os'
      ? `OS Nº ${receipt.sourceCode}`
      : `VENDA Nº ${receipt.sourceCode}`;

  const companyDisplayName =
    companySettings.tradeName || companySettings.companyName || 'FIRE GESTÃO';
  const companyAddressLine =
    [
      [companySettings.street, companySettings.number].filter(Boolean).join(', '),
      companySettings.neighborhood,
      companySettings.city ? `${companySettings.city} / ${companySettings.state || ''}` : ''
    ]
      .filter(Boolean)
      .join(' - ') || 'Endereço Comercial Cadastrado';
  const companyContactLine = [
    companySettings.phone ? `Tel: ${companySettings.phone}` : '',
    companySettings.email ? `E-mail: ${companySettings.email}` : '',
    companySettings.cnpj ? `CNPJ: ${companySettings.cnpj}` : ''
  ]
    .filter(Boolean)
    .join(' | ');

  const priorHistory = receipt.previousPaymentsHistory || [];
  const hasPreviousPayments = priorHistory.length > 0 || receipt.previouslyPaid > 0.01;

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 backdrop-blur-xs p-2 sm:p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col border border-[#d8d8d8] overflow-hidden">
          {/* Top Modal Controls (Non-printable) */}
          <div className="no-print px-4 sm:px-6 py-3.5 bg-[#f4f5f6] border-b border-[#d8d8d8] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-[#363739]">
                    {classificationTitle}
                  </h2>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                    {receipt.receiptNumber}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                      receipt.isFullyPaid
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : isEntry
                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    {receipt.isFullyPaid
                      ? 'Quitado · R$ 0,00'
                      : isEntry
                      ? 'Entrada / Sinal'
                      : 'Pagamento Parcial'}
                  </span>
                </div>
                <p className="text-[11px] text-[#707174] truncate">
                  {originTitle} · Cliente: {receipt.clientName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg bg-white border border-[#d8d8d8] p-0.5">
                <button
                  type="button"
                  onClick={() => setFormatMode('a4')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md cursor-pointer transition-colors ${
                    formatMode === 'a4'
                      ? 'bg-slate-900 text-white'
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
                      ? 'bg-slate-900 text-white'
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
              /* ===================== FORMATO A4 (MESMO PADRÃO VISUAL DA OS) ===================== */
              <div
                id="printable-document"
                className="w-full max-w-[820px] bg-white text-[#1f2937] text-[10.5px] leading-tight font-sans p-5 sm:p-7 border border-slate-300 shadow-sm print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full space-y-3.5"
              >
                {/* Cabeçalho Padrão da OS: Logo + Empresa à Esquerda, Número da OS e Recibo à Direita */}
                <div className="flex items-start justify-between pb-3 border-b-2 border-slate-900 gap-4">
                  <div className="flex items-center gap-3.5">
                    {companySettings.logoUrl ? (
                      <img
                        src={companySettings.logoUrl}
                        alt={companyDisplayName}
                        className="max-h-16 max-w-[150px] object-contain shrink-0 rounded"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex flex-col items-center justify-center text-white shrink-0 shadow-xs border border-orange-600">
                        <span className="text-lg font-black leading-none">
                          {companyDisplayName.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="text-[7px] font-black tracking-widest uppercase mt-0.5 px-1 truncate max-w-full">
                          {companyDisplayName.slice(0, 8)}
                        </span>
                      </div>
                    )}

                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                        {companyDisplayName}
                      </h1>
                      {companySettings.companyName &&
                        companySettings.companyName !== companySettings.tradeName && (
                          <p className="text-[9.5px] text-slate-700 font-bold uppercase tracking-wider mt-1">
                            {companySettings.companyName}
                          </p>
                        )}
                      <p className="text-[9px] text-slate-600 font-medium uppercase tracking-wide mt-0.5">
                        {companyAddressLine}
                      </p>
                      {companyContactLine && (
                        <p className="text-[9.5px] text-slate-800 font-semibold mt-0.5">
                          {companyContactLine}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Box Destaque OS + Classificação do Recibo */}
                  <div className="border-2 border-slate-900 rounded-lg overflow-hidden bg-white text-center min-w-[210px] shrink-0 shadow-2xs">
                    <div className="bg-slate-900 text-white px-3 py-1 text-[9.5px] font-black uppercase tracking-widest">
                      {classificationTitle}
                    </div>
                    <div className="p-2 bg-slate-50">
                      <div className="text-lg font-black font-mono text-slate-900 tracking-wider">
                        {originShortCode}
                      </div>
                      <div className="text-[9px] font-mono font-bold text-slate-700 mt-0.5">
                        Recibo Nº {receipt.receiptNumber}
                      </div>
                      <div className="text-[8.5px] text-slate-600 font-semibold mt-0.5">
                        Data: {formattedDateTime}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banner de Classificação do Pagamento */}
                <div
                  className={`p-3.5 rounded-md border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    receipt.isFullyPaid
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                      : isEntry
                      ? 'bg-blue-50 border-blue-500 text-blue-950'
                      : 'bg-amber-50 border-amber-500 text-amber-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full text-white flex items-center justify-center shrink-0 ${
                        receipt.isFullyPaid
                          ? 'bg-emerald-600'
                          : isEntry
                          ? 'bg-blue-600'
                          : 'bg-amber-600'
                      }`}
                    >
                      {receipt.isFullyPaid ? (
                        <ShieldCheck className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-black uppercase tracking-wide flex items-center gap-1.5">
                        {receipt.isFullyPaid && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                        <span>{classificationTitle}</span>
                      </div>
                      <p className="text-[10.5px] font-medium mt-0.5 opacity-90">
                        {receipt.isFullyPaid
                          ? `Recebimento que liquida 100% do saldo devedor da ${originTitle}. Saldo restante: R$ 0,00.`
                          : isEntry
                          ? `Primeiro pagamento (Sinal / Entrada) registrado para a ${originTitle}.`
                          : `Pagamento parcial registrado para a ${originTitle}. Resta saldo em aberto.`}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <div className="text-[9px] font-bold uppercase opacity-75">
                      Valor Pago neste Lançamento
                    </div>
                    <div className="text-xl font-black font-mono tabular-nums">
                      {formatBRL(receipt.amountPaidNow)}
                    </div>
                  </div>
                </div>

                {/* Dados do Cliente & Referência da OS (2 colunas padrão OS) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-slate-300 rounded-sm overflow-hidden">
                    <div className="bg-[#eef3f8] px-2.5 py-1 border-b border-slate-300 font-bold text-[10px] text-slate-800 uppercase tracking-wide">
                      DADOS DO CLIENTE / PAGADOR
                    </div>
                    <div className="p-2.5 space-y-1 text-[11px]">
                      <div>
                        <span className="font-bold text-slate-700">NOME: </span>
                        <span className="font-semibold text-slate-900 uppercase">
                          {receipt.clientName}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-700">CPF/CNPJ: </span>
                          <span className="font-medium text-slate-800">
                            {receipt.clientDocument || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-700">TEL: </span>
                          <span className="font-medium text-slate-800">
                            {receipt.clientPhone || '-'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700">END.: </span>
                        <span className="text-slate-800">{receipt.clientAddress || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-300 rounded-sm overflow-hidden">
                    <div className="bg-[#eef3f8] px-2.5 py-1 border-b border-slate-300 font-bold text-[10px] text-slate-800 uppercase tracking-wide">
                      DADOS DO LANÇAMENTO &amp; REFERÊNCIA
                    </div>
                    <div className="p-2.5 space-y-1 text-[11px]">
                      <div>
                        <span className="font-bold text-slate-700">DOCUMENTO: </span>
                        <span className="font-bold text-slate-900">{originTitle}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-700">CLASSIFICAÇÃO: </span>
                          <span className="font-semibold text-slate-900">{classificationTitle}</span>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-700">DATA: </span>
                          <span className="text-slate-900">{formattedDateTime}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-700">OPERADOR: </span>
                          <span className="text-slate-900">{receipt.operatorName}</span>
                        </div>
                      </div>
                      {receipt.nsu && (
                        <div>
                          <span className="font-bold text-slate-700">AUTENTICAÇÃO / NSU: </span>
                          <span className="font-mono text-slate-900">{receipt.nsu}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Histórico de Pagamentos Anteriores (se houver) */}
                {hasPreviousPayments && (
                  <div className="border border-slate-300 rounded-sm overflow-hidden">
                    <div className="bg-[#eef3f8] px-2.5 py-1 border-b border-slate-300 font-bold text-[10px] text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-slate-700" />
                      HISTÓRICO DE PAGAMENTOS ANTERIORES
                    </div>
                    {priorHistory.length > 0 ? (
                      <table className="w-full text-left text-[10.5px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                          <tr>
                            <th className="p-1.5">DATA</th>
                            <th className="p-1.5">RECIBO / REFERÊNCIA</th>
                            <th className="p-1.5">FORMA DE PAGAMENTO</th>
                            <th className="p-1.5 text-right">VALOR PAGO</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {priorHistory.map((h, idx) => (
                            <tr key={idx}>
                              <td className="p-1.5 font-mono text-slate-700">
                                {formatDateBR(h.date.split('T')[0])}
                              </td>
                              <td className="p-1.5 font-medium text-slate-800">
                                {h.receiptNumber || 'Pagamento Anterior'}
                              </td>
                              <td className="p-1.5 text-slate-700">
                                {RECEIPT_METHOD_LABELS[h.method] || h.method}
                              </td>
                              <td className="p-1.5 text-right font-mono font-bold text-slate-900">
                                {formatBRL(h.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-2.5 flex items-center justify-between text-[11px]">
                        <span className="text-slate-700 font-medium">
                          Total de entradas / pagamentos registrados anteriormente nesta OS:
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatBRL(receipt.previouslyPaid)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Forma de Pagamento deste Lançamento + Demonstrativo Financeiro da OS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                  {/* Forma de Pagamento */}
                  <div className="border border-slate-300 rounded-sm overflow-hidden">
                    <div className="bg-[#eef3f8] px-2.5 py-1 border-b border-slate-300 font-bold text-[10px] text-slate-800 uppercase tracking-wide">
                      FORMA DE PAGAMENTO DESTE LANÇAMENTO
                    </div>
                    <div className="p-2.5 space-y-1.5 text-[11px]">
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
                          className="flex items-center justify-between py-1 border-b border-dashed border-slate-200 last:border-0"
                        >
                          <span className="font-semibold text-slate-800">
                            {RECEIPT_METHOD_LABELS[p.method] || p.method}
                            {p.cardBrand ? ` · ${p.cardBrand.toUpperCase()}` : ''}
                            {p.installments && p.installments > 1 ? ` (${p.installments}x)` : ''}
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            {formatBRL(p.amount)}
                          </span>
                        </div>
                      ))}

                      <div className="pt-1 text-[10px] text-slate-600 flex justify-between">
                        <span>Data do Pagamento:</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {formattedDateTime}
                        </span>
                      </div>

                      {receipt.amountReceived !== undefined && receipt.amountReceived > 0 && (
                        <div className="text-[10px] text-slate-600 flex justify-between font-mono">
                          <span>Entregue em Espécie:</span>
                          <span>{formatBRL(receipt.amountReceived)}</span>
                        </div>
                      )}
                      {receipt.changeAmount !== undefined && receipt.changeAmount > 0 && (
                        <div className="text-[10px] text-emerald-700 font-bold flex justify-between font-mono">
                          <span>Troco Devolvido:</span>
                          <span>{formatBRL(receipt.changeAmount)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Demonstrativo Financeiro Completo */}
                  <div className="border-2 border-slate-800 rounded-sm overflow-hidden">
                    <div className="bg-slate-900 text-white px-2.5 py-1 font-bold text-[10px] uppercase tracking-wide">
                      RESUMO FINANCEIRO DO RECIBO
                    </div>
                    <table className="w-full text-[11px] font-mono">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="p-1.5 font-sans font-semibold text-slate-700">
                            Valor Total da {receipt.sourceType === 'os' ? 'OS' : 'Venda'}
                          </td>
                          <td className="p-1.5 text-right font-bold text-slate-900">
                            {formatBRL(receipt.orderTotal)}
                          </td>
                        </tr>
                        {hasPreviousPayments && (
                          <tr className="border-b border-slate-200">
                            <td className="p-1.5 font-sans text-slate-700">
                              Pagamentos Anteriores
                            </td>
                            <td className="p-1.5 text-right text-slate-800">
                              {formatBRL(receipt.previouslyPaid)}
                            </td>
                          </tr>
                        )}
                        <tr className="border-b border-slate-300 bg-emerald-50 text-emerald-900">
                          <td className="p-1.5 font-sans font-black">
                            Valor Pago neste Lançamento
                          </td>
                          <td className="p-1.5 text-right font-black">
                            {formatBRL(receipt.amountPaidNow)}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="p-1.5 font-sans font-semibold text-slate-700">
                            Total Já Pago (Acumulado)
                          </td>
                          <td className="p-1.5 text-right font-bold text-slate-900">
                            {formatBRL(receipt.totalPaidAccumulated)}
                          </td>
                        </tr>
                        <tr
                          className={
                            receipt.isFullyPaid
                              ? 'bg-emerald-100 text-emerald-900 font-black'
                              : 'bg-rose-50 text-rose-800 font-black'
                          }
                        >
                          <td className="p-1.5 font-sans font-black">
                            Saldo Restante a Pagar
                          </td>
                          <td className="p-1.5 text-right font-black">
                            {formatBRL(receipt.isFullyPaid ? 0 : receipt.remainingBalance)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Itens / Serviços Vinculados (compacto) */}
                {receipt.items && receipt.items.length > 0 && (
                  <div className="border border-slate-300 rounded-sm overflow-hidden">
                    <div className="bg-[#eef3f8] px-2.5 py-1 border-b border-slate-300 font-bold text-[10px] text-slate-800 uppercase tracking-wide">
                      ITENS / SERVIÇOS REFERENTES À {originShortCode}
                    </div>
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                        <tr>
                          <th className="p-1.5">DESCRIÇÃO</th>
                          <th className="p-1.5 text-center w-14">QTD</th>
                          <th className="p-1.5 text-right w-24">UNITÁRIO</th>
                          <th className="p-1.5 text-right w-24">SUBTOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {receipt.items.map((item, idx) => (
                          <tr key={idx} className={item.kind === 'desconto' ? 'text-rose-700' : ''}>
                            <td className="p-1.5 font-medium text-slate-900">{item.name}</td>
                            <td className="p-1.5 text-center font-mono text-slate-700">
                              {item.quantity}
                            </td>
                            <td className="p-1.5 text-right font-mono text-slate-700">
                              {formatBRL(item.unitPrice)}
                            </td>
                            <td className="p-1.5 text-right font-mono font-bold text-slate-900">
                              {formatBRL(item.totalPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {receipt.notes && (
                  <div className="p-2.5 rounded-sm bg-slate-50 border border-slate-300 text-[10.5px] text-slate-700">
                    <strong>Observações:</strong> {receipt.notes}
                  </div>
                )}

                {/* Campos para Assinatura */}
                <div className="pt-6 border-t border-slate-300 page-break-inside-avoid">
                  <div className="grid grid-cols-2 gap-8 text-center">
                    <div className="flex flex-col items-center">
                      <div className="h-7 flex items-center justify-center font-serif italic text-slate-800 text-xs font-bold">
                        {companyDisplayName}
                      </div>
                      <div className="w-56 border-t border-slate-800 pt-1">
                        <div className="font-bold text-[10.5px] text-slate-900 uppercase">
                          {companyDisplayName}
                        </div>
                        <div className="text-[8.5px] text-slate-500">
                          Assinatura do Recebedor · Op.: {receipt.operatorName}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-7"></div>
                      <div className="w-56 border-t border-slate-800 pt-1">
                        <div className="font-bold text-[10.5px] text-slate-900 uppercase">
                          {receipt.clientName}
                        </div>
                        <div className="text-[8.5px] text-slate-500">
                          Assinatura do Cliente · {receipt.clientDocument || 'Pagador'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rodapé Padrão da OS */}
                <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-500 font-mono">
                  <span>{companyDisplayName.toUpperCase()}</span>
                  <span className="font-bold text-slate-800">
                    {classificationTitle.toUpperCase()} · {originShortCode} · {receipt.receiptNumber}
                  </span>
                  <span>COMPROVANTE DE PAGAMENTO</span>
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
                </div>

                <div className="text-center border-b border-dashed border-slate-400 pb-2 space-y-0.5">
                  <div className="font-bold text-xs uppercase">{classificationTitle}</div>
                  <div className="font-bold">{originShortCode}</div>
                  <div className="text-[10px]">Recibo Nº {receipt.receiptNumber}</div>
                  <div className="text-[10px] text-slate-600">{formattedDateTime}</div>
                </div>

                <div className="border-b border-dashed border-slate-400 pb-2 space-y-0.5 text-[10px]">
                  <div className="font-bold text-[11px]">CLIENTE: {receipt.clientName}</div>
                  <div>CPF/CNPJ: {receipt.clientDocument || '-'}</div>
                  <div>TEL: {receipt.clientPhone || '-'}</div>
                </div>

                {hasPreviousPayments && (
                  <div className="border-b border-dashed border-slate-400 pb-2 space-y-0.5 text-[10px]">
                    <div className="font-bold">PAGAMENTOS ANTERIORES:</div>
                    {priorHistory.length > 0 ? (
                      priorHistory.map((h, i) => (
                        <div key={i} className="flex justify-between">
                          <span>
                            {formatDateBR(h.date.split('T')[0])} · {RECEIPT_METHOD_LABELS[h.method]}
                          </span>
                          <span>{formatBRL(h.amount)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between">
                        <span>Acumulado anterior</span>
                        <span>{formatBRL(receipt.previouslyPaid)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-b border-dashed border-slate-400 pb-2 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>TOTAL {receipt.sourceType === 'os' ? 'OS' : 'VENDA'}:</span>
                    <span>{formatBRL(receipt.orderTotal)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs pt-0.5">
                    <span>PAGO AGORA:</span>
                    <span>{formatBRL(receipt.amountPaidNow)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>TOTAL PAGO:</span>
                    <span>{formatBRL(receipt.totalPaidAccumulated)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>SALDO RESTANTE:</span>
                    <span>{formatBRL(receipt.isFullyPaid ? 0 : receipt.remainingBalance)}</span>
                  </div>
                </div>

                <div
                  className={`border-2 rounded p-2 text-center font-extrabold text-[10.5px] uppercase ${
                    receipt.isFullyPaid
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                      : 'border-amber-600 bg-amber-50 text-amber-900'
                  }`}
                >
                  {receipt.isFullyPaid
                    ? 'QUITADO · SALDO R$ 0,00'
                    : `${classificationTitle} · FALTA ${formatBRL(receipt.remainingBalance)}`}
                </div>

                <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                  <div className="font-bold">FORMA DE PAGAMENTO:</div>
                  {(receipt.payments && receipt.payments.length > 0
                    ? receipt.payments
                    : [
                        {
                          id: '1',
                          method: receipt.paymentMethod,
                          amount: receipt.amountPaidNow,
                          netAmount: receipt.amountPaidNow
                        }
                      ]
                  ).map((p, i) => (
                    <div key={p.id || i} className="flex justify-between">
                      <span>{RECEIPT_METHOD_LABELS[p.method] || p.method}</span>
                      <span>{formatBRL(p.amount)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 text-center">
                  <div className="border-t border-slate-700 pt-1 text-[9.5px]">
                    Assinatura: {receipt.clientName}
                  </div>
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
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer"
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
                {copiedFeedback ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
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
                <span className="text-[11px] font-semibold text-emerald-700">
                  {copiedFeedback}
                </span>
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
