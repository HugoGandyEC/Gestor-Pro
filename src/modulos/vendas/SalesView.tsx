import React, { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  CreditCard,
  CheckCircle2,
  Printer,
  Download,
  Edit3,
  Store,
  Send,
  X,
  Check,
  MessageSquare,
  Lock,
  Unlock,
  Ban,
  KeyRound,
  AlertTriangle,
  ArrowRightCircle,
  Split,
  Search,
  Eraser,
  Package,
  Wrench
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../../context/AppContext';
import { SaleItem, PaymentMethod, PaymentSplit, CardBrand, DirectSale, Product, ServiceCatalogItem } from '../../types';
import { WhatsAppModal } from '../../components/WhatsAppModal';
import { LiveSearchInput } from '../../components/LiveSearchInput';
import { RecordDetailModal } from '../../components/RecordDetailModal';
import { ViewModeToggle, ViewMode } from '../../components/ViewModeToggle';
import { useRowHoverTooltip } from '../../components/RowHoverTooltip';

interface SalesViewProps {
  onSendToPdvAndNavigate?: (saleId: string) => void;
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

export const SalesView: React.FC<SalesViewProps> = ({ onSendToPdvAndNavigate }) => {
  const {
    directSales,
    employees,
    clients,
    products,
    serviceCatalog,
    addDirectSale,
    updateDirectSale,
    cancelDirectSale,
    deleteDirectSale,
    authorizePdvSaleDelete,
    sendSaleToPdv,
    settleSaleInPdv,
    getReceiptsForSource,
    getPaidAmountForSource,
    openReceiptModal,
    cardRates,
    cardOperators,
    currentRole,
    companySettings
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<DirectSale | null>(null);
  const [chargingSale, setChargingSale] = useState<DirectSale | null>(null);
  const [salePayMode, setSalePayMode] = useState<'full' | 'partial'>('full');
  const [salePartialAmount, setSalePartialAmount] = useState<number>(0);
  const [pdvSuccessMessage, setPdvSuccessMessage] = useState<string | null>(null);
  const [pdvTerminal, setPdvTerminal] = useState<string>(TERMINALS[0]);
  const [chargingSplits, setChargingSplits] = useState<PaymentSplit[]>([]);
  const [chargingError, setChargingError] = useState<string | null>(null);
  const [whatsAppSale, setWhatsAppSale] = useState<DirectSale | null>(null);

  // Cancelamento (qualquer pessoa com acesso a Vendas) & Exclusão (apenas com senha de Admin ou permitido)
  const [cancelingSale, setCancelingSale] = useState<DirectSale | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [deletingSale, setDeletingSale] = useState<DirectSale | null>(null);
  const [deletePasswordInput, setDeletePasswordInput] = useState('');
  const [deleteAuthError, setDeleteAuthError] = useState<string | null>(null);
  const [salesActionToast, setSalesActionToast] = useState<string | null>(null);

  const [clientId, setClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [quickAddQty, setQuickAddQty] = useState<number>(1);
  const [employeeId, setEmployeeId] = useState(employees[3]?.id || employees[0]?.id || '');
  const [priceType, setPriceType] = useState<'varejo' | 'atacado'>('varejo');
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [modalTerminal, setModalTerminal] = useState<string>(TERMINALS[0]);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [salesSearch, setSalesSearch] = useState('');
  const [salesStatusFilter, setSalesStatusFilter] = useState<'todos' | 'pendentes' | 'pagos' | 'cancelados'>('todos');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [detailSale, setDetailSale] = useState<DirectSale | null>(null);
  const { showTooltip, hideTooltip, tooltipElement } = useRowHoverTooltip();

  const selectedClient = clients.find(c => c.id === clientId) || null;
  const isWholesaleUnlocked = selectedClient?.customerType === 'atacado';
  const effectivePriceType: 'varejo' | 'atacado' = isWholesaleUnlocked ? priceType : 'varejo';

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        (c.tradeName || '').toLowerCase().includes(q) ||
        (c.document || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q)
    );
  }, [clients, clientSearch]);

  const [items, setItems] = useState<SaleItem[]>([]);
  const [payments, setPayments] = useState<PaymentSplit[]>([
    { id: 'p1', method: 'pix', amount: 0, netAmount: 0 }
  ]);

  const showToast = (msg: string) => {
    setSalesActionToast(msg);
    setTimeout(() => {
      setSalesActionToast(prev => (prev === msg ? null : prev));
    }, 5000);
  };

  // Helper: taxa de maquininha conforme forma, bandeira e parcelas
  const getFeePercentage = (method: PaymentMethod, brand: CardBrand = 'visa', inst = 1): number => {
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
      if (inst <= 1) {
        return brandRate?.creditSightRate ?? defaultOp?.creditSightRate ?? 3.19;
      }
      const customInst = defaultOp?.installmentRates?.find(ir => ir.installment === inst);
      if (customInst) return customInst.rate;
      return (
        brandRate?.creditInstallmentsRate ??
        (inst <= 6 ? defaultOp?.creditInstallments2to6Rate : defaultOp?.creditInstallments7to12Rate) ??
        4.99
      );
    }
    return 0;
  };

  const enrichSplit = (sp: PaymentSplit): PaymentSplit => {
    const isCard = sp.method === 'cartao_credito' || sp.method === 'cartao_debito';
    const brand: CardBrand | undefined = isCard ? (sp.cardBrand || 'visa') : undefined;
    const inst = sp.method === 'cartao_credito' ? Math.max(1, sp.installments || 1) : undefined;
    const amt = Number(sp.amount || 0);
    const feePct = getFeePercentage(sp.method, brand || 'visa', inst || 1);
    const feeAmt = Number(((amt * feePct) / 100).toFixed(2));
    const netAmt = Number((amt - feeAmt).toFixed(2));
    return {
      ...sp,
      cardBrand: brand,
      installments: inst,
      ratePercentage: feePct,
      rateAmount: feeAmt,
      netAmount: netAmt
    };
  };

  const formatPaymentSummary = (sale: DirectSale): string => {
    const splits = sale.payments && sale.payments.length > 0 ? sale.payments : [];
    if (splits.length === 0) {
      return METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod.replace('_', ' ').toUpperCase();
    }
    return splits
      .map(p => {
        const label = METHOD_LABELS[p.method] || p.method.replace('_', ' ');
        const brandStr = p.cardBrand ? ` ${p.cardBrand.toUpperCase()}` : '';
        const instStr = p.method === 'cartao_credito' && p.installments && p.installments > 1 ? ` ${p.installments}x` : '';
        return `${label}${brandStr}${instStr}`;
      })
      .join(' + ');
  };

  const handlePrintSale = (_sale: DirectSale) => {
    window.print();
  };

  const handleDownloadSale = (sale: DirectSale) => {
    const companyLogoHtml = companySettings.logoUrl
      ? `<img src="${companySettings.logoUrl}" style="max-height: 55px; max-width: 160px; object-fit: contain; margin-bottom: 8px; display: block;" alt="Logo" />`
      : '';

    const paymentLinesHtml = (sale.payments && sale.payments.length > 0 ? sale.payments : [{ id: '1', method: sale.paymentMethod, amount: sale.total, netAmount: sale.total }])
      .map(p => {
        const label = METHOD_LABELS[p.method] || p.method;
        const brand = p.cardBrand ? ` · Bandeira: ${p.cardBrand.toUpperCase()}` : '';
        const inst = p.method === 'cartao_credito' ? ` (${p.installments || 1}x)` : '';
        return `<li>${label}${brand}${inst}: <strong>R$ ${Number(p.amount || 0).toFixed(2)}</strong></li>`;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Venda_${sale.code}_${sale.clientName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 30px; color: #363739; margin: 0; }
    .header { border-bottom: 2px solid #53383e; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .brand { font-size: 20px; font-weight: bold; color: #53383e; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
    th { background: #53383e; color: #fff; padding: 8px 10px; text-align: left; }
    td { padding: 8px 10px; border-bottom: 1px solid #d8d8d8; }
    .total { margin-top: 20px; padding: 14px; background: #f6eff1; border-radius: 8px; text-align: right; font-size: 14px; font-weight: bold; color: #53383e; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      ${companyLogoHtml}
      <div class="brand">${companySettings.tradeName || companySettings.companyName || 'GESTAOPRO'} · Comprovante de Venda</div>
      <div style="font-size: 11px; color: #707174;">${companySettings.companyName || 'Varejo & Atacado'}</div>
      <div style="font-size: 10px; color: #707174; margin-top: 2px;">
        ${[companySettings.cnpj ? `CNPJ: ${companySettings.cnpj}` : '', companySettings.phone ? `Tel: ${companySettings.phone}` : '', companySettings.city ? `${companySettings.city}/${companySettings.state || ''}` : ''].filter(Boolean).join(' · ')}
      </div>
    </div>
    <div style="text-align: right; font-size: 12px;">
      <div><strong>Pedido Nº:</strong> ${sale.code}</div>
      <div><strong>Data:</strong> ${sale.date}</div>
      <div><strong>Tabela:</strong> ${sale.priceType.toUpperCase()}</div>
      ${sale.status === 'cancelada' ? '<div style="color:#be123c;font-weight:bold;">STATUS: CANCELADA</div>' : ''}
    </div>
  </div>
  <div style="font-size: 12px; margin-bottom: 15px;">
    <strong>Cliente:</strong> ${sale.clientName}
  </div>
  <table>
    <thead>
      <tr>
        <th>Item / Produto</th>
        <th style="text-align: center;">Qtd</th>
        <th style="text-align: right;">Unitário</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${sale.items.map(it => `
        <tr>
          <td>${it.name}</td>
          <td style="text-align: center;">${it.quantity}</td>
          <td style="text-align: right;">R$ ${it.price.toFixed(2)}</td>
          <td style="text-align: right;">R$ ${(it.price * it.quantity).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div style="margin-top: 15px; font-size: 12px;">
    <strong>Formas de Pagamento:</strong>
    <ul style="margin: 6px 0 0 18px; padding: 0;">${paymentLinesHtml}</ul>
  </div>
  <div class="total">
    Total da Venda: R$ ${sale.total.toFixed(2)}
    ${sale.calculatedDiscount > 0 ? `<br><span style="font-size: 11px; color: #e11d48;">Desconto Aplicado: -R$ ${sale.calculatedDiscount.toFixed(2)}</span>` : ''}
  </div>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Venda_${sale.code}_${sale.clientName.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const recalculateItemsForPriceType = (targetPriceType: 'varejo' | 'atacado') => {
    setItems(prev =>
      prev.map(it => {
        if (!it.productId) return it;
        const prod = products.find(p => p.id === it.productId);
        if (!prod) return it;
        return {
          ...it,
          price: targetPriceType === 'atacado' ? prod.wholesalePrice : prod.retailPrice
        };
      })
    );
  };

  const handleSelectClient = (newClientId: string) => {
    setClientId(newClientId);
    const cli = clients.find(c => c.id === newClientId);
    if (cli?.customerType === 'atacado') {
      setPriceType('atacado');
      recalculateItemsForPriceType('atacado');
    } else {
      setPriceType('varejo');
      recalculateItemsForPriceType('varejo');
    }
  };

  const handlePriceTypeChange = (nextType: 'varejo' | 'atacado') => {
    if (nextType === 'atacado' && !isWholesaleUnlocked) {
      setSaleError('Busque e selecione um cliente cadastrado como Atacadista para liberar os valores de atacado.');
      return;
    }
    setSaleError(null);
    setPriceType(nextType);
    recalculateItemsForPriceType(nextType);
  };

  const resetSaleDraftFields = () => {
    setEditingSale(null);
    setClientId('');
    setClientSearch('');
    setItemSearch('');
    setQuickAddQty(1);
    setPriceType('varejo');
    setDiscountType('fixed');
    setDiscountValue(0);
    setModalTerminal(TERMINALS[0]);
    setSaleError(null);
    setItems([]);
    setPayments([enrichSplit({ id: `p-${Date.now()}`, method: 'pix', amount: 0, netAmount: 0 })]);
  };

  const handleOpenNewSaleModal = () => {
    resetSaleDraftFields();
    setIsModalOpen(true);
  };

  const handleDiscardUnsavedSale = () => {
    const wasEditing = Boolean(editingSale);
    resetSaleDraftFields();
    setIsModalOpen(false);
    showToast(
      wasEditing
        ? 'Edição cancelada. Nenhuma alteração foi salva.'
        : 'Venda cancelada antes de ser adicionada e campos limpos.'
    );
  };

  const handleOpenEditSaleModal = (sale: DirectSale) => {
    const saleClient = sale.clientId ? clients.find(c => c.id === sale.clientId) : undefined;
    setEditingSale(sale);
    setClientId(sale.clientId || '');
    setClientSearch('');
    setItemSearch('');
    setQuickAddQty(1);
    setEmployeeId(sale.employeeId);
    setPriceType(saleClient?.customerType === 'atacado' ? sale.priceType : 'varejo');
    setDiscountType(sale.discountType || 'fixed');
    setDiscountValue(sale.discountValue || 0);
    setModalTerminal(sale.pdvTerminal || TERMINALS[0]);
    setItems(sale.items.map(it => ({ ...it })));
    const initialSplits =
      sale.payments && sale.payments.length > 0
        ? sale.payments.map(p => enrichSplit({ ...p }))
        : [enrichSplit({ id: `p-${Date.now()}`, method: sale.paymentMethod || 'pix', amount: sale.total, netAmount: sale.total })];
    setPayments(initialSplits);
    setSaleError(null);
    setIsModalOpen(true);
  };

  const handleOpenChargingModal = (sale: DirectSale) => {
    const paidSoFar = getPaidAmountForSource('venda', sale.id);
    const remaining = Math.max(0, Number((sale.total - paidSoFar).toFixed(2))) || sale.total;
    const planned = (sale.payments || []).filter(p => p.status !== 'pago');

    setChargingSale(sale);
    setPdvTerminal(sale.pdvTerminal || TERMINALS[0]);
    setSalePayMode('full');
    setSalePartialAmount(remaining);
    setChargingError(null);
    setPdvSuccessMessage(null);

    if (planned.length > 0 && paidSoFar <= 0) {
      setChargingSplits(planned.map((p, idx) => enrichSplit({ ...p, id: p.id || `cs-${Date.now()}-${idx}` })));
    } else {
      setChargingSplits([
        enrichSplit({
          id: `cs-${Date.now()}`,
          method: sale.paymentMethod || 'pix',
          cardBrand: sale.paymentMethod?.includes('cartao') ? 'visa' : undefined,
          installments: sale.paymentMethod === 'cartao_credito' ? 1 : undefined,
          amount: remaining,
          netAmount: remaining
        })
      ]);
    }
  };

  const syncPaymentsForUpdatedItems = (nextItems: SaleItem[], nextDiscountVal = discountValue) => {
    const sub = nextItems.reduce((acc, it) => acc + Number(it.price || 0) * Number(it.quantity || 0), 0);
    const disc = discountType === 'percent' ? (sub * (Number(nextDiscountVal) || 0)) / 100 : Number(nextDiscountVal) || 0;
    const nextTotal = Math.max(0, Number((sub - disc).toFixed(2)));

    if (nextItems.length === 0) {
      setDiscountValue(0);
      setPayments([enrichSplit({ id: `p-${Date.now()}`, method: payments[0]?.method || 'pix', amount: 0, netAmount: 0 })]);
      return;
    }

    if (payments.length === 1) {
      setPayments(prev => prev.map((p, i) => (i === 0 ? enrichSplit({ ...p, amount: nextTotal }) : p)));
    }
  };

  const handleAddProductToSale = (prod: Product, qty = quickAddQty) => {
    const cleanQty = Math.max(1, Number(qty) || 1);
    const unitPrice =
      effectivePriceType === 'atacado'
        ? Number(prod.wholesalePrice || prod.retailPrice || 0)
        : Number(prod.retailPrice || 0);

    const existingIdx = items.findIndex(it => it.productId === prod.id);
    let nextItems: SaleItem[];
    if (existingIdx >= 0) {
      nextItems = items.map((it, i) =>
        i === existingIdx ? { ...it, quantity: Number(it.quantity || 0) + cleanQty, price: unitPrice } : it
      );
    } else {
      nextItems = [
        ...items,
        {
          id: `it-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productId: prod.id,
          name: prod.name,
          quantity: cleanQty,
          cost: Number(prod.costPrice || 0),
          price: unitPrice,
          unit: prod.unit || 'UN'
        }
      ];
    }
    setItems(nextItems);
    setSaleError(null);
    setQuickAddQty(1);
    syncPaymentsForUpdatedItems(nextItems);
  };

  const handleAddServiceToSale = (srv: ServiceCatalogItem, qty = quickAddQty) => {
    const cleanQty = Math.max(1, Number(qty) || 1);
    const unitPrice = Number(srv.standardPrice || srv.minPrice || 0);
    const nextItems: SaleItem[] = [
      ...items,
      {
        id: `srv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: undefined,
        name: `[Serviço] ${srv.name}`,
        quantity: cleanQty,
        cost: 0,
        price: unitPrice,
        unit: 'SV'
      }
    ];
    setItems(nextItems);
    setSaleError(null);
    setQuickAddQty(1);
    syncPaymentsForUpdatedItems(nextItems);
  };

  const handleAddBlankItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: `avulso-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: undefined,
        name: '',
        quantity: 1,
        cost: 0,
        price: 0,
        unit: 'UN'
      }
    ]);
    setSaleError(null);
  };

  const handleRemoveItem = (idx: number) => {
    const nextItems = items.filter((_, i) => i !== idx);
    setItems(nextItems);
    syncPaymentsForUpdatedItems(nextItems);
  };

  const handleClearAllItems = () => {
    setItems([]);
    setItemSearch('');
    setQuickAddQty(1);
    setDiscountValue(0);
    setSaleError(null);
    setPayments([enrichSplit({ id: `p-${Date.now()}`, method: 'pix', amount: 0, netAmount: 0 })]);
  };

  const handleProductSelect = (idx: number, prodId: string) => {
    if (!prodId) {
      const nextItems = items.map((it, i) =>
        i === idx ? { ...it, productId: undefined, name: '', cost: 0, price: 0, unit: 'UN' } : it
      );
      setItems(nextItems);
      syncPaymentsForUpdatedItems(nextItems);
      return;
    }
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    const price = effectivePriceType === 'atacado' ? prod.wholesalePrice : prod.retailPrice;
    const updated = items.map((it, i) =>
      i === idx
        ? {
            ...it,
            productId: prod.id,
            name: prod.name,
            cost: prod.costPrice,
            price,
            unit: prod.unit
          }
        : it
    );
    setItems(updated);
    syncPaymentsForUpdatedItems(updated);
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, it) => acc + Number(it.price || 0) * Number(it.quantity || 0), 0);
  };

  const calculateDiscountAmount = (sub: number) => {
    if (discountType === 'percent') {
      return (sub * (Number(discountValue) || 0)) / 100;
    }
    return Number(discountValue) || 0;
  };

  const modalSubtotal = calculateSubtotal();
  const modalDiscount = calculateDiscountAmount(modalSubtotal);
  const modalTotal = Math.max(0, Number((modalSubtotal - modalDiscount).toFixed(2)));
  const allocatedPaymentsTotal = Number(payments.reduce((acc, p) => acc + Number(p.amount || 0), 0).toFixed(2));
  const unallocatedDiff = Number((modalTotal - allocatedPaymentsTotal).toFixed(2));
  const totalEstimatedFees = Number(payments.reduce((acc, p) => acc + Number(p.rateAmount || 0), 0).toFixed(2));
  const totalEstimatedNet = Number(payments.reduce((acc, p) => acc + Number(p.netAmount || 0), 0).toFixed(2));

  const handleAddSplitPayment = () => {
    const remaining = Math.max(0, Number((modalTotal - allocatedPaymentsTotal).toFixed(2)));
    const nextBrand: CardBrand = payments.some(p => p.cardBrand === 'visa') ? 'mastercard' : 'visa';
    setPayments(prev => [
      ...prev,
      enrichSplit({
        id: `p-${Date.now()}-${prev.length}`,
        method: 'cartao_credito',
        cardBrand: nextBrand,
        installments: 1,
        amount: remaining,
        netAmount: remaining
      })
    ]);
  };

  const updatePaymentRow = (idx: number, patch: Partial<PaymentSplit>) => {
    setPayments(prev =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        const nextMethod = patch.method ?? row.method;
        const isCard = nextMethod === 'cartao_credito' || nextMethod === 'cartao_debito';
        return enrichSplit({
          ...row,
          ...patch,
          cardBrand: isCard ? (patch.cardBrand ?? row.cardBrand ?? 'visa') : undefined,
          installments: nextMethod === 'cartao_credito' ? (patch.installments ?? row.installments ?? 1) : undefined
        });
      })
    );
  };

  const handleSaveSale = (mode: 'queue_only' | 'go_to_pdv' | 'settle_now') => {
    const client = clientId ? clients.find(c => c.id === clientId) : undefined;
    const validItems = items.filter(it => it.name.trim() !== '' && Number(it.quantity) > 0);
    if (validItems.length === 0) {
      setSaleError('Adicione ao menos um item válido à venda.');
      return;
    }

    const enrichedPayments = payments
      .map(p => enrichSplit(p))
      .filter(p => Number(p.amount || 0) > 0);

    if (enrichedPayments.length === 0) {
      setSaleError('Informe ao menos uma forma de pagamento com valor maior que zero.');
      return;
    }

    const splitSum = enrichedPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    if (Math.abs(splitSum - modalTotal) > 0.05) {
      setSaleError(
        `A soma das formas de pagamento (${formatBRL(splitSum)}) precisa fechar exatamente com o total líquido da venda (${formatBRL(modalTotal)}).`
      );
      return;
    }

    setSaleError(null);

    const finalPriceType: 'varejo' | 'atacado' =
      client?.customerType === 'atacado' && priceType === 'atacado' ? 'atacado' : 'varejo';

    const nowIso = new Date().toISOString();
    const targetTerminal = modalTerminal || TERMINALS[0];

    let savedSaleId = '';
    let savedSaleCode = '';
    let saleObjForSettle: DirectSale | undefined;

    if (editingSale) {
      updateDirectSale(editingSale.id, {
        clientId: client?.id,
        clientName: client?.name || 'Venda Balcão Avulsa',
        employeeId,
        priceType: finalPriceType,
        items: validItems,
        discountType,
        discountValue: Number(discountValue),
        calculatedDiscount: modalDiscount,
        total: modalTotal,
        paymentMethod: enrichedPayments[0]?.method || 'pix',
        payments: enrichedPayments,
        pdvTerminal: targetTerminal,
        sentToPdvAt: nowIso
      });
      savedSaleId = editingSale.id;
      savedSaleCode = editingSale.code;
      saleObjForSettle = {
        ...editingSale,
        clientId: client?.id,
        clientName: client?.name || 'Venda Balcão Avulsa',
        employeeId,
        priceType: finalPriceType,
        items: validItems,
        discountType,
        discountValue: Number(discountValue),
        calculatedDiscount: modalDiscount,
        total: modalTotal,
        paymentMethod: enrichedPayments[0]?.method || 'pix',
        payments: enrichedPayments,
        pdvTerminal: targetTerminal,
        sentToPdvAt: nowIso
      };
    } else {
      const createdSale = addDirectSale({
        clientId: client?.id,
        clientName: client?.name || 'Venda Balcão Avulsa',
        employeeId,
        date: nowIso.split('T')[0],
        priceType: finalPriceType,
        items: validItems,
        discountType,
        discountValue: Number(discountValue),
        calculatedDiscount: modalDiscount,
        total: modalTotal,
        paymentMethod: enrichedPayments[0]?.method || 'pix',
        payments: enrichedPayments,
        paymentStatus: 'pendente',
        pdvTerminal: targetTerminal,
        sentToPdvAt: nowIso
      });
      savedSaleId = createdSale.id;
      savedSaleCode = createdSale.code;
      saleObjForSettle = createdSale;
    }

    if (mode === 'settle_now' && saleObjForSettle) {
      settleSaleInPdv(savedSaleId, {
        payments: enrichedPayments,
        paymentMethod: enrichedPayments[0]?.method || 'pix',
        terminalName: targetTerminal,
        saleOverride: saleObjForSettle,
        paidAmount: modalTotal
      });
      showToast(`Venda ${savedSaleCode} recebida e recibo emitido!`);
    } else if (mode === 'go_to_pdv') {
      sendSaleToPdv(savedSaleId, targetTerminal);
      setIsModalOpen(false);
      setEditingSale(null);
      setDiscountValue(0);
      if (onSendToPdvAndNavigate) {
        onSendToPdvAndNavigate(savedSaleId);
      } else {
        showToast(`Venda ${savedSaleCode} enviada para o terminal ${targetTerminal}.`);
      }
      return;
    } else {
      sendSaleToPdv(savedSaleId, targetTerminal);
      showToast(`Venda ${savedSaleCode} salva e enviada para a fila do ${targetTerminal}!`);
    }

    setIsModalOpen(false);
    setEditingSale(null);
    setDiscountValue(0);
  };

  const activeSales = directSales.filter(s => s.status !== 'cancelada');
  const totalSalesVolume = activeSales.reduce((acc, s) => acc + s.total, 0);

  const filteredSales = directSales.filter(sale => {
    if (salesStatusFilter === 'cancelados' && sale.status !== 'cancelada') return false;
    if (salesStatusFilter === 'pagos' && (sale.status === 'cancelada' || sale.paymentStatus !== 'pago')) return false;
    if (salesStatusFilter === 'pendentes' && (sale.status === 'cancelada' || sale.paymentStatus === 'pago')) return false;

    const q = salesSearch.trim().toLowerCase();
    if (!q) return true;
    const seller = employees.find(e => e.id === sale.employeeId);
    return (
      sale.code.toLowerCase().includes(q) ||
      sale.clientName.toLowerCase().includes(q) ||
      (seller?.name || '').toLowerCase().includes(q) ||
      formatPaymentSummary(sale).toLowerCase().includes(q) ||
      sale.items.some(it => it.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Vendas & Balcão
            </h1>
            <span className="hidden md:inline-block text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Varejo & Atacado · Múltiplas Formas & Bandeiras
            </span>
          </div>
          <p className="hidden md:block text-xs text-slate-500 mt-1">
            Lançamento de vendas com múltiplos pagamentos e bandeiras de cartão diferentes, envio direto ao PDV para finalização e controle de cancelamento/exclusão.
          </p>
        </div>

        {currentRole !== 'tecnico' && (
          <button
            onClick={handleOpenNewSaleModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Venda / Balcão</span>
          </button>
        )}
      </div>

      {/* Feedback Toast Banner */}
      {salesActionToast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{salesActionToast}</span>
          </div>
          <button type="button" onClick={() => setSalesActionToast(null)} className="text-emerald-700 hover:text-emerald-950 p-0.5 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Volume Total em Vendas Diretas</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {formatBRL(totalSalesVolume)}
          </div>
          <div className="hidden md:block text-xs text-slate-500 mt-1">
            {activeSales.length} pedidos ativos com baixa de estoque
          </div>
        </div>

        <div className="hidden sm:block p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Ticket Médio por Venda</span>
          <div className="text-2xl font-bold font-mono text-blue-600 mt-1">
            {formatBRL(activeSales.length > 0 ? totalSalesVolume / activeSales.length : 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Preços tabelados no varejo e atacado
          </div>
        </div>

        <div className="hidden sm:block p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Comissões sobre Vendas</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {formatBRL(totalSalesVolume * 0.04)}
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">
            Média de 4% comissionada aos consultores
          </div>
        </div>
      </div>

      {/* Sales Table: Busca Dinâmica + Filtro + Compacta com Hover Details + Cards Mobile */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900">
            Histórico de Vendas Faturadas ({filteredSales.length})
          </h2>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={salesStatusFilter}
              onChange={(e) => setSalesStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700"
            >
              <option value="todos">Status: Todas</option>
              <option value="pendentes">Pendentes no PDV</option>
              <option value="pagos">Liquidadas / Pagas</option>
              <option value="cancelados">Canceladas</option>
            </select>
            <div className="flex-1 sm:w-64">
              <LiveSearchInput
                value={salesSearch}
                onChange={setSalesSearch}
                placeholder="Buscar venda por código, cliente, bandeira ou item..."
                emptyLabel="Nenhuma venda"
                inputClassName="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                getOptions={(query) => {
                  const q = query.toLowerCase();
                  return directSales
                    .filter(
                      s =>
                        s.code.toLowerCase().includes(q) ||
                        s.clientName.toLowerCase().includes(q) ||
                        formatPaymentSummary(s).toLowerCase().includes(q) ||
                        s.items.some(it => it.name.toLowerCase().includes(q))
                    )
                    .map(s => ({
                      id: s.id,
                      title: `${s.code} · ${s.clientName}`,
                      subtitle: `${formatDateBR(s.date)} · ${s.items.length} item(ns)`,
                      priceText: formatBRL(s.total),
                      badgeText: s.status === 'cancelada' ? 'Cancelada' : s.paymentStatus === 'pago' ? 'Pago' : 'Pendente',
                      data: s
                    }));
                }}
                onSelect={(opt) => setSalesSearch(opt.data.code)}
              />
            </div>
            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {filteredSales.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            Nenhuma venda encontrada para os critérios informados.
          </div>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="dense-table text-left text-xs">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th className="hidden md:table-cell">Data</th>
                  <th className="hidden lg:table-cell">Pagamento / Bandeira</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map(sale => {
                  const seller = employees.find(e => e.id === sale.employeeId);
                  const subtotal = sale.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
                  const itemsSummary = sale.items.map(it => `${it.quantity}x ${it.name}`).join(', ');
                  const paymentLabel = formatPaymentSummary(sale);
                  const isCancelled = sale.status === 'cancelada';
                  return (
                    <tr
                      key={sale.id}
                      className={`dense-row ${isCancelled ? 'bg-rose-50/40' : ''}`}
                      onMouseEnter={(e) =>
                        showTooltip(e, {
                          title: `Venda ${sale.code} · ${sale.clientName}`,
                          subtitle: `${formatDateBR(sale.date)} · Tabela ${sale.priceType === 'atacado' ? 'Atacado' : 'Varejo'} · ${
                            isCancelled ? 'Cancelada' : sale.paymentStatus === 'pago' ? 'Liquidado' : 'Pendente no PDV'
                          }`,
                          description: itemsSummary || undefined,
                          fields: [
                            { label: 'Vendedor', value: seller?.name || 'Balcão' },
                            { label: 'Terminal PDV', value: sale.pdvTerminal || 'Caixa 01' },
                            { label: 'Pagamento(s)', value: paymentLabel },
                            { label: 'Itens', value: `${sale.items.length} item(ns)` },
                            { label: 'Subtotal / Desconto', value: `${formatBRL(subtotal)} · -${formatBRL(sale.calculatedDiscount || 0)}` },
                            { label: 'Total Líquido', value: formatBRL(sale.total) }
                          ]
                        })
                      }
                      onMouseLeave={hideTooltip}
                    >
                      <td className="font-mono font-bold text-blue-600">{sale.code}</td>
                      <td>
                        <div className="font-bold text-slate-900">{sale.clientName}</div>
                        <div className="text-[10px] text-slate-500">
                          {sale.priceType === 'atacado' ? 'Atacado' : 'Varejo'}
                          {sale.sentToPdvAt && !isCancelled && sale.paymentStatus !== 'pago' ? ' · Na fila do PDV' : ''}
                        </div>
                      </td>
                      <td className="hidden md:table-cell font-mono text-slate-600 tabular-nums">{formatDateBR(sale.date)}</td>
                      <td className="hidden lg:table-cell text-[11px] font-medium text-slate-700 max-w-[220px] truncate">
                        {paymentLabel}
                      </td>
                      <td
                        className={`font-semibold ${
                          isCancelled
                            ? 'text-rose-700'
                            : sale.paymentStatus === 'pago'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {isCancelled ? 'Cancelada' : sale.paymentStatus === 'pago' ? 'Liquidado' : 'Pendente'}
                      </td>
                      <td
                        className={`text-right font-mono font-bold tabular-nums ${
                          isCancelled ? 'text-slate-400 line-through' : 'text-emerald-700'
                        }`}
                      >
                        {formatBRL(sale.total)}
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          {!isCancelled && sale.paymentStatus !== 'pago' && (
                            <button
                              type="button"
                              onClick={() => handleOpenChargingModal(sale)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-md text-white bg-[#53383e] hover:bg-[#432c32] cursor-pointer"
                              title="Enviar para o PDV / Receber pagamento"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Enviar PDV</span>
                            </button>
                          )}
                          {!isCancelled && sale.paymentStatus === 'pago' && (
                            <button
                              type="button"
                              onClick={() => {
                                const recs = getReceiptsForSource('venda', sale.id);
                                if (recs.length > 0) openReceiptModal(recs[0]);
                                else handleOpenChargingModal(sale);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-md text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                              title="Ver Recibo"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Recibo</span>
                            </button>
                          )}
                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => {
                                setCancelingSale(sale);
                                setCancelReasonInput('');
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 cursor-pointer"
                              title="Cancelar venda (aberto para quem tem acesso a Vendas)"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Cancelar</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingSale(sale);
                              setDeletePasswordInput('');
                              setDeleteAuthError(null);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                            title="Excluir venda (exige senha de Administrador ou funcionário autorizado)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDetailSale(sale)}
                            className="list-plus-btn"
                            title="Abrir todos os dados da venda"
                            aria-label={`Ver detalhes da venda ${sale.code}`}
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 bg-slate-50/40">
            {filteredSales.map(sale => {
              const seller = employees.find(e => e.id === sale.employeeId);
              const isCancelled = sale.status === 'cancelada';
              return (
                <div
                  key={sale.id}
                  className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-colors ${
                    isCancelled ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-blue-600">{sale.code}</span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="font-mono text-[11px] text-slate-500 tabular-nums">{formatDateBR(sale.date)}</span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 mt-0.5 break-words">
                          {sale.clientName}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDetailSale(sale)}
                        className="list-plus-btn shrink-0"
                        title="Abrir todos os dados da venda"
                        aria-label={`Ver detalhes da venda ${sale.code}`}
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-slate-500">
                      <span className={sale.priceType === 'atacado' ? 'font-bold text-purple-700' : 'text-slate-600'}>
                        {sale.priceType === 'atacado' ? 'Tabela Atacado' : 'Tabela Varejo'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-semibold ${
                          isCancelled
                            ? 'text-rose-700'
                            : sale.paymentStatus === 'pago'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {isCancelled ? 'Cancelada' : sale.paymentStatus === 'pago' ? 'Liquidado' : 'Pendente'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{sale.items.length} item(ns)</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                      <div className="text-[11px] text-slate-500">
                        Pagamento: <span className="font-semibold text-slate-800">{formatPaymentSummary(sale)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Vendedor: <span className="font-medium text-slate-800">{seller?.name || 'Balcão'}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {sale.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Líquido</span>
                      <span
                        className={`font-mono font-bold text-sm tabular-nums ${
                          isCancelled ? 'text-slate-400 line-through' : 'text-emerald-700'
                        }`}
                      >
                        {formatBRL(sale.total)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {!isCancelled && sale.paymentStatus !== 'pago' && (
                        <button
                          type="button"
                          onClick={() => handleOpenChargingModal(sale)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg text-white bg-[#53383e] hover:bg-[#432c32] cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Enviar PDV</span>
                        </button>
                      )}
                      {!isCancelled && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancelingSale(sale);
                            setCancelReasonInput('');
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Cancelar</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingSale(sale);
                          setDeletePasswordInput('');
                          setDeleteAuthError(null);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                        title="Excluir (requer senha)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {tooltipElement}

      {/* Modal Completa da Venda (Aberta pelo botão +) */}
      {(() => {
        if (!detailSale) return null;
        const sale = detailSale;
        const seller = employees.find(e => e.id === sale.employeeId);
        const isCancelled = sale.status === 'cancelada';
        return (
          <RecordDetailModal
            isOpen={true}
            onClose={() => setDetailSale(null)}
            title={`Venda Direta ${sale.code}`}
            subtitle={`Data: ${formatDateBR(sale.date)} · Tabela: ${sale.priceType === 'atacado' ? 'Atacado' : 'Varejo'}`}
            statusText={isCancelled ? 'Cancelada' : sale.paymentStatus === 'pago' ? 'Liquidado' : 'Pendente no PDV'}
            statusClassName={isCancelled ? 'text-rose-700' : sale.paymentStatus === 'pago' ? 'text-emerald-700' : 'text-amber-700'}
            sections={[
              {
                heading: 'Cliente, Vendedor & Terminal',
                fields: [
                  { label: 'Cliente', value: sale.clientName },
                  { label: 'Vendedor / Consultor', value: seller?.name || 'Balcão' },
                  { label: 'Terminal PDV', value: sale.pdvTerminal || 'Não enviado' },
                  { label: 'Resumo Pagamento', value: formatPaymentSummary(sale) }
                ]
              },
              {
                heading: 'Totais',
                fields: [
                  { label: 'Subtotal', value: formatBRL(sale.items.reduce((acc, it) => acc + it.price * it.quantity, 0)) },
                  { label: 'Desconto Aplicado', value: `-${formatBRL(sale.calculatedDiscount || 0)}` },
                  { label: 'Total Líquido', value: formatBRL(sale.total) }
                ]
              }
            ]}
            customContent={
              <div className="space-y-4">
                {isCancelled && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                    <div className="font-bold">Venda Cancelada</div>
                    {sale.cancelledBy && <div>Responsável: {sale.cancelledBy}</div>}
                    {sale.cancelReason && <div>Motivo: {sale.cancelReason}</div>}
                  </div>
                )}

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Itens Vendidos ({sale.items.length})
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-700 border border-slate-200 rounded-lg p-3 bg-slate-50">
                    {sale.items.map((it, idx) => (
                      <li key={it.id || idx} className="flex justify-between gap-2">
                        <span>{it.quantity}x {it.name}</span>
                        <span className="font-mono font-semibold tabular-nums">
                          {formatBRL(it.price * it.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {sale.payments && sale.payments.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Composição de Pagamentos ({sale.payments.length})
                    </h4>
                    <ul className="space-y-1.5 text-xs font-mono text-slate-700 border border-slate-200 rounded-lg p-3 bg-slate-50 tabular-nums">
                      {sale.payments.map((p, idx) => (
                        <li key={p.id || idx} className="flex flex-wrap justify-between gap-2">
                          <span>
                            {METHOD_LABELS[p.method] || p.method.replace('_', ' ')}
                            {p.cardBrand ? ` · Bandeira ${p.cardBrand.toUpperCase()}` : ''}
                            {p.method === 'cartao_credito' ? ` (${p.installments || 1}x)` : ''}
                            {p.ratePercentage ? ` · Taxa ${p.ratePercentage.toFixed(2)}%` : ''}
                          </span>
                          <span className="font-bold">{formatBRL(p.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            }
            actions={
              <>
                {!isCancelled && sale.paymentStatus !== 'pago' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setDetailSale(null);
                        handleOpenChargingModal(sale);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Enviar / Cobrar no PDV</span>
                    </button>
                    {onSendToPdvAndNavigate && (
                      <button
                        type="button"
                        onClick={() => {
                          sendSaleToPdv(sale.id, sale.pdvTerminal || TERMINALS[0]);
                          setDetailSale(null);
                          onSendToPdvAndNavigate(sale.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                      >
                        <ArrowRightCircle className="w-3.5 h-3.5" />
                        <span>Ir ao PDV Receber</span>
                      </button>
                    )}
                  </>
                )}
                {!isCancelled && sale.paymentStatus !== 'pago' && currentRole !== 'tecnico' && (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailSale(null);
                      handleOpenEditSaleModal(sale);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handlePrintSale(sale)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-slate-300 rounded-lg cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadSale(sale)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-300 rounded-lg cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar</span>
                </button>
                {(() => {
                  const saleReceipts = getReceiptsForSource('venda', sale.id);
                  if (saleReceipts.length === 0) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => openReceiptModal(saleReceipts[0])}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ver Recibo ({saleReceipts[0].receiptNumber})</span>
                    </button>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => {
                    setDetailSale(null);
                    setWhatsAppSale(sale);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                {!isCancelled && (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailSale(null);
                      setCancelingSale(sale);
                      setCancelReasonInput('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Cancelar Venda</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDetailSale(null);
                    setDeletingSale(sale);
                    setDeletePasswordInput('');
                    setDeleteAuthError(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir (Senha)</span>
                </button>
              </>
            }
          />
        );
      })()}

      {/* Modal Nova / Editar Venda */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                {editingSale ? `Editar Venda ${editingSale.code}` : 'Nova Venda Direta / Balcão de Peças'}
              </h3>
              <button
                type="button"
                onClick={handleDiscardUnsavedSale}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Cancelar venda e limpar campos"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs mt-4">
              {saleError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-semibold text-xs">
                  {saleError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-600 font-medium">Buscar & Selecionar Cliente *</label>
                    {selectedClient && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isWholesaleUnlocked ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isWholesaleUnlocked ? 'Atacadista' : 'Varejista'}
                      </span>
                    )}
                  </div>
                  <LiveSearchInput
                    value={clientSearch}
                    onChange={setClientSearch}
                    placeholder="Buscar por nome, CPF/CNPJ ou telefone..."
                    emptyLabel="Nenhum cliente"
                    clearOnSelect
                    inputClassName="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    getOptions={(query) => {
                      const q = query.toLowerCase();
                      return clients
                        .filter(
                          c =>
                            c.name.toLowerCase().includes(q) ||
                            (c.tradeName || '').toLowerCase().includes(q) ||
                            (c.document || '').toLowerCase().includes(q) ||
                            (c.phone || '').toLowerCase().includes(q)
                        )
                        .map(c => ({
                          id: c.id,
                          title: c.name,
                          subtitle: c.document || c.phone || 'Sem documento',
                          badgeText: c.customerType === 'atacado' ? 'Atacadista' : 'Varejista',
                          badgeClassName:
                            c.customerType === 'atacado'
                              ? 'shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800'
                              : 'shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600',
                          data: c
                        }));
                    }}
                    onSelect={(opt) => handleSelectClient(opt.data.id)}
                  />
                  <select
                    value={clientId}
                    onChange={(e) => handleSelectClient(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="">Venda Balcão Avulsa (Varejo)</option>
                    {filteredClients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} [{c.customerType === 'atacado' ? 'Atacadista' : 'Varejista'}]{c.document ? ` · ${c.document}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-600 font-medium">Tabela de Preço</label>
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-100 p-0.5">
                    <button
                      type="button"
                      onClick={() => handlePriceTypeChange('varejo')}
                      className={`flex-1 py-1.5 font-bold rounded-md cursor-pointer ${
                        effectivePriceType === 'varejo' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Varejo (Padrão)
                    </button>
                    <button
                      type="button"
                      disabled={!isWholesaleUnlocked}
                      onClick={() => handlePriceTypeChange('atacado')}
                      title={
                        isWholesaleUnlocked
                          ? 'Aplicar tabela de atacado'
                          : 'Busque e selecione um cliente Atacadista para liberar'
                      }
                      className={`flex-1 py-1.5 font-bold rounded-md inline-flex items-center justify-center gap-1 transition-colors ${
                        !isWholesaleUnlocked
                          ? 'text-slate-400 cursor-not-allowed opacity-70'
                          : effectivePriceType === 'atacado'
                          ? 'bg-purple-700 text-white shadow-xs cursor-pointer'
                          : 'text-purple-800 hover:bg-white cursor-pointer'
                      }`}
                    >
                      {!isWholesaleUnlocked && <Lock className="w-3 h-3" />}
                      <span>Atacado (Desconto Lote)</span>
                    </button>
                  </div>
                  {!isWholesaleUnlocked ? (
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        Preços de <strong>atacado</strong> bloqueados. Busque e selecione um cliente cadastrado como <strong>Atacadista</strong> para liberar.
                      </span>
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-[11px] text-purple-900 flex items-start gap-1.5">
                      <Unlock className="w-3.5 h-3.5 text-purple-700 shrink-0 mt-0.5" />
                      <span>
                        Tabela <strong>Atacado liberada</strong> para o cliente atacadista {selectedClient?.name}.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Vendedor / Consultor</label>
                  <select
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Terminal PDV de Destino</label>
                  <select
                    value={modalTerminal}
                    onChange={(e) => setModalTerminal(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    {TERMINALS.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Busca & Lista de Produtos e Serviços */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Search className="w-4 h-4 text-blue-600" />
                      <span>Buscar &amp; Adicionar Produtos ou Serviços</span>
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Pesquise por nome, código, SKU, marca, código de barras ou serviço. Exclua itens a qualquer momento para limpar a lista.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddBlankItem}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Item Avulso</span>
                    </button>
                    {items.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllItems}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold cursor-pointer"
                        title="Remover todos os produtos/serviços e limpar valores"
                      >
                        <Eraser className="w-3.5 h-3.5" />
                        <span>Limpar Lista</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Barra de busca unificada (Produtos + Serviços) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                  <div className="md:col-span-6">
                    <LiveSearchInput<
                      | { kind: 'product'; data: Product }
                      | { kind: 'service'; data: ServiceCatalogItem }
                    >
                      value={itemSearch}
                      onChange={setItemSearch}
                      minChars={1}
                      maxResults={20}
                      clearOnSelect
                      placeholder="Buscar produto (nome, código, marca, barras) ou serviço..."
                      emptyLabel="Nenhum produto ou serviço encontrado"
                      inputClassName="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      getOptions={(query) => {
                        const q = query.trim().toLowerCase();
                        const prodOptions = [...products]
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .filter(
                            p =>
                              p.name.toLowerCase().includes(q) ||
                              (p.code || '').toLowerCase().includes(q) ||
                              (p.sku || '').toLowerCase().includes(q) ||
                              (p.barcode || '').toLowerCase().includes(q) ||
                              (p.brand || '').toLowerCase().includes(q) ||
                              (p.category || '').toLowerCase().includes(q) ||
                              (p.tags || []).some(t => t.toLowerCase().includes(q))
                          )
                          .map(prod => {
                            const unitPrice =
                              effectivePriceType === 'atacado'
                                ? Number(prod.wholesalePrice || prod.retailPrice || 0)
                                : Number(prod.retailPrice || 0);
                            return {
                              id: `prod-${prod.id}`,
                              title: prod.name,
                              subtitle: `${prod.code || prod.sku || 'S/C'}${prod.brand ? ` · ${prod.brand}` : ''} · Estoque: ${prod.currentStock} ${prod.unit}`,
                              priceText: formatBRL(unitPrice),
                              thumbnailUrl: prod.photos?.[0],
                              badgeText: effectivePriceType === 'atacado' ? 'Atacado' : 'Produto',
                              badgeClassName:
                                effectivePriceType === 'atacado'
                                  ? 'shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800'
                                  : 'shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700',
                              data: { kind: 'product' as const, data: prod }
                            };
                          });

                        const srvOptions = [...serviceCatalog]
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .filter(
                            s =>
                              s.name.toLowerCase().includes(q) ||
                              (s.code || '').toLowerCase().includes(q) ||
                              (s.category || '').toLowerCase().includes(q)
                          )
                          .map(srv => ({
                            id: `srv-${srv.id}`,
                            title: srv.name,
                            subtitle: `${srv.code} · ${srv.category}`,
                            priceText: formatBRL(srv.standardPrice),
                            icon: <Wrench className="w-3.5 h-3.5 text-emerald-700" />,
                            badgeText: 'Serviço',
                            badgeClassName: 'shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800',
                            data: { kind: 'service' as const, data: srv }
                          }));

                        return [...prodOptions, ...srvOptions];
                      }}
                      onSelect={(opt) => {
                        if (opt.data.kind === 'product') {
                          handleAddProductToSale(opt.data.data, quickAddQty);
                        } else {
                          handleAddServiceToSale(opt.data.data, quickAddQty);
                        }
                      }}
                    />
                  </div>

                  <div className="md:col-span-4">
                    <select
                      value=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        if (val.startsWith('p:')) {
                          const prod = products.find(p => p.id === val.slice(2));
                          if (prod) handleAddProductToSale(prod, quickAddQty);
                        } else if (val.startsWith('s:')) {
                          const srv = serviceCatalog.find(s => s.id === val.slice(2));
                          if (srv) handleAddServiceToSale(srv, quickAddQty);
                        }
                      }}
                      aria-label="Escolher produto ou serviço da lista"
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                    >
                      <option value="">-- Selecionar da lista ({products.length} prod. / {serviceCatalog.length} serv.) --</option>
                      <optgroup label="Produtos do Estoque">
                        {[...products]
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(p => {
                            const price = effectivePriceType === 'atacado' ? p.wholesalePrice : p.retailPrice;
                            return (
                              <option key={p.id} value={`p:${p.id}`}>
                                {p.code} - {p.name} ({formatBRL(price)} · Est: {p.currentStock})
                              </option>
                            );
                          })}
                      </optgroup>
                      {serviceCatalog.length > 0 && (
                        <optgroup label="Serviços Cadastrados">
                          {[...serviceCatalog]
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(s => (
                              <option key={s.id} value={`s:${s.id}`}>
                                [Serviço] {s.code} - {s.name} ({formatBRL(s.standardPrice)})
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <div className="md:col-span-2 flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500">Qtd:</span>
                    <input
                      type="number"
                      min="1"
                      value={quickAddQty}
                      onChange={(e) => setQuickAddQty(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full text-xs font-mono font-bold text-center focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Lista de itens adicionados */}
                {items.length === 0 ? (
                  <div className="p-4 bg-white border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-500">
                    <Package className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                    Nenhum produto ou serviço na venda ainda. Use a busca acima para adicionar itens.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((it, idx) => (
                      <div
                        key={it.id || idx}
                        className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-2 rounded-lg border border-slate-200"
                      >
                        <span className="text-[10px] font-black text-slate-400 w-5 text-center">#{idx + 1}</span>
                        {it.productId ? (
                          <select
                            value={it.productId}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            className="flex-1 min-w-[180px] p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
                          >
                            <option value="">Limpar produto...</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.code} - {p.name} (Estoque: {p.currentStock})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={it.name}
                            onChange={(e) => {
                              const up = [...items];
                              up[idx] = { ...up[idx], name: e.target.value };
                              setItems(up);
                            }}
                            placeholder="Descrição do produto ou serviço..."
                            className="flex-1 min-w-[180px] p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
                          />
                        )}

                        <input
                          type="number"
                          min="1"
                          placeholder="Qtd"
                          value={it.quantity || ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Math.max(1, Number(e.target.value) || 1);
                            const up = items.map((row, i) => (i === idx ? { ...row, quantity: val } : row));
                            setItems(up);
                            syncPaymentsForUpdatedItems(up);
                          }}
                          className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded font-mono text-center"
                          title="Quantidade"
                        />

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0,00"
                          value={it.price > 0 ? it.price : ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0);
                            const up = items.map((row, i) => (i === idx ? { ...row, price: val } : row));
                            setItems(up);
                            syncPaymentsForUpdatedItems(up);
                          }}
                          className="w-24 p-1.5 bg-slate-50 border border-slate-200 rounded font-mono font-bold text-slate-900 text-right"
                          title="Valor unitário (R$)"
                        />

                        <div className="w-24 text-right font-mono font-bold text-emerald-700 text-xs tabular-nums">
                          {formatBRL(Number(it.price || 0) * Number(it.quantity || 0))}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer shrink-0"
                          title="Excluir este produto/serviço da lista"
                          aria-label={`Excluir item ${it.name || idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Desconto e Resumo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700">Desconto</span>
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => setDiscountType('fixed')}
                        className={`px-2.5 py-1 font-bold cursor-pointer ${
                          discountType === 'fixed' ? 'bg-slate-900 text-white' : 'text-slate-600'
                        }`}
                      >
                        R$
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('percent')}
                        className={`px-2.5 py-1 font-bold cursor-pointer ${
                          discountType === 'percent' ? 'bg-slate-900 text-white' : 'text-slate-600'
                        }`}
                      >
                        %
                      </button>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={discountValue > 0 ? discountValue : ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0);
                        setDiscountValue(val);
                        syncPaymentsForUpdatedItems(items, val);
                      }}
                      className="w-20 p-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-right"
                    />
                  </div>
                </div>

                <div className="p-3 bg-[#f6eff1] border border-[#53383e]/25 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-[#707174]">Subtotal: {formatBRL(modalSubtotal)}</div>
                    <div className="text-[11px] text-rose-700 font-semibold">Desconto: -{formatBRL(modalDiscount)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-[#707174]">Total da Venda</div>
                    <div className="text-lg font-black font-mono text-[#53383e] tabular-nums">{formatBRL(modalTotal)}</div>
                  </div>
                </div>
              </div>

              {/* Múltiplas Formas de Pagamento com Bandeiras Diferentes */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Split className="w-4 h-4 text-[#53383e]" />
                      <span>Múltiplas Formas de Pagamento &amp; Bandeiras</span>
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Adicione quantos cartões ou formas desejar (ex.: PIX + Crédito Visa 3x + Débito Mastercard).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSplitPayment}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Forma / Cartão</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {payments.map((p, idx) => {
                    const isCard = p.method === 'cartao_credito' || p.method === 'cartao_debito';
                    const isCredit = p.method === 'cartao_credito';
                    return (
                      <div
                        key={p.id || idx}
                        className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-2"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 w-5">#{idx + 1}</span>
                          <select
                            value={p.method}
                            onChange={(e) => updatePaymentRow(idx, { method: e.target.value as PaymentMethod })}
                            className="flex-1 min-w-[140px] p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                          >
                            {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map(m => (
                              <option key={m} value={m}>
                                {METHOD_LABELS[m]}
                              </option>
                            ))}
                          </select>

                          {isCard && (
                            <select
                              value={p.cardBrand || 'visa'}
                              onChange={(e) => updatePaymentRow(idx, { cardBrand: e.target.value as CardBrand })}
                              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-[#53383e]"
                              title="Bandeira do Cartão"
                            >
                              {BRANDS.map(b => (
                                <option key={b.id} value={b.id}>
                                  Bandeira: {b.label}
                                </option>
                              ))}
                            </select>
                          )}

                          {isCredit && (
                            <select
                              value={p.installments || 1}
                              onChange={(e) => updatePaymentRow(idx, { installments: Number(e.target.value) })}
                              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                              title="Parcelamento"
                            >
                              {Array.from({ length: 12 }, (_, n) => n + 1).map(n => (
                                <option key={n} value={n}>
                                  {n}x
                                </option>
                              ))}
                            </select>
                          )}

                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0,00"
                              value={p.amount > 0 ? p.amount : ''}
                              onChange={(e) =>
                                updatePaymentRow(idx, {
                                  amount: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0)
                                })
                              }
                              className="w-28 p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-emerald-700 text-right"
                            />
                            {Math.abs(unallocatedDiff) > 0.01 && modalTotal > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  updatePaymentRow(idx, {
                                    amount: Number(Math.max(0, Number(p.amount || 0) + unallocatedDiff).toFixed(2))
                                  })
                                }
                                className="px-2 py-1 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded cursor-pointer"
                                title="Ajustar valor desta forma para fechar o total da venda"
                              >
                                Restante
                              </button>
                            )}
                          </div>

                          {payments.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setPayments(prev => prev.filter((_, i) => i !== idx))}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Remover esta forma de pagamento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 pl-7">
                          <span>
                            {isCard
                              ? `${METHOD_LABELS[p.method]} · Bandeira ${(p.cardBrand || 'visa').toUpperCase()}${isCredit ? ` em ${p.installments || 1}x` : ''}`
                              : METHOD_LABELS[p.method]}
                          </span>
                          <span className="font-mono">
                            Taxa: {(p.ratePercentage || 0).toFixed(2)}% ({formatBRL(p.rateAmount || 0)}) · Líquido: <strong className="text-slate-700">{formatBRL(p.netAmount || p.amount)}</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Alocação de soma */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-[11px]">
                  <div className="flex items-center gap-3">
                    <span>
                      Alocado: <strong className="font-mono text-slate-900">{formatBRL(allocatedPaymentsTotal)}</strong>
                    </span>
                    <span className="text-slate-400">|</span>
                    <span
                      className={`font-bold ${
                        Math.abs(unallocatedDiff) <= 0.05
                          ? 'text-emerald-700'
                          : unallocatedDiff > 0
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {Math.abs(unallocatedDiff) <= 0.05
                        ? 'Soma fechada com o total!'
                        : unallocatedDiff > 0
                        ? `Falta alocar: ${formatBRL(unallocatedDiff)}`
                        : `Excedente: ${formatBRL(Math.abs(unallocatedDiff))}`}
                    </span>
                  </div>
                  <div className="font-mono text-slate-600">
                    Taxas estimadas: <strong>{formatBRL(totalEstimatedFees)}</strong> · Líquido:{' '}
                    <strong className="text-emerald-700">{formatBRL(totalEstimatedNet)}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
                <button
                  type="button"
                  onClick={handleDiscardUnsavedSale}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancelar Venda</span>
                </button>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveSale('queue_only')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#363739] hover:bg-[#252627] rounded-lg shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Salvar &amp; Mandar p/ Fila do PDV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveSale('go_to_pdv')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg shadow-xs cursor-pointer"
                  >
                    <ArrowRightCircle className="w-3.5 h-3.5" />
                    <span>Enviar e Finalizar no PDV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveSale('settle_now')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Receber Agora &amp; Gerar Recibo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cobrança / Envio de Venda ao PDV */}
      {chargingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-[#d8d8d8] flex flex-col">
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-[#d8d8d8] flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#53383e]/10 text-[#53383e] flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#363739] text-base">
                      Enviar ao PDV & Receber Pagamento
                    </h3>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#53383e] text-white">
                      {chargingSale.code}
                    </span>
                  </div>
                  <p className="text-xs text-[#707174]">Cliente: {chargingSale.clientName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setChargingSale(null);
                  setPdvSuccessMessage(null);
                  setChargingError(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {pdvSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-emerald-900">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">{pdvSuccessMessage}</span>
                </div>
              )}

              {chargingError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 font-semibold">
                  {chargingError}
                </div>
              )}

              {/* Terminal dispatch */}
              <div className="p-4 bg-[#f4f5f6] rounded-xl border border-[#d8d8d8] space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#363739]">
                  <Store className="w-4 h-4 text-[#53383e]" />
                  <span>Enviar Venda para o Caixa PDV:</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={pdvTerminal}
                    onChange={(e) => setPdvTerminal(e.target.value)}
                    className="flex-1 p-2 bg-white border border-[#d8d8d8] rounded-lg font-medium text-xs text-[#363739]"
                  >
                    {TERMINALS.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const enriched = chargingSplits.map(enrichSplit).filter(s => Number(s.amount || 0) > 0);
                      if (enriched.length > 0) {
                        updateDirectSale(chargingSale.id, {
                          payments: enriched,
                          paymentMethod: enriched[0].method
                        });
                      }
                      sendSaleToPdv(chargingSale.id, pdvTerminal);
                      setPdvSuccessMessage(
                        `Venda ${chargingSale.code} (${formatBRL(chargingSale.total)}) enviada para a fila do ${pdvTerminal}!`
                      );
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#363739] hover:bg-[#252627] rounded-lg shadow-2xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Mandar p/ Fila</span>
                  </button>
                  {onSendToPdvAndNavigate && chargingSale.paymentStatus !== 'pago' && (
                    <button
                      type="button"
                      onClick={() => {
                        const enriched = chargingSplits.map(enrichSplit).filter(s => Number(s.amount || 0) > 0);
                        if (enriched.length > 0) {
                          updateDirectSale(chargingSale.id, {
                            payments: enriched,
                            paymentMethod: enriched[0].method
                          });
                        }
                        sendSaleToPdv(chargingSale.id, pdvTerminal);
                        const id = chargingSale.id;
                        setChargingSale(null);
                        setPdvSuccessMessage(null);
                        onSendToPdvAndNavigate(id);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg shadow-2xs cursor-pointer"
                    >
                      <ArrowRightCircle className="w-3.5 h-3.5" />
                      <span>Enviar e Ir ao PDV</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Total & Partial Summary */}
              {(() => {
                const paidSoFar = getPaidAmountForSource('venda', chargingSale.id);
                const remaining = Math.max(0, Number((chargingSale.total - paidSoFar).toFixed(2))) || chargingSale.total;
                const amountToPay =
                  salePayMode === 'partial'
                    ? Math.max(0.01, Math.min(remaining, Number(salePartialAmount) || remaining * 0.5))
                    : remaining;
                const splitSum = Number(chargingSplits.reduce((a, b) => a + Number(b.amount || 0), 0).toFixed(2));
                const splitDiff = Number((amountToPay - splitSum).toFixed(2));

                return (
                  <div className="space-y-3">
                    <div className="p-4 bg-[#f6eff1] border border-[#53383e]/30 rounded-xl flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="text-xs text-[#707174]">
                          {paidSoFar > 0
                            ? `Saldo Restante (Já pago: ${formatBRL(paidSoFar)} / ${formatBRL(chargingSale.total)})`
                            : 'Total a Receber'}
                        </span>
                        <div className="text-lg font-black font-mono text-[#53383e]">{formatBRL(amountToPay)}</div>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded ${
                          chargingSale.paymentStatus === 'pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {chargingSale.paymentStatus === 'pago' ? 'Liquidado no Caixa' : 'Pronto para Recebimento'}
                      </span>
                    </div>

                    {chargingSale.paymentStatus !== 'pago' && (
                      <>
                        <div className="p-3 bg-[#f4f5f6] border border-[#d8d8d8] rounded-xl space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSalePayMode('full');
                                setSalePartialAmount(remaining);
                                if (chargingSplits.length === 1) {
                                  setChargingSplits([enrichSplit({ ...chargingSplits[0], amount: remaining })]);
                                }
                              }}
                              className={`px-3 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                                salePayMode === 'full'
                                  ? 'bg-emerald-600 text-white border-emerald-700'
                                  : 'bg-white text-[#363739] border-[#d8d8d8]'
                              }`}
                            >
                              Quitação Total ({formatBRL(remaining)})
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSalePayMode('partial');
                                const half = Number((remaining * 0.5).toFixed(2));
                                setSalePartialAmount(half);
                                if (chargingSplits.length === 1) {
                                  setChargingSplits([enrichSplit({ ...chargingSplits[0], amount: half })]);
                                }
                              }}
                              className={`px-3 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                                salePayMode === 'partial'
                                  ? 'bg-amber-600 text-white border-amber-700'
                                  : 'bg-white text-[#363739] border-[#d8d8d8]'
                              }`}
                            >
                              Entrada / Parcial
                            </button>
                          </div>

                          {salePayMode === 'partial' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                              <div>
                                <label className="block text-[10px] font-bold text-[#363739] mb-1">Valor Pago Agora (R$)</label>
                                <input
                                  type="number"
                                  min="0.01"
                                  max={remaining}
                                  step="0.01"
                                  value={salePartialAmount}
                                  onChange={(e) => {
                                    const num = Math.max(0, Math.min(remaining, Number(e.target.value) || 0));
                                    setSalePartialAmount(num);
                                    if (chargingSplits.length === 1) {
                                      setChargingSplits([enrichSplit({ ...chargingSplits[0], amount: num })]);
                                    }
                                  }}
                                  className="w-full p-2 bg-white border border-amber-400 rounded-lg font-mono font-bold text-xs"
                                />
                              </div>
                              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="text-[10px] text-amber-800 font-bold uppercase">Falta Restante</div>
                                <div className="text-sm font-black font-mono text-amber-900">
                                  {formatBRL(Math.max(0, remaining - amountToPay))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Formas de Pagamento com Bandeiras Diferentes na Liquidação */}
                        <div className="p-3.5 bg-white rounded-xl border border-[#d8d8d8] space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-[#363739]">
                              Formas de Pagamento & Bandeiras de Cartão:
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const rem = Math.max(0, Number((amountToPay - splitSum).toFixed(2)));
                                setChargingSplits(prev => [
                                  ...prev,
                                  enrichSplit({
                                    id: `cs-${Date.now()}-${prev.length}`,
                                    method: 'cartao_credito',
                                    cardBrand: prev.some(x => x.cardBrand === 'visa') ? 'mastercard' : 'visa',
                                    installments: 1,
                                    amount: rem,
                                    netAmount: rem
                                  })
                                ]);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#53383e] hover:bg-[#432c32] text-white rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Forma / Cartão</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {chargingSplits.map((sp, idx) => {
                              const isCard = sp.method === 'cartao_credito' || sp.method === 'cartao_debito';
                              const isCredit = sp.method === 'cartao_credito';
                              return (
                                <div key={sp.id || idx} className="p-2 bg-[#f4f5f6] rounded-lg border border-[#d8d8d8] space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <select
                                      value={sp.method}
                                      onChange={(e) => {
                                        const nextMethod = e.target.value as PaymentMethod;
                                        setChargingSplits(prev =>
                                          prev.map((row, i) =>
                                            i === idx
                                              ? enrichSplit({
                                                  ...row,
                                                  method: nextMethod,
                                                  cardBrand:
                                                    nextMethod === 'cartao_credito' || nextMethod === 'cartao_debito'
                                                      ? row.cardBrand || 'visa'
                                                      : undefined,
                                                  installments: nextMethod === 'cartao_credito' ? row.installments || 1 : undefined
                                                })
                                              : row
                                          )
                                        );
                                      }}
                                      className="flex-1 min-w-[130px] p-1.5 bg-white border border-[#d8d8d8] rounded text-xs font-semibold"
                                    >
                                      {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map(m => (
                                        <option key={m} value={m}>
                                          {METHOD_LABELS[m]}
                                        </option>
                                      ))}
                                    </select>

                                    {isCard && (
                                      <select
                                        value={sp.cardBrand || 'visa'}
                                        onChange={(e) => {
                                          const brand = e.target.value as CardBrand;
                                          setChargingSplits(prev =>
                                            prev.map((row, i) => (i === idx ? enrichSplit({ ...row, cardBrand: brand }) : row))
                                          );
                                        }}
                                        className="p-1.5 bg-white border border-[#d8d8d8] rounded text-xs font-semibold text-[#53383e]"
                                      >
                                        {BRANDS.map(b => (
                                          <option key={b.id} value={b.id}>
                                            {b.label}
                                          </option>
                                        ))}
                                      </select>
                                    )}

                                    {isCredit && (
                                      <select
                                        value={sp.installments || 1}
                                        onChange={(e) => {
                                          const inst = Number(e.target.value);
                                          setChargingSplits(prev =>
                                            prev.map((row, i) => (i === idx ? enrichSplit({ ...row, installments: inst }) : row))
                                          );
                                        }}
                                        className="p-1.5 bg-white border border-[#d8d8d8] rounded text-xs font-semibold"
                                      >
                                        {Array.from({ length: 12 }, (_, n) => n + 1).map(n => (
                                          <option key={n} value={n}>
                                            {n}x
                                          </option>
                                        ))}
                                      </select>
                                    )}

                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={sp.amount}
                                      onChange={(e) => {
                                        const val = Math.max(0, Number(e.target.value) || 0);
                                        setChargingSplits(prev =>
                                          prev.map((row, i) => (i === idx ? enrichSplit({ ...row, amount: val }) : row))
                                        );
                                      }}
                                      className="w-24 p-1.5 bg-white border border-[#d8d8d8] rounded font-mono font-bold text-right"
                                    />

                                    {Math.abs(splitDiff) > 0.01 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setChargingSplits(prev =>
                                            prev.map((row, i) =>
                                              i === idx
                                                ? enrichSplit({
                                                    ...row,
                                                    amount: Number(Math.max(0, Number(row.amount || 0) + splitDiff).toFixed(2))
                                                  })
                                                : row
                                            )
                                          )
                                        }
                                        className="px-2 py-1 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded cursor-pointer"
                                      >
                                        Restante
                                      </button>
                                    )}

                                    {chargingSplits.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => setChargingSplits(prev => prev.filter((_, i) => i !== idx))}
                                        className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-[#707174] flex justify-between">
                                    <span>
                                      {isCard
                                        ? `Bandeira ${(sp.cardBrand || 'visa').toUpperCase()}${isCredit ? ` · ${sp.installments || 1}x` : ''}`
                                        : METHOD_LABELS[sp.method]}
                                    </span>
                                    <span className="font-mono">
                                      Taxa {(sp.ratePercentage || 0).toFixed(2)}% · Líquido {formatBRL(sp.netAmount || sp.amount)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex justify-between text-[11px] pt-1">
                            <span>
                              Soma: <strong className="font-mono">{formatBRL(splitSum)}</strong>
                            </span>
                            <span className={Math.abs(splitDiff) <= 0.05 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                              {Math.abs(splitDiff) <= 0.05
                                ? 'Valor fechado'
                                : splitDiff > 0
                                ? `Falta alocar ${formatBRL(splitDiff)}`
                                : `Excedente ${formatBRL(Math.abs(splitDiff))}`}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="sticky bottom-0 bg-white px-5 py-3 border-t border-[#d8d8d8] flex items-center justify-between gap-2 z-10 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintSale(chargingSale)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#363739] bg-white border border-[#d8d8d8] rounded-lg hover:bg-[#d8d8d8]/30 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadSale(chargingSale)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#363739] bg-white border border-[#d8d8d8] rounded-lg hover:bg-[#d8d8d8]/30 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setChargingSale(null);
                    setPdvSuccessMessage(null);
                    setChargingError(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#5a5b5e] bg-[#f4f5f6] rounded-lg cursor-pointer"
                >
                  Fechar
                </button>
                {chargingSale.paymentStatus !== 'pago' && (
                  <button
                    type="button"
                    onClick={() => {
                      const paidSoFar = getPaidAmountForSource('venda', chargingSale.id);
                      const remaining = Math.max(0, Number((chargingSale.total - paidSoFar).toFixed(2))) || chargingSale.total;
                      const amountToPay =
                        salePayMode === 'partial'
                          ? Math.max(0.01, Math.min(remaining, Number(salePartialAmount) || remaining))
                          : remaining;
                      const validSplits = chargingSplits.map(enrichSplit).filter(s => Number(s.amount || 0) > 0);
                      const sum = validSplits.reduce((acc, s) => acc + Number(s.amount || 0), 0);
                      if (validSplits.length === 0 || Math.abs(sum - amountToPay) > 0.05) {
                        setChargingError(
                          `A soma das formas de pagamento (${formatBRL(sum)}) precisa ser igual ao valor pago (${formatBRL(amountToPay)}).`
                        );
                        return;
                      }
                      settleSaleInPdv(chargingSale.id, {
                        payments: validSplits,
                        paymentMethod: validSplits[0].method,
                        terminalName: pdvTerminal,
                        saleOverride: chargingSale,
                        paidAmount: amountToPay
                      });
                      setChargingSale(null);
                      setPdvSuccessMessage(null);
                      setChargingError(null);
                    }}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                  >
                    Confirmar & Gerar Recibo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CANCELAR VENDA (Qualquer operador com acesso a Vendas) */}
      {cancelingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#d8d8d8] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#d8d8d8]">
              <h3 className="text-base font-bold text-amber-800 flex items-center gap-2">
                <Ban className="w-5 h-5 text-amber-600" />
                <span>Cancelar Venda {cancelingSale.code}</span>
              </h3>
              <button type="button" onClick={() => setCancelingSale(null)} className="text-[#707174] hover:text-[#363739] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                <div>
                  <strong>Cliente:</strong> {cancelingSale.clientName}
                </div>
                <div>
                  <strong>Valor Total:</strong> {formatBRL(cancelingSale.total)} ({cancelingSale.items.length} item(ns))
                </div>
                <p className="text-[11px] text-amber-800 pt-1">
                  O cancelamento estorna os itens para o estoque, cancela movimentações/recibos vinculados para não somarem no caixa nem nos relatórios, e mantém o registro na auditoria.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-[#5a5b5e] mb-1">Motivo do Cancelamento (opcional)</label>
                <input
                  type="text"
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                  placeholder="Ex: Cliente desistiu da compra / Lançamento incorreto"
                  className="w-full p-2.5 bg-[#f4f5f6] border border-[#d8d8d8] rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#d8d8d8]">
              <button
                type="button"
                onClick={() => setCancelingSale(null)}
                className="px-4 py-2 text-xs font-semibold text-[#5a5b5e] bg-[#f4f5f6] rounded-lg cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  const code = cancelingSale.code;
                  cancelDirectSale(cancelingSale.id, cancelReasonInput);
                  setCancelingSale(null);
                  setCancelReasonInput('');
                  showToast(`Venda ${code} cancelada e estoque estornado com sucesso.`);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXCLUIR VENDA COM SENHA (Administrador ou Funcionário Permitido pelo Administrador) */}
      {deletingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-rose-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-rose-800 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-rose-600" />
                <span>Excluir Venda {deletingSale.code}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setDeletingSale(null);
                  setDeletePasswordInput('');
                  setDeleteAuthError(null);
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const probe = authorizePdvSaleDelete('');
              return (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Exclusão Permanente com Senha de Autorização</span>
                    </div>
                    <div>
                      <strong>Cliente:</strong> {deletingSale.clientName} · <strong>Total:</strong> {formatBRL(deletingSale.total)}
                    </div>
                    <p className="text-[11px] text-rose-800">
                      Esta ação remove definitivamente a venda, recebimentos e recibos vinculados, além de estornar o estoque (se ainda ativa). Somente a senha do Administrador ou de funcionário autorizado pelo Administrador libera a exclusão.
                    </p>
                  </div>

                  {!probe.hasAnyPasswordConfigured && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-[11px] leading-relaxed">
                      <strong>Nenhuma senha configurada ainda!</strong> Peça ao Administrador para definir a <strong>Senha Mestra de Exclusão no PDV</strong> em <em>Configurações → Empresa</em> ou habilitar um usuário com permissão e senha em <em>Configurações → Usuários</em>.
                    </div>
                  )}

                  {deleteAuthError && (
                    <div className="p-2.5 bg-rose-100 border border-rose-300 rounded-lg text-rose-900 font-semibold">
                      {deleteAuthError}
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Senha do Administrador ou Funcionário Permitido
                    </label>
                    <input
                      type="password"
                      autoFocus
                      value={deletePasswordInput}
                      onChange={(e) => {
                        setDeletePasswordInput(e.target.value);
                        setDeleteAuthError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const auth = authorizePdvSaleDelete(deletePasswordInput);
                          if (!auth.authorized) {
                            setDeleteAuthError(
                              auth.hasAnyPasswordConfigured
                                ? 'Senha incorreta ou usuário sem permissão do administrador para excluir vendas.'
                                : 'Nenhuma senha de administrador/funcionário autorizado foi configurada.'
                            );
                            return;
                          }
                          const code = deletingSale.code;
                          deleteDirectSale(deletingSale.id, auth.authorizerName);
                          setDeletingSale(null);
                          setDeletePasswordInput('');
                          setDeleteAuthError(null);
                          showToast(`Venda ${code} excluída definitivamente (Autorizado por: ${auth.authorizerName}).`);
                        }
                      }}
                      placeholder="Digite a senha de autorização..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setDeletingSale(null);
                  setDeletePasswordInput('');
                  setDeleteAuthError(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  const auth = authorizePdvSaleDelete(deletePasswordInput);
                  if (!auth.authorized) {
                    setDeleteAuthError(
                      auth.hasAnyPasswordConfigured
                        ? 'Senha incorreta ou usuário sem permissão do administrador para excluir vendas.'
                        : 'Nenhuma senha de administrador/funcionário autorizado foi configurada.'
                    );
                    return;
                  }
                  const code = deletingSale.code;
                  deleteDirectSale(deletingSale.id, auth.authorizerName);
                  setDeletingSale(null);
                  setDeletePasswordInput('');
                  setDeleteAuthError(null);
                  showToast(`Venda ${code} excluída definitivamente (Autorizado por: ${auth.authorizerName}).`);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Autorizar & Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Envio via WhatsApp */}
      {whatsAppSale && (
        <WhatsAppModal
          isOpen={!!whatsAppSale}
          onClose={() => setWhatsAppSale(null)}
          defaultTemplateId="comprovante_venda"
          recipientPhone={clients.find(c => c.id === whatsAppSale.clientId)?.phone || ''}
          recipientName={clients.find(c => c.id === whatsAppSale.clientId)?.name || 'Cliente'}
          contextVariables={{
            cliente_nome: clients.find(c => c.id === whatsAppSale.clientId)?.name || 'Cliente',
            codigo_venda: whatsAppSale.code,
            valor_total: formatBRL(whatsAppSale.total),
            itens_resumo: (whatsAppSale.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')
          }}
        />
      )}
    </div>
  );
};
