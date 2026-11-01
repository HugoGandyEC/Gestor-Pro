import React, { useState, useMemo } from 'react';
import { 
  Building, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  Percent, 
  DollarSign, 
  ArrowRight, 
  Edit3, 
  Save, 
  X, 
  Layers, 
  ShieldCheck, 
  FileText, 
  CheckSquare, 
  Square, 
  RotateCcw, 
  Sparkles, 
  TrendingUp,
  UserCheck,
  Tag,
  Boxes
} from 'lucide-react';
import { useApp, formatBRL } from '../context/AppContext';
import { ParsedXmlNFe, ParsedXmlItem, ParsedXmlSupplier } from '../types';

interface NFeImportStagingModalProps {
  initialParsedNFe: ParsedXmlNFe;
  onClose: () => void;
  onSuccess: (resultMessage: string) => void;
}

export const NFeImportStagingModal: React.FC<NFeImportStagingModalProps> = ({
  initialParsedNFe,
  onClose,
  onSuccess
}) => {
  const { commitImportNFe } = useApp();

  // Working copy of parsed NFe state
  const [nfeData, setNfeData] = useState<ParsedXmlNFe>(initialParsedNFe);

  // Bulk margin controls
  const [bulkRetailMargin, setBulkRetailMargin] = useState<number>(55);
  const [bulkWholesaleMargin, setBulkWholesaleMargin] = useState<number>(35);

  // Supplier edit drawer / expanded toggle
  const [isEditingSupplier, setIsEditingSupplier] = useState(false);

  // Supplier helper updates
  const handleUpdateSupplier = (field: keyof ParsedXmlSupplier, value: any) => {
    setNfeData(prev => ({
      ...prev,
      supplier: {
        ...prev.supplier,
        [field]: value
      }
    }));
  };

  // Item field updates
  const handleUpdateItem = (index: number, updates: Partial<ParsedXmlItem>) => {
    setNfeData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], ...updates };
      return { ...prev, items: newItems };
    });
  };

  // When retail margin changes -> recalculate retail price
  const handleRetailMarginChange = (index: number, margin: number) => {
    const item = nfeData.items[index];
    const newPrice = Number((item.costPrice * (1 + margin / 100)).toFixed(2));
    handleUpdateItem(index, {
      retailMarginPercent: margin,
      retailPrice: newPrice
    });
  };

  // When retail price changes -> recalculate retail margin
  const handleRetailPriceChange = (index: number, price: number) => {
    const item = nfeData.items[index];
    if (item.costPrice <= 0) return;
    const newMargin = Number((((price / item.costPrice) - 1) * 100).toFixed(1));
    handleUpdateItem(index, {
      retailPrice: price,
      retailMarginPercent: newMargin
    });
  };

  // When wholesale margin changes -> recalculate wholesale price
  const handleWholesaleMarginChange = (index: number, margin: number) => {
    const item = nfeData.items[index];
    const newPrice = Number((item.costPrice * (1 + margin / 100)).toFixed(2));
    handleUpdateItem(index, {
      wholesaleMarginPercent: margin,
      wholesalePrice: newPrice
    });
  };

  // When wholesale price changes -> recalculate wholesale margin
  const handleWholesalePriceChange = (index: number, price: number) => {
    const item = nfeData.items[index];
    if (item.costPrice <= 0) return;
    const newMargin = Number((((price / item.costPrice) - 1) * 100).toFixed(1));
    handleUpdateItem(index, {
      wholesalePrice: price,
      wholesaleMarginPercent: newMargin
    });
  };

  // Bulk Apply Retail Margin to all items
  const handleApplyBulkRetailMargin = () => {
    setNfeData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        const newPrice = Number((item.costPrice * (1 + bulkRetailMargin / 100)).toFixed(2));
        return {
          ...item,
          retailMarginPercent: bulkRetailMargin,
          retailPrice: newPrice,
          updateRetailPrice: true
        };
      })
    }));
  };

  // Bulk Apply Wholesale Margin to all items
  const handleApplyBulkWholesaleMargin = () => {
    setNfeData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        const newPrice = Number((item.costPrice * (1 + bulkWholesaleMargin / 100)).toFixed(2));
        return {
          ...item,
          wholesaleMarginPercent: bulkWholesaleMargin,
          wholesalePrice: newPrice,
          updateWholesalePrice: true
        };
      })
    }));
  };

  // Bulk toggle checkboxes
  const handleToggleAll = (field: 'updateRetailPrice' | 'updateWholesalePrice' | 'updateStock', value: boolean) => {
    setNfeData(prev => ({
      ...prev,
      items: prev.items.map(item => ({
        ...item,
        [field]: value
      }))
    }));
  };

  // Round prices to .90
  const handleRoundPrices = () => {
    setNfeData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        const roundedRetail = Math.floor(item.retailPrice) + 0.90;
        const roundedWholesale = Math.floor(item.wholesalePrice) + 0.90;
        return {
          ...item,
          retailPrice: roundedRetail,
          retailMarginPercent: Number((((roundedRetail / item.costPrice) - 1) * 100).toFixed(1)),
          wholesalePrice: roundedWholesale,
          wholesaleMarginPercent: Number((((roundedWholesale / item.costPrice) - 1) * 100).toFixed(1))
        };
      })
    }));
  };

  // Summary calculations
  const totalCost = useMemo(() => {
    return nfeData.items.reduce((acc, it) => acc + (it.costPrice * it.quantity), 0);
  }, [nfeData.items]);

  const potentialRetailRevenue = useMemo(() => {
    return nfeData.items.reduce((acc, it) => acc + (it.retailPrice * it.quantity), 0);
  }, [nfeData.items]);

  const potentialWholesaleRevenue = useMemo(() => {
    return nfeData.items.reduce((acc, it) => acc + (it.wholesalePrice * it.quantity), 0);
  }, [nfeData.items]);

  const potentialRetailProfit = potentialRetailRevenue - totalCost;

  // Final commit
  const handleConfirmAndCommit = () => {
    const result = commitImportNFe(nfeData);
    if (result.success) {
      onSuccess(result.message);
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="bg-[#2b2c2e] text-white px-6 py-4 flex items-center justify-between border-b border-[#3d3f42] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#53383e] text-white rounded-xl border border-[#c2bfb0]/30">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Conferência & Precificação de Importação de Produtos
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#53383e] text-[#d8d8d8] border border-[#c2bfb0]/40 font-bold">
                  NF-e {nfeData.nNF}
                </span>
              </div>
              <p className="text-xs text-[#c2bfb0] mt-0.5">
                Revise os custos, aplique suas margens de lucro para Varejo e Atacado, confirme quais tabelas atualizar e homologue o fornecedor.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs bg-slate-50">
          {/* =========================================================================
              1. FORNECEDOR DA NOTA FISCAL (IDENTIFICAÇÃO & CADASTRO AUTOMÁTICO)
              ========================================================================= */}
          <div className={`p-4 rounded-xl border transition-all ${
            nfeData.supplier.isAlreadyRegistered 
              ? 'bg-emerald-50/70 border-emerald-200' 
              : 'bg-amber-50/80 border-amber-300 shadow-2xs'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  nfeData.supplier.isAlreadyRegistered 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {nfeData.supplier.name}
                    </span>
                    {nfeData.supplier.isAlreadyRegistered ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Fornecedor Já Cadastrado no Sistema
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                        <AlertTriangle className="w-3 h-3 text-amber-700" />
                        Fornecedor Novo Não Cadastrado
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 text-xs mt-1">
                    <span className="font-mono">
                      <strong className="text-slate-700">CNPJ:</strong> {nfeData.supplier.cnpj}
                    </span>
                    {nfeData.supplier.phone && (
                      <span>
                        <strong className="text-slate-700">Tel:</strong> {nfeData.supplier.phone}
                      </span>
                    )}
                    <span>
                      <strong className="text-slate-700">Localização:</strong> {nfeData.supplier.city} - {nfeData.supplier.state}
                    </span>
                    <span>
                      <strong className="text-slate-700">Valor da Nota:</strong> {formatBRL(nfeData.totalValue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão de cadastro e edição do fornecedor novo */}
              <div className="flex items-center gap-2 shrink-0">
                {!nfeData.supplier.isAlreadyRegistered && (
                  <label className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-amber-300 cursor-pointer shadow-2xs hover:bg-amber-50/50">
                    <input
                      type="checkbox"
                      checked={nfeData.supplier.registerIfNew}
                      onChange={(e) => handleUpdateSupplier('registerIfNew', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="font-bold text-amber-900 text-xs">
                      Cadastrar este fornecedor automaticamente
                    </span>
                  </label>
                )}

                <button
                  type="button"
                  onClick={() => setIsEditingSupplier(!isEditingSupplier)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  {isEditingSupplier ? 'Ocultar Dados' : 'Editar Dados Fornecedor'}
                </button>
              </div>
            </div>

            {/* Painel expansível de edição do fornecedor */}
            {isEditingSupplier && (
              <div className="mt-4 pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-xl border">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold text-[11px]">Razão Social</label>
                  <input
                    type="text"
                    value={nfeData.supplier.name}
                    onChange={(e) => handleUpdateSupplier('name', e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold text-[11px]">Nome Fantasia</label>
                  <input
                    type="text"
                    value={nfeData.supplier.tradeName || ''}
                    onChange={(e) => handleUpdateSupplier('tradeName', e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold text-[11px]">CNPJ</label>
                  <input
                    type="text"
                    value={nfeData.supplier.cnpj}
                    onChange={(e) => handleUpdateSupplier('cnpj', e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold text-[11px]">Telefone</label>
                  <input
                    type="text"
                    value={nfeData.supplier.phone || ''}
                    onChange={(e) => handleUpdateSupplier('phone', e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold text-[11px]">E-mail Comercial</label>
                  <input
                    type="email"
                    value={nfeData.supplier.email || ''}
                    onChange={(e) => handleUpdateSupplier('email', e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold text-[11px]">Endereço / Cidade - UF</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={nfeData.supplier.city || ''}
                      onChange={(e) => handleUpdateSupplier('city', e.target.value)}
                      className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="UF"
                      maxLength={2}
                      value={nfeData.supplier.state || ''}
                      onChange={(e) => handleUpdateSupplier('state', e.target.value.toUpperCase())}
                      className="w-14 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs uppercase"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              2. FERRAMENTAS DE MARGEM DE LUCRO EM MASSA (MARKUP GLOBAL)
              ========================================================================= */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Precificação Rápida & Aplicação de Margens de Lucro
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRoundPrices}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Arredonda centavos para .90"
                >
                  Arredondar p/ .90
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              {/* Margem Varejo em Massa */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2">
                <span className="font-bold text-blue-900 text-[11px] block">
                  Margem Geral Varejo (%)
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="1"
                      value={bulkRetailMargin}
                      onChange={(e) => setBulkRetailMargin(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-blue-300 rounded-lg font-bold text-blue-900 text-xs pr-6"
                    />
                    <span className="absolute right-2.5 top-2.5 font-bold text-blue-400 text-xs">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyBulkRetailMargin}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors shrink-0 shadow-2xs"
                  >
                    Aplicar a Todos
                  </button>
                </div>
              </div>

              {/* Margem Atacado em Massa */}
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 space-y-2">
                <span className="font-bold text-purple-900 text-[11px] block">
                  Margem Geral Atacado (%)
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="1"
                      value={bulkWholesaleMargin}
                      onChange={(e) => setBulkWholesaleMargin(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-purple-300 rounded-lg font-bold text-purple-900 text-xs pr-6"
                    />
                    <span className="absolute right-2.5 top-2.5 font-bold text-purple-400 text-xs">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyBulkWholesaleMargin}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-xs transition-colors shrink-0 shadow-2xs"
                  >
                    Aplicar a Todos
                  </button>
                </div>
              </div>

              {/* Ações Rápidas de Seleção */}
              <div className="lg:col-span-2 flex flex-wrap items-center gap-2 pb-1">
                <span className="text-[11px] text-slate-500 font-semibold mr-1">Tabelas Ativas:</span>
                <button
                  type="button"
                  onClick={() => handleToggleAll('updateRetailPrice', true)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                >
                  ✓ Marcar Todas Varejo
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAll('updateWholesalePrice', true)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
                >
                  ✓ Marcar Todas Atacado
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAll('updateStock', true)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
                >
                  ✓ Marcar Todas Estoque
                </button>
              </div>
            </div>
          </div>

          {/* =========================================================================
              3. TABELA DE PRODUTOS ITEM A ITEM (AJUSTE FINO DE PREÇOS E MARGENS)
              ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs">
                Itens da Nota Fiscal ({nfeData.items.length} produtos localizados)
              </span>
              <span className="text-[11px] text-slate-500">
                Você pode ajustar a margem (%) ou o valor final (R$) de cada produto individualmente
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5 w-10 text-center">Status</th>
                    <th className="px-3 py-2.5">Código / Produto / NCM</th>
                    <th className="px-3 py-2.5 text-center">Qtd / Un</th>
                    <th className="px-3 py-2.5 text-right">Custo Unit. (NF-e)</th>
                    <th className="px-3 py-2.5 min-w-[210px] bg-blue-50/50">
                      <div className="flex items-center justify-between">
                        <span>Tabela Varejo</span>
                        <span className="text-[9px] font-normal lowercase">margem % | preço R$</span>
                      </div>
                    </th>
                    <th className="px-3 py-2.5 min-w-[210px] bg-purple-50/50">
                      <div className="flex items-center justify-between">
                        <span>Tabela Atacado</span>
                        <span className="text-[9px] font-normal lowercase">margem % | preço R$</span>
                      </div>
                    </th>
                    <th className="px-3 py-2.5 text-center w-28">Entrada Estoque</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {nfeData.items.map((item, index) => {
                    const retailProfit = item.retailPrice - item.costPrice;
                    const wholesaleProfit = item.wholesalePrice - item.costPrice;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Status: Novo vs Existente */}
                        <td className="px-3 py-3 text-center align-middle">
                          {item.isNewProduct ? (
                            <span className="inline-block p-1 bg-amber-100 text-amber-800 rounded-md font-bold text-[10px]" title="Novo produto no catálogo">
                              NOVO
                            </span>
                          ) : (
                            <span className="inline-block p-1 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[10px]" title="Já existe no estoque">
                              EXISTE
                            </span>
                          )}
                        </td>

                        {/* Produto / SKU / NCM */}
                        <td className="px-3 py-3 align-top">
                          <div className="flex items-center gap-1.5 font-mono text-slate-500 text-[11px]">
                            <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                              {item.code}
                            </span>
                            <span>NCM: {item.ncm}</span>
                          </div>

                          <div className="font-semibold text-slate-900 text-xs mt-1">
                            {item.name}
                          </div>

                          {/* Se já existe, mostrar comparação com estoque e preços atuais */}
                          {!item.isNewProduct && item.existingCurrentStock !== undefined && (
                            <div className="text-[10px] text-slate-500 mt-1 bg-slate-100 p-1 rounded space-x-2">
                              <span>Estoque atual: <strong>{item.existingCurrentStock}</strong></span>
                              <span>•</span>
                              <span>Varejo atual: <strong>{formatBRL(item.existingRetailPrice || 0)}</strong></span>
                              <span>•</span>
                              <span>Atacado atual: <strong>{formatBRL(item.existingWholesalePrice || 0)}</strong></span>
                            </div>
                          )}
                        </td>

                        {/* Quantidade e Unidade */}
                        <td className="px-3 py-3 text-center font-bold text-slate-800 align-top">
                          <div className="text-sm">{item.quantity}</div>
                          <span className="text-[10px] text-slate-500 uppercase">{item.unit}</span>
                        </td>

                        {/* Custo Unitário */}
                        <td className="px-3 py-3 text-right font-mono align-top">
                          <div className="font-bold text-slate-900 text-xs">
                            {formatBRL(item.costPrice)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Total: {formatBRL(item.totalCost)}
                          </div>
                        </td>

                        {/* Coluna Varejo: Checkbox, Margem % e Preço R$ */}
                        <td className="px-3 py-3 bg-blue-50/30 align-top">
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.updateRetailPrice}
                                onChange={(e) => handleUpdateItem(index, { updateRetailPrice: e.target.checked })}
                                className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="font-semibold text-[11px] text-blue-900">
                                Atualizar Varejo
                              </span>
                            </label>

                            <div className="grid grid-cols-2 gap-1.5 items-center">
                              {/* Margem % */}
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.5"
                                  disabled={!item.updateRetailPrice}
                                  value={item.retailMarginPercent}
                                  onChange={(e) => handleRetailMarginChange(index, Number(e.target.value))}
                                  className="w-full p-1.5 text-xs font-bold bg-white border border-slate-300 rounded font-mono text-blue-900 disabled:opacity-50 pr-5"
                                  placeholder="Margem %"
                                />
                                <span className="absolute right-1.5 top-1.5 text-[10px] text-slate-400">%</span>
                              </div>

                              {/* Preço R$ */}
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.01"
                                  disabled={!item.updateRetailPrice}
                                  value={item.retailPrice}
                                  onChange={(e) => handleRetailPriceChange(index, Number(e.target.value))}
                                  className="w-full p-1.5 text-xs font-bold bg-white border border-slate-300 rounded font-mono text-emerald-700 disabled:opacity-50"
                                  placeholder="R$ Preço"
                                />
                              </div>
                            </div>

                            <div className="text-[10px] text-emerald-700 font-medium">
                              Lucro Unit.: {formatBRL(retailProfit)}
                            </div>
                          </div>
                        </td>

                        {/* Coluna Atacado: Checkbox, Margem % e Preço R$ */}
                        <td className="px-3 py-3 bg-purple-50/30 align-top">
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.updateWholesalePrice}
                                onChange={(e) => handleUpdateItem(index, { updateWholesalePrice: e.target.checked })}
                                className="w-3.5 h-3.5 text-purple-600 rounded focus:ring-purple-500"
                              />
                              <span className="font-semibold text-[11px] text-purple-900">
                                Atualizar Atacado
                              </span>
                            </label>

                            <div className="grid grid-cols-2 gap-1.5 items-center">
                              {/* Margem % */}
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.5"
                                  disabled={!item.updateWholesalePrice}
                                  value={item.wholesaleMarginPercent}
                                  onChange={(e) => handleWholesaleMarginChange(index, Number(e.target.value))}
                                  className="w-full p-1.5 text-xs font-bold bg-white border border-slate-300 rounded font-mono text-purple-900 disabled:opacity-50 pr-5"
                                  placeholder="Margem %"
                                />
                                <span className="absolute right-1.5 top-1.5 text-[10px] text-slate-400">%</span>
                              </div>

                              {/* Preço R$ */}
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.01"
                                  disabled={!item.updateWholesalePrice}
                                  value={item.wholesalePrice}
                                  onChange={(e) => handleWholesalePriceChange(index, Number(e.target.value))}
                                  className="w-full p-1.5 text-xs font-bold bg-white border border-slate-300 rounded font-mono text-purple-800 disabled:opacity-50"
                                  placeholder="R$ Preço"
                                />
                              </div>
                            </div>

                            <div className="text-[10px] text-purple-700 font-medium">
                              Lucro Unit.: {formatBRL(wholesaleProfit)}
                            </div>
                          </div>
                        </td>

                        {/* Entrada em Estoque */}
                        <td className="px-3 py-3 text-center align-middle">
                          <label className="inline-flex flex-col items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.updateStock}
                              onChange={(e) => handleUpdateItem(index, { updateStock: e.target.checked })}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                            <span className="text-[10px] font-semibold text-slate-600">
                              +{item.quantity} {item.unit}
                            </span>
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* =========================================================================
              4. RESUMO GERAL DE FECHAMENTO & FINANCEIRO
              ========================================================================= */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Custo Total Compra</span>
                <span className="text-lg font-bold text-slate-900 font-mono">{formatBRL(totalCost)}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{nfeData.items.length} produtos conferidos</span>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Faturamento Varejo</span>
                <span className="text-lg font-bold text-blue-900 font-mono">{formatBRL(potentialRetailRevenue)}</span>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">Lucro: +{formatBRL(potentialRetailProfit)}</span>
              </div>

              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Faturamento Atacado</span>
                <span className="text-lg font-bold text-purple-900 font-mono">{formatBRL(potentialWholesaleRevenue)}</span>
                <span className="text-[10px] text-purple-700 font-semibold block mt-0.5">Preço especial revenda</span>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Contas a Pagar</span>
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={nfeData.createAccountPayable}
                    onChange={(e) => setNfeData(prev => ({ ...prev, createAccountPayable: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Lançar título no Contas a Pagar (+28 dias)
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-white px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Ao confirmar, os valores de <strong>Varejo</strong> e <strong>Atacado</strong> selecionados serão gravados no catálogo e o fornecedor será homologado.
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#363739] bg-[#f4f5f6] hover:bg-[#d8d8d8] rounded-lg transition-colors border border-[#d8d8d8]"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirmAndCommit}
              className="px-6 py-2 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar e Gravar Produtos no Estoque
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
