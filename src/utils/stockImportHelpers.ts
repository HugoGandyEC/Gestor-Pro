import {
  ImportAllocationMode,
  ImportCostUpdateMode,
  ImportFinancialInstallment,
  ImportMatchSource,
  ParsedXmlItem,
  PaymentMethod,
  Product,
  ProductMatchSuggestion,
  SupplierProductMapping,
} from '../types';

const STOP_WORDS = new Set([
  'de',
  'da',
  'do',
  'das',
  'dos',
  'e',
  'ou',
  'com',
  'sem',
  'para',
  'por',
  'em',
  'no',
  'na',
  'nos',
  'nas',
  'um',
  'uma',
  'uns',
  'umas',
  'o',
  'a',
  'os',
  'as',
  'p',
  'c',
  's',
  'un',
  'und',
  'unid',
  'unidade',
  'pc',
  'pç',
  'peca',
  'cx',
  'caixa',
  'pct',
  'pacote',
  'fd',
  'fardo',
  'kit',
  'ref',
  'cod',
  'tipo',
  'modelo',
  'mod',
  'novo',
  'nova',
]);

export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function round4(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

export function sanitizeBarcode(raw?: string | null): string {
  if (!raw) return '';
  const cleaned = String(raw).trim().toUpperCase();
  if (
    !cleaned ||
    cleaned === 'SEM GTIN' ||
    cleaned === 'SEM EAN' ||
    cleaned === 'N/A' ||
    cleaned === '0' ||
    /^0+$/.test(cleaned)
  ) {
    return '';
  }
  return cleaned.replace(/\s+/g, '');
}

export function normalizeText(text?: string | null): string {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function tokenizeForSimilarity(text?: string | null): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  return normalized
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function getBigrams(str: string): Set<string> {
  const set = new Set<string>();
  const compact = str.replace(/\s+/g, ' ').trim();
  if (compact.length < 2) return set;
  for (let i = 0; i < compact.length - 1; i++) {
    set.add(compact.slice(i, i + 2));
  }
  return set;
}

/**
 * Calcula similaridade (0..100) combinando tokens relevantes (ignorando acentos,
 * maiúsculas e stop words) + sobreposição de bigramas + bônus por correspondência numérica
 * (ex: 600l, 1cv, 220v, 50mm).
 */
export function computeDescriptionSimilarity(sourceText: string, targetText: string): number {
  const normA = normalizeText(sourceText);
  const normB = normalizeText(targetText);
  if (!normA || !normB) return 0;
  if (normA === normB) return 100;

  const tokensA = tokenizeForSimilarity(sourceText);
  const tokensB = tokenizeForSimilarity(targetText);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  let exactMatches = 0;
  let partialMatches = 0;

  for (const tA of setA) {
    if (setB.has(tA)) {
      exactMatches += 1;
    } else {
      for (const tB of setB) {
        if (tA.length >= 4 && tB.length >= 4 && (tA.includes(tB) || tB.includes(tA))) {
          partialMatches += 0.65;
          break;
        }
      }
    }
  }

  const unionSize = new Set([...setA, ...setB]).size;
  const jaccard = unionSize > 0 ? (exactMatches + partialMatches) / unionSize : 0;
  const coverageMin =
    Math.min(setA.size, setB.size) > 0
      ? (exactMatches + partialMatches * 0.8) / Math.min(setA.size, setB.size)
      : 0;

  const bigramsA = getBigrams(tokensA.join(' '));
  const bigramsB = getBigrams(tokensB.join(' '));
  let bigramOverlap = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) bigramOverlap += 1;
  }
  const dice =
    bigramsA.size + bigramsB.size > 0
      ? (2 * bigramOverlap) / (bigramsA.size + bigramsB.size)
      : 0;

  const rawScore = jaccard * 0.5 + coverageMin * 0.3 + dice * 0.2;
  return Math.min(99, Math.max(0, Math.round(rawScore * 100)));
}

export function buildSupplierKey(cnpj?: string, name?: string): string {
  const digits = (cnpj || '').replace(/\D/g, '');
  if (digits.length >= 11) return `cnpj:${digits}`;
  const normName = normalizeText(name);
  if (normName) return `name:${normName}`;
  return 'generic';
}

