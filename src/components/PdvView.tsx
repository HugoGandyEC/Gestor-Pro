import React, { useMemo, useState } from 'react';
import {
  Store,
  CreditCard,
  QrCode,
  Banknote,
  FileText,
  Plus,
  Minus,
  Trash2,
  Search,
  Check,
  CheckCircle2,
  Printer,
  Download,
  Lock,
  Unlock,
  ArrowUpCircle,
  ArrowDownCircle,
  ShoppingBag,
  Wrench,
  Clock,
  Receipt,
  X,
  Copy,
  History,
  Split,
  Calculator
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../context/AppContext';
import {
  CardBrand,
  CashRegisterMovement,
  DirectSale,
  PaymentMethod,
  PaymentSplit,
  Product,
  ServiceOrder
} from '../types';

type PdvSubTab = 'fila' | 'balcao' | 'movimentacoes' | 'fechamentos';
type QueueFilter = 'todos' | 'enviados' | 'os' | 'vendas';

interface CheckoutTarget {
  kind: 'sale' | 'order';
  id: string;
  code: string;
  clientId?: string;
  clientName: string;
  total: number;
  terminalName?: string;
  summaryLines: { label: string; qty: number; total: number }[];
  saleObj?: DirectSale;
  orderObj?: ServiceOrder;
}

const TERMINALS = [
  'Caixa 01 - Balcão Principal',
  'Caixa 02 - Vendas Rápidas / Atacado',
  'Caixa 03 - Retirada & Assistência Técnica',
  'PDV Móvel - Maquininha Campo'
];

const METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  boleto: 'Boleto Bancário',
  faturado_30d: 'Faturado 30d'
};

const BRANDS: { id: CardBrand; label: string }[] = [
  { id: 'visa', label: 'Visa' },
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'elo', label: 'Elo' },
  { id: 'hipercard', label: 'Hipercard' },
  { id: 'outra', label: 'Outra' }
];

