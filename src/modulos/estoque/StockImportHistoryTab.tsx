import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Eye,
  FileCode,
  FileSpreadsheet,
  History,
  Info,
  RotateCcw,
  Search,
  ShieldAlert,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../../context/AppContext';
import {
  ImportAllocationMode,
  ImportCostUpdateMode,
  StockImportRecord,
  StockImportUndoAnalysis,
} from '../../types';
import {
  formatQuantityClean,
  getMatchSourceLabel,
  normalizeText,
} from '../../utils/stockImportHelpers';

const ALLOCATION_LABELS: Record<ImportAllocationMode, string> = {
  proportional_value: 'Rateio proporcional ao valor do item',
  proportional_qty: 'Rateio proporcional à quantidade',
  financial_only: 'Apenas no total da compra / financeiro',
};

const COST_MODE_LABELS: Record<ImportCostUpdateMode, string> = {
  effective_unit: 'Custo unitário efetivo convertido',
  weighted_average: 'Custo Médio Ponderado',
  keep_current: 'Manter custo atual do catálogo',
};

export const StockImportHistoryTab: React.FC = () => {
  const {
    stockImportRecords,
    generalExpenses,
    analyzeUndoStockImport,
    undoStockImport,
  } = useApp();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'concluida' | 'desfeita'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Audit detail modal
  const [auditRecord, setAuditRecord] = useState<StockImportRecord | null>(null);

  // Undo confirmation modal
  const [undoTarget, setUndoTarget] = useState<StockImportRecord | null>(null);
  const [undoAnalysis, setUndoAnalysis] = useState<StockImportUndoAnalysis | null>(null);
  const [undoFinancialAction, setUndoFinancialAction] = useState<'delete_generated' | 'unlink_only'>(
    'unlink_only'
  );
  const [undoDeleteUnusedProducts, setUndoDeleteUnusedProducts] = useState(false);
  const [undoRestoreCosts, setUndoRestoreCosts] = useState(true);

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const supplierOptions = useMemo(() => {
    const names = Array.from(new Set(stockImportRecords.map((r) => r.supplierName).filter(Boolean)));
    return names.sort((a, b) => a.localeCompare(b));
  }, [stockImportRecords]);

  const filteredRecords = useMemo(() => {
    const q = normalizeText(searchTerm);
    return stockImportRecords
      .filter((rec) => {
        const recStatus = rec.status || 'concluida';
        if (statusFilter !== 'all' && recStatus !== statusFilter) return false;
        if (supplierFilter !== 'all' && rec.supplierName !== supplierFilter) return false;

        const refDate = (rec.importedAt || rec.emissionDate || '').slice(0, 10);
        if (startDate && refDate && refDate < startDate) return false;
        if (endDate && refDate && refDate > endDate) return false;

        if (q) {
          const itemHaystack = (rec.itemsSnapshot || [])
            .map((it) => `${it.productCode} ${it.productName} ${it.supplierItemCode} ${it.supplierItemDescription}`)
            .join(' ');
          const haystack = normalizeText(
            `${rec.referenceCode} ${rec.supplierName} ${rec.supplierCnpj || ''} ${rec.financialStatusSummary || ''} ${itemHaystack}`
          );
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (b.importedAt || '').localeCompare(a.importedAt || ''));
  }, [stockImportRecords, statusFilter, supplierFilter, startDate, endDate, searchTerm]);

  const stats = useMemo(() => {
    const concluded = stockImportRecords.filter((r) => (r.status || 'concluida') === 'concluida');
    const undone = stockImportRecords.filter((r) => r.status === 'desfeita');
    const totalValue = concluded.reduce((acc, r) => acc + (Number(r.grandTotal) || 0), 0);
    return {
      total: stockImportRecords.length,
      concludedCount: concluded.length,
      undoneCount: undone.length,
      totalValue,
    };
  }, [stockImportRecords]);

  const openUndoModal = (rec: StockImportRecord) => {
    const analysis = analyzeUndoStockImport(rec.id);
    setUndoTarget(rec);
    setUndoAnalysis(analysis);
    setUndoFinancialAction(
      analysis.generatedExpenses.length > 0 && analysis.paidGeneratedCount === 0
        ? 'delete_generated'
        : 'unlink_only'
    );
    setUndoDeleteUnusedProducts(false);
    setUndoRestoreCosts(true);
  };

  const handleConfirmUndo = () => {
    if (!undoTarget) return;
    const result = undoStockImport(undoTarget.id, {
      financialAction: undoFinancialAction,
      deleteUnusedCreatedProducts: undoDeleteUnusedProducts,
      restorePreviousCosts: undoRestoreCosts,
    });
    setFeedback({
      type: result.success ? 'success' : 'error',
      message: result.message,
    });
    setUndoTarget(null);
    setUndoAnalysis(null);
    // Keep audit modal synchronized if it was open for the same record
    if (auditRecord && auditRecord.id === undoTarget.id) {
      setAuditRecord(null);
    }
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

  const renderFinancialSummary = (rec: StockImportRecord) => {
    if (rec.financialStatusSummary) return rec.financialStatusSummary;
    if (rec.financialMode === 'create_new') {
      return `${rec.linkedExpenseIds.length} parcela(s) gerada(s)`;
    }
    if (rec.financialMode === 'link_existing') {
      return 'Vinculado a despesa existente';
    }
    return 'Sem vínculo financeiro';
  };

  return (
    <div className="space-y-4">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
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
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-[#53383e]" />
            Histórico de Importações — Auditoria & Reversão Segura
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rastreie todas as entradas via NF-e XML e Importação Universal com snapshot completo de itens, conversão, rateio, custos e financeiro. Importações concluídas podem ser auditadas e desfeitas com segurança.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-bold uppercase text-slate-500">Total Registrado</div>
            <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{stats.total}</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="text-[10px] font-bold uppercase text-emerald-700">Concluídas (Ativas)</div>
            <div className="text-xl font-bold text-emerald-900 mt-1 font-mono">{stats.concludedCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
            <div className="text-[10px] font-bold uppercase text-rose-700">Desfeitas / Estornadas</div>
            <div className="text-xl font-bold text-rose-900 mt-1 font-mono">{stats.undoneCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200">
            <div className="text-[10px] font-bold uppercase text-blue-700">Volume Ativo Importado</div>
            <div className="text-xl font-bold text-blue-900 mt-1 font-mono">
              {formatBRL(stats.totalValue)}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-2.5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por NF-e, arquivo, fornecedor, CNPJ ou produto..."
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

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
          >
            <option value="all">Todos os fornecedores</option>
            {supplierOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'concluida' | 'desfeita')}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
          >
            <option value="all">Todos os status</option>
            <option value="concluida">Concluída</option>
            <option value="desfeita">Desfeita</option>
          </select>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Data inicial"
              className="w-full px-2 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg"
            />
            <span className="text-slate-400 text-xs">a</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="Data final"
              className="w-full px-2 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        {(searchTerm || supplierFilter !== 'all' || statusFilter !== 'all' || startDate || endDate) && (
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Exibindo <strong>{filteredRecords.length}</strong> de {stockImportRecords.length} registros
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSupplierFilter('all');
                setStatusFilter('all');
                setStartDate('');
                setEndDate('');
              }}
              className="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <History className="w-9 h-9 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              {stockImportRecords.length === 0
                ? 'Nenhuma importação registrada ainda'
                : 'Nenhuma importação encontrada para os filtros selecionados'}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Cada NF-e XML ou planilha confirmada no módulo de Estoque é registrada aqui automaticamente para auditoria completa e reversão segura.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3.5 font-bold">Data / Origem</th>
                  <th className="py-2.5 px-3.5 font-bold">Fornecedor</th>
                  <th className="py-2.5 px-3.5 font-bold">Itens (De-Para)</th>
                  <th className="py-2.5 px-3.5 font-bold text-right">Valores (NF-e / Compra)</th>
                  <th className="py-2.5 px-3.5 font-bold">Financeiro</th>
                  <th className="py-2.5 px-3.5 font-bold text-center">Status</th>
                  <th className="py-2.5 px-3.5 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((rec) => {
                  const isUndone = rec.status === 'desfeita';
                  const extras =
                    (Number(rec.freightTotal) || 0) +
                    (Number(rec.insuranceTotal) || 0) +
                    (Number(rec.otherExpensesTotal) || 0);

                  return (
                    <tr
                      key={rec.id}
                      className={`transition-colors ${
                        isUndone ? 'bg-rose-50/30 opacity-80 hover:opacity-100' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-2.5 px-3.5 align-top">
                        <div className="flex items-center gap-1.5">
                          {rec.source === 'nfe_xml' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                              <FileCode className="w-3 h-3" />
                              NF-e XML
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              <FileSpreadsheet className="w-3 h-3" />
                              Universal
                            </span>
                          )}
                          <span className="font-bold text-slate-900">{rec.referenceCode}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Importado: {formatDateTime(rec.importedAt)}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3.5 align-top">
                        <div className="font-bold text-slate-800">{rec.supplierName}</div>
                        {rec.supplierCnpj && (
                          <div className="text-[10px] font-mono text-slate-500">{rec.supplierCnpj}</div>
                        )}
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Emissão: {formatDateBR(rec.emissionDate)}
                        </div>
                      </td>

                      <td className="py-2.5 px-3.5 align-top">
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {rec.linkedCount} vinc.
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {rec.createdCount} novos
                          </span>
                          {rec.ignoredCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {rec.ignoredCount} ign.
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Total de {rec.itemsCount} linha(s)
                        </div>
                      </td>

                      <td className="py-2.5 px-3.5 align-top text-right font-mono">
                        <div className={`font-bold ${isUndone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {formatBRL(rec.grandTotal)}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Prod: {formatBRL(rec.productsTotal)}
                          {extras > 0 ? ` · +${formatBRL(extras)}` : ''}
                          {rec.discountTotal > 0 ? ` · -${formatBRL(rec.discountTotal)}` : ''}
                        </div>
                      </td>

                      <td className="py-2.5 px-3.5 align-top">
                        <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{renderFinancialSummary(rec)}</span>
                        </div>
                        {isUndone && rec.undoFinancialAction && (
                          <div className="text-[10px] text-rose-700 mt-0.5">
                            Estorno:{' '}
                            {rec.undoFinancialAction === 'delete_generated'
                              ? 'Parcelas geradas excluídas'
                              : 'Lançamentos desvinculados'}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3.5 align-top text-center">
                        {isUndone ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold">
                            <XCircle className="w-3 h-3" />
                            Desfeita
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            Concluída
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3.5 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setAuditRecord(rec)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Auditar
                          </button>
                          {!isUndone && (
                            <button
                              type="button"
                              onClick={() => openUndoModal(rec)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Desfazer
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
        )}
      </div>

      {/* Modal Auditar / Detalhes */}
      {auditRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAuditRecord(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 text-base">
                    Auditoria da Importação — {auditRecord.referenceCode}
                  </h3>
                  {auditRecord.status === 'desfeita' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-bold">
                      <XCircle className="w-3.5 h-3.5" />
                      Desfeita
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Concluída
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Fornecedor: <strong>{auditRecord.supplierName}</strong>
                  {auditRecord.supplierCnpj ? ` (${auditRecord.supplierCnpj})` : ''} · Emissão:{' '}
                  {formatDateBR(auditRecord.emissionDate)} · Importado em:{' '}
                  {formatDateTime(auditRecord.importedAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAuditRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Undone Banner */}
              {auditRecord.status === 'desfeita' && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-rose-700" />
                    Importação Desfeita em {formatDateTime(auditRecord.undoneAt)}
                    {auditRecord.undoneBy ? ` por ${auditRecord.undoneBy}` : ''}
                  </div>
                  {auditRecord.undoNotes && <p className="text-xs text-rose-800">{auditRecord.undoNotes}</p>}
                </div>
              )}

              {/* Totals & Policies Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Mercadorias</div>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {formatBRL(auditRecord.productsTotal)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Frete</div>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {formatBRL(auditRecord.freightTotal)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Seguro</div>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {formatBRL(auditRecord.insuranceTotal)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Outras Desp.</div>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {formatBRL(auditRecord.otherExpensesTotal)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                  <div className="text-[10px] font-bold uppercase text-amber-700">Desconto</div>
                  <div className="text-sm font-bold font-mono text-amber-900 mt-0.5">
                    -{formatBRL(auditRecord.discountTotal)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="text-[10px] font-bold uppercase text-blue-700">Total da Compra</div>
                  <div className="text-sm font-bold font-mono text-blue-950 mt-0.5">
                    {formatBRL(auditRecord.grandTotal)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">Critério de Rateio</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {ALLOCATION_LABELS[auditRecord.allocationMode] || auditRecord.allocationMode}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">Política de Custo</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {COST_MODE_LABELS[auditRecord.costUpdateMode] || auditRecord.costUpdateMode}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">Financeiro</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {renderFinancialSummary(auditRecord)}
                  </div>
                </div>
              </div>

              {/* Linked Financial Entries */}
              {auditRecord.linkedExpenseIds && auditRecord.linkedExpenseIds.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-blue-600" />
                    Lançamentos Financeiros Associados ({auditRecord.linkedExpenseIds.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {auditRecord.linkedExpenseIds.map((expId) => {
                      const exp = generalExpenses.find((e) => e.id === expId);
                      const wasGenerated = (auditRecord.generatedExpenseIds || []).includes(expId);
                      if (!exp) {
                        return (
                          <div
                            key={expId}
                            className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500"
                          >
                            Lançamento #{expId} (removido do Financeiro)
                          </div>
                        );
                      }
                      return (
                        <div
                          key={exp.id}
                          className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 truncate">{exp.description}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Venc.: {formatDateBR(exp.dueDate)} ·{' '}
                              {wasGenerated ? 'Gerado na importação' : 'Despesa existente vinculada'}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold font-mono text-slate-900">{formatBRL(exp.cost)}</div>
                            <span
                              className={`text-[10px] font-bold ${
                                exp.isPaid ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {exp.isPaid ? 'Pago' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Snapshot Table */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Snapshot Completo dos Itens ({(auditRecord.itemsSnapshot || []).length} linha(s))
                </h4>

                {!auditRecord.itemsSnapshot || auditRecord.itemsSnapshot.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>
                      Este registro foi importado antes da captura detalhada de snapshot por item.
                    </span>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-500">
                          <th className="py-2 px-2.5 font-bold">Ação</th>
                          <th className="py-2 px-2.5 font-bold">Item Fornecedor</th>
                          <th className="py-2 px-2.5 font-bold">Produto no Estoque</th>
                          <th className="py-2 px-2.5 font-bold text-right">Imp. × Fator</th>
                          <th className="py-2 px-2.5 font-bold text-right">Qtd Conv.</th>
                          <th className="py-2 px-2.5 font-bold text-right">Rateio / Efetivo</th>
                          <th className="py-2 px-2.5 font-bold text-right">Custo Efetivo Un.</th>
                          <th className="py-2 px-2.5 font-bold text-right">Custo Ant. → Novo</th>
                          <th className="py-2 px-2.5 font-bold text-right">Saldo Ant. → Novo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {auditRecord.itemsSnapshot.map((it) => {
                          const matchInfo = getMatchSourceLabel(it.matchSource);
                          const netAlloc =
                            (it.allocatedFreight || 0) +
                            (it.allocatedInsurance || 0) +
                            (it.allocatedOtherExpenses || 0) -
                            (it.allocatedDiscount || 0);

                          return (
                            <tr
                              key={it.itemId}
                              className={it.action === 'ignore' ? 'bg-slate-50/70 text-slate-400' : ''}
                            >
                              <td className="py-2 px-2.5 align-top whitespace-nowrap">
                                {it.action === 'link_existing' && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
                                    Vinculado
                                  </span>
                                )}
                                {it.action === 'create_new' && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                                    Novo
                                  </span>
                                )}
                                {it.action === 'ignore' && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 font-bold text-[10px]">
                                    Ignorado
                                  </span>
                                )}
                                {it.action !== 'ignore' && (
                                  <div className="text-[9px] text-slate-500 mt-0.5">{matchInfo.label}</div>
                                )}
                              </td>

                              <td className="py-2 px-2.5 align-top max-w-[200px]">
                                <div className="font-mono text-[10px] text-slate-500">
                                  {it.supplierItemCode || '—'}
                                </div>
                                <div className="font-medium text-slate-700 line-clamp-2">
                                  {it.supplierItemDescription}
                                </div>
                              </td>

                              <td className="py-2 px-2.5 align-top max-w-[200px]">
                                <div className="font-mono text-[10px] text-slate-500">
                                  {it.productCode || '—'}
                                </div>
                                <div className="font-bold text-slate-900 line-clamp-2">{it.productName}</div>
                              </td>

                              <td className="py-2 px-2.5 align-top text-right font-mono whitespace-nowrap">
                                <div>
                                  {formatQuantityClean(it.importedQuantity)} {it.supplierUnit}
                                </div>
                                <div className="text-[10px] text-blue-700">
                                  × {formatQuantityClean(it.conversionFactor)}
                                </div>
                              </td>

                              <td className="py-2 px-2.5 align-top text-right font-mono whitespace-nowrap">
                                <div className="font-bold text-slate-900">
                                  {it.action === 'ignore'
                                    ? '—'
                                    : `${formatQuantityClean(it.convertedQuantity)} ${it.stockUnit}`}
                                </div>
                                {it.action !== 'ignore' && !it.stockAdded && (
                                  <div className="text-[9px] text-amber-700 font-sans">Sem soma saldo</div>
                                )}
                              </td>

                              <td className="py-2 px-2.5 align-top text-right font-mono whitespace-nowrap">
                                <div className="font-bold text-slate-900">
                                  {formatBRL(it.effectiveTotal)}
                                </div>
                                {Math.abs(netAlloc) >= 0.01 && (
                                  <div
                                    className={`text-[10px] ${
                                      netAlloc > 0 ? 'text-amber-700' : 'text-emerald-700'
                                    }`}
                                  >
                                    {netAlloc > 0 ? '+' : ''}
                                    {formatBRL(netAlloc)} rateio
                                  </div>
                                )}
                              </td>

                              <td className="py-2 px-2.5 align-top text-right font-mono font-bold text-blue-800 whitespace-nowrap">
                                {it.action === 'ignore' ? '—' : formatBRL(it.effectiveUnitCost)}
                              </td>

                              <td className="py-2 px-2.5 align-top text-right font-mono whitespace-nowrap">
                                {it.action === 'ignore' ? (
                                  '—'
                                ) : (
                                  <span className="inline-flex items-center gap-1">
                                    <span className="text-slate-500">{formatBRL(it.previousCost)}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-400" />
                                    <span className="font-bold text-slate-900">{formatBRL(it.newCost)}</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-2 px-2.5 align-top text-right font-mono whitespace-nowrap">
                                {it.action === 'ignore' ? (
                                  '—'
                                ) : (
                                  <span className="inline-flex items-center gap-1">
                                    <span className="text-slate-500">
                                      {formatQuantityClean(it.previousStock)}
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-slate-400" />
                                    <span className="font-bold text-emerald-700">
                                      {formatQuantityClean(it.newStock)}
                                    </span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <div>
                {auditRecord.status !== 'desfeita' && (
                  <button
                    type="button"
                    onClick={() => openUndoModal(auditRecord)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Desfazer esta Importação
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setAuditRecord(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Desfazer Importação */}
      {undoTarget && undoAnalysis && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setUndoTarget(null);
              setUndoAnalysis(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-rose-200 bg-rose-50 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-rose-950 text-sm">
                    Desfazer Importação — {undoTarget.referenceCode}
                  </h3>
                  <p className="text-xs text-rose-800 mt-0.5">
                    Revise o resumo de impacto abaixo antes de confirmar o estorno. A importação será marcada como <strong>Desfeita</strong> no histórico e removida dos consolidados de compra.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUndoTarget(null);
                  setUndoAnalysis(null);
                }}
                className="p-1 text-rose-500 hover:text-rose-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {!undoAnalysis.canUndo ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                  {undoAnalysis.reason || 'Esta importação não pode ser desfeita.'}
                </div>
              ) : (
                <>
                  {/* 1. Estorno de Estoque */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      1. Estorno de Quantidades Convertidas no Estoque ({undoAnalysis.stockReversals.length})
                    </h4>
                    {undoAnalysis.stockReversals.length === 0 ? (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
                        Nenhuma quantidade foi somada ao estoque nesta importação.
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-44 overflow-y-auto">
                        {undoAnalysis.stockReversals.map((rev) => (
                          <div
                            key={rev.productId}
                            className="px-3 py-2 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-slate-800 truncate">{rev.productName}</div>
                              <div className="text-[10px] font-mono text-slate-500">{rev.productCode}</div>
                            </div>
                            <div className="text-right font-mono shrink-0">
                              <div className="font-bold text-rose-700">
                                -{formatQuantityClean(rev.qtyToReverse)} {rev.stockUnit}
                              </div>
                              <div className="text-[10px] text-slate-600">
                                Saldo: {formatQuantityClean(rev.currentStock)} →{' '}
                                <strong>{formatQuantityClean(rev.projectedStock)}</strong>
                                {rev.willClampAtZero && (
                                  <span className="ml-1 text-amber-700 font-bold">(ajustado a 0)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Produtos Criados na Importação */}
                  {undoAnalysis.createdProductsStatus.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        2. Produtos Criados Exclusivamente nesta Importação (
                        {undoAnalysis.createdProductsStatus.length})
                      </h4>

                      <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-44 overflow-y-auto">
                        {undoAnalysis.createdProductsStatus.map((cp) => (
                          <div key={cp.productId} className="px-3 py-2 flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-bold text-slate-800">{cp.productName}</div>
                              <div className="text-[10px] font-mono text-slate-500">{cp.productCode}</div>
                              {cp.hasExternalUsage && (
                                <div className="text-[10px] text-amber-800 mt-1">
                                  Protegido contra exclusão: {cp.usageReasons.join(' · ')}
                                </div>
                              )}
                            </div>
                            {cp.hasExternalUsage ? (
                              <span className="shrink-0 px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold">
                                Bloqueado p/ excluir
                              </span>
                            ) : (
                              <span className="shrink-0 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                Sem uso externo
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {undoAnalysis.createdProductsStatus.some((cp) => !cp.hasExternalUsage) && (
                        <label className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={undoDeleteUnusedProducts}
                            onChange={(e) => setUndoDeleteUnusedProducts(e.target.checked)}
                            className="mt-0.5 rounded border-slate-300"
                          />
                          <span>
                            <strong>Remover do catálogo</strong> os produtos criados nesta importação que não possuem nenhuma movimentação externa (os produtos com movimentação ou vínculo em OS/Vendas serão preservados com segurança).
                          </span>
                        </label>
                      )}
                    </div>
                  )}

                  {/* 3. Restauração de Custos */}
                  <label className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={undoRestoreCosts}
                      onChange={(e) => setUndoRestoreCosts(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300"
                    />
                    <span>
                      <strong>Restaurar custo anterior</strong> nos produtos vinculados (reverte o custo unitário do catálogo para o valor registrado antes desta importação).
                    </span>
                  </label>

                  {/* 4. Tratamento Financeiro */}
                  {(undoAnalysis.generatedExpenses.length > 0 ||
                    undoAnalysis.linkedExistingExpenses.length > 0) && (
                    <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-blue-600" />
                        3. Tratamento dos Lançamentos Financeiros
                      </h4>

                      {undoAnalysis.paidGeneratedCount > 0 && (
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="text-[11px]">
                            <strong>Atenção — Parcelas já pagas detectadas!</strong>{' '}
                            {undoAnalysis.paidGeneratedCount} lançamento(s) gerado(s) por esta importação já consta(m) como <strong>PAGO</strong> no Financeiro. Excluir parcelas pagas afetará o saldo/DRE do período; prefira "Apenas desvincular" caso o pagamento real já tenha ocorrido.
                          </div>
                        </div>
                      )}

                      {undoAnalysis.generatedExpenses.length > 0 && (
                        <div className="space-y-2">
                          <label className="flex items-start gap-2 p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer">
                            <input
                              type="radio"
                              name="undoFinancialAction"
                              checked={undoFinancialAction === 'delete_generated'}
                              onChange={() => setUndoFinancialAction('delete_generated')}
                              className="mt-0.5"
                            />
                            <div>
                              <div className="font-bold text-slate-900">
                                Cancelar / Excluir os {undoAnalysis.generatedExpenses.length} lançamento(s) gerado(s) automaticamente
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Remove as contas a pagar criadas exclusivamente nesta importação (despesas pré-existentes apenas vinculadas nunca são excluídas).
                              </div>
                            </div>
                          </label>

                          <label className="flex items-start gap-2 p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer">
                            <input
                              type="radio"
                              name="undoFinancialAction"
                              checked={undoFinancialAction === 'unlink_only'}
                              onChange={() => setUndoFinancialAction('unlink_only')}
                              className="mt-0.5"
                            />
                            <div>
                              <div className="font-bold text-slate-900">
                                Apenas desvincular (manter lançamentos no Financeiro)
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Preserva todas as despesas e parcelas no módulo Financeiro, removendo apenas a referência a esta importação.
                              </div>
                            </div>
                          </label>
                        </div>
                      )}

                      {undoAnalysis.generatedExpenses.length === 0 &&
                        undoAnalysis.linkedExistingExpenses.length > 0 && (
                          <div className="text-[11px] text-slate-600 bg-white border border-slate-200 rounded-lg p-2.5">
                            Esta importação estava associada a{' '}
                            <strong>{undoAnalysis.linkedExistingExpenses.length}</strong> despesa(s) já existente(s). Ao desfazer, o vínculo será removido sem excluir a despesa original.
                          </div>
                        )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setUndoTarget(null);
                  setUndoAnalysis(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              {undoAnalysis.canUndo && (
                <button
                  type="button"
                  onClick={handleConfirmUndo}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  Confirmar Estorno e Desfazer Importação
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
