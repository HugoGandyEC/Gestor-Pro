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
  DollarSign,
  Filter,
  Package,
  Wrench,
  CheckSquare,
  Square,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../context/AppContext';

export type ChartModelType = 'colunas' | 'barras' | 'linha' | 'rosca' | 'empilhado';

export type PeriodPreset =
  | 'dia'
  | 'semana'
  | 'quinzena'
  | 'mes'
  | 'trimestre'
  | 'semestre'
  | 'anual'
  | 'personalizado'
  | 'geral';

export type DataSectionKey =
  | 'panorama_financeiro'
  | 'evolucao_fluxo'
  | 'por_cliente'
  | 'por_produto'
  | 'por_servico'
  | 'despesas_pagar'
  | 'cadastros';

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

const CHART_MODELS: {
  id: ChartModelType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'colunas', label: 'Colunas Verticais', description: 'Comparativo vertical por item', icon: BarChart3 },
  { id: 'barras', label: 'Barras Horizontais', description: 'Ranking horizontal proporcional', icon: BarChart2 },
  { id: 'linha', label: 'Linha / Área', description: 'Tendência e curva contínua', icon: TrendingUp },
  { id: 'rosca', label: 'Rosca / Pizza', description: 'Participação percentual no total', icon: PieChartIcon },
  { id: 'empilhado', label: 'Proporção 100%', description: 'Faixa proporcional + tabela', icon: Layers }
];

const PERIOD_PRESETS: { id: PeriodPreset; label: string }[] = [
  { id: 'dia', label: 'Dia' },
  { id: 'semana', label: 'Semana' },
  { id: 'quinzena', label: 'Quinzena' },
  { id: 'mes', label: 'Mês' },
  { id: 'trimestre', label: 'Trimestre' },
  { id: 'semestre', label: 'Semestre' },
  { id: 'anual', label: 'Anual' },
  { id: 'personalizado', label: 'Data Específica' },
  { id: 'geral', label: 'Todo o Período' }
];

const DATA_SECTIONS_CONFIG: {
  key: DataSectionKey;
  label: string;
  subtitle: string;
}[] = [
  {
    key: 'panorama_financeiro',
    label: 'Panorama Financeiro & DRE',
    subtitle: 'Receitas, custos, margem e lucro líquido'
  },
  {
    key: 'evolucao_fluxo',
    label: 'Evolução & Fluxo de Caixa',
    subtitle: 'Série no período, canais e formas de pagto'
  },
  {
    key: 'por_cliente',
    label: 'Financeiro por Cliente',
    subtitle: 'Ranking de faturamento e saldo por cliente'
  },
  {
    key: 'por_produto',
    label: 'Financeiro por Produto',
    subtitle: 'Produtos vendidos, receita, CMV e quantidade'
  },
  {
    key: 'por_servico',
    label: 'Financeiro por Serviço',
    subtitle: 'Serviços prestados em O.S. e receita gerada'
  },
  {
    key: 'despesas_pagar',
    label: 'Despesas, Frota & A Pagar',
    subtitle: 'Centros de custo e contas pagas/abertas'
  },
  {
    key: 'cadastros',
    label: 'Cadastros (Clientes, Fornec. e Equipe)',
    subtitle: 'PJ/PF, fornecedores, folha e encargos'
  }
];

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'Pix Instantâneo',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  dinheiro: 'Dinheiro',
  boleto: 'Boleto Bancário',
  faturado_30d: 'Faturado 30d',
  transferencia: 'Transferência / TED'
};

const ALL_SECTIONS_ON: Record<DataSectionKey, boolean> = {
  panorama_financeiro: true,
  evolucao_fluxo: true,
  por_cliente: true,
  por_produto: true,
  por_servico: true,
  despesas_pagar: true,
  cadastros: true
};

// =========================================================================
// Helpers de Data & Granularidade
// =========================================================================

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(n => parseInt(n, 10));
  return new Date(y || 2026, (m || 1) - 1, d || 1);
}

