import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Boxes,
  Building2,
  Download,
  Eye,
  FileText,
  Info,
  Package,
  Printer,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp, formatBRL, formatDateBR } from '../../context/AppContext';
import { StockImportItemSnapshot, StockImportRecord } from '../../types';
import { formatQuantityClean, normalizeText, round2 } from '../../utils/stockImportHelpers';

interface SupplierConsolidatedRow {
  supplierKey: string;
  supplierName: string;
  supplierCnpj?: string;
  totalSpent: number;
  sharePercent: number;
  importsCount: number;
  convertedUnits: number;
  lastImportDate: string;
  avgTicket: number;
  records: StockImportRecord[];
}

interface ProductRankingRow {
  key: string;
  productId?: string;
  productCode: string;
  productName: string;
  stockUnit: string;
  purchasesCount: number;
  totalConvertedQty: number;
  totalEffectiveSpend: number;
  avgEffectiveUnitCost: number;
  lastEffectiveUnitCost: number;
  lastPurchaseDate: string;
}

interface CostHistoryEntry {
  id: string;
  date: string;
  supplierName: string;
  referenceCode: string;
  productKey: string;
  productCode: string;
  productName: string;
  stockUnit: string;
  supplierUnit: string;
  importedQuantity: number;
  conversionFactor: number;
  convertedQuantity: number;
  effectiveUnitCost: number;
  previousUnitCost?: number;
  variationPercent?: number;
}

