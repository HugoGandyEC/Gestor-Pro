import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Layers,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  ShoppingBag,
  ClipboardList,
  Building2,
  Truck,
  ShieldCheck,
  RefreshCw,
  Search,
  Receipt,
  X
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../../context/AppContext';
import { PaymentMethod, ServiceOrder } from '../../types';
import { LiveSearchInput } from '../../components/LiveSearchInput';
import { ViewModeToggle, ViewMode } from '../../components/ViewModeToggle';
import { useRowHoverTooltip } from '../../components/RowHoverTooltip';
import {
  computeServiceOrderFinancials,
  getMonthLabelBR,
  isAutoPayrollExpense,
  isServiceOrderReceivable
} from '../../utils/financialHelpers';
import {
  calculateServiceOrderFinancials,
  classifyServiceOrderPayment
} from '../../utils/pixBrCode';

export const FinancialView: React.FC = () => {
  const { 
    serviceOrders, 
    directSales, 
    generalExpenses, 
    vehicleExpenses, 
    setupCosts,
    selectedMonthYear, 
    monthlyFinancialSummary,
    toggleDirectSalePayment,
    toggleServiceOrderPayment,
    toggleGeneralExpensePayment,
    settleServiceOrderInPdv,
    getReceiptsForSource,
    getPaidAmountForSource,
    openReceiptModal
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'dre' | 'receber' | 'pagar'>('dre');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const { showTooltip, hideTooltip, tooltipElement } = useRowHoverTooltip();

  // Modal de Lançamento Financeiro de OS (Entrada / Parcial / Quitação)
  const [receivingOsModal, setReceivingOsModal] = useState<ServiceOrder | null>(null);
  const [osPayAmount, setOsPayAmount] = useState<number>(0);
  const [osPayMethod, setOsPayMethod] = useState<PaymentMethod>('pix');
  const [osPayNotes, setOsPayNotes] = useState<string>('');

  const handleOpenOsPaymentModal = (orderId: string) => {
    const targetOs = serviceOrders.find(o => o.id === orderId);
    if (!targetOs) return;
    const fin = calculateServiceOrderFinancials(targetOs, getPaidAmountForSource('os', targetOs.id));
    setReceivingOsModal(targetOs);
    setOsPayAmount(fin.remainingBalance > 0 ? fin.remainingBalance : fin.grandTotal);
    setOsPayMethod(targetOs.paymentMethod || 'pix');
    setOsPayNotes('');
  };

  const handleConfirmOsPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingOsModal) return;
    const amount = Number(Number(osPayAmount || 0).toFixed(2));
    if (amount <= 0.009) return;

    settleServiceOrderInPdv(receivingOsModal.id, {
      payments: [
        {
          id: `fin-pay-${Date.now()}`,
          method: osPayMethod,
          amount,
          netAmount: amount,
          status: 'pago'
        }
      ],
      paymentMethod: osPayMethod,
      paidAmount: amount,
      terminalName: 'Financeiro - Contas a Receber',
      orderOverride: receivingOsModal,
      notes: osPayNotes.trim() || undefined
    });

    setReceivingOsModal(null);
    setOsPayNotes('');
  };
  
  // Filters for Receivables and Payables
  const [receivableFilter, setReceivableFilter] = useState<'todos' | 'pendente' | 'pago'>('todos');
  const [receivableSearch, setReceivableSearch] = useState('');
  
  const [payableFilter, setPayableFilter] = useState<'todos' | 'pendente' | 'pago'>('todos');
  const [payableSearch, setPayableSearch] = useState('');

  // 1. Contas a Receber no Mês (Ordens de Serviço válidas e Vendas Diretas ativas)
  const monthOrders = useMemo(() => {
    return serviceOrders.filter(o => {
      if (!isServiceOrderReceivable(o)) return false;
      const d = o.completionDate || o.openDate;
      return d.startsWith(selectedMonthYear);
    });
  }, [serviceOrders, selectedMonthYear]);

  const monthSales = useMemo(() => {
    return directSales.filter(s => s.date.startsWith(selectedMonthYear) && s.status !== 'cancelada');
  }, [directSales, selectedMonthYear]);

  // Unified Receivables List
  interface UnifiedReceivableItem {
    id: string;
    type: 'os' | 'venda';
    code: string;
    clientName: string;
    date: string;
    dueDate: string;
    paymentMethod: string;
    paymentStatus: 'pago' | 'pendente';
    total: number;
    paidAmount: number;
    remainingAmount: number;
    description: string;
  }

  const unifiedReceivables = useMemo<UnifiedReceivableItem[]>(() => {
    const list: UnifiedReceivableItem[] = [];

    // Service Orders (exclui canceladas e orçamentos abertos)
    monthOrders.forEach(os => {
      const fin = computeServiceOrderFinancials(os);
      const total = fin.netTotal;
      const isPaid = os.paymentStatus === 'pago';
      const paidSoFar = isPaid ? total : Math.min(total, getPaidAmountForSource('os', os.id));
      const remaining = isPaid ? 0 : Math.max(0, Number((total - paidSoFar).toFixed(2)));

      list.push({
        id: os.id,
        type: 'os',
        code: os.code,
        clientName: os.clientName || 'Cliente Balcão',
        date: os.openDate,
        dueDate: os.forecastDate || os.openDate,
        paymentMethod: os.paymentMethod || 'pix',
        paymentStatus: isPaid ? 'pago' : 'pendente',
        total,
        paidAmount: paidSoFar,
        remainingAmount: remaining,
        description: os.description || 'Ordem de Serviço de Campo'
      });
    });

    // Direct Sales
    monthSales.forEach(s => {
      const total = Math.max(0, Number(s.total || 0));
      const isPaid = s.paymentStatus === 'pago';
      const paidSoFar = isPaid ? total : Math.min(total, getPaidAmountForSource('venda', s.id));
      const remaining = isPaid ? 0 : Math.max(0, Number((total - paidSoFar).toFixed(2)));

      list.push({
        id: s.id,
        type: 'venda',
        code: s.code,
        clientName: s.clientName || 'Cliente Balcão',
        date: s.date,
        dueDate: s.date,
        paymentMethod: s.paymentMethod || 'pix',
        paymentStatus: isPaid ? 'pago' : 'pendente',
        total,
        paidAmount: paidSoFar,
        remainingAmount: remaining,
        description: `Venda Direta: ${s.items.length} item(ns)`
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [monthOrders, monthSales, getPaidAmountForSource]);

  // Filtered Receivables
  const filteredReceivables = useMemo(() => {
    return unifiedReceivables.filter(item => {
      if (receivableFilter !== 'todos' && item.paymentStatus !== receivableFilter) return false;
      if (receivableSearch) {
        const term = receivableSearch.toLowerCase();
        const matchesClient = item.clientName.toLowerCase().includes(term);
        const matchesCode = item.code.toLowerCase().includes(term);
        if (!matchesClient && !matchesCode) return false;
      }
      return true;
    });
  }, [unifiedReceivables, receivableFilter, receivableSearch]);

  const totalReceivablePending = unifiedReceivables.reduce((acc, i) => acc + i.remainingAmount, 0);
  const totalReceivablePaid = unifiedReceivables.reduce((acc, i) => acc + i.paidAmount, 0);

  // 2. Contas a Pagar no Mês (Despesas Gerais, Frota e Dívidas de Setup)
  interface UnifiedPayableItem {
    id: string;
    source: 'geral' | 'frota' | 'divida';
    category: string;
    description: string;
    supplier: string;
    dueDate: string;
    cost: number;
    isPaid: boolean;
    isRecurring: boolean;
  }

  const unifiedPayables = useMemo<UnifiedPayableItem[]>(() => {
    const list: UnifiedPayableItem[] = [];

    // General Expenses
    generalExpenses
      .filter(e => e.dueDate.startsWith(selectedMonthYear))
      .forEach(e => {
        list.push({
          id: e.id,
          source: 'geral',
          category: e.category,
          description: e.description,
          supplier: e.supplier || 'Fornecedor Diversos',
          dueDate: e.dueDate,
          cost: e.cost,
          isPaid: e.isPaid,
          isRecurring: e.isRecurring
        });
      });

    // Vehicle Expenses
    vehicleExpenses
      .filter(ve => ve.date.startsWith(selectedMonthYear))
      .forEach(ve => {
        list.push({
          id: ve.id,
          source: 'frota',
          category: ve.category,
          description: `Frota: ${ve.description}`,
          supplier: ve.workshopOrSupplier || 'Oficina / Posto',
          dueDate: ve.date,
          cost: ve.cost,
          isPaid: true, // Já desembolsado no abastecimento/manutenção
          isRecurring: false
        });
      });

    // Active Debt Installments from Setup Costs
    setupCosts
      .filter(s => s.costType === 'parcelado' && s.status !== 'quitado')
      .forEach(s => {
        const remainingInst = Math.max(0, (s.installmentsCount || 1) - (s.paidInstallments || 0));
        if (remainingInst > 0) {
          // Checa se já não foi sincronizado em generalExpenses
          const isSynced = generalExpenses.some(ge => 
            ge.description.startsWith(s.name) && ge.dueDate.startsWith(selectedMonthYear)
          );
          if (!isSynced) {
            list.push({
              id: `debt-${s.id}`,
              source: 'divida',
              category: 'divida_empresa',
              description: `${s.name} (Parcela ${(s.paidInstallments || 0) + 1}/${s.installmentsCount || 1})`,
              supplier: s.creditor || 'Banco / Credor',
              dueDate: s.dueDate || `${selectedMonthYear}-${String(s.dueDay || 10).padStart(2, '0')}`,
              cost: s.installmentValue || 0,
              isPaid: false,
              isRecurring: false
            });
          }
        }
      });

    return list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [generalExpenses, vehicleExpenses, setupCosts, selectedMonthYear]);

  // Filtered Payables
  const filteredPayables = useMemo(() => {
    return unifiedPayables.filter(item => {
      if (payableFilter === 'pendente' && item.isPaid) return false;
      if (payableFilter === 'pago' && !item.isPaid) return false;
      if (payableSearch) {
        const term = payableSearch.toLowerCase();
        const matchesDesc = item.description.toLowerCase().includes(term);
        const matchesSupplier = item.supplier.toLowerCase().includes(term);
        if (!matchesDesc && !matchesSupplier) return false;
      }
      return true;
    });
  }, [unifiedPayables, payableFilter, payableSearch]);

  const totalPayablePending = unifiedPayables
    .filter(i => !i.isPaid)
    .reduce((acc, i) => acc + i.cost, 0);

  const totalPayablePaid = unifiedPayables
    .filter(i => i.isPaid)
    .reduce((acc, i) => acc + i.cost, 0);

  // 3. DRE Breakdown — 100% alimentado pela fonte única oficial (monthlyFinancialSummary)
  const {
    ordersGrossServices,
    ordersGrossParts,
    ordersDiscounts,
    ordersServicesRevenue,
    ordersPartsRevenue,
    salesRevenue,
    totalRevenue,
    ordersPartsCost,
    salesCost,
    totalPartsCost,
    grossMargin,
    baseSalaries,
    benefitsCharges,
    commissions,
    totalPersonnelCost,
    totalVehicleProrated,
    totalVehicleCost,
    unsyncedDebtInstallments,
    totalOperationalCost,
    totalCardFees,
    netProfit,
    netMarginPercent
  } = monthlyFinancialSummary;

  const monthFuelVehicleExpenses = vehicleExpenses
    .filter(e => e.date.startsWith(selectedMonthYear) && e.category === 'combustivel')
    .reduce((a, b) => a + Number(b.cost || 0), 0);

  const monthMaintVehicleExpenses = vehicleExpenses
    .filter(e => e.date.startsWith(selectedMonthYear) && e.category !== 'combustivel')
    .reduce((a, b) => a + Number(b.cost || 0), 0);

  // Particionamento exaustivo e mutuamente exclusivo das despesas operacionais (sem omitir nenhuma categoria!)
  const monthOperationalExpenses = generalExpenses.filter(
    e => e.dueDate.startsWith(selectedMonthYear) && !isAutoPayrollExpense(e)
  );
  const rentTotal = monthOperationalExpenses
    .filter(e => e.category === 'aluguel' || e.category === 'aluguel_loja')
    .reduce((a, b) => a + Number(b.cost || 0), 0);
  const internetPhoneTotal = monthOperationalExpenses
    .filter(e => e.category === 'internet' || e.category === 'celular')
    .reduce((a, b) => a + Number(b.cost || 0), 0);
  const materialsPurchaseTotal = monthOperationalExpenses
    .filter(e => e.category === 'compra_materiais' || e.category === 'compra_produtos_xml')
    .reduce((a, b) => a + Number(b.cost || 0), 0);
  const mealsTotal = monthOperationalExpenses
    .filter(e => e.category === 'alimentacao')
    .reduce((a, b) => a + Number(b.cost || 0), 0);
  const dasMeiTotal = monthOperationalExpenses
    .filter(e => e.category === 'das_mei' || e.category === 'impostos')
    .reduce((a, b) => a + Number(b.cost || 0), 0);
  const companyDebtsTotal =
    monthOperationalExpenses
      .filter(e => e.category === 'divida_empresa')
      .reduce((a, b) => a + Number(b.cost || 0), 0) + unsyncedDebtInstallments;
  const utilitiesTotal = monthOperationalExpenses
    .filter(e => e.category === 'energia_agua')
    .reduce((a, b) => a + Number(b.cost || 0), 0);
  const softwareAccountantTotal = monthOperationalExpenses
    .filter(e => e.category === 'software_contabilidade')
    .reduce((a, b) => a + Number(b.cost || 0), 0);

  const categorizedKeys = new Set([
    'aluguel',
    'aluguel_loja',
    'internet',
    'celular',
    'compra_materiais',
    'compra_produtos_xml',
    'alimentacao',
    'das_mei',
    'impostos',
    'divida_empresa',
    'energia_agua',
    'software_contabilidade'
  ]);
  const otherOperationalTotal = monthOperationalExpenses
    .filter(e => !categorizedKeys.has(e.category))
    .reduce((a, b) => a + Number(b.cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Módulo Financeiro & DRE Gerencial de Precisão
            </h1>
            <span className="hidden md:inline-block text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Competência {getMonthLabelBR(selectedMonthYear)}
            </span>
          </div>
          <p className="hidden md:block text-xs text-slate-500 mt-1">
            Controle integrado de Contas a Receber (OS + Vendas), Contas a Pagar (Despesas, Frota e Dívidas) e DRE Oficial com conciliação automática.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab('dre')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'dre' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            DRE Gerencial
          </button>
          <button
            onClick={() => setActiveSubTab('receber')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'receber' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Contas a Receber</span>
            {totalReceivablePending > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full">
                {unifiedReceivables.filter(i => i.paymentStatus === 'pendente').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('pagar')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'pagar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Contas a Pagar</span>
            {totalPayablePending > 0 && (
              <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded-full">
                {unifiedPayables.filter(i => !i.isPaid).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Top 4 Real Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Líquida Operacional */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Receita Operacional Total</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {formatBRL(totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>OS ({formatBRL(ordersServicesRevenue + ordersPartsRevenue)})</span>
            <span>·</span>
            <span>Vendas ({formatBRL(salesRevenue)})</span>
          </div>
        </div>

        {/* Contas a Receber Pendentes */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Contas a Receber (Pendentes)</span>
            <ArrowDownLeft className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600">
            {formatBRL(totalReceivablePending)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Já recebido no mês:</span>
            <strong className="text-emerald-700 font-mono">{formatBRL(totalReceivablePaid)}</strong>
          </div>
        </div>

        {/* Contas a Pagar Pendentes */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Contas a Pagar (Pendentes)</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700">
            {formatBRL(totalPayablePending)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Já quitado no mês:</span>
            <strong className="text-slate-700 font-mono">{formatBRL(totalPayablePaid)}</strong>
          </div>
        </div>

        {/* Lucro Líquido Operacional */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-blue-950 text-white shadow-xs">
          <div className="flex items-center justify-between text-slate-300 mb-1">
            <span className="text-xs font-medium">Lucro Líquido DRE</span>
            {netProfit >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className={`text-2xl font-bold font-mono ${netProfit > 0 ? 'text-emerald-400' : netProfit < 0 ? 'text-rose-400' : 'text-slate-200'}`}>
            {formatBRL(netProfit)}
          </div>
          <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between">
            <span>Margem Líquida Real:</span>
            <strong className={`font-mono ${netMarginPercent > 0 ? 'text-emerald-300' : netMarginPercent < 0 ? 'text-rose-300' : 'text-slate-300'}`}>
              {netMarginPercent.toFixed(1)}%
            </strong>
          </div>
        </div>
      </div>

      {/* DRE Gerencial Tab */}
      {activeSubTab === 'dre' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Demonstrativo do Resultado do Exercício (DRE) - {getMonthLabelBR(selectedMonthYear)}
              </h2>
              <p className="hidden md:block text-xs text-slate-500">
                Estrutura analítica contábil gerencial integrando serviços concluídos, vendas ativas, folha ativa, frota, despesas e taxas.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="hidden sm:inline text-xs text-slate-400">Resultado Líquido Operacional</span>
              <div className={`text-base sm:text-lg font-black font-mono ${netProfit > 0 ? 'text-emerald-600' : netProfit < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                {formatBRL(netProfit)}
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-6 font-mono text-xs space-y-4">
            {/* 1. Receita Operacional */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-slate-900 text-sm border-b pb-1">
                <span>(+) RECEITA OPERACIONAL LÍQUIDA DE DESCONTOS</span>
                <span className="text-blue-700">{formatBRL(totalRevenue)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Serviços Executados em Ordens de Serviço (Mão de Obra + Visitas):</span>
                <span>{formatBRL(ordersGrossServices)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Peças & Insumos Aplicados em Ordens de Serviço:</span>
                <span>{formatBRL(ordersGrossParts)}</span>
              </div>
              {ordersDiscounts > 0 && (
                <div className="flex justify-between pl-4 text-rose-700">
                  <span>· (-) Descontos Concedidos em Ordens de Serviço:</span>
                  <span>- {formatBRL(ordersDiscounts)}</span>
                </div>
              )}
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Vendas Diretas & Balcão de Peças (Líquido):</span>
                <span>{formatBRL(salesRevenue)}</span>
              </div>
            </div>

            {/* 2. Custos Variáveis */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-rose-800 text-sm border-b pb-1">
                <span>(-) CUSTOS VARIÁVEIS DE PEÇAS & MERCADORIAS VENDIDAS (CMV)</span>
                <span>{formatBRL(totalPartsCost)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Custo de Aquisição de Peças para Ordens de Serviço:</span>
                <span>{formatBRL(ordersPartsCost)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Custo de Mercadorias em Vendas Diretas:</span>
                <span>{formatBRL(salesCost)}</span>
              </div>
            </div>

            {/* 3. Margem de Contribuição */}
            <div className="flex justify-between font-bold bg-slate-50 p-2.5 rounded-lg text-slate-900 text-sm border border-slate-200">
              <span>(=) MARGEM DE CONTRIBUIÇÃO BRUTA</span>
              <span className={grossMargin > 0 ? 'text-emerald-700' : grossMargin < 0 ? 'text-rose-700' : 'text-slate-700'}>
                {formatBRL(grossMargin)}
              </span>
            </div>

            {/* 4. Custos com Pessoal */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-rose-800 text-sm border-b pb-1">
                <span>(-) CUSTOS COM PESSOAL & FOLHA DE PAGAMENTO (EQUIPE ATIVA)</span>
                <span>{formatBRL(totalPersonnelCost)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Salários Base / Horas Trabalhadas da Equipe Ativa:</span>
                <span>{formatBRL(baseSalaries)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Encargos Trabalhistas, FGTS & INSS (Equipe Ativa):</span>
                <span>{formatBRL(benefitsCharges)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Comissões Conquistadas sobre Atendimentos e Vendas:</span>
                <span>{formatBRL(commissions)}</span>
              </div>
            </div>

            {/* 5. Custos com Frota e Veículos */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-rose-800 text-sm border-b pb-1">
                <span>(-) CUSTOS COM FROTA & MOBILIDADE</span>
                <span>{formatBRL(totalVehicleCost)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Combustíveis da Frota Operacional (Gasolina/Etanol):</span>
                <span>{formatBRL(monthFuelVehicleExpenses)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Manutenção Mecânica & Peças da Frota (Óleo, Pneus, Freios):</span>
                <span>{formatBRL(monthMaintVehicleExpenses)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Amortização Proporcional de IPVA & Seguros Anuais:</span>
                <span>{formatBRL(totalVehicleProrated)}</span>
              </div>
            </div>

            {/* 6. Custos Operacionais Fixos & Tributos */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-rose-800 text-sm border-b pb-1">
                <span>(-) CUSTOS OPERACIONAIS, COMPRAS DE MATERIAIS, TRIBUTOS & DÍVIDAS</span>
                <span>{formatBRL(totalOperationalCost)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Aluguel da Loja & Galpão Comercial:</span>
                <span>{formatBRL(rentTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Internet Fibra, Telefone Fixo & Celulares:</span>
                <span>{formatBRL(internetPhoneTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Compras de Materiais, Peças & Reposição de Estoque:</span>
                <span>{formatBRL(materialsPurchaseTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Alimentação da Equipe & Vale Refeição:</span>
                <span>{formatBRL(mealsTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Tributos e DAS do MEI / Simples Nacional:</span>
                <span>{formatBRL(dasMeiTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Amortização de Dívidas da Empresa & Financiamentos:</span>
                <span>{formatBRL(companyDebtsTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Energia Elétrica e Água da Loja:</span>
                <span>{formatBRL(utilitiesTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Contabilidade & Softwares de Gestão:</span>
                <span>{formatBRL(softwareAccountantTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Outras Despesas Operacionais (Ferramental, Taxas & Diversos):</span>
                <span>{formatBRL(otherOperationalTotal)}</span>
              </div>
            </div>

            {/* 7. Taxas de Operadoras de Cartão */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-rose-800 text-sm border-b pb-1">
                <span>(-) TAXAS DE OPERADORAS DE CARTÃO (DÉBITO / CRÉDITO)</span>
                <span>{formatBRL(totalCardFees)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Taxas absorvidas pela empresa nas vendas e ordens de serviço faturadas:</span>
                <span>{formatBRL(totalCardFees)}</span>
              </div>
            </div>

            {/* 8. Lucro Líquido Final */}
            <div
              className={`flex justify-between font-bold border-2 p-4 rounded-xl text-slate-900 text-base ${
                netProfit > 0
                  ? 'bg-emerald-50 border-emerald-300'
                  : netProfit < 0
                  ? 'bg-rose-50 border-rose-300'
                  : 'bg-slate-50 border-slate-300'
              }`}
            >
              <span>(=) LUCRO LÍQUIDO OPERACIONAL DO EXERCÍCIO</span>
              <span className={`font-black text-lg ${netProfit > 0 ? 'text-emerald-700' : netProfit < 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                {formatBRL(netProfit)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Contas a Receber Tab */}
      {activeSubTab === 'receber' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Contas a Receber Unificadas (Ordens de Serviço & Vendas Diretas)
              </h2>
              <p className="hidden md:block text-xs text-slate-500">
                Acompanhe e dê baixa nos recebimentos de clientes de serviços e vendas de peças.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
              <div className="w-full sm:w-56">
                <LiveSearchInput
                  value={receivableSearch}
                  onChange={setReceivableSearch}
                  placeholder="Buscar código ou cliente..."
                  emptyLabel="Nenhum recebível"
                  inputClassName="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  getOptions={(query) => {
                    const q = query.toLowerCase();
                    return unifiedReceivables
                      .filter(
                        r =>
                          r.code.toLowerCase().includes(q) ||
                          r.clientName.toLowerCase().includes(q) ||
                          r.description.toLowerCase().includes(q)
                      )
                      .map(r => ({
                        id: `${r.type}-${r.id}`,
                        title: `${r.code} · ${r.clientName}`,
                        subtitle: `${r.type === 'os' ? 'OS' : 'Venda'} · ${formatDateBR(r.date)}`,
                        priceText: formatBRL(r.total),
                        badgeText: r.paymentStatus === 'pago' ? 'Pago' : 'Pendente',
                        data: r
                      }));
                  }}
                  onSelect={(opt) => setReceivableSearch(opt.data.code)}
                />
              </div>

              <select
                value={receivableFilter}
                onChange={(e) => setReceivableFilter(e.target.value as any)}
                className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold"
              >
                <option value="todos">Todos ({unifiedReceivables.length})</option>
                <option value="pendente">Apenas Pendentes ({unifiedReceivables.filter(i => i.paymentStatus === 'pendente').length})</option>
                <option value="pago">Apenas Recebidos ({unifiedReceivables.filter(i => i.paymentStatus === 'pago').length})</option>
              </select>

              <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Código / Tipo</th>
                    <th className="py-3 px-4">Cliente & Descrição</th>
                    <th className="hidden md:table-cell py-3 px-3">Data</th>
                    <th className="hidden md:table-cell py-3 px-3">Forma de Pagto</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredReceivables.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Nenhum recebível encontrado para este filtro ou competência.
                      </td>
                    </tr>
                  ) : (
                    filteredReceivables.map(item => (
                      <tr
                        key={`${item.type}-${item.id}`}
                        className="hover:bg-slate-50/80 transition-colors"
                        onMouseEnter={(e) =>
                          showTooltip(e, {
                            title: `${item.code} — ${item.clientName}`,
                            subtitle: `${item.type === 'os' ? 'Ordem de Serviço' : 'Venda Direta'} · ${formatDateBR(item.date)}`,
                            description: item.description,
                            fields: [
                              { label: 'Forma de Pagamento', value: item.paymentMethod.replace(/_/g, ' ').toUpperCase() },
                              { label: 'Previsão / Vencimento', value: formatDateBR(item.dueDate) },
                              { label: 'Status', value: item.paymentStatus === 'pago' ? 'Recebido / Pago' : 'A Receber / Pendente' },
                              { label: 'Valor', value: formatBRL(item.total) }
                            ]
                          })
                        }
                        onMouseLeave={hideTooltip}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                            {item.type === 'os' ? (
                              <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            <span>{item.code}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">
                            {item.type === 'os' ? 'Ordem de Serviço' : 'Venda Direta'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{item.clientName}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{item.description}</div>
                        </td>

                        <td className="hidden md:table-cell py-3 px-3 font-mono text-slate-600">
                          {formatDateBR(item.date)}
                        </td>

                        <td className="hidden md:table-cell py-3 px-3 uppercase font-medium text-slate-600">
                          {item.paymentMethod.replace('_', ' ')}
                        </td>

                        <td className="py-3 px-3">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                            item.paymentStatus === 'pago' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {item.paymentStatus === 'pago' ? 'RECEBIDO / PAGO' : 'A RECEBER / PENDENTE'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatBRL(item.total)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 flex-wrap justify-center">
                            {(() => {
                              const recs = getReceiptsForSource(item.type, item.id);
                              if (recs.length === 0) return null;
                              return (
                                <button
                                  type="button"
                                  onClick={() => openReceiptModal(recs[0])}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg cursor-pointer"
                                  title="Abrir Recibo de Pagamento"
                                >
                                  <Receipt className="w-3 h-3" />
                                  <span>Recibo</span>
                                </button>
                              );
                            })()}
                            <button
                              onClick={() => {
                                if (item.type === 'os') {
                                  if (item.paymentStatus === 'pago') {
                                    toggleServiceOrderPayment(item.id);
                                  } else {
                                    handleOpenOsPaymentModal(item.id);
                                  }
                                } else {
                                  toggleDirectSalePayment(item.id);
                                }
                              }}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors border shadow-xs cursor-pointer ${
                                item.paymentStatus === 'pago'
                                  ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                                  : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                              }`}
                            >
                              {item.paymentStatus === 'pago' ? 'Reabrir / Pendente' : 'Dar Baixa (Receber)'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-mono font-bold text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={3} className="py-3 px-4 font-sans font-bold">
                      TOTALIZADOR DE CONTAS A RECEBER
                    </td>
                    <td colSpan={2} className="hidden md:table-cell"></td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-black tabular-nums">
                      {formatBRL(filteredReceivables.reduce((a, b) => a + b.total, 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-50/40">
              {filteredReceivables.length === 0 ? (
                <div className="col-span-full py-8 text-center text-xs text-slate-400">
                  Nenhum recebível encontrado para este filtro ou competência.
                </div>
              ) : (
                filteredReceivables.map(item => (
                  <div key={`${item.type}-${item.id}`} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{item.code}</span>
                        <span className={`text-[11px] font-bold ${item.paymentStatus === 'pago' ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {item.paymentStatus === 'pago' ? 'Recebido' : 'Pendente'}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 truncate">{item.clientName}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {formatDateBR(item.date)} · {item.paymentMethod.replace(/_/g, ' ').toUpperCase()}
                      </div>
                    </div>
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">{formatBRL(item.total)}</span>
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const recs = getReceiptsForSource(item.type, item.id);
                          if (recs.length === 0) return null;
                          return (
                            <button
                              type="button"
                              onClick={() => openReceiptModal(recs[0])}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-white bg-[#53383e] rounded-lg cursor-pointer"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>Recibo</span>
                            </button>
                          );
                        })()}
                        <button
                          type="button"
                          onClick={() => {
                            if (item.type === 'os') {
                              if (item.paymentStatus === 'pago') {
                                toggleServiceOrderPayment(item.id);
                              } else {
                                handleOpenOsPaymentModal(item.id);
                              }
                            } else {
                              toggleDirectSalePayment(item.id);
                            }
                          }}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border cursor-pointer ${
                            item.paymentStatus === 'pago'
                              ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                              : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                          }`}
                        >
                          {item.paymentStatus === 'pago' ? 'Reabrir' : 'Dar Baixa'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Contas a Pagar Tab */}
      {activeSubTab === 'pagar' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Contas a Pagar Unificadas (Despesas Fixas, Frota e Dívidas da Empresa)
              </h2>
              <p className="hidden md:block text-xs text-slate-500">
                Controle e dê baixa em aluguel, internet, DAS MEI, salários, parcelas de empréstimos e manutenção veicular.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
              <div className="w-full sm:w-56">
                <LiveSearchInput
                  value={payableSearch}
                  onChange={setPayableSearch}
                  placeholder="Buscar conta ou credor..."
                  emptyLabel="Nenhuma conta"
                  inputClassName="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  getOptions={(query) => {
                    const q = query.toLowerCase();
                    return unifiedPayables
                      .filter(
                        p =>
                          p.description.toLowerCase().includes(q) ||
                          (p.supplier || '').toLowerCase().includes(q) ||
                          p.category.toLowerCase().includes(q)
                      )
                      .map(p => ({
                        id: p.id,
                        title: p.description,
                        subtitle: `${p.category.replace(/_/g, ' ')}${p.supplier ? ` · ${p.supplier}` : ''}`,
                        priceText: formatBRL(p.cost),
                        badgeText: p.isPaid ? 'Quitado' : 'A Pagar',
                        data: p
                      }));
                  }}
                  onSelect={(opt) => setPayableSearch(opt.data.description)}
                />
              </div>

              <select
                value={payableFilter}
                onChange={(e) => setPayableFilter(e.target.value as any)}
                className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold"
              >
                <option value="todos">Todos ({unifiedPayables.length})</option>
                <option value="pendente">A Pagar / Pendentes ({unifiedPayables.filter(i => !i.isPaid).length})</option>
                <option value="pago">Quitados / Pagos ({unifiedPayables.filter(i => i.isPaid).length})</option>
              </select>

              <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Vencimento</th>
                    <th className="hidden md:table-cell py-3 px-3">Origem / Categoria</th>
                    <th className="py-3 px-4">Descrição da Conta / Dívida</th>
                    <th className="hidden md:table-cell py-3 px-3">Credor / Fornecedor</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredPayables.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Nenhuma conta a pagar encontrada para este filtro ou competência.
                      </td>
                    </tr>
                  ) : (
                    filteredPayables.map(item => (
                      <tr
                        key={`${item.source}-${item.id}`}
                        className="hover:bg-slate-50/80 transition-colors"
                        onMouseEnter={(e) =>
                          showTooltip(e, {
                            title: item.description,
                            subtitle: `${item.category.replace(/_/g, ' ').toUpperCase()} · Vencimento: ${formatDateBR(item.dueDate)}`,
                            description: `Credor / Fornecedor: ${item.supplier}${item.isRecurring ? ' · Lançamento mensal recorrente' : ''}.`,
                            fields: [
                              { label: 'Origem', value: item.source.toUpperCase() },
                              { label: 'Status', value: item.isPaid ? 'Quitado / Pago' : 'A Pagar' },
                              { label: 'Valor', value: formatBRL(item.cost) }
                            ]
                          })
                        }
                        onMouseLeave={hideTooltip}
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                          {formatDateBR(item.dueDate)}
                        </td>

                        <td className="hidden md:table-cell py-3 px-3">
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            {item.category.replace('_', ' ')}
                          </span>
                          {item.isRecurring && (
                            <span className="ml-1 text-[9px] text-blue-600 font-semibold">Recorrente</span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {item.description}
                        </td>

                        <td className="hidden md:table-cell py-3 px-3 text-slate-600 font-medium">
                          {item.supplier}
                        </td>

                        <td className="py-3 px-3">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                            item.isPaid 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            {item.isPaid ? 'QUITADO / PAGO' : 'A PAGAR'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-700 tabular-nums">
                          {formatBRL(item.cost)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {item.source === 'geral' ? (
                            <button
                              onClick={() => toggleGeneralExpensePayment(item.id)}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors border shadow-xs cursor-pointer ${
                                item.isPaid
                                  ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                                  : 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700'
                              }`}
                            >
                              {item.isPaid ? 'Reabrir Conta' : 'Dar Baixa (Pagar)'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Liquidado na origem</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-mono font-bold text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={3} className="py-3 px-4 font-sans font-bold">
                      TOTALIZADOR DE CONTAS A PAGAR
                    </td>
                    <td colSpan={2} className="hidden md:table-cell"></td>
                    <td className="py-3 px-4 text-right text-rose-700 font-black tabular-nums">
                      {formatBRL(filteredPayables.reduce((a, b) => a + b.cost, 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-50/40">
              {filteredPayables.length === 0 ? (
                <div className="col-span-full py-8 text-center text-xs text-slate-400">
                  Nenhuma conta a pagar encontrada para este filtro ou competência.
                </div>
              ) : (
                filteredPayables.map(item => (
                  <div key={`${item.source}-${item.id}`} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase text-slate-500">{item.category.replace('_', ' ')}</span>
                        <span className="font-mono text-[11px] text-slate-500 tabular-nums">{formatDateBR(item.dueDate)}</span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900">{item.description}</h3>
                      <p className="text-xs text-slate-500 truncate">Credor: {item.supplier}</p>
                    </div>
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-sm text-rose-700 tabular-nums">{formatBRL(item.cost)}</span>
                      {item.source === 'geral' ? (
                        <button
                          type="button"
                          onClick={() => toggleGeneralExpensePayment(item.id)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border cursor-pointer ${
                            item.isPaid
                              ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                              : 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700'
                          }`}
                        >
                          {item.isPaid ? 'Reabrir' : 'Dar Baixa'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Liquidado na origem</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de Lançamento Financeiro em OS (Entrada / Pagamento Parcial / Quitação) */}
      {receivingOsModal && (() => {
        const fin = calculateServiceOrderFinancials(
          receivingOsModal,
          getPaidAmountForSource('os', receivingOsModal.id)
        );
        const liveClass = classifyServiceOrderPayment({
          orderTotal: fin.grandTotal,
          previouslyPaid: fin.totalPaid,
          amountPaidNow: Number(osPayAmount || 0)
        });
        const badgeClass =
          liveClass.shortLabel === 'Quitação'
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : liveClass.shortLabel === 'Entrada'
            ? 'bg-blue-100 text-blue-800 border-blue-300'
            : 'bg-amber-100 text-amber-800 border-amber-300';

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Registrar Recebimento · OS Nº {receivingOsModal.code}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{receivingOsModal.clientName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setReceivingOsModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmOsPayment} className="p-5 space-y-4 text-xs">
                {/* Resumo da OS */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-500">Total OS</div>
                    <div className="font-mono font-bold text-slate-900 mt-0.5">{formatBRL(fin.grandTotal)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-emerald-700">Já Pago</div>
                    <div className="font-mono font-bold text-emerald-700 mt-0.5">{formatBRL(fin.totalPaid)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-rose-700">Saldo Atual</div>
                    <div className="font-mono font-bold text-rose-700 mt-0.5">{formatBRL(fin.remainingBalance)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Valor Recebido (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={fin.remainingBalance > 0 ? fin.remainingBalance : undefined}
                      required
                      value={osPayAmount}
                      onChange={e => setOsPayAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Forma de Pagamento *
                    </label>
                    <select
                      value={osPayMethod}
                      onChange={e => setOsPayMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="pix">PIX</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="boleto">Boleto Bancário</option>
                      <option value="faturado_30d">Faturado (30d)</option>
                    </select>
                  </div>
                </div>

                {/* Classificação Automática em Tempo Real */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-500">Classificação Automática</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`text-[10.5px] font-extrabold uppercase px-2 py-0.5 rounded border ${badgeClass}`}>
                        {liveClass.shortLabel}
                      </span>
                      <span className="text-[11px] text-slate-600">{liveClass.receiptTitle}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase text-slate-500">Novo Saldo</div>
                    <div className={`font-mono font-black text-sm ${liveClass.remainingBalance > 0.01 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {formatBRL(liveClass.remainingBalance)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Observações (opcional)
                  </label>
                  <input
                    type="text"
                    value={osPayNotes}
                    onChange={e => setOsPayNotes(e.target.value)}
                    placeholder="Ex.: Sinal de 50% para início da obra..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReceivingOsModal(null)}
                    className="px-3.5 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Recebimento</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {tooltipElement}
    </div>
  );
};
