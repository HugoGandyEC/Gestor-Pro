import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ProductPhotoThumb } from './ProductPhotoThumb';

export interface HoverTooltipField {
  label: string;
  value?: React.ReactNode;
  fullWidth?: boolean;
}

export interface HoverTooltipData {
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  imageAlt?: string;
  showImageSlot?: boolean;
  fields: HoverTooltipField[];
  footerHint?: string;
}

interface ActiveHoverState {
  data: HoverTooltipData;
  rect: DOMRect;
}

/**
 * Hook + Card flutuante via Portal para exibir descrição completa dos dados
 * cadastrados quando o mouse passa sobre qualquer linha de cadastro/listagem.
 */
export function useRowHoverTooltip() {
  const [hovered, setHovered] = useState<ActiveHoverState | null>(null);

  const canHover = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return true;
    return window.matchMedia('(hover: hover)').matches;
  }, []);

  const showTooltip = useCallback(
    (e: React.MouseEvent<HTMLElement>, data: HoverTooltipData) => {
      if (!canHover()) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setHovered({ data, rect });
    },
    [canHover]
  );

  const hideTooltip = useCallback(() => {
    setHovered(null);
  }, []);

  useEffect(() => {
    if (!hovered) return;
    const clear = () => setHovered(null);
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setHovered(null);
    };
    window.addEventListener('scroll', clear, true);
    window.addEventListener('resize', clear);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('scroll', clear, true);
      window.removeEventListener('resize', clear);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [hovered]);

  const tooltipElement = hovered ? <RowHoverTooltipPortal state={hovered} /> : null;

  return {
    showTooltip,
    hideTooltip,
    tooltipElement
  };
}

const RowHoverTooltipPortal: React.FC<{ state: ActiveHoverState }> = ({ state }) => {
  if (typeof document === 'undefined') return null;

  const { data, rect } = state;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxWidth = Math.min(440, vw - 24);

  // Alinha à esquerda da linha sem sair da tela
  let left = Math.max(12, Math.min(rect.left + 20, vw - maxWidth - 12));

  // Decide se abre abaixo ou acima da linha dependendo do espaço disponível
  const estimatedHeight = 270;
  const spaceBelow = vh - rect.bottom;
  const showAbove = spaceBelow < estimatedHeight && rect.top > estimatedHeight;
  const top = showAbove ? Math.max(12, rect.top - 8) : Math.min(vh - 24, rect.bottom + 8);

  const validFields = data.fields.filter(
    f => f.value !== undefined && f.value !== null && f.value !== ''
  );

  const hasMedia = Boolean(data.imageUrl || data.showImageSlot);

  return createPortal(
    <div
      role="tooltip"
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${maxWidth}px`,
        transform: showAbove ? 'translateY(-100%)' : 'none',
        zIndex: 9999
      }}
      className="pointer-events-none bg-white border border-slate-300 rounded-xl shadow-2xl p-3.5 text-xs text-slate-800 animate-in fade-in duration-100"
    >
      <div className="pb-2 border-b border-slate-100 flex items-start gap-3">
        {hasMedia && (
          <ProductPhotoThumb
            src={data.imageUrl}
            alt={data.imageAlt || data.title}
            className="w-16 h-16 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden"
            iconClassName="w-6 h-6 text-slate-400"
            emptyLabel={!data.imageUrl ? 'Sem foto' : undefined}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-bold text-slate-900 text-[13px] leading-snug break-words">
            {data.title}
          </div>
          {data.subtitle && (
            <div className="text-[11px] text-slate-500 mt-0.5 break-words">
              {data.subtitle}
            </div>
          )}
        </div>
      </div>

      {data.description && (
        <p className="mt-2 text-[11px] text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 leading-relaxed line-clamp-3 break-words">
          {data.description}
        </p>
      )}

      {validFields.length > 0 && (
        <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5">
          {validFields.map((field, idx) => (
            <div key={idx} className={field.fullWidth ? 'col-span-2' : 'min-w-0'}>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {field.label}
              </dt>
              <dd className="text-[11px] font-semibold text-slate-800 break-words tabular-nums">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-2.5 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
        <span>{data.footerHint || 'Clique no botão (+) para abrir todos os dados completos'}</span>
      </div>
    </div>,
    document.body
  );
};