export const PdvView: React.FC = () => {
  const {
    serviceOrders,
    directSales,
    clients,
    products,
    employees,
    cardRates,
    cardOperators,
    companySettings,
    currentUser,
    cashSessions,
    cashMovements,
    activeCashSession,
    openCashSession,
    closeCashSession,
    addCashManualMovement,
    addDirectSale,
    settleSaleInPdv,
    settleServiceOrderInPdv
  } = useApp();

  const [subTab, setSubTab] = useState<PdvSubTab>('fila');
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('todos');
  const [queueSearch, setQueueSearch] = useState('');

  // Open / Close / Supply / Bleed Modals
  const [isOpenSessionModalOpen, setIsOpenSessionModalOpen] = useState(false);
  const [openTerminal, setOpenTerminal] = useState(TERMINALS[0]);
  const [openBalanceInput, setOpenBalanceInput] = useState('200');
  const [openNotes, setOpenNotes] = useState('');

  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
  const [closeCountedCash, setCloseCountedCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  const [manualMoveType, setManualMoveType] = useState<'suprimento' | 'sangria' | null>(null);
  const [manualMoveAmount, setManualMoveAmount] = useState('');
  const [manualMoveDesc, setManualMoveDesc] = useState('');

  // Checkout Modal State
  const [checkoutTarget, setCheckoutTarget] = useState<CheckoutTarget | null>(null);
  const [isMultiSplit, setIsMultiSplit] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('pix');
  const [cardBrand, setCardBrand] = useState<CardBrand>('visa');
  const [installments, setInstallments] = useState(1);
  const [cashReceived, setCashReceived] = useState('');
  const [nsuCode, setNsuCode] = useState('');
  const [splits, setSplits] = useState<PaymentSplit[]>([]);
  const [copiedPix, setCopiedPix] = useState(false);

  // Receipt Modal after settlement
  const [receiptMovement, setReceiptMovement] = useState<CashRegisterMovement | null>(null);

  // Balcao POS Quick Sale State
  const [posSearch, setPosSearch] = useState('');
  const [posClientSearch, setPosClientSearch] = useState('');
  const [posPriceType, setPosPriceType] = useState<'varejo' | 'atacado'>('varejo');
  const [posClientId, setPosClientId] = useState('');
  const [posEmployeeId, setPosEmployeeId] = useState(employees[0]?.id || '');
  const [posDiscountType, setPosDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [posDiscountValue, setPosDiscountValue] = useState(0);
  const [posCart, setPosCart] = useState<{ product: Product; quantity: number; unitPrice: number }[]>([]);
  const [posFeedback, setPosFeedback] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const selectedPosClient = useMemo(
    () => clients.find(c => c.id === posClientId) || null,
    [clients, posClientId]
  );
  const isPosWholesaleUnlocked = selectedPosClient?.customerType === 'atacado';
  const effectivePosPriceType: 'varejo' | 'atacado' = isPosWholesaleUnlocked ? posPriceType : 'varejo';

  const filteredPosClients = useMemo(() => {
    const q = posClientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        (c.tradeName || '').toLowerCase().includes(q) ||
        (c.document || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q)
    );
  }, [clients, posClientSearch]);

  // Calculations for Active Session
  const activeSessionMoves = useMemo(() => {
    if (!activeCashSession) return [];
    return cashMovements.filter(m => m.sessionId === activeCashSession.id);
  }, [cashMovements, activeCashSession]);

  const sessionStats = useMemo(() => {
    let expectedCash = activeCashSession ? activeCashSession.openingBalance : 0;
    let totalReceived = 0;
    let totalFees = 0;
    let totalSuprimento = 0;
    let totalSangria = 0;
    const byMethod: Record<PaymentMethod, number> = {
      pix: 0,
      dinheiro: 0,
      cartao_credito: 0,
      cartao_debito: 0,
      boleto: 0,
      faturado_30d: 0
    };

    activeSessionMoves.forEach(m => {
      if (m.type === 'suprimento') {
        totalSuprimento += m.grossAmount;
        if (m.paymentMethod === 'dinheiro') expectedCash += m.grossAmount;
      } else if (m.type === 'sangria') {
        totalSangria += m.grossAmount;
        if (m.paymentMethod === 'dinheiro') expectedCash -= m.grossAmount;
      } else if (m.type === 'recebimento_venda' || m.type === 'recebimento_os') {
        totalReceived += m.grossAmount;
        totalFees += m.feeAmount || 0;
        if (m.payments && m.payments.length > 0) {
          m.payments.forEach(p => {
            byMethod[p.method] = (byMethod[p.method] || 0) + Number(p.amount || 0);
            if (p.method === 'dinheiro') expectedCash += Number(p.amount || 0);
          });
        } else {
          byMethod[m.paymentMethod] = (byMethod[m.paymentMethod] || 0) + m.grossAmount;
          if (m.paymentMethod === 'dinheiro') expectedCash += m.grossAmount;
        }
      }
    });

    return { expectedCash, totalReceived, totalFees, totalSuprimento, totalSangria, byMethod };
  }, [activeCashSession, activeSessionMoves]);

  // Unified Pending Queue (Service Orders + Direct Sales with paymentStatus !== 'pago')
  const pendingQueue = useMemo(() => {
    const items: {
      kind: 'sale' | 'order';
      id: string;
      code: string;
      clientId?: string;
      clientName: string;
      date: string;
      total: number;
      sentToPdvAt?: string;
      pdvTerminal?: string;
      statusLabel: string;
      summaryLines: { label: string; qty: number; total: number }[];
      rawSale?: DirectSale;
      rawOrder?: ServiceOrder;
    }[] = [];

    serviceOrders
      .filter(o => o.paymentStatus !== 'pago' && o.status !== 'cancelada')
      .forEach(o => {
        const srvTotal = (o.services || []).reduce((a, s) => a + Number(s.price || 0), 0);
        const prtTotal = (o.parts || []).reduce((a, p) => a + Number(p.price || 0) * Number(p.quantity || 1), 0);
        const total = Math.max(0, srvTotal + prtTotal + Number(o.visitFee || 0) - Number(o.calculatedDiscount || 0));

        const lines: { label: string; qty: number; total: number }[] = [
          ...(o.services || []).map(s => ({ label: `Serviço: ${s.name}`, qty: 1, total: Number(s.price || 0) })),
          ...(o.parts || []).map(p => ({ label: p.name, qty: Number(p.quantity || 1), total: Number(p.price || 0) * Number(p.quantity || 1) }))
        ];
        if (Number(o.visitFee || 0) > 0) {
          lines.push({ label: 'Taxa de Visita Técnica', qty: 1, total: Number(o.visitFee || 0) });
        }

        items.push({
          kind: 'order',
          id: o.id,
          code: o.code,
          clientId: o.clientId,
          clientName: o.clientName,
          date: o.openDate,
          total,
          sentToPdvAt: o.sentToPdvAt,
          pdvTerminal: o.pdvTerminal,
          statusLabel: o.type === 'orcamento' ? 'Orçamento' : 'Ordem de Serviço',
          summaryLines: lines,
          rawOrder: o
        });
      });

    directSales
      .filter(s => s.paymentStatus !== 'pago')
      .forEach(s => {
        items.push({
          kind: 'sale',
          id: s.id,
          code: s.code,
          clientId: s.clientId,
          clientName: s.clientName,
          date: s.date,
          total: s.total,
          sentToPdvAt: s.sentToPdvAt,
          pdvTerminal: s.pdvTerminal,
          statusLabel: `Venda (${s.priceType === 'atacado' ? 'Atacado' : 'Varejo'})`,
          summaryLines: (s.items || []).map(it => ({
            label: it.name,
            qty: it.quantity,
            total: Number(it.price || 0) * Number(it.quantity || 1)
          })),
          rawSale: s
        });
      });

    return items.sort((a, b) => {
      // Prioritize explicitly dispatched items to PDV first
      if (a.sentToPdvAt && !b.sentToPdvAt) return -1;
      if (!a.sentToPdvAt && b.sentToPdvAt) return 1;
      return (b.sentToPdvAt || b.date).localeCompare(a.sentToPdvAt || a.date);
    });
  }, [serviceOrders, directSales]);

  const filteredQueue = useMemo(() => {
    return pendingQueue.filter(item => {
      if (queueFilter === 'enviados' && !item.sentToPdvAt) return false;
      if (queueFilter === 'os' && item.kind !== 'order') return false;
      if (queueFilter === 'vendas' && item.kind !== 'sale') return false;

      if (queueSearch.trim()) {
        const q = queueSearch.toLowerCase();
        return (
          item.code.toLowerCase().includes(q) ||
          item.clientName.toLowerCase().includes(q) ||
          (item.pdvTerminal || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [pendingQueue, queueFilter, queueSearch]);

  // Helper: compute card fee rate %
  const getFeePercentage = (method: PaymentMethod, brand: CardBrand, inst: number): number => {
    if (method === 'dinheiro' || method === 'boleto' || method === 'faturado_30d') return 0;
    const defaultOp = cardOperators.find(o => o.active) || cardOperators[0];
    if (method === 'pix') {
      return defaultOp ? defaultOp.pixRate : 0;
    }
    const brandRate = cardRates.find(r => r.brand === brand);
    if (method === 'cartao_debito') {
      return brandRate?.debitRate ?? defaultOp?.debitRate ?? 1.99;
    }
    if (method === 'cartao_credito') {
      if (inst === 1) {
        return brandRate?.creditSightRate ?? defaultOp?.creditSightRate ?? 3.19;
      }
      const customInst = defaultOp?.installmentRates?.find(ir => ir.installment === inst);
      if (customInst) return customInst.rate;
      return brandRate?.creditInstallmentsRate ?? (inst <= 6 ? defaultOp?.creditInstallments2to6Rate : defaultOp?.creditInstallments7to12Rate) ?? 4.99;
    }
    return 0;
  };

  // Open Checkout Modal for a target
  const openCheckoutForTarget = (target: CheckoutTarget) => {
    setCheckoutTarget(target);
    setCheckoutError(null);
    setIsMultiSplit(false);
    setPayMethod('pix');
    setCardBrand('visa');
    setInstallments(1);
    setCashReceived(String(target.total.toFixed(2)));
    setNsuCode('');
    setCopiedPix(false);
    setSplits([
      {
        id: `sp-${Date.now()}`,
        method: 'pix',
        amount: target.total,
        netAmount: target.total
      }
    ]);
  };

  // Confirm settlement in Caixa
  const handleConfirmSettlement = () => {
    if (!checkoutTarget) return;
    setCheckoutError(null);

    let finalPayments: PaymentSplit[] = [];
    let primaryMethod: PaymentMethod = payMethod;
    let amountRec: number | undefined;
    let changeAmt: number | undefined;

    if (isMultiSplit) {
      const splitSum = splits.reduce((acc, s) => acc + Number(s.amount || 0), 0);
      if (Math.abs(splitSum - checkoutTarget.total) > 0.05) {
        setCheckoutError(`A soma das parcelas divididas (${formatBRL(splitSum)}) precisa ser igual ao total a cobrar (${formatBRL(checkoutTarget.total)}).`);
        return;
      }
      finalPayments = splits.map(s => {
        const ratePct = getFeePercentage(s.method, s.cardBrand || 'visa', s.installments || 1);
        const rateAmt = Number(((s.amount * ratePct) / 100).toFixed(2));
        return {
          ...s,
          ratePercentage: ratePct,
          rateAmount: rateAmt,
          netAmount: Number((s.amount - rateAmt).toFixed(2))
        };
      });
      primaryMethod = finalPayments[0]?.method || 'pix';
    } else {
      const ratePct = getFeePercentage(payMethod, cardBrand, installments);
      const rateAmt = Number(((checkoutTarget.total * ratePct) / 100).toFixed(2));
      const netAmt = Number((checkoutTarget.total - rateAmt).toFixed(2));

      if (payMethod === 'dinheiro') {
        const received = Number(cashReceived) || checkoutTarget.total;
        if (received < checkoutTarget.total) {
          setCheckoutError(`Valor recebido em dinheiro (${formatBRL(received)}) é menor que o total (${formatBRL(checkoutTarget.total)}).`);
          return;
        }
        amountRec = received;
        changeAmt = Number((received - checkoutTarget.total).toFixed(2));
      }

      finalPayments = [
        {
          id: `pay-${Date.now()}`,
          method: payMethod,
          cardBrand: payMethod.includes('cartao') ? cardBrand : undefined,
          installments: payMethod === 'cartao_credito' ? installments : undefined,
          ratePercentage: ratePct,
          rateAmount: rateAmt,
          amount: checkoutTarget.total,
          netAmount: netAmt
        }
      ];
    }

    let createdMovement: CashRegisterMovement | null = null;
    if (checkoutTarget.kind === 'sale') {
      createdMovement = settleSaleInPdv(checkoutTarget.id, {
        payments: finalPayments,
        paymentMethod: primaryMethod,
        amountReceived: amountRec,
        changeAmount: changeAmt,
        nsu: nsuCode.trim() || undefined,
        terminalName: checkoutTarget.terminalName || activeCashSession?.terminalName,
        saleOverride: checkoutTarget.saleObj
      });
    } else {
      createdMovement = settleServiceOrderInPdv(checkoutTarget.id, {
        payments: finalPayments,
        paymentMethod: primaryMethod,
        amountReceived: amountRec,
        changeAmount: changeAmt,
        nsu: nsuCode.trim() || undefined,
        terminalName: checkoutTarget.terminalName || activeCashSession?.terminalName,
        orderOverride: checkoutTarget.orderObj
      });
    }

    setCheckoutTarget(null);
    if (createdMovement) {
      setReceiptMovement(createdMovement);
    }
  };

  // POS Quick Cart Functions
  const filteredPosProducts = useMemo(() => {
    const q = posSearch.trim().toLowerCase();
    if (!q) return products.slice(0, 24);
    return products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q)
    );
  }, [products, posSearch]);

  const handleAddToPosCart = (product: Product) => {
    setPosFeedback(null);
    const unitPrice = effectivePosPriceType === 'atacado' ? product.wholesalePrice : product.retailPrice;
    setPosCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1, unitPrice }];
    });
  };

  const handlePosPriceTypeChange = (type: 'varejo' | 'atacado', forceUnlock?: boolean) => {
    if (type === 'atacado' && !isPosWholesaleUnlocked && !forceUnlock) {
      setPosFeedback('Busque e selecione um cliente cadastrado como Atacadista para liberar os valores de atacado.');
      return;
    }
    setPosFeedback(null);
    setPosPriceType(type);
    setPosCart(prev =>
      prev.map(item => ({
        ...item,
        unitPrice: type === 'atacado' ? item.product.wholesalePrice : item.product.retailPrice
      }))
    );
  };

  const handleSelectPosClient = (newClientId: string) => {
    setPosClientId(newClientId);
    const targetClient = clients.find(c => c.id === newClientId);
    if (targetClient?.customerType === 'atacado') {
      handlePosPriceTypeChange('atacado', true);
    } else {
      handlePosPriceTypeChange('varejo', true);
    }
  };

  const posSubtotal = posCart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const posCalculatedDiscount =
    posDiscountType === 'percent'
      ? Number(((posSubtotal * (Number(posDiscountValue) || 0)) / 100).toFixed(2))
      : Math.min(posSubtotal, Number(posDiscountValue) || 0);
  const posGrandTotal = Math.max(0, Number((posSubtotal - posCalculatedDiscount).toFixed(2)));

  const handlePosCreateSaleAndSettle = (mode: 'settle_now' | 'send_to_queue') => {
    if (posCart.length === 0) {
      setPosFeedback('Adicione pelo menos um produto no carrinho do PDV antes de finalizar.');
      return;
    }
    setPosFeedback(null);

    const client = clients.find(c => c.id === posClientId);
    const finalPriceType: 'varejo' | 'atacado' =
      client?.customerType === 'atacado' && posPriceType === 'atacado' ? 'atacado' : 'varejo';

    const createdSale = addDirectSale({
      clientId: client?.id,
      clientName: client?.name || 'Consumidor Balcão PDV',
      employeeId: posEmployeeId || employees[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      priceType: finalPriceType,
      items: posCart.map((c, idx) => ({
        id: `it-${Date.now()}-${idx}`,
        productId: c.product.id,
        name: c.product.name,
        quantity: c.quantity,
        cost: c.product.costPrice,
        price: c.unitPrice,
        unit: c.product.unit
      })),
      discountType: posDiscountType,
      discountValue: Number(posDiscountValue) || 0,
      calculatedDiscount: posCalculatedDiscount,
      total: posGrandTotal,
      paymentMethod: 'pix',
      payments: [],
      paymentStatus: 'pendente',
      pdvTerminal: activeCashSession?.terminalName || TERMINALS[0],
      sentToPdvAt: new Date().toISOString()
    });

    setPosCart([]);
    setPosDiscountValue(0);

    if (mode === 'settle_now') {
      openCheckoutForTarget({
        kind: 'sale',
        id: createdSale.id,
        code: createdSale.code,
        clientId: createdSale.clientId,
        clientName: createdSale.clientName,
        total: createdSale.total,
        terminalName: activeCashSession?.terminalName || TERMINALS[0],
        summaryLines: createdSale.items.map(it => ({
          label: it.name,
          qty: it.quantity,
          total: it.price * it.quantity
        })),
        saleObj: createdSale
      });
    } else {
      setSubTab('fila');
    }
  };

  // Download HTML Thermal Receipt
  const handleDownloadReceipt = (mov: CashRegisterMovement) => {
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Comprovante_Caixa_${mov.sourceCode || mov.id}</title>
  <style>
    body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; width: 320px; margin: 20px auto; color: #111; font-size: 12px; }
    .center { text-align: center; }
    .divider { border-top: 1px dashed #666; margin: 10px 0; }
    .row { display: flex; justify-content: space-between; margin: 4px 0; }
    .bold { font-weight: bold; }
  </style>
</head>
<body>
  <div class="center">
    <div class="bold" style="font-size: 14px;">${companySettings.tradeName || companySettings.companyName}</div>
    <div>${companySettings.cnpj ? `CNPJ: ${companySettings.cnpj}` : ''}</div>
    <div>${companySettings.phone ? `Tel: ${companySettings.phone}` : ''}</div>
  </div>
  <div class="divider"></div>
  <div class="center bold">COMPROVANTE DE CAIXA / PDV</div>
  <div class="divider"></div>
  <div class="row"><span>Documento:</span><span class="bold">${mov.sourceCode || mov.id}</span></div>
  <div class="row"><span>Terminal:</span><span>${mov.terminalName || 'Caixa 01'}</span></div>
  <div class="row"><span>Operador:</span><span>${mov.operatorName}</span></div>
  <div class="row"><span>Data/Hora:</span><span>${new Date(mov.createdAt).toLocaleString('pt-BR')}</span></div>
  ${mov.clientName ? `<div class="row"><span>Cliente:</span><span>${mov.clientName}</span></div>` : ''}
  <div class="divider"></div>
  <div class="bold" style="margin-bottom:4px;">Descrição:</div>
  <div>${mov.description}</div>
  <div class="divider"></div>
  ${(mov.payments && mov.payments.length > 0 ? mov.payments : [{ method: mov.paymentMethod, amount: mov.grossAmount }]).map(p =>
    `<div class="row"><span>${METHOD_LABELS[p.method]}</span><span>R$ ${Number(p.amount).toFixed(2)}</span></div>`
  ).join('')}
  <div class="divider"></div>
  <div class="row bold" style="font-size: 14px;"><span>TOTAL PAGO:</span><span>R$ ${mov.grossAmount.toFixed(2)}</span></div>
  ${mov.amountReceived ? `<div class="row"><span>Recebido Espécie:</span><span>R$ ${mov.amountReceived.toFixed(2)}</span></div>` : ''}
  ${mov.changeAmount && mov.changeAmount > 0 ? `<div class="row bold"><span>TROCO:</span><span>R$ ${mov.changeAmount.toFixed(2)}</span></div>` : ''}
  ${mov.nsu ? `<div class="row"><span>Autenticação / NSU:</span><span>${mov.nsu}</span></div>` : ''}
  <div class="divider"></div>
  <div class="center" style="font-size: 10px;">Documento não fiscal · Obrigado pela preferência!</div>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Comprovante_PDV_${mov.sourceCode || mov.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#d8d8d8]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-[#363739] tracking-tight">
              PDV · Frente de Caixa & Baixa de Recebimentos
            </h1>
            {activeCashSession ? (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                CAIXA ABERTO · {activeCashSession.code}
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                CAIXA FECHADO
              </span>
            )}
          </div>
          <p className="text-xs text-[#5a5b5e] mt-1">
            Central de recebimento unificada: todas as Ordens de Serviço e Vendas Diretas passam pelo caixa para conferência, baixa de valores e emissão de comprovante.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!activeCashSession ? (
            <button
              type="button"
              onClick={() => setIsOpenSessionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Abrir Caixa PDV</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setManualMoveType('suprimento');
                  setManualMoveAmount('');
                  setManualMoveDesc('Reforço de caixa para troco');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer"
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span>Suprimento</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setManualMoveType('sangria');
                  setManualMoveAmount('');
                  setManualMoveDesc('Sangria / Retirada para cofre');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
              >
                <ArrowDownCircle className="w-4 h-4" />
                <span>Sangria</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCloseCountedCash(sessionStats.expectedCash.toFixed(2));
                  setCloseNotes('');
                  setIsCloseSessionModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg shadow-xs cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Fechar Caixa</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Session KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#d8d8d8]">
          <div className="flex items-center justify-between text-xs text-[#707174] font-medium">
            <span>Aguardando Baixa no Caixa</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#363739] mt-1">
            {pendingQueue.length} <span className="text-xs font-normal text-[#707174]">títulos</span>
          </div>
          <div className="text-xs font-mono tabular-nums text-[#53383e] font-semibold mt-1">
            {formatBRL(pendingQueue.reduce((acc, i) => acc + i.total, 0))} em aberto
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#d8d8d8]">
          <div className="flex items-center justify-between text-xs text-[#707174] font-medium">
            <span>Saldo em Gaveta (Dinheiro)</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            {formatBRL(sessionStats.expectedCash)}
          </div>
          <div className="text-xs text-[#707174] mt-1">
            {activeCashSession
              ? `Fundo inicial: ${formatBRL(activeCashSession.openingBalance)}`
              : 'Abra um turno para controle de gaveta'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#d8d8d8]">
          <div className="flex items-center justify-between text-xs text-[#707174] font-medium">
            <span>Total Recebido no Turno</span>
            <CreditCard className="w-4 h-4 text-[#53383e]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#363739] mt-1">
            {formatBRL(sessionStats.totalReceived)}
          </div>
          <div className="text-xs text-[#707174] mt-1 font-mono tabular-nums">
            Taxas operadoras: -{formatBRL(sessionStats.totalFees)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#d8d8d8]">
          <div className="flex items-center justify-between text-xs text-[#707174] font-medium">
            <span>Terminal & Operador</span>
            <Store className="w-4 h-4 text-[#53383e]" />
          </div>
          <div className="text-sm font-bold text-[#363739] mt-1 truncate">
            {activeCashSession?.terminalName || 'Nenhum terminal ativo'}
          </div>
          <div className="text-xs text-[#707174] mt-1 truncate">
            {activeCashSession
              ? `Operador: ${activeCashSession.operatorName}`
              : `Operador: ${currentUser?.name || 'Administrador'}`}
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#d8d8d8] overflow-x-auto pb-0">
        {[
          { id: 'fila' as PdvSubTab, label: 'Fila de Recebimentos (Vendas & OS)', count: pendingQueue.length, icon: Receipt },
          { id: 'balcao' as PdvSubTab, label: 'Balcão PDV Rápido', count: posCart.length || null, icon: ShoppingBag },
          { id: 'movimentacoes' as PdvSubTab, label: 'Extrato do Caixa', count: activeCashSession ? activeSessionMoves.length : cashMovements.length, icon: FileText },
          { id: 'fechamentos' as PdvSubTab, label: 'Histórico de Fechamentos', count: cashSessions.filter(s => s.status === 'fechado').length, icon: History }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-[#53383e] text-[#53383e] bg-white rounded-t-lg'
                  : 'border-transparent text-[#707174] hover:text-[#363739]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  isActive ? 'bg-[#53383e] text-white' : 'bg-[#e5e6e8] text-[#363739]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: FILA DE RECEBIMENTOS */}
      {subTab === 'fila' && (
        <div className="bg-white border border-[#d8d8d8] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#d8d8d8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'todos' as QueueFilter, label: `Todos Pendentes (${pendingQueue.length})` },
                { id: 'enviados' as QueueFilter, label: `Enviados ao PDV (${pendingQueue.filter(i => i.sentToPdvAt).length})` },
                { id: 'os' as QueueFilter, label: `Ordens de Serviço (${pendingQueue.filter(i => i.kind === 'order').length})` },
                { id: 'vendas' as QueueFilter, label: `Vendas Diretas (${pendingQueue.filter(i => i.kind === 'sale').length})` }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setQueueFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    queueFilter === f.id
                      ? 'bg-[#53383e] text-white'
                      : 'bg-[#f4f5f6] text-[#363739] hover:bg-[#e5e6e8]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#707174] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar código, cliente, terminal..."
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f4f5f6] border border-[#d8d8d8] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#53383e]"
              />
            </div>
          </div>

          {filteredQueue.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#707174]">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-[#363739] text-sm">Fila do Caixa zerada!</p>
              <p className="mt-1">Não há Ordens de Serviço ou Vendas pendentes para o filtro selecionado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f4f5f6] border-b border-[#d8d8d8] text-[#5a5b5e] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Origem / Código</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-3">Terminal Encaminhado</th>
                    <th className="py-3 px-4">Resumo dos Itens</th>
                    <th className="py-3 px-3">Data</th>
                    <th className="py-3 px-4 text-right">Valor a Receber</th>
                    <th className="py-3 px-4 text-right">Baixa no Caixa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececef]">
                  {filteredQueue.map(item => (
                    <tr key={`${item.kind}-${item.id}`} className="hover:bg-[#f9f9fb] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {item.kind === 'order' ? (
                            <Wrench className="w-4 h-4 text-[#53383e] shrink-0" />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-blue-700 shrink-0" />
                          )}
                          <div>
                            <div className="font-mono font-bold text-[#363739]">{item.code}</div>
                            <div className="text-[11px] text-[#707174]">{item.statusLabel}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#363739]">
                        {item.clientName}
                      </td>
                      <td className="py-3 px-3">
                        {item.sentToPdvAt ? (
                          <div>
                            <span className="font-semibold text-[#53383e]">
                              {item.pdvTerminal || 'Caixa 01'}
                            </span>
                            <div className="text-[10px] text-[#707174]">
                              Enviado às {new Date(item.sentToPdvAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#707174]">Aguardando no sistema</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#5a5b5e] max-w-xs truncate">
                        {item.summaryLines.map(l => `${l.qty}x ${l.label}`).join(', ') || 'Sem itens detalhados'}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#707174]">
                        {formatDateBR(item.date)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-[#363739]">
                        {formatBRL(item.total)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            openCheckoutForTarget({
                              kind: item.kind,
                              id: item.id,
                              code: item.code,
                              clientId: item.clientId,
                              clientName: item.clientName,
                              total: item.total,
                              terminalName: item.pdvTerminal || activeCashSession?.terminalName,
                              summaryLines: item.summaryLines,
                              saleObj: item.rawSale,
                              orderObj: item.rawOrder
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg shadow-2xs cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Receber no Caixa</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: BALCAO PDV RAPIDO */}
      {subTab === 'balcao' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Product Catalog Picker */}
          <div className="lg:col-span-7 bg-white border border-[#d8d8d8] rounded-xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#707174] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar produto por nome, código, SKU ou código de barras..."
                  value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#f4f5f6] border border-[#d8d8d8] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#53383e]"
                />
              </div>
              <div className="flex rounded-lg border border-[#d8d8d8] overflow-hidden bg-[#f4f5f6] p-0.5 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => handlePosPriceTypeChange('varejo')}
                  className={`px-3 py-1.5 font-bold rounded-md cursor-pointer ${
                    effectivePosPriceType === 'varejo' ? 'bg-white text-[#363739] shadow-2xs' : 'text-[#707174]'
                  }`}
                >
                  Varejo
                </button>
                <button
                  type="button"
                  disabled={!isPosWholesaleUnlocked}
                  onClick={() => handlePosPriceTypeChange('atacado')}
                  title={
                    isPosWholesaleUnlocked
                      ? 'Aplicar tabela de atacado'
                      : 'Busque e selecione um cliente cadastrado como Atacadista para liberar'
                  }
                  className={`inline-flex items-center gap-1 px-3 py-1.5 font-bold rounded-md transition-colors ${
                    !isPosWholesaleUnlocked
                      ? 'text-[#9a9ca0] cursor-not-allowed opacity-70'
                      : effectivePosPriceType === 'atacado'
                      ? 'bg-purple-700 text-white shadow-2xs cursor-pointer'
                      : 'text-purple-800 hover:bg-white cursor-pointer'
                  }`}
                >
                  {!isPosWholesaleUnlocked && <Lock className="w-3 h-3" />}
                  <span>Atacado</span>
                </button>
              </div>
            </div>

            {!isPosWholesaleUnlocked ? (
              <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>
                  Valores de <strong>Atacado</strong> bloqueados. Busque e selecione ao lado um cliente cadastrado como <strong>Atacadista</strong> para liberar.
                </span>
              </div>
            ) : (
              <div className="px-3 py-2 rounded-lg bg-purple-50 border border-purple-200 text-[11px] text-purple-900 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Unlock className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                  <span>
                    Tabela Atacado liberada para <strong>{selectedPosClient?.name}</strong> (Atacadista).
                  </span>
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredPosProducts.map(prod => {
                const price = effectivePosPriceType === 'atacado' ? prod.wholesalePrice : prod.retailPrice;
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleAddToPosCart(prod)}
                    className="p-3 rounded-xl border border-[#d8d8d8] hover:border-[#53383e] bg-[#f9f9fb] hover:bg-white text-left transition-all flex flex-col justify-between gap-2 cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] font-bold text-[#707174]">{prod.code}</span>
                        <span className={`font-mono text-[10px] font-semibold ${prod.currentStock <= prod.minStock ? 'text-rose-600' : 'text-[#707174]'}`}>
                          Est: {prod.currentStock} {prod.unit}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#363739] mt-1 line-clamp-2">{prod.name}</div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#ececef]">
                      <span className={`font-mono tabular-nums font-black text-sm ${effectivePosPriceType === 'atacado' ? 'text-purple-800' : 'text-[#53383e]'}`}>
                        {formatBRL(price)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#53383e]">
                        <Plus className="w-3.5 h-3.5" /> Adicionar
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cart & Checkout Trigger */}
          <div className="lg:col-span-5 bg-white border border-[#d8d8d8] rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#ececef]">
                <h2 className="text-sm font-bold text-[#363739] flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#53383e]" />
                  <span>Cupom / Carrinho Balcão</span>
                </h2>
                {posCart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPosCart([])}
                    className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                  >
                    Limpar itens
                  </button>
                )}
              </div>

              {posFeedback && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-semibold text-rose-800">
                  {posFeedback}
                </div>
              )}

              {/* Busca de Cliente + Vendedor */}
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] text-[#707174] font-medium">
                      Buscar e Selecionar Cliente
                    </label>
                    {selectedPosClient && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isPosWholesaleUnlocked
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isPosWholesaleUnlocked ? 'Atacadista (Atacado Liberado)' : 'Varejista (Somente Varejo)'}
                      </span>
                    )}
                  </div>
                  <div className="relative mb-1.5">
                    <Search className="w-3.5 h-3.5 text-[#707174] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar cliente por nome, CPF/CNPJ ou telefone..."
                      value={posClientSearch}
                      onChange={(e) => setPosClientSearch(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 bg-[#f4f5f6] border border-[#d8d8d8] rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#53383e]"
                    />
                    {posClientSearch && (
                      <button
                        type="button"
                        onClick={() => setPosClientSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#707174] hover:text-[#363739] cursor-pointer"
                        title="Limpar busca"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {posClientSearch.trim() && (
                    <div className="mb-1.5 max-h-32 overflow-y-auto rounded-lg border border-[#d8d8d8] bg-white divide-y divide-[#ececef]">
                      {filteredPosClients.length === 0 ? (
                        <div className="p-2 text-[11px] text-[#707174] text-center">
                          Nenhum cliente encontrado para "{posClientSearch}".
                        </div>
                      ) : (
                        filteredPosClients.slice(0, 8).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              handleSelectPosClient(c.id);
                              setPosClientSearch('');
                            }}
                            className={`w-full px-2.5 py-1.5 text-left flex items-center justify-between gap-2 hover:bg-[#f4f5f6] cursor-pointer ${
                              posClientId === c.id ? 'bg-[#f6eff1]' : ''
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-[#363739] truncate">{c.name}</div>
                              <div className="text-[10px] text-[#707174] font-mono truncate">
                                {c.document || c.phone}
                              </div>
                            </div>
                            <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              c.customerType === 'atacado'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {c.customerType === 'atacado' ? 'Atacadista' : 'Varejista'}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={posClientId}
                      onChange={(e) => handleSelectPosClient(e.target.value)}
                      className="w-full p-2 bg-[#f4f5f6] border border-[#d8d8d8] rounded-lg font-medium"
                    >
                      <option value="">Consumidor Balcão PDV (Varejo)</option>
                      {filteredPosClients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} [{c.customerType === 'atacado' ? 'Atacadista' : 'Varejista'}]
                        </option>
                      ))}
                    </select>
                    <select
                      value={posEmployeeId}
                      onChange={(e) => setPosEmployeeId(e.target.value)}
                      className="w-full p-2 bg-[#f4f5f6] border border-[#d8d8d8] rounded-lg font-medium"
                      title="Vendedor / Atendente"
                    >
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Cart Items */}
              <div className="max-h-64 overflow-y-auto divide-y divide-[#ececef] border border-[#ececef] rounded-xl">
                {posCart.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#707174]">
                    Clique nos produtos ao lado para montar a venda no balcão.
                  </div>
                ) : (
                  posCart.map(item => (
                    <div key={item.product.id} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[#363739] truncate">{item.product.name}</div>
                        <div className="text-[11px] font-mono text-[#707174]">
                          {formatBRL(item.unitPrice)} / {item.product.unit}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setPosCart(prev =>
                              prev
                                .map(i =>
                                  i.product.id === item.product.id ? { ...i, quantity: i.quantity - 1 } : i
                                )
                                .filter(i => i.quantity > 0)
                            )
                          }
                          className="p-1 rounded border border-[#d8d8d8] hover:bg-[#f4f5f6] cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-mono font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setPosCart(prev =>
                              prev.map(i =>
                                i.product.id === item.product.id ? { ...i, quantity: i.quantity + 1 } : i
                              )
                            )
                          }
                          className="p-1 rounded border border-[#d8d8d8] hover:bg-[#f4f5f6] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="w-20 text-right font-mono tabular-nums font-bold text-[#363739]">
                          {formatBRL(item.unitPrice * item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPosCart(prev => prev.filter(i => i.product.id !== item.product.id))}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Discount + Totals + Actions */}
            <div className="space-y-3 pt-2 border-t border-[#d8d8d8] text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[#5a5b5e]">Desconto</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex rounded border border-[#d8d8d8] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setPosDiscountType('fixed')}
                      className={`px-2 py-1 font-bold cursor-pointer ${posDiscountType === 'fixed' ? 'bg-[#363739] text-white' : 'bg-white text-[#707174]'}`}
                    >
                      R$
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosDiscountType('percent')}
                      className={`px-2 py-1 font-bold cursor-pointer ${posDiscountType === 'percent' ? 'bg-[#363739] text-white' : 'bg-white text-[#707174]'}`}
                    >
                      %
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={posDiscountValue}
                    onChange={(e) => setPosDiscountValue(Number(e.target.value))}
                    className="w-24 p-1.5 bg-[#f4f5f6] border border-[#d8d8d8] rounded font-mono font-bold text-right"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#f6eff1] border border-[#53383e]/30 rounded-xl space-y-1">
                <div className="flex justify-between text-[#5a5b5e]">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">{formatBRL(posSubtotal)}</span>
                </div>
                {posCalculatedDiscount > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span>Desconto</span>
                    <span className="font-mono tabular-nums">-{formatBRL(posCalculatedDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-[#53383e] pt-1 border-t border-[#53383e]/20">
                  <span>Total a Receber</span>
                  <span className="font-mono tabular-nums">{formatBRL(posGrandTotal)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={posCart.length === 0}
                  onClick={() => handlePosCreateSaleAndSettle('send_to_queue')}
                  className="py-2.5 px-3 text-xs font-bold text-[#363739] bg-[#f4f5f6] hover:bg-[#e5e6e8] border border-[#d8d8d8] rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  Enviar p/ Fila do Caixa
                </button>
                <button
                  type="button"
                  disabled={posCart.length === 0}
                  onClick={() => handlePosCreateSaleAndSettle('settle_now')}
                  className="py-2.5 px-3 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  Finalizar e Receber
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: MOVIMENTACOES / EXTRATO DO CAIXA */}
      {subTab === 'movimentacoes' && (
        <div className="bg-white border border-[#d8d8d8] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#d8d8d8] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#363739]">
                {activeCashSession
                  ? `Extrato do Turno Atual (${activeCashSession.code})`
                  : 'Últimas Movimentações do Caixa'}
              </h2>
              <p className="text-[11px] text-[#707174]">
                Aberturas, recebimentos de Vendas/OS, suprimentos, sangrias e fechamentos.
              </p>
            </div>
            {activeCashSession && (
              <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums flex-wrap">
                <span>PIX: <strong>{formatBRL(sessionStats.byMethod.pix)}</strong></span>
                <span>Dinheiro: <strong>{formatBRL(sessionStats.byMethod.dinheiro)}</strong></span>
                <span>Crédito: <strong>{formatBRL(sessionStats.byMethod.cartao_credito)}</strong></span>
                <span>Débito: <strong>{formatBRL(sessionStats.byMethod.cartao_debito)}</strong></span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f4f5f6] border-b border-[#d8d8d8] text-[#5a5b5e] font-semibold">
                <tr>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-4">Descrição / Origem</th>
                  <th className="py-3 px-3">Forma Pgto</th>
                  <th className="py-3 px-4 text-right">Bruto</th>
                  <th className="py-3 px-3 text-right">Taxas</th>
                  <th className="py-3 px-4 text-right">Líquido</th>
                  <th className="py-3 px-3 text-right">Comprovante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececef]">
                {(activeCashSession ? activeSessionMoves : cashMovements).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#707174]">
                      Nenhuma movimentação registrada neste caixa até o momento.
                    </td>
                  </tr>
                ) : (
                  (activeCashSession ? activeSessionMoves : cashMovements).map(mov => {
                    const isOut = mov.type === 'sangria';
                    return (
                      <tr key={mov.id} className="hover:bg-[#f9f9fb]">
                        <td className="py-3 px-4 font-mono text-[#707174] whitespace-nowrap">
                          {new Date(mov.createdAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              mov.type === 'sangria'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : mov.type === 'abertura' || mov.type === 'fechamento'
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {mov.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#363739]">{mov.description}</div>
                          {mov.nsu && (
                            <div className="text-[10px] font-mono text-[#707174]">NSU: {mov.nsu}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[#5a5b5e]">
                          {mov.payments && mov.payments.length > 1
                            ? `Dividido (${mov.payments.length}x)`
                            : METHOD_LABELS[mov.paymentMethod]}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono tabular-nums font-bold ${isOut ? 'text-rose-600' : 'text-[#363739]'}`}>
                          {isOut ? '-' : ''}{formatBRL(mov.grossAmount)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-[#707174]">
                          {mov.feeAmount > 0 ? `-${formatBRL(mov.feeAmount)}` : '—'}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono tabular-nums font-bold ${isOut ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {isOut ? '-' : ''}{formatBRL(mov.netAmount)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setReceiptMovement(mov)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#363739] bg-[#f4f5f6] hover:bg-[#e5e6e8] border border-[#d8d8d8] rounded-md cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Cupom</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: HISTORICO DE FECHAMENTOS */}
      {subTab === 'fechamentos' && (
        <div className="bg-white border border-[#d8d8d8] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#d8d8d8]">
            <h2 className="text-sm font-bold text-[#363739]">Histórico de Turnos e Fechamentos de Caixa</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f4f5f6] border-b border-[#d8d8d8] text-[#5a5b5e] font-semibold">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Terminal / Operador</th>
                  <th className="py-3 px-3">Abertura</th>
                  <th className="py-3 px-3">Fechamento</th>
                  <th className="py-3 px-4 text-right">Fundo Inicial</th>
                  <th className="py-3 px-4 text-right">Esperado Gaveta</th>
                  <th className="py-3 px-4 text-right">Conferido</th>
                  <th className="py-3 px-4 text-right">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececef]">
                {cashSessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#707174]">
                      Nenhum turno de caixa registrado ainda.
                    </td>
                  </tr>
                ) : (
                  cashSessions.map(sess => {
                    const diff = sess.differenceAmount ?? 0;
                    return (
                      <tr key={sess.id} className="hover:bg-[#f9f9fb]">
                        <td className="py-3 px-4 font-mono font-bold text-[#53383e]">
                          {sess.code}
                          <div className="text-[10px] uppercase font-sans text-[#707174]">{sess.status}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#363739]">{sess.terminalName}</div>
                          <div className="text-[11px] text-[#707174]">{sess.operatorName}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[#707174]">
                          {new Date(sess.openedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#707174]">
                          {sess.closedAt
                            ? new Date(sess.closedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                            : 'Em andamento'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">{formatBRL(sess.openingBalance)}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          {sess.expectedCashBalance !== undefined ? formatBRL(sess.expectedCashBalance) : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold">
                          {sess.closingBalance !== undefined ? formatBRL(sess.closingBalance) : '—'}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono tabular-nums font-bold ${
                          sess.status === 'aberto'
                            ? 'text-[#707174]'
                            : diff === 0
                            ? 'text-emerald-700'
                            : diff > 0
                            ? 'text-blue-700'
                            : 'text-rose-600'
                        }`}>
                          {sess.status === 'aberto' ? '—' : `${diff > 0 ? '+' : ''}${formatBRL(diff)}`}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ABRIR CAIXA */}
      {isOpenSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#d8d8d8] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#d8d8d8]">
              <h3 className="text-base font-bold text-[#363739] flex items-center gap-2">
                <Unlock className="w-4 h-4 text-emerald-600" />
                <span>Abertura de Caixa PDV</span>
              </h3>
              <button onClick={() => setIsOpenSessionModalOpen(false)} className="text-[#707174] hover:text-[#363739]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#5a5b5e] font-semibold mb-1">Terminal / Caixa</label>
                <select
                  value={openTerminal}
                  onChange={(e) => setOpenTerminal(e.target.value)}
                  className="w-full p-2.5 bg-[#f4f5f6] border border-[#d8d8d8] rounded-lg font-medium"
                >
                  {TERMINALS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#5a5b5e] font-semibold mb-1">Fundo de Troco Inicial em Dinheiro (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={openBalanceInput}
                  onChange={(e) => setOpenBalanceInput(e.target.value)}
                  className="w-full p-2.5 bg-[#f4f5f6] border border-[#d8d8d8] rounded-lg font-mono font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-[#5a5b5e] font-semibold mb-1">Observações do Turno (opcional)</label>
                <input
                  type="text"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  placeholder="Ex: Turno manhã"
                  className="w-full p-2.5 bg-[#f4f5f6] border border-[#d8d8d8] rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#d8d8d8]">
              <button
                type="button"
                onClick={() => setIsOpenSessionModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#5a5b5e] bg-[#f4f5f6] rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  openCashSession(openTerminal, Number(openBalanceInput) || 0, openNotes);
                  setIsOpenSessionModalOpen(false);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
              >
                Confirmar Abertura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUPRIMENTO / SANGRIA */}
      {manualMoveType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#d8d8d8] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#d8d8d8]">
              <h3 className="text-base font-bold text-[#363739]">
                {manualMoveType === 'suprimento' ? 'Suprimento / Reforço de Caixa' : 'Sangria / Retirada de Caixa'}
              </h3>
              <button onClick={() => setManualMoveType(null)} className="text-[#707174] hover:text-[#363739]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#5a5b5e] font-semibold mb-1">Valor em Dinheiro (R$)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={manualMoveAmount}
                  onChange={(e) => setManualMoveAmount(e.target.value)}
                  className="w-full p-2.5 bg-[#f4f5f6] border border-[#d8d8d8] rounded-lg font-mono font-bold text-sm"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="block text-[#5a5b5e] font-semibold mb-1">Motivo / Descrição</label>
                <input
                  type="text"
                  value={manualMoveDesc}
                  onChange={(e) => setManualMoveDesc(e.target.value)}
                  className="w-full p-2.5 bg-[#f4f5f6] border border-[#d8d8d8] rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#d8d8d8]">
              <button
                type="button"
                onClick={() => setManualMoveType(null)}
                className="px-4 py-2 text-xs font-semibold text-[#5a5b5e] bg-[#f4f5f6] rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = Number(manualMoveAmount);
                  if (!val || val <= 0) {
                    alert('Informe um valor válido.');
                    return;
                  }
                  addCashManualMovement(manualMoveType, val, manualMoveDesc, 'dinheiro');
                  setManualMoveType(null);
                }}
                className={`px-5 py-2 text-xs font-bold text-white rounded-lg cursor-pointer ${
                  manualMoveType === 'suprimento' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Registrar {manualMoveType === 'suprimento' ? 'Suprimento' : 'Sangria'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FECHAR CAIXA */}
      {isCloseSessionModalOpen && activeCashSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#d8d8d8] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#d8d8d8]">
              <h3 className="text-base font-bold text-[#363739] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#53383e]" />
                <span>Fechamento de Caixa · {activeCashSession.code}</span>
              </h3>
              <button onClick={() => setIsCloseSessionModalOpen(false)} className="text-[#707174] hover:text-[#363739]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-[#f4f5f6] p-3 rounded-xl border border-[#d8d8d8]">
              <div>Fundo Inicial: <strong className="font-mono">{formatBRL(activeCashSession.openingBalance)}</strong></div>
              <div>Recebido Dinheiro: <strong className="font-mono">{formatBRL(sessionStats.byMethod.dinheiro)}</strong></div>
              <div>Suprimentos: <strong className="font-mono text-emerald-700">+{formatBRL(sessionStats.totalSuprimento)}</strong></div>
              <div>Sangrias: <strong className="font-mono text-rose-600">-{formatBRL(sessionStats.totalSangria)}</strong></div>
              <div>PIX: <strong className="font-mono">{formatBRL(sessionStats.byMethod.pix)}</strong></div>
              <div>Cartão (Créd/Déb): <strong className="font-mono">{formatBRL(sessionStats.byMethod.cartao_credito + sessionStats.byMethod.cartao_debito)}</strong></div>
              <div className="col-span-2 pt-2 border-t border-[#d8d8d8] flex justify-between font-bold text-[#363739]">
                <span>Saldo Esperado em Dinheiro (Gaveta):</span>
                <span className="font-mono text-[#53383e]">{formatBRL(sessionStats.expectedCash)}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#5a5b5e] font-semibold mb-1">Valor Contado na Gaveta (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={closeCountedCash}
                  onChange={(e) => setCloseCountedCash(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#d8d8d8] rounded-lg font-mono font-bold text-sm"
                />
                {closeCountedCash !== '' && (
                  <div className="mt-1 text-[11px] font-mono font-semibold">
                    Diferença:{' '}
                    {(() => {
                      const d = (Number(closeCountedCash) || 0) - sessionStats.expectedCash;
                      return (
                        <span className={d === 0 ? 'text-emerald-700' : d > 0 ? 'text-blue-700' : 'text-rose-600'}>
                          {d === 0 ? 'Caixa fechado exato (R$ 0,00)' : `${d > 0 ? 'Sobra +' : 'Falta '}${formatBRL(d)}`}
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[#5a5b5e] font-semibold mb-1">Observações de Fechamento</label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Opcional"
                  className="w-full p-2.5 bg-[#f4f5f6] border border-[#d8d8d8] rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#d8d8d8]">
              <button
                type="button"
                onClick={() => setIsCloseSessionModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#5a5b5e] bg-[#f4f5f6] rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  closeCashSession(activeCashSession.id, Number(closeCountedCash) || 0, closeNotes);
                  setIsCloseSessionModalOpen(false);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg cursor-pointer"
              >
                Confirmar Fechamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECEBIMENTO / CHECKOUT NO CAIXA */}
      {checkoutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[94vh] overflow-y-auto border border-[#d8d8d8] flex flex-col">
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-[#d8d8d8] flex items-center justify-between z-10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[#363739] text-base">Recebimento e Baixa no Caixa</h3>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#53383e] text-white">
                    {checkoutTarget.code}
                  </span>
                </div>
                <p className="text-xs text-[#707174] mt-0.5">
                  Cliente: <strong className="text-[#363739]">{checkoutTarget.clientName}</strong>
                </p>
              </div>
              <button onClick={() => setCheckoutTarget(null)} className="text-[#707174] hover:text-[#363739]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {checkoutError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-semibold">
                  {checkoutError}
                </div>
              )}

              {/* Total Banner */}
              <div className="p-4 bg-[#f6eff1] border border-[#53383e]/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#707174] uppercase">Total a Cobrar no Caixa</span>
                  <div className="text-2xl font-black font-mono tabular-nums text-[#53383e]">
                    {formatBRL(checkoutTarget.total)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isMultiSplit;
                    setIsMultiSplit(next);
                    if (next && splits.length === 0) {
                      setSplits([{ id: `sp-${Date.now()}`, method: payMethod, amount: checkoutTarget.total, netAmount: checkoutTarget.total }]);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                    isMultiSplit
                      ? 'bg-[#53383e] text-white border-[#53383e]'
                      : 'bg-white text-[#363739] border-[#d8d8d8]'
                  }`}
                >
                  <Split className="w-3.5 h-3.5" />
                  <span>{isMultiSplit ? 'Modo Dividido Ativo' : 'Dividir Pagamento'}</span>
                </button>
              </div>

              {!isMultiSplit ? (
                <>
                  {/* Method Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPayMethod(m)}
                        className={`p-2.5 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                          payMethod === m
                            ? 'bg-[#53383e] text-white border-[#53383e]'
                            : 'bg-white text-[#363739] border-[#d8d8d8] hover:border-[#53383e]/50'
                        }`}
                      >
                        {METHOD_LABELS[m]}
                      </button>
                    ))}
                  </div>

                  {/* Method Specific Panels */}
                  {payMethod === 'pix' && (
                    <div className="p-4 bg-[#f4f5f6] rounded-xl border border-[#d8d8d8] flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <QrCode className="w-9 h-9 text-[#53383e] shrink-0" />
                        <div>
                          <div className="font-bold text-[#363739]">Chave PIX da Empresa</div>
                          <div className="font-mono text-xs text-[#53383e] font-bold">
                            {companySettings.cnpj || companySettings.phone || companySettings.email}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(companySettings.cnpj || companySettings.phone || companySettings.email || '');
                          setCopiedPix(true);
                          setTimeout(() => setCopiedPix(false), 2000);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#d8d8d8] rounded-lg font-semibold cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedPix ? 'Copiada!' : 'Copiar Chave'}</span>
                      </button>
                    </div>
                  )}

                  {payMethod === 'dinheiro' && (
                    <div className="p-4 bg-[#f4f5f6] rounded-xl border border-[#d8d8d8] space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-[#5a5b5e] mb-1">Valor Recebido do Cliente (R$)</label>
                          <input
                            type="number"
                            min={checkoutTarget.total}
                            step="0.01"
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                            className="w-full p-2 bg-white border border-[#d8d8d8] rounded-lg font-mono font-bold text-sm"
                          />
                        </div>
                        <div className="p-2.5 bg-white border border-[#d8d8d8] rounded-lg flex flex-col justify-center">
                          <span className="text-[11px] text-[#707174]">Troco a Devolver</span>
                          <span className="text-lg font-black font-mono tabular-nums text-emerald-700">
                            {formatBRL(Math.max(0, (Number(cashReceived) || 0) - checkoutTarget.total))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {(payMethod === 'cartao_credito' || payMethod === 'cartao_debito') && (
                    <div className="p-4 bg-[#f4f5f6] rounded-xl border border-[#d8d8d8] space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-semibold text-[#5a5b5e] mb-1">Bandeira</label>
                          <select
                            value={cardBrand}
                            onChange={(e) => setCardBrand(e.target.value as CardBrand)}
                            className="w-full p-2 bg-white border border-[#d8d8d8] rounded-lg font-medium"
                          >
                            {BRANDS.map(b => (
                              <option key={b.id} value={b.id}>{b.label}</option>
                            ))}
                          </select>
                        </div>
                        {payMethod === 'cartao_credito' && (
                          <div>
                            <label className="block font-semibold text-[#5a5b5e] mb-1">Parcelas</label>
                            <select
                              value={installments}
                              onChange={(e) => setInstallments(Number(e.target.value))}
                              className="w-full p-2 bg-white border border-[#d8d8d8] rounded-lg font-medium"
                            >
                              {Array.from({ length: 12 }, (_, idx) => idx + 1).map(n => (
                                <option key={n} value={n}>
                                  {n}x de {formatBRL(checkoutTarget.total / n)}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="block font-semibold text-[#5a5b5e] mb-1">NSU / Autorização</label>
                          <input
                            type="text"
                            value={nsuCode}
                            onChange={(e) => setNsuCode(e.target.value)}
                            placeholder="Opcional"
                            className="w-full p-2 bg-white border border-[#d8d8d8] rounded-lg font-mono"
                          />
                        </div>
                      </div>

                      {(() => {
                        const ratePct = getFeePercentage(payMethod, cardBrand, installments);
                        const feeAmt = (checkoutTarget.total * ratePct) / 100;
                        return (
                          <div className="text-[11px] font-mono text-[#5a5b5e] flex justify-between pt-2 border-t border-[#d8d8d8]">
                            <span>Taxa Maquininha ({ratePct.toFixed(2)}%): -{formatBRL(feeAmt)}</span>
                            <span className="font-bold text-emerald-700">Líquido: {formatBRL(checkoutTarget.total - feeAmt)}</span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              ) : (
                /* Multi-Split Panel */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#363739]">Parcelas / Formas Combinadas</span>
                    <button
                      type="button"
                      onClick={() => {
                        const used = splits.reduce((acc, s) => acc + Number(s.amount || 0), 0);
                        const remaining = Math.max(0, Number((checkoutTarget.total - used).toFixed(2)));
                        setSplits(prev => [
                          ...prev,
                          { id: `sp-${Date.now()}`, method: 'dinheiro', amount: remaining, netAmount: remaining }
                        ]);
                      }}
                      className="text-xs font-bold text-[#53383e] hover:underline cursor-pointer"
                    >
                      + Adicionar Forma
                    </button>
                  </div>
                  {splits.map((sp, idx) => (
                    <div key={sp.id} className="flex flex-wrap items-center gap-2 p-2.5 bg-[#f4f5f6] rounded-xl border border-[#d8d8d8]">
                      <select
                        value={sp.method}
                        onChange={(e) => {
                          const next = [...splits];
                          next[idx] = { ...next[idx], method: e.target.value as PaymentMethod };
                          setSplits(next);
                        }}
                        className="p-1.5 bg-white border border-[#d8d8d8] rounded-lg font-medium"
                      >
                        {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map(m => (
                          <option key={m} value={m}>{METHOD_LABELS[m]}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={sp.amount}
                        onChange={(e) => {
                          const next = [...splits];
                          const val = Number(e.target.value) || 0;
                          next[idx] = { ...next[idx], amount: val, netAmount: val };
                          setSplits(next);
                        }}
                        className="w-28 p-1.5 bg-white border border-[#d8d8d8] rounded-lg font-mono font-bold"
                      />
                      {splits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSplits(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="text-[11px] font-mono text-right">
                    Soma: <strong>{formatBRL(splits.reduce((a, s) => a + Number(s.amount || 0), 0))}</strong> / {formatBRL(checkoutTarget.total)}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white px-5 py-3.5 border-t border-[#d8d8d8] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCheckoutTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-[#5a5b5e] bg-[#f4f5f6] rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSettlement}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Recebimento e Dar Baixa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMPROVANTE DE CAIXA / CUPOM */}
      {receiptMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#d8d8d8] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#d8d8d8]">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Baixa Registrada no Caixa</span>
              </div>
              <button onClick={() => setReceiptMovement(null)} className="text-[#707174] hover:text-[#363739]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-[#f4f5f6] rounded-xl border border-dashed border-[#a0a2a6] font-mono text-xs space-y-1.5">
              <div className="text-center font-bold text-[#363739]">{companySettings.tradeName || companySettings.companyName}</div>
              <div className="text-center text-[10px] text-[#707174]">COMPROVANTE DE RECEBIMENTO PDV</div>
              <div className="border-t border-dashed border-[#c2c4c8] my-2" />
              <div className="flex justify-between">
                <span>Documento:</span>
                <strong>{receiptMovement.sourceCode || receiptMovement.id}</strong>
              </div>
              {receiptMovement.clientName && (
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span className="truncate max-w-[180px]">{receiptMovement.clientName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Terminal:</span>
                <span>{receiptMovement.terminalName || 'Caixa 01'}</span>
              </div>
              <div className="flex justify-between">
                <span>Forma Pgto:</span>
                <span>{METHOD_LABELS[receiptMovement.paymentMethod]}</span>
              </div>
              <div className="border-t border-dashed border-[#c2c4c8] my-2" />
              <div className="flex justify-between text-sm font-bold text-[#53383e]">
                <span>TOTAL RECEBIDO:</span>
                <span>{formatBRL(receiptMovement.grossAmount)}</span>
              </div>
              {receiptMovement.changeAmount !== undefined && receiptMovement.changeAmount > 0 && (
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>TROCO:</span>
                  <span>{formatBRL(receiptMovement.changeAmount)}</span>
                </div>
              )}
              {receiptMovement.nsu && (
                <div className="flex justify-between text-[11px] text-[#707174]">
                  <span>NSU:</span>
                  <span>{receiptMovement.nsu}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#363739] bg-[#f4f5f6] hover:bg-[#e5e6e8] border border-[#d8d8d8] rounded-lg cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadReceipt(receiptMovement)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#363739] bg-[#f4f5f6] hover:bg-[#e5e6e8] border border-[#d8d8d8] rounded-lg cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setReceiptMovement(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