export const SupplierPurchasesReportTab: React.FC = () => {
  const {
    stockImportRecords,
    products,
    companySettings,
  } = useApp();

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sub-controls
  const [rankingSortBy, setRankingSortBy] = useState<'spend' | 'qty'>('spend');
  const [costHistoryProductKey, setCostHistoryProductKey] = useState<string>('all');
  const [selectedSupplierDetail, setSelectedSupplierDetail] = useState<SupplierConsolidatedRow | null>(null);

  // Strictly concluded imports only
  const concludedRecordsAll = useMemo(
    () => stockImportRecords.filter((r) => (r.status || 'concluida') === 'concluida'),
    [stockImportRecords]
  );

  const undoneExcludedCount = stockImportRecords.length - concludedRecordsAll.length;

  const supplierFilterOptions = useMemo(() => {
    const names = Array.from(new Set(concludedRecordsAll.map((r) => r.supplierName).filter(Boolean)));
    return names.sort((a, b) => a.localeCompare(b));
  }, [concludedRecordsAll]);

  const filteredRecords = useMemo(() => {
    const q = normalizeText(searchTerm);
    return concludedRecordsAll.filter((rec) => {
      const refDate = (rec.emissionDate || rec.importedAt || '').slice(0, 10);
      if (startDate && refDate && refDate < startDate) return false;
      if (endDate && refDate && refDate > endDate) return false;
      if (selectedSupplier !== 'all' && rec.supplierName !== selectedSupplier) return false;

      const activeItems = (rec.itemsSnapshot || []).filter((it) => it.action !== 'ignore');

      if (selectedProductId !== 'all') {
        const hasProduct = activeItems.some((it) => it.productId === selectedProductId);
        if (!hasProduct) return false;
      }

      if (q) {
        const itemText = activeItems
          .map((it) => `${it.productCode} ${it.productName} ${it.supplierItemCode} ${it.supplierItemDescription}`)
          .join(' ');
        const haystack = normalizeText(
          `${rec.supplierName} ${rec.supplierCnpj || ''} ${rec.referenceCode} ${itemText}`
        );
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [concludedRecordsAll, startDate, endDate, selectedSupplier, selectedProductId, searchTerm]);

  // Helper to get active items relevant to current product filter
  const getScopedItems = (rec: StockImportRecord): StockImportItemSnapshot[] => {
    const active = (rec.itemsSnapshot || []).filter((it) => it.action !== 'ignore');
    if (selectedProductId !== 'all') {
      return active.filter((it) => it.productId === selectedProductId);
    }
    return active;
  };

  // Helper to get scoped monetary total for a record
  const getScopedRecordTotal = (rec: StockImportRecord): number => {
    if (selectedProductId !== 'all') {
      return round2(
        getScopedItems(rec).reduce((acc, it) => acc + (Number(it.effectiveTotal) || 0), 0)
      );
    }
    return Number(rec.grandTotal) || 0;
  };

  // Consolidated by Supplier
  const supplierRows = useMemo<SupplierConsolidatedRow[]>(() => {
    const map = new Map<string, SupplierConsolidatedRow>();

    filteredRecords.forEach((rec) => {
      const key = (rec.supplierCnpj || '').replace(/\D/g, '') || normalizeText(rec.supplierName) || 'sem_fornecedor';
      const scopedItems = getScopedItems(rec);
      const scopedSpend = getScopedRecordTotal(rec);
      const convertedUnits = scopedItems.reduce(
        (acc, it) => acc + (it.stockAdded !== false ? Number(it.convertedQuantity) || 0 : 0),
        0
      );
      const recDate = (rec.emissionDate || rec.importedAt || '').slice(0, 10);

      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          supplierKey: key,
          supplierName: rec.supplierName || 'Fornecedor não identificado',
          supplierCnpj: rec.supplierCnpj,
          totalSpent: scopedSpend,
          sharePercent: 0,
          importsCount: 1,
          convertedUnits,
          lastImportDate: recDate,
          avgTicket: scopedSpend,
          records: [rec],
        });
      } else {
        existing.totalSpent = round2(existing.totalSpent + scopedSpend);
        existing.importsCount += 1;
        existing.convertedUnits = round2(existing.convertedUnits + convertedUnits);
        if (recDate > existing.lastImportDate) existing.lastImportDate = recDate;
        existing.records.push(rec);
      }
    });

    const list = Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
    const grandTotal = list.reduce((acc, row) => acc + row.totalSpent, 0);

    return list.map((row) => ({
      ...row,
      sharePercent: grandTotal > 0 ? (row.totalSpent / grandTotal) * 100 : 0,
      avgTicket: row.importsCount > 0 ? round2(row.totalSpent / row.importsCount) : 0,
    }));
  }, [filteredRecords, selectedProductId]);

  // Top KPIs
  const summaryKpis = useMemo(() => {
    const totalSpent = round2(supplierRows.reduce((acc, r) => acc + r.totalSpent, 0));
    const totalImports = filteredRecords.length;
    const totalConvertedUnits = round2(
      supplierRows.reduce((acc, r) => acc + r.convertedUnits, 0)
    );
    const topSupplier = supplierRows[0] || null;
    return {
      totalSpent,
      totalImports,
      totalConvertedUnits,
      topSupplier,
    };
  }, [supplierRows, filteredRecords]);

  // Ranking of Most Imported Items
  const productRanking = useMemo<ProductRankingRow[]>(() => {
    const map = new Map<string, ProductRankingRow>();

    const sortedAsc = [...filteredRecords].sort((a, b) =>
      (a.emissionDate || a.importedAt || '').localeCompare(b.emissionDate || b.importedAt || '')
    );

    sortedAsc.forEach((rec) => {
      const recDate = (rec.emissionDate || rec.importedAt || '').slice(0, 10);
      const items = getScopedItems(rec);

      items.forEach((it) => {
        const key = it.productId || `${it.productCode}|${normalizeText(it.productName)}`;
        const convQty = Number(it.convertedQuantity) || 0;
        const effTotal = Number(it.effectiveTotal) || 0;
        const effUnit = Number(it.effectiveUnitCost) || 0;

        const existing = map.get(key);
        if (!existing) {
          map.set(key, {
            key,
            productId: it.productId,
            productCode: it.productCode || '—',
            productName: it.productName,
            stockUnit: it.stockUnit || 'UN',
            purchasesCount: 1,
            totalConvertedQty: convQty,
            totalEffectiveSpend: effTotal,
            avgEffectiveUnitCost: convQty > 0 ? effTotal / convQty : effUnit,
            lastEffectiveUnitCost: effUnit,
            lastPurchaseDate: recDate,
          });
        } else {
          existing.purchasesCount += 1;
          existing.totalConvertedQty = round2(existing.totalConvertedQty + convQty);
          existing.totalEffectiveSpend = round2(existing.totalEffectiveSpend + effTotal);
          existing.avgEffectiveUnitCost =
            existing.totalConvertedQty > 0
              ? existing.totalEffectiveSpend / existing.totalConvertedQty
              : effUnit;
          if (recDate >= existing.lastPurchaseDate) {
            existing.lastPurchaseDate = recDate;
            existing.lastEffectiveUnitCost = effUnit;
          }
        }
      });
    });

    const list = Array.from(map.values());
    if (rankingSortBy === 'qty') {
      return list.sort((a, b) => b.totalConvertedQty - a.totalConvertedQty);
    }
    return list.sort((a, b) => b.totalEffectiveSpend - a.totalEffectiveSpend);
  }, [filteredRecords, selectedProductId, rankingSortBy]);

  // Unit Cost History (Converted)
  const costHistoryEntries = useMemo<CostHistoryEntry[]>(() => {
    const rawEntries: CostHistoryEntry[] = [];

    const sortedAsc = [...filteredRecords].sort((a, b) =>
      (a.emissionDate || a.importedAt || '').localeCompare(b.emissionDate || b.importedAt || '')
    );

    const lastCostByProduct = new Map<string, number>();

    sortedAsc.forEach((rec) => {
      const recDate = (rec.emissionDate || rec.importedAt || '').slice(0, 10);
      const items = getScopedItems(rec);

      items.forEach((it) => {
        const prodKey = it.productId || `${it.productCode}|${normalizeText(it.productName)}`;
        const prevCost = lastCostByProduct.get(prodKey);
        const effCost = Number(it.effectiveUnitCost) || 0;
        let variationPercent: number | undefined;
        if (prevCost !== undefined && prevCost > 0) {
          variationPercent = ((effCost - prevCost) / prevCost) * 100;
        }
        lastCostByProduct.set(prodKey, effCost);

        rawEntries.push({
          id: `${rec.id}-${it.itemId}`,
          date: recDate,
          supplierName: rec.supplierName,
          referenceCode: rec.referenceCode,
          productKey: prodKey,
          productCode: it.productCode || '—',
          productName: it.productName,
          stockUnit: it.stockUnit || 'UN',
          supplierUnit: it.supplierUnit || 'UN',
          importedQuantity: it.importedQuantity,
          conversionFactor: it.conversionFactor,
          convertedQuantity: it.convertedQuantity,
          effectiveUnitCost: effCost,
          previousUnitCost: prevCost,
          variationPercent,
        });
      });
    });

    const filtered =
      costHistoryProductKey === 'all'
        ? rawEntries
        : rawEntries.filter((e) => e.productKey === costHistoryProductKey);

    return filtered.reverse(); // Most recent first
  }, [filteredRecords, selectedProductId, costHistoryProductKey]);

  // Export CSV
  const handleExportCsv = () => {
    const header = [
      'Fornecedor',
      'CNPJ',
      'Total Gasto (R$)',
      'Participacao (%)',
      'Qtd Importacoes',
      'Unidades Convertidas',
      'Ultima Entrada',
      'Ticket Medio (R$)',
    ];

    const rows = supplierRows.map((r) => [
      `"${(r.supplierName || '').replace(/"/g, '""')}"`,
      `"${r.supplierCnpj || ''}"`,
      r.totalSpent.toFixed(2).replace('.', ','),
      r.sharePercent.toFixed(2).replace('.', ','),
      String(r.importsCount),
      formatQuantityClean(r.convertedUnits),
      r.lastImportDate ? formatDateBR(r.lastImportDate) : '',
      r.avgTicket.toFixed(2).replace('.', ','),
    ]);

    const csv = '\uFEFF' + [header.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compras-por-fornecedor-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export / Print PDF
  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const companyTitle = companySettings?.tradeName || companySettings?.companyName || 'FIRE GESTÃO';

    doc.setFontSize(14);
    doc.text(`${companyTitle} — Compras e Entradas por Fornecedor`, 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(100);
    const periodLabel =
      startDate || endDate
        ? `Período: ${startDate ? formatDateBR(startDate) : 'Início'} até ${endDate ? formatDateBR(endDate) : 'Hoje'}`
        : 'Período: Todo o histórico concluído';
    doc.text(
      `${periodLabel}  |  Gerado em: ${new Date().toLocaleString('pt-BR')}  |  Somente importações Concluídas`,
      14,
      21
    );

    doc.setTextColor(30);
    doc.setFontSize(10);
    doc.text(
      `Total Gasto: ${formatBRL(summaryKpis.totalSpent)}   |   Importações: ${summaryKpis.totalImports}   |   Unid. Convertidas: ${formatQuantityClean(summaryKpis.totalConvertedUnits)}   |   Maior Fornecedor: ${summaryKpis.topSupplier ? summaryKpis.topSupplier.supplierName : '—'}`,
      14,
      28
    );

    autoTable(doc, {
      startY: 33,
      head: [[
        'Fornecedor',
        'CNPJ',
        'Total Gasto',
        '% Part.',
        'Importações',
        'Unid. Conv.',
        'Última Entrada',
        'Ticket Médio',
      ]],
      body: supplierRows.map((r) => [
        r.supplierName,
        r.supplierCnpj || '—',
        formatBRL(r.totalSpent),
        `${r.sharePercent.toFixed(1)}%`,
        String(r.importsCount),
        formatQuantityClean(r.convertedUnits),
        r.lastImportDate ? formatDateBR(r.lastImportDate) : '—',
        formatBRL(r.avgTicket),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [83, 56, 62] },
    });

    if (productRanking.length > 0) {
      const nextY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 100;
      doc.setFontSize(11);
      doc.text('Ranking de Itens Mais Importados (Top 15)', 14, nextY + 10);

      autoTable(doc, {
        startY: nextY + 14,
        head: [[
          '#',
          'Código',
          'Produto',
          'Compras',
          'Qtd Convertida',
          'Custo Médio Un.',
          'Último Custo Un.',
          'Total Gasto',
        ]],
        body: productRanking.slice(0, 15).map((item, idx) => [
          String(idx + 1),
          item.productCode,
          item.productName,
          String(item.purchasesCount),
          `${formatQuantityClean(item.totalConvertedQty)} ${item.stockUnit}`,
          formatBRL(item.avgEffectiveUnitCost),
          formatBRL(item.lastEffectiveUnitCost),
          formatBRL(item.totalEffectiveSpend),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 64, 175] },
      });
    }

    doc.save(`relatorio-compras-fornecedores-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-4">
      {/* Header & Export Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Compras e Entradas por Fornecedor
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidado analítico de compras concluídas, participação por fornecedor, ranking de itens importados e evolução do custo unitário efetivo convertido.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={supplierRows.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={supplierRows.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] disabled:opacity-50 rounded-lg cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Exportar / Imprimir PDF
            </button>
          </div>
        </div>

        {undoneExcludedCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Este relatório considera exclusivamente importações com status <strong>Concluída</strong> ({undoneExcludedCount} importação(ões) desfeita(s) ignorada(s) automaticamente).
            </span>
          </div>
        )}

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
            <div className="text-[10px] font-bold uppercase text-blue-700 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Total Gasto (Concluídas)
            </div>
            <div className="text-xl font-bold text-blue-950 mt-1 font-mono">
              {formatBRL(summaryKpis.totalSpent)}
            </div>
            <div className="text-[10px] text-blue-700 mt-0.5">
              {supplierRows.length} fornecedor(es) no recorte
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              Importações Concluídas
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
              {summaryKpis.totalImports}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Ticket médio:{' '}
              {summaryKpis.totalImports > 0
                ? formatBRL(summaryKpis.totalSpent / summaryKpis.totalImports)
                : formatBRL(0)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
            <div className="text-[10px] font-bold uppercase text-amber-800 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              Fornecedor de Maior Volume
            </div>
            <div className="text-sm font-bold text-amber-950 mt-1 truncate">
              {summaryKpis.topSupplier ? summaryKpis.topSupplier.supplierName : '—'}
            </div>
            <div className="text-[10px] text-amber-800 mt-0.5 font-mono">
              {summaryKpis.topSupplier
                ? `${formatBRL(summaryKpis.topSupplier.totalSpent)} (${summaryKpis.topSupplier.sharePercent.toFixed(1)}%)`
                : 'Sem dados no período'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="text-[10px] font-bold uppercase text-emerald-700 flex items-center gap-1">
              <Boxes className="w-3.5 h-3.5 text-emerald-600" />
              Unidades Convertidas Entradas
            </div>
            <div className="text-xl font-bold text-emerald-950 mt-1 font-mono">
              {formatQuantityClean(summaryKpis.totalConvertedUnits)}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5">
              Já aplicadas com fator de conversão
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
              placeholder="Buscar fornecedor, CNPJ, NF-e ou produto..."
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
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
          >
            <option value="all">Todos os fornecedores</option>
            {supplierFilterOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(e.target.value);
              setCostHistoryProductKey(e.target.value === 'all' ? 'all' : e.target.value);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
          >
            <option value="all">Todos os produtos</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
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

        {(startDate || endDate || selectedSupplier !== 'all' || selectedProductId !== 'all' || searchTerm) && (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedSupplier('all');
                setSelectedProductId('all');
                setCostHistoryProductKey('all');
                setSearchTerm('');
              }}
              className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Limpar filtros do relatório
            </button>
          </div>
        )}
      </div>

      {/* Section 1: Consolidated Table by Supplier */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#53383e]" />
            Consolidado por Fornecedor (Clique para abrir visão detalhada)
          </h3>
          <span className="text-[11px] text-slate-500">{supplierRows.length} fornecedor(es)</span>
        </div>

        {supplierRows.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <BarChart3 className="w-9 h-9 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              Nenhuma compra concluída encontrada no período
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Conclua importações de NF-e XML ou Importação Universal para visualizar o consolidado por fornecedor, ranking de itens e histórico de custos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3.5 font-bold">Fornecedor</th>
                  <th className="py-2.5 px-3.5 font-bold text-right">Total Gasto</th>
                  <th className="py-2.5 px-3.5 font-bold w-40">% Participação</th>
                  <th className="py-2.5 px-3.5 font-bold text-center">Importações</th>
                  <th className="py-2.5 px-3.5 font-bold text-right">Unid. Convertidas</th>
                  <th className="py-2.5 px-3.5 font-bold text-center">Última Entrada</th>
                  <th className="py-2.5 px-3.5 font-bold text-right">Ticket Médio</th>
                  <th className="py-2.5 px-3.5 font-bold text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierRows.map((row) => (
                  <tr
                    key={row.supplierKey}
                    onClick={() => setSelectedSupplierDetail(row)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-3.5">
                      <div className="font-bold text-slate-900">{row.supplierName}</div>
                      {row.supplierCnpj && (
                        <div className="text-[10px] font-mono text-slate-500">{row.supplierCnpj}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                      {formatBRL(row.totalSpent)}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(2, row.sharePercent))}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-slate-700 w-12 text-right">
                          {row.sharePercent.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 text-center font-mono font-bold text-slate-700">
                      {row.importsCount}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-emerald-700">
                      {formatQuantityClean(row.convertedUnits)}
                    </td>
                    <td className="py-2.5 px-3.5 text-center text-slate-600">
                      {row.lastImportDate ? formatDateBR(row.lastImportDate) : '—'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono text-slate-700">
                      {formatBRL(row.avgTicket)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSupplierDetail(row);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Ranking de Itens Mais Importados */}
      {productRanking.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600" />
              Ranking de Itens Mais Importados
            </h3>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-500">Ordenar por:</span>
              <button
                type="button"
                onClick={() => setRankingSortBy('spend')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                  rankingSortBy === 'spend'
                    ? 'bg-[#53383e] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Valor Total (R$)
              </button>
              <button
                type="button"
                onClick={() => setRankingSortBy('qty')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                  rankingSortBy === 'qty'
                    ? 'bg-[#53383e] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Unidades Convertidas
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="py-2 px-3.5 font-bold w-10">#</th>
                  <th className="py-2 px-3.5 font-bold">Produto no Estoque</th>
                  <th className="py-2 px-3.5 font-bold text-center">Compras</th>
                  <th className="py-2 px-3.5 font-bold text-right">Total Convertido</th>
                  <th className="py-2 px-3.5 font-bold text-right">Custo Médio Conv.</th>
                  <th className="py-2 px-3.5 font-bold text-right">Último Custo Conv.</th>
                  <th className="py-2 px-3.5 font-bold text-right">Total Gasto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productRanking.slice(0, 25).map((item, idx) => (
                  <tr
                    key={item.key}
                    onClick={() => setCostHistoryProductKey(item.key)}
                    className="hover:bg-slate-50/80 cursor-pointer"
                    title="Clique para filtrar o Histórico de Custos deste produto"
                  >
                    <td className="py-2 px-3.5 font-mono font-bold text-slate-500">{idx + 1}º</td>
                    <td className="py-2 px-3.5">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-[10px] font-mono text-slate-500">{item.productCode}</div>
                    </td>
                    <td className="py-2 px-3.5 text-center font-mono">{item.purchasesCount}</td>
                    <td className="py-2 px-3.5 text-right font-mono font-bold text-emerald-700">
                      {formatQuantityClean(item.totalConvertedQty)} {item.stockUnit}
                    </td>
                    <td className="py-2 px-3.5 text-right font-mono text-slate-700">
                      {formatBRL(item.avgEffectiveUnitCost)}
                    </td>
                    <td className="py-2 px-3.5 text-right font-mono font-semibold text-blue-700">
                      {formatBRL(item.lastEffectiveUnitCost)}
                    </td>
                    <td className="py-2 px-3.5 text-right font-mono font-bold text-slate-900">
                      {formatBRL(item.totalEffectiveSpend)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 3: Histórico de Custos Unitários Convertidos */}
      {costHistoryEntries.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Histórico de Custos Unitários Convertidos ao Longo das Compras
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Acompanhe a variação do custo unitário efetivo já convertido na unidade do estoque (incluindo rateio de frete/encargos/descontos).
              </p>
            </div>
            <select
              value={costHistoryProductKey}
              onChange={(e) => setCostHistoryProductKey(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg max-w-xs"
            >
              <option value="all">Todos os itens ({productRanking.length})</option>
              {productRanking.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.productCode} — {p.productName}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="py-2 px-3.5 font-bold">Data</th>
                  <th className="py-2 px-3.5 font-bold">Produto</th>
                  <th className="py-2 px-3.5 font-bold">Fornecedor / Doc.</th>
                  <th className="py-2 px-3.5 font-bold text-right">Entrada & Conversão</th>
                  <th className="py-2 px-3.5 font-bold text-right">Custo Unit. Conv.</th>
                  <th className="py-2 px-3.5 font-bold text-right">Variação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {costHistoryEntries.slice(0, 80).map((entry) => {
                  const varPct = entry.variationPercent;
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3.5 whitespace-nowrap text-slate-600">
                        {formatDateBR(entry.date)}
                      </td>
                      <td className="py-2 px-3.5">
                        <div className="font-bold text-slate-900">{entry.productName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{entry.productCode}</div>
                      </td>
                      <td className="py-2 px-3.5">
                        <div className="font-semibold text-slate-800">{entry.supplierName}</div>
                        <div className="text-[10px] text-slate-500">{entry.referenceCode}</div>
                      </td>
                      <td className="py-2 px-3.5 text-right font-mono text-[11px] whitespace-nowrap">
                        <span>
                          {formatQuantityClean(entry.importedQuantity)} {entry.supplierUnit}
                        </span>
                        <span className="text-slate-400 mx-1">×{formatQuantityClean(entry.conversionFactor)}</span>
                        <strong className="text-emerald-700">
                          = {formatQuantityClean(entry.convertedQuantity)} {entry.stockUnit}
                        </strong>
                      </td>
                      <td className="py-2 px-3.5 text-right font-mono font-bold text-blue-800 whitespace-nowrap">
                        {formatBRL(entry.effectiveUnitCost)} / {entry.stockUnit}
                      </td>
                      <td className="py-2 px-3.5 text-right font-mono whitespace-nowrap">
                        {varPct === undefined ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                            Base
                          </span>
                        ) : Math.abs(varPct) < 0.05 ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                            Estável (0%)
                          </span>
                        ) : varPct > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            <ArrowUpRight className="w-3 h-3" />+{varPct.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <ArrowDownRight className="w-3 h-3" />
                            {varPct.toFixed(1)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier Drill-Down Modal */}
      {selectedSupplierDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedSupplierDetail(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#53383e]" />
                  {selectedSupplierDetail.supplierName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedSupplierDetail.supplierCnpj
                    ? `CNPJ: ${selectedSupplierDetail.supplierCnpj} · `
                    : ''}
                  {selectedSupplierDetail.importsCount} importação(ões) concluída(s) · Participação:{' '}
                  {selectedSupplierDetail.sharePercent.toFixed(1)}%
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSupplierDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="text-[10px] font-bold uppercase text-blue-700">Total Gasto</div>
                  <div className="text-base font-bold font-mono text-blue-950 mt-0.5">
                    {formatBRL(selectedSupplierDetail.totalSpent)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Ticket Médio</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                    {formatBRL(selectedSupplierDetail.avgTicket)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] font-bold uppercase text-emerald-700">Unid. Convertidas</div>
                  <div className="text-base font-bold font-mono text-emerald-950 mt-0.5">
                    {formatQuantityClean(selectedSupplierDetail.convertedUnits)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Última Entrada</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedSupplierDetail.lastImportDate
                      ? formatDateBR(selectedSupplierDetail.lastImportDate)
                      : '—'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Importações Concluídas deste Fornecedor
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-500">
                        <th className="py-2 px-3 font-bold">Emissão</th>
                        <th className="py-2 px-3 font-bold">Referência</th>
                        <th className="py-2 px-3 font-bold">Itens Ativos</th>
                        <th className="py-2 px-3 font-bold text-right">Mercadorias</th>
                        <th className="py-2 px-3 font-bold text-right">Encargos / Desc.</th>
                        <th className="py-2 px-3 font-bold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedSupplierDetail.records
                        .slice()
                        .sort((a, b) => (b.emissionDate || '').localeCompare(a.emissionDate || ''))
                        .map((rec) => {
                          const extras =
                            (rec.freightTotal || 0) +
                            (rec.insuranceTotal || 0) +
                            (rec.otherExpensesTotal || 0) -
                            (rec.discountTotal || 0);
                          return (
                            <tr key={rec.id}>
                              <td className="py-2 px-3 whitespace-nowrap">
                                {formatDateBR(rec.emissionDate)}
                              </td>
                              <td className="py-2 px-3 font-bold text-slate-900">{rec.referenceCode}</td>
                              <td className="py-2 px-3 text-slate-600">
                                {rec.linkedCount + rec.createdCount} item(ns)
                              </td>
                              <td className="py-2 px-3 text-right font-mono">
                                {formatBRL(rec.productsTotal)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-slate-600">
                                {extras >= 0 ? `+${formatBRL(extras)}` : formatBRL(extras)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                {formatBRL(getScopedRecordTotal(rec))}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSupplierDetail(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
