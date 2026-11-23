import React, { useMemo, useState } from 'react';
import {
  Wallet,
  Ban,
  PlusCircle,
  Link2,
  Calendar,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Receipt,
} from 'lucide-react';
import {
  ExpenseCategory,
  GeneralExpense,
  ImportFinancialInstallment,
  ImportFinancialMode,
  PaymentMethod,
} from '../../types';
import { formatBRL } from '../../context/AppContext';
import {
  buildQuickInstallments,
  normalizeText,
  QuickInstallmentPreset,
  round2,
} from '../../utils/stockImportHelpers';

interface StockImportFinancialPanelProps {
  financialMode: ImportFinancialMode;
  onChangeFinancialMode: (mode: ImportFinancialMode) => void;
  totalPurchaseValue: number;
  emissionDate: string;
  onChangeEmissionDate?: (date: string) => void;
  supplierName: string;
  onChangeSupplierName?: (name: string) => void;
  expenseCategory: ExpenseCategory;
  onChangeExpenseCategory: (cat: ExpenseCategory) => void;
  paymentMethod: PaymentMethod;
  onChangePaymentMethod: (method: PaymentMethod) => void;
  initialPaymentStatus: 'pendente' | 'pago';
  onChangeInitialPaymentStatus: (status: 'pendente' | 'pago') => void;
  installments: ImportFinancialInstallment[];
  onChangeInstallments: (installments: ImportFinancialInstallment[]) => void;
  xmlHasDuplicates?: boolean;
  existingExpenses: GeneralExpense[];
  linkedExpenseId?: string;
  onSelectLinkedExpenseId: (expenseId: string | undefined) => void;
}

const EXPENSE_CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: 'compra_produtos_xml', label: 'Compra de Mercadorias / NF-e' },
  { value: 'compra_materiais', label: 'Compra de Materiais / Insumos' },
  { value: 'ferramental', label: 'Ferramental / Equipamentos' },
  { value: 'outros', label: 'Outras Despesas Operacionais' },
];

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'boleto', label: 'Boleto / Duplicata' },
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'faturado_30d', label: 'Faturado / A Prazo' },
];

