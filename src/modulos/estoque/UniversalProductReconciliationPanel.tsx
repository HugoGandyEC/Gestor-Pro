import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ShieldCheck,
  Calculator,
  Link2,
  PlusSquare,
  Ban,
  Scale,
  ArrowRight,
  Sparkles,
  Barcode,
  AlertCircle,
  Building2,
  Package,
  Search,
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
  detectProductReconciliation,
  formatQuantityClean,
  getMatchSourceLabel,
  normalizeText,
  recalculateImportItems,
  round2,
  sanitizeBarcode,
} from '../../utils/stockImportHelpers';
import { StockImportProductPicker } from './StockImportProductPicker';
import { StockImportFinancialPanel } from './StockImportFinancialPanel';

interface UniversalProductReconciliationPanelProps {
  parsedRows: Record<string, any>[];
  columnMapping: Record<string, string>;
  fileName: string | null;
  onCommitted: (result: { count: number; message: string }) => void;
  onClear: () => void;
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

function parseBrNumber(raw: any): number {
  const str = String(raw ?? '0').trim().replace(/[R$\s]/g, '');
  if (!str) return 0;
  if (str.includes(',') && str.includes('.')) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  }
  if (str.includes(',')) {
    return parseFloat(str.replace(',', '.')) || 0;
  }
  return parseFloat(str) || 0;
}

export const UniversalProductReconciliationPanel: React.FC<
  UniversalProductReconciliationPanelProps
