import React from 'react';
import { List, LayoutGrid } from 'lucide-react';

export type ViewMode = 'list' | 'grid';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

/**
 * Alternador padronizado de apresentação: Listagem (tabela compacta) vs Grade (cards).
 */
export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  onChange,
  className = ''
}) => {
  return (
    <div
      className={`inline-flex items-center gap-0.5 p-0.5 rounded-lg border border-[#d8d8d8] bg-[#f4f5f6] shrink-0 ${className}`}
      role="group"
      aria-label="Modo de visualização"
    >
      <button
        type="button"
        onClick={() => onChange('list')}
        aria-pressed={viewMode === 'list'}
        title="Visualização em Listagem"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
          viewMode === 'list'
            ? 'bg-[#53383e] text-white shadow-2xs'
            : 'text-[#363739] hover:bg-white/80'
        }`}
      >
        <List className="w-3.5 h-3.5" />
        <span>Listagem</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('grid')}
        aria-pressed={viewMode === 'grid'}
        title="Visualização em Grade (Cards)"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
          viewMode === 'grid'
            ? 'bg-[#53383e] text-white shadow-2xs'
            : 'text-[#363739] hover:bg-white/80'
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span>Grade</span>
      </button>
    </div>
  );
};
