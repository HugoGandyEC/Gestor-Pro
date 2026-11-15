import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  BarChart2,
  TrendingUp,
  PieChart as PieChartIcon,
  Layers,
  Calendar,
  Users,
  Building,
  UserSquare2,
  DollarSign
} from 'lucide-react';
import { useApp, formatBRL } from '../context/AppContext';

export type ChartModelType = 'colunas' | 'barras' | 'linha' | 'rosca' | 'empilhado';
type AnalyticsScope = 'todos' | 'clientes' | 'fornecedores' | 'funcionarios' | 'financeiro';

interface ChartDatum {
  label: string;
  shortLabel?: string;
  value: number;
  color: string;
  hint?: string;
}

const CHART_COLORS = [
  '#53383e', // Vinho primário
  '#2563eb', // Azul corporativo
  '#16a34a', // Verde nominal
  '#d97706', // Âmbar alerta
  '#7c3aed', // Violeta
  '#0891b2', // Ciano
  '#dc2626', // Carmesim
  '#475569'  // Ardósia
];

const CHART_MODELS: { id: ChartModelType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'colunas', label: 'Colunas', icon: BarChart3 },
  { id: 'barras', label: 'Barras', icon: BarChart2 },
  { id: 'linha', label: 'Linha / Área', icon: TrendingUp },
  { id: 'rosca', label: 'Rosca / Pizza', icon: PieChartIcon },
  { id: 'empilhado', label: 'Proporção', icon: Layers }
];

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'Pix Instantâneo',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  dinheiro: 'Dinheiro',
  boleto: 'Boleto / Faturado',
  transferencia: 'Transferência / TED'
};

interface FlexibleChartCardProps {
  id: string;
  title: string;
  subtitle: string;
  data: ChartDatum[];
  formatValue: (val: number) => string;
  globalModel: ChartModelType;
  overrideModel?: ChartModelType;
  onOverrideChange: (id: string, model: ChartModelType) => void;
  summaryRight?: string;
}