export function buildSupplierItemKey(
  supplierKey: string,
  itemCode?: string,
  itemDescription?: string
): string {
  const normCode = normalizeText(itemCode).replace(/\s+/g, '');
  if (normCode) return `${supplierKey}|code:${normCode}`;
  const normDesc = normalizeText(itemDescription);
  return `${supplierKey}|desc:${normDesc}`;
}

export function findMemorizedMapping(
  mappings: SupplierProductMapping[],
  supplierKey: string,
  itemCode?: string,
  itemDescription?: string
): SupplierProductMapping | undefined {
  if (!mappings.length) return undefined;
  const normCode = normalizeText(itemCode).replace(/\s+/g, '');
  const normDesc = normalizeText(itemDescription);

  // 1) Fornecedor + Código do Item no Fornecedor
  if (normCode) {
    const bySupplierAndCode = mappings.find(
      (m) =>
        m.supplierKey === supplierKey &&
        normalizeText(m.supplierItemCode).replace(/\s+/g, '') === normCode
    );
    if (bySupplierAndCode) return bySupplierAndCode;
  }

  // 2) Fornecedor + Descrição exata normalizada do Item no Fornecedor
  if (normDesc) {
    const bySupplierAndDesc = mappings.find(
      (m) =>
        m.supplierKey === supplierKey &&
        normalizeText(m.supplierItemDescription) === normDesc
    );
    if (bySupplierAndDesc) return bySupplierAndDesc;
  }

  // 3) Se supplierKey é generic, tentar casar por código/descrição memorizados anteriormente com generic
  if (supplierKey === 'generic' && normCode) {
    return mappings.find(
      (m) => normalizeText(m.supplierItemCode).replace(/\s+/g, '') === normCode
    );
  }

  return undefined;
}

export interface ProductReconciliationResult {
  matchedProduct?: Product;
  matchSource: ImportMatchSource;
  memorizedMapping?: SupplierProductMapping;
  suggestedMatches: ProductMatchSuggestion[];
}

/**
 * Executa a detecção automática ("De-Para") e gera sugestões inteligentes:
 * 1. Código de Barras / EAN / GTIN (correspondência exata)
 * 2. Vínculo de Fornecedor Memorizado ([Fornecedor + Código/Descrição])
 * 3. Código / SKU exato
 * 4. Similaridade de Descrição / Nome (retorna top sugestões para vínculo rápido)
 */
