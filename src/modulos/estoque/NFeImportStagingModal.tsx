import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  CheckCircle2,
  Building2,
  Package,
  AlertCircle,
  TrendingUp,
  Layers,
  Sparkles,
  FileCode,
  Search,
  RefreshCw,
  ArrowRight,
  SlidersHorizontal,
  Ban,
  Calculator,
  Link2,
  PlusSquare,
  Scale,
  Barcode,
  Info,
} from 'lucide-react';
import {
  ExpenseCategory,
  ImportAllocationMode,
  ImportCostUpdateMode,
  ImportFinancialInstallment,
  ImportFinancialMode,
  ImportItemAction,
  ParsedXmlItem,
  ParsedXmlNFe,
  PaymentMethod,
  Product,
} from '../../types';
import { useApp, formatBRL } from '../../context/AppContext';
import {
  buildQuickInstallments,
  computeUpdatedProductCost,
  formatQuantityClean,
  getMatchSourceLabel,
  recalculateImportItems,
  round2,
} from '../../utils/stockImportHelpers';
import { StockImportProductPicker } from './StockImportProductPicker';
import { StockImportFinancialPanel } from './StockImportFinancialPanel';

interface NFeImportStagingModalProps {
  isOpen?: boolean;
  onClose: () => void;
  initialParsedNFe?: ParsedXmlNFe | null;
  parsedNFe?: ParsedXmlNFe | null;
  onSuccess?: (message: string) => void;
}

const MATCH_TONE_CLASSES: Record<
  'emerald' | 'blue' | 'violet' | 'amber' | 'slate',
  string
