import { ServiceOrderStatus } from '../types';

export interface ServiceOrderStatusMeta {
  value: ServiceOrderStatus;
  label: string;
  description: string;
  dotClass: string;
  textClass: string;
  badgeClass: string;
  cardBorderClass: string;
  selectClass: string;
}

export const SERVICE_ORDER_STATUS_LIST: ServiceOrderStatusMeta[] = [
  {
    value: 'orcamento_aberto',
    label: 'Orçamento Aberto',
    description: 'Proposta inicial registrada aguardando envio ou retorno',
    dotClass: 'bg-indigo-600',
    textClass: 'text-indigo-700',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    cardBorderClass: 'border-indigo-200 hover:border-indigo-300',
    selectClass: 'bg-indigo-50/70 text-indigo-800 border-indigo-200'
  },
  {
    value: 'aguardando_aprovacao',
    label: 'Aguardando Aprovação',
    description: 'Orçamento enviado para análise e autorização do cliente',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-800',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    cardBorderClass: 'border-amber-200 hover:border-amber-300',
    selectClass: 'bg-amber-50/70 text-amber-800 border-amber-200'
  },
  {
    value: 'aprovada_em_andamento',
    label: 'Aprovada / Em Andamento',
    description: 'Serviço autorizado e em execução técnica',
    dotClass: 'bg-blue-600',
    textClass: 'text-blue-700',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    cardBorderClass: 'border-blue-200 hover:border-blue-300',
    selectClass: 'bg-blue-50/70 text-blue-800 border-blue-200'
  },
  {
    value: 'aguardando_pecas',
    label: 'Aguardando Peças',
    description: 'Execução aguardando reposição ou chegada de materiais',
    dotClass: 'bg-purple-600',
    textClass: 'text-purple-700',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    cardBorderClass: 'border-purple-200 hover:border-purple-300',
    selectClass: 'bg-purple-50/70 text-purple-800 border-purple-200'
  },
  {
    value: 'concluida_aguardando_retirada',
    label: 'Concluída (Aguardando Retirada)',
    description: 'Serviço finalizado e pronto para entrega ou retirada',
    dotClass: 'bg-cyan-600',
    textClass: 'text-cyan-800',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    cardBorderClass: 'border-cyan-200 hover:border-cyan-300',
    selectClass: 'bg-cyan-50/70 text-cyan-800 border-cyan-200'
  },
  {
    value: 'entregue_finalizada',
    label: 'Entregue / Finalizada',
    description: 'Equipamento ou serviço entregue e encerrado junto ao cliente',
    dotClass: 'bg-emerald-600',
    textClass: 'text-emerald-800',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    cardBorderClass: 'border-emerald-200 hover:border-emerald-300',
    selectClass: 'bg-emerald-50/70 text-emerald-800 border-emerald-200'
  },
  {
    value: 'cancelada',
    label: 'Cancelada',
    description: 'Ordem de serviço ou orçamento cancelado',
    dotClass: 'bg-rose-600',
    textClass: 'text-rose-700',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    cardBorderClass: 'border-rose-200 hover:border-rose-300',
    selectClass: 'bg-rose-50/70 text-rose-800 border-rose-200'
  }
];

export const SERVICE_ORDER_STATUS_MAP: Record<ServiceOrderStatus, ServiceOrderStatusMeta> =
  SERVICE_ORDER_STATUS_LIST.reduce((acc, item) => {
    acc[item.value] = item;
    return acc;
  }, {} as Record<ServiceOrderStatus, ServiceOrderStatusMeta>);

export function getServiceOrderStatusMeta(status: ServiceOrderStatus | string): ServiceOrderStatusMeta {
  return (
    SERVICE_ORDER_STATUS_MAP[status as ServiceOrderStatus] || {
      value: 'orcamento_aberto',
      label: String(status || 'Orçamento Aberto'),
      description: '',
      dotClass: 'bg-slate-500',
      textClass: 'text-slate-700',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      cardBorderClass: 'border-slate-200 hover:border-slate-300',
      selectClass: 'bg-slate-50 text-slate-700 border-slate-200'
    }
  );
}