export function detectProductReconciliation(
  item: {
    code?: string;
    barcode?: string;
    name: string;
    brand?: string;
  },
  products: Product[],
  mappings: SupplierProductMapping[],
  supplierContext: { cnpj?: string; name?: string }
): ProductReconciliationResult {
  const cleanBarcode = sanitizeBarcode(item.barcode);
  const normCode = normalizeText(item.code).replace(/\s+/g, '');
  const supplierKey = buildSupplierKey(supplierContext.cnpj, supplierContext.name);

  let matchedProduct: Product | undefined;
  let matchSource: ImportMatchSource = 'none';
  let memorizedMapping: SupplierProductMapping | undefined;

  const suggestionsMap = new Map<string, ProductMatchSuggestion>();

  // 1) Correspondência exata por Código de Barras / EAN / GTIN
  if (cleanBarcode) {
    const byBarcode = products.find(
      (p) => sanitizeBarcode(p.barcode) === cleanBarcode
    );
    if (byBarcode) {
      matchedProduct = byBarcode;
      matchSource = 'barcode';
      suggestionsMap.set(byBarcode.id, {
        productId: byBarcode.id,
        score: 100,
        reason: 'barcode',
      });
    }
  }

  // 2) Vínculo de Fornecedor Memorizado (também busca mesmo se já achou por EAN para herdar o fator!)
  const foundMapping = findMemorizedMapping(
    mappings,
    supplierKey,
    item.code,
    item.name
  );
  if (foundMapping) {
    const mappedProduct = products.find((p) => p.id === foundMapping.productId);
    if (mappedProduct) {
      memorizedMapping = foundMapping;
      if (!matchedProduct) {
        matchedProduct = mappedProduct;
        matchSource = 'supplier_mapping';
      }
      if (!suggestionsMap.has(mappedProduct.id)) {
        suggestionsMap.set(mappedProduct.id, {
          productId: mappedProduct.id,
          score: 100,
          reason: 'supplier_mapping',
        });
      }
    }
  }

  // 3) Correspondência exata por Código / SKU
  if (!matchedProduct && normCode) {
    const byCode = products.find(
      (p) =>
        normalizeText(p.code).replace(/\s+/g, '') === normCode ||
        normalizeText(p.sku).replace(/\s+/g, '') === normCode
    );
    if (byCode) {
      matchedProduct = byCode;
      matchSource = 'code_exact';
      suggestionsMap.set(byCode.id, {
        productId: byCode.id,
        score: 98,
        reason: 'code_exact',
      });
    }
  }

  // 4) Similaridade de Descrição / Nome (+ marca quando presente)
  const sourceLabel = [item.name, item.brand].filter(Boolean).join(' ');
  const similarityCandidates: ProductMatchSuggestion[] = [];

  for (const prod of products) {
    if (suggestionsMap.has(prod.id)) continue;
    const targetLabel = [prod.name, prod.brand, prod.model].filter(Boolean).join(' ');
    const score = Math.max(
      computeDescriptionSimilarity(item.name, prod.name),
      computeDescriptionSimilarity(sourceLabel, targetLabel)
    );
    if (score >= 35) {
      similarityCandidates.push({
        productId: prod.id,
        score,
        reason: 'similarity',
      });
    }
  }

  similarityCandidates.sort((a, b) => b.score - a.score);
  for (const cand of similarityCandidates.slice(0, 5)) {
    suggestionsMap.set(cand.productId, cand);
  }

  const suggestedMatches = Array.from(suggestionsMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    matchedProduct,
    matchSource,
    memorizedMapping,
    suggestedMatches,
  };
}

export interface PurchaseCharges {
  freightTotal: number;
  insuranceTotal: number;
  otherExpensesTotal: number;
  discountTotal: number;
}

export interface AllocationCalculationResult {
  items: ParsedXmlItem[];
  activeProductsTotal: number;
  activeEffectiveTotal: number;
  grandTotal: number;
}

/**
 * Recalcula rateio (frete, seguro, outras despesas, descontos), quantidade convertida
 * e custo unitário efetivo convertido (na unidade do estoque) para todos os itens.
 */