const FlexibleChartCard: React.FC<FlexibleChartCardProps> = ({
  id,
  title,
  subtitle,
  data,
  formatValue,
  globalModel,
  overrideModel,
  onOverrideChange,
  summaryRight
}) => {
  const activeModel = overrideModel || globalModel;
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const safeData = useMemo(() => {
    return data.map((d, i) => ({
      ...d,
      value: Number.isFinite(d.value) ? Math.max(0, d.value) : 0,
      color: d.color || CHART_COLORS[i % CHART_COLORS.length]
    }));
  }, [data]);

  const total = useMemo(() => safeData.reduce((acc, d) => acc + d.value, 0), [safeData]);
  const maxVal = useMemo(() => Math.max(...safeData.map(d => d.value), 1), [safeData]);

  // SVG coordinates for Donut/Pie
  const donutSegments = useMemo(() => {
    const radius = 64;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    return safeData.map((item) => {
      const ratio = total > 0 ? item.value / total : 0;
      const strokeLength = ratio * circumference;
      const seg = {
        ...item,
        ratio,
        strokeLength,
        dashArray: `${strokeLength} ${circumference - strokeLength}`,
        dashOffset: -offset
      };
      offset += strokeLength;
      return seg;
    });
  }, [safeData, total]);

  // SVG coordinates for Line/Area chart
  const lineGeometry = useMemo(() => {
    const w = 520;
    const h = 210;
    const padX = 36;
    const padTop = 24;
    const padBottom = 38;
    const chartH = h - padTop - padBottom;
    const chartW = w - padX * 2;
    const count = safeData.length;

    const pts = safeData.map((d, idx) => {
      const x = count <= 1 ? padX + chartW / 2 : padX + (idx * chartW) / (count - 1);
      const y = padTop + chartH - (d.value / maxVal) * chartH;
      return { x, y, item: d, idx };
    });

    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaPath = pts.length > 0
      ? `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`
      : '';

    return { w, h, padX, padTop, padBottom, chartH, pts, linePath, areaPath };
  }, [safeData, maxVal]);

  const hoveredItem = hoveredIdx !== null ? safeData[hoveredIdx] : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
      {/* Header + Per-card Model Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 leading-snug">{title}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {summaryRight && (
            <span className="text-xs font-mono font-bold text-slate-900 tabular-nums mr-1">
              {summaryRight}
            </span>
          )}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {CHART_MODELS.map((m) => {
              const Icon = m.icon;
              const isSelected = activeModel === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onOverrideChange(id, m.id)}
                  title={`Modelo: ${m.label}`}
                  aria-label={`${title} - ${m.label}`}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#53383e] text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden 2xl:inline">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hover Readout Strip (clean inline telemetry) */}
      <div className="min-h-[26px] flex items-center justify-between text-xs px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
        {hoveredItem ? (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-xs shrink-0"
                style={{ backgroundColor: hoveredItem.color }}
              />
              <span className="font-semibold text-slate-800 truncate">{hoveredItem.label}</span>
              {hoveredItem.hint && (
                <span className="text-slate-400 truncate hidden sm:inline">· {hoveredItem.hint}</span>
              )}
            </div>
            <div className="font-mono font-bold text-slate-900 tabular-nums shrink-0 ml-2">
              {formatValue(hoveredItem.value)}
              {total > 0 && (
                <span className="text-slate-500 font-normal ml-1.5">
                  ({((hoveredItem.value / total) * 100).toFixed(1)}%)
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <span className="text-slate-500">Passe o cursor ou toque em um item para inspecionar os valores</span>
            <span className="font-mono font-semibold text-slate-700 tabular-nums">
              Total: {formatValue(total)}
            </span>
          </>
        )}
      </div>

      {/* Chart Body */}
      {safeData.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Nenhum dado registrado para este recorte.
        </div>
      ) : activeModel === 'colunas' ? (
        <div className="w-full">
          <div className="h-56 flex items-end gap-2 sm:gap-3 pt-6 pb-1 px-1 border-b border-slate-200">
            {safeData.map((d, idx) => {
              const heightPct = maxVal > 0 ? Math.max(d.value > 0 ? 5 : 1, (d.value / maxVal) * 100) : 1;
              const isHovered = hoveredIdx === idx;
              return (
                <div
                  key={`${d.label}-${idx}`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx(idx === hoveredIdx ? null : idx)}
                  className="flex-1 h-full flex flex-col items-center justify-end gap-1 min-w-0 cursor-pointer group"
                >
                  <span className="text-[10px] font-mono font-semibold text-slate-600 tabular-nums truncate max-w-full">
                    {formatValue(d.value)}
                  </span>
                  <div className="w-full max-w-[48px] flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-md transition-all duration-300"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: d.color,
                        opacity: hoveredIdx !== null && !isHovered ? 0.55 : 1
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-start gap-2 sm:gap-3 pt-2 px-1">
            {safeData.map((d, idx) => (
              <div key={`${d.label}-lbl-${idx}`} className="flex-1 min-w-0 text-center">
                <span className="text-[11px] font-medium text-slate-600 block truncate" title={d.label}>
                  {d.shortLabel || d.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : activeModel === 'barras' ? (
        <div className="space-y-3 py-1">
          {safeData.map((d, idx) => {
            const widthPct = maxVal > 0 ? Math.max(d.value > 0 ? 3 : 0, (d.value / maxVal) * 100) : 0;
            const sharePct = total > 0 ? (d.value / total) * 100 : 0;
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={`${d.label}-${idx}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setHoveredIdx(idx === hoveredIdx ? null : idx)}
                className="space-y-1 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className={`font-medium truncate ${isHovered ? 'text-slate-950 font-semibold' : 'text-slate-700'}`}>
                    {d.label}
                  </span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums shrink-0">
                    {formatValue(d.value)}
                    <span className="text-[10px] font-normal text-slate-400 ml-1.5">
                      ({sharePct.toFixed(0)}%)
                    </span>
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md transition-all duration-300"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: d.color,
                      opacity: hoveredIdx !== null && !isHovered ? 0.55 : 1
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : activeModel === 'linha' ? (
        <div className="w-full">
          <svg
            viewBox={`0 0 ${lineGeometry.w} ${lineGeometry.h}`}
            className="w-full h-56 overflow-visible"
            role="img"
            aria-label={title}
          >
            <defs>
              <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={safeData[0]?.color || '#53383e'} stopOpacity="0.28" />
                <stop offset="100%" stopColor={safeData[0]?.color || '#53383e'} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((step) => {
              const y = lineGeometry.padTop + lineGeometry.chartH * (1 - step);
              return (
                <line
                  key={step}
                  x1={lineGeometry.padX}
                  x2={lineGeometry.w - lineGeometry.padX}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={step === 0 ? undefined : '4 4'}
                  strokeWidth="1"
                />
              );
            })}

            {/* Area */}
            {lineGeometry.areaPath && (
              <path d={lineGeometry.areaPath} fill={`url(#grad-${id})`} />
            )}

            {/* Line */}
            {lineGeometry.linePath && (
              <path
                d={lineGeometry.linePath}
                fill="none"
                stroke="#53383e"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {/* Points & Labels */}
            {lineGeometry.pts.map(({ x, y, item, idx }) => {
              const isHovered = hoveredIdx === idx;
              return (
                <g
                  key={`${item.label}-${idx}`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx(idx === hoveredIdx ? null : idx)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 7 : 4.5}
                    fill={item.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y={y - 10}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#334155"
                    className="font-mono"
                  >
                    {formatValue(item.value)}
                  </text>
                  <text
                    x={x}
                    y={lineGeometry.h - 10}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748b"
                  >
                    {(item.shortLabel || item.label).slice(0, 12)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : activeModel === 'rosca' ? (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center py-1">
          <div className="sm:col-span-5 flex items-center justify-center">
            <svg viewBox="0 0 180 180" className="w-44 h-44" role="img" aria-label={title}>
              <circle
                cx="90"
                cy="90"
                r="64"
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="26"
              />
              {total > 0 && donutSegments.map((seg, idx) => {
                const isHovered = hoveredIdx === idx;
                return (
                  <circle
                    key={`${seg.label}-${idx}`}
                    cx="90"
                    cy="90"
                    r="64"
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={isHovered ? 30 : 26}
                    strokeDasharray={seg.dashArray}
                    strokeDashoffset={seg.dashOffset}
                    transform="rotate(-90 90 90)"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => setHoveredIdx(idx === hoveredIdx ? null : idx)}
                    style={{
                      opacity: hoveredIdx !== null && !isHovered ? 0.55 : 1,
                      transition: 'stroke-width 0.15s ease, opacity 0.15s ease'
                    }}
                    className="cursor-pointer"
                  />
                );
              })}
              <text
                x="90"
                y="84"
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
                fontWeight="600"
              >
                {hoveredItem ? (hoveredItem.shortLabel || hoveredItem.label).slice(0, 14) : 'TOTAL'}
              </text>
              <text
                x="90"
                y="102"
                textAnchor="middle"
                fontSize="12"
                fill="#0f172a"
                fontWeight="700"
                className="font-mono"
              >
                {hoveredItem ? formatValue(hoveredItem.value) : formatValue(total)}
              </text>
            </svg>
          </div>

          <div className="sm:col-span-7 space-y-2">
            {safeData.map((d, idx) => {
              const pct = total > 0 ? (d.value / total) * 100 : 0;
              const isHovered = hoveredIdx === idx;
              return (
                <div
                  key={`${d.label}-leg-${idx}`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx(idx === hoveredIdx ? null : idx)}
                  className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    isHovered ? 'bg-slate-50 border-slate-300' : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-slate-700 font-medium truncate">{d.label}</span>
                  </div>
                  <div className="font-mono tabular-nums shrink-0 text-right">
                    <span className="font-bold text-slate-900">{formatValue(d.value)}</span>
                    <span className="text-slate-400 text-[11px] ml-1.5">({pct.toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 'empilhado' - 100% Proportional Stacked Strip + Table */
        <div className="space-y-4 py-1">
          <div className="w-full h-8 rounded-lg overflow-hidden flex border border-slate-200 bg-slate-100">
            {total > 0 ? (
              safeData.map((d, idx) => {
                const pct = (d.value / total) * 100;
                if (pct <= 0) return null;
                const isHovered = hoveredIdx === idx;
                return (
                  <div
                    key={`${d.label}-stack-${idx}`}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => setHoveredIdx(idx === hoveredIdx ? null : idx)}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: d.color,
                      opacity: hoveredIdx !== null && !isHovered ? 0.6 : 1
                    }}
                    className="h-full transition-all duration-200 cursor-pointer flex items-center justify-center text-[10px] font-mono font-bold text-white"
                    title={`${d.label}: ${formatValue(d.value)} (${pct.toFixed(1)}%)`}
                  >
                    {pct >= 11 ? `${pct.toFixed(0)}%` : ''}
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-400">
                Sem valores acumulados
              </div>
            )}
          </div>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
            {safeData.map((d, idx) => {
              const pct = total > 0 ? (d.value / total) * 100 : 0;
              return (
                <div
                  key={`${d.label}-row-${idx}`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="font-medium text-slate-800 truncate">{d.label}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono tabular-nums shrink-0">
                    <span className="text-slate-500">{pct.toFixed(1)}%</span>
                    <span className="font-bold text-slate-900">{formatValue(d.value)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const AnalyticsChartsView: React.FC = () => {
  const {
    clients,
    suppliers,
    employees,
    serviceOrders,
    directSales,
    generalExpenses,
    vehicleExpenses,
    vehicles,
    monthlyFinancialSummary,
    selectedMonthYear,
    setSelectedMonthYear
  } = useApp();

  const [globalModel, setGlobalModel] = useState<ChartModelType>('colunas');
  const [chartOverrides, setChartOverrides] = useState<Record<string, ChartModelType>>({});
  const [scope, setScope] = useState<AnalyticsScope>('todos');
  const [financialWindow, setFinancialWindow] = useState<'mes' | 'geral'>('mes');

  const handleGlobalModelChange = (model: ChartModelType) => {
    setGlobalModel(model);
    setChartOverrides({});
  };

  const handleOverrideChange = (id: string, model: ChartModelType) => {
    setChartOverrides(prev => ({ ...prev, [id]: model }));
  };

  // =========================================================================
  // 1. INDICADORES DE CLIENTES (Removidos da tela de Cadastro de Clientes)
  // =========================================================================
  const clientMetrics = useMemo(() => {
    const totalClientes = clients.length;
    const pjCount = clients.filter(c => c.personType === 'PJ' || c.document.replace(/\D/g, '').length === 14).length;
    const pfCount = clients.filter(c => c.personType === 'PF' || c.document.replace(/\D/g, '').length !== 14).length;
    const atacadoCount = clients.filter(c => c.customerType === 'atacado').length;
    const varejoCount = clients.filter(c => (c.customerType || 'varejo') === 'varejo').length;

    const openOsClientIds = new Set(
      serviceOrders
        .filter(os => !['entregue_finalizada', 'cancelada'].includes(os.status))
        .map(os => os.clientId)
    );
    const inAttendanceClientIds = new Set(
      serviceOrders
        .filter(os => ['aprovada_em_andamento', 'aguardando_pecas'].includes(os.status))
        .map(os => os.clientId)
    );

    const comOsEmAberto = clients.filter(c => openOsClientIds.has(c.id)).length;
    const emAtendimento = clients.filter(c => inAttendanceClientIds.has(c.id)).length;

    const cityMap: Record<string, number> = {};
    clients.forEach(c => {
      const cityLabel = c.city ? `${c.city}${c.state ? `/${c.state}` : ''}` : 'Não informada';
      cityMap[cityLabel] = (cityMap[cityLabel] || 0) + 1;
    });

    const byCity: ChartDatum[] = Object.entries(cityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value], i) => ({
        label,
        shortLabel: label.split('/')[0],
        value,
        color: CHART_COLORS[i % CHART_COLORS.length]
      }));

    return {
      totalClientes,
      pjCount,
      pfCount,
      atacadoCount,
      varejoCount,
      comOsEmAberto,
      emAtendimento,
      byCity
    };
  }, [clients, serviceOrders]);

  // =========================================================================
  // 2. INDICADORES DE FORNECEDORES (Removidos da tela de Fornecedores)
  // =========================================================================
  const supplierMetrics = useMemo(() => {
    const totalFornecedores = suppliers.length;

    const pendingExpenses = generalExpenses.filter(e => !e.isPaid);
    const totalEmAbertoGeral = pendingExpenses.reduce((acc, e) => acc + Number(e.cost || 0), 0);

    const supplierIdsWithPayables = new Set(
      pendingExpenses.filter(e => e.supplierId).map(e => e.supplierId)
    );
    const comContasAPagar = suppliers.filter(s => supplierIdsWithPayables.has(s.id)).length;
    const semPendencias = Math.max(0, totalFornecedores - comContasAPagar);

    // Linha Principal (derivada das notas/especialidades dos fornecedores ou agrupada)
    const lineCounts: Record<string, number> = {};
    suppliers.forEach(s => {
      const note = (s.notes || '').toLowerCase();
      let linha = 'Tanques & Peças';
      if (note.includes('bomba') || note.includes('filtro') || note.includes('piscina')) {
        linha = 'Bombas & Piscinas';
      } else if (note.includes('solar') || note.includes('coletor') || note.includes('aquec')) {
        linha = 'Aquecimento & Solar';
      } else if (note.includes('valvul') || note.includes('tub') || note.includes('hidraul')) {
        linha = 'Hidráulica & Válvulas';
      } else if (note.includes('eletr') || note.includes('auto') || note.includes('led')) {
        linha = 'Elétrica & Automação';
      }
      lineCounts[linha] = (lineCounts[linha] || 0) + 1;
    });

    const topLine = Object.entries(lineCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Tanques & Peças';

    // Contas a pagar abertas por fornecedor / descrição
    const openBySupplierMap: Record<string, number> = {};
    pendingExpenses.forEach(e => {
      const sup = suppliers.find(s => s.id === e.supplierId);
      const label = sup ? (sup.tradeName || sup.name) : (e.category || 'Despesas Gerais');
      openBySupplierMap[label] = (openBySupplierMap[label] || 0) + Number(e.cost || 0);
    });

    const openBySupplierChart: ChartDatum[] = Object.entries(openBySupplierMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value], i) => ({
        label,
        shortLabel: label.slice(0, 14),
        value,
        color: CHART_COLORS[i % CHART_COLORS.length]
      }));

    const lineChart: ChartDatum[] = Object.entries(lineCounts).map(([label, value], i) => ({
      label,
      shortLabel: label.split('&')[0].trim(),
      value,
      color: CHART_COLORS[i % CHART_COLORS.length]
    }));

    return {
      totalFornecedores,
      comContasAPagar,
      semPendencias,
      totalEmAbertoGeral,
      topLine,
      openBySupplierChart,
      lineChart
    };
  }, [suppliers, generalExpenses]);

  // =========================================================================
  // 3. INDICADORES DE FOLHA / FUNCIONÁRIOS (Removidos de EmployeesView)
  // =========================================================================
  const payrollMetrics = useMemo(() => {
    const salariosBaseNominais = employees.reduce((acc, e) => acc + Number(e.baseSalary || 0), 0);
    const encargosBeneficios = employees.reduce((acc, e) => acc + Number(e.benefitsCharges || 0), 0);
    const custoTotalFolhaMensal = salariosBaseNominais + encargosBeneficios;

    const perEmployeeChart: ChartDatum[] = employees.map((emp, i) => ({
      label: emp.name,
      shortLabel: emp.name.split(' ')[0],
      value: Number(emp.baseSalary || 0) + Number(emp.benefitsCharges || 0),
      color: CHART_COLORS[i % CHART_COLORS.length],
      hint: `Base ${formatBRL(emp.baseSalary)} + Enc. ${formatBRL(emp.benefitsCharges)}`
    }));

    const compositionChart: ChartDatum[] = [
      { label: 'Salários Base Nominais', shortLabel: 'Salários Base', value: salariosBaseNominais, color: '#2563eb' },
      { label: 'Encargos & Benefícios (INSS/FGTS)', shortLabel: 'Encargos', value: encargosBeneficios, color: '#dc2626' }
    ];

    return {
      custoTotalFolhaMensal,
      salariosBaseNominais,
      encargosBeneficios,
      perEmployeeChart,
      compositionChart
    };
  }, [employees]);

  // =========================================================================
  // 4. INDICADORES FINANCEIROS COMPLETOS (Mês Selecionado ou Visão Geral)
  // =========================================================================
  const financialAnalytics = useMemo(() => {
    const isAllMonths = financialWindow === 'geral';

    const ordersScope = serviceOrders.filter(o => {
      if (o.status === 'cancelada') return false;
      if (isAllMonths) return true;
      return (o.completionDate || o.openDate).startsWith(selectedMonthYear);
    });

    const salesScope = directSales.filter(s => (isAllMonths ? true : s.date.startsWith(selectedMonthYear)));
    const expensesScope = generalExpenses.filter(g => (isAllMonths ? true : g.dueDate.startsWith(selectedMonthYear)));
    const fleetScope = vehicleExpenses.filter(v => (isAllMonths ? true : v.date.startsWith(selectedMonthYear)));

    const getOsTotal = (o: typeof serviceOrders[number]) => {
      const srv = o.services.reduce((a, b) => a + Number(b.price || 0), 0);
      const prt = o.parts.reduce((a, b) => a + Number(b.price || 0) * Number(b.quantity || 1), 0);
      return Math.max(0, srv + prt + Number(o.visitFee || 0) - Number(o.calculatedDiscount || 0));
    };

    const osPaidValue = ordersScope.filter(o => o.paymentStatus === 'pago').reduce((a, o) => a + getOsTotal(o), 0);
    const osPendingValue = ordersScope.filter(o => o.paymentStatus !== 'pago').reduce((a, o) => a + getOsTotal(o), 0);
    const salesPaidValue = salesScope.filter(s => s.paymentStatus === 'pago').reduce((a, s) => a + Number(s.total || 0), 0);
    const salesPendingValue = salesScope.filter(s => s.paymentStatus !== 'pago').reduce((a, s) => a + Number(s.total || 0), 0);

    const totalRevenue = isAllMonths
      ? osPaidValue + osPendingValue + salesPaidValue + salesPendingValue
      : monthlyFinancialSummary.totalRevenue;

    const totalPartsCost = isAllMonths
      ? ordersScope.reduce((acc, o) => acc + o.parts.reduce((a, p) => a + Number(p.cost || 0) * Number(p.quantity || 1), 0), 0) +
        salesScope.reduce((acc, s) => acc + s.items.reduce((a, it) => a + Number(it.cost || 0) * Number(it.quantity || 1), 0), 0)
      : monthlyFinancialSummary.totalPartsCost;

    const totalPersonnelCost = isAllMonths
      ? payrollMetrics.custoTotalFolhaMensal
      : monthlyFinancialSummary.totalPersonnelCost;

    const totalVehicleCost = isAllMonths
      ? fleetScope.reduce((a, f) => a + Number(f.cost || 0), 0) +
        vehicles.reduce((a, v) => a + (Number(v.annualIpvaValue || 0) + Number(v.annualInsuranceValue || 0)) / 12, 0)
      : monthlyFinancialSummary.totalVehicleCost;

    const totalOperationalCost = isAllMonths
      ? expensesScope.reduce((a, g) => a + Number(g.cost || 0), 0)
      : monthlyFinancialSummary.totalOperationalCost;

    const totalCardFees = isAllMonths
      ? ordersScope.reduce((acc, o) => acc + (o.payments || []).reduce((a, p) => a + Number(p.rateAmount || 0), 0), 0) +
        salesScope.reduce((acc, s) => acc + (s.payments || []).reduce((a, p) => a + Number(p.rateAmount || 0), 0), 0)
      : monthlyFinancialSummary.totalCardFees;

    const totalCosts = totalPartsCost + totalPersonnelCost + totalVehicleCost + totalOperationalCost + totalCardFees;
    const netProfit = totalRevenue - totalCosts;
    const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const pendingReceivables = osPendingValue + salesPendingValue;
    const receivedTotal = osPaidValue + salesPaidValue;
    const payablesPaid = expensesScope.filter(e => e.isPaid).reduce((a, e) => a + Number(e.cost || 0), 0);
    const payablesPending = expensesScope.filter(e => !e.isPaid).reduce((a, e) => a + Number(e.cost || 0), 0);

    // Formas de Pagamento reais
    const paymentMethodTotals: Record<string, number> = {};
    ordersScope.forEach(o => {
      if (o.payments && o.payments.length > 0) {
        o.payments.forEach(p => {
          paymentMethodTotals[p.method] = (paymentMethodTotals[p.method] || 0) + Number(p.amount || 0);
        });
      } else {
        const tot = getOsTotal(o);
        if (tot > 0) paymentMethodTotals['pix'] = (paymentMethodTotals['pix'] || 0) + tot;
      }
    });
    salesScope.forEach(s => {
      if (s.payments && s.payments.length > 0) {
        s.payments.forEach(p => {
          paymentMethodTotals[p.method] = (paymentMethodTotals[p.method] || 0) + Number(p.amount || 0);
        });
      } else if (s.total > 0) {
        paymentMethodTotals[s.paymentMethod || 'pix'] = (paymentMethodTotals[s.paymentMethod || 'pix'] || 0) + Number(s.total || 0);
      }
    });

    const paymentMethodsChart: ChartDatum[] = Object.entries(paymentMethodTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([method, value], i) => ({
        label: PAYMENT_LABELS[method] || method.toUpperCase(),
        shortLabel: (PAYMENT_LABELS[method] || method).split(' ')[0],
        value,
        color: CHART_COLORS[i % CHART_COLORS.length]
      }));

    // Despesas Operacionais & Frota por Categoria
    const categoryTotals: Record<string, number> = {};
    expensesScope.forEach(e => {
      const cat = e.category || 'Outros Fixos';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.cost || 0);
    });
    const fleetSum = fleetScope.reduce((a, f) => a + Number(f.cost || 0), 0);
    if (fleetSum > 0) {
      categoryTotals['Frota & Combustível'] = (categoryTotals['Frota & Combustível'] || 0) + fleetSum;
    }

    const expensesByCategoryChart: ChartDatum[] = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([label, value], i) => ({
        label,
        shortLabel: label.split('/')[0].slice(0, 13),
        value,
        color: CHART_COLORS[(i + 2) % CHART_COLORS.length]
      }));

    // Evolução Mensal (últimas competências presentes no sistema)
    const monthSet = new Set<string>([selectedMonthYear]);
    serviceOrders.forEach(o => {
      const ym = (o.completionDate || o.openDate || '').slice(0, 7);
      if (ym.length === 7) monthSet.add(ym);
    });
    directSales.forEach(s => {
      const ym = (s.date || '').slice(0, 7);
      if (ym.length === 7) monthSet.add(ym);
    });
    generalExpenses.forEach(g => {
      const ym = (g.dueDate || '').slice(0, 7);
      if (ym.length === 7) monthSet.add(ym);
    });

    const sortedMonths = Array.from(monthSet).sort().slice(-6);
    const monthlyEvolutionChart: ChartDatum[] = sortedMonths.map((ym, i) => {
      const revOs = serviceOrders
        .filter(o => o.status !== 'cancelada' && (o.completionDate || o.openDate).startsWith(ym))
        .reduce((a, o) => a + getOsTotal(o), 0);
      const revSales = directSales
        .filter(s => s.date.startsWith(ym))
        .reduce((a, s) => a + Number(s.total || 0), 0);
      const exp = generalExpenses
        .filter(g => g.dueDate.startsWith(ym))
        .reduce((a, g) => a + Number(g.cost || 0), 0);

      const [yr, mo] = ym.split('-');
      return {
        label: `Receita ${mo}/${yr} (Desp: ${formatBRL(exp)})`,
        shortLabel: `${mo}/${yr.slice(2)}`,
        value: revOs + revSales,
        color: CHART_COLORS[i % CHART_COLORS.length],
        hint: `Faturamento ${formatBRL(revOs + revSales)} · Despesas ${formatBRL(exp)}`
      };
    });

    return {
      totalRevenue,
      totalPartsCost,
      totalPersonnelCost,
      totalVehicleCost,
      totalOperationalCost,
      totalCardFees,
      totalCosts,
      netProfit,
      netMarginPercent,
      pendingReceivables,
      receivedTotal,
      payablesPaid,
      payablesPending,
      osPaidValue,
      osPendingValue,
      salesPaidValue,
      salesPendingValue,
      paymentMethodsChart,
      expensesByCategoryChart,
      monthlyEvolutionChart
    };
  }, [
    financialWindow,
    selectedMonthYear,
    serviceOrders,
    directSales,
    generalExpenses,
    vehicleExpenses,
    vehicles,
    monthlyFinancialSummary,
    payrollMetrics.custoTotalFolhaMensal
  ]);

  const showClients = scope === 'todos' || scope === 'clientes';
  const showSuppliers = scope === 'todos' || scope === 'fornecedores';
  const showEmployees = scope === 'todos' || scope === 'funcionarios';
  const showFinancial = scope === 'todos' || scope === 'financeiro';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#f6eff1] text-[#53383e] rounded-xl border border-slate-200 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Gráficos & Indicadores Gerenciais (BI)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Painel consolidado de Clientes, Fornecedores, Quadro de Funcionários e DRE Financeiro com troca dinâmica de modelos de gráfico.
            </p>
          </div>
        </div>

        {/* Global Controls: Month + Financial Window */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setFinancialWindow('mes')}
              className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                financialWindow === 'mes' ? 'bg-[#53383e] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Competência Mensal
            </button>
            <button
              type="button"
              onClick={() => setFinancialWindow('geral')}
              className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                financialWindow === 'geral' ? 'bg-[#53383e] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Acumulado Geral
            </button>
          </div>

          {financialWindow === 'mes' && (
            <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="month"
                value={selectedMonthYear}
                onChange={(e) => setSelectedMonthYear(e.target.value)}
                className="text-xs font-mono font-semibold text-slate-800 bg-transparent focus:outline-hidden"
                aria-label="Selecionar mês de referência"
              />
            </div>
          )}
        </div>
      </div>

      {/* Global Model Picker + Category Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Module Scope Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'todos' as AnalyticsScope, label: 'Todos os Painéis', icon: Layers },
            { id: 'clientes' as AnalyticsScope, label: 'Clientes', icon: UserSquare2 },
            { id: 'fornecedores' as AnalyticsScope, label: 'Fornecedores', icon: Building },
            { id: 'funcionarios' as AnalyticsScope, label: 'Funcionários & Folha', icon: Users },
            { id: 'financeiro' as AnalyticsScope, label: 'Financeiro & DRE', icon: DollarSign }
          ].map(tab => {
            const Icon = tab.icon;
            const active = scope === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setScope(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Chart Type Selector */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Modelo Global dos Gráficos:
          </span>
          <div className="inline-flex flex-wrap items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 gap-0.5">
            {CHART_MODELS.map((m) => {
              const Icon = m.icon;
              const isSelected = globalModel === m.id && Object.keys(chartOverrides).length === 0;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleGlobalModelChange(m.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    isSelected || (globalModel === m.id && Object.keys(chartOverrides).length > 0)
                      ? 'bg-[#53383e] text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 1: CLIENTES */}
      {showClients && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <UserSquare2 className="w-4 h-4 text-[#53383e]" />
              <span>Indicadores de Clientes</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">Total de Clientes</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {clientMetrics.totalClientes}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block tabular-nums">
                {clientMetrics.varejoCount} Varejo · {clientMetrics.atacadoCount} Atacado
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">Pessoa Jurídica (PJ)</span>
              <div className="text-2xl font-bold font-mono text-blue-700 mt-1 tabular-nums">
                {clientMetrics.pjCount}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Empresas e condomínios com CNPJ
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">Pessoa Física (PF)</span>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
                {clientMetrics.pfCount}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Clientes residenciais com CPF/RG
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">Com OS em Aberto</span>
              <div className="text-2xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
                {clientMetrics.comOsEmAberto}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block tabular-nums">
                Em atendimento: {clientMetrics.emAtendimento} cliente(s)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <FlexibleChartCard
              id="clients-profile"
              title="Clientes — Pessoa Jurídica, Física & Atendimento"
              subtitle="Comparativo entre tipo de pessoa, perfil comercial e ordens em atendimento"
              globalModel={globalModel}
              overrideModel={chartOverrides['clients-profile']}
              onOverrideChange={handleOverrideChange}
              formatValue={(v) => `${Math.round(v)}`}
              summaryRight={`${clientMetrics.totalClientes} cad.`}
              data={[
                { label: 'Total de Clientes', shortLabel: 'Total', value: clientMetrics.totalClientes, color: '#53383e' },
                { label: 'Pessoa Jurídica (PJ)', shortLabel: 'PJ', value: clientMetrics.pjCount, color: '#2563eb' },
                { label: 'Pessoa Física (PF)', shortLabel: 'PF', value: clientMetrics.pfCount, color: '#16a34a' },
                { label: 'Com OS em Aberto', shortLabel: 'OS Aberta', value: clientMetrics.comOsEmAberto, color: '#d97706' },
                { label: 'Em atendimento', shortLabel: 'Atendim.', value: clientMetrics.emAtendimento, color: '#7c3aed' }
              ]}
            />

            <FlexibleChartCard
              id="clients-cities"
              title="Distribuição Geográfica de Clientes"
              subtitle="Principais cidades / municípios atendidos"
              globalModel={globalModel}
              overrideModel={chartOverrides['clients-cities']}
              onOverrideChange={handleOverrideChange}
              formatValue={(v) => `${Math.round(v)}`}
              data={clientMetrics.byCity}
            />
          </div>
        </section>
      )}

      {/* SECTION 2: FORNECEDORES */}
      {showSuppliers && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-[#53383e]" />
              <span>Indicadores de Fornecedores</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">Total de Fornecedores</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {supplierMetrics.totalFornecedores}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">Empresas homologadas</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">Com Contas a Pagar</span>
              <div className="text-2xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
                {supplierMetrics.comContasAPagar}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">Fornecedores com títulos em aberto</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">Total em Aberto (Geral)</span>
              <div className="text-2xl font-bold font-mono text-rose-700 mt-1 tabular-nums">
                {formatBRL(supplierMetrics.totalEmAbertoGeral)}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">Contas a pagar da empresa</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">Linha Principal</span>
              <div className="text-lg font-bold text-slate-900 mt-1 truncate">
                {supplierMetrics.topLine}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">Aquecimento & Solar</span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <FlexibleChartCard
              id="suppliers-payables"
              title="Contas a Pagar em Aberto por Fornecedor / Centro"
              subtitle="Valores pendentes de quitação vinculados aos fornecedores"
              globalModel={globalModel}
              overrideModel={chartOverrides['suppliers-payables']}
              onOverrideChange={handleOverrideChange}
              formatValue={formatBRL}
              summaryRight={formatBRL(supplierMetrics.totalEmAbertoGeral)}
              data={supplierMetrics.openBySupplierChart}
            />

            <FlexibleChartCard
              id="suppliers-lines"
              title="Fornecedores por Linha de Fornecimento & Situação"
              subtitle="Segmentação de parceiros e status financeiro"
              globalModel={globalModel}
              overrideModel={chartOverrides['suppliers-lines']}
              onOverrideChange={handleOverrideChange}
              formatValue={(v) => `${Math.round(v)}`}
              data={[
                { label: 'Com Contas a Pagar', shortLabel: 'C/ Pendência', value: supplierMetrics.comContasAPagar, color: '#d97706' },
                { label: 'Sem Pendências Financeiras', shortLabel: 'Em Dia', value: supplierMetrics.semPendencias, color: '#16a34a' },
                ...supplierMetrics.lineChart
              ]}
            />
          </div>
        </section>
      )}

      {/* SECTION 3: QUADRO DE FUNCIONÁRIOS */}
      {showEmployees && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#53383e]" />
              <span>Quadro de Funcionários & Custos de Folha</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">Custo Total de Folha Mensal</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {formatBRL(payrollMetrics.custoTotalFolhaMensal)}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">Salários Base + Encargos Trabalhistas</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">Salários Base Nominais</span>
              <div className="text-2xl font-bold font-mono text-blue-700 mt-1 tabular-nums">
                {formatBRL(payrollMetrics.salariosBaseNominais)}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block tabular-nums">
                {employees.length} colaborador(es) cadastrado(s)
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">Encargos & Benefícios (INSS/FGTS)</span>
              <div className="text-2xl font-bold font-mono text-rose-700 mt-1 tabular-nums">
                {formatBRL(payrollMetrics.encargosBeneficios)}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block tabular-nums">
                {payrollMetrics.salariosBaseNominais > 0
                  ? `${((payrollMetrics.encargosBeneficios / payrollMetrics.salariosBaseNominais) * 100).toFixed(1)}% sobre a folha base`
                  : 'Sem salários base cadastrados'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <FlexibleChartCard
              id="employees-cost"
              title="Custo Mensal por Colaborador"
              subtitle="Soma de Salário Base + Encargos e Benefícios por integrante da equipe"
              globalModel={globalModel}
              overrideModel={chartOverrides['employees-cost']}
              onOverrideChange={handleOverrideChange}
              formatValue={formatBRL}
              summaryRight={formatBRL(payrollMetrics.custoTotalFolhaMensal)}
              data={payrollMetrics.perEmployeeChart}
            />

            <FlexibleChartCard
              id="employees-composition"
              title="Composição da Folha de Pagamento"
              subtitle="Proporção entre Salários Base Nominais e Encargos/Benefícios"
              globalModel={globalModel}
              overrideModel={chartOverrides['employees-composition']}
              onOverrideChange={handleOverrideChange}
              formatValue={formatBRL}
              data={payrollMetrics.compositionChart}
            />
          </div>
        </section>
      )}

      {/* SECTION 4: FINANCEIRO COMPLETO & DRE */}
      {showFinancial && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#53383e]" />
              <span>
                Indicadores Financeiros & DRE ({financialWindow === 'mes' ? `Competência ${selectedMonthYear}` : 'Acumulado Geral'})
              </span>
            </h2>
          </div>

          {/* Financial KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">Receita Bruta Total</span>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
                {formatBRL(financialAnalytics.totalRevenue)}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block tabular-nums">
                Recebido: {formatBRL(financialAnalytics.receivedTotal)}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">Custos & Despesas Totais</span>
              <div className="text-2xl font-bold font-mono text-rose-700 mt-1 tabular-nums">
                {formatBRL(financialAnalytics.totalCosts)}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block tabular-nums">
                CMV + Folha + Frota + Fixos + Taxas
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">Lucro Líquido (DRE)</span>
              <div className={`text-2xl font-bold font-mono mt-1 tabular-nums ${financialAnalytics.netProfit >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                {formatBRL(financialAnalytics.netProfit)}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block tabular-nums">
                Margem Líquida: {financialAnalytics.netMarginPercent.toFixed(1)}%
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">A Receber vs A Pagar (Pendentes)</span>
              <div className="text-lg font-bold font-mono text-slate-900 mt-1 tabular-nums">
                <span className="text-emerald-700">{formatBRL(financialAnalytics.pendingReceivables)}</span>
                <span className="text-slate-300 mx-1.5">/</span>
                <span className="text-amber-700">{formatBRL(financialAnalytics.payablesPending)}</span>
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Contas a Receber / Contas a Pagar
              </span>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <FlexibleChartCard
              id="fin-dre"
              title="DRE Gerencial — Receita vs Estrutura de Custos"
              subtitle="Detalhamento completo da composição financeira do período"
              globalModel={globalModel}
              overrideModel={chartOverrides['fin-dre']}
              onOverrideChange={handleOverrideChange}
              formatValue={formatBRL}
              data={[
                { label: 'Receita Bruta', shortLabel: 'Receita', value: financialAnalytics.totalRevenue, color: '#16a34a' },
                { label: 'Peças & Insumos (CMV)', shortLabel: 'CMV', value: financialAnalytics.totalPartsCost, color: '#0891b2' },
                { label: 'Folha & Encargos', shortLabel: 'Folha', value: financialAnalytics.totalPersonnelCost, color: '#2563eb' },
                { label: 'Frota & Veículos', shortLabel: 'Frota', value: financialAnalytics.totalVehicleCost, color: '#d97706' },
                { label: 'Despesas Operacionais', shortLabel: 'Despesas', value: financialAnalytics.totalOperationalCost, color: '#dc2626' },
                { label: 'Taxas de Cartão', shortLabel: 'Taxas', value: financialAnalytics.totalCardFees, color: '#7c3aed' },
                { label: 'Lucro Líquido', shortLabel: 'Lucro', value: Math.max(0, financialAnalytics.netProfit), color: '#53383e' }
              ]}
            />

            <FlexibleChartCard
              id="fin-evolution"
              title="Evolução Mensal de Faturamento"
              subtitle="Comparativo histórico por competência registrada no sistema"
              globalModel={globalModel}
              overrideModel={chartOverrides['fin-evolution']}
              onOverrideChange={handleOverrideChange}
              formatValue={formatBRL}
              data={financialAnalytics.monthlyEvolutionChart}
            />

            <FlexibleChartCard
              id="fin-receivables"
              title="Receitas por Canal & Contas a Receber"
              subtitle="Separação entre Ordens de Serviço, Vendas Diretas, Recebidos e Pendentes"
              globalModel={globalModel}
              overrideModel={chartOverrides['fin-receivables']}
              onOverrideChange={handleOverrideChange}
              formatValue={formatBRL}
              data={[
                { label: 'OS Liquidadas', shortLabel: 'OS Pagas', value: financialAnalytics.osPaidValue, color: '#16a34a' },
                { label: 'OS a Receber', shortLabel: 'OS Pendente', value: financialAnalytics.osPendingValue, color: '#d97706' },
                { label: 'Vendas Liquidadas', shortLabel: 'Vendas Pagas', value: financialAnalytics.salesPaidValue, color: '#2563eb' },
                { label: 'Vendas a Receber', shortLabel: 'Vendas Pend.', value: financialAnalytics.salesPendingValue, color: '#dc2626' }
              ]}
            />

            <FlexibleChartCard
              id="fin-payments"
              title="Faturamento por Forma de Pagamento"
              subtitle="Distribuição real de recebimentos entre Pix, Cartões, Dinheiro e Boleto"
              globalModel={globalModel}
              overrideModel={chartOverrides['fin-payments']}
              onOverrideChange={handleOverrideChange}
              formatValue={formatBRL}
              data={financialAnalytics.paymentMethodsChart}
            />

            <FlexibleChartCard
              id="fin-expenses-category"
              title="Despesas Operacionais & Frota por Categoria"
              subtitle="Maiores centros de custo e contas a pagar por classificação"
              globalModel={globalModel}
              overrideModel={chartOverrides['fin-expenses-category']}
              onOverrideChange={handleOverrideChange}
              formatValue={formatBRL}
              data={financialAnalytics.expensesByCategoryChart}
            />

            <FlexibleChartCard
              id="fin-payables-status"
              title="Fluxo de Contas a Pagar (Pago vs Pendente)"
              subtitle="Conciliação entre títulos quitados e títulos a vencer"
              globalModel={globalModel}
              overrideModel={chartOverrides['fin-payables-status']}
              onOverrideChange={handleOverrideChange}
              formatValue={formatBRL}
              data={[
                { label: 'Contas Pagas', shortLabel: 'Pagas', value: financialAnalytics.payablesPaid, color: '#16a34a' },
                { label: 'Contas a Pagar (Em Aberto)', shortLabel: 'Em Aberto', value: financialAnalytics.payablesPending, color: '#dc2626' },
                { label: 'Receitas Recebidas', shortLabel: 'Recebidas', value: financialAnalytics.receivedTotal, color: '#2563eb' },
                { label: 'Receitas a Receber', shortLabel: 'A Receber', value: financialAnalytics.pendingReceivables, color: '#d97706' }
              ]}
            />
          </div>
        </section>
      )}
    </div>
  );
};
