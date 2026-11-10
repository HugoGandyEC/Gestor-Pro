import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';

export interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (newPage: number) => void;
  onItemsPerPageChange?: (newItemsPerPage: number) => void;
  itemName?: string;
  pageSizeOptions?: number[];
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemName = 'registros',
  pageSizeOptions = [10, 25, 50, 100],
  className = ''
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(safeCurrentPage * itemsPerPage, totalItems);

  // Generate page numbers to display with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (safeCurrentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-700 ${className}`}>
      {/* Informações da Contagem de Páginas e Itens */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <span className="text-slate-600 font-medium">
          Exibindo <strong className="text-slate-900 font-mono font-bold">{startItem} - {endItem}</strong> de <strong className="text-slate-900 font-mono font-bold">{totalItems}</strong> {itemName}
        </span>

        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="text-slate-500 text-[11px]">Por pág:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                const val = Number(e.target.value);
                onItemsPerPageChange(val);
                onPageChange(1);
              }}
              className="bg-white border border-slate-300 rounded-md py-1 px-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#53383e] cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Controles de Navegação de Página */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
        <span className="text-slate-500 font-medium mr-1 text-[11px] hidden md:inline">
          Página <strong className="text-slate-900 font-mono font-bold">{safeCurrentPage}</strong> de <strong className="text-slate-900 font-mono font-bold">{totalPages}</strong>
        </span>

        {/* Primeira Página */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Primeira página"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Página Anterior */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Página anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Lista de Páginas Numéricas */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span key={`ell-${idx}`} className="px-1 text-slate-400 font-bold select-none">
                  ...
                </span>
              );
            }

            const isActive = p === safeCurrentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#53383e] text-white shadow-2xs border border-[#432c32]'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Próxima Página */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === totalPages || totalPages === 0}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Próxima página"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Última Página */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={safeCurrentPage === totalPages || totalPages === 0}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Última página"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