export function recalculateImportItems(
  items: ParsedXmlItem[],
  charges: PurchaseCharges,
  allocationMode: ImportAllocationMode
): AllocationCalculationResult {
  const freight = Math.max(0, Number(charges.freightTotal) || 0);
  const insurance = Math.max(0, Number(charges.insuranceTotal) || 0);
  const otherExpenses = Math.max(0, Number(charges.otherExpensesTotal) || 0);
  const discount = Math.max(0, Number(charges.discountTotal) || 0);

  const activeIndices: number[] = [];
  let sumActiveValue = 0;
  let sumActiveQty = 0;

  items.forEach((item, idx) => {
    const isActive = item.action !== 'ignore' && item.selectedToImport !== false;
    if (isActive) {
      activeIndices.push(idx);
      const lineTotal = Math.max(0, Number(item.totalCost) || 0);
      const lineQty = Math.max(0, Number(item.quantity) || 0);
      sumActiveValue += lineTotal;
      sumActiveQty += lineQty;
    }
  });

  // Calcula pesos de rateio
  const weights = new Map<number, number>();
  if (allocationMode !== 'financial_only' && activeIndices.length > 0) {
    activeIndices.forEach((idx) => {
      const item = items[idx];
      let w = 0;
      if (allocationMode === 'proportional_value') {
        w =
          sumActiveValue > 0
            ? Math.max(0, Number(item.totalCost) || 0) / sumActiveValue
            : 1 / activeIndices.length;
      } else if (allocationMode === 'proportional_qty') {
        w =
          sumActiveQty > 0
            ? Math.max(0, Number(item.quantity) || 0) / sumActiveQty
            : 1 / activeIndices.length;
      }
      weights.set(idx, w);
    });
  }

  // Distribui cada encargo ajustando o resíduo de arredondamento no último item ativo
  const distributeCharge = (totalAmount: number): Map<number, number> => {
    const result = new Map<number, number>();
    if (allocationMode === 'financial_only' || activeIndices.length === 0 || totalAmount === 0) {
      return result;
    }
    let allocatedSoFar = 0;
    activeIndices.forEach((idx, pos) => {
      if (pos === activeIndices.length - 1) {
        result.set(idx, round2(Math.max(0, totalAmount - allocatedSoFar)));
      } else {
        const part = round2(totalAmount * (weights.get(idx) || 0));
        allocatedSoFar = round2(allocatedSoFar + part);
        result.set(idx, part);
      }
    });
    return result;
  };

  const freightMap = distributeCharge(freight);
  const insuranceMap = distributeCharge(insurance);
  const otherMap = distributeCharge(otherExpenses);
  const discountMap = distributeCharge(discount);

  let activeEffectiveTotal = 0;

  const updatedItems = items.map((item, idx) => {
    const isActive = item.action !== 'ignore' && item.selectedToImport !== false;
    const rawQty = Math.max(0, Number(item.quantity) || 0);
    const factor = Number(item.conversionFactor) > 0 ? Number(item.conversionFactor) : 1;
    const convertedQuantity = round4(rawQty * factor);
    const grossTotal = Math.max(0, Number(item.totalCost) || 0);

    const allocFreight = isActive ? freightMap.get(idx) || 0 : 0;
    const allocInsurance = isActive ? insuranceMap.get(idx) || 0 : 0;
    const allocOther = isActive ? otherMap.get(idx) || 0 : 0;
    const allocDiscount = isActive ? discountMap.get(idx) || 0 : 0;

    const effectiveTotal = isActive
      ? Math.max(0, round2(grossTotal + allocFreight + allocInsurance + allocOther - allocDiscount))
      : 0;

    const effectiveUnitCost =
      isActive && convertedQuantity > 0
        ? round4(effectiveTotal / convertedQuantity)
        : rawQty > 0
        ? round4(grossTotal / (rawQty * factor))
        : Number(item.costPrice) || 0;

    if (isActive) {
      activeEffectiveTotal = round2(activeEffectiveTotal + effectiveTotal);
    }

    return {
      ...item,
      selectedToImport: isActive,
      allocatedFreight: allocFreight,
      allocatedInsurance: allocInsurance,
      allocatedOtherExpenses: allocOther,
      allocatedDiscount: allocDiscount,
      effectiveTotal,
      convertedQuantity,
      effectiveUnitCost,
    };
  });

  const activeProductsTotal = round2(sumActiveValue);
  const grandTotal = Math.max(
    0,
    round2(activeProductsTotal + freight + insurance + otherExpenses - discount)
  );

  return {
    items: updatedItems,
    activeProductsTotal,
    activeEffectiveTotal,
    grandTotal,
  };
}

/**
 * Calcula o novo preço de custo do produto existente na unidade do estoque,
 * respeitando a política escolhida pelo usuário.
 */
export function computeUpdatedProductCost(
  existingProduct: Product,
  convertedQty: number,
  effectiveUnitCost: number,
  costUpdateMode: ImportCostUpdateMode
): number {
  const currentCost = Math.max(0, Number(existingProduct.costPrice) || 0);
  const safeNewCost = Math.max(0, Number(effectiveUnitCost) || 0);

  if (costUpdateMode === 'keep_current') {
    return round2(currentCost);
  }

  if (costUpdateMode === 'effective_unit') {
    return round2(safeNewCost);
  }

  // weighted_average (Custo Médio Ponderado na unidade do estoque)
  const currentStock = Math.max(0, Number(existingProduct.currentStock) || 0);
  const incomingQty = Math.max(0, Number(convertedQty) || 0);
  const totalQty = currentStock + incomingQty;

  if (totalQty <= 0) return round2(safeNewCost || currentCost);
  if (currentStock <= 0) return round2(safeNewCost);
  if (incomingQty <= 0) return round2(currentCost);

  const weighted = (currentStock * currentCost + incomingQty * safeNewCost) / totalQty;
  return round2(weighted);
}

