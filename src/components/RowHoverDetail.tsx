import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface HoverDetailField {
  label: string;
  value: React.ReactNode;
}

interface RowHoverDetailProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeClassName?: string;
  fields: HoverDetailField[];
  footer?: string;
  className?: string;
}

/**
 * Componente reutilizável para tabelas densas compactas:
 * exibe conteúdo abreviado na célula e, ao passar o mouse (hover/focus),
 * abre um card flutuante com posicionamento fixo seguro (não sofre corte por overflow-x/hidden).
 */
export const RowHoverDetail: React.FC<RowHoverDetailProps> = ({
  children,
  title,
  subtitle,
  badge,
  badgeClassName,
  fields,
  footer,
  className = ''
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; visible: boolean }>({
    top: 0,
    left: 0,
    visible: false
  });

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el || typeof window === 'undefined') return;
    // Em telas touch/mobile estreitas o card flutuante não é exibido (layout mobile já mostra cards empilhados)
    if (window.innerWidth < 768) return;

    const rect = el.getBoundingClientRect();
    const cardWidth = Math.min(360, window.innerWidth - 24);
    const estimatedHeight = 96 + fields.filter(f => Boolean(f.value)).length * 28 + (footer ? 34 : 0);

    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

    const top = placeAbove
      ? Math.max(12, rect.top - estimatedHeight - 8)
      : Math.min(window.innerHeight - estimatedHeight - 12, rect.bottom + 8);

    const left = Math.max(12, Math.min(rect.left, window.innerWidth - cardWidth - 12));

    setCoords({ top, left, visible: true });
  };

  const handleClose = () => {
    setCoords(prev => (prev.visible ? { ...prev, visible: false } : prev));
  };

  useEffect(() => {
    if (!coords.visible) return;
    const onScroll = () => handleClose();
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [coords.visible]);

  const validFields = fields.filter(f => f.value !== undefined && f.value !== null && f.value !== '');

  return (
    <div
      ref={triggerRef}
      onMouseEnter={updatePosition}
      onMouseLeave={handleClose}
      onFocus={updatePosition}
      onBlur={handleClose}
      className={`hover-detail-trigger ${className}`}
    >
      {children}

      {coords.visible &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="tooltip"
            style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
            className="hover-detail-card is-visible"
          >
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="min-w-0">
                <div className="font-bold text-slate-900 text-xs leading-snug">{title}</div>
                {subtitle && <div className="text-[11px] text-slate-500 mt-0.5">{subtitle}</div>}
              </div>
              {badge && (
                <span
                  className={
                    badgeClassName ||
                    'shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700'
                  }
                >
                  {badge}
                </span>
              )}
            </div>

            {validFields.length > 0 && (
              <dl className="mt-2 space-y-1.5 text-[11px]">
                {validFields.map((field, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500 font-medium shrink-0">{field.label}:</dt>
                    <dd className="text-slate-800 font-medium text-right break-words min-w-0">
                      {field.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {footer && (
              <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500 leading-relaxed">
                {footer}
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