> = {
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  blue: 'bg-blue-50 text-blue-800 border-blue-200',
  violet: 'bg-violet-50 text-violet-800 border-violet-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const NFeImportStagingModal: React.FC<NFeImportStagingModalProps> = ({
  isOpen = true,
  onClose,
  initialParsedNFe,
  parsedNFe,
  onSuccess,
}) => {
  const sourceNFe = initialParsedNFe ?? parsedNFe ?? null;
  const {
    products,
    generalExpenses,
    commitImportNFe,
    lookupCnpj,
    lookupCep,
    productCategories,
  } = useApp();

  const [nfeData, setNfeData] = useState<ParsedXmlNFe | null>(null);
  const [globalRetailMargin, setGlobalRetailMargin] = useState<number>(55);
  const [globalWholesaleMargin, setGlobalWholesaleMargin] = useState<number>(35);
  const [isLookingUpCnpj, setIsLookingUpCnpj] = useState(false);
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const [lookupFeedback, setLookupFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPricingColumns, setShowPricingColumns] = useState<boolean>(true);
  const [showSupplierDetails, setShowSupplierDetails] = useState<boolean>(false);

  // Recalcula rateio e custo unitário efetivo sempre que charges/allocation/items mudarem
  const applyRecalculation = (
    draft: ParsedXmlNFe,
    repriceItemsWithMargins = false
  ): ParsedXmlNFe => {
    const calc = recalculateImportItems(
      draft.items,
      {
        freightTotal: draft.freightTotal,
        insuranceTotal: draft.insuranceTotal,
        otherExpensesTotal: draft.otherExpensesTotal,
        discountTotal: draft.discountTotal,
      },
      draft.allocationMode
    );

    const nextItems = calc.items.map((item) => {
      if (!repriceItemsWithMargins) return item;
      const baseCost = item.effectiveUnitCost ?? item.costPrice;
      return {
        ...item,
        retailPrice: round2(baseCost * (1 + item.retailMarginPercent / 100)),
        wholesalePrice: round2(baseCost * (1 + item.wholesaleMarginPercent / 100)),
      };
    });

    return {
      ...draft,
      productsTotal: calc.activeProductsTotal,
      totalValue: calc.grandTotal,
      items: nextItems,
    };
  };

  useEffect(() => {
    if (sourceNFe) {
      const cloned: ParsedXmlNFe = {
        ...sourceNFe,
        supplier: { ...sourceNFe.supplier },
        items: sourceNFe.items.map((it) => ({
          ...it,
          suggestedMatches: it.suggestedMatches ? [...it.suggestedMatches] : [],
        })),
        installments: sourceNFe.installments
          ? sourceNFe.installments.map((inst) => ({ ...inst }))
          : [],
      };
      setNfeData(applyRecalculation(cloned, false));
      setLookupFeedback(null);
      setErrorMessage(null);
      setShowSupplierDetails(!cloned.supplier.isAlreadyRegistered);
    }
  }, [sourceNFe]);

  const summaryStats = useMemo(() => {
    if (!nfeData) {
      return {
        totalItems: 0,
        linkedCount: 0,
        newCount: 0,
        ignoredCount: 0,
        unresolvedLinkCount: 0,
        stockAddItemsCount: 0,
        totalConvertedUnits: 0,
        activeProductsTotal: 0,
        grandTotal: 0,
      };
    }
    const linked = nfeData.items.filter((i) => i.action === 'link_existing');
    const created = nfeData.items.filter((i) => i.action === 'create_new');
    const ignored = nfeData.items.filter((i) => i.action === 'ignore');
    const unresolved = linked.filter((i) => !i.existingProductId);
    const active = nfeData.items.filter((i) => i.action !== 'ignore');
    const stockAdd = active.filter((i) => i.updateStock);
    const totalConverted = stockAdd.reduce(
      (acc, it) => acc + (it.convertedQuantity ?? it.quantity * (it.conversionFactor || 1)),
      0
    );

    return {
      totalItems: nfeData.items.length,
      linkedCount: linked.length,
      newCount: created.length,
      ignoredCount: ignored.length,
      unresolvedLinkCount: unresolved.length,
      stockAddItemsCount: stockAdd.length,
      totalConvertedUnits: totalConverted,
      activeProductsTotal: nfeData.productsTotal,
      grandTotal: nfeData.totalValue,
    };
  }, [nfeData]);

  if (!isOpen || !nfeData) return null;

  const updateNFe = (
    updater: (prev: ParsedXmlNFe) => ParsedXmlNFe,
    recalculate = true,
    reprice = false
  ) => {
    setErrorMessage(null);
    setNfeData((prev) => {
      if (!prev) return null;
      const updated = updater(prev);
      return recalculate ? applyRecalculation(updated, reprice) : updated;
    });
  };

  const handleUpdateSupplier = (field: keyof ParsedXmlNFe['supplier'], value: any) => {
    updateNFe(
      (prev) => ({
        ...prev,
        supplier: { ...prev.supplier, [field]: value },
      }),
      false
    );
  };

  const handleCnpjLookup = async () => {
    if (!nfeData.supplier.cnpj) return;
    setIsLookingUpCnpj(true);
    setLookupFeedback(null);
    const data = await lookupCnpj(nfeData.supplier.cnpj);
    setIsLookingUpCnpj(false);
    if (data) {
      updateNFe(
        (prev) => ({
          ...prev,
          supplier: {
            ...prev.supplier,
            name: data.name || prev.supplier.name,
            tradeName: data.tradeName || prev.supplier.tradeName,
            phone: data.phone || prev.supplier.phone,
            email: data.email || prev.supplier.email,
            cep: data.cep || prev.supplier.cep,
            street: data.street || prev.supplier.street,
            number: data.number || prev.supplier.number,
            neighborhood: data.neighborhood || prev.supplier.neighborhood,
            city: data.city || prev.supplier.city,
            state: data.state || prev.supplier.state,
          },
        }),
        false
      );
      setLookupFeedback('Dados do fornecedor atualizados pela Receita Federal!');
    } else {
      setLookupFeedback('CNPJ não localizado na consulta online.');
    }
  };

  const handleCepLookup = async () => {
    if (!nfeData.supplier.cep) return;
    setIsLookingUpCep(true);
    setLookupFeedback(null);
    const data = await lookupCep(nfeData.supplier.cep);
    setIsLookingUpCep(false);
    if (data) {
      updateNFe(
        (prev) => ({
          ...prev,
          supplier: {
            ...prev.supplier,
            street: data.street || prev.supplier.street,
            neighborhood: data.neighborhood || prev.supplier.neighborhood,
            city: data.city || prev.supplier.city,
            state: data.state || prev.supplier.state,
          },
        }),
        false
      );
      setLookupFeedback('Endereço do fornecedor atualizado via CEP!');
    } else {
      setLookupFeedback('CEP não encontrado.');
    }
  };

  // Presets rápidos seletivos
  const applySelectivePreset = (
    preset: 'catalog_only' | 'stock_only_no_finance' | 'full_with_finance'
  ) => {
    updateNFe((prev) => {
      if (preset === 'catalog_only') {
        return {
          ...prev,
          importProducts: true,
          financialMode: 'none',
          createAccountPayable: false,
          supplier: { ...prev.supplier, registerIfNew: false },
          items: prev.items.map((it) => ({
            ...it,
            action: it.action === 'ignore' ? (it.existingProductId ? 'link_existing' : 'create_new') : it.action,
            selectedToImport: true,
            updateStock: false,
          })),
        };
      }
      if (preset === 'stock_only_no_finance') {
        return {
          ...prev,
          importProducts: true,
          financialMode: 'none',
          createAccountPayable: false,
          supplier: { ...prev.supplier, registerIfNew: !prev.supplier.isAlreadyRegistered },
          items: prev.items.map((it) => ({
            ...it,
            action: it.action === 'ignore' ? (it.existingProductId ? 'link_existing' : 'create_new') : it.action,
            selectedToImport: true,
            updateStock: true,
          })),
        };
      }
      // full_with_finance
      const nextInstallments =
        prev.installments.length > 0
          ? prev.installments
          : buildQuickInstallments(prev.totalValue, prev.emissionDate, '30d');
      return {
        ...prev,
        importProducts: true,
        financialMode: 'create_new',
        createAccountPayable: true,
        installments: nextInstallments,
        supplier: { ...prev.supplier, registerIfNew: !prev.supplier.isAlreadyRegistered },
        items: prev.items.map((it) => ({
          ...it,
          action: it.action === 'ignore' ? (it.existingProductId ? 'link_existing' : 'create_new') : it.action,
          selectedToImport: true,
          updateStock: true,
        })),
      };
    });
  };

  const handleUpdateCharge = (
    field: 'freightTotal' | 'insuranceTotal' | 'otherExpensesTotal' | 'discountTotal',
    value: number
  ) => {
    const safeVal = Math.max(0, Number(value) || 0);
    updateNFe(
      (prev) => ({
        ...prev,
        [field]: safeVal,
      }),
      true,
      true
    );
  };

  const handleChangeAllocationMode = (mode: ImportAllocationMode) => {
    updateNFe(
      (prev) => ({
        ...prev,
        allocationMode: mode,
      }),
      true,
      true
    );
  };

  const handleChangeCostUpdateMode = (mode: ImportCostUpdateMode) => {
    updateNFe(
      (prev) => ({
        ...prev,
        costUpdateMode: mode,
      }),
      false
    );
  };

  const handleItemActionChange = (itemId: string, newAction: ImportItemAction) => {
    updateNFe(
      (prev) => ({
        ...prev,
        items: prev.items.map((item) => {
          if (item.id !== itemId) return item;
          if (newAction === 'ignore') {
            return { ...item, action: 'ignore', selectedToImport: false };
          }
          if (newAction === 'create_new') {
            return {
              ...item,
              action: 'create_new',
              selectedToImport: true,
              isNewProduct: true,
              existingProductId: undefined,
              stockUnit: item.unit || 'UN',
              updateRetailPrice: true,
              updateWholesalePrice: true,
            };
          }
          // link_existing: se já tem sugestão forte e nenhum produto selecionado, pré-seleciona o 1º sugerido
          let chosenId = item.existingProductId;
          let chosenProd = chosenId ? products.find((p) => p.id === chosenId) : undefined;
          if (!chosenProd && item.suggestedMatches && item.suggestedMatches.length > 0) {
            chosenProd = products.find((p) => p.id === item.suggestedMatches![0].productId);
            chosenId = chosenProd?.id;
          }
          return {
            ...item,
            action: 'link_existing',
            selectedToImport: true,
            isNewProduct: false,
            existingProductId: chosenId,
            existingCurrentStock: chosenProd?.currentStock,
            existingCostPrice: chosenProd?.costPrice,
            existingRetailPrice: chosenProd?.retailPrice,
            existingWholesalePrice: chosenProd?.wholesalePrice,
            stockUnit: chosenProd?.unit || item.stockUnit || item.unit || 'UN',
          };
        }),
      }),
      true,
      true
    );
  };

  const handleLinkExistingProduct = (itemId: string, product: Product) => {
    updateNFe(
      (prev) => ({
        ...prev,
        items: prev.items.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            action: 'link_existing',
            selectedToImport: true,
            isNewProduct: false,
            existingProductId: product.id,
            existingCurrentStock: product.currentStock,
            existingCostPrice: product.costPrice,
            existingRetailPrice: product.retailPrice,
            existingWholesalePrice: product.wholesalePrice,
            stockUnit: product.unit || item.unit || 'UN',
            category: product.category || item.category,
            matchSource: item.matchSource === 'barcode' || item.matchSource === 'supplier_mapping'
              ? item.matchSource
              : 'manual',
          };
        }),
      }),
      true,
      true
    );
  };

  const handleClearLinkedProduct = (itemId: string) => {
    updateNFe(
      (prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                existingProductId: undefined,
                existingCurrentStock: undefined,
                existingCostPrice: undefined,
                existingRetailPrice: undefined,
                existingWholesalePrice: undefined,
              }
            : item
        ),
      }),
      true,
      false
    );
  };

  const handleConversionFactorChange = (itemId: string, rawValue: string) => {
    const parsed = parseFloat(rawValue.replace(',', '.'));
    const safeFactor = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    updateNFe(
      (prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId ? { ...item, conversionFactor: safeFactor } : item
        ),
      }),
      true,
      true
    );
  };

  const handleItemFieldChange = (
    itemId: string,
    field: keyof ParsedXmlItem,
    value: any
  ) => {
    updateNFe(
      (prev) => ({
        ...prev,
        items: prev.items.map((item) => {
          if (item.id !== itemId) return item;
          const updated = { ...item, [field]: value };
          const baseCost = updated.effectiveUnitCost ?? updated.costPrice;

          if (field === 'retailMarginPercent') {
            const m = Number(value) || 0;
            updated.retailPrice = round2(baseCost * (1 + m / 100));
          } else if (field === 'retailPrice') {
            const p = Number(value) || 0;
            updated.retailMarginPercent =
              baseCost > 0 ? round2(((p - baseCost) / baseCost) * 100) : 0;
          } else if (field === 'wholesaleMarginPercent') {
            const m = Number(value) || 0;
            updated.wholesalePrice = round2(baseCost * (1 + m / 100));
          } else if (field === 'wholesalePrice') {
            const p = Number(value) || 0;
            updated.wholesaleMarginPercent =
              baseCost > 0 ? round2(((p - baseCost) / baseCost) * 100) : 0;
          }
          return updated;
        }),
      }),
      false
    );
  };

  const applyGlobalMargins = () => {
    updateNFe(
      (prev) => ({
        ...prev,
        items: prev.items.map((item) => {
          const baseCost = item.effectiveUnitCost ?? item.costPrice;
          return {
            ...item,
            retailMarginPercent: globalRetailMargin,
            retailPrice: round2(baseCost * (1 + globalRetailMargin / 100)),
            wholesaleMarginPercent: globalWholesaleMargin,
            wholesalePrice: round2(baseCost * (1 + globalWholesaleMargin / 100)),
          };
        }),
      }),
      false
    );
  };

  const toggleAllStockUpdate = (checked: boolean) => {
    updateNFe(
      (prev) => ({
        ...prev,
        items: prev.items.map((item) => ({ ...item, updateStock: checked })),
      }),
      false
    );
  };

  const handleFinancialModeChange = (mode: ImportFinancialMode) => {
    updateNFe(
      (prev) => ({
        ...prev,
        financialMode: mode,
        createAccountPayable: mode === 'create_new',
        installments:
          mode === 'create_new' && prev.installments.length === 0
            ? buildQuickInstallments(prev.totalValue, prev.emissionDate, '30d')
            : prev.installments,
      }),
      false
    );
  };

  const handleConfirmImport = () => {
    if (!nfeData) return;

    if (summaryStats.unresolvedLinkCount > 0) {
      setErrorMessage(
        `Existem ${summaryStats.unresolvedLinkCount} item(ns) marcados como "Vincular Existente (De-Para)" sem produto selecionado. Selecione o produto do catálogo ou altere a ação para "Cadastrar Novo" ou "Ignorar".`
      );
      return;
    }

    if (nfeData.financialMode === 'link_existing' && !nfeData.linkedExpenseId) {
      setErrorMessage(
        'Você escolheu "Vincular a Despesa já existente". Selecione qual despesa do Financeiro deseja associar antes de confirmar.'
      );
      return;
    }

    const result = commitImportNFe(nfeData, { source: 'nfe_xml' });
    if (result.success) {
      if (onSuccess) onSuccess(result.message);
      onClose();
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col border border-slate-300 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <FileCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold truncate">
                  Conferência NF-e #{nfeData.nNF} — Conciliação De-Para &amp; Conversão
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/15 text-amber-200 border border-white/15">
                  Série {nfeData.serie || '1'} • Emissão {nfeData.emissionDate}
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5">
                Fornecedor: <strong className="text-white">{nfeData.supplier.name}</strong>
                {nfeData.supplier.cnpj ? ` • CNPJ: ${nfeData.supplier.cnpj}` : ''}
                {nfeData.chNFe ? ` • Chave: ${nfeData.chNFe.slice(0, 12)}...` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Barra de Atalhos Seletivos + Resumo Rápido */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <SlidersHorizontal className="w-4 h-4 text-orange-600" />
                Modo Rápido de Importação:
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applySelectivePreset('catalog_only')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-200 cursor-pointer"
                >
                  Só Cadastrar Catálogo (Sem Saldo / Sem Financeiro)
                </button>
                <button
                  type="button"
                  onClick={() => applySelectivePreset('stock_only_no_finance')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 cursor-pointer"
                >
                  Estoque + De-Para (Sem Financeiro)
                </button>
                <button
                  type="button"
                  onClick={() => applySelectivePreset('full_with_finance')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg border border-blue-200 cursor-pointer"
                >
                  Completo (Estoque + Gerar Financeiro)
                </button>
              </div>
            </div>

            {/* Cards de Resumo de Conciliação */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-semibold uppercase text-slate-500">Itens na NF-e</div>
                <div className="text-base font-black text-slate-900">{summaryStats.totalItems}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200">
                <div className="text-[10px] font-semibold uppercase text-blue-700">De-Para (Vinculados)</div>
                <div className="text-base font-black text-blue-900">{summaryStats.linkedCount}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                <div className="text-[10px] font-semibold uppercase text-emerald-700">Novos Produtos</div>
                <div className="text-base font-black text-emerald-900">{summaryStats.newCount}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
                <div className="text-[10px] font-semibold uppercase text-amber-700">Qtd Convertida (+)</div>
                <div className="text-base font-black text-amber-900">
                  +{formatQuantityClean(summaryStats.totalConvertedUnits)}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 text-white">
                <div className="text-[10px] font-semibold uppercase text-slate-300">Total da Compra</div>
                <div className="text-base font-black text-amber-300">
                  {formatBRL(summaryStats.grandTotal)}
                </div>
              </div>
            </div>
          </div>

          {/* Fornecedor (compacto / expansível) */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-slate-600" />
                <div>
                  <span className="text-xs font-bold text-slate-900">
                    Fornecedor: {nfeData.supplier.name}
                  </span>
                  <span
                    className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded border ${
                      nfeData.supplier.isAlreadyRegistered
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {nfeData.supplier.isAlreadyRegistered ? 'Já Cadastrado' : 'Novo Fornecedor'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!nfeData.supplier.isAlreadyRegistered && (
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nfeData.supplier.registerIfNew}
                      onChange={(e) => handleUpdateSupplier('registerIfNew', e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    Cadastrar fornecedor automaticamente
                  </label>
                )}
                <button
                  type="button"
                  onClick={() => setShowSupplierDetails((v) => !v)}
                  className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                >
                  {showSupplierDetails ? 'Ocultar dados' : 'Editar / Consultar CNPJ'}
                </button>
              </div>
            </div>

            {showSupplierDetails && (
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      CNPJ / CPF
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={nfeData.supplier.cnpj}
                        onChange={(e) => handleUpdateSupplier('cnpj', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleCnpjLookup}
                        disabled={isLookingUpCnpj}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 text-[11px] font-bold cursor-pointer"
                      >
                        {isLookingUpCnpj ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Razão Social
                    </label>
                    <input
                      type="text"
                      value={nfeData.supplier.name}
                      onChange={(e) => handleUpdateSupplier('name', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      CEP / Cidade-UF
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={nfeData.supplier.cep || ''}
                        onChange={(e) => handleUpdateSupplier('cep', e.target.value)}
                        placeholder="CEP"
                        className="w-24 px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleCepLookup}
                        disabled={isLookingUpCep}
                        className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 cursor-pointer"
                      >
                        {isLookingUpCep ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      </button>
                      <input
                        type="text"
                        value={`${nfeData.supplier.city || ''}${nfeData.supplier.state ? '/' + nfeData.supplier.state : ''}`}
                        readOnly
                        className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600"
                      />
                    </div>
                  </div>
                </div>
                {lookupFeedback && (
                  <p className="text-[11px] font-semibold text-blue-700">{lookupFeedback}</p>
                )}
              </div>
            )}
          </div>

          {/* 3. Frete, Seguro, Outras Despesas, Descontos, Critério de Rateio e Política de Custo */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Valores da NF-e, Rateio de Encargos &amp; Política de Custo
                </h3>
              </div>
              {nfeData.xmlOriginalTotalValue !== undefined && (
                <span className="text-[11px] text-slate-500">
                  Total original no XML (vNF):{' '}
                  <strong className="text-slate-800">
                    {formatBRL(nfeData.xmlOriginalTotalValue)}
                  </strong>
                </span>
              )}
            </div>

            {/* Inputs de vProd, vFrete, vSeg, vOutro, vDesc, vNF */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Produtos (vProd)
                </label>
                <div className="text-sm font-black text-slate-900 pt-0.5">
                  {formatBRL(nfeData.productsTotal)}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  + Frete (vFrete)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={nfeData.freightTotal}
                  onChange={(e) => handleUpdateCharge('freightTotal', Number(e.target.value))}
                  className="w-full px-2 py-1 text-xs font-bold text-slate-900 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  + Seguro (vSeg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={nfeData.insuranceTotal}
                  onChange={(e) => handleUpdateCharge('insuranceTotal', Number(e.target.value))}
                  className="w-full px-2 py-1 text-xs font-bold text-slate-900 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  + Outras Desp. (vOutro)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={nfeData.otherExpensesTotal}
                  onChange={(e) =>
                    handleUpdateCharge('otherExpensesTotal', Number(e.target.value))
                  }
                  className="w-full px-2 py-1 text-xs font-bold text-slate-900 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50/40 border border-emerald-200">
                <label className="block text-[10px] font-bold uppercase text-emerald-700 mb-1">
                  − Desconto (vDesc)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={nfeData.discountTotal}
                  onChange={(e) => handleUpdateCharge('discountTotal', Number(e.target.value))}
                  className="w-full px-2 py-1 text-xs font-bold text-emerald-900 bg-white border border-emerald-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-300">
                <label className="block text-[10px] font-bold uppercase text-orange-800 mb-1">
                  Total Compra (vNF)
                </label>
                <div className="text-sm font-black text-orange-950 pt-0.5">
                  {formatBRL(nfeData.totalValue)}
                </div>
              </div>
            </div>

            {/* Critério de Rateio + Política de Atualização de Custo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700">
                  Critério de Rateio (Frete / Seguro / Outras Desp. / Desconto)
                </label>
                <select
                  value={nfeData.allocationMode}
                  onChange={(e) =>
                    handleChangeAllocationMode(e.target.value as ImportAllocationMode)
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="proportional_value">
                    Rateio proporcional ao valor do item (Padrão)
                  </option>
                  <option value="proportional_qty">
                    Rateio proporcional à quantidade do item
                  </option>
                  <option value="financial_only">
                    Aplicar apenas no Total da Compra / Financeiro (não altera custo dos itens)
                  </option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700">
                  Atualização de Custo para Produtos Vinculados (na unidade do estoque)
                </label>
                <select
                  value={nfeData.costUpdateMode}
                  onChange={(e) =>
                    handleChangeCostUpdateMode(e.target.value as ImportCostUpdateMode)
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="effective_unit">
                    Atualizar pelo Custo Unitário Efetivo Convertido (última compra)
                  </option>
                  <option value="weighted_average">
                    Aplicar Custo Médio Ponderado (saldo atual × custo atual + entrada convertida)
                  </option>
                  <option value="keep_current">
                    Manter o custo atual do produto no catálogo
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Barra de Controle de Margens e Estoque dos Itens */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Package className="w-4 h-4 text-blue-600" />
                Itens da NF-e ({nfeData.items.length})
              </div>

              <div className="flex items-center gap-2 text-xs border-l border-slate-200 pl-3">
                <button
                  type="button"
                  onClick={() => toggleAllStockUpdate(true)}
                  className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                >
                  Somar estoque em todos
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => toggleAllStockUpdate(false)}
                  className="text-[11px] font-semibold text-slate-600 hover:underline cursor-pointer"
                >
                  Não somar estoque
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer mr-2">
                <input
                  type="checkbox"
                  checked={showPricingColumns}
                  onChange={(e) => setShowPricingColumns(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Exibir precificação Varejo/Atacado
              </label>

              {showPricingColumns && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                  <span className="text-[11px] text-slate-600 font-semibold">Varejo %</span>
                  <input
                    type="number"
                    value={globalRetailMargin}
                    onChange={(e) => setGlobalRetailMargin(Number(e.target.value) || 0)}
                    className="w-12 px-1 py-0.5 text-xs font-bold text-center border border-slate-300 rounded bg-white"
                  />
                  <span className="text-[11px] text-slate-600 font-semibold">Atacado %</span>
                  <input
                    type="number"
                    value={globalWholesaleMargin}
                    onChange={(e) => setGlobalWholesaleMargin(Number(e.target.value) || 0)}
                    className="w-12 px-1 py-0.5 text-xs font-bold text-center border border-slate-300 rounded bg-white"
                  />
                  <button
                    type="button"
                    onClick={applyGlobalMargins}
                    className="px-2 py-0.5 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white rounded cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. Lista / Tabela de Pré-Visualização: Ação, De-Para Visual, Fator de Conversão e Cálculos em Tempo Real */}
          <div className="space-y-3">
            {nfeData.items.map((item, idx) => {
              const isIgnored = item.action === 'ignore';
              const isLinked = item.action === 'link_existing';
              const matchInfo = getMatchSourceLabel(item.matchSource);
              const linkedProduct = item.existingProductId
                ? products.find((p) => p.id === item.existingProductId)
                : undefined;

              const convertedQty =
                item.convertedQuantity ?? item.quantity * (item.conversionFactor || 1);
              const effectiveTotal = item.effectiveTotal ?? item.totalCost;
              const effectiveUnitCost =
                item.effectiveUnitCost ??
                (convertedQty > 0 ? effectiveTotal / convertedQty : item.costPrice);

              const projectedCatalogCost = linkedProduct
                ? computeUpdatedProductCost(
                    linkedProduct,
                    convertedQty,
                    effectiveUnitCost,
                    nfeData.costUpdateMode
                  )
                : effectiveUnitCost;

              const rateioNetDelta = round2(
                (item.allocatedFreight || 0) +
                  (item.allocatedInsurance || 0) +
                  (item.allocatedOtherExpenses || 0) -
                  (item.allocatedDiscount || 0)
              );

              const topSuggestions = (item.suggestedMatches || [])
                .map((s) => {
                  const p = products.find((prod) => prod.id === s.productId);
                  return p ? { ...s, product: p } : null;
                })
                .filter((x): x is NonNullable<typeof x> => Boolean(x));

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border transition-all p-3.5 space-y-3 ${
                    isIgnored
                      ? 'bg-slate-100/70 border-slate-200 opacity-60'
                      : isLinked
                      ? 'bg-white border-blue-200 shadow-xs'
                      : 'bg-white border-emerald-200 shadow-xs'
                  }`}
                >
                  {/* Cabeçalho da linha: Índice, Descrição Fornecedor, Badge Detecção e Seletor de Ação */}
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 pb-2.5 border-b border-slate-100">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-black text-slate-400">#{idx + 1}</span>
                        <span className="text-xs font-bold text-slate-900 break-words">
                          {item.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            MATCH_TONE_CLASSES[matchInfo.tone]
                          }`}
                        >
                          {matchInfo.label}
                        </span>
                        {item.memorizedMappingId && (
                          <span className="text-[10px] font-semibold text-blue-700 inline-flex items-center gap-0.5">
                            <Sparkles className="w-3 h-3" /> Fator pré-preenchido
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                        <span className="font-mono">Cód. Forn.: <strong>{item.code}</strong></span>
                        {item.barcode && (
                          <span className="inline-flex items-center gap-1 font-mono text-slate-700">
                            <Barcode className="w-3 h-3 text-slate-500" />
                            EAN: <strong>{item.barcode}</strong>
                          </span>
                        )}
                        <span>NCM: {item.ncm}</span>
                        <span>
                          Entrada NF-e:{' '}
                          <strong className="text-slate-800">
                            {formatQuantityClean(item.quantity)} {item.unit} ×{' '}
                            {formatBRL(item.costPrice)} = {formatBRL(item.totalCost)}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Ação no Estoque */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => handleItemActionChange(item.id, 'link_existing')}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                            item.action === 'link_existing'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Link2 className="w-3 h-3" />
                          Vincular (De-Para)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemActionChange(item.id, 'create_new')}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                            item.action === 'create_new'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <PlusSquare className="w-3 h-3" />
                          Cadastrar Novo
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemActionChange(item.id, 'ignore')}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                            item.action === 'ignore'
                              ? 'bg-slate-700 text-white shadow-xs'
                              : 'text-slate-500 hover:text-red-700'
                          }`}
                        >
                          <Ban className="w-3 h-3" />
                          Ignorar
                        </button>
                      </div>
                    </div>
                  </div>

                  {!isIgnored && (
                    <>
                      {/* Área De-Para (quando Vincular Existente) OU Sugestões + Campos de Novo Produto */}
                      {isLinked ? (
                        <StockImportProductPicker
                          products={products}
                          selectedProductId={item.existingProductId}
                          suggestedMatches={item.suggestedMatches}
                          supplierItem={{
                            code: item.code,
                            barcode: item.barcode,
                            name: item.name,
                            unit: item.unit,
                            quantity: item.quantity,
                            totalCost: item.totalCost,
                            effectiveTotal,
                            conversionFactor: item.conversionFactor,
                            convertedQuantity: convertedQty,
                            effectiveUnitCost,
                          }}
                          onSelectProduct={(prod) => handleLinkExistingProduct(item.id, prod)}
                          onClearProduct={() => handleClearLinkedProduct(item.id)}
                          compact
                        />
                      ) : (
                        <div className="space-y-2">
                          {/* Sugestão inteligente de produtos similares para evitar duplicação */}
                          {topSuggestions.length > 0 && (
                            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-[11px] text-amber-900">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>
                                  <strong>Possível produto já cadastrado:</strong> deseja vincular via De-Para em vez de criar novo?
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {topSuggestions.slice(0, 3).map((s) => (
                                  <button
                                    key={s.product.id}
                                    type="button"
                                    onClick={() => handleLinkExistingProduct(item.id, s.product)}
                                    className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold bg-white hover:bg-blue-600 hover:text-white text-slate-800 border border-amber-300 rounded-md transition-colors cursor-pointer"
                                  >
                                    <Link2 className="w-3 h-3" />
                                    <span className="truncate max-w-[180px]">{s.product.name}</span>
                                    <span className="text-[10px] font-bold opacity-80">
                                      ({s.score}%)
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Campos editáveis do novo produto */}
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                                Nome no Catálogo (Novo Produto)
                              </label>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) =>
                                  handleItemFieldChange(item.id, 'name', e.target.value)
                                }
                                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                                Categoria
                              </label>
                              <input
                                type="text"
                                list={`nfe-cat-list-${item.id}`}
                                value={item.category}
                                onChange={(e) =>
                                  handleItemFieldChange(item.id, 'category', e.target.value)
                                }
                                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                              <datalist id={`nfe-cat-list-${item.id}`}>
                                {productCategories.map((cat) => (
                                  <option key={cat} value={cat} />
                                ))}
                              </datalist>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                                Unidade no Estoque
                              </label>
                              <input
                                type="text"
                                value={item.stockUnit}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    item.id,
                                    'stockUnit',
                                    e.target.value.toUpperCase()
                                  )
                                }
                                placeholder="UN"
                                className="w-full px-2.5 py-1.5 text-xs font-bold uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bloco de Conversão de Unidades + Custo Efetivo Convertido em Tempo Real */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                        {/* Fator de Conversão */}
                        <div className="md:col-span-3 space-y-1">
                          <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-600">
                            <Scale className="w-3 h-3 text-orange-600" />
                            Fator de Conversão (1 {item.unit} = X {item.stockUnit})
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="any"
                              min="0.0001"
                              value={item.conversionFactor}
                              onChange={(e) =>
                                handleConversionFactorChange(item.id, e.target.value)
                              }
                              className="w-24 px-2.5 py-1.5 text-xs font-black text-slate-900 bg-white border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <span className="text-[11px] font-bold text-slate-700 inline-flex items-center gap-1">
                              {item.unit}
                              <ArrowRight className="w-3 h-3 text-orange-600" />
                              <span className="text-blue-700">{item.stockUnit}</span>
                            </span>
                          </div>
                        </div>

                        {/* Quantidade Convertida no Estoque */}
                        <div className="md:col-span-3 space-y-0.5">
                          <div className="text-[10px] font-bold uppercase text-slate-500">
                            Qtd Convertida no Estoque
                          </div>
                          <div className="text-xs font-black text-emerald-700">
                            {formatQuantityClean(item.quantity)} {item.unit} × {item.conversionFactor} ={' '}
                            <span className="text-sm">
                              +{formatQuantityClean(convertedQty)} {item.stockUnit}
                            </span>
                          </div>
                          <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer pt-0.5">
                            <input
                              type="checkbox"
                              checked={item.updateStock}
                              onChange={(e) =>
                                handleItemFieldChange(item.id, 'updateStock', e.target.checked)
                              }
                              className="rounded border-slate-300 text-emerald-600"
                            />
                            Somar ao saldo do estoque
                          </label>
                        </div>

                        {/* Valor Efetivo com Rateio */}
                        <div className="md:col-span-3 space-y-0.5">
                          <div className="text-[10px] font-bold uppercase text-slate-500">
                            Valor Líquido / Efetivo do Item
                          </div>
                          <div className="text-xs font-black text-slate-900">
                            {formatBRL(effectiveTotal)}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Base: {formatBRL(item.totalCost)}
                            {rateioNetDelta !== 0 && (
                              <span
                                className={
                                  rateioNetDelta > 0
                                    ? 'text-orange-700 font-semibold ml-1'
                                    : 'text-emerald-700 font-semibold ml-1'
                                }
                              >
                                ({rateioNetDelta > 0 ? '+' : ''}
                                {formatBRL(rateioNetDelta)} rateio)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Custo Unitário Efetivo Convertido */}
                        <div className="md:col-span-3 space-y-0.5 md:text-right">
                          <div className="text-[10px] font-bold uppercase text-orange-700">
                            Custo Unitário Efetivo ({item.stockUnit})
                          </div>
                          <div className="text-sm font-black text-orange-900">
                            {formatBRL(effectiveUnitCost)} / {item.stockUnit}
                          </div>
                          {linkedProduct && (
                            <div className="text-[10px] text-slate-600">
                              Novo custo no catálogo:{' '}
                              <strong className="text-blue-800">
                                {formatBRL(projectedCatalogCost)}
                              </strong>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Precificação Opcional Varejo / Atacado baseada no Custo Efetivo Convertido */}
                      {showPricingColumns && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-0.5">
                          {/* Varejo */}
                          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-emerald-50/40 border border-emerald-200/80">
                            <label className="inline-flex items-center gap-1.5 font-bold text-emerald-900 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.updateRetailPrice}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    item.id,
                                    'updateRetailPrice',
                                    e.target.checked
                                  )
                                }
                                className="rounded border-emerald-400 text-emerald-600"
                              />
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                              Varejo ({item.stockUnit})
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                step="0.1"
                                value={item.retailMarginPercent}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    item.id,
                                    'retailMarginPercent',
                                    Number(e.target.value)
                                  )
                                }
                                disabled={!item.updateRetailPrice}
                                className="w-16 px-1.5 py-1 text-xs font-bold text-center bg-white border border-slate-300 rounded disabled:opacity-50"
                              />
                              <span className="text-[11px] text-slate-500">%</span>
                              <span className="text-[11px] text-slate-500">R$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={item.retailPrice}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    item.id,
                                    'retailPrice',
                                    Number(e.target.value)
                                  )
                                }
                                disabled={!item.updateRetailPrice}
                                className="w-24 px-2 py-1 text-xs font-bold text-emerald-800 bg-white border border-emerald-300 rounded disabled:opacity-50"
                              />
                            </div>
                          </div>

                          {/* Atacado */}
                          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-blue-50/40 border border-blue-200/80">
                            <label className="inline-flex items-center gap-1.5 font-bold text-blue-900 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.updateWholesalePrice}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    item.id,
                                    'updateWholesalePrice',
                                    e.target.checked
                                  )
                                }
                                className="rounded border-blue-400 text-blue-600"
                              />
                              <Layers className="w-3.5 h-3.5 text-blue-600" />
                              Atacado ({item.stockUnit})
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                step="0.1"
                                value={item.wholesaleMarginPercent}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    item.id,
                                    'wholesaleMarginPercent',
                                    Number(e.target.value)
                                  )
                                }
                                disabled={!item.updateWholesalePrice}
                                className="w-16 px-1.5 py-1 text-xs font-bold text-center bg-white border border-slate-300 rounded disabled:opacity-50"
                              />
                              <span className="text-[11px] text-slate-500">%</span>
                              <span className="text-[11px] text-slate-500">R$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={item.wholesalePrice}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    item.id,
                                    'wholesalePrice',
                                    Number(e.target.value)
                                  )
                                }
                                disabled={!item.updateWholesalePrice}
                                className="w-24 px-2 py-1 text-xs font-bold text-blue-800 bg-white border border-blue-300 rounded disabled:opacity-50"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* 5. Integração Financeira Seletiva + Duplicatas XML */}
          <StockImportFinancialPanel
            financialMode={nfeData.financialMode}
            onChangeFinancialMode={handleFinancialModeChange}
            totalPurchaseValue={nfeData.totalValue}
            emissionDate={nfeData.emissionDate}
            onChangeEmissionDate={(date) =>
              updateNFe((prev) => ({ ...prev, emissionDate: date }), false)
            }
            supplierName={nfeData.supplier.name}
            onChangeSupplierName={(name) => handleUpdateSupplier('name', name)}
            expenseCategory={nfeData.expenseCategory || 'compra_produtos_xml'}
            onChangeExpenseCategory={(cat: ExpenseCategory) =>
              updateNFe((prev) => ({ ...prev, expenseCategory: cat }), false)
            }
            paymentMethod={nfeData.paymentMethod || 'boleto'}
            onChangePaymentMethod={(method: PaymentMethod) =>
              updateNFe((prev) => ({ ...prev, paymentMethod: method }), false)
            }
            initialPaymentStatus={nfeData.initialPaymentStatus || 'pendente'}
            onChangeInitialPaymentStatus={(status) =>
              updateNFe((prev) => ({ ...prev, initialPaymentStatus: status }), false)
            }
            installments={nfeData.installments}
            onChangeInstallments={(insts: ImportFinancialInstallment[]) =>
              updateNFe((prev) => ({ ...prev, installments: insts }), false)
            }
            xmlHasDuplicates={nfeData.xmlHasDuplicates}
            existingExpenses={generalExpenses}
            linkedExpenseId={nfeData.linkedExpenseId}
            onSelectLinkedExpenseId={(id) =>
              updateNFe((prev) => ({ ...prev, linkedExpenseId: id }), false)
            }
          />
        </div>

        {/* Footer Fixo */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Vínculos De-Para e fatores de conversão serão <strong>memorizados automaticamente</strong> para as próximas compras de{' '}
              <strong>{nfeData.supplier.name}</strong>.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar Importação ({summaryStats.linkedCount + summaryStats.newCount} ativo(s))
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