/**
 * Mapeia o código <tPag> da NF-e 4.00 para o PaymentMethod do FIRE GESTÃO.
 */
export function mapNFePaymentCodeToMethod(tPag?: string): PaymentMethod {
  const code = (tPag || '').trim();
  switch (code) {
    case '01':
      return 'dinheiro';
    case '03':
      return 'cartao_credito';
    case '04':
      return 'cartao_debito';
    case '15':
      return 'boleto';
    case '17':
    case '20':
      return 'pix';
    case '14':
    case '16':
    case '18':
    case '19':
    case '90':
    case '99':
    default:
      return 'boleto';
  }
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const base = isoDate && /^\d{4}-\d{2}-\d{2}$/.test(isoDate)
    ? new Date(`${isoDate}T12:00:00`)
    : new Date();
  if (Number.isNaN(base.getTime())) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + days);
    return fallback.toISOString().split('T')[0];
  }
  base.setDate(base.getDate() + days);
  return base.toISOString().split('T')[0];
}

export type QuickInstallmentPreset =
  | 'vista_hoje'
  | '7d'
  | '14d'
  | '28d'
  | '30d'
  | 'custom_x';

export function buildQuickInstallments(
  totalValue: number,
  baseDate: string,
  preset: QuickInstallmentPreset,
  customCount = 3,
  customIntervalDays = 30
): ImportFinancialInstallment[] {
  const safeTotal = Math.max(0, round2(totalValue));
  const todayIso = new Date().toISOString().split('T')[0];
  const refDate = baseDate && /^\d{4}-\d{2}-\d{2}$/.test(baseDate) ? baseDate : todayIso;

  if (preset === 'vista_hoje') {
    return [
      {
        id: `inst-${Date.now()}-1`,
        number: '001',
        dueDate: todayIso,
        amount: safeTotal,
      },
    ];
  }

  const singleDaysMap: Record<string, number> = {
    '7d': 7,
    '14d': 14,
    '28d': 28,
    '30d': 30,
  };

  if (preset in singleDaysMap) {
    return [
      {
        id: `inst-${Date.now()}-1`,
        number: '001',
        dueDate: addDaysToIsoDate(refDate, singleDaysMap[preset]),
        amount: safeTotal,
      },
    ];
  }

  const count = Math.min(36, Math.max(1, Math.floor(customCount) || 1));
  const interval = Math.min(180, Math.max(1, Math.floor(customIntervalDays) || 30));
  const baseShare = round2(safeTotal / count);
  const installments: ImportFinancialInstallment[] = [];
  let sumSoFar = 0;

  for (let i = 1; i <= count; i++) {
    const amount = i === count ? round2(Math.max(0, safeTotal - sumSoFar)) : baseShare;
    sumSoFar = round2(sumSoFar + amount);
    installments.push({
      id: `inst-${Date.now()}-${i}`,
      number: String(i).padStart(3, '0'),
      dueDate: addDaysToIsoDate(refDate, interval * i),
      amount,
    });
  }

  return installments;
}

export function getMatchSourceLabel(source?: ImportMatchSource): {
  label: string;
  tone: 'emerald' | 'blue' | 'violet' | 'amber' | 'slate';
} {
  switch (source) {
    case 'barcode':
      return { label: 'EAN / GTIN Exato', tone: 'emerald' };
    case 'supplier_mapping':
      return { label: 'Vínculo Memorizado', tone: 'blue' };
    case 'code_exact':
      return { label: 'Código / SKU Exato', tone: 'blue' };
    case 'similarity':
      return { label: 'Sugestão Similar', tone: 'amber' };
    case 'manual':
      return { label: 'Vinculado Manual', tone: 'violet' };
    default:
      return { label: 'Produto Novo', tone: 'slate' };
  }
}

export function formatQuantityClean(qty: number): string {
  if (!Number.isFinite(qty)) return '0';
  if (Math.abs(qty - Math.round(qty)) < 0.0001) {
    return String(Math.round(qty));
  }
  return qty.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}
