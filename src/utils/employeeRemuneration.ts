import { Employee, EmployeeRemunerationType } from '../types';

export const REMUNERATION_TYPE_OPTIONS: Array<{
  value: EmployeeRemunerationType;
  label: string;
  shortLabel: string;
  usesSalary: boolean;
  usesHourly: boolean;
  usesCommission: boolean;
}> = [
  {
    value: 'salario',
    label: 'Salário Fixo',
    shortLabel: 'Salário',
    usesSalary: true,
    usesHourly: false,
    usesCommission: false
  },
  {
    value: 'hora_trabalhada',
    label: 'Hora Trabalhada',
    shortLabel: 'Hora Trab.',
    usesSalary: false,
    usesHourly: true,
    usesCommission: false
  },
  {
    value: 'comissao',
    label: 'Comissão',
    shortLabel: 'Comissão',
    usesSalary: false,
    usesHourly: false,
    usesCommission: true
  },
  {
    value: 'salario_comissao',
    label: 'Salário + Comissão',
    shortLabel: 'Salário + Com.',
    usesSalary: true,
    usesHourly: false,
    usesCommission: true
  },
  {
    value: 'hora_comissao',
    label: 'Hora Trabalhada + Comissão',
    shortLabel: 'Hora + Com.',
    usesSalary: false,
    usesHourly: true,
    usesCommission: true
  }
];

export const REMUNERATION_TYPE_LABELS: Record<EmployeeRemunerationType, string> = {
  salario: 'Salário Fixo',
  hora_trabalhada: 'Hora Trabalhada',
  comissao: 'Comissão',
  salario_comissao: 'Salário + Comissão',
  hora_comissao: 'Hora Trabalhada + Comissão'
};

export function getEmployeeRemunerationType(emp: Partial<Employee>): EmployeeRemunerationType {
  if (emp.remunerationType) return emp.remunerationType;
  const hasHourly = Number(emp.hourlyRate || 0) > 0;
  const hasSalary = Number(emp.baseSalary || 0) > 0;
  const hasComm = Number(emp.commissionRate || 0) > 0;

  if (hasHourly) return hasComm ? 'hora_comissao' : 'hora_trabalhada';
  if (hasSalary) return hasComm ? 'salario_comissao' : 'salario';
  if (hasComm) return 'comissao';
  return 'salario';
}

export function getRemunerationConfig(type: EmployeeRemunerationType) {
  return REMUNERATION_TYPE_OPTIONS.find(o => o.value === type) || REMUNERATION_TYPE_OPTIONS[0];
}

export function computeEmployeeNominalPay(emp: Partial<Employee>): number {
  const type = getEmployeeRemunerationType(emp);
  if (type === 'hora_trabalhada' || type === 'hora_comissao') {
    return Number((Number(emp.hourlyRate || 0) * Number(emp.monthlyHoursWorked || 0)).toFixed(2));
  }
  if (type === 'comissao') {
    return 0;
  }
  return Number(emp.baseSalary || 0);
}

export function hasEmployeeCommission(emp: Partial<Employee>): boolean {
  const type = getEmployeeRemunerationType(emp);
  return type === 'comissao' || type === 'salario_comissao' || type === 'hora_comissao';
}

export function computeEmployeeMonthlyFixedCost(emp: Partial<Employee>): number {
  return Number((computeEmployeeNominalPay(emp) + Number(emp.benefitsCharges || 0)).toFixed(2));
}

export function formatEmployeeRemunerationSummary(emp: Partial<Employee>, formatBRL: (v: number) => string): string {
  const type = getEmployeeRemunerationType(emp);
  const nominal = computeEmployeeNominalPay(emp);
  const comm = Number(emp.commissionRate || 0);
  if (type === 'hora_trabalhada') {
    return `${formatBRL(Number(emp.hourlyRate || 0))}/h × ${Number(emp.monthlyHoursWorked || 0)}h (${formatBRL(nominal)})`;
  }
  if (type === 'hora_comissao') {
    return `${formatBRL(Number(emp.hourlyRate || 0))}/h × ${Number(emp.monthlyHoursWorked || 0)}h + ${comm}%`;
  }
  if (type === 'comissao') {
    return `Comissão ${comm}%`;
  }
  if (type === 'salario_comissao') {
    return `${formatBRL(nominal)} + ${comm}%`;
  }
  return formatBRL(nominal);
}
