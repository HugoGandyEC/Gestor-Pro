/**
 * Padrões modulares reutilizáveis (Framework-Agnostic / Vanilla JS & HTML)
 * 1. setupExpandableServiceOrders: Linha única compacta + Card expansível (+) para O.S. (Desktop & Mobile Stack)
 * 2. setupDenseRowTooltips: Card flutuante de detalhes ao passar o mouse (hover) em tabelas densas
 */

export interface ExpandableRowsController {
  destroy: () => void;
  collapseAll: () => void;
}

export function setupExpandableServiceOrders({
  containerSelector,
  triggerSelector = '.os-expand-card-btn',
  drawerAttr = 'data-os-drawer'
}: {
  containerSelector: string;
  triggerSelector?: string;
  drawerAttr?: string;
}): ExpandableRowsController {
  const container = document.querySelector<HTMLElement>(containerSelector);
  if (!container) {
    return { destroy: () => {}, collapseAll: () => {} };
  }

  const handleClick = (event: Event) => {
    const target = event.target as HTMLElement | null;
    const btn = target?.closest<HTMLButtonElement>(triggerSelector);
    if (!btn || !container.contains(btn)) return;

    const targetId = btn.getAttribute('aria-controls');
    if (!targetId) return;

    const drawer = document.getElementById(targetId);
    const parentRow = btn.closest('.os-compact-row, .os-mobile-card');
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    const nextState = !isExpanded;

    btn.setAttribute('aria-expanded', String(nextState));
    btn.textContent = nextState ? '−' : '+';
    if (parentRow) {
      parentRow.classList.toggle('is-expanded', nextState);
    }
    if (drawer) {
      drawer.hidden = !nextState;
    }
  };

  container.addEventListener('click', handleClick);

  return {
    collapseAll: () => {
      container.querySelectorAll<HTMLButtonElement>(triggerSelector).forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = '+';
        const targetId = btn.getAttribute('aria-controls');
        if (targetId) {
          const drawer = document.getElementById(targetId);
          if (drawer) drawer.hidden = true;
        }
      });
      container.querySelectorAll(`[${drawerAttr}]`).forEach(el => {
        (el as HTMLElement).hidden = true;
      });
      container.querySelectorAll('.is-expanded').forEach(el => {
        el.classList.remove('is-expanded');
      });
    },
    destroy: () => {
      container.removeEventListener('click', handleClick);
    }
  };
}

export function setupDenseRowTooltips({
  containerSelector,
  triggerSelector = '.hover-detail-trigger',
  cardSelector = '.hover-detail-card'
}: {
  containerSelector: string;
  triggerSelector?: string;
  cardSelector?: string;
}): { destroy: () => void } {
  const container = document.querySelector<HTMLElement>(containerSelector);
  if (!container) return { destroy: () => {} };

  const positionCard = (trigger: HTMLElement) => {
    if (window.innerWidth < 768) return;
    const card = trigger.querySelector<HTMLElement>(cardSelector);
    if (!card) return;

    const rect = trigger.getBoundingClientRect();
    const cardWidth = Math.min(360, window.innerWidth - 24);
    const top = Math.min(window.innerHeight - 240, rect.bottom + 8);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - cardWidth - 12));

    card.style.position = 'fixed';
    card.style.top = `${top}px`;
    card.style.left = `${left}px`;
    card.classList.add('is-visible');
  };

  const hideCard = (trigger: HTMLElement) => {
    const card = trigger.querySelector<HTMLElement>(cardSelector);
    if (card) card.classList.remove('is-visible');
  };

  const onEnter = (e: Event) => {
    const trigger = (e.target as HTMLElement | null)?.closest<HTMLElement>(triggerSelector);
    if (trigger && container.contains(trigger)) positionCard(trigger);
  };

  const onLeave = (e: Event) => {
    const trigger = (e.target as HTMLElement | null)?.closest<HTMLElement>(triggerSelector);
    if (trigger && container.contains(trigger)) hideCard(trigger);
  };

  container.addEventListener('mouseover', onEnter);
  container.addEventListener('mouseout', onLeave);
  container.addEventListener('focusin', onEnter);
  container.addEventListener('focusout', onLeave);

  return {
    destroy: () => {
      container.removeEventListener('mouseover', onEnter);
      container.removeEventListener('mouseout', onLeave);
      container.removeEventListener('focusin', onEnter);
      container.removeEventListener('focusout', onLeave);
    }
  };
}

export const DENSE_TABLE_HTML_TEMPLATE = `
<table class="dense-table">
  <thead>
    <tr>
      <th>Código</th>
      <th>Registro Principal</th>
      <th>Contato / Local</th>
      <th style="text-align:right">Valor</th>
      <th style="text-align:right">Ações</th>
    </tr>
  </thead>
  <tbody>
    <tr class="dense-row">
      <td>#CLI-014</td>
      <td>
        <div class="hover-detail-trigger has-inline-card" tabindex="0">
          <strong>Condomínio Residencial Solar</strong>
          <div class="hover-detail-card" role="tooltip">
            <strong>Condomínio Residencial Solar</strong>
            <p>CNPJ: 12.345.678/0001-90 · Atacadista</p>
            <p>End.: Av. Paulista, 1500 - São Paulo/SP</p>
          </div>
        </div>
      </td>
      <td>(11) 99999-0000</td>
      <td style="text-align:right">R$ 2.450,00</td>
      <td style="text-align:right">...</td>
    </tr>
  </tbody>
</table>
`.trim();

export const OS_COMPACT_ROW_HTML_TEMPLATE = `
<tr class="os-compact-row">
  <td><strong>2026-104</strong></td>
  <td>Em Andamento</td>
  <td>14/11/2026</td>
  <td class="whitespace-normal">Maria Aparecida Oliveira Santos</td>
  <td style="text-align:right">R$ 1.280,00</td>
  <td style="text-align:right">
    <button
      type="button"
      class="os-expand-card-btn"
      aria-expanded="false"
      aria-controls="os-drawer-104"
      title="Expandir detalhes da OS"
    >+</button>
  </td>
</tr>
<tr id="os-drawer-104" data-os-drawer hidden>
  <td colspan="6" class="os-expanded-drawer">
    <!-- Detalhes completos: técnico, aparelho, garantia, peças usadas, serviços, parcelas -->
  </td>
</tr>
`.trim();
