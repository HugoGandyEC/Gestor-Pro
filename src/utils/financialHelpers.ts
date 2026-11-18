import { Employee, GeneralExpense, InitialSetupCostItem, PaymentSplit, ServiceOrder } from '../types';

const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

const MONTH_SHORT_PT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez'
];

/**
 * Retorna a data atual no formato YYYY-MM-DD (horário local)
 */
export function getTodayISODate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Retorna o mês/ano atual no formato YYYY-MM (horário local)
 */
export function getCurrentMonthYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Converte YYYY-MM para rótulo legível em português (ex: "Maio / 2026")
 */
export function getMonthLabelBR(monthYear: string): string {
  if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) return monthYear || '';
  const [y, m] = monthYear.split('-');
  const idx = Number(m) - 1;
  if (idx < 0 || idx > 11) return monthYear;
  return `${MONTH_NAMES_PT[idx]} / ${y}`;
}

/**
 * Retorna os 12 meses (Jan–Dez) de um determinado ano
 */
export function getMonthsOfYear(year: number): { key: string; label: string; fullLabel: string }[] {
  return MONTH_SHORT_PT.map((shortName, idx) => {
    const mm = String(idx + 1).padStart(2, '0');
    return {
      key: `${year}-${mm}`,
      label: shortName,
      fullLabel: `${MONTH_NAMES_PT[idx]} / ${year}`
    };
  });
}

/**
 * Retorna quantidade exata de dias de um mês YYYY-MM
 */
export function getDaysInMonthYear(monthYear: string): number {
  if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) return 30;
  const [y, m] = monthYear.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

/**
 * Gera lista dinâmica de meses disponíveis (12 meses passados até 2 meses futuros + mês selecionado + meses com registros)
 */
export function getAvailableMonths(
  selectedMonthYear: string,
  extraDates: (string | undefined)[] = []
): { value: string; label: string }[] {
  const monthSet = new Set<string>();
  const now = new Date();

  // 12 meses para trás até 2 meses para frente
  for (let offset = -12; offset <= 2; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthSet.add(key);
  }

  if (selectedMonthYear && /^\d{4}-\d{2}$/.test(selectedMonthYear)) {
    monthSet.add(selectedMonthYear);
  }

  extraDates.forEach(dateStr => {
    if (dateStr && /^\d{4}-\d{2}/.test(dateStr)) {
      monthSet.add(dateStr.slice(0, 7));
    }
  });

  return Array.from(monthSet)
    .sort((a, b) => b.localeCompare(a))
    .map(value => ({
      value,
      label: getMonthLabelBR(value)
    }));
}

/**
 * Verifica se o funcionário está ativo para fins de folha salarial / DRE
 */
export function isActiveEmployee(emp: Employee): boolean {
  return emp.status !== 'Inativo';
}

/**
 * Verifica se a O.S. conta como receita realizada no DRE
 */
export function isServiceOrderFinishedForDRE(order: ServiceOrder): boolean {
  return (
    order.status === 'concluida_aguardando_retirada' ||
    order.status === 'entregue_finalizada'
  );
}

/**
 * Verifica se a O.S. conta como conta a receber real (exclui canceladas e orçamentos não aprovados)
 */
export function isServiceOrderReceivable(order: ServiceOrder): boolean {
  return (
    order.status !== 'cancelada' &&
    order.status !== 'orcamento_aberto' &&
    order.status !== 'aguardando_aprovacao'
  );
}

/**
 * Cálculo financeiro padronizado de uma Ordem de Serviço.
 * Rateia o desconto proporcionalmente entre serviços e peças, evitando receita negativa de serviços
 * quando o desconto é maior que o valor da mão de obra.
 */
export interface ServiceOrderFinancialBreakdown {
  grossServices: number;
  visitFee: number;
  grossParts: number;
  partsCost: number;
  grossSubtotal: number;
  discount: number;
  netServicesAndVisit: number;
  netParts: number;
  netTotal: number;
  absorbedCardFees: number;
}

export function computeAbsorbedCardFees(payments?: PaymentSplit[]): number {
  if (!Array.isArray(payments) || payments.length === 0) return 0;
  return Number(
    payments
      .reduce((acc, p) => {
        if (!p || !p.rateAmount) return acc;
        if (p.absorptionMode === 'repassar') return acc;
        return acc + Math.max(0, Number(p.rateAmount || 0));
      }, 0)
      .toFixed(2)
  );
}

export function computeServiceOrderFinancials(order: ServiceOrder): ServiceOrderFinancialBreakdown {
  const grossServices = (order.services || []).reduce((acc, s) => acc + Number(s.price || 0), 0);
  const visitFee = Number(order.visitFee || 0);
  const grossParts = (order.parts || []).reduce(
    (acc, p) => acc + Number(p.price || 0) * Number(p.quantity || 1),
    0
  );
  const partsCost = (order.parts || []).reduce(
    (acc, p) => acc + Number(p.cost || 0) * Number(p.quantity || 1),
    0
  );

  const grossSubtotal = grossServices + visitFee + grossParts;
  const discount = Math.min(grossSubtotal, Math.max(0, Number(order.calculatedDiscount || 0)));
  const netTotal = Math.max(0, Number((grossSubtotal - discount).toFixed(2)));

  let netServicesAndVisit = 0;
  let netParts = 0;

  if (grossSubtotal > 0) {
    const servicesShare = (grossServices + visitFee) / grossSubtotal;
    netServicesAndVisit = Math.max(
      0,
      Number(((grossServices + visitFee) - discount * servicesShare).toFixed(2))
    );
    netParts = Math.max(0, Number((netTotal - netServicesAndVisit).toFixed(2)));
  }

  const absorbedCardFees = computeAbsorbedCardFees(order.payments);

  return {
    grossServices: Number(grossServices.toFixed(2)),
    visitFee: Number(visitFee.toFixed(2)),
    grossParts: Number(grossParts.toFixed(2)),
    partsCost: Number(partsCost.toFixed(2)),
    grossSubtotal: Number(grossSubtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    netServicesAndVisit,
    netParts,
    netTotal,
    absorbedCardFees
  };
}

/**
 * Calcula parcelas de dívidas ativas ainda não quitadas e não sincronizadas em generalExpenses
 */
export function computeUnsyncedDebtInstallments(setupCosts: InitialSetupCostItem[]): number {
  return Number(
    setupCosts
      .filter(s => {
        if (s.costType !== 'parcelado' || s.status === 'quitado' || s.syncWithGeneralExpenses) {
          return false;
        }
        const totalInst = s.installmentsCount || 1;
        const paidInst = s.paidInstallments || 0;
        return totalInst - paidInst > 0;
      })
      .reduce((acc, s) => acc + Number(s.installmentValue || 0), 0)
      .toFixed(2)
  );
}

/**
 * Verifica se uma despesa geral é proveniente de folha/comissão automática (já contada em Pessoal)
 */
export function isAutoPayrollExpense(expense: GeneralExpense): boolean {
  return expense.id.startsWith('auto-emp-');
}