> = ({ parsedRows, columnMapping, fileName, onCommitted, onClear }) => {
  const {
    products,
    suppliers,
    supplierProductMappings,
    generalExpenses,
    commitImportNFe,
  } = useApp();

  // Fornecedor opcional (habilita memória De-Para por fornecedor + pré-preenche financeiro)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [customSupplierName, setCustomSupplierName] = useState<string>('');
  const [customSupplierCnpj, setCustomSupplierCnpj] = useState<string>('');
  const [emissionDate, setEmissionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Opções seletivas de catálogo/estoque
  const [productZeroStock, setProductZeroStock] = useState(false);
  const [productSkipCost, setProductSkipCost] = useState(false);
  const [productImportSalePrices, setProductImportSalePrices] = useState(true);

  // Encargos e rateio
  const [freightTotal, setFreightTotal] = useState<number>(0);
  const [insuranceTotal, setInsuranceTotal] = useState<number>(0);
  const [otherExpensesTotal, setOtherExpensesTotal] = useState<number>(0);
  const [discountTotal, setDiscountTotal] = useState<number>(0);
  const [allocationMode, setAllocationMode] =
    useState<ImportAllocationMode>('proportional_value');
  const [costUpdateMode, setCostUpdateMode] =
    useState<ImportCostUpdateMode>('effective_unit');

  // Integração financeira seletiva (padrão 'none')
  const [financialMode, setFinancialMode] = useState<ImportFinancialMode>('none');
  const [expenseCategory, setExpenseCategory] =
    useState<ExpenseCategory>('compra_produtos_xml');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('boleto');
  const [initialPaymentStatus, setInitialPaymentStatus] = useState<'pendente' | 'pago'>(
    'pendente'
  );
  const [installments, setInstallments] = useState<ImportFinancialInstallment[]>([]);
  const [linkedExpenseId, setLinkedExpenseId] = useState<string | undefined>(undefined);

  // Itens conciliados + filtro visual
  const [items, setItems] = useState<ParsedXmlItem[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<
    'all' | 'link_existing' | 'create_new' | 'ignore'
  >('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedSupplierObj = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId),
    [suppliers, selectedSupplierId]
  );

  const effectiveSupplierName =
    selectedSupplierObj?.name || customSupplierName.trim() || 'Importação Universal';
  const effectiveSupplierCnpj =
    selectedSupplierObj?.cnpj || customSupplierCnpj.trim() || '';

  // Constrói e concilia os itens sempre que parsedRows, columnMapping ou o fornecedor mudar
  useEffect(() => {
    const built: ParsedXmlItem[] = parsedRows.map((row, idx) => {
      const code =
        String(row[columnMapping['code']] ?? '').trim() ||
        `PRD-${String(idx + 1).padStart(3, '0')}`;
      const barcode = sanitizeBarcode(row[columnMapping['barcode']]);
      const name =
        String(row[columnMapping['name']] ?? '').trim() || `Produto Importado ${idx + 1}`;
      const brand = String(row[columnMapping['brand']] ?? '').trim() || undefined;
      const category =
        String(row[columnMapping['category']] ?? '').trim() || 'Peças Gerais';
      const subcategory =
        String(row[columnMapping['subcategory']] ?? '').trim() || undefined;
      const unit =
        String(row[columnMapping['unit']] ?? 'UN').trim().toUpperCase() || 'UN';
      const rawQty = Math.max(0, parseBrNumber(row[columnMapping['currentStock']]));
      const qty = rawQty > 0 ? rawQty : 1;
      const rawUnitCost = Math.max(0, parseBrNumber(row[columnMapping['costPrice']]));
      const rawRetail = Math.max(0, parseBrNumber(row[columnMapping['retailPrice']]));
      const rawWholesale = rawRetail > 0 ? round2(rawRetail * 0.85) : 0;

      const reconciliation = detectProductReconciliation(
        { code, barcode, name, brand },
        products,
        supplierProductMappings,
        { cnpj: effectiveSupplierCnpj, name: effectiveSupplierName }
      );

      const matched = reconciliation.matchedProduct;
      const memorized = reconciliation.memorizedMapping;
      const factor = memorized && memorized.conversionFactor > 0 ? memorized.conversionFactor : 1;
      const stockUnit = matched?.unit || memorized?.stockUnit || unit || 'UN';
      const totalCost = round2(rawUnitCost * qty);
      const baseUnitConverted = factor > 0 ? rawUnitCost / factor : rawUnitCost;
      const retailMargin =
        baseUnitConverted > 0 && rawRetail > 0
          ? round2(((rawRetail - baseUnitConverted) / baseUnitConverted) * 100)
          : 55;
      const wholesaleMargin =
        baseUnitConverted > 0 && rawWholesale > 0
          ? round2(((rawWholesale - baseUnitConverted) / baseUnitConverted) * 100)
          : 35;

      return {
        id: `uni-item-${idx}-${code}`,
        selectedToImport: true,
        action: matched ? 'link_existing' : 'create_new',
        code,
        barcode: barcode || undefined,
        brand,
        subcategory,
        name,
        ncm: '8419.19.10',
        quantity: qty,
        unit,
        stockUnit,
        conversionFactor: factor,
        costPrice: rawUnitCost,
        totalCost,
        category: matched?.category || category,
        retailMarginPercent: retailMargin,
        retailPrice: rawRetail,
        updateRetailPrice: productImportSalePrices && rawRetail > 0,
        wholesaleMarginPercent: wholesaleMargin,
        wholesalePrice: rawWholesale,
        updateWholesalePrice: productImportSalePrices && rawWholesale > 0,
        updateStock: !productZeroStock && rawQty > 0,
        isNewProduct: !matched,
        existingProductId: matched?.id,
        existingCurrentStock: matched?.currentStock,
        existingCostPrice: matched?.costPrice,
        existingRetailPrice: matched?.retailPrice,
        existingWholesalePrice: matched?.wholesalePrice,
        matchSource:
          reconciliation.matchSource !== 'none'
            ? reconciliation.matchSource
            : reconciliation.suggestedMatches.length > 0
            ? 'similarity'
            : 'none',
        suggestedMatches: reconciliation.suggestedMatches,
        memorizedMappingId: memorized?.id,
      };
    });

    setItems(built);
    setErrorMsg(null);
  }, [
    parsedRows,
    columnMapping,
    selectedSupplierId,
    customSupplierName,
    customSupplierCnpj,
    products,
    supplierProductMappings,
  ]);

  // Recálculo reativo de rateio, quantidade convertida e custo efetivo convertido
  const calculated = useMemo(() => {
    const adjusted = items.map((it) => ({
      ...it,
      costPrice: productSkipCost ? 0 : it.costPrice,
      totalCost: productSkipCost ? 0 : it.totalCost,
      updateStock: productZeroStock ? false : it.updateStock,
      updateRetailPrice: productImportSalePrices ? it.updateRetailPrice : false,
      updateWholesalePrice: productImportSalePrices ? it.updateWholesalePrice : false,
    }));

    return recalculateImportItems(
      adjusted,
      {
        freightTotal,
        insuranceTotal,
        otherExpensesTotal,
        discountTotal,
      },
      allocationMode
    );
  }, [
    items,
    freightTotal,
    insuranceTotal,
    otherExpensesTotal,
    discountTotal,
    allocationMode,
    productZeroStock,
    productSkipCost,
    productImportSalePrices,
  ]);

  const stats = useMemo(() => {
    const list = calculated.items;
    const linked = list.filter((i) => i.action === 'link_existing');
    const created = list.filter((i) => i.action === 'create_new');
    const ignored = list.filter((i) => i.action === 'ignore');
    const unresolved = linked.filter((i) => !i.existingProductId);
    const totalConverted = list
      .filter((i) => i.action !== 'ignore' && i.updateStock)
      .reduce((acc, it) => acc + (it.convertedQuantity || 0), 0);
    return {
      total: list.length,
      active: linked.length + created.length,
      linked: linked.length,
      created: created.length,
      ignored: ignored.length,
      unresolved: unresolved.length,
      totalConverted,
    };
  }, [calculated.items]);

  const visibleItems = useMemo(() => {
    const q = normalizeText(searchFilter);
    return calculated.items.filter((it) => {
      if (actionFilter !== 'all' && it.action !== actionFilter) return false;
      if (!q) return true;
      const hay = normalizeText(`${it.name} ${it.code} ${it.barcode || ''} ${it.brand || ''}`);
      return hay.includes(q);
    });
  }, [calculated.items, searchFilter, actionFilter]);

  const handleActionChange = (itemId: string, action: ImportItemAction) => {
    setErrorMsg(null);
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        if (action === 'ignore') {
          return { ...it, action: 'ignore', selectedToImport: false };
        }
        if (action === 'create_new') {
          return {
            ...it,
            action: 'create_new',
            selectedToImport: true,
            isNewProduct: true,
            existingProductId: undefined,
            stockUnit: it.unit || 'UN',
          };
        }
        let chosenId = it.existingProductId;
        let chosenProd = chosenId ? products.find((p) => p.id === chosenId) : undefined;
        if (!chosenProd && it.suggestedMatches && it.suggestedMatches.length > 0) {
          chosenProd = products.find((p) => p.id === it.suggestedMatches![0].productId);
          chosenId = chosenProd?.id;
        }
        return {
          ...it,
          action: 'link_existing',
          selectedToImport: true,
          isNewProduct: false,
          existingProductId: chosenId,
          existingCurrentStock: chosenProd?.currentStock,
          existingCostPrice: chosenProd?.costPrice,
          stockUnit: chosenProd?.unit || it.stockUnit || it.unit || 'UN',
        };
      })
    );
  };

  const handleLinkProduct = (itemId: string, product: Product) => {
    setErrorMsg(null);
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              action: 'link_existing',
              selectedToImport: true,
              isNewProduct: false,
              existingProductId: product.id,
              existingCurrentStock: product.currentStock,
              existingCostPrice: product.costPrice,
              existingRetailPrice: product.retailPrice,
              existingWholesalePrice: product.wholesalePrice,
              stockUnit: product.unit || it.unit || 'UN',
              category: product.category || it.category,
              matchSource:
                it.matchSource === 'barcode' || it.matchSource === 'supplier_mapping'
                  ? it.matchSource
                  : 'manual',
            }
          : it
      )
    );
  };

  const handleClearLink = (itemId: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              existingProductId: undefined,
              existingCurrentStock: undefined,
              existingCostPrice: undefined,
            }
          : it
      )
    );
  };

  const handleFactorChange = (itemId: string, raw: string) => {
    const parsed = parseFloat(raw.replace(',', '.'));
    const safeFactor = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, conversionFactor: safeFactor } : it))
    );
  };

  const handleToggleItemStock = (itemId: string, checked: boolean) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, updateStock: checked } : it))
    );
  };

  const handleEditItemField = (
    itemId: string,
    field: 'name' | 'stockUnit',
    value: string
  ) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, [field]: value } : it))
    );
  };

  const handleBulkAction = (action: ImportItemAction) => {
    setItems((prev) =>
      prev.map((it) => {
        if (action === 'ignore') return { ...it, action: 'ignore', selectedToImport: false };
        if (action === 'create_new') {
          return {
            ...it,
            action: 'create_new',
            selectedToImport: true,
            isNewProduct: true,
            existingProductId: undefined,
          };
        }
        return it;
      })
    );
  };

  const handleFinancialModeChange = (mode: ImportFinancialMode) => {
    setFinancialMode(mode);
    if (mode === 'create_new' && installments.length === 0) {
      setInstallments(
        buildQuickInstallments(calculated.grandTotal, emissionDate, '30d')
      );
    }
  };

  const handleConfirm = () => {
    setErrorMsg(null);
    if (stats.active === 0) {
      setErrorMsg('Nenhum item está ativo para importação. Altere pelo menos 1 linha para Vincular ou Cadastrar Novo.');
      return;
    }
    if (stats.unresolved > 0) {
      setErrorMsg(
        `Existem ${stats.unresolved} linha(s) com ação "Vincular (De-Para)" sem produto selecionado. Escolha o produto do estoque ou mude a ação.`
      );
      return;
    }
    if (financialMode === 'link_existing' && !linkedExpenseId) {
      setErrorMsg(
        'Selecione qual Despesa / Conta a Pagar existente deseja vincular antes de confirmar.'
      );
      return;
    }

    const payload: ParsedXmlNFe = {
      nNF: fileName || 'Importação Universal',
      emissionDate,
      productsTotal: calculated.activeProductsTotal,
      freightTotal,
      insuranceTotal,
      otherExpensesTotal,
      discountTotal,
      totalValue: calculated.grandTotal,
      allocationMode,
      costUpdateMode,
      supplier: {
        cnpj: effectiveSupplierCnpj,
        name: effectiveSupplierName,
        isAlreadyRegistered: Boolean(selectedSupplierObj),
        existingSupplierId: selectedSupplierObj?.id,
        registerIfNew: false,
      },
      items: calculated.items,
      importProducts: true,
      createAccountPayable: financialMode === 'create_new',
      financialMode,
      installments,
      xmlHasDuplicates: false,
      paymentMethod,
      expenseCategory,
      initialPaymentStatus,
      linkedExpenseId,
    };

    const res = commitImportNFe(payload, {
      source: 'universal_import',
      referenceLabel: fileName || 'Importação Universal Estoque',
      skipCostOnNew: productSkipCost,
    });

    if (res.success) {
      onCommitted({
        count: res.newProductsCount + res.updatedProductsCount,
        message: res.message,
      });
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Barra Superior: Controle Seletivo + Fornecedor para Memória De-Para */}
      <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Importação Inteligente de Estoque — De-Para, Conversão, Rateio &amp; Financeiro Seletivo
              </h3>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Por padrão, <strong>nenhum lançamento é enviado ao Financeiro</strong>. Ative a integração financeira no painel abaixo apenas quando desejar gerar ou vincular contas a pagar.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setProductZeroStock(true);
                setProductSkipCost(false);
                setProductImportSalePrices(true);
                setFinancialMode('none');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                productZeroStock && financialMode === 'none'
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              Somente Catálogo (Sem Saldo / Sem Financeiro)
            </button>
            <button
              type="button"
              onClick={() => {
                setProductZeroStock(false);
                setProductSkipCost(false);
                setProductImportSalePrices(true);
                setFinancialMode('none');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                !productZeroStock && !productSkipCost && financialMode === 'none'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Produtos + Saldo Convertido (Sem Financeiro)
            </button>
          </div>
        </div>

        {/* Fornecedor (opcional para memorizar vínculos De-Para por fornecedor) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 bg-white p-3 rounded-lg border border-emerald-200/80">
          <div>
            <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-600 mb-1">
              <Building2 className="w-3 h-3 text-slate-500" />
              Fornecedor Cadastrado (Opcional — ativa memória De-Para)
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Selecionar fornecedor ou informar ao lado --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.cnpj ? `(${s.cnpj})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
              Ou Nome do Fornecedor (avulso)
            </label>
            <input
              type="text"
              value={selectedSupplierObj ? selectedSupplierObj.name : customSupplierName}
              onChange={(e) => {
                setSelectedSupplierId('');
                setCustomSupplierName(e.target.value);
              }}
              placeholder="Ex: Distribuidora Solar SP"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
              CNPJ do Fornecedor (opcional)
            </label>
            <input
              type="text"
              value={selectedSupplierObj ? selectedSupplierObj.cnpj : customSupplierCnpj}
              onChange={(e) => {
                setSelectedSupplierId('');
                setCustomSupplierCnpj(e.target.value);
              }}
              placeholder="00.000.000/0001-00"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Opções de Saldo / Custo / Preço */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <label className="flex items-start gap-2 p-2.5 bg-white rounded-lg border border-emerald-200 cursor-pointer">
            <input
              type="checkbox"
              checked={productZeroStock}
              onChange={(e) => setProductZeroStock(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-emerald-600 rounded"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Não somar estoque (saldo 0 em novos)
              </span>
              <span className="text-[10px] text-slate-500">
                Mantém o saldo atual nos vinculados e grava 0 nos novos.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2 p-2.5 bg-white rounded-lg border border-emerald-200 cursor-pointer">
            <input
              type="checkbox"
              checked={productSkipCost}
              onChange={(e) => setProductSkipCost(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-emerald-600 rounded"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Não importar preço de custo
              </span>
              <span className="text-[10px] text-slate-500">
                Grava custo R$ 0,00 em novos (use política "Manter custo" p/ vinculados).
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2 p-2.5 bg-white rounded-lg border border-emerald-200 cursor-pointer">
            <input
              type="checkbox"
              checked={productImportSalePrices}
              onChange={(e) => setProductImportSalePrices(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-emerald-600 rounded"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Importar preços de venda
              </span>
              <span className="text-[10px] text-slate-500">
                Preenche Varejo e Atacado conforme a coluna mapeada.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Frete, Seguro, Outras Despesas, Descontos, Critério de Rateio e Política de Custo */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
          <Calculator className="w-4 h-4 text-orange-600" />
          Encargos da Compra (Frete, Seguro, Outras Despesas, Desconto), Rateio &amp; Política de Custo
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Produtos (Bruto)
            </label>
            <div className="text-xs font-black text-slate-900 pt-1">
              {formatBRL(calculated.activeProductsTotal)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white border border-slate-200">
            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
              + Frete (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={freightTotal}
              onChange={(e) => setFreightTotal(Math.max(0, Number(e.target.value) || 0))}
              className="w-full px-2 py-1 text-xs font-bold border border-slate-300 rounded"
            />
          </div>
          <div className="p-2 rounded-lg bg-white border border-slate-200">
            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
              + Seguro (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={insuranceTotal}
              onChange={(e) => setInsuranceTotal(Math.max(0, Number(e.target.value) || 0))}
              className="w-full px-2 py-1 text-xs font-bold border border-slate-300 rounded"
            />
          </div>
          <div className="p-2 rounded-lg bg-white border border-slate-200">
            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
              + Outras Desp. (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={otherExpensesTotal}
              onChange={(e) => setOtherExpensesTotal(Math.max(0, Number(e.target.value) || 0))}
              className="w-full px-2 py-1 text-xs font-bold border border-slate-300 rounded"
            />
          </div>
          <div className="p-2 rounded-lg bg-emerald-50/40 border border-emerald-200">
            <label className="block text-[10px] font-bold uppercase text-emerald-700 mb-1">
              − Desconto (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={discountTotal}
              onChange={(e) => setDiscountTotal(Math.max(0, Number(e.target.value) || 0))}
              className="w-full px-2 py-1 text-xs font-bold bg-white border border-emerald-300 rounded"
            />
          </div>
          <div className="p-2 rounded-lg bg-orange-50 border border-orange-300">
            <label className="block text-[10px] font-bold uppercase text-orange-800 mb-1">
              Total da Compra
            </label>
            <div className="text-xs font-black text-orange-950 pt-1">
              {formatBRL(calculated.grandTotal)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Critério de Rateio
            </label>
            <select
              value={allocationMode}
              onChange={(e) => setAllocationMode(e.target.value as ImportAllocationMode)}
              className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg"
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
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Política de Atualização de Custo (Produtos Vinculados)
            </label>
            <select
              value={costUpdateMode}
              onChange={(e) => setCostUpdateMode(e.target.value as ImportCostUpdateMode)}
              className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg"
            >
              <option value="effective_unit">
                Atualizar pelo Custo Unitário Efetivo Convertido
              </option>
              <option value="weighted_average">
                Aplicar Custo Médio Ponderado (na unidade do estoque)
              </option>
              <option value="keep_current">Manter o custo atual do catálogo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Barra de Resumo + Filtros da Lista de Conciliação */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-800 inline-flex items-center gap-1.5">
            <Package className="w-4 h-4 text-blue-600" />
            Conciliação ({stats.total}):
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[11px]">
            {stats.linked} De-Para
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
            {stats.created} Novo(s)
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[11px]">
            {stats.ignored} Ignorado(s)
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[11px]">
            +{formatQuantityClean(stats.totalConverted)} unid. convertidas
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filtrar itens..."
              className="pl-7 pr-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg w-44"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as any)}
            className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg"
          >
            <option value="all">Todas ações</option>
            <option value="link_existing">Somente De-Para</option>
            <option value="create_new">Somente Novos</option>
            <option value="ignore">Somente Ignorados</option>
          </select>
          <button
            type="button"
            onClick={() => handleBulkAction('create_new')}
            className="px-2 py-1 text-[11px] font-semibold bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
          >
            Todos p/ Novo
          </button>
          <button
            type="button"
            onClick={() => handleBulkAction('ignore')}
            className="px-2 py-1 text-[11px] font-semibold bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 rounded-lg cursor-pointer"
          >
            Ignorar Todos
          </button>
        </div>
      </div>

      {/* Lista de Itens com Ação, De-Para Visual, Fator de Conversão e Cálculos em Tempo Real */}
      <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
        {visibleItems.slice(0, 150).map((item, idx) => {
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
                costUpdateMode
              )
            : effectiveUnitCost;

          const topSuggestions = (item.suggestedMatches || [])
            .map((s) => {
              const p = products.find((prod) => prod.id === s.productId);
              return p ? { ...s, product: p } : null;
            })
            .filter((x): x is NonNullable<typeof x> => Boolean(x));

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-3.5 space-y-3 transition-all ${
                isIgnored
                  ? 'bg-slate-100/70 border-slate-200 opacity-60'
                  : isLinked
                  ? 'bg-white border-blue-200 shadow-2xs'
                  : 'bg-white border-emerald-200 shadow-2xs'
              }`}
            >
              {/* Header da Linha */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-2.5 pb-2 border-b border-slate-100">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-black text-slate-400">#{idx + 1}</span>
                    <span className="text-xs font-bold text-slate-900">{item.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        MATCH_TONE_CLASSES[matchInfo.tone]
                      }`}
                    >
                      {matchInfo.label}
                    </span>
                    {item.memorizedMappingId && (
                      <span className="text-[10px] font-semibold text-blue-700 inline-flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3" /> Vínculo + fator memorizados
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-500">
                    <span className="font-mono">Cód: <strong>{item.code}</strong></span>
                    {item.barcode && (
                      <span className="inline-flex items-center gap-1 font-mono text-slate-700">
                        <Barcode className="w-3 h-3" />
                        EAN: <strong>{item.barcode}</strong>
                      </span>
                    )}
                    <span>
                      Entrada:{' '}
                      <strong className="text-slate-800">
                        {formatQuantityClean(item.quantity)} {item.unit} ×{' '}
                        {formatBRL(item.costPrice)} = {formatBRL(item.totalCost)}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleActionChange(item.id, 'link_existing')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md cursor-pointer ${
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
                    onClick={() => handleActionChange(item.id, 'create_new')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md cursor-pointer ${
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
                    onClick={() => handleActionChange(item.id, 'ignore')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md cursor-pointer ${
                      item.action === 'ignore'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'text-slate-500 hover:text-rose-700'
                    }`}
                  >
                    <Ban className="w-3 h-3" />
                    Ignorar
                  </button>
                </div>
              </div>

              {!isIgnored && (
                <>
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
                      onSelectProduct={(p) => handleLinkProduct(item.id, p)}
                      onClearProduct={() => handleClearLink(item.id)}
                      compact
                    />
                  ) : (
                    <div className="space-y-2">
                      {topSuggestions.length > 0 && (
                        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] text-amber-900 inline-flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <strong>Sugestão similar no estoque:</strong> clique para vincular via De-Para:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {topSuggestions.slice(0, 3).map((s) => (
                              <button
                                key={s.product.id}
                                type="button"
                                onClick={() => handleLinkProduct(item.id, s.product)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-white hover:bg-blue-600 hover:text-white text-slate-800 border border-amber-300 rounded-md cursor-pointer"
                              >
                                <Link2 className="w-3 h-3" />
                                <span className="truncate max-w-[180px]">{s.product.name}</span>
                                <span className="text-[10px] font-bold">({s.score}%)</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                            Nome do Novo Produto no Catálogo
                          </label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              handleEditItemField(item.id, 'name', e.target.value)
                            }
                            className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                            Unid. Estoque
                          </label>
                          <input
                            type="text"
                            value={item.stockUnit}
                            onChange={(e) =>
                              handleEditItemField(
                                item.id,
                                'stockUnit',
                                e.target.value.toUpperCase()
                              )
                            }
                            className="w-full px-2.5 py-1 text-xs font-bold uppercase border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Conversão + Cálculos em Tempo Real */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center bg-slate-50 rounded-xl border border-slate-200 p-2.5">
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
                          onChange={(e) => handleFactorChange(item.id, e.target.value)}
                          className="w-24 px-2 py-1 text-xs font-black bg-white border border-orange-300 rounded-lg"
                        />
                        <span className="text-[11px] font-bold text-slate-700 inline-flex items-center gap-1">
                          {item.unit}
                          <ArrowRight className="w-3 h-3 text-orange-600" />
                          <span className="text-blue-700">{item.stockUnit}</span>
                        </span>
                      </div>
                    </div>

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
                      <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!productZeroStock && item.updateStock}
                          disabled={productZeroStock}
                          onChange={(e) => handleToggleItemStock(item.id, e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600"
                        />
                        Somar saldo no estoque
                      </label>
                    </div>

                    <div className="md:col-span-3 space-y-0.5">
                      <div className="text-[10px] font-bold uppercase text-slate-500">
                        Valor Efetivo (c/ Rateio)
                      </div>
                      <div className="text-xs font-black text-slate-900">
                        {formatBRL(effectiveTotal)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Bruto: {formatBRL(item.totalCost)}
                      </div>
                    </div>

                    <div className="md:col-span-3 md:text-right space-y-0.5">
                      <div className="text-[10px] font-bold uppercase text-orange-700">
                        Custo Unitário Efetivo ({item.stockUnit})
                      </div>
                      <div className="text-sm font-black text-orange-900">
                        {formatBRL(effectiveUnitCost)} / {item.stockUnit}
                      </div>
                      {linkedProduct && (
                        <div className="text-[10px] text-slate-600">
                          Custo pós-importação:{' '}
                          <strong className="text-blue-800">
                            {formatBRL(projectedCatalogCost)}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {visibleItems.length > 150 && (
          <div className="p-2.5 rounded-lg bg-slate-100 text-center text-[11px] text-slate-600">
            Exibindo os primeiros 150 itens filtrados de {visibleItems.length}. Todos os itens ativos serão importados ao confirmar.
          </div>
        )}
      </div>

      {/* Integração Financeira Seletiva */}
      <StockImportFinancialPanel
        financialMode={financialMode}
        onChangeFinancialMode={handleFinancialModeChange}
        totalPurchaseValue={calculated.grandTotal}
        emissionDate={emissionDate}
        onChangeEmissionDate={setEmissionDate}
        supplierName={effectiveSupplierName}
        onChangeSupplierName={(name) => {
          setSelectedSupplierId('');
          setCustomSupplierName(name);
        }}
        expenseCategory={expenseCategory}
        onChangeExpenseCategory={setExpenseCategory}
        paymentMethod={paymentMethod}
        onChangePaymentMethod={setPaymentMethod}
        initialPaymentStatus={initialPaymentStatus}
        onChangeInitialPaymentStatus={setInitialPaymentStatus}
        installments={installments}
        onChangeInstallments={setInstallments}
        xmlHasDuplicates={false}
        existingExpenses={generalExpenses}
        linkedExpenseId={linkedExpenseId}
        onSelectLinkedExpenseId={setLinkedExpenseId}
      />

      {/* Ações Finais */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
        <span className="text-xs text-slate-600">
          {stats.linked} conciliado(s) via De-Para · {stats.created} novo(s) · {stats.ignored}{' '}
          ignorado(s) · Financeiro:{' '}
          <strong className="text-slate-900">
            {financialMode === 'none'
              ? 'Não gerar (isolado)'
              : financialMode === 'create_new'
              ? `Gerar ${installments.length} título(s)`
              : 'Vincular a despesa existente'}
          </strong>
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            Limpar
          </button>
          <button
            type="button"
            disabled={stats.active === 0}
            onClick={handleConfirm}
            className="px-5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>
              Confirmar Importação de Estoque ({stats.active} item(ns))
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
