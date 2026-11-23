import React, { useMemo, useState } from 'react';
import {
  Search,
  Link2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  X,
  Package,
  Barcode,
  AlertCircle,
} from 'lucide-react';
import { Product, ProductMatchSuggestion } from '../../types';
import { formatBRL } from '../../context/AppContext';
import {
  formatQuantityClean,
  normalizeText,
} from '../../utils/stockImportHelpers';

interface StockImportProductPickerProps {
  products: Product[];
  selectedProductId?: string;
  suggestedMatches?: ProductMatchSuggestion[];
  supplierItem: {
    code?: string;
    barcode?: string;
    name: string;
    unit: string;
    quantity: number;
    totalCost: number;
    effectiveTotal?: number;
    conversionFactor: number;
    convertedQuantity?: number;
    effectiveUnitCost?: number;
  };
  onSelectProduct: (product: Product) => void;
  onClearProduct?: () => void;
  compact?: boolean;
}

export const StockImportProductPicker: React.FC<StockImportProductPickerProps> = ({
  products,
  selectedProductId,
  suggestedMatches = [],
  supplierItem,
  onSelectProduct,
  onClearProduct,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  const enrichedSuggestions = useMemo(() => {
    return suggestedMatches
      .map((s) => {
        const product = products.find((p) => p.id === s.productId);
        return product ? { ...s, product } : null;
      })
      .filter((x): x is ProductMatchSuggestion & { product: Product } => Boolean(x));
  }, [suggestedMatches, products]);

  const filteredProducts = useMemo(() => {
    const q = normalizeText(query);
    if (!q) {
      // Coloca sugestões no topo seguidas pelos primeiros produtos do catálogo
      const suggestedIds = new Set(enrichedSuggestions.map((s) => s.product.id));
      const others = products.filter((p) => !suggestedIds.has(p.id)).slice(0, 20);
      return [...enrichedSuggestions.map((s) => s.product), ...others];
    }
    const tokens = q.split(/\s+/).filter(Boolean);
    return products
      .filter((p) => {
        const haystack = normalizeText(
          `${p.name} ${p.code} ${p.sku || ''} ${p.barcode || ''} ${p.brand || ''} ${p.category || ''}`
        );
        return tokens.every((t) => haystack.includes(t));
      })
      .slice(0, 30);
  }, [products, query, enrichedSuggestions]);

  const reasonLabel = (reason: ProductMatchSuggestion['reason']) => {
    switch (reason) {
      case 'barcode':
        return 'EAN Exato';
      case 'supplier_mapping':
        return 'Memorizado';
      case 'code_exact':
        return 'Cód. Exato';
      case 'similarity':
        return 'Similar';
    }
  };

  return (
    <div className="space-y-2">
      {/* Botão / Barra do seletor rápido */}
      <div className="relative">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className={`flex-1 flex items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs rounded-lg border transition-colors cursor-pointer ${
              selectedProduct
                ? 'bg-blue-50/70 border-blue-300 text-slate-900 hover:bg-blue-50'
                : 'bg-amber-50/70 border-amber-300 text-amber-900 hover:bg-amber-50'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Link2 className="w-3.5 h-3.5 shrink-0 text-blue-600" />
              <span className="truncate font-semibold">
                {selectedProduct
                  ? `${selectedProduct.name} (${selectedProduct.code || 'S/C'})`
                  : 'Selecionar produto existente no estoque...'}
              </span>
            </div>
            <Search className="w-3.5 h-3.5 shrink-0 text-slate-500" />
          </button>

          {selectedProduct && onClearProduct && (
            <button
              type="button"
              onClick={onClearProduct}
              title="Desvincular produto"
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-red-600 hover:border-red-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown de busca rápida */}
        {isOpen && (
          <div className="mt-1.5 bg-white border border-slate-300 rounded-xl shadow-xl p-2.5 space-y-2 z-30 relative">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                placeholder="Buscar por nome, SKU, código, EAN/código de barras ou marca..."
                className="w-full pl-8 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-lg">
              {filteredProducts.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500">
                  Nenhum produto encontrado no catálogo para "{query}".
                </div>
              ) : (
                filteredProducts.map((prod) => {
                  const suggestion = enrichedSuggestions.find((s) => s.product.id === prod.id);
                  const isCurrent = prod.id === selectedProductId;
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => {
                        onSelectProduct(prod);
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className={`w-full px-2.5 py-2 text-left hover:bg-blue-50 transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                        isCurrent ? 'bg-blue-50/80' : 'bg-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {prod.name}
                          </span>
                          {suggestion && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {reasonLabel(suggestion.reason)} • {suggestion.score}%
                            </span>
                          )}
                          {isCurrent && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-500 mt-0.5">
                          <span className="font-mono">Cód: {prod.code || '—'}</span>
                          {prod.sku && <span className="font-mono">SKU: {prod.sku}</span>}
                          {prod.barcode && (
                            <span className="inline-flex items-center gap-0.5 font-mono">
                              <Barcode className="w-3 h-3" />
                              {prod.barcode}
                            </span>
                          )}
                          {prod.brand && <span>Marca: {prod.brand}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0 text-[10px]">
                        <div className="font-bold text-slate-800">
                          Saldo: {formatQuantityClean(prod.currentStock)} {prod.unit || 'UN'}
                        </div>
                        <div className="text-slate-500">
                          Custo: {formatBRL(prod.costPrice || 0)}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 cursor-pointer"
              >
                Fechar lista
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sugestões rápidas quando ainda não vinculado */}
      {!selectedProduct && enrichedSuggestions.length > 0 && (
        <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200 space-y-1.5">
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-900">
            <Sparkles className="w-3 h-3 text-amber-600" />
            Sugestões inteligentes encontradas no catálogo:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {enrichedSuggestions.slice(0, 3).map((s) => (
              <button
                key={s.product.id}
                type="button"
                onClick={() => onSelectProduct(s.product)}
                className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] bg-white hover:bg-blue-50 text-slate-800 border border-amber-300 hover:border-blue-400 rounded-md transition-colors cursor-pointer"
              >
                <span className="font-semibold truncate max-w-[200px]">{s.product.name}</span>
                <span className="text-[10px] font-bold text-emerald-700">
                  {s.score}%
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comparação Visual Lado a Lado: Item do Fornecedor ↔ Produto Existente */}
      {selectedProduct ? (
        <div
          className={`grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-stretch gap-2 rounded-xl border border-blue-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/50 ${
            compact ? 'p-2' : 'p-2.5'
          }`}
        >
          {/* Lado Esquerdo: Fornecedor */}
          <div className="bg-white rounded-lg border border-slate-200 p-2 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Item do Fornecedor (Entrada)
            </div>
            <div className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">
              {supplierItem.name}
            </div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-600 pt-0.5">
              <span>
                Entrada:{' '}
                <strong className="text-slate-900">
                  {formatQuantityClean(supplierItem.quantity)} {supplierItem.unit || 'UN'}
                </strong>
              </span>
              <span>
                Valor:{' '}
                <strong className="text-slate-900">
                  {formatBRL(supplierItem.effectiveTotal ?? supplierItem.totalCost)}
                </strong>
              </span>
            </div>
          </div>

          {/* Seta central */}
          <div className="hidden md:flex flex-col items-center justify-center px-1 text-blue-600">
            <ArrowRight className="w-4 h-4" />
            <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">De-Para</span>
          </div>

          {/* Lado Direito: Meu Estoque */}
          <div className="bg-blue-50/60 rounded-lg border border-blue-200 p-2 space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                <Package className="w-3 h-3" />
                Meu Estoque (Nome Preservado)
              </span>
              <span className="text-[10px] font-mono text-blue-700 font-semibold">
                {selectedProduct.code}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
              {selectedProduct.name}
            </div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-700 pt-0.5">
              <span>
                Unid.:{' '}
                <strong className="text-blue-800">{selectedProduct.unit || 'UN'}</strong>
              </span>
              <span>
                Saldo atual:{' '}
                <strong className="text-slate-900">
                  {formatQuantityClean(selectedProduct.currentStock)} {selectedProduct.unit || 'UN'}
                </strong>
              </span>
              <span>
                Custo atual:{' '}
                <strong className="text-slate-900">
                  {formatBRL(selectedProduct.costPrice || 0)}
                </strong>
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          Selecione um produto do seu catálogo para ativar o vínculo De-Para (ou mude a ação para Cadastrar Novo).
        </div>
      )}
    </div>
  );
};
