import React, { useEffect, useId, useRef, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';

export interface LiveSearchOption<T = unknown> {
  id: string;
  title: string;
  subtitle?: string;
  priceText?: string;
  badgeText?: string;
  badgeClassName?: string;
  thumbnailUrl?: string;
  icon?: React.ReactNode;
  data: T;
}

interface LiveSearchInputProps<T = unknown> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minChars?: number;
  debounceMs?: number;
  maxResults?: number;
  getOptions?: (debouncedQuery: string) => LiveSearchOption<T>[] | Promise<LiveSearchOption<T>[]>;
  onSelect?: (option: LiveSearchOption<T>) => void;
  emptyLabel?: string;
  emptyAction?: (query: string, close: () => void) => React.ReactNode;
  clearOnSelect?: boolean;
  inputClassName?: string;
  containerClassName?: string;
  autoFocus?: boolean;
}

function renderHighlightedText(text: string, query: string): React.ReactNode {
  const clean = query.trim();
  if (!clean) return text;
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  if (parts.length <= 1) return text;

  return parts.map((part, i) =>
    part.toLowerCase() === clean.toLowerCase() ? (
      <mark key={i} className="search-highlight">
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

function SearchOptionThumb({
  src,
  title,
  icon
}: {
  src?: string;
  title: string;
  icon?: React.ReactNode;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={title}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className="search-item-thumb"
      />
    );
  }

  return (
    <div className="search-item-thumb">
      {icon || title.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function LiveSearchInput<T = unknown>({
  value,
  onChange,
  placeholder = 'Digite ao menos 2 caracteres para buscar...',
  minChars = 2,
  debounceMs = 300,
  maxResults = 10,
  getOptions,
  onSelect,
  emptyLabel = 'Nenhum resultado',
  emptyAction,
  clearOnSelect = false,
  inputClassName = '',
  containerClassName = '',
  autoFocus = false
}: LiveSearchInputProps<T>) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const requestSeqRef = useRef(0);
  const getOptionsRef = useRef(getOptions);
  getOptionsRef.current = getOptions;

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [options, setOptions] = useState<LiveSearchOption<T>[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const effectiveDebounce = Math.max(300, debounceMs);
  const trimmed = value.trim();
  const hasGetOptions = Boolean(getOptions);

  // Ativação >= 2 caracteres + Debounce mínimo de 300ms
  useEffect(() => {
    if (!hasGetOptions) {
      setIsOpen(false);
      setIsLoading(false);
      setOptions([]);
      return;
    }

    if (trimmed.length < minChars) {
      requestSeqRef.current += 1;
      setIsOpen(false);
      setIsLoading(false);
      setOptions([]);
      setDebouncedQuery('');
      setActiveIndex(-1);
      return;
    }

    setIsOpen(true);
    setIsLoading(true);
    const currentSeq = ++requestSeqRef.current;

    const timer = setTimeout(async () => {
      try {
        const resolver = getOptionsRef.current;
        const result = resolver ? await resolver(trimmed) : [];
        if (requestSeqRef.current !== currentSeq) return;
        const limited = (result || []).slice(0, maxResults);
        setOptions(limited);
        setDebouncedQuery(trimmed);
        setActiveIndex(limited.length > 0 ? 0 : -1);
      } catch {
        if (requestSeqRef.current !== currentSeq) return;
        setOptions([]);
        setDebouncedQuery(trimmed);
        setActiveIndex(-1);
      } finally {
        if (requestSeqRef.current === currentSeq) {
          setIsLoading(false);
        }
      }
    }, effectiveDebounce);

    return () => clearTimeout(timer);
  }, [trimmed, minChars, effectiveDebounce, maxResults, hasGetOptions]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  // Manter item ativo visível durante navegação por teclado
  useEffect(() => {
    if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const handleClose = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleSelectOption = (option: LiveSearchOption<T>) => {
    if (onSelect) {
      onSelect(option);
    } else {
      onChange(option.title);
    }
    if (clearOnSelect) {
      onChange('');
    }
    handleClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClose();
      return;
    }
    if (!isOpen || options.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + options.length) % options.length);
    } else if (e.key === 'Enter' && activeIndex >= 0 && options[activeIndex]) {
      e.preventDefault();
      handleSelectOption(options[activeIndex]);
    }
  };

  return (
    <div ref={containerRef} className={`global-search-container ${containerClassName}`}>
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (getOptions && trimmed.length >= minChars) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className={
            inputClassName ||
            'w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#53383e]/30 focus:border-[#53383e] focus:bg-white transition-colors'
          }
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              handleClose();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
            title="Limpar busca"
            aria-label="Limpar busca"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && getOptions && trimmed.length >= minChars && (
        <div id={listboxId} role="listbox" className="search-modal">
          {isLoading ? (
            <div className="search-modal-status" role="status" aria-live="polite">
              <div className="inline-flex items-center gap-2 text-slate-600 font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-[#53383e]" />
                <span>Buscando...</span>
              </div>
            </div>
          ) : options.length === 0 ? (
            <div className="search-modal-status">
              <div className="text-slate-500">
                {emptyLabel} encontrado para &quot;<strong className="text-slate-800">{debouncedQuery || trimmed}</strong>&quot;
              </div>
              {emptyAction && emptyAction(debouncedQuery || trimmed, handleClose)}
            </div>
          ) : (
            <div>
              {options.map((opt, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={opt.id}
                    ref={(el) => {
                      itemRefs.current[idx] = el;
                    }}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => handleSelectOption(opt)}
                    className={`search-item ${isActive ? 'is-active' : ''}`}
                  >
                    <SearchOptionThumb
                      src={opt.thumbnailUrl}
                      title={opt.title}
                      icon={opt.icon}
                    />

                    <div className="search-item-content">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="search-item-title">
                          {renderHighlightedText(opt.title, debouncedQuery || trimmed)}
                        </span>
                        {opt.badgeText && (
                          <span
                            className={
                              opt.badgeClassName ||
                              'shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700'
                            }
                          >
                            {opt.badgeText}
                          </span>
                        )}
                      </div>
                      {opt.subtitle && (
                        <div className="search-item-subtitle">
                          {renderHighlightedText(opt.subtitle, debouncedQuery || trimmed)}
                        </div>
                      )}
                    </div>

                    {opt.priceText && <div className="search-item-price">{opt.priceText}</div>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
