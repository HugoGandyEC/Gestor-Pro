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
  Search
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../context/AppContext';

export const FinancialView: React.FC = () => {
  const { 
    serviceOrders, 
    directSales, 
    generalExpenses, 
    vehicleExpenses, 
    vehicles, 
    employees, 
    setupCosts,
    selectedMonthYear, 
    monthlyFinancialSummary,
    toggleDirectSalePayment,
    toggleServiceOrderPayment,
    toggleGeneralExpensePayment
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'dre' | 'receber' | 'pagar'>('dre');
  
  // Filters for Receivables and Payables
  const [receivableFilter, setReceivableFilter] = useState<'todos' | 'pendente' | 'pago'>('todos');
  const [receivableSearch, setReceivableSearch] = useState('');
  
  const [payableFilter, setPayableFilter] = useState<'todos' | 'pendente' | 'pago'>('todos');
  const [payableSearch, setPayableSearch] = useState('');

  // 1. Contas a Receber no Mês (Ordens de Serviço e Vendas Diretas)
  const monthOrders = useMemo(() => {
    return serviceOrders.filter(o => {
      const d = o.completionDate || o.openDate;
      return d.startsWith(selectedMonthYear);
    });
  }, [serviceOrders, selectedMonthYear]);

  const monthSales = useMemo(() => {
    return directSales.filter(s => s.date.startsWith(selectedMonthYear));
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
    description: string;
  }

  const unifiedReceivables = useMemo<UnifiedReceivableItem[]>(() => {
    const list: UnifiedReceivableItem[] = [];

    // Service Orders
    monthOrders.forEach(os => {
      const total = os.services.reduce((a, b) => a + Number(b.price || 0), 0) + 
                    os.parts.reduce((a, b) => a + (Number(b.price || 0) * Number(b.quantity || 1)), 0) +
                    Number(os.visitFee || 0) - Number(os.calculatedDiscount || 0);

      list.push({
        id: os.id,
        type: 'os',
        code: os.code,
        clientName: os.clientName || 'Cliente Balcão',
        date: os.openDate,
        dueDate: os.forecastDate || os.openDate,
        paymentMethod: os.paymentMethod || 'pix',
        paymentStatus: os.paymentStatus === 'pago' ? 'pago' : 'pendente',
        total,
        description: os.description || 'Ordem de Serviço de Campo'
      });
    });

    // Direct Sales
    monthSales.forEach(s => {
      list.push({
        id: s.id,
        type: 'venda',
        code: s.code,
        clientName: s.clientName || 'Cliente Balcão',
        date: s.date,
        dueDate: s.date,
        paymentMethod: s.paymentMethod || 'pix',
        paymentStatus: s.paymentStatus === 'pago' ? 'pago' : 'pendente',
        total: s.total,
        description: `Venda Direta: ${s.items.length} item(ns)`
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [monthOrders, monthSales]);

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

  const totalReceivablePending = unifiedReceivables
    .filter(i => i.paymentStatus === 'pendente')
    .reduce((acc, i) => acc + i.total, 0);

  const totalReceivablePaid = unifiedReceivables
    .filter(i => i.paymentStatus === 'pago')
    .reduce((acc, i) => acc + i.total, 0);

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

  // 3. DRE Breakdown
  const {
    totalRevenue,
    totalPartsCost,
    grossMargin,
    totalPersonnelCost,
    totalVehicleCost,
    totalOperationalCost,
    totalCardFees,
    netProfit
  } = monthlyFinancialSummary;

  // Detailed sub-aggregations for DRE
  const finishedOrders = monthOrders.filter(o => o.status === 'concluida_aguardando_retirada' || o.status === 'entregue_finalizada');
  
  const revenueServices = finishedOrders.reduce((acc, o) => 
    acc + o.services.reduce((a, b) => a + Number(b.price || 0), 0) + Number(o.visitFee || 0) - Number(o.calculatedDiscount || 0), 0
  );

  const revenuePartsOS = finishedOrders.reduce((acc, o) => 
    acc + o.parts.reduce((a, b) => a + (Number(b.price || 0) * Number(b.quantity || 1)), 0), 0
  );

  const revenueDirectSales = monthSales.reduce((acc, s) => acc + Number(s.total || 0), 0);

  const costPartsOS = finishedOrders.reduce((acc, o) => 
    acc + o.parts.reduce((a, b) => a + (Number(b.cost || 0) * Number(b.quantity || 1)), 0), 0
  );

  const costDirectSales = monthSales.reduce((acc, s) => 
    acc + s.items.reduce((a, b) => a + ((b.cost || 0) * (b.quantity || 1)), 0), 0
  );

  // Operational items
  const monthGeneralExpenses = generalExpenses.filter(e => e.dueDate.startsWith(selectedMonthYear));
  const rentTotal = monthGeneralExpenses.filter(e => e.category === 'aluguel' || e.category === 'aluguel_loja').reduce((a, b) => a + b.cost, 0);
  const internetTotal = monthGeneralExpenses.filter(e => e.category === 'internet').reduce((a, b) => a + b.cost, 0);
  const mealsTotal = monthGeneralExpenses.filter(e => e.category === 'alimentacao').reduce((a, b) => a + b.cost, 0);
  const dasMeiTotal = monthGeneralExpenses.filter(e => e.category === 'das_mei' || e.category === 'impostos').reduce((a, b) => a + b.cost, 0);
  const companyDebtsTotal = monthGeneralExpenses.filter(e => e.category === 'divida_empresa').reduce((a, b) => a + b.cost, 0);
  const utilitiesTotal = monthGeneralExpenses.filter(e => e.category === 'energia_agua').reduce((a, b) => a + b.cost, 0);
  const softwareAccountantTotal = monthGeneralExpenses.filter(e => e.category === 'software_contabilidade').reduce((a, b) => a + b.cost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Módulo Financeiro & DRE Gerencial de Precisão
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Competência {selectedMonthYear}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
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
        {/* Receita Total Bruta */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Receita Bruta Total</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {formatBRL(totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>OS ({formatBRL(revenueServices + revenuePartsOS)})</span>
            <span>·</span>
            <span>Vendas ({formatBRL(revenueDirectSales)})</span>
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
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-2xl font-bold font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatBRL(netProfit)}
          </div>
          <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between">
            <span>Margem Líquida Real:</span>
            <strong className="text-emerald-300 font-mono">{monthlyFinancialSummary.netMarginPercent.toFixed(1)}%</strong>
          </div>
        </div>
      </div>

      {/* DRE Gerencial Tab */}
      {activeSubTab === 'dre' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Demonstrativo do Resultado do Exercício (DRE) - {selectedMonthYear}
              </h2>
              <p className="text-xs text-slate-500">
                Estrutura analítica padrão contábil gerencial integrando serviços de campo, vendas de balcão, despesas operacionais e dívidas.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Resultado Líquido Operacional</span>
              <div className={`text-lg font-black font-mono ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatBRL(netProfit)}
              </div>
            </div>
          </div>

          <div className="p-6 font-mono text-xs space-y-4">
            {/* 1. Receita Bruta */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-slate-900 text-sm border-b pb-1">
                <span>(+) RECEITA BRUTA OPERACIONAL</span>
                <span className="text-blue-700">{formatBRL(totalRevenue)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Serviços Executados em Ordens de Serviço (Mão de Obra + Visitas):</span>
                <span>{formatBRL(revenueServices)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Peças & Insumos Aplicados em Ordens de Serviço:</span>
                <span>{formatBRL(revenuePartsOS)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Vendas Diretas & Balcão de Peças:</span>
                <span>{formatBRL(revenueDirectSales)}</span>
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
                <span>{formatBRL(costPartsOS)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Custo de Mercadorias em Vendas Diretas:</span>
                <span>{formatBRL(costDirectSales)}</span>
              </div>
            </div>

            {/* 3. Margem de Contribuição */}
            <div className="flex justify-between font-bold bg-slate-50 p-2.5 rounded-lg text-slate-900 text-sm border border-slate-200">
              <span>(=) MARGEM DE CONTRIBUIÇÃO BRUTA</span>
              <span className="text-emerald-700">{formatBRL(grossMargin)}</span>
            </div>

            {/* 4. Custos com Pessoal */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-rose-800 text-sm border-b pb-1">
                <span>(-) CUSTOS COM PESSOAL & FOLHA DE PAGAMENTO (CLT + ENCARGOS)</span>
                <span>{formatBRL(totalPersonnelCost)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Salários Base da Equipe Operacional:</span>
                <span>{formatBRL(employees.reduce((a, b) => a + b.baseSalary, 0))}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Encargos Trabalhistas, FGTS & INSS (Funcionários Fichados):</span>
                <span>{formatBRL(employees.reduce((a, b) => a + b.benefitsCharges, 0))}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Comissões Conquistadas sobre Atendimentos e Vendas:</span>
                <span>{formatBRL(totalPersonnelCost - (employees.reduce((a, b) => a + b.baseSalary + b.benefitsCharges, 0)))}</span>
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
                <span>{formatBRL(vehicleExpenses.filter(e => e.date.startsWith(selectedMonthYear) && e.category === 'combustivel').reduce((a, b) => a + b.cost, 0))}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Manutenção Mecânica & Peças da Frota (Óleo, Pneus, Freios):</span>
                <span>{formatBRL(vehicleExpenses.filter(e => e.date.startsWith(selectedMonthYear) && e.category !== 'combustivel').reduce((a, b) => a + b.cost, 0))}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Amortização Proporcional de IPVA & Seguros Anuais:</span>
                <span>{formatBRL(vehicles.reduce((a, v) => a + ((v.annualIpvaValue + v.annualInsuranceValue) / 12), 0))}</span>
              </div>
            </div>

            {/* 6. Custos Operacionais Fixos & Tributos */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-rose-800 text-sm border-b pb-1">
                <span>(-) CUSTOS OPERACIONAIS, TRIBUTOS & DÍVIDAS DA EMPRESA</span>
                <span>{formatBRL(totalOperationalCost)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Aluguel da Loja & Galpão Comercial:</span>
                <span>{formatBRL(rentTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Internet Fibra & Telefonia:</span>
                <span>{formatBRL(internetTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Alimentação da Equipe & Vale Refeição:</span>
                <span>{formatBRL(mealsTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Tributos e DAS do 'MEI' / Simples Nacional:</span>
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
            <div className="flex justify-between font-bold bg-emerald-50 border-2 border-emerald-300 p-4 rounded-xl text-slate-900 text-base">
              <span>(=) LUCRO LÍQUIDO OPERACIONAL DO EXERCÍCIO</span>
              <span className={`font-black text-lg ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatBRL(netProfit)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Contas a Receber Tab */}
      {activeSubTab === 'receber' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Contas a Receber Unificadas (Ordens de Serviço & Vendas Diretas)
              </h2>
              <p className="text-xs text-slate-500">
                Acompanhe e dê baixa nos recebimentos de clientes de serviços e vendas de peças.
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar código ou cliente..."
                  value={receivableSearch}
                  onChange={(e) => setReceivableSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Código / Tipo</th>
                  <th className="py-3 px-4">Cliente & Descrição</th>
                  <th className="py-3 px-3">Data</th>
                  <th className="py-3 px-3">Forma de Pagto</th>
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
                    <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/80 transition-colors">
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

                      <td className="py-3 px-3 font-mono text-slate-600">
                        {formatDateBR(item.date)}
                      </td>

                      <td className="py-3 px-3 uppercase font-medium text-slate-600">
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

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatBRL(item.total)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            if (item.type === 'os') {
                              toggleServiceOrderPayment(item.id);
                            } else {
                              toggleDirectSalePayment(item.id);
                            }
                          }}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors border shadow-xs ${
                            item.paymentStatus === 'pago'
                              ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                              : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                          }`}
                        >
                          {item.paymentStatus === 'pago' ? 'Reabrir / Pendente' : 'Dar Baixa (Receber)'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-mono font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={5} className="py-3 px-4 font-sans font-bold">
                    TOTALIZADOR DE CONTAS A RECEBER
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-700 font-black">
                    {formatBRL(filteredReceivables.reduce((a, b) => a + b.total, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Contas a Pagar Tab */}
      {activeSubTab === 'pagar' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Contas a Pagar Unificadas (Despesas Fixas, Frota e Dívidas da Empresa)
              </h2>
              <p className="text-xs text-slate-500">
                Controle e dê baixa em aluguel, internet, DAS MEI, salários, parcelas de empréstimos e manutenção veicular.
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar conta ou credor..."
                  value={payableSearch}
                  onChange={(e) => setPayableSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-3">Origem / Categoria</th>
                  <th className="py-3 px-4">Descrição da Conta / Dívida</th>
                  <th className="py-3 px-3">Credor / Fornecedor</th>
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
                    <tr key={`${item.source}-${item.id}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        {formatDateBR(item.dueDate)}
                      </td>

                      <td className="py-3 px-3">
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

                      <td className="py-3 px-3 text-slate-600 font-medium">
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

                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                        {formatBRL(item.cost)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {item.source === 'geral' ? (
                          <button
                            onClick={() => toggleGeneralExpensePayment(item.id)}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors border shadow-xs ${
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
                  <td colSpan={5} className="py-3 px-4 font-sans font-bold">
                    TOTALIZADOR DE CONTAS A PAGAR
                  </td>
                  <td className="py-3 px-4 text-right text-rose-700 font-black">
                    {formatBRL(filteredPayables.reduce((a, b) => a + b.cost, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
