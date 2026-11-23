import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Edit3,
  Link2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, SupplierProductMapping } from '../../types';
import { formatQuantityClean } from '../../utils/stockImportHelpers';

interface ProductSupplierMappingsBoxProps {
  product: Product;
  readOnly?: boolean;
}

const COMMON_UNITS = ['UN', 'CX', 'FD', 'PCT', 'PC', 'KIT', 'RL', 'M', 'KG', 'L', 'SC', 'GL', 'PAR', 'JG'];

export const ProductSupplierMappingsBox: React.FC<ProductSupplierMappingsBoxProps> = ({
  product,
  readOnly = false,
}) => {
  const {
    suppliers,
    supplierProductMappings,
    addSupplierProductMapping,
    updateSupplierProductMapping,
    deleteSupplierProductMapping,
  } = useApp();

  const productMappings = useMemo(
    () =>
      supplierProductMappings
        .filter((m) => m.productId === product.id)
        .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')),
    [supplierProductMappings, product.id]
  );

  // Inline edit state
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null);
  const [editFactor, setEditFactor] = useState<string>('1');
  const [editSupplierUnit, setEditSupplierUnit] = useState<string>('UN');
  const [editSupplierItemCode, setEditSupplierItemCode] = useState<string>('');
  const [editSupplierItemDesc, setEditSupplierItemDesc] = useState<string>('');

  // Inline delete confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Inline add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [customSupplierName, setCustomSupplierName] = useState<string>('');
  const [customSupplierCnpj, setCustomSupplierCnpj] = useState<string>('');
  const [newItemCode, setNewItemCode] = useState<string>('');
  const [newItemDesc, setNewItemDesc] = useState<string>('');
  const [newSupplierUnit, setNewSupplierUnit] = useState<string>('CX');
  const [newFactor, setNewFactor] = useState<string>('1');
  const [formError, setFormError] = useState<string | null>(null);

  const startEdit = (m: SupplierProductMapping) => {
    setEditingMappingId(m.id);
    setEditFactor(String(m.conversionFactor || 1));
    setEditSupplierUnit(m.supplierUnit || 'UN');
    setEditSupplierItemCode(m.supplierItemCode || '');
    setEditSupplierItemDesc(m.supplierItemDescription || '');
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = (id: string) => {
    const parsedFactor = parseFloat(editFactor.replace(',', '.'));
    if (!Number.isFinite(parsedFactor) || parsedFactor <= 0) return;
    updateSupplierProductMapping(id, {
      conversionFactor: parsedFactor,
      supplierUnit: (editSupplierUnit || 'UN').trim().toUpperCase(),
      supplierItemCode: editSupplierItemCode.trim(),
      supplierItemDescription: editSupplierItemDesc.trim() || product.name,
      stockUnit: product.unit || 'UN',
    });
    setEditingMappingId(null);
  };

  const handleAddMapping = () => {
    setFormError(null);
    const chosenSupplier = suppliers.find((s) => s.id === selectedSupplierId);
    const supplierName = chosenSupplier ? chosenSupplier.name : customSupplierName.trim();
    const supplierCnpj = chosenSupplier ? chosenSupplier.cnpj : customSupplierCnpj.trim();

    if (!supplierName) {
      setFormError('Selecione um fornecedor ou informe o nome do fornecedor.');
      return;
    }
    if (!newItemCode.trim() && !newItemDesc.trim()) {
      setFormError('Informe o código ou a descrição do item no fornecedor.');
      return;
    }
    const parsedFactor = parseFloat(newFactor.replace(',', '.'));
    if (!Number.isFinite(parsedFactor) || parsedFactor <= 0) {
      setFormError('Informe um fator de conversão numérico maior que zero.');
      return;
    }

    addSupplierProductMapping({
      supplierId: chosenSupplier?.id,
      supplierCnpj: supplierCnpj || undefined,
      supplierName,
      supplierItemCode: newItemCode.trim(),
      supplierItemDescription: newItemDesc.trim() || product.name,
      productId: product.id,
      conversionFactor: parsedFactor,
      supplierUnit: (newSupplierUnit || 'UN').trim().toUpperCase(),
      stockUnit: product.unit || 'UN',
    });

    setSelectedSupplierId('');
    setCustomSupplierName('');
    setCustomSupplierCnpj('');
    setNewItemCode('');
    setNewItemDesc('');
    setNewSupplierUnit('CX');
    setNewFactor('1');
    setShowAddForm(false);
  };

  return (
    <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/80 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-blue-600" />
            Vínculos de Fornecedores (De-Para)
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono">
              {productMappings.length}
            </span>
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Fatores de conversão e códigos memorizados para reconhecimento automático na importação de NF-e e planilhas.
          </p>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={() => {
              setShowAddForm((prev) => !prev);
              setFormError(null);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{showAddForm ? 'Fechar' : 'Novo Vínculo'}</span>
          </button>
        )}
      </div>

      {/* Inline Add Form */}
      {!readOnly && showAddForm && (
        <div className="bg-white border border-blue-200 rounded-lg p-3 space-y-2.5">
          <div className="text-[11px] font-bold text-blue-800">
            Cadastrar Vínculo De-Para para {product.name} ({product.unit})
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                Fornecedor Cadastrado
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="">-- Digitar fornecedor avulso --</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} {sup.cnpj ? `(${sup.cnpj})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {!selectedSupplierId && (
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  Nome do Fornecedor *
                </label>
                <input
                  type="text"
                  value={customSupplierName}
                  onChange={(e) => setCustomSupplierName(e.target.value)}
                  placeholder="Ex: Distribuidora Solar LTDA"
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
            )}

            {!selectedSupplierId && (
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  CNPJ do Fornecedor (opcional)
                </label>
                <input
                  type="text"
                  value={customSupplierCnpj}
                  onChange={(e) => setCustomSupplierCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                Código do Item no Fornecedor
              </label>
              <input
                type="text"
                value={newItemCode}
                onChange={(e) => setNewItemCode(e.target.value)}
                placeholder="Ex: FORN-1020"
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                Descrição na Nota do Fornecedor
              </label>
              <input
                type="text"
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                placeholder="Ex: CX C/ 12 RESISTENCIA 220V"
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  Unid. Fornecedor
                </label>
                <input
                  type="text"
                  list="product-mapping-units"
                  value={newSupplierUnit}
                  onChange={(e) => setNewSupplierUnit(e.target.value.toUpperCase())}
                  placeholder="CX"
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg uppercase font-mono"
                />
                <datalist id="product-mapping-units">
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  Fator ({product.unit || 'UN'} por un.)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.0001"
                  value={newFactor}
                  onChange={(e) => setNewFactor(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <span className="text-[11px] text-slate-600">
              Conversão:{' '}
              <strong className="text-blue-700 font-mono">
                1 {newSupplierUnit || 'UN'} = {formatQuantityClean(parseFloat(newFactor.replace(',', '.')) || 1)}{' '}
                {product.unit || 'UN'}
              </strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddMapping}
                className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Salvar Vínculo
              </button>
            </div>
          </div>

          {formError && (
            <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-2.5 py-1.5">
              {formError}
            </div>
          )}
        </div>
      )}

      {/* Existing Mappings List */}
      {productMappings.length === 0 ? (
        <div className="text-[11px] text-slate-500 bg-white border border-dashed border-slate-200 rounded-lg px-3 py-2.5 text-center">
          Nenhum vínculo de fornecedor (De-Para) cadastrado para este produto ainda.
        </div>
      ) : (
        <div className="space-y-2">
          {productMappings.map((m) => {
            const isEditing = editingMappingId === m.id;
            const isConfirmingDelete = confirmDeleteId === m.id;

            return (
              <div
                key={m.id}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex flex-col gap-2"
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-800">
                      {m.supplierName}{' '}
                      {m.supplierCnpj && (
                        <span className="font-mono font-normal text-slate-500">({m.supplierCnpj})</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500">Cód. Fornecedor</label>
                        <input
                          type="text"
                          value={editSupplierItemCode}
                          onChange={(e) => setEditSupplierItemCode(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500">Descrição Fornecedor</label>
                        <input
                          type="text"
                          value={editSupplierItemDesc}
                          onChange={(e) => setEditSupplierItemDesc(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500">Unid. Fornecedor</label>
                        <input
                          type="text"
                          value={editSupplierUnit}
                          onChange={(e) => setEditSupplierUnit(e.target.value.toUpperCase())}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded uppercase font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500">
                          Fator ({product.unit})
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0.0001"
                          value={editFactor}
                          onChange={(e) => setEditFactor(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingMappingId(null)}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(m.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        Aplicar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800">{m.supplierName}</span>
                        {m.supplierCnpj && (
                          <span className="text-[10px] font-mono text-slate-500">{m.supplierCnpj}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        {m.supplierItemCode && (
                          <span className="font-mono px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">
                            Cód: {m.supplierItemCode}
                          </span>
                        )}
                        <span className="truncate">{m.supplierItemDescription}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 border border-blue-200 text-[11px] font-mono font-bold text-blue-800">
                        1 {m.supplierUnit || 'UN'}
                        <ArrowRight className="w-3 h-3 text-blue-500" />
                        {formatQuantityClean(m.conversionFactor)} {product.unit || m.stockUnit || 'UN'}
                      </span>

                      {!readOnly && !isConfirmingDelete && (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(m)}
                            className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Editar fator ou unidade"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(m.id)}
                            className="p-1 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Excluir vínculo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {!readOnly && isConfirmingDelete && (
                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-md px-2 py-0.5">
                          <span className="text-[10px] font-semibold text-rose-700">Excluir?</span>
                          <button
                            type="button"
                            onClick={() => {
                              deleteSupplierProductMapping(m.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded cursor-pointer"
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-white rounded cursor-pointer"
                          >
                            Não
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
