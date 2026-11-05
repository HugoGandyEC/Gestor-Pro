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
  Check,
  Copy
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../context/AppContext';
import { SaleItem, PaymentMethod, PaymentSplit, CardBrand, DirectSale } from '../types';

export const SalesView: React.FC = () => {
  const { 
    directSales, 
    employees, 
    clients, 
    products, 
    addDirectSale, 
    deleteDirectSale,
    cardRates,
    currentRole,
    companySettings 
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<DirectSale | null>(null);
  const [chargingSale, setChargingSale] = useState<DirectSale | null>(null);
  const [pdvSuccessMessage, setPdvSuccessMessage] = useState<string | null>(null);
  const [pdvTerminal, setPdvTerminal] = useState('caixa_01');
  const [pdvMethod, setPdvMethod] = useState<PaymentMethod>('pix');
  const [copiedPix, setCopiedPix] = useState(false);

  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [employeeId, setEmployeeId] = useState(employees[3]?.id || employees[0]?.id || '');
  const [priceType, setPriceType] = useState<'varejo' | 'atacado'>('varejo');
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);

  const [items, setItems] = useState<SaleItem[]>([
    { id: '1', productId: 'prod-4', name: 'Válvula de Segurança e Alívio de Pressão 3/4" 3 Bar', quantity: 2, cost: 65, price: 160, unit: 'PC' }
  ]);

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

  const handleAddItem = () => {
    const defaultProd = products[0];
    const initialPrice = priceType === 'atacado' ? (defaultProd?.wholesalePrice || 120) : (defaultProd?.retailPrice || 160);
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
    const price = priceType === 'atacado' ? prod.wholesalePrice : prod.retailPrice;
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

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === clientId) || clients[0];
    if (items.length === 0) {
      alert('Adicione ao menos um item à venda.');
      return;
    }

    const sub = calculateSubtotal();
    const discount = calculateDiscountAmount(sub);
    const total = sub - discount;

    addDirectSale({
      clientId: client?.id,
      clientName: client?.name || 'Venda Balcão Avulsa',
      employeeId,
      date: new Date().toISOString().split('T')[0],
      priceType,
      items: items.filter(it => it.name.trim() !== ''),
      discountType,
      discountValue: Number(discountValue),
      calculatedDiscount: discount,
      total,
      paymentMethod: payments[0]?.method || 'pix',
      payments,
      paymentStatus: 'pago'
    });

    setIsModalOpen(false);
    setDiscountValue(0);
  };

  const totalSalesVolume = directSales.reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Vendas Diretas, Orçamentos & Balcão de Peças
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Varejo & Atacado · Múltiplas Formas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Faturamento de reservatórios térmicos, bombas e peças avulsas com desconto flexível e divisão de pagamentos em cartão, Pix e boleto.
          </p>
        </div>

        {currentRole !== 'tecnico' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs shrink-0"
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
          <div className="text-xs text-slate-500 mt-1">
            {directSales.length} pedidos faturados com baixa de estoque
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Ticket Médio por Venda</span>
          <div className="text-2xl font-bold font-mono text-blue-600 mt-1">
            {formatBRL(directSales.length > 0 ? totalSalesVolume / directSales.length : 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Preços tabelados no varejo e atacado
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Comissões sobre Vendas</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {formatBRL(totalSalesVolume * 0.04)}
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">
            Média de 4% comissionada aos consultores
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">
            Histórico de Vendas Faturadas
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Código / Tipo</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-3">Vendedor / Consultor</th>
                <th className="py-3 px-3">Data</th>
                <th className="py-3 px-4">Itens / Equipamentos</th>
                <th className="py-3 px-3">Split de Pagamento</th>
                <th className="py-3 px-4 text-right">Total Faturado</th>
                <th className="py-3 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {directSales.map(sale => {
                const seller = employees.find(e => e.id === sale.employeeId);
                return (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-blue-600">{sale.code}</div>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                        sale.priceType === 'atacado' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {sale.priceType}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {sale.clientName}
                    </td>

                    <td className="py-3 px-3 text-slate-700">
                      {seller?.name || '-'}
                    </td>

                    <td className="py-3 px-3 text-slate-500 font-mono">
                      {formatDateBR(sale.date)}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {sale.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {sale.payments && sale.payments.length > 0 ? (
                        <div className="space-y-0.5 font-mono text-[11px]">
                          {sale.payments.map((p, i) => (
                            <div key={i} className="text-slate-700">
                              · <span className="uppercase font-semibold">{p.method.replace('_', ' ')}</span>: {formatBRL(p.amount)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="uppercase">{sale.paymentMethod}</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatBRL(sale.total)}
                      {sale.calculatedDiscount > 0 && (
                        <div className="text-[10px] text-rose-600 font-normal">
                          Desc: -{formatBRL(sale.calculatedDiscount)}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        {/* 1. Cobrar (PDV) */}
                        <button
                          onClick={() => {
                            setChargingSale(sale);
                            setPdvSuccessMessage(null);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md shadow-2xs text-white bg-[#53383e] hover:bg-[#432c32] cursor-pointer"
                          title="Cobrar e mandar fatura ao PDV"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Cobrar (PDV)</span>
                        </button>

                        {/* 2. Editar */}
                        {currentRole !== 'tecnico' && (
                          <button
                            onClick={() => {
                              setClientId(sale.clientId || clients[0]?.id || '');
                              setEmployeeId(sale.employeeId);
                              setPriceType(sale.priceType);
                              setDiscountType(sale.discountType || 'fixed');
                              setDiscountValue(sale.discountValue || 0);
                              setItems(sale.items);
                              setPayments(sale.payments || []);
                              setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#363739] hover:text-[#53383e] hover:bg-[#d8d8d8]/50 border border-[#d8d8d8] rounded-md transition-colors cursor-pointer"
                            title="Editar Venda"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Editar</span>
                          </button>
                        )}

                        {/* 3. Imprimir */}
                        <button
                          onClick={() => handlePrintSale(sale)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#363739] hover:text-blue-700 hover:bg-blue-50 border border-[#d8d8d8] rounded-md transition-colors cursor-pointer"
                          title="Imprimir Cupom de Venda"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">Imprimir</span>
                        </button>

                        {/* 4. Baixar */}
                        <button
                          onClick={() => handleDownloadSale(sale)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#363739] hover:text-emerald-700 hover:bg-emerald-50 border border-[#d8d8d8] rounded-md transition-colors cursor-pointer"
                          title="Baixar Cupom / Fatura"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">Baixar</span>
                        </button>

                        {/* Excluir */}
                        {currentRole === 'admin' && (
                          <button
                            onClick={() => {
                              if (confirm(`Excluir a venda ${sale.code}?`)) {
                                deleteDirectSale(sale.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                            title="Excluir Venda"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Venda */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Nova Venda Direta / Balcão de Peças</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateSale} className="space-y-4 text-xs mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Cliente *</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.document})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Tabela de Preço</label>
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-100 p-0.5">
                    <button
                      type="button"
                      onClick={() => setPriceType('varejo')}
                      className={`flex-1 py-1.5 font-bold rounded-md ${priceType === 'varejo' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
                    >
                      Varejo (Padrão)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriceType('atacado')}
                      className={`flex-1 py-1.5 font-bold rounded-md ${priceType === 'atacado' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'}`}
                    >
                      Atacado (Desconto Lote)
                    </button>
                  </div>
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

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
                >
                  Concluir Venda e Baixar Estoque
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
                      setPdvSuccessMessage(`Fatura de ${formatBRL(chargingSale.total)} enviada para a fila do ${pdvTerminal.replace('_', ' ').toUpperCase()}!`);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#363739] hover:bg-[#252627] rounded-lg shadow-2xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Mandar Fatura ao PDV</span>
                  </button>
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-4 bg-[#f6eff1] border border-[#53383e]/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#707174]">Total dos Produtos</span>
                  <div className="text-lg font-black font-mono text-[#53383e]">{formatBRL(chargingSale.total)}</div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  Pronto para Recebimento
                </span>
              </div>
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
              <button
                type="button"
                onClick={() => {
                  setChargingSale(null);
                  setPdvSuccessMessage(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg cursor-pointer"
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
