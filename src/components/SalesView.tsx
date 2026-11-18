import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  User, 
  Calendar, 
  Trash2, 
  DollarSign,
  Tag,
  CreditCard,
  Percent,
  CheckCircle2,
  FileText,
  Printer,
  Download,
  Edit3,
  Store,
  Send,
  X,
  Copy,
  Check,
  MessageSquare,
  Lock,
  Unlock
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../context/AppContext';
import { SaleItem, PaymentMethod, PaymentSplit, CardBrand, DirectSale } from '../types';
import { WhatsAppModal } from './WhatsAppModal';
import { LiveSearchInput } from './LiveSearchInput';
import { RecordDetailModal } from './RecordDetailModal';
import { ViewModeToggle, ViewMode } from './ViewModeToggle';
import { useRowHoverTooltip } from './RowHoverTooltip';

export const SalesView: React.FC = () => {
  const { 
    directSales, 
    employees, 
    clients, 
    products, 
    addDirectSale, 
    deleteDirectSale,
    sendSaleToPdv,
    settleSaleInPdv,
    getReceiptsForSource,
    getPaidAmountForSource,
    openReceiptModal,
    cardRates,
    currentRole,
    companySettings 
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<DirectSale | null>(null);
  const [chargingSale, setChargingSale] = useState<DirectSale | null>(null);
  const [salePayMode, setSalePayMode] = useState<'full' | 'partial'>('full');
  const [salePartialAmount, setSalePartialAmount] = useState<number>(0);
  const [pdvSuccessMessage, setPdvSuccessMessage] = useState<string | null>(null);
  const [pdvTerminal, setPdvTerminal] = useState('caixa_01');
  const [pdvMethod, setPdvMethod] = useState<PaymentMethod>('pix');
  const [copiedPix, setCopiedPix] = useState(false);
  const [whatsAppSale, setWhatsAppSale] = useState<DirectSale | null>(null);

  const [clientId, setClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [employeeId, setEmployeeId] = useState(employees[3]?.id || employees[0]?.id || '');
  const [priceType, setPriceType] = useState<'varejo' | 'atacado'>('varejo');
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [salesSearch, setSalesSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [detailSale, setDetailSale] = useState<DirectSale | null>(null);
  const { showTooltip, hideTooltip, tooltipElement } = useRowHoverTooltip();

  const selectedClient = clients.find(c => c.id === clientId) || null;
  const isWholesaleUnlocked = selectedClient?.customerType === 'atacado';
  const effectivePriceType: 'varejo' | 'atacado' = isWholesaleUnlocked ? priceType : 'varejo';

  const filteredClients = React.useMemo(() => {
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
    { id: 'p1', method: 'pix', amount: 320, netAmount: 320 }
  ]);

  const handlePrintSale = (sale: DirectSale) => {
    window.print();
  };

  const handleDownloadSale = (sale: DirectSale) => {
    const companyLogoHtml = companySettings.logoUrl 
      ? `<img src="${companySettings.logoUrl}" style="max-height: 55px; max-width: 160px; object-fit: contain; margin-bottom: 8px; display: block;" alt="Logo" />`
      : '';

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

  const handleOpenNewSaleModal = () => {
    setEditingSale(null);
    setClientId('');
    setClientSearch('');
    setPriceType('varejo');
    setDiscountType('fixed');
    setDiscountValue(0);
    setSaleError(null);
    const firstProd = products[0];
    setItems(
      firstProd
        ? [
            {
              id: String(Date.now()),
              productId: firstProd.id,
              name: firstProd.name,
              quantity: 1,
              cost: firstProd.costPrice,
              price: firstProd.retailPrice,
              unit: firstProd.unit
            }
          ]
        : []
    );
    setPayments([{ id: 'p1', method: 'pix', amount: firstProd?.retailPrice || 0, netAmount: firstProd?.retailPrice || 0 }]);
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    const defaultProd = products[0];
    const initialPrice =
      effectivePriceType === 'atacado'
        ? (defaultProd?.wholesalePrice || 120)
        : (defaultProd?.retailPrice || 160);
    setItems(prev => [
      ...prev,
      {
        id: String(Date.now()),
        productId: defaultProd?.id,
        name: defaultProd?.name || 'Novo Produto',
        quantity: 1,
        cost: defaultProd?.costPrice || 60,
        price: initialPrice,
        unit: defaultProd?.unit || 'UN'
      }
    ]);
  };

  const handleProductSelect = (idx: number, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    const price = effectivePriceType === 'atacado' ? prod.wholesalePrice : prod.retailPrice;
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      productId: prod.id,
      name: prod.name,
      cost: prod.costPrice,
      price: price,
      unit: prod.unit
    };
    setItems(updated);
  };

  const handleAddSplitPayment = () => {
    setPayments(prev => [
      ...prev,
      { id: String(Date.now()), method: 'cartao_credito', cardBrand: 'visa', installments: 3, ratePercentage: 4.5, rateAmount: 45, amount: 500, netAmount: 477.5 }
    ]);
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  };

  const calculateDiscountAmount = (sub: number) => {
    if (discountType === 'percent') {
      return (sub * (Number(discountValue) || 0)) / 100;
    }
    return Number(discountValue) || 0;
  };

  const handleCreateSale = (e: React.FormEvent, settleImmediately = false) => {
    e.preventDefault();
    const client = clientId ? clients.find(c => c.id === clientId) : undefined;
    if (items.length === 0) {
      setSaleError('Adicione ao menos um item à venda.');
      return;
    }
    setSaleError(null);

    const finalPriceType: 'varejo' | 'atacado' =
      client?.customerType === 'atacado' && priceType === 'atacado' ? 'atacado' : 'varejo';

    const sub = calculateSubtotal();
    const discount = calculateDiscountAmount(sub);
    const total = Math.max(0, sub - discount);
    const nowIso = new Date().toISOString();

    const createdSale = addDirectSale({
      clientId: client?.id,
      clientName: client?.name || 'Venda Balcão Avulsa',
      employeeId,
      date: nowIso.split('T')[0],
      priceType: finalPriceType,
      items: items.filter(it => it.name.trim() !== ''),
      discountType,
      discountValue: Number(discountValue),
      calculatedDiscount: discount,
      total,
      paymentMethod: payments[0]?.method || 'pix',
      payments,
      paymentStatus: 'pendente',
      pdvTerminal: 'Caixa 01 - Balcão Principal',
      sentToPdvAt: nowIso
    });

    if (settleImmediately) {
      settleSaleInPdv(createdSale.id, {
        payments: payments.length > 0 ? payments : [{ id: `p-${Date.now()}`, method: 'pix', amount: total, netAmount: total }],
        paymentMethod: payments[0]?.method || 'pix',
        terminalName: 'Caixa 01 - Balcão Principal',
        saleOverride: createdSale
      });
    }

    setIsModalOpen(false);
    setDiscountValue(0);
  };

  const activeSales = directSales.filter(s => s.status !== 'cancelada');
  const totalSalesVolume = activeSales.reduce((acc, s) => acc + s.total, 0);
  const filteredSales = directSales.filter(sale => {
    const q = salesSearch.trim().toLowerCase();
    if (!q) return true;
    const seller = employees.find(e => e.id === sale.employeeId);
    return (
      sale.code.toLowerCase().includes(q) ||
      sale.clientName.toLowerCase().includes(q) ||
      (seller?.name || '').toLowerCase().includes(q) ||
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
              Varejo & Atacado · Múltiplas Formas
            </span>
          </div>
          <p className="hidden md:block text-xs text-slate-500 mt-1">
            Faturamento de reservatórios térmicos, bombas e peças avulsas com desconto flexível e divisão de pagamentos em cartão, Pix e boleto.
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

      {/* Sales Table: Busca Dinâmica + Compacta com Hover Details + Cards Mobile */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900">
            Histórico de Vendas Faturadas ({filteredSales.length})
          </h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:w-72">
              <LiveSearchInput
                value={salesSearch}
                onChange={setSalesSearch}
                placeholder="Buscar venda por código, cliente ou item..."
                emptyLabel="Nenhuma venda"
                inputClassName="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                getOptions={(query) => {
                  const q = query.toLowerCase();
                  return directSales
                    .filter(
                      s =>
                        s.code.toLowerCase().includes(q) ||
                        s.clientName.toLowerCase().includes(q) ||
                        s.items.some(it => it.name.toLowerCase().includes(q))
                    )
                    .map(s => ({
                      id: s.id,
                      title: `${s.code} · ${s.clientName}`,
                      subtitle: `${formatDateBR(s.date)} · ${s.items.length} item(ns)`,
                      priceText: formatBRL(s.total),
                      badgeText: s.paymentStatus === 'pago' ? 'Pago' : 'Pendente',
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
                  <th className="hidden md:table-cell">Tabela</th>
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
                  return (
                    <tr
                      key={sale.id}
                      className="dense-row"
                      onMouseEnter={(e) =>
                        showTooltip(e, {
                          title: `Venda ${sale.code} · ${sale.clientName}`,
                          subtitle: `${formatDateBR(sale.date)} · Tabela ${sale.priceType === 'atacado' ? 'Atacado' : 'Varejo'} · ${sale.paymentStatus === 'pago' ? 'Liquidado' : 'Pendente no PDV'}`,
                          description: itemsSummary || undefined,
                          fields: [
                            { label: 'Vendedor', value: seller?.name || 'Balcão' },
                            { label: 'Terminal PDV', value: sale.pdvTerminal || 'Caixa 01' },
                            { label: 'Forma Pagamento', value: sale.paymentMethod.replace('_', ' ').toUpperCase() },
                            { label: 'Itens', value: `${sale.items.length} item(ns)` },
                            { label: 'Subtotal / Desconto', value: `${formatBRL(subtotal)} · -${formatBRL(sale.calculatedDiscount || 0)}` },
                            { label: 'Total Líquido', value: formatBRL(sale.total) }
                          ]
                        })
                      }
                      onMouseLeave={hideTooltip}
                    >
                      <td className="font-mono font-bold text-blue-600">{sale.code}</td>
                      <td className="font-bold text-slate-900">{sale.clientName}</td>
                      <td className="hidden md:table-cell font-mono text-slate-600 tabular-nums">{formatDateBR(sale.date)}</td>
                      <td className={`hidden md:table-cell ${sale.priceType === 'atacado' ? 'font-semibold text-purple-700' : 'text-slate-600'}`}>
                        {sale.priceType === 'atacado' ? 'Atacado' : 'Varejo'}
                      </td>
                      <td className={`font-semibold ${
                        sale.status === 'cancelada'
                          ? 'text-rose-700'
                          : sale.paymentStatus === 'pago'
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}>
                        {sale.status === 'cancelada' ? 'Cancelada' : sale.paymentStatus === 'pago' ? 'Liquidado' : 'Pendente'}
                      </td>
                      <td className={`text-right font-mono font-bold tabular-nums ${sale.status === 'cancelada' ? 'text-slate-400 line-through' : 'text-emerald-700'}`}>
                        {formatBRL(sale.total)}
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {sale.status !== 'cancelada' && (
                            <button
                              type="button"
                              onClick={() => {
                                setChargingSale(sale);
                                setPdvSuccessMessage(null);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-md text-white bg-[#53383e] hover:bg-[#432c32] cursor-pointer"
                              title="Cobrar no PDV"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>PDV</span>
                            </button>
                          )}
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
              return (
                <div
                  key={sale.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between gap-3 hover:border-slate-300 transition-colors"
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
                      <span className={`font-semibold ${sale.paymentStatus === 'pago' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {sale.paymentStatus === 'pago' ? 'Liquidado' : 'Pendente'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{sale.items.length} item(ns)</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                      <div className="text-[11px] text-slate-500">
                        Vendedor: <span className="font-medium text-slate-800">{seller?.name || 'Balcão'}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {sale.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Líquido</span>
                      <span className="font-mono font-bold text-sm text-emerald-700 tabular-nums">
                        {formatBRL(sale.total)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setChargingSale(sale);
                        setPdvSuccessMessage(null);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg text-white bg-[#53383e] hover:bg-[#432c32] cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>PDV</span>
                    </button>
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
        return (
          <RecordDetailModal
            isOpen={true}
            onClose={() => setDetailSale(null)}
            title={`Venda Direta ${sale.code}`}
            subtitle={`Data: ${formatDateBR(sale.date)} · Tabela: ${sale.priceType === 'atacado' ? 'Atacado' : 'Varejo'}`}
            statusText={sale.paymentStatus === 'pago' ? 'Liquidado' : 'Pendente no PDV'}
            statusClassName={sale.paymentStatus === 'pago' ? 'text-emerald-700' : 'text-amber-700'}
            sections={[
              {
                heading: 'Cliente, Vendedor & Terminal',
                fields: [
                  { label: 'Cliente', value: sale.clientName },
                  { label: 'Vendedor / Consultor', value: seller?.name || 'Balcão' },
                  { label: 'Terminal PDV', value: sale.pdvTerminal || 'Não enviado' },
                  { label: 'Forma Principal', value: sale.paymentMethod.replace('_', ' ').toUpperCase() }
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
                      Composição de Pagamentos
                    </h4>
                    <ul className="space-y-1 text-xs font-mono text-slate-700 border border-slate-200 rounded-lg p-3 bg-slate-50 tabular-nums">
                      {sale.payments.map((p, idx) => (
                        <li key={p.id || idx} className="flex justify-between gap-2">
                          <span>{p.method.replace('_', ' ').toUpperCase()}</span>
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
                <button
                  type="button"
                  onClick={() => {
                    setDetailSale(null);
                    setChargingSale(sale);
                    setPdvSuccessMessage(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Cobrar PDV</span>
                </button>
                {currentRole !== 'tecnico' && (
                  <button
                    type="button"
                    onClick={() => {
                      const saleClient = sale.clientId ? clients.find(c => c.id === sale.clientId) : undefined;
                      setDetailSale(null);
                      setClientId(sale.clientId || '');
                      setClientSearch('');
                      setEmployeeId(sale.employeeId);
                      setPriceType(saleClient?.customerType === 'atacado' ? sale.priceType : 'varejo');
                      setDiscountType(sale.discountType || 'fixed');
                      setDiscountValue(sale.discountValue || 0);
                      setItems(sale.items);
                      setPayments(sale.payments || []);
                      setSaleError(null);
                      setIsModalOpen(true);
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
                {currentRole === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Excluir a venda ${sale.code}?`)) {
                        deleteDirectSale(sale.id);
                        setDetailSale(null);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                )}
              </>
            }
          />
        );
      })()}

      {/* Modal Nova Venda */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Nova Venda Direta / Balcão de Peças</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateSale} className="space-y-4 text-xs mt-4">
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
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isWholesaleUnlocked
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
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
                      className={`flex-1 py-1.5 font-bold rounded-md cursor-pointer ${effectivePriceType === 'varejo' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
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

              {/* Itens */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800">Itens / Equipamentos Vendidos</span>
                  <button type="button" onClick={handleAddItem} className="text-blue-600 font-bold">+ Adicionar Item</button>
                </div>
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={it.id || idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <select
                        value={it.productId || ''}
                        onChange={(e) => handleProductSelect(idx, e.target.value)}
                        className="flex-1 p-1.5 bg-white border border-slate-200 rounded text-xs"
                      >
                        <option value="">Selecione do Estoque...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.code} - {p.name} (Estoque: {p.currentStock})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        placeholder="Qtd"
                        value={it.quantity}
                        onChange={(e) => {
                          const up = [...items];
                          up[idx].quantity = Number(e.target.value);
                          setItems(up);
                        }}
                        className="w-16 p-1.5 bg-white border border-slate-200 rounded font-mono text-center"
                      />

                      <input
                        type="number"
                        placeholder="Preço R$"
                        value={it.price}
                        onChange={(e) => {
                          const up = [...items];
                          up[idx].price = Number(e.target.value);
                          setItems(up);
                        }}
                        className="w-24 p-1.5 bg-white border border-slate-200 rounded font-mono font-bold text-slate-900"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Desconto */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700">Desconto na Venda</span>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => setDiscountType('fixed')}
                      className={`px-3 py-1 font-bold ${discountType === 'fixed' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                    >
                      R$
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('percent')}
                      className={`px-3 py-1 font-bold ${discountType === 'percent' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                    >
                      %
                    </button>
                  </div>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-24 p-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              {/* Múltiplas Formas de Pagamento */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Múltiplas Formas de Pagamento</span>
                  <button type="button" onClick={handleAddSplitPayment} className="text-blue-600 font-bold">+ Dividir Pagamento</button>
                </div>
                {payments.map((p, idx) => (
                  <div key={p.id || idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <select
                      value={p.method}
                      onChange={(e) => {
                        const up = [...payments];
                        up[idx].method = e.target.value as PaymentMethod;
                        setPayments(up);
                      }}
                      className="p-1 bg-white border border-slate-200 rounded text-xs"
                    >
                      <option value="pix">Pix</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="boleto">Boleto Bancário</option>
                    </select>

                    <input
                      type="number"
                      placeholder="Valor"
                      value={p.amount}
                      onChange={(e) => {
                        const up = [...payments];
                        up[idx].amount = Number(e.target.value);
                        setPayments(up);
                      }}
                      className="w-28 p-1 bg-white border border-slate-200 rounded font-mono font-bold text-emerald-700"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#53383e] rounded-lg hover:bg-[#432c32] shadow-xs cursor-pointer"
                >
                  Enviar para Caixa (PDV)
                </button>
                <button
                  type="button"
                  onClick={(e) => handleCreateSale(e as any, true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  Receber e Dar Baixa no Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cobrança / Envio de Fatura de Venda ao PDV */}
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
                      Cobrança & Envio ao PDV (Venda Balcão)
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
                }}
                className="text-slate-400 hover:text-slate-700 p-1"
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

              {/* Terminal dispatch */}
              <div className="p-4 bg-[#f4f5f6] rounded-xl border border-[#d8d8d8] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#363739]">
                  <Store className="w-4 h-4 text-[#53383e]" />
                  <span>Mandar Fatura da Venda ao Terminal PDV:</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={pdvTerminal}
                    onChange={(e) => setPdvTerminal(e.target.value)}
                    className="flex-1 p-2 bg-white border border-[#d8d8d8] rounded-lg font-medium text-xs text-[#363739]"
                  >
                    <option value="caixa_01">Caixa 01 - Balcão Principal (Loja)</option>
                    <option value="caixa_02">Caixa 02 - Vendas Rápidas / Atacado</option>
                    <option value="pdv_movel">PDV Móvel - Maquininha Campo</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const terminalName =
                        pdvTerminal === 'caixa_01'
                          ? 'Caixa 01 - Balcão Principal'
                          : pdvTerminal === 'caixa_02'
                          ? 'Caixa 02 - Vendas Rápidas / Atacado'
                          : 'PDV Móvel - Maquininha Campo';
                      sendSaleToPdv(chargingSale.id, terminalName);
                      setPdvSuccessMessage(`Fatura ${chargingSale.code} (${formatBRL(chargingSale.total)}) enviada para a fila do ${terminalName}!`);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#363739] hover:bg-[#252627] rounded-lg shadow-2xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Mandar Fatura ao PDV</span>
                  </button>
                </div>
              </div>

              {/* Payment Method Quick Settlement */}
              <div className="p-4 bg-white rounded-xl border border-[#d8d8d8] space-y-2">
                <span className="font-bold text-xs text-[#363739]">Forma de Pagamento para Liquidação Direta:</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'pix', label: 'PIX' },
                    { id: 'dinheiro', label: 'Dinheiro' },
                    { id: 'cartao_credito', label: 'Crédito' },
                    { id: 'cartao_debito', label: 'Débito' },
                    { id: 'boleto', label: 'Boleto' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPdvMethod(m.id as PaymentMethod)}
                      className={`py-2 px-2 rounded-lg border text-xs font-bold cursor-pointer ${
                        pdvMethod === m.id
                          ? 'bg-[#53383e] text-white border-[#53383e]'
                          : 'bg-[#f4f5f6] text-[#363739] border-[#d8d8d8]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
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

                return (
                  <div className="space-y-3">
                    <div className="p-4 bg-[#f6eff1] border border-[#53383e]/30 rounded-xl flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="text-xs text-[#707174]">
                          {paidSoFar > 0 ? `Saldo Restante (Já pago: ${formatBRL(paidSoFar)} / ${formatBRL(chargingSale.total)})` : 'Total dos Produtos'}
                        </span>
                        <div className="text-lg font-black font-mono text-[#53383e]">{formatBRL(amountToPay)}</div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded ${
                        chargingSale.paymentStatus === 'pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {chargingSale.paymentStatus === 'pago' ? 'Liquidado no Caixa' : 'Pronto para Recebimento'}
                      </span>
                    </div>

                    {chargingSale.paymentStatus !== 'pago' && (
                      <div className="p-3 bg-[#f4f5f6] border border-[#d8d8d8] rounded-xl space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSalePayMode('full');
                              setSalePartialAmount(remaining);
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
                              setSalePartialAmount(Number((remaining * 0.5).toFixed(2)));
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
                                onChange={(e) => setSalePartialAmount(Math.max(0, Math.min(remaining, Number(e.target.value) || 0)))}
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
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="sticky bottom-0 bg-white px-5 py-3 border-t border-[#d8d8d8] flex items-center justify-between gap-2 z-10">
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
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#5a5b5e] bg-[#f4f5f6] rounded-lg cursor-pointer"
                >
                  Fechar
                </button>
                {chargingSale.paymentStatus !== 'pago' && (
                  <button
                    type="button"
                    onClick={() => {
                      const terminalName =
                        pdvTerminal === 'caixa_01'
                          ? 'Caixa 01 - Balcão Principal'
                          : pdvTerminal === 'caixa_02'
                          ? 'Caixa 02 - Vendas Rápidas / Atacado'
                          : 'PDV Móvel - Maquininha Campo';
                      const paidSoFar = getPaidAmountForSource('venda', chargingSale.id);
                      const remaining = Math.max(0, Number((chargingSale.total - paidSoFar).toFixed(2))) || chargingSale.total;
                      const amountToPay =
                        salePayMode === 'partial'
                          ? Math.max(0.01, Math.min(remaining, Number(salePartialAmount) || remaining))
                          : remaining;
                      settleSaleInPdv(chargingSale.id, {
                        payments: [{ id: `pay-${Date.now()}`, method: pdvMethod, amount: amountToPay, netAmount: amountToPay }],
                        paymentMethod: pdvMethod,
                        terminalName,
                        saleOverride: chargingSale,
                        paidAmount: amountToPay
                      });
                      setChargingSale(null);
                      setPdvSuccessMessage(null);
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
