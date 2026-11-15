/**
 * Padrão modular reutilizável (Framework-Agnostic / Vanilla JS & HTML):
 * Lista compacta em linha única (sem linha abaixo) + Botão (+) para abrir todos os dados em uma Modal.
 */

export interface ListModalController {
  destroy: () => void;
}

export function setupListDetailModals({
  containerSelector,
  triggerSelector = '.list-plus-btn',
  onOpenDetail
}: {
  containerSelector: string;
  triggerSelector?: string;
  onOpenDetail: (recordId: string, triggerBtn: HTMLButtonElement) => void;
}): ListModalController {
  const container = document.querySelector<HTMLElement>(containerSelector);
  if (!container) {
    return { destroy: () => {} };
  }

  const handleClick = (event: Event) => {
    const target = event.target as HTMLElement | null;
    const btn = target?.closest<HTMLButtonElement>(triggerSelector);
    if (!btn || !container.contains(btn)) return;

    const recordId = btn.getAttribute('data-record-id') || '';
    if (recordId) {
      onOpenDetail(recordId, btn);
    }
  };

  container.addEventListener('click', handleClick);

  return {
    destroy: () => {
      container.removeEventListener('click', handleClick);
    }
  };
}

export const COMPACT_LIST_ROW_HTML_TEMPLATE = `
<div class="overflow-x-auto">
  <table class="dense-table">
    <thead>
      <tr>
        <th>Código</th>
        <th>Nome / Registro</th>
        <th>Contato</th>
        <th style="text-align:right">Total</th>
        <th style="text-align:right">Ações</th>
      </tr>
    </thead>
    <tbody>
      <tr class="dense-row">
        <td><strong>2026-104</strong></td>
        <td>Maria Aparecida Oliveira Santos</td>
        <td>(11) 99999-0000</td>
        <td style="text-align:right">R$ 1.280,00</td>
        <td style="text-align:right">
          <button
            type="button"
            class="list-plus-btn"
            data-record-id="104"
            title="Abrir todos os dados em modal"
          >+</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
`.trim();
