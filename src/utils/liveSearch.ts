export interface LiveSearchItemData {
  id: string;
  title: string;
  subtitle?: string;
  price?: string | number;
  thumbnailUrl?: string;
  badgeText?: string;
  raw?: unknown;
}

export interface SetupLiveSearchOptions {
  inputSelector: string;
  modalSelector: string;
  apiEndpoint?: string;
  fetchResults?: (query: string, signal: AbortSignal) => Promise<LiveSearchItemData[]>;
  formatPrice?: (price: string | number) => string;
  onSelect?: (item: LiveSearchItemData) => void;
  minChars?: number;
  debounceMs?: number;
  emptyLabel?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function highlightMatch(text: string, query: string): string {
  const safeText = escapeHtml(text);
  const cleanQuery = query.trim();
  if (!cleanQuery) return safeText;
  const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safeText.replace(new RegExp(`(${escapedQuery})`, 'gi'), '<mark class="search-highlight">$1</mark>');
}

/**
 * Utilitário reutilizável (Framework-Agnostic / Vanilla JS) para padronizar busca dinâmica
 * com debounce >= 300ms, ativação >= 2 caracteres, loading, dismiss e navegação por teclado.
 */
export function setupLiveSearch({
  inputSelector,
  modalSelector,
  apiEndpoint,
  fetchResults,
  formatPrice,
  onSelect,
  minChars = 2,
  debounceMs = 300,
  emptyLabel = 'Nenhum resultado'
}: SetupLiveSearchOptions): { destroy: () => void; close: () => void } {
  const input = document.querySelector<HTMLInputElement>(inputSelector);
  const modal = document.querySelector<HTMLElement>(modalSelector);

  if (!input || !modal) {
    return { destroy: () => {}, close: () => {} };
  }

  const effectiveDebounce = Math.max(300, debounceMs);
  const container = input.closest('.global-search-container') || input.parentElement;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let abortController: AbortController | null = null;
  let items: LiveSearchItemData[] = [];
  let activeIndex = -1;

  const closeModal = () => {
    modal.hidden = true;
    modal.innerHTML = '';
    items = [];
    activeIndex = -1;
    input.setAttribute('aria-expanded', 'false');
  };

  const renderLoading = () => {
    modal.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    modal.innerHTML = `
      <div class="search-modal-status" role="status" aria-live="polite">
        <span>Buscando...</span>
      </div>
    `;
  };

  const renderEmpty = (query: string) => {
    modal.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    modal.innerHTML = `
      <div class="search-modal-status">
        <span>${escapeHtml(emptyLabel)} encontrado para "<strong>${escapeHtml(query)}</strong>"</span>
      </div>
    `;
  };

  const formatValue = (price?: string | number): string => {
    if (price === undefined || price === null || price === '') return '';
    if (formatPrice) return formatPrice(price);
    if (typeof price === 'number') {
      return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    return String(price);
  };

  const updateActiveHighlight = () => {
    const buttons = modal.querySelectorAll<HTMLButtonElement>('.search-item');
    buttons.forEach((btn, idx) => {
      if (idx === activeIndex) {
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
        btn.scrollIntoView({ block: 'nearest' });
      } else {
        btn.classList.remove('is-active');
        btn.setAttribute('aria-selected', 'false');
      }
    });
  };

  const selectItem = (item: LiveSearchItemData) => {
    if (onSelect) {
      onSelect(item);
    } else {
      input.value = item.title;
    }
    closeModal();
  };

  const renderResults = (list: LiveSearchItemData[], query: string) => {
    items = list;
    activeIndex = list.length > 0 ? 0 : -1;

    if (list.length === 0) {
      renderEmpty(query);
      return;
    }

    modal.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    modal.innerHTML = list
      .map((item, idx) => {
        const thumbHtml = item.thumbnailUrl
          ? `<img src="${escapeHtml(item.thumbnailUrl)}" alt="" class="search-item-thumb" />`
          : `<div class="search-item-thumb">${escapeHtml((item.badgeText || item.title).slice(0, 2).toUpperCase())}</div>`;

        const priceText = formatValue(item.price);

        return `
          <button
            type="button"
            role="option"
            data-index="${idx}"
            class="search-item ${idx === activeIndex ? 'is-active' : ''}"
            aria-selected="${idx === activeIndex ? 'true' : 'false'}"
          >
            ${thumbHtml}
            <div class="search-item-content">
              <div class="search-item-title">${highlightMatch(item.title, query)}</div>
              ${item.subtitle ? `<div class="search-item-subtitle">${escapeHtml(item.subtitle)}</div>` : ''}
            </div>
            ${priceText ? `<div class="search-item-price">${escapeHtml(priceText)}</div>` : ''}
          </button>
        `;
      })
      .join('');

    modal.querySelectorAll<HTMLButtonElement>('.search-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = Number(btn.dataset.index);
        if (!Number.isNaN(index) && items[index]) {
          selectItem(items[index]);
        }
      });
    });
  };

  const executeSearch = async (query: string) => {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    try {
      let data: LiveSearchItemData[] = [];
      if (fetchResults) {
        data = await fetchResults(query, abortController.signal);
      } else if (apiEndpoint) {
        const separator = apiEndpoint.includes('?') ? '&' : '?';
        const response = await fetch(`${apiEndpoint}${separator}q=${encodeURIComponent(query)}`, {
          signal: abortController.signal
        });
        if (!response.ok) throw new Error('Falha ao buscar resultados');
        data = await response.json();
      }
      renderResults(Array.isArray(data) ? data : [], query);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        renderEmpty(query);
      }
    }
  };

  const handleInput = () => {
    const query = input.value.trim();
    if (debounceTimer) clearTimeout(debounceTimer);

    if (query.length < minChars) {
      if (abortController) abortController.abort();
      closeModal();
      return;
    }

    renderLoading();
    debounceTimer = setTimeout(() => {
      executeSearch(query);
    }, effectiveDebounce);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
      return;
    }
    if (modal.hidden || items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      updateActiveHighlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateActiveHighlight();
    } else if (e.key === 'Enter' && activeIndex >= 0 && items[activeIndex]) {
      e.preventDefault();
      selectItem(items[activeIndex]);
    }
  };

  const handleOutsideClick = (e: Event) => {
    if (container && !container.contains(e.target as Node)) {
      closeModal();
    }
  };

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  modal.setAttribute('role', 'listbox');
  closeModal();

  input.addEventListener('input', handleInput);
  input.addEventListener('keydown', handleKeyDown);
  document.addEventListener('pointerdown', handleOutsideClick);

  return {
    close: closeModal,
    destroy: () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (abortController) abortController.abort();
      input.removeEventListener('input', handleInput);
      input.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handleOutsideClick);
    }
  };
}

export const LIVE_SEARCH_HTML_TEMPLATE = `
<div class="global-search-container">
  <input
    type="search"
    id="global-search-input"
    placeholder="Digite pelo menos 2 caracteres para buscar..."
    autocomplete="off"
  />
  <div id="global-search-results" class="search-modal" hidden></div>
</div>
`.trim();
