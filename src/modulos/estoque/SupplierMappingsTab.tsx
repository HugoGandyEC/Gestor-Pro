import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  Edit3,
  Filter,
  Link2,
  Package,
  Plus,
  Scale,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useApp, formatBRL } from '../../context/AppContext';
import { SupplierProductMapping } from '../../types';
import { formatQuantityClean, normalizeText } from '../../utils/stockImportHelpers';

const COMMON_UNITS = ['UN', 'CX', 'FD', 'PCT', 'PC', 'KIT', 'RL', 'M', 'KG', 'L', 'SC', 'GL', 'PAR', 'JG'];

export const SupplierMappingsTab: React.FC = () => {
  const {
    products,
    suppliers,
    supplierProductMappings,
    addSupplierProductMapping,
    updateSupplierProductMapping,
    deleteSupplierProductMapping,
  } = useApp();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplierKey, setSelectedSupplierKey] = useState<string>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [onlyWithConversion, setOnlyWithConversion] = useState(false);

  // Modal Create / Edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<SupplierProductMapping | null>(null);
  const [useCustomSupplier, setUseCustomSupplier] = useState(false);
  const [formSupplierId, setFormSupplierId] = useState('');
  const [formSupplierName, setFormSupplierName] = useState('');
  const [formSupplierCnpj, setFormSupplierCnpj] = useState('');
  const [formItemCode, setFormItemCode] = useState('');
  const [formItemDesc, setFormItemDesc] = useState('');
  const [formSupplierUnit, setFormSupplierUnit] = useState('CX');
  const [formProductId, setFormProductId] = useState('');
  const [formProductSearch, setFormProductSearch] = useState('');
  const [formConversionFactor, setFormConversionFactor] = useState('1');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation modal
  const [mappingToDelete, setMappingToDelete] = useState<SupplierProductMapping | null>(null);

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  const productsMap = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p]));
    return map;
  }, [products]);

  const supplierOptions = useMemo(() => {
    const map = new Map<string, { key: string; label: string }>();
    supplierProductMappings.forEach((m) => {
      if (!map.has(m.supplierKey)) {
        map.set(m.supplierKey, {
          key: m.supplierKey,
          label: `${m.supplierName}${m.supplierCnpj ? ` (${m.supplierCnpj})` : ''}`,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [supplierProductMappings]);

  const filteredMappings = useMemo(() => {
    const q = normalizeText(searchTerm);
    return supplierProductMappings
      .filter((m) => {
        if (selectedSupplierKey !== 'all' && m.supplierKey !== selectedSupplierKey) return false;
        if (selectedProductId !== 'all' && m.productId !== selectedProductId) return false;
        if (onlyWithConversion && Math.abs((m.conversionFactor || 1) - 1) < 0.0001) return false;

        if (q) {
          const prod = productsMap.get(m.productId);
          const haystack = normalizeText(
            [
              m.supplierName,
              m.supplierCnpj,
              m.supplierItemCode,
              m.supplierItemDescription,
              m.supplierUnit,
              prod?.name,
              prod?.code,
              prod?.sku,
              prod?.barcode,
              prod?.brand,
            ]
              .filter(Boolean)
              .join(' ')
          );
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }, [
    supplierProductMappings,
    selectedSupplierKey,
    selectedProductId,
    onlyWithConversion,
    searchTerm,
    productsMap,
  ]);

  // Stats
  const stats = useMemo(() => {
    const uniqueSuppliers = new Set(supplierProductMappings.map((m) => m.supplierKey)).size;
    const uniqueProducts = new Set(supplierProductMappings.map((m) => m.productId)).size;
    const withConversion = supplierProductMappings.filter(
      (m) => Math.abs((m.conversionFactor || 1) - 1) >= 0.0001
    ).length;
    return {
      total: supplierProductMappings.length,
      uniqueSuppliers,
      uniqueProducts,
      withConversion,
    };
  }, [supplierProductMappings]);

  const filteredProductsForPicker = useMemo(() => {
    const q = normalizeText(formProductSearch);
    if (!q) return products.slice(0, 60);
    return products
      .filter((p) =>
        normalizeText([p.name, p.code, p.sku, p.barcode, p.brand, p.category].filter(Boolean).join(' ')).includes(q)
      )
      .slice(0, 60);
  }, [products, formProductSearch]);

  const selectedFormProduct = useMemo(
    () => products.find((p) => p.id === formProductId),
    [products, formProductId]
  );

  const openCreateModal = () => {
    setEditingMapping(null);
    setUseCustomSupplier(suppliers.length === 0);
    setFormSupplierId(suppliers[0]?.id || '');
    setFormSupplierName('');
    setFormSupplierCnpj('');
    setFormItemCode('');
    setFormItemDesc('');
    setFormSupplierUnit('CX');
    setFormProductId(products[0]?.id || '');
    setFormProductSearch('');
    setFormConversionFactor('1');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (mapping: SupplierProductMapping) => {
    setEditingMapping(mapping);
    const matchedSup = suppliers.find(
      (s) =>
        (mapping.supplierId && s.id === mapping.supplierId) ||
        (mapping.supplierCnpj &&
          s.cnpj.replace(/\D/g, '') &&
          s.cnpj.replace(/\D/g, '') === mapping.supplierCnpj.replace(/\D/g, ''))
    );
    if (matchedSup) {
      setUseCustomSupplier(false);
      setFormSupplierId(matchedSup.id);
      setFormSupplierName(matchedSup.name);
      setFormSupplierCnpj(matchedSup.cnpj);
    } else {
      setUseCustomSupplier(true);
      setFormSupplierId('');
      setFormSupplierName(mapping.supplierName);
      setFormSupplierCnpj(mapping.supplierCnpj || '');
    }
    setFormItemCode(mapping.supplierItemCode || '');
    setFormItemDesc(mapping.supplierItemDescription || '');
    setFormSupplierUnit(mapping.supplierUnit || 'UN');
    setFormProductId(mapping.productId);
    setFormProductSearch('');
    setFormConversionFactor(String(mapping.conversionFactor || 1));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const chosenSup = !useCustomSupplier ? suppliers.find((s) => s.id === formSupplierId) : undefined;
    const supplierName = chosenSup ? chosenSup.name : formSupplierName.trim();
    const supplierCnpj = chosenSup ? chosenSup.cnpj : formSupplierCnpj.trim();

    if (!supplierName) {
      setFormError('Selecione um fornecedor cadastrado ou informe o nome do fornecedor.');
      return;
    }
    if (!formItemCode.trim() && !formItemDesc.trim()) {
      setFormError('Informe ao menos o código ou a descrição do item no fornecedor.');
      return;
    }
    const targetProduct = products.find((p) => p.id === formProductId);
    if (!targetProduct) {
      setFormError('Selecione um produto do catálogo de estoque para vincular.');
      return;
    }
    const parsedFactor = parseFloat(formConversionFactor.replace(',', '.'));
    if (!Number.isFinite(parsedFactor) || parsedFactor <= 0) {
      setFormError('O fator de conversão deve ser um número maior que zero (ex: 1, 10, 12, 0.5).');
      return;
    }

    const cleanSupplierUnit = (formSupplierUnit || 'UN').trim().toUpperCase();

    if (editingMapping) {
      updateSupplierProductMapping(editingMapping.id, {
        supplierId: chosenSup?.id,
        supplierName,
        supplierCnpj: supplierCnpj || undefined,
        supplierItemCode: formItemCode.trim(),
        supplierItemDescription: formItemDesc.trim() || targetProduct.name,
        productId: targetProduct.id,
        conversionFactor: parsedFactor,
        supplierUnit: cleanSupplierUnit,
        stockUnit: targetProduct.unit || 'UN',
      });
      setFeedback({
        type: 'success',
        message: `Vínculo De-Para atualizado: 1 ${cleanSupplierUnit} → ${formatQuantityClean(parsedFactor)} ${targetProduct.unit} (${targetProduct.name}).`,
      });
    } else {
      addSupplierProductMapping({
        supplierId: chosenSup?.id,
        supplierName,
        supplierCnpj: supplierCnpj || undefined,
        supplierItemCode: formItemCode.trim(),
        supplierItemDescription: formItemDesc.trim() || targetProduct.name,
        productId: targetProduct.id,
        conversionFactor: parsedFactor,
        supplierUnit: cleanSupplierUnit,
        stockUnit: targetProduct.unit || 'UN',
      });
      setFeedback({
        type: 'success',
        message: `Vínculo De-Para salvo com sucesso para ${supplierName} → ${targetProduct.name}.`,
      });
    }

    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (!mappingToDelete) return;
    deleteSupplierProductMapping(mappingToDelete.id);
    setFeedback({
      type: 'info',
      message: `Vínculo De-Para de "${mappingToDelete.supplierItemDescription || mappingToDelete.supplierItemCode}" removido.`,
    });
    setMappingToDelete(null);
  };

  const formatDateTime = (iso?: string) => {
    if (!iso) return '—';
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return iso;
    return dt.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-0.5 rounded hover:bg-black/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & KPI Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-blue-600" />
              Vínculos de Fornecedores (De-Para & Conversão de Unidades)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gerencie os vínculos memorizados entre códigos/descrições dos fornecedores e os produtos do seu catálogo. Toda edição reflete imediatamente no motor de importação.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Vínculo Manual</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5 text-blue-600" />
              Vínculos Salvos
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{stats.total}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              Fornecedores Vinculados
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{stats.uniqueSuppliers}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-emerald-600" />
              Produtos no De-Para
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{stats.uniqueProducts}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-amber-600" />
              Com Fator de Conversão (≠ 1)
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{stats.withConversion}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por fornecedor, código, descrição, produto, SKU ou EAN..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#53383e] focus:bg-white"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div>
            <select
              value={selectedSupplierKey}
              onChange={(e) => setSelectedSupplierKey(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#53383e]"
            >
              <option value="all">Todos os fornecedores</option>
              {supplierOptions.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#53383e]"
            >
              <option value="all">Todos os produtos</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <label className="inline-flex items-center gap-2 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyWithConversion}
              onChange={(e) => setOnlyWithConversion(e.target.checked)}
              className="rounded border-slate-300 text-[#53383e]"
            />
            <span>Mostrar apenas vínculos com fator de conversão diferente de 1 (ex.: CX → UN)</span>
          </label>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>
              Exibindo <strong>{filteredMappings.length}</strong> de {supplierProductMappings.length} vínculos
            </span>
            {(searchTerm || selectedSupplierKey !== 'all' || selectedProductId !== 'all' || onlyWithConversion) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSupplierKey('all');
                  setSelectedProductId('all');
                  setOnlyWithConversion(false);
                }}
                className="text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {filteredMappings.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Link2 className="w-9 h-9 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              {supplierProductMappings.length === 0
                ? 'Nenhum vínculo De-Para memorizado ainda'
                : 'Nenhum vínculo encontrado para os filtros aplicados'}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Os vínculos são salvos automaticamente ao importar NF-e XML ou planilhas no modo De-Para, ou podem ser cadastrados manualmente pelo botão "Novo Vínculo Manual".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3.5 font-bold">Fornecedor</th>
                  <th className="py-2.5 px-3.5 font-bold">Item no Fornecedor</th>
                  <th className="py-2.5 px-3.5 font-bold">Conversão de Unidade</th>
                  <th className="py-2.5 px-3.5 font-bold">Produto Vinculado (Estoque)</th>
                  <th className="py-2.5 px-3.5 font-bold">Atualizado</th>
                  <th className="py-2.5 px-3.5 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMappings.map((m) => {
                  const prod = productsMap.get(m.productId);
                  const hasFactor = Math.abs((m.conversionFactor || 1) - 1) >= 0.0001;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3.5 align-top">
                        <div className="font-bold text-slate-800">{m.supplierName}</div>
                        {m.supplierCnpj && (
                          <div className="text-[10px] font-mono text-slate-500">{m.supplierCnpj}</div>
                        )}
                      </td>

                      <td className="py-2.5 px-3.5 align-top max-w-[260px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {m.supplierItemCode && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {m.supplierItemCode}
                            </span>
                          )}
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            {m.supplierUnit || 'UN'}
                          </span>
                        </div>
                        <div className="text-slate-700 mt-1 line-clamp-2" title={m.supplierItemDescription}>
                          {m.supplierItemDescription || '—'}
                        </div>
                      </td>

                      <td className="py-2.5 px-3.5 align-top">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[11px] font-bold ${
                            hasFactor
                              ? 'bg-blue-50 border-blue-200 text-blue-800'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span>1 {m.supplierUnit || 'UN'}</span>
                          <ArrowRight className="w-3 h-3 opacity-60" />
                          <span>
                            {formatQuantityClean(m.conversionFactor)} {prod?.unit || m.stockUnit || 'UN'}
                          </span>
                        </span>
                      </td>

                      <td className="py-2.5 px-3.5 align-top max-w-[260px]">
                        {prod ? (
                          <div>
                            <div className="font-bold text-slate-900 line-clamp-1">{prod.name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap font-mono">
                              <span>Cód: {prod.code}</span>
                              {prod.sku && <span>SKU: {prod.sku}</span>}
                              <span>
                                Saldo: {formatQuantityClean(prod.currentStock)} {prod.unit}
                              </span>
                              <span>Custo: {formatBRL(prod.costPrice)}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            Produto removido do catálogo
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3.5 align-top text-[11px] text-slate-500 whitespace-nowrap">
                        {formatDateTime(m.updatedAt)}
                      </td>

                      <td className="py-2.5 px-3.5 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(m)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md cursor-pointer"
                            title="Editar vínculo"
                          >
                            <Edit3 className="w-3 h-3" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setMappingToDelete(m)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md cursor-pointer"
                            title="Excluir vínculo"
                          >
                            <Trash2 className="w-3 h-3" />
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-blue-600" />
                  {editingMapping ? 'Editar Vínculo De-Para' : 'Novo Vínculo Manual (Fornecedor → Estoque)'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Configure o produto padrão, unidade do fornecedor e fator de conversão para próximas importações.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Fornecedor */}
              <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase text-slate-600">
                    1. Fornecedor & Item na Nota
                  </span>
                  {suppliers.length > 0 && (
                    <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCustomSupplier}
                        onChange={(e) => setUseCustomSupplier(e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      Informar fornecedor avulso
                    </label>
                  )}
                </div>

                {!useCustomSupplier && suppliers.length > 0 ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Fornecedor Cadastrado *
                    </label>
                    <select
                      value={formSupplierId}
                      onChange={(e) => setFormSupplierId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="">Selecione um fornecedor...</option>
                      {suppliers.map((sup) => (
                        <option key={sup.id} value={sup.id}>
                          {sup.name} {sup.cnpj ? `— CNPJ: ${sup.cnpj}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Nome / Razão Social do Fornecedor *
                      </label>
                      <input
                        type="text"
                        value={formSupplierName}
                        onChange={(e) => setFormSupplierName(e.target.value)}
                        placeholder="Ex: Distribuidora Solar Brasil"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        CNPJ (opcional, melhora a precisão)
                      </label>
                      <input
                        type="text"
                        value={formSupplierCnpj}
                        onChange={(e) => setFormSupplierCnpj(e.target.value)}
                        placeholder="00.000.000/0001-00"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Código do Item no Fornecedor
                    </label>
                    <input
                      type="text"
                      value={formItemCode}
                      onChange={(e) => setFormItemCode(e.target.value)}
                      placeholder="Ex: 789123 ou REF-40"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Descrição do Item no Fornecedor
                    </label>
                    <input
                      type="text"
                      value={formItemDesc}
                      onChange={(e) => setFormItemDesc(e.target.value)}
                      placeholder="Ex: CX C/ 10 TUBO COBRE 15MM"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Produto Vinculado */}
              <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold uppercase text-slate-600 block">
                  2. Produto Padrão no Estoque
                </span>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formProductSearch}
                    onChange={(e) => setFormProductSearch(e.target.value)}
                    placeholder="Filtrar produto por nome, código, SKU, EAN ou marca..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <select
                  value={formProductId}
                  onChange={(e) => setFormProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">Selecione um produto do catálogo...</option>
                  {filteredProductsForPicker.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name} ({p.unit}) — Saldo: {formatQuantityClean(p.currentStock)}
                    </option>
                  ))}
                </select>

                {selectedFormProduct && (
                  <div className="bg-white border border-blue-200 rounded-lg p-2.5 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-bold text-slate-900">{selectedFormProduct.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Cód: {selectedFormProduct.code}
                        {selectedFormProduct.sku ? ` · SKU: ${selectedFormProduct.sku}` : ''}
                        {selectedFormProduct.barcode ? ` · EAN: ${selectedFormProduct.barcode}` : ''}
                      </div>
                    </div>
                    <div className="text-right font-mono text-[11px]">
                      <div className="font-bold text-slate-800">
                        Unidade Estoque: {selectedFormProduct.unit || 'UN'}
                      </div>
                      <div className="text-slate-500">
                        Saldo: {formatQuantityClean(selectedFormProduct.currentStock)} · Custo:{' '}
                        {formatBRL(selectedFormProduct.costPrice)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Conversão */}
              <div className="space-y-2.5 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                <span className="text-[11px] font-bold uppercase text-blue-800 block">
                  3. Fator de Conversão de Unidades
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Unidade na Nota do Fornecedor
                    </label>
                    <input
                      type="text"
                      list="mapping-tab-units"
                      value={formSupplierUnit}
                      onChange={(e) => setFormSupplierUnit(e.target.value.toUpperCase())}
                      placeholder="CX, FD, PCT, UN..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs uppercase font-mono"
                    />
                    <datalist id="mapping-tab-units">
                      {COMMON_UNITS.map((u) => (
                        <option key={u} value={u} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Fator (Qtd em {selectedFormProduct?.unit || 'UN'} por 1 {formSupplierUnit || 'UN'})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.0001"
                      value={formConversionFactor}
                      onChange={(e) => setFormConversionFactor(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-blue-900 bg-white/90 border border-blue-200 rounded-lg px-3 py-2 flex items-center justify-between flex-wrap gap-2">
                  <span>Regra aplicada na entrada de estoque:</span>
                  <strong className="font-mono">
                    1 {formSupplierUnit || 'UN'} do fornecedor ={' '}
                    {formatQuantityClean(parseFloat(formConversionFactor.replace(',', '.')) || 1)}{' '}
                    {selectedFormProduct?.unit || 'UN'} no estoque
                  </strong>
                </div>
              </div>

              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {editingMapping ? 'Salvar Alterações' : 'Criar Vínculo De-Para'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {mappingToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMappingToDelete(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Excluir Vínculo De-Para?</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Esta ação remove a memorização automática deste item para futuras importações. Produtos e entradas já realizadas no estoque não serão afetados.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div>
                  <span className="text-slate-500">Fornecedor:</span>{' '}
                  <strong className="text-slate-800">{mappingToDelete.supplierName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Item:</span>{' '}
                  <strong className="text-slate-800">
                    {mappingToDelete.supplierItemCode ? `[${mappingToDelete.supplierItemCode}] ` : ''}
                    {mappingToDelete.supplierItemDescription}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Conversão:</span>{' '}
                  <strong className="font-mono text-blue-700">
                    1 {mappingToDelete.supplierUnit} → {formatQuantityClean(mappingToDelete.conversionFactor)}{' '}
                    {mappingToDelete.stockUnit}
                  </strong>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setMappingToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