export const StockImportFinancialPanel: React.FC<StockImportFinancialPanelProps> = ({
  financialMode,
  onChangeFinancialMode,
  totalPurchaseValue,
  emissionDate,
  onChangeEmissionDate,
  supplierName,
  onChangeSupplierName,
  expenseCategory,
  onChangeExpenseCategory,
  paymentMethod,
  onChangePaymentMethod,
  initialPaymentStatus,
  onChangeInitialPaymentStatus,
  installments,
  onChangeInstallments,
  xmlHasDuplicates = false,
  existingExpenses,
  linkedExpenseId,
  onSelectLinkedExpenseId,
}) => {
  const [customCount, setCustomCount] = useState<number>(3);
  const [customIntervalDays, setCustomIntervalDays] = useState<number>(30);
  const [expenseSearch, setExpenseSearch] = useState<string>('');

  const installmentsSum = useMemo(
    () => round2(installments.reduce((acc, inst) => acc + (Number(inst.amount) || 0), 0)),
    [installments]
  );

  const differenceFromTotal = useMemo(
    () => round2(installmentsSum - totalPurchaseValue),
    [installmentsSum, totalPurchaseValue]
  );

  const filteredExpenses = useMemo(() => {
    const q = normalizeText(expenseSearch);
    const list = [...existingExpenses].sort((a, b) =>
      (b.dueDate || '').localeCompare(a.dueDate || '')
    );
    if (!q) return list.slice(0, 25);
    const tokens = q.split(/\s+/).filter(Boolean);
    return list
      .filter((exp) => {
        const hay = normalizeText(
          `${exp.description} ${exp.supplier} ${exp.invoiceNumber || ''} ${exp.dueDate} ${exp.cost}`
        );
        return tokens.every((t) => hay.includes(t));
      })
      .slice(0, 30);
  }, [existingExpenses, expenseSearch]);

  const selectedExpense = useMemo(
    () => existingExpenses.find((e) => e.id === linkedExpenseId),
    [existingExpenses, linkedExpenseId]
  );

  const applyPreset = (preset: QuickInstallmentPreset) => {
    const next = buildQuickInstallments(
      totalPurchaseValue,
      emissionDate,
      preset,
      customCount,
      customIntervalDays
    );
    onChangeInstallments(next);
  };

  const handleUpdateInstallment = (
    id: string,
    patch: Partial<ImportFinancialInstallment>
  ) => {
    onChangeInstallments(
      installments.map((inst) => (inst.id === id ? { ...inst, ...patch } : inst))
    );
  };

  const handleAddInstallment = () => {
    const remaining = Math.max(0, round2(totalPurchaseValue - installmentsSum));
    const nextIdx = installments.length + 1;
    const lastDate = installments[installments.length - 1]?.dueDate || emissionDate;
    onChangeInstallments([
      ...installments,
      {
        id: `inst-${Date.now()}-${nextIdx}`,
        number: String(nextIdx).padStart(3, '0'),
        dueDate: lastDate,
        amount: remaining,
      },
    ]);
  };

  const handleRemoveInstallment = (id: string) => {
    if (installments.length <= 1) return;
    onChangeInstallments(installments.filter((i) => i.id !== id));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Integração Financeira (Controle Seletivo)
            </h3>
            <p className="text-[11px] text-slate-500">
              Por padrão, a importação entra apenas no Estoque/Catálogo sem alterar o Financeiro ou DRE.
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
            Valor Total da Compra
          </span>
          <span className="text-sm font-black text-slate-900">
            {formatBRL(totalPurchaseValue)}
          </span>
        </div>
      </div>

      {/* 3 Modos Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => onChangeFinancialMode('none')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            financialMode === 'none'
              ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300'
              : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Ban
                className={`w-4 h-4 ${
                  financialMode === 'none' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              Não gerar/vincular financeiro
            </div>
            {financialMode === 'none' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Padrão seguro: apenas cadastra/atualiza produtos e estoque, sem criar contas a pagar.
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            onChangeFinancialMode('create_new');
            if (installments.length === 0) {
              applyPreset('30d');
            }
          }}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            financialMode === 'create_new'
              ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-300'
              : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <PlusCircle
                className={`w-4 h-4 ${
                  financialMode === 'create_new' ? 'text-blue-600' : 'text-slate-400'
                }`}
              />
              Gerar nova Despesa / Conta a Pagar
            </div>
            {financialMode === 'create_new' && (
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            {xmlHasDuplicates
              ? `Duplicatas detectadas no XML (${installments.length} parcela(s)) prontas para revisão.`
              : 'Cria 1 ou mais parcelas editáveis no Contas a Pagar com atalhos de prazo.'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onChangeFinancialMode('link_existing')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            financialMode === 'link_existing'
              ? 'bg-violet-50 border-violet-400 ring-1 ring-violet-300'
              : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Link2
                className={`w-4 h-4 ${
                  financialMode === 'link_existing' ? 'text-violet-600' : 'text-slate-400'
                }`}
              />
              Vincular a Despesa já existente
            </div>
            {financialMode === 'link_existing' && (
              <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Associa esta importação a uma conta já lançada sem duplicar valores no Financeiro.
          </p>
        </button>
      </div>

      {/* Painel Modo 2: Gerar nova Despesa / Parcelas */}
      {financialMode === 'create_new' && (
        <div className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-200 space-y-3.5">
          {xmlHasDuplicates && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Duplicatas lidas automaticamente do XML da NF-e</strong> (&lt;cobr&gt;/&lt;dup&gt;). Você pode editar datas, valores ou aplicar novos atalhos abaixo.
              </span>
            </div>
          )}

          {/* Campos pré-preenchidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                Fornecedor
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => onChangeSupplierName?.(e.target.value)}
                readOnly={!onChangeSupplierName}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                Data de Emissão
              </label>
              <input
                type="date"
                value={emissionDate}
                onChange={(e) => onChangeEmissionDate?.(e.target.value)}
                readOnly={!onChangeEmissionDate}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                Categoria Financeira
              </label>
              <select
                value={expenseCategory}
                onChange={(e) => onChangeExpenseCategory(e.target.value as ExpenseCategory)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {EXPENSE_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => onChangePaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PAYMENT_METHOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                Status Inicial
              </label>
              <select
                value={initialPaymentStatus}
                onChange={(e) =>
                  onChangeInitialPaymentStatus(e.target.value as 'pendente' | 'pago')
                }
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pendente">Pendente (A Pagar)</option>
                <option value="pago">Pago / Quitado</option>
              </select>
            </div>
          </div>

          {/* Atalhos rápidos de vencimento/parcelamento */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-600 mr-1">
              Atalhos rápidos:
            </span>
            {(
              [
                { id: 'vista_hoje', label: 'À vista / Hoje' },
                { id: '7d', label: '7 dias' },
                { id: '14d', label: '14 dias' },
                { id: '28d', label: '28 dias' },
                { id: '30d', label: '30 dias' },
              ] as { id: QuickInstallmentPreset; label: string }[]
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => applyPreset(btn.id)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-blue-600 hover:text-white text-slate-700 border border-slate-300 rounded-md transition-colors cursor-pointer"
              >
                {btn.label}
              </button>
            ))}

            <div className="inline-flex items-center gap-1 bg-white border border-slate-300 rounded-md px-2 py-0.5 ml-1">
              <input
                type="number"
                min={2}
                max={36}
                value={customCount}
                onChange={(e) => setCustomCount(Math.max(2, Number(e.target.value) || 2))}
                className="w-10 text-xs font-bold text-center text-slate-900 focus:outline-none"
                title="Quantidade de parcelas"
              />
              <span className="text-[11px] text-slate-500">x a cada</span>
              <input
                type="number"
                min={1}
                max={180}
                value={customIntervalDays}
                onChange={(e) =>
                  setCustomIntervalDays(Math.max(1, Number(e.target.value) || 30))
                }
                className="w-10 text-xs font-bold text-center text-slate-900 focus:outline-none"
                title="Intervalo em dias"
              />
              <span className="text-[11px] text-slate-500">d</span>
              <button
                type="button"
                onClick={() => applyPreset('custom_x')}
                className="ml-1 px-2 py-0.5 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer"
              >
                Gerar
              </button>
            </div>
          </div>

          {/* Lista editável de duplicatas / parcelas */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Parcelas / Duplicatas ({installments.length})
              </div>
              <button
                type="button"
                onClick={handleAddInstallment}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Parcela
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {installments.map((inst, index) => (
                <div
                  key={inst.id}
                  className="px-3 py-2 grid grid-cols-12 items-center gap-2 text-xs"
                >
                  <div className="col-span-3 sm:col-span-3">
                    <label className="text-[10px] text-slate-400 block">Nº Parcela / Dup.</label>
                    <input
                      type="text"
                      value={inst.number}
                      onChange={(e) =>
                        handleUpdateInstallment(inst.id, { number: e.target.value })
                      }
                      placeholder={String(index + 1).padStart(3, '0')}
                      className="w-full px-2 py-1 text-xs font-mono border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-4">
                    <label className="text-[10px] text-slate-400 block">Vencimento</label>
                    <input
                      type="date"
                      value={inst.dueDate}
                      onChange={(e) =>
                        handleUpdateInstallment(inst.id, { dueDate: e.target.value })
                      }
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-4">
                    <label className="text-[10px] text-slate-400 block">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={inst.amount}
                      onChange={(e) =>
                        handleUpdateInstallment(inst.id, {
                          amount: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="w-full px-2 py-1 text-xs font-bold text-slate-900 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveInstallment(inst.id)}
                      disabled={installments.length <= 1}
                      className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                      title="Remover parcela"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-600">
                Soma das parcelas:{' '}
                <strong className="text-slate-900">{formatBRL(installmentsSum)}</strong>
              </span>
              {Math.abs(differenceFromTotal) > 0.01 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Diferença de {formatBRL(Math.abs(differenceFromTotal))} em relação ao total da compra (
                  {formatBRL(totalPurchaseValue)})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Parcelamento bate exatamente com o total da compra
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Painel Modo 3: Vincular a Despesa / Conta a Pagar Existente */}
      {financialMode === 'link_existing' && (
        <div className="p-3.5 rounded-xl bg-violet-50/40 border border-violet-200 space-y-3">
          <div className="flex items-start gap-2 text-xs text-violet-900">
            <Receipt className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
            <div>
              <strong>Vínculo bidirecional sem duplicar valores:</strong> selecione um lançamento já cadastrado em Despesas / Contas a Pagar. Nenhum novo valor financeiro será somado ao DRE ou Caixa.
            </div>
          </div>

          {selectedExpense && (
            <div className="p-2.5 rounded-lg bg-white border border-violet-300 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {selectedExpense.description}
                </div>
                <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                  <span>Fornecedor: <strong>{selectedExpense.supplier || '—'}</strong></span>
                  <span>Venc.: <strong>{selectedExpense.dueDate}</strong></span>
                  {selectedExpense.invoiceNumber && (
                    <span>Doc: <strong>{selectedExpense.invoiceNumber}</strong></span>
                  )}
                  <span className={selectedExpense.isPaid ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {selectedExpense.isPaid ? 'Pago' : 'Pendente'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-black text-violet-800">
                  {formatBRL(selectedExpense.cost)}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectLinkedExpenseId(undefined)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-red-600 underline cursor-pointer"
                >
                  Trocar
                </button>
              </div>
            </div>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={expenseSearch}
              onChange={(e) => setExpenseSearch(e.target.value)}
              placeholder="Buscar despesa existente por descrição, fornecedor, nº nota ou valor..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="max-h-48 overflow-y-auto bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
            {filteredExpenses.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                Nenhuma despesa cadastrada encontrada no Financeiro.
              </div>
            ) : (
              filteredExpenses.map((exp) => {
                const isSelected = exp.id === linkedExpenseId;
                return (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => onSelectLinkedExpenseId(exp.id)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected ? 'bg-violet-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {exp.description}
                        </span>
                        {exp.linkedStockImportRef && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                            Vinculada: {exp.linkedStockImportRef}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-2.5 mt-0.5">
                        <span>{exp.supplier || 'Sem fornecedor'}</span>
                        <span>Venc: {exp.dueDate}</span>
                        {exp.invoiceNumber && <span>NF: {exp.invoiceNumber}</span>}
                        <span className={exp.isPaid ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                          {exp.isPaid ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-slate-900">
                        {formatBRL(exp.cost)}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-violet-600" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