function daysBetweenInclusive(startYmd: string, endYmd: string): number {
  const s = parseYMD(startYmd);
  const e = parseYMD(endYmd);
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

function getLastDayOfMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function addDaysYmd(ymd: string, delta: number): string {
  const d = parseYMD(ymd);
  d.setDate(d.getDate() + delta);
  return toYMD(d);
}

function getWeekRangeFromYmd(ymd: string): { start: string; end: string } {
  const d = parseYMD(ymd);
  const dayOfWeek = d.getDay(); // 0=Dom .. 6=Sab
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { start: toYMD(mon), end: toYMD(sun) };
}

function formatShortDayMonth(ymd: string): string {
  if (!ymd || ymd.length < 10) return ymd;
  return `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`;
}

// =========================================================================
// Motor de Gráfico Flexível (5 Modelos Visuais)
// =========================================================================

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

  const lineGeometry = useMemo(() => {
    const w = 540;
    const h = 215;
    const padX = 34;
    const padTop = 26;
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
    const areaPath =
      pts.length > 0
        ? `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`
        : '';

    return { w, h, padX, padTop, padBottom, chartH, pts, linePath, areaPath };
  }, [safeData, maxVal]);

  const hoveredItem = hoveredIdx !== null ? safeData[hoveredIdx] : null;
  const labelStride = Math.max(1, Math.ceil(safeData.length / 8));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4">
      {/* Header + Per-card Model Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 leading-snug">{title}</h3>
          <p className="hidden md:block text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {summaryRight && (
            <span className="text-xs font-mono font-bold text-slate-900 tabular-nums mr-1">
              {summaryRight}
            </span>
          )}
          <div className="hidden md:inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
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
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hover Readout Strip */}
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
            <span className="text-slate-500 truncate">
              <span className="hidden md:inline">Passe o mouse ou toque para detalhar os valores</span>
              <span className="md:hidden">Toque no gráfico para detalhar</span>
            </span>
            <span className="font-mono font-semibold text-slate-700 tabular-nums shrink-0 ml-2">
              Total: {formatValue(total)}
            </span>
          </>
        )}
      </div>

      {/* Chart Body */}
      {safeData.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Nenhum movimento ou registro encontrado para os filtros selecionados.
        </div>
      ) : activeModel === 'colunas' ? (
        <div className="w-full overflow-x-auto">
          <div className="min-w-[280px]">
            <div className="h-56 flex items-end gap-1.5 sm:gap-2.5 pt-6 pb-1 px-1 border-b border-slate-200">
              {safeData.map((d, idx) => {
                const heightPct = maxVal > 0 ? Math.max(d.value > 0 ? 5 : 1, (d.value / maxVal) * 100) : 1;
                const isHovered = hoveredIdx === idx;
                const showTopVal = safeData.length <= 8 || isHovered;
                return (
                  <div
                    key={`${d.label}-${idx}`}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => setHoveredIdx(idx === hoveredIdx ? null : idx)}
                    className="flex-1 h-full flex flex-col items-center justify-end gap-1 min-w-0 cursor-pointer"
                  >
                    <span
                      className={`text-[10px] font-mono font-semibold text-slate-600 tabular-nums truncate max-w-full ${
                        showTopVal ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {formatValue(d.value)}
                    </span>
                    <div className="w-full max-w-[44px] flex-1 flex items-end">
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
            <div className="flex items-start gap-1.5 sm:gap-2.5 pt-2 px-1">
              {safeData.map((d, idx) => {
                const showLbl = safeData.length <= 10 || idx % labelStride === 0 || idx === safeData.length - 1;
                return (
                  <div key={`${d.label}-lbl-${idx}`} className="flex-1 min-w-0 text-center">
                    <span className="text-[10px] font-medium text-slate-600 block truncate" title={d.label}>
                      {showLbl ? (d.shortLabel || d.label) : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : activeModel === 'barras' ? (
        <div className="space-y-3 py-1 max-h-72 overflow-y-auto pr-1">
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

            {lineGeometry.areaPath && (
              <path d={lineGeometry.areaPath} fill={`url(#grad-${id})`} />
            )}

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

            {lineGeometry.pts.map(({ x, y, item, idx }) => {
              const isHovered = hoveredIdx === idx;
              const showValueText = safeData.length <= 8 || isHovered;
              const showAxisLabel = safeData.length <= 10 || idx % labelStride === 0 || idx === safeData.length - 1;
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
                    r={isHovered ? 7 : safeData.length > 14 ? 3.5 : 4.5}
                    fill={item.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {showValueText && (
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
                  )}
                  {showAxisLabel && (
                    <text
                      x={x}
                      y={lineGeometry.h - 10}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#64748b"
                    >
                      {(item.shortLabel || item.label).slice(0, 12)}
                    </text>
                  )}
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
              {total > 0 &&
                donutSegments.map((seg, idx) => {
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

          <div className="sm:col-span-7 space-y-1.5 max-h-56 overflow-y-auto pr-1">
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

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg max-h-56 overflow-y-auto">
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

// =========================================================================
// Componente Principal: Painel BI & Filtros Financeiros Completos
// =========================================================================

export const AnalyticsChartsView: React.FC = () => {
  const {
    clients,
    suppliers,
    employees,
    products,
    serviceCatalog,
    serviceOrders,
    directSales,
    generalExpenses,
    vehicleExpenses,
    vehicles,
    selectedMonthYear,
    setSelectedMonthYear
  } = useApp();

  const todayYmd = useMemo(() => toYMD(new Date()), []);
  const currentYear = todayYmd.slice(0, 4);

  // 1. Caixa de Modelo Global de Gráfico (aplica em tudo selecionado)
  const [globalModel, setGlobalModel] = useState<ChartModelType>('colunas');
  const [chartOverrides, setChartOverrides] = useState<Record<string, ChartModelType>>({});

  // 2. Caixa de Período & Datas
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('mes');
  const [specificDay, setSpecificDay] = useState<string>(todayYmd);
  const [weekRefDay, setWeekRefDay] = useState<string>(todayYmd);
  const [quinzenaMonth, setQuinzenaMonth] = useState<string>(selectedMonthYear);
  const [quinzenaHalf, setQuinzenaHalf] = useState<'1' | '2'>('1');
  const [quarterYear, setQuarterYear] = useState<string>(selectedMonthYear.slice(0, 4) || currentYear);
  const [quarterNum, setQuarterNum] = useState<1 | 2 | 3 | 4>(() => {
    const mo = parseInt(selectedMonthYear.slice(5, 7) || '1', 10);
    return (Math.floor((mo - 1) / 3) + 1) as 1 | 2 | 3 | 4;
  });
  const [semesterYear, setSemesterYear] = useState<string>(selectedMonthYear.slice(0, 4) || currentYear);
  const [semesterNum, setSemesterNum] = useState<1 | 2>(() => {
    const mo = parseInt(selectedMonthYear.slice(5, 7) || '1', 10);
    return mo <= 6 ? 1 : 2;
  });
  const [annualYear, setAnnualYear] = useState<string>(selectedMonthYear.slice(0, 4) || currentYear);
  const [customStartDate, setCustomStartDate] = useState<string>(`${selectedMonthYear}-01`);
  const [customEndDate, setCustomEndDate] = useState<string>(todayYmd);

  // 3. Caixa de Filtros por Entidade (Cliente, Produto, Serviço, Canal, Status)
  const [selectedClientKey, setSelectedClientKey] = useState<string>('todos');
  const [selectedProductKey, setSelectedProductKey] = useState<string>('todos');
  const [selectedServiceKey, setSelectedServiceKey] = useState<string>('todos');
  const [channelFilter, setChannelFilter] = useState<'todos' | 'os' | 'vendas'>('todos');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'todos' | 'pago' | 'pendente'>('todos');

  // 4. Caixa de Seleção: Quais Dados Quero Ver
  const [visibleSections, setVisibleSections] = useState<Record<DataSectionKey, boolean>>(ALL_SECTIONS_ON);
  const [showMobileAdvancedControls, setShowMobileAdvancedControls] = useState(false);

  const handleGlobalModelChange = (model: ChartModelType) => {
    setGlobalModel(model);
    setChartOverrides({});
  };

  const handleOverrideChange = (id: string, model: ChartModelType) => {
    setChartOverrides(prev => ({ ...prev, [id]: model }));
  };

  const toggleSection = (key: DataSectionKey) => {
    setVisibleSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Anos disponíveis no banco para seletores de Trimestre / Semestre / Anual
  const availableYears = useMemo(() => {
    const yrs = new Set<string>([currentYear, selectedMonthYear.slice(0, 4)]);
    serviceOrders.forEach(o => {
      const y = (o.completionDate || o.openDate || '').slice(0, 4);
      if (/^\d{4}$/.test(y)) yrs.add(y);
    });
    directSales.forEach(s => {
      const y = (s.date || '').slice(0, 4);
      if (/^\d{4}$/.test(y)) yrs.add(y);
    });
    generalExpenses.forEach(g => {
      const y = (g.dueDate || '').slice(0, 4);
      if (/^\d{4}$/.test(y)) yrs.add(y);
    });
    return Array.from(yrs).sort().reverse();
  }, [currentYear, selectedMonthYear, serviceOrders, directSales, generalExpenses]);

  // Cálculo exato do intervalo [start, end] conforme granularidade escolhida
  const resolvedPeriod = useMemo(() => {
    if (periodPreset === 'dia') {
      const d = specificDay || todayYmd;
      return { start: d, end: d, label: `Dia ${formatDateBR(d)}`, isAll: false };
    }
    if (periodPreset === 'semana') {
      const wk = getWeekRangeFromYmd(weekRefDay || todayYmd);
      return {
        start: wk.start,
        end: wk.end,
        label: `Semana (${formatDateBR(wk.start)} a ${formatDateBR(wk.end)})`,
        isAll: false
      };
    }
    if (periodPreset === 'quinzena') {
      const ym = quinzenaMonth || selectedMonthYear;
      const y = parseInt(ym.slice(0, 4), 10);
      const m0 = parseInt(ym.slice(5, 7), 10) - 1;
      const lastDay = String(getLastDayOfMonth(y, m0)).padStart(2, '0');
      const start = quinzenaHalf === '1' ? `${ym}-01` : `${ym}-16`;
      const end = quinzenaHalf === '1' ? `${ym}-15` : `${ym}-${lastDay}`;
      return {
        start,
        end,
        label: `${quinzenaHalf}ª Quinzena ${ym.slice(5, 7)}/${ym.slice(0, 4)} (${formatDateBR(start)} a ${formatDateBR(end)})`,
        isAll: false
      };
    }
    if (periodPreset === 'mes') {
      const ym = selectedMonthYear;
      const y = parseInt(ym.slice(0, 4), 10);
      const m0 = parseInt(ym.slice(5, 7), 10) - 1;
      const lastDay = String(getLastDayOfMonth(y, m0)).padStart(2, '0');
      return {
        start: `${ym}-01`,
        end: `${ym}-${lastDay}`,
        label: `Mês ${ym.slice(5, 7)}/${ym.slice(0, 4)}`,
        isAll: false
      };
    }
    if (periodPreset === 'trimestre') {
      const startMonth = (quarterNum - 1) * 3 + 1;
      const endMonth = startMonth + 2;
      const startM = String(startMonth).padStart(2, '0');
      const endM = String(endMonth).padStart(2, '0');
      const lastDay = String(getLastDayOfMonth(parseInt(quarterYear, 10), endMonth - 1)).padStart(2, '0');
      return {
        start: `${quarterYear}-${startM}-01`,
        end: `${quarterYear}-${endM}-${lastDay}`,
        label: `${quarterNum}º Trimestre/${quarterYear}`,
        isAll: false
      };
    }
    if (periodPreset === 'semestre') {
      const startM = semesterNum === 1 ? '01' : '07';
      const endM = semesterNum === 1 ? '06' : '12';
      const lastDay = semesterNum === 1 ? '30' : '31';
      return {
        start: `${semesterYear}-${startM}-01`,
        end: `${semesterYear}-${endM}-${lastDay}`,
        label: `${semesterNum}º Semestre/${semesterYear}`,
        isAll: false
      };
    }
    if (periodPreset === 'anual') {
      return {
        start: `${annualYear}-01-01`,
        end: `${annualYear}-12-31`,
        label: `Ano Completo ${annualYear}`,
        isAll: false
      };
    }
    if (periodPreset === 'personalizado') {
      const s = customStartDate || `${selectedMonthYear}-01`;
      const e = customEndDate && customEndDate >= s ? customEndDate : s;
      return {
        start: s,
        end: e,
        label: `${formatDateBR(s)} até ${formatDateBR(e)}`,
        isAll: false
      };
    }
    return {
      start: '1900-01-01',
      end: '2999-12-31',
      label: 'Todo o Histórico Acumulado',
      isAll: true
    };
  }, [
    periodPreset,
    specificDay,
    todayYmd,
    weekRefDay,
    quinzenaMonth,
    quinzenaHalf,
    selectedMonthYear,
    quarterNum,
    quarterYear,
    semesterNum,
    semesterYear,
    annualYear,
    customStartDate,
    customEndDate
  ]);

  const inResolvedPeriod = (rawDate?: string): boolean => {
    if (resolvedPeriod.isAll) return true;
    const d = (rawDate || '').slice(0, 10);
    if (!d) return false;
    return d >= resolvedPeriod.start && d <= resolvedPeriod.end;
  };

  // Listas dinâmicas para os seletores de Cliente, Produto e Serviço
  const filterOptions = useMemo(() => {
    const clientOptMap = new Map<string, string>();
    clients.forEach(c => clientOptMap.set(`id:${c.id}`, c.name));
    serviceOrders.forEach(o => {
      if (o.clientId && !clientOptMap.has(`id:${o.clientId}`)) {
        clientOptMap.set(`id:${o.clientId}`, o.clientName);
      } else if (!o.clientId && o.clientName) {
        clientOptMap.set(`name:${o.clientName.toLowerCase()}`, o.clientName);
      }
    });
    directSales.forEach(s => {
      if (s.clientId && !clientOptMap.has(`id:${s.clientId}`)) {
        clientOptMap.set(`id:${s.clientId}`, s.clientName);
      } else if (!s.clientId && s.clientName) {
        clientOptMap.set(`name:${s.clientName.toLowerCase()}`, s.clientName);
      }
    });

    const productOptMap = new Map<string, string>();
    products.forEach(p => productOptMap.set(`id:${p.id}`, `${p.name} (${p.code})`));
    serviceOrders.forEach(o =>
      (o.parts || []).forEach(prt => {
        if (prt.productId && !productOptMap.has(`id:${prt.productId}`)) {
          productOptMap.set(`id:${prt.productId}`, prt.name);
        } else if (!prt.productId && prt.name) {
          productOptMap.set(`name:${prt.name.toLowerCase()}`, prt.name);
        }
      })
    );
    directSales.forEach(s =>
      (s.items || []).forEach(it => {
        if (it.productId && !productOptMap.has(`id:${it.productId}`)) {
          productOptMap.set(`id:${it.productId}`, it.name);
        } else if (!it.productId && it.name) {
          productOptMap.set(`name:${it.name.toLowerCase()}`, it.name);
        }
      })
    );

    const serviceOptMap = new Map<string, string>();
    serviceCatalog.forEach(sv => serviceOptMap.set(sv.name.toLowerCase(), sv.name));
    serviceOrders.forEach(o =>
      (o.services || []).forEach(sv => {
        if (sv.name) serviceOptMap.set(sv.name.toLowerCase(), sv.name);
      })
    );

    return {
      clients: Array.from(clientOptMap.entries()).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR')),
      products: Array.from(productOptMap.entries()).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR')),
      services: Array.from(serviceOptMap.entries()).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
    };
  }, [clients, products, serviceCatalog, serviceOrders, directSales]);

  // =========================================================================
  // 1. INDICADORES DE CLIENTES (Consolidado Cadastral)
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
      .slice(0, 8)
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
  // 2. INDICADORES DE FORNECEDORES (Consolidado Cadastral)
  // =========================================================================
  const supplierMetrics = useMemo(() => {
    const totalFornecedores = suppliers.length;
    const pendingExpenses = generalExpenses.filter(e => !e.isPaid && inResolvedPeriod(e.dueDate));
    const totalEmAbertoGeral = pendingExpenses.reduce((acc, e) => acc + Number(e.cost || 0), 0);

    const supplierIdsWithPayables = new Set(pendingExpenses.filter(e => e.supplierId).map(e => e.supplierId));
    const comContasAPagar = suppliers.filter(s => supplierIdsWithPayables.has(s.id)).length;
    const semPendencias = Math.max(0, totalFornecedores - comContasAPagar);

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

    const openBySupplierMap: Record<string, number> = {};
    pendingExpenses.forEach(e => {
      const sup = suppliers.find(s => s.id === e.supplierId);
      const label = sup ? sup.tradeName || sup.name : e.supplier || e.category || 'Despesas Gerais';
      openBySupplierMap[label] = (openBySupplierMap[label] || 0) + Number(e.cost || 0);
    });

    const openBySupplierChart: ChartDatum[] = Object.entries(openBySupplierMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
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
  }, [suppliers, generalExpenses, resolvedPeriod]);

  // =========================================================================
  // 3. INDICADORES DE FOLHA / FUNCIONÁRIOS
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
  // 4. MOTOR ANALÍTICO FINANCEIRO COMPLETO (Período, Cliente, Produto, Serviço)
  // =========================================================================
  const financialAnalytics = useMemo(() => {
    const matchesClient = (clientId?: string, clientName?: string) => {
      if (selectedClientKey === 'todos') return true;
      if (selectedClientKey.startsWith('id:')) {
        const targetId = selectedClientKey.slice(3);
        const clientObj = clients.find(c => c.id === targetId);
        return clientId === targetId || (clientObj && clientName && clientName.toLowerCase() === clientObj.name.toLowerCase());
      }
      if (selectedClientKey.startsWith('name:')) {
        const targetName = selectedClientKey.slice(5);
        return (clientName || '').toLowerCase() === targetName;
      }
      return true;
    };

    const matchesProductItem = (productId?: string, itemName?: string) => {
      if (selectedProductKey === 'todos') return true;
      if (selectedProductKey.startsWith('id:')) {
        const targetId = selectedProductKey.slice(3);
        const prodObj = products.find(p => p.id === targetId);
        return productId === targetId || (prodObj && itemName && itemName.toLowerCase() === prodObj.name.toLowerCase());
      }
      if (selectedProductKey.startsWith('name:')) {
        const targetName = selectedProductKey.slice(5);
        return (itemName || '').toLowerCase() === targetName;
      }
      return true;
    };

    const matchesServiceItem = (serviceName?: string) => {
      if (selectedServiceKey === 'todos') return true;
      return (serviceName || '').toLowerCase() === selectedServiceKey.toLowerCase();
    };

    const hasEntityFilter =
      selectedClientKey !== 'todos' || selectedProductKey !== 'todos' || selectedServiceKey !== 'todos';
    const hasItemFilter = selectedProductKey !== 'todos' || selectedServiceKey !== 'todos';

    // Fator mensal proporcional para custos fixos (Folha & IPVA/Seguro) conforme período escolhido
    let monthFactor = 1;
    if (periodPreset === 'dia') monthFactor = 1 / 30;
    else if (periodPreset === 'semana') monthFactor = 7 / 30;
    else if (periodPreset === 'quinzena') monthFactor = 0.5;
    else if (periodPreset === 'mes') monthFactor = 1;
    else if (periodPreset === 'trimestre') monthFactor = 3;
    else if (periodPreset === 'semestre') monthFactor = 6;
    else if (periodPreset === 'anual') monthFactor = 12;
    else if (periodPreset === 'personalizado') {
      monthFactor = daysBetweenInclusive(resolvedPeriod.start, resolvedPeriod.end) / 30;
    } else {
      const mSet = new Set<string>();
      serviceOrders.forEach(o => {
        const ym = (o.completionDate || o.openDate || '').slice(0, 7);
        if (ym.length === 7) mSet.add(ym);
      });
      directSales.forEach(s => {
        const ym = (s.date || '').slice(0, 7);
        if (ym.length === 7) mSet.add(ym);
      });
      generalExpenses.forEach(g => {
        const ym = (g.dueDate || '').slice(0, 7);
        if (ym.length === 7) mSet.add(ym);
      });
      monthFactor = Math.max(1, mSet.size);
    }

    // Estruturas acumuladoras financeiras
    let serviceGross = 0;
    let partsGross = 0;
    let visitFeesGross = 0;
    let totalDiscounts = 0;

    let osPaidValue = 0;
    let osPendingValue = 0;
    let salesPaidValue = 0;
    let salesPendingValue = 0;

    let totalPartsCost = 0;
    let totalCardFees = 0;
    let osCountFiltered = 0;
    let salesCountFiltered = 0;

    const paymentMethodTotals: Record<string, number> = {};
    const clientTotals: Record<string, { name: string; revenue: number; paid: number; pending: number; count: number }> = {};
    const productTotals: Record<string, { name: string; revenue: number; cost: number; qty: number }> = {};
    const serviceTotals: Record<string, { name: string; revenue: number; count: number; hours: number }> = {};

    // Mapa para evolução temporal adaptada ao período
    const timelineMap: Record<string, { sortKey: string; label: string; revenue: number; expenses: number }> = {};
    const getTimelineBucket = (rawDate: string) => {
      const ymd = (rawDate || '').slice(0, 10);
      if (!ymd || ymd.length < 10) return { sortKey: '0000-00', label: 'S/ Data' };

      if (
        periodPreset === 'dia' ||
        periodPreset === 'semana' ||
        periodPreset === 'quinzena' ||
        periodPreset === 'mes' ||
        (periodPreset === 'personalizado' && daysBetweenInclusive(resolvedPeriod.start, resolvedPeriod.end) <= 45)
      ) {
        return { sortKey: ymd, label: formatShortDayMonth(ymd) };
      }

      if (periodPreset === 'trimestre' || periodPreset === 'semestre' || periodPreset === 'anual' || periodPreset === 'geral') {
        const ym = ymd.slice(0, 7);
        return { sortKey: ym, label: `${ym.slice(5, 7)}/${ym.slice(2, 4)}` };
      }

      // Personalizado longo (> 45 dias): agrupa por mês
      const ym = ymd.slice(0, 7);
      return { sortKey: ym, label: `${ym.slice(5, 7)}/${ym.slice(2, 4)}` };
    };

    const addTimelineRev = (dateStr: string, amount: number) => {
      const b = getTimelineBucket(dateStr);
      if (!timelineMap[b.sortKey]) timelineMap[b.sortKey] = { sortKey: b.sortKey, label: b.label, revenue: 0, expenses: 0 };
      timelineMap[b.sortKey].revenue += amount;
    };

    const addTimelineExp = (dateStr: string, amount: number) => {
      const b = getTimelineBucket(dateStr);
      if (!timelineMap[b.sortKey]) timelineMap[b.sortKey] = { sortKey: b.sortKey, label: b.label, revenue: 0, expenses: 0 };
      timelineMap[b.sortKey].expenses += amount;
    };

    // Processa Ordens de Serviço
    if (channelFilter === 'todos' || channelFilter === 'os') {
      serviceOrders.forEach(o => {
        if (o.status === 'cancelada') return;
        const osDate = (o.completionDate || o.openDate || '').slice(0, 10);
        if (!inResolvedPeriod(osDate)) return;
        if (!matchesClient(o.clientId, o.clientName)) return;
        if (paymentStatusFilter !== 'todos' && o.paymentStatus !== paymentStatusFilter) return;

        const osSrvFull = o.services.reduce((a, b) => a + Number(b.price || 0), 0);
        const osPrtFull = o.parts.reduce((a, b) => a + Number(b.price || 0) * Number(b.quantity || 1), 0);
        const osVisit = Number(o.visitFee || 0);
        const osSubtotal = osSrvFull + osPrtFull + osVisit;
        const osDisc = Number(o.calculatedDiscount || 0);
        const osNetTotal = Math.max(0, osSubtotal - osDisc);

        const matchedServices = o.services.filter(sv => matchesServiceItem(sv.name));
        const matchedParts = o.parts.filter(prt => matchesProductItem(prt.productId, prt.name));

        if (selectedServiceKey !== 'todos' && matchedServices.length === 0) return;
        if (selectedProductKey !== 'todos' && matchedParts.length === 0) return;

        let effectiveOsRevenue = osNetTotal;
        let effectiveOsCost = o.parts.reduce((a, p) => a + Number(p.cost || 0) * Number(p.quantity || 1), 0);
        let effectiveOsFees = (o.payments || []).reduce((a, p) => a + Number(p.rateAmount || 0), 0);

        if (hasItemFilter) {
          let itemGross = 0;
          if (selectedServiceKey !== 'todos') {
            itemGross += matchedServices.reduce((a, b) => a + Number(b.price || 0), 0);
          }
          if (selectedProductKey !== 'todos') {
            itemGross += matchedParts.reduce((a, b) => a + Number(b.price || 0) * Number(b.quantity || 1), 0);
            effectiveOsCost = matchedParts.reduce((a, b) => a + Number(b.cost || 0) * Number(b.quantity || 1), 0);
          } else {
            effectiveOsCost = 0;
          }
          const share = osSubtotal > 0 ? itemGross / osSubtotal : 0;
          effectiveOsRevenue = Math.max(0, itemGross - osDisc * share);
          effectiveOsFees = effectiveOsFees * share;
          if (selectedServiceKey !== 'todos') {
            serviceGross += matchedServices.reduce((a, b) => a + Number(b.price || 0), 0);
          }
          if (selectedProductKey !== 'todos') {
            partsGross += matchedParts.reduce((a, b) => a + Number(b.price || 0) * Number(b.quantity || 1), 0);
          }
          totalDiscounts += osDisc * share;
        } else {
          serviceGross += osSrvFull;
          partsGross += osPrtFull;
          visitFeesGross += osVisit;
          totalDiscounts += osDisc;
        }

        osCountFiltered += 1;
        totalPartsCost += effectiveOsCost;
        totalCardFees += effectiveOsFees;

        if (o.paymentStatus === 'pago') osPaidValue += effectiveOsRevenue;
        else osPendingValue += effectiveOsRevenue;

        // Formas de pagamento
        const feeRatio = osNetTotal > 0 ? effectiveOsRevenue / osNetTotal : 0;
        if (o.payments && o.payments.length > 0) {
          o.payments.forEach(p => {
            const val = hasItemFilter ? Number(p.amount || 0) * feeRatio : Number(p.amount || 0);
            if (val > 0) {
              paymentMethodTotals[p.method] = (paymentMethodTotals[p.method] || 0) + val;
            }
          });
        } else if (effectiveOsRevenue > 0) {
          const m = o.paymentMethod || 'pix';
          paymentMethodTotals[m] = (paymentMethodTotals[m] || 0) + effectiveOsRevenue;
        }

        // Acumulador por Cliente
        const cKey = o.clientId || o.clientName || 'Cliente Avulso';
        if (!clientTotals[cKey]) {
          clientTotals[cKey] = { name: o.clientName || 'Cliente Avulso', revenue: 0, paid: 0, pending: 0, count: 0 };
        }
        clientTotals[cKey].revenue += effectiveOsRevenue;
        if (o.paymentStatus === 'pago') clientTotals[cKey].paid += effectiveOsRevenue;
        else clientTotals[cKey].pending += effectiveOsRevenue;
        clientTotals[cKey].count += 1;

        // Acumulador por Produto (peças da OS)
        (selectedProductKey !== 'todos' ? matchedParts : o.parts).forEach(prt => {
          const pKey = prt.productId || prt.name.toLowerCase();
          if (!productTotals[pKey]) {
            productTotals[pKey] = { name: prt.name, revenue: 0, cost: 0, qty: 0 };
          }
          const qty = Number(prt.quantity || 1);
          productTotals[pKey].revenue += Number(prt.price || 0) * qty;
          productTotals[pKey].cost += Number(prt.cost || 0) * qty;
          productTotals[pKey].qty += qty;
        });

        // Acumulador por Serviço (serviços da OS)
        (selectedServiceKey !== 'todos' ? matchedServices : o.services).forEach(sv => {
          const sKey = sv.name.toLowerCase();
          if (!serviceTotals[sKey]) {
            serviceTotals[sKey] = { name: sv.name, revenue: 0, count: 0, hours: 0 };
          }
          serviceTotals[sKey].revenue += Number(sv.price || 0);
          serviceTotals[sKey].count += 1;
          serviceTotals[sKey].hours += Number(sv.hours || 0);
        });

        addTimelineRev(osDate, effectiveOsRevenue);
      });
    }

    // Processa Vendas Diretas / PDV
    if ((channelFilter === 'todos' || channelFilter === 'vendas') && selectedServiceKey === 'todos') {
      directSales.forEach(s => {
        const sDate = (s.date || '').slice(0, 10);
        if (!inResolvedPeriod(sDate)) return;
        if (!matchesClient(s.clientId, s.clientName)) return;
        if (paymentStatusFilter !== 'todos' && s.paymentStatus !== paymentStatusFilter) return;

        const saleItemsFull = s.items.reduce((a, it) => a + Number(it.price || 0) * Number(it.quantity || 1), 0);
        const saleDisc = Number(s.calculatedDiscount || 0);
        const saleNetTotal = Number(s.total || 0);

        const matchedItems = s.items.filter(it => matchesProductItem(it.productId, it.name));
        if (selectedProductKey !== 'todos' && matchedItems.length === 0) return;

        let effectiveSaleRevenue = saleNetTotal;
        let effectiveSaleCost = s.items.reduce((a, it) => a + Number(it.cost || 0) * Number(it.quantity || 1), 0);
        let effectiveSaleFees = (s.payments || []).reduce((a, p) => a + Number(p.rateAmount || 0), 0);

        if (selectedProductKey !== 'todos') {
          const itemsGross = matchedItems.reduce((a, it) => a + Number(it.price || 0) * Number(it.quantity || 1), 0);
          effectiveSaleCost = matchedItems.reduce((a, it) => a + Number(it.cost || 0) * Number(it.quantity || 1), 0);
          const share = saleItemsFull > 0 ? itemsGross / saleItemsFull : 0;
          effectiveSaleRevenue = Math.max(0, itemsGross - saleDisc * share);
          effectiveSaleFees = effectiveSaleFees * share;
          partsGross += itemsGross;
          totalDiscounts += saleDisc * share;
        } else {
          partsGross += saleItemsFull;
          totalDiscounts += saleDisc;
        }

        salesCountFiltered += 1;
        totalPartsCost += effectiveSaleCost;
        totalCardFees += effectiveSaleFees;

        if (s.paymentStatus === 'pago') salesPaidValue += effectiveSaleRevenue;
        else salesPendingValue += effectiveSaleRevenue;

        const ratio = saleNetTotal > 0 ? effectiveSaleRevenue / saleNetTotal : 0;
        if (s.payments && s.payments.length > 0) {
          s.payments.forEach(p => {
            const val = selectedProductKey !== 'todos' ? Number(p.amount || 0) * ratio : Number(p.amount || 0);
            if (val > 0) {
              paymentMethodTotals[p.method] = (paymentMethodTotals[p.method] || 0) + val;
            }
          });
        } else if (effectiveSaleRevenue > 0) {
          const m = s.paymentMethod || 'pix';
          paymentMethodTotals[m] = (paymentMethodTotals[m] || 0) + effectiveSaleRevenue;
        }

        const cKey = s.clientId || s.clientName || 'Consumidor Balcão';
        if (!clientTotals[cKey]) {
          clientTotals[cKey] = { name: s.clientName || 'Consumidor Balcão', revenue: 0, paid: 0, pending: 0, count: 0 };
        }
        clientTotals[cKey].revenue += effectiveSaleRevenue;
        if (s.paymentStatus === 'pago') clientTotals[cKey].paid += effectiveSaleRevenue;
        else clientTotals[cKey].pending += effectiveSaleRevenue;
        clientTotals[cKey].count += 1;

        (selectedProductKey !== 'todos' ? matchedItems : s.items).forEach(it => {
          const pKey = it.productId || it.name.toLowerCase();
          if (!productTotals[pKey]) {
            productTotals[pKey] = { name: it.name, revenue: 0, cost: 0, qty: 0 };
          }
          const qty = Number(it.quantity || 1);
          productTotals[pKey].revenue += Number(it.price || 0) * qty;
          productTotals[pKey].cost += Number(it.cost || 0) * qty;
          productTotals[pKey].qty += qty;
        });

        addTimelineRev(sDate, effectiveSaleRevenue);
      });
    }

    // Despesas Operacionais & Frota no período (aplicadas no panorama geral quando não isolado por entidade única)
    const expensesScope = generalExpenses.filter(g => {
      if (!inResolvedPeriod(g.dueDate)) return false;
      if (paymentStatusFilter === 'pago') return g.isPaid;
      if (paymentStatusFilter === 'pendente') return !g.isPaid;
      return true;
    });
    const fleetScope = vehicleExpenses.filter(v => inResolvedPeriod(v.date));

    expensesScope.forEach(e => addTimelineExp(e.dueDate, Number(e.cost || 0)));
    fleetScope.forEach(f => addTimelineExp(f.date, Number(f.cost || 0)));

    const totalOperationalCost = hasEntityFilter
      ? 0
      : expensesScope.reduce((a, g) => a + Number(g.cost || 0), 0);

    const fleetDirectCost = hasEntityFilter
      ? 0
      : fleetScope.reduce((a, f) => a + Number(f.cost || 0), 0);

    const fleetFixedProrated = hasEntityFilter
      ? 0
      : vehicles.reduce(
          (a, v) => a + ((Number(v.annualIpvaValue || 0) + Number(v.annualInsuranceValue || 0)) / 12) * monthFactor,
          0
        );
    const totalVehicleCost = fleetDirectCost + fleetFixedProrated;

    const totalPersonnelCost = hasEntityFilter
      ? 0
      : payrollMetrics.custoTotalFolhaMensal * monthFactor;

    const totalRevenue = osPaidValue + osPendingValue + salesPaidValue + salesPendingValue;
    const receivedTotal = osPaidValue + salesPaidValue;
    const pendingReceivables = osPendingValue + salesPendingValue;

    const totalCosts =
      totalPartsCost + totalPersonnelCost + totalVehicleCost + totalOperationalCost + totalCardFees;
    const grossContribution = totalRevenue - totalPartsCost - totalCardFees;
    const netProfit = totalRevenue - totalCosts;
    const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const payablesPaid = generalExpenses
      .filter(e => inResolvedPeriod(e.dueDate) && e.isPaid)
      .reduce((a, e) => a + Number(e.cost || 0), 0);
    const payablesPending = generalExpenses
      .filter(e => inResolvedPeriod(e.dueDate) && !e.isPaid)
      .reduce((a, e) => a + Number(e.cost || 0), 0);

    const paymentMethodsChart: ChartDatum[] = Object.entries(paymentMethodTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([method, value], i) => ({
        label: PAYMENT_LABELS[method] || method.toUpperCase(),
        shortLabel: (PAYMENT_LABELS[method] || method).split(' ')[0],
        value,
        color: CHART_COLORS[i % CHART_COLORS.length]
      }));

    const categoryTotals: Record<string, number> = {};
    expensesScope.forEach(e => {
      const cat = e.category || 'Outros';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.cost || 0);
    });
    if (fleetDirectCost > 0) {
      categoryTotals['Frota & Combustível'] = (categoryTotals['Frota & Combustível'] || 0) + fleetDirectCost;
    }

    const expensesByCategoryChart: ChartDatum[] = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value], i) => ({
        label,
        shortLabel: label.replace(/_/g, ' ').slice(0, 14),
        value,
        color: CHART_COLORS[(i + 2) % CHART_COLORS.length]
      }));

    const timelineChart: ChartDatum[] = Object.values(timelineMap)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map((entry, i) => ({
        label: `${entry.label} · Receita ${formatBRL(entry.revenue)}`,
        shortLabel: entry.label,
        value: entry.revenue,
        color: CHART_COLORS[i % CHART_COLORS.length],
        hint: `Despesas lançadas: ${formatBRL(entry.expenses)}`
      }));

    const topClientsRevenueChart: ChartDatum[] = Object.values(clientTotals)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
      .map((c, i) => ({
        label: c.name,
        shortLabel: c.name.split(' ').slice(0, 2).join(' '),
        value: c.revenue,
        color: CHART_COLORS[i % CHART_COLORS.length],
        hint: `${c.count} mov. · Pago ${formatBRL(c.paid)} · Aberto ${formatBRL(c.pending)}`
      }));

    const topClientsPendingChart: ChartDatum[] = Object.values(clientTotals)
      .filter(c => c.pending > 0)
      .sort((a, b) => b.pending - a.pending)
      .slice(0, 8)
      .map((c, i) => ({
        label: c.name,
        shortLabel: c.name.split(' ').slice(0, 2).join(' '),
        value: c.pending,
        color: CHART_COLORS[(i + 3) % CHART_COLORS.length],
        hint: `Faturado total: ${formatBRL(c.revenue)}`
      }));

    const topProductsRevenueChart: ChartDatum[] = Object.values(productTotals)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
      .map((p, i) => ({
        label: p.name,
        shortLabel: p.name.slice(0, 16),
        value: p.revenue,
        color: CHART_COLORS[i % CHART_COLORS.length],
        hint: `Qtd: ${p.qty} · CMV: ${formatBRL(p.cost)} · Margem: ${formatBRL(p.revenue - p.cost)}`
      }));

    const topProductsQtyChart: ChartDatum[] = Object.values(productTotals)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8)
      .map((p, i) => ({
        label: p.name,
        shortLabel: p.name.slice(0, 16),
        value: p.qty,
        color: CHART_COLORS[(i + 1) % CHART_COLORS.length],
        hint: `Faturamento: ${formatBRL(p.revenue)}`
      }));

    const topServicesRevenueChart: ChartDatum[] = Object.values(serviceTotals)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
      .map((s, i) => ({
        label: s.name,
        shortLabel: s.name.slice(0, 16),
        value: s.revenue,
        color: CHART_COLORS[i % CHART_COLORS.length],
        hint: `${s.count} O.S. · ${s.hours}h técnicas`
      }));

    const topServicesCountChart: ChartDatum[] = Object.values(serviceTotals)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((s, i) => ({
        label: s.name,
        shortLabel: s.name.slice(0, 16),
        value: s.count,
        color: CHART_COLORS[(i + 4) % CHART_COLORS.length],
        hint: `Faturamento: ${formatBRL(s.revenue)}`
      }));

    return {
      hasEntityFilter,
      monthFactor,
      osCountFiltered,
      salesCountFiltered,
      serviceGross,
      partsGross,
      visitFeesGross,
      totalDiscounts,
      totalRevenue,
      receivedTotal,
      pendingReceivables,
      osPaidValue,
      osPendingValue,
      salesPaidValue,
      salesPendingValue,
      totalPartsCost,
      totalPersonnelCost,
      totalVehicleCost,
      totalOperationalCost,
      totalCardFees,
      grossContribution,
      totalCosts,
      netProfit,
      netMarginPercent,
      payablesPaid,
      payablesPending,
      paymentMethodsChart,
      expensesByCategoryChart,
      timelineChart,
      topClientsRevenueChart,
      topClientsPendingChart,
      topProductsRevenueChart,
      topProductsQtyChart,
      topServicesRevenueChart,
      topServicesCountChart
    };
  }, [
    resolvedPeriod,
    periodPreset,
    selectedClientKey,
    selectedProductKey,
    selectedServiceKey,
    channelFilter,
    paymentStatusFilter,
    clients,
    products,
    serviceOrders,
    directSales,
    generalExpenses,
    vehicleExpenses,
    vehicles,
    payrollMetrics.custoTotalFolhaMensal
  ]);

  const activeFiltersCount = [
    selectedClientKey !== 'todos',
    selectedProductKey !== 'todos',
    selectedServiceKey !== 'todos',
    channelFilter !== 'todos',
    paymentStatusFilter !== 'todos'
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    setSelectedClientKey('todos');
    setSelectedProductKey('todos');
    setSelectedServiceKey('todos');
    setChannelFilter('todos');
    setPaymentStatusFilter('todos');
  };

  const activeSectionsCount = Object.values(visibleSections).filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Cabeçalho Principal */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#f6eff1] text-[#53383e] rounded-xl border border-slate-200 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Gráficos & Indicadores Gerenciais (BI)
            </h1>
            <p className="hidden md:block text-xs text-slate-500 mt-0.5">
              Central financeira e cadastral com filtros por data, período, cliente, produto, serviço e modelo global de gráfico.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700 tabular-nums">
            Período ativo: <strong className="text-slate-950">{resolvedPeriod.label}</strong>
          </span>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-semibold hover:bg-rose-100 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Filtros ({activeFiltersCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* CAIXA 1 & 2: FILTROS DE PERÍODO E GRANULARIDADE + RECORTES DE ENTIDADE */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Caixa 1: Período & Datas */}
        <div className="xl:col-span-6 bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#53383e]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                1. Filtro de Período & Datas
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
              {resolvedPeriod.isAll ? 'Sem limite' : `${formatDateBR(resolvedPeriod.start)} → ${formatDateBR(resolvedPeriod.end)}`}
            </span>
          </div>

          {/* Botões de Granularidade */}
          <div className="flex flex-wrap gap-1.5">
            {PERIOD_PRESETS.map(p => {
              const active = periodPreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriodPreset(p.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#53383e] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Controles Específicos da Granularidade */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
            {periodPreset === 'dia' && (
              <>
                <label className="flex items-center gap-2 font-medium text-slate-700">
                  <span>Data do dia:</span>
                  <input
                    type="date"
                    value={specificDay}
                    onChange={(e) => setSpecificDay(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setSpecificDay(todayYmd)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setSpecificDay(addDaysYmd(todayYmd, -1))}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Ontem
                </button>
              </>
            )}

            {periodPreset === 'semana' && (
              <>
                <label className="flex items-center gap-2 font-medium text-slate-700">
                  <span>Dia da semana referência:</span>
                  <input
                    type="date"
                    value={weekRefDay}
                    onChange={(e) => setWeekRefDay(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setWeekRefDay(todayYmd)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Semana Atual
                </button>
                <button
                  type="button"
                  onClick={() => setWeekRefDay(addDaysYmd(todayYmd, -7))}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Semana Passada
                </button>
              </>
            )}

            {periodPreset === 'quinzena' && (
              <>
                <label className="flex items-center gap-2 font-medium text-slate-700">
                  <span>Mês:</span>
                  <input
                    type="month"
                    value={quinzenaMonth}
                    onChange={(e) => setQuinzenaMonth(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
                  />
                </label>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setQuinzenaHalf('1')}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                      quinzenaHalf === '1' ? 'bg-slate-900 text-white' : 'text-slate-600'
                    }`}
                  >
                    1ª Quinzena (01–15)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuinzenaHalf('2')}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                      quinzenaHalf === '2' ? 'bg-slate-900 text-white' : 'text-slate-600'
                    }`}
                  >
                    2ª Quinzena (16–Fim)
                  </button>
                </div>
              </>
            )}

            {periodPreset === 'mes' && (
              <label className="flex items-center gap-2 font-medium text-slate-700">
                <span>Competência mensal:</span>
                <input
                  type="month"
                  value={selectedMonthYear}
                  onChange={(e) => setSelectedMonthYear(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
                />
              </label>
            )}

            {periodPreset === 'trimestre' && (
              <>
                <select
                  value={quarterYear}
                  onChange={(e) => setQuarterYear(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-slate-50 p-0.5 gap-0.5">
                  {([1, 2, 3, 4] as const).map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuarterNum(q)}
                      className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                        quarterNum === q ? 'bg-slate-900 text-white' : 'text-slate-600'
                      }`}
                    >
                      {q}º Trim ({q === 1 ? 'Jan–Mar' : q === 2 ? 'Abr–Jun' : q === 3 ? 'Jul–Set' : 'Out–Dez'})
                    </button>
                  ))}
                </div>
              </>
            )}

            {periodPreset === 'semestre' && (
              <>
                <select
                  value={semesterYear}
                  onChange={(e) => setSemesterYear(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setSemesterNum(1)}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                      semesterNum === 1 ? 'bg-slate-900 text-white' : 'text-slate-600'
                    }`}
                  >
                    1º Semestre (Jan–Jun)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSemesterNum(2)}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                      semesterNum === 2 ? 'bg-slate-900 text-white' : 'text-slate-600'
                    }`}
                  >
                    2º Semestre (Jul–Dez)
                  </button>
                </div>
              </>
            )}

            {periodPreset === 'anual' && (
              <label className="flex items-center gap-2 font-medium text-slate-700">
                <span>Ano de referência:</span>
                <select
                  value={annualYear}
                  onChange={(e) => setAnnualYear(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
            )}

            {periodPreset === 'personalizado' && (
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span>De:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
                  />
                </label>
                <label className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span>Até:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
                  />
                </label>
              </div>
            )}

            {periodPreset === 'geral' && (
              <span className="text-slate-500">
                Exibindo todo o histórico de lançamentos financeiros registrados no sistema.
              </span>
            )}
          </div>

          <div className="md:hidden pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowMobileAdvancedControls(prev => !prev)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#53383e]" />
                <span>Filtros, Painéis & Tipo de Gráfico</span>
                {activeFiltersCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#53383e] text-white text-[10px]">
                    {activeFiltersCount}
                  </span>
                )}
              </span>
              {showMobileAdvancedControls ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Caixa 2: Filtros por Cliente, Produto, Serviço, Canal & Situação */}
        <div className={`xl:col-span-6 bg-white border border-slate-200 rounded-xl p-4 space-y-3 ${showMobileAdvancedControls ? 'block' : 'hidden'} md:block`}>
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#53383e]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                2. Filtros por Cliente, Produto, Serviço & Origem
              </h2>
            </div>
            {activeFiltersCount > 0 && (
              <span className="text-[11px] font-semibold text-[#53383e]">
                {activeFiltersCount} filtro(s) aplicado(s)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Por Cliente
              </label>
              <select
                value={selectedClientKey}
                onChange={(e) => setSelectedClientKey(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              >
                <option value="todos">Todos os Clientes</option>
                {filterOptions.clients.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Por Produto / Peça
              </label>
              <select
                value={selectedProductKey}
                onChange={(e) => setSelectedProductKey(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              >
                <option value="todos">Todos os Produtos</option>
                {filterOptions.products.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Por Serviço
              </label>
              <select
                value={selectedServiceKey}
                onChange={(e) => setSelectedServiceKey(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              >
                <option value="todos">Todos os Serviços</option>
                {filterOptions.services.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Canal / Origem
              </label>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value as 'todos' | 'os' | 'vendas')}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              >
                <option value="todos">Todos (O.S. + Vendas Diretas)</option>
                <option value="os">Somente Ordens de Serviço</option>
                <option value="vendas">Somente Vendas Diretas / PDV</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Situação Financeira
              </label>
              <div className="inline-flex w-full rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                {[
                  { id: 'todos', label: 'Tudo (Pago + Pendente)' },
                  { id: 'pago', label: 'Somente Pagos' },
                  { id: 'pendente', label: 'Somente Pendentes' }
                ].map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setPaymentStatusFilter(st.id as 'todos' | 'pago' | 'pendente')}
                    className={`flex-1 px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      paymentStatusFilter === st.id
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* CAIXA 3 & 4: DADOS SELECIONÁVEIS + MODELO DE GRÁFICO PARA TUDO        */}
      {/* ===================================================================== */}
      <div className={`${showMobileAdvancedControls ? 'grid' : 'hidden'} md:grid grid-cols-1 xl:grid-cols-12 gap-4`}>
        {/* Caixa 3: Quais Dados Quero Ver */}
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#53383e]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                3. Quais Dados & Painéis Você Quer Ver ({activeSectionsCount}/{DATA_SECTIONS_CONFIG.length})
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setVisibleSections(ALL_SECTIONS_ON)}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                Marcar Tudo
              </button>
              <button
                type="button"
                onClick={() =>
                  setVisibleSections({
                    panorama_financeiro: true,
                    evolucao_fluxo: true,
                    por_cliente: true,
                    por_produto: true,
                    por_servico: true,
                    despesas_pagar: true,
                    cadastros: false
                  })
                }
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                Foco 100% Financeiro
              </button>
              <button
                type="button"
                onClick={() =>
                  setVisibleSections({
                    panorama_financeiro: false,
                    evolucao_fluxo: false,
                    por_cliente: true,
                    por_produto: true,
                    por_servico: true,
                    despesas_pagar: false,
                    cadastros: false
                  })
                }
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                Rankings (Cliente/Prod/Serv)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {DATA_SECTIONS_CONFIG.map(sec => {
              const checked = visibleSections[sec.key];
              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => toggleSection(sec.key)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    checked
                      ? 'bg-[#f6eff1]/60 border-[#53383e]/40 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="w-4 h-4 text-[#53383e] shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-tight">{sec.label}</div>
                    <div className="hidden md:block text-[11px] text-slate-500 leading-snug mt-0.5">{sec.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Caixa 4: Escolha do Tipo de Gráfico que Servirá para Tudo Selecionado */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-[#53383e]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  4. Tipo de Gráfico (Para Tudo Selecionado)
                </h2>
              </div>
              {Object.keys(chartOverrides).length > 0 && (
                <button
                  type="button"
                  onClick={() => setChartOverrides({})}
                  className="text-[11px] font-semibold text-[#53383e] hover:underline cursor-pointer"
                >
                  Sincronizar todos
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CHART_MODELS.map((m) => {
                const Icon = m.icon;
                const isSelected = globalModel === m.id && Object.keys(chartOverrides).length === 0;
                const isBaseModel = globalModel === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleGlobalModelChange(m.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      isSelected || isBaseModel
                        ? 'bg-[#53383e] border-[#53383e] text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-md shrink-0 ${
                        isSelected || isBaseModel ? 'bg-white/15 text-white' : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight">{m.label}</div>
                      <div
                        className={`hidden md:block text-[10px] leading-tight mt-0.5 ${
                          isSelected || isBaseModel ? 'text-white/80' : 'text-slate-500'
                        }`}
                      >
                        {m.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden md:block text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            Ao escolher um tipo acima, <strong>todos os gráficos selecionados</strong> assumem imediatamente esse formato. Você também pode ajustar um gráfico individual nos ícones do próprio card.
          </div>
        </div>
      </div>

      {/* Aviso quando nenhuma caixa de dado estiver marcada */}
      {activeSectionsCount === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-700">
            Nenhum bloco de dados selecionado na Caixa 3.
          </p>
          <button
            type="button"
            onClick={() => setVisibleSections(ALL_SECTIONS_ON)}
            className="px-4 py-2 bg-[#53383e] text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            Exibir Todos os Painéis & Gráficos
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* BLOCO 1: PANORAMA FINANCEIRO COMPLETO & DRE                           */}
      {/* ===================================================================== */}
      {visibleSections.panorama_financeiro && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#53383e]" />
              <span>Panorama Completo do Financeiro & DRE — {resolvedPeriod.label}</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {financialAnalytics.osCountFiltered} O.S. · {financialAnalytics.salesCountFiltered} Venda(s) Direta(s)
            </span>
          </div>

          {/* Faixa KPI Completa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">Receita Bruta</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {formatBRL(financialAnalytics.totalRevenue)}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block tabular-nums">
                OS: {formatBRL(financialAnalytics.osPaidValue + financialAnalytics.osPendingValue)}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">Recebido (Liquidado)</span>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
                {formatBRL(financialAnalytics.receivedTotal)}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block tabular-nums">
                {financialAnalytics.totalRevenue > 0
                  ? `${((financialAnalytics.receivedTotal / financialAnalytics.totalRevenue) * 100).toFixed(1)}% recebido`
                  : 'Sem receitas'}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">A Receber (Clientes)</span>
              <div className="text-xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
                {formatBRL(financialAnalytics.pendingReceivables)}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Títulos/O.S./Vendas abertas
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">Custos & Despesas</span>
              <div className="text-xl font-bold font-mono text-rose-700 mt-1 tabular-nums">
                {formatBRL(financialAnalytics.totalCosts)}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {financialAnalytics.hasEntityFilter ? 'CMV + Taxas (recorte direto)' : 'CMV + Folha + Fixos + Frota'}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">Contas a Pagar</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {formatBRL(financialAnalytics.payablesPending)}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block tabular-nums">
                Pagas: {formatBRL(financialAnalytics.payablesPaid)}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-500">
                {financialAnalytics.hasEntityFilter ? 'Resultado do Recorte' : 'Lucro Líquido (DRE)'}
              </span>
              <div
                className={`text-xl font-bold font-mono mt-1 tabular-nums ${
                  financialAnalytics.netProfit >= 0 ? 'text-blue-700' : 'text-rose-700'
                }`}
              >
                {formatBRL(financialAnalytics.netProfit)}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block tabular-nums">
                Margem: {financialAnalytics.netMarginPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Gráfico DRE + Tabela DRE Analítica */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-7">
              <FlexibleChartCard
                id="fin-dre"
                title="DRE Gerencial — Receita vs Estrutura de Custos"
                subtitle={`Composição financeira para ${resolvedPeriod.label}`}
                globalModel={globalModel}
                overrideModel={chartOverrides['fin-dre']}
                onOverrideChange={handleOverrideChange}
                formatValue={formatBRL}
                summaryRight={formatBRL(financialAnalytics.netProfit)}
                data={[
                  { label: 'Receita Bruta', shortLabel: 'Receita', value: financialAnalytics.totalRevenue, color: '#16a34a' },
                  { label: 'Peças & Insumos (CMV)', shortLabel: 'CMV', value: financialAnalytics.totalPartsCost, color: '#0891b2' },
                  ...(!financialAnalytics.hasEntityFilter
                    ? [
                        { label: 'Folha & Encargos', shortLabel: 'Folha', value: financialAnalytics.totalPersonnelCost, color: '#2563eb' },
                        { label: 'Frota & Veículos', shortLabel: 'Frota', value: financialAnalytics.totalVehicleCost, color: '#d97706' },
                        { label: 'Despesas Operacionais', shortLabel: 'Despesas', value: financialAnalytics.totalOperationalCost, color: '#dc2626' }
                      ]
                    : []),
                  { label: 'Taxas de Cartão', shortLabel: 'Taxas', value: financialAnalytics.totalCardFees, color: '#7c3aed' },
                  { label: 'Resultado / Lucro Líquido', shortLabel: 'Lucro', value: Math.max(0, financialAnalytics.netProfit), color: '#53383e' }
                ]}
              />
            </div>

            {/* Tabela Resumo DRE Executivo */}
            <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Demonstrativo Executivo (DRE)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Visão linha a linha do período e filtros ativos
                    </p>
                  </div>
                </div>

                <div className="mt-3 divide-y divide-slate-100 text-xs">
                  {[
                    { label: '(+) Receita de Serviços', value: financialAnalytics.serviceGross, tone: 'text-slate-800' },
                    { label: '(+) Receita de Produtos / Peças', value: financialAnalytics.partsGross, tone: 'text-slate-800' },
                    { label: '(+) Taxas de Visita Técnica', value: financialAnalytics.visitFeesGross, tone: 'text-slate-600' },
                    { label: '(-) Descontos Concedidos', value: -financialAnalytics.totalDiscounts, tone: 'text-amber-700' },
                    { label: '(=) Receita Líquida Operacional', value: financialAnalytics.totalRevenue, tone: 'font-bold text-slate-950' },
                    { label: '(-) Custo das Mercadorias / Peças (CMV)', value: -financialAnalytics.totalPartsCost, tone: 'text-rose-700' },
                    { label: '(-) Taxas de Operadoras / Cartão', value: -financialAnalytics.totalCardFees, tone: 'text-rose-700' },
                    { label: '(=) Margem de Contribuição', value: financialAnalytics.grossContribution, tone: 'font-bold text-emerald-700' },
                    ...(!financialAnalytics.hasEntityFilter
                      ? [
                          { label: '(-) Folha Salarial & Encargos (pro rata)', value: -financialAnalytics.totalPersonnelCost, tone: 'text-rose-700' },
                          { label: '(-) Despesas Operacionais & Contas', value: -financialAnalytics.totalOperationalCost, tone: 'text-rose-700' },
                          { label: '(-) Frota, Combustível & Manutenção', value: -financialAnalytics.totalVehicleCost, tone: 'text-rose-700' }
                        ]
                      : []),
                    {
                      label: financialAnalytics.hasEntityFilter ? '(=) Resultado Direto do Recorte' : '(=) Lucro / Prejuízo Líquido',
                      value: financialAnalytics.netProfit,
                      tone: `font-bold ${financialAnalytics.netProfit >= 0 ? 'text-blue-700' : 'text-rose-700'}`
                    }
                  ].map((row, idx) => {
                    const pct =
                      financialAnalytics.totalRevenue > 0
                        ? (Math.abs(row.value) / financialAnalytics.totalRevenue) * 100
                        : 0;
                    return (
                      <div key={idx} className="py-2 flex items-center justify-between gap-2 sm:gap-3">
                        <span className="text-slate-700 truncate">{row.label}</span>
                        <div className="flex items-center gap-2 sm:gap-3 font-mono tabular-nums shrink-0">
                          <span className="hidden sm:inline text-[11px] text-slate-400 w-12 text-right">{pct.toFixed(1)}%</span>
                          <span className={`sm:w-28 text-right ${row.tone}`}>{formatBRL(row.value)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* BLOCO 2: EVOLUÇÃO NO PERÍODO, CANAIS & FORMAS DE PAGAMENTO            */}
      {/* ===================================================================== */}
      {visibleSections.evolucao_fluxo && (
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#53383e]" />
            <span>Evolução Temporal, Canais & Formas de Pagamento</span>
          </h2>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <FlexibleChartCard
              id="fin-evolution"
              title="Evolução do Faturamento no Período"
              subtitle={`Agrupamento automático para ${resolvedPeriod.label}`}
              globalModel={globalModel}
              overrideModel={chartOverrides['fin-evolution']}
              onOverrideChange={handleOverrideChange}
              formatValue={formatBRL}
              data={financialAnalytics.timelineChart}
            />

            <FlexibleChartCard
              id="fin-payments"
              title="Faturamento por Forma de Pagamento"
              subtitle="Distribuição entre Pix, Cartões, Dinheiro, Boleto e Faturado"
              globalModel={globalModel}
              overrideModel={chartOverrides['fin-payments']}
              onOverrideChange={handleOverrideChange}
              formatValue={formatBRL}
              data={financialAnalytics.paymentMethodsChart}
            />

            <FlexibleChartCard
              id="fin-receivables"
              title="Receitas por Canal & Status (O.S. vs Vendas)"
              subtitle="Comparativo entre Ordens de Serviço e Vendas Diretas (Pagas vs Pendentes)"
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
              id="fin-cash-balance"
              title="Fluxo Financeiro: Receitas vs Custos & A Pagar"
              subtitle="Balanço geral de entradas recebidas, a receber, contas pagas e em aberto"
              globalModel={globalModel}
              overrideModel={chartOverrides['fin-cash-balance']}
              onOverrideChange={handleOverrideChange}
              formatValue={formatBRL}
              data={[
                { label: 'Receitas Recebidas', shortLabel: 'Recebidas', value: financialAnalytics.receivedTotal, color: '#16a34a' },
                { label: 'Receitas a Receber', shortLabel: 'A Receber', value: financialAnalytics.pendingReceivables, color: '#2563eb' },
                { label: 'Contas Pagas', shortLabel: 'Pagas', value: financialAnalytics.payablesPaid, color: '#0891b2' },
                { label: 'Contas a Pagar (Aberto)', shortLabel: 'A Pagar', value: financialAnalytics.payablesPending, color: '#dc2626' }
              ]}
            />
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* BLOCO 3: ANÁLISE FINANCEIRA POR CLIENTE                               */}
      {/* ===================================================================== */}
      {visibleSections.por_cliente && (
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <UserSquare2 className="w-4 h-4 text-[#53383e]" />
            <span>Panorama Financeiro por Cliente</span>
          </h2>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <FlexibleChartCard
              id="fin-by-client-rev"
              title="Top Clientes por Faturamento no Recorte"
              subtitle="Principais clientes em O.S. e Vendas Diretas no período selecionado"
              globalModel={globalModel}
              overrideModel={chartOverrides['fin-by-client-rev']}
              onOverrideChange={handleOverrideChange}
              formatValue={formatBRL}
              data={financialAnalytics.topClientsRevenueChart}
            />

            <FlexibleChartCard
              id="fin-by-client-pending"
              title="Contas a Receber por Cliente (Em Aberto)"
              subtitle="Clientes com valores pendentes de quitação no período"
              globalModel={globalModel}
              overrideModel={chartOverrides['fin-by-client-pending']}
              onOverrideChange={handleOverrideChange}
              formatValue={formatBRL}
              data={financialAnalytics.topClientsPendingChart}
            />
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* BLOCO 4: ANÁLISE FINANCEIRA POR PRODUTO                               */}
      {/* ===================================================================== */}
      {visibleSections.por_produto && (
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-[#53383e]" />
            <span>Panorama Financeiro por Produtos & Peças</span>
          </h2>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <FlexibleChartCard
              id="fin-by-product-rev"
              title="Top Produtos por Faturamento (O.S. + PDV)"
              subtitle="Receita gerada e CMV detalhado ao passar o cursor"
              globalModel={globalModel}
              overrideModel={chartOverrides['fin-by-product-rev']}
              onOverrideChange={handleOverrideChange}
              formatValue={formatBRL}
              data={financialAnalytics.topProductsRevenueChart}
            />

            <FlexibleChartCard
              id="fin-by-product-qty"
              title="Produtos Mais Movimentados (Quantidade)"
              subtitle="Unidades vendidas no balcão ou aplicadas em Ordens de Serviço"
              globalModel={globalModel}
              overrideModel={chartOverrides['fin-by-product-qty']}
              onOverrideChange={handleOverrideChange}
              formatValue={(v) => `${Math.round(v)} un`}
              data={financialAnalytics.topProductsQtyChart}
            />
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* BLOCO 5: ANÁLISE FINANCEIRA POR SERVIÇO                               */}
      {/* ===================================================================== */}
      {visibleSections.por_servico && (
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#53383e]" />
            <span>Panorama Financeiro por Serviços Prestados</span>
          </h2>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <FlexibleChartCard
              id="fin-by-service-rev"
              title="Top Serviços por Faturamento"
              subtitle="Serviços técnicos e instalações com maior receita no período"
              globalModel={globalModel}
              overrideModel={chartOverrides['fin-by-service-rev']}
              onOverrideChange={handleOverrideChange}
              formatValue={formatBRL}
              data={financialAnalytics.topServicesRevenueChart}
            />

            <FlexibleChartCard
              id="fin-by-service-qty"
              title="Serviços por Quantidade Executada"
              subtitle="Frequência de aplicação em Ordens de Serviço"
              globalModel={globalModel}
              overrideModel={chartOverrides['fin-by-service-qty']}
              onOverrideChange={handleOverrideChange}
              formatValue={(v) => `${Math.round(v)} exec.`}
              data={financialAnalytics.topServicesCountChart}
            />
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* BLOCO 6: DESPESAS OPERACIONAIS, FROTA & CONTAS A PAGAR                */}
      {/* ===================================================================== */}
      {visibleSections.despesas_pagar && (
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-[#53383e]" />
            <span>Despesas Operacionais, Frota & Contas a Pagar</span>
          </h2>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <FlexibleChartCard
              id="fin-expenses-category"
              title="Despesas & Frota por Categoria"
              subtitle="Maiores centros de custo no período selecionado"
              globalModel={globalModel}
              overrideModel={chartOverrides['fin-expenses-category']}
              onOverrideChange={handleOverrideChange}
              formatValue={formatBRL}
              data={financialAnalytics.expensesByCategoryChart}
            />

            <FlexibleChartCard
              id="suppliers-payables"
              title="Contas a Pagar em Aberto por Fornecedor"
              subtitle="Títulos pendentes de quitação vinculados aos fornecedores"
              globalModel={globalModel}
              overrideModel={chartOverrides['suppliers-payables']}
              onOverrideChange={handleOverrideChange}
              formatValue={formatBRL}
              summaryRight={formatBRL(supplierMetrics.totalEmAbertoGeral)}
              data={supplierMetrics.openBySupplierChart}
            />
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* BLOCO 7: INDICADORES CADASTRAIS (CLIENTES, FORNECEDORES, FUNCIONÁRIOS)*/}
      {/* ===================================================================== */}
      {visibleSections.cadastros && (
        <section className="space-y-5">
          {/* Sub-seção Clientes */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <UserSquare2 className="w-4 h-4 text-[#53383e]" />
              <span>Indicadores de Clientes</span>
            </h2>

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
                <span className="text-xs text-slate-500 mt-0.5 block">Empresas e condomínios com CNPJ</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <span className="text-xs font-medium text-slate-500">Pessoa Física (PF)</span>
                <div className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
                  {clientMetrics.pfCount}
                </div>
                <span className="text-xs text-slate-500 mt-0.5 block">Clientes residenciais com CPF/RG</span>
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
                subtitle="Comparativo entre tipo de pessoa e ordens em atendimento"
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
          </div>

          {/* Sub-seção Fornecedores */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-[#53383e]" />
              <span>Indicadores de Fornecedores</span>
            </h2>

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

          {/* Sub-seção Quadro de Funcionários */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#53383e]" />
              <span>Quadro de Funcionários & Custos de Folha</span>
            </h2>

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
          </div>
        </section>
      )}
    </div>
  );
};
