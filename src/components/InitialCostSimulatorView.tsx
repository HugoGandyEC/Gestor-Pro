import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Plus, 
  TrendingUp, 
  CheckCircle2, 
  DollarSign, 
  PieChart, 
  Trash2, 
  Edit3, 
  Layers, 
  Target,
  Sparkles,
  RefreshCw,
  Calendar,
  CreditCard,
  Building2,
  Car,
  Fuel,
  Wifi,
  Users,
  Shield,
  Receipt,
  AlertCircle,
  Check,
  Search,
  Filter,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../context/AppContext';
import { InitialSetupCostItem, CostRecurrenceType } from '../types';

interface CategoryConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  icon: React.ReactNode;
}

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  salario_clt: {
    label: 'Salários & Funcionário Fichado (CLT)',
    badgeBg: 'bg-indigo-50 border-indigo-200',
    badgeText: 'text-indigo-700',
    icon: <Users className="w-3.5 h-3.5 text-indigo-600" />
  },
  combustivel: {
    label: 'Combustíveis da Frota & Operação',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-700',
    icon: <Fuel className="w-3.5 h-3.5 text-amber-600" />
  },
  ipva: {
    label: 'IPVA dos Veículos',
    badgeBg: 'bg-rose-50 border-rose-200',
    badgeText: 'text-rose-700',
    icon: <Receipt className="w-3.5 h-3.5 text-rose-600" />
  },
  seguro_veiculo: {
    label: 'Seguro do Veículo / Frota',
    badgeBg: 'bg-sky-50 border-sky-200',
    badgeText: 'text-sky-700',
    icon: <Shield className="w-3.5 h-3.5 text-sky-600" />
  },
  impostos_carro: {
    label: 'Impostos sobre Carro (Licenciamento/Taxas)',
    badgeBg: 'bg-purple-50 border-purple-200',
    badgeText: 'text-purple-700',
    icon: <Car className="w-3.5 h-3.5 text-purple-600" />
  },
  internet: {
    label: 'Internet & Telefonia',
    badgeBg: 'bg-cyan-50 border-cyan-200',
    badgeText: 'text-cyan-700',
    icon: <Wifi className="w-3.5 h-3.5 text-cyan-600" />
  },
  aluguel_loja: {
    label: 'Aluguel da Loja & Ponto Comercial',
    badgeBg: 'bg-blue-50 border-blue-200',
    badgeText: 'text-blue-700',
    icon: <Building2 className="w-3.5 h-3.5 text-blue-600" />
  },
  alimentacao: {
    label: 'Alimentação & Vale Refeição',
    badgeBg: 'bg-orange-50 border-orange-200',
    badgeText: 'text-orange-700',
    icon: <Briefcase className="w-3.5 h-3.5 text-orange-600" />
  },
  das_mei: {
    label: 'DAS do MEI / Simples Nacional',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeText: 'text-emerald-700',
    icon: <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
  },
  divida_empresa: {
    label: 'Dívidas da Empresa Diversas (Empréstimos/Parcelamentos)',
    badgeBg: 'bg-red-50 border-red-200',
    badgeText: 'text-red-700',
    icon: <CreditCard className="w-3.5 h-3.5 text-red-600" />
  },
  ferramental: {
    label: 'Ferramental & Equipamentos',
    badgeBg: 'bg-slate-100 border-slate-300',
    badgeText: 'text-slate-800',
    icon: <Layers className="w-3.5 h-3.5 text-slate-700" />
  },
  capital_giro: {
    label: 'Capital de Giro Inicial',
    badgeBg: 'bg-teal-50 border-teal-200',
    badgeText: 'text-teal-700',
    icon: <Target className="w-3.5 h-3.5 text-teal-600" />
  },
  outros: {
    label: 'Outras Despesas Operacionais',
    badgeBg: 'bg-gray-100 border-gray-200',
    badgeText: 'text-gray-700',
    icon: <PieChart className="w-3.5 h-3.5 text-gray-600" />
  }
};

export const InitialCostSimulatorView: React.FC = () => {
  const { 
    setupCosts, 
    addSetupCost, 
    updateSetupCost,
    deleteSetupCost,
    syncSetupCostsToExpenses,
    employees,
    vehicles,
    generalExpenses 
  } = useApp();

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<'todos' | 'recorrente' | 'parcelado' | 'unico'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('todas');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('aluguel_loja');
  const [costType, setCostType] = useState<CostRecurrenceType>('recorrente');
  const [installmentsCount, setInstallmentsCount] = useState<number>(12);
  const [paidInstallments, setPaidInstallments] = useState<number>(0);
  const [installmentValue, setInstallmentValue] = useState<number>(3850);
  const [actualCost, setActualCost] = useState<number>(3850);
  const [estimatedCost, setEstimatedCost] = useState<number>(3850);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDay, setDueDay] = useState<number>(10);
  const [creditor, setCreditor] = useState<string>('');
  const [status, setStatus] = useState<'planejado' | 'adquirido' | 'em_andamento' | 'quitado'>('em_andamento');
  const [syncWithGeneralExpenses, setSyncWithGeneralExpenses] = useState<boolean>(true);
  const [notes, setNotes] = useState('');

  // Break-even simulator parameters
  const [averageOSTicket, setAverageOSTicket] = useState(1400); // Ticket médio por OS
  const [partsCostPercentage, setPartsCostPercentage] = useState(30); // 30% em peças/insumos
  const [targetProfit, setTargetProfit] = useState(15000); // Meta de lucro líquido mensal

  // Open modal in create mode
  const handleOpenCreateModal = (defaultType?: CostRecurrenceType) => {
    setEditingId(null);
    setName('');
    setCategory('aluguel_loja');
    setCostType(defaultType || 'recorrente');
    setInstallmentsCount(12);
    setPaidInstallments(0);
    setInstallmentValue(500);
    setActualCost(500);
    setEstimatedCost(500);
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setDueDate(today);
    setDueDay(10);
    setCreditor('');
    setStatus('em_andamento');
    setSyncWithGeneralExpenses(true);
    setNotes('');
    setIsModalOpen(true);
  };

  // Open modal in edit mode
  const handleOpenEditModal = (item: InitialSetupCostItem) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category || 'aluguel_loja');
    setCostType(item.costType || (item.isRecurring ? 'recorrente' : 'investimento_unico'));
    setInstallmentsCount(item.installmentsCount || 1);
    setPaidInstallments(item.paidInstallments || 0);
    setInstallmentValue(item.installmentValue || item.actualCost || 0);
    setActualCost(item.actualCost || 0);
    setEstimatedCost(item.estimatedCost || item.actualCost || 0);
    setDate(item.date || new Date().toISOString().split('T')[0]);
    setDueDate(item.dueDate || item.date || new Date().toISOString().split('T')[0]);
    setDueDay(item.dueDay || 10);
    setCreditor(item.creditor || '');
    setStatus(item.status || 'em_andamento');
    setSyncWithGeneralExpenses(item.syncWithGeneralExpenses ?? true);
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  // Save Form (Create or Update)
  const handleSaveCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const isRec = costType === 'recorrente';
    const isInst = costType === 'parcelado';

    // Calculate actual total cost
    let calculatedActual = Number(actualCost);
    if (isInst) {
      calculatedActual = Number(installmentValue) * Number(installmentsCount);
    } else if (isRec) {
      calculatedActual = Number(installmentValue);
    }

    const payload = {
      name,
      category,
      costType,
      isRecurring: isRec,
      installmentsCount: isInst ? Number(installmentsCount) : 1,
      paidInstallments: isInst ? Number(paidInstallments) : (status === 'quitado' ? 1 : 0),
      installmentValue: Number(installmentValue),
      estimatedCost: Number(estimatedCost) || calculatedActual,
      actualCost: calculatedActual,
      date,
      dueDate,
      dueDay: Number(dueDay) || 10,
      creditor,
      status,
      syncWithGeneralExpenses,
      notes
    };

    if (editingId) {
      updateSetupCost(editingId, payload);
    } else {
      addSetupCost(payload);
    }

    setIsModalOpen(false);
    setEditingId(null);
  };

  // Quick increment paid installment
  const handleQuickPayInstallment = (item: InitialSetupCostItem) => {
    const currentPaid = item.paidInstallments || 0;
    const total = item.installmentsCount || 1;
    if (currentPaid < total) {
      const nextPaid = currentPaid + 1;
      const nextStatus = nextPaid >= total ? 'quitado' : 'em_andamento';
      updateSetupCost(item.id, {
        paidInstallments: nextPaid,
        status: nextStatus
      });
    }
  };

  // Run synchronization
  const handleSyncExpenses = () => {
    const result = syncSetupCostsToExpenses();
    setSyncFeedback(`Sincronização concluída com sucesso! ${result.count} contas/parcelas atualizadas no Contas a Pagar do sistema.`);
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // Filtered List
  const filteredCosts = useMemo(() => {
    return setupCosts.filter(item => {
      // Tab filter
      if (activeTab === 'recorrente' && item.costType !== 'recorrente' && !item.isRecurring) return false;
      if (activeTab === 'unico' && item.costType !== 'investimento_unico') {
        if (item.costType === 'recorrente' || item.costType === 'parcelado' || item.isRecurring) return false;
      }

      // Category filter
      if (selectedCategoryFilter !== 'todas' && item.category !== selectedCategoryFilter) return false;

      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(term);
        const matchesCreditor = (item.creditor || '').toLowerCase().includes(term);
        const matchesCategory = (CATEGORY_MAP[item.category]?.label || item.category).toLowerCase().includes(term);
        if (!matchesName && !matchesCreditor && !matchesCategory) return false;
      }

      return true;
    });
  }, [setupCosts, activeTab, selectedCategoryFilter, searchTerm]);

  // Aggregate Calculations
  const calculations = useMemo(() => {
    let monthlyRecurring = 0;
    let monthlyDebtInstallments = 0;
    let totalDebtRemaining = 0;
    let totalSetupOneTime = 0;

    setupCosts.forEach(item => {
      const isRecurrent = item.costType === 'recorrente' || item.isRecurring;
      const isInstallment = item.costType === 'parcelado';
      const isOneTime = item.costType === 'investimento_unico' || (!isRecurrent && !isInstallment);

      if (isRecurrent && item.status !== 'quitado') {
        monthlyRecurring += item.installmentValue || item.actualCost || 0;
      }

      if (isInstallment && item.status !== 'quitado') {
        const instVal = item.installmentValue || (item.installmentsCount ? item.actualCost / item.installmentsCount : 0);
        const remainingInst = Math.max(0, (item.installmentsCount || 1) - (item.paidInstallments || 0));
        monthlyDebtInstallments += instVal;
        totalDebtRemaining += instVal * remainingInst;
      }

      if (isOneTime) {
        totalSetupOneTime += item.actualCost || 0;
      }
    });

    // Total monthly burden: recurring + active installments
    const totalMonthlyCommitment = monthlyRecurring + monthlyDebtInstallments;

    return {
      monthlyRecurring,
      monthlyDebtInstallments,
      totalDebtRemaining,
      totalSetupOneTime,
      totalMonthlyCommitment
    };
  }, [setupCosts]);

  // Break-even Calculations based on registered real costs
  const realMonthlyFixedCost = calculations.totalMonthlyCommitment > 0 
    ? calculations.totalMonthlyCommitment 
    : 16000; // Fallback se nada cadastrado

  const grossMarginPerOS = averageOSTicket * (1 - partsCostPercentage / 100);
  const breakEvenOSCount = grossMarginPerOS > 0 ? Math.ceil(realMonthlyFixedCost / grossMarginPerOS) : 0;
  const breakEvenRevenue = breakEvenOSCount * averageOSTicket;

  const targetOSCount = grossMarginPerOS > 0 ? Math.ceil((realMonthlyFixedCost + targetProfit) / grossMarginPerOS) : 0;
  const targetRevenue = targetOSCount * averageOSTicket;
  const technicianCount = Math.max(1, employees.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Custos Iniciais, Contas Recorrentes & Dívidas da Empresa
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Gestão Financeira & Break-Even
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-4xl">
            Cadastre e edite contas recorrentes (salários, combustíveis, aluguel, internet, alimentação, DAS MEI), dívidas da empresa (empréstimos, IPVA, seguros parcelados em X vezes com controle de parcelas pagas) e alimente automaticamente o sistema financeiro e o Ponto de Equilíbrio.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSyncExpenses}
            title="Sincroniza todas as contas recorrentes e parcelas do mês diretamente com a tela de Contas a Pagar / Despesas Gerais"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Sincronizar com Contas a Pagar</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nova Conta / Dívida</span>
          </button>
        </div>
      </div>

      {/* Sync feedback banner */}
      {syncFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          <button onClick={() => setSyncFeedback(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Top 4 Real Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Custo Fixo Recorrente */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Custo Fixo Recorrente / Mês</span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {formatBRL(calculations.monthlyRecurring)}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Salários, Aluguel, DAS, Internet, etc.</span>
            <span className="font-semibold text-blue-600">Mensal contínuo</span>
          </div>
        </div>

        {/* KPI 2: Parcelas de Dívidas / Mês */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Parcelas de Dívidas / Mês</span>
              <CreditCard className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-700">
              {formatBRL(calculations.monthlyDebtInstallments)}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Empréstimos, IPVA, seguros em parcelas</span>
            <span className="font-semibold text-rose-600">Compromisso ativo</span>
          </div>
        </div>

        {/* KPI 3: Compromisso Total Mensal */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-blue-950 text-white shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span className="text-xs font-medium">Compromisso Mensal Total</span>
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {formatBRL(calculations.totalMonthlyCommitment)}
            </div>
          </div>
          <div className="text-[11px] text-slate-300 mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
            <span>Base de cálculo do Break-Even</span>
            <span className="font-semibold text-emerald-300">Total Fixo + Dívidas</span>
          </div>
        </div>

        {/* KPI 4: Saldo Devedor Restante */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Saldo Devedor Total (Dívidas)</span>
              <PieChart className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-600">
              {formatBRL(calculations.totalDebtRemaining)}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Investimento Setup: {formatBRL(calculations.totalSetupOneTime)}</span>
            <span className="font-semibold text-amber-600">A amortizar</span>
          </div>
        </div>
      </div>

      {/* Simulator Section */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Simulador Dinâmico de Ponto de Equilíbrio (Break-Even)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700">
                  Base Real Alimentada: {formatBRL(realMonthlyFixedCost)}/mês
                </span>
              </h2>
              <p className="text-[11px] text-slate-300">
                Calcula a quantidade exata de atendimentos necessária para zerar as contas e atingir o lucro desejado.
              </p>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Ticket Médio Previsto por OS:
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">R$</span>
              <input
                type="number"
                value={averageOSTicket}
                onChange={(e) => setAverageOSTicket(Number(e.target.value))}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white font-mono text-sm font-bold"
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Mão de obra + Peças por atendimento</div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Custo de Peças / Insumos (%):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="80"
                value={partsCostPercentage}
                onChange={(e) => setPartsCostPercentage(Number(e.target.value))}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white font-mono text-sm font-bold"
              />
              <span className="text-xs text-slate-400">%</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Margem bruta retida por OS: {formatBRL(grossMarginPerOS)}</div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Meta de Lucro Líquido Mensal Desejada:
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">R$</span>
              <input
                type="number"
                value={targetProfit}
                onChange={(e) => setTargetProfit(Number(e.target.value))}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white font-mono text-sm font-bold text-emerald-400"
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Lucro líquido livre após pagar todos os custos</div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-xs text-amber-300 font-medium">Ponto de Equilíbrio (Break-Even)</span>
            <div className="text-2xl font-black font-mono text-amber-400 mt-1">
              {breakEvenOSCount} Ordens de Serviço
            </div>
            <div className="text-[11px] text-amber-200 mt-1">
              Faturamento para cobrir os custos: {formatBRL(breakEvenRevenue)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-xs text-emerald-300 font-medium">Meta para Lucro de {formatBRL(targetProfit)}</span>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {targetOSCount} Ordens de Serviço
            </div>
            <div className="text-[11px] text-emerald-200 mt-1">
              Faturamento necessário: {formatBRL(targetRevenue)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <span className="text-xs text-blue-300 font-medium">Meta por Técnico ({technicianCount} colaboradores)</span>
            <div className="text-2xl font-black font-mono text-blue-400 mt-1">
              {Math.ceil(targetOSCount / technicianCount)} OS / mês por técnico
            </div>
            <div className="text-[11px] text-blue-200 mt-1">
              ~{(Math.ceil(targetOSCount / technicianCount) / 22).toFixed(1)} OS por dia útil / técnico
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Table Filter Tabs */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveTab('todos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                activeTab === 'todos'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todas as Contas & Dívidas ({setupCosts.length})
            </button>
            <button
              onClick={() => setActiveTab('recorrente')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                activeTab === 'recorrente'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Contas Recorrentes Mensais ({setupCosts.filter(s => s.costType === 'recorrente' || s.isRecurring).length})
            </button>
            <button
              onClick={() => setActiveTab('parcelado')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                activeTab === 'parcelado'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Dívidas & Financiamentos Parcelados ({setupCosts.filter(s => s.costType === 'parcelado').length})
            </button>
            <button
              onClick={() => setActiveTab('unico')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                activeTab === 'unico'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Investimentos Iniciais de Setup ({setupCosts.filter(s => s.costType === 'investimento_unico' || (!s.costType && !s.isRecurring)).length})
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar conta ou credor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-44 sm:w-56 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="py-1.5 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="todas">Todas as Categorias</option>
              <option value="salario_clt">Salários & CLT</option>
              <option value="combustivel">Combustíveis</option>
              <option value="ipva">IPVA</option>
              <option value="seguro_veiculo">Seguro Veicular</option>
              <option value="impostos_carro">Impostos Carro</option>
              <option value="internet">Internet</option>
              <option value="aluguel_loja">Aluguel da Loja</option>
              <option value="alimentacao">Alimentação</option>
              <option value="das_mei">DAS MEI / Simples</option>
              <option value="divida_empresa">Dívidas Empresa</option>
              <option value="ferramental">Ferramental</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Conta / Dívida & Credor</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3">Tipo / Recorrência</th>
                <th className="py-3 px-3">Parcelas (Pagas / Total)</th>
                <th className="py-3 px-3">Vencimento</th>
                <th className="py-3 px-4 text-right">Valor Parcela / Mês</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredCosts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredCosts.map(item => {
                  const catConfig = CATEGORY_MAP[item.category] || CATEGORY_MAP.outros;
                  const isRec = item.costType === 'recorrente' || item.isRecurring;
                  const isInst = item.costType === 'parcelado';
                  const isOneTime = item.costType === 'investimento_unico' || (!isRec && !isInst);

                  const instCount = item.installmentsCount || 1;
                  const paidCount = item.paidInstallments || 0;
                  const remainingCount = Math.max(0, instCount - paidCount);
                  const progressPct = isInst ? Math.min(100, Math.round((paidCount / instCount) * 100)) : 100;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Creditor */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          {item.creditor ? (
                            <span>Credor: <strong className="text-slate-700">{item.creditor}</strong></span>
                          ) : (
                            <span className="italic">Sem credor especificado</span>
                          )}
                          {item.syncWithGeneralExpenses && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              Sincronizado
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${catConfig.badgeBg} ${catConfig.badgeText}`}>
                          {catConfig.icon}
                          <span>{catConfig.label.split('(')[0].trim()}</span>
                        </span>
                      </td>

                      {/* Recurrence Type */}
                      <td className="py-3 px-3">
                        {isRec && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <RefreshCw className="w-3 h-3 text-emerald-600" />
                            Recorrente Mensal
                          </span>
                        )}
                        {isInst && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <CreditCard className="w-3 h-3 text-rose-600" />
                            Dívida Parcelada ({instCount}x)
                          </span>
                        )}
                        {isOneTime && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                            <Layers className="w-3 h-3 text-slate-600" />
                            Investimento Único
                          </span>
                        )}
                      </td>

                      {/* Installment Progress */}
                      <td className="py-3 px-3 min-w-[140px]">
                        {isInst ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-slate-700">
                                {paidCount} de {instCount} pagas
                              </span>
                              <span className="text-slate-500 font-mono text-[10px]">
                                {remainingCount} rest.
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${paidCount >= instCount ? 'bg-emerald-500' : 'bg-blue-600'}`} 
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            {paidCount < instCount && (
                              <button
                                onClick={() => handleQuickPayInstallment(item)}
                                className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-0.5 pt-0.5"
                              >
                                +1 Parcela Paga ({formatBRL(item.installmentValue || 0)})
                              </button>
                            )}
                          </div>
                        ) : isRec ? (
                          <span className="text-slate-500 text-[11px]">Contínuo (todo mês)</span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">À vista / Parcela única</span>
                        )}
                      </td>

                      {/* Due Date & Day */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-slate-800 text-[11px]">
                          {item.dueDate ? formatDateBR(item.dueDate) : '-'}
                        </div>
                        {item.dueDay && (
                          <div className="text-[10px] text-slate-500">
                            Dia {item.dueDay} de cada mês
                          </div>
                        )}
                      </td>

                      {/* Monthly Value */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {isInst || isRec ? (
                          formatBRL(item.installmentValue || item.actualCost || 0)
                        ) : (
                          <span className="text-slate-400 font-normal">-</span>
                        )}
                      </td>

                      {/* Total Debt / Cost */}
                      <td className="py-3 px-4 text-right font-mono text-slate-900">
                        <span className="font-bold">{formatBRL(item.actualCost || 0)}</span>
                        {isInst && remainingCount > 0 && (
                          <div className="text-[10px] text-rose-600 font-medium">
                            Resta: {formatBRL((item.installmentValue || 0) * remainingCount)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {item.status === 'quitado' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Quitado
                          </span>
                        ) : item.status === 'em_andamento' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Ativo / Em Dia
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            {item.status}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title="Editar dados, datas, valor, tipo e parcelas"
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir "${item.name}"?`)) {
                                deleteSetupCost(item.id);
                              }
                            }}
                            title="Excluir conta / dívida"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-mono font-bold text-slate-900 border-t-2 border-slate-300">
                <td colSpan={5} className="py-3 px-4 font-sans font-bold">
                  TOTAL CONSOLIDADO ({filteredCosts.length} ITENS NA LISTA)
                </td>
                <td className="py-3 px-4 text-right text-rose-700 font-bold">
                  {formatBRL(
                    filteredCosts
                      .filter(s => s.status !== 'quitado' && (s.costType === 'recorrente' || s.costType === 'parcelado' || s.isRecurring))
                      .reduce((acc, curr) => acc + (curr.installmentValue || curr.actualCost || 0), 0)
                  )}/mês
                </td>
                <td className="py-3 px-4 text-right text-blue-700 font-black">
                  {formatBRL(filteredCosts.reduce((a, b) => a + (b.actualCost || 0), 0))}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal Criar / Editar Conta, Dívida ou Custo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 border border-slate-200 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  {editingId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingId ? 'Editar Conta, Dívida ou Custo' : 'Cadastrar Nova Conta ou Dívida'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure categoria, recorrência mensal ou quantidade de parcelas e datas de vencimento.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCost} className="space-y-4 text-xs mt-4">
              {/* Category Selector */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Categoria da Despesa / Dívida *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="salario_clt">Salários & Funcionário Fichado (CLT + Encargos)</option>
                  <option value="combustivel">Combustíveis da Frota & Operação (Gasolina/Etanol)</option>
                  <option value="ipva">IPVA de Veículos</option>
                  <option value="seguro_veiculo">Seguros do Veículo / Frota</option>
                  <option value="impostos_carro">Impostos sobre Carro (Licenciamento/Taxas)</option>
                  <option value="internet">Internet Fibra & Telefonia</option>
                  <option value="aluguel_loja">Aluguel da Loja & Ponto Comercial</option>
                  <option value="alimentacao">Alimentação da Equipe & Vale Refeição</option>
                  <option value="das_mei">DAS do 'MEI' / Tributos Simples Nacional</option>
                  <option value="divida_empresa">Dívidas da Empresa Diversas (Empréstimos/Parcelamentos)</option>
                  <option value="ferramental">Ferramental & Equipamentos Técnicos</option>
                  <option value="capital_giro">Capital de Giro Inicial</option>
                  <option value="outros">Outras Despesas Operacionais</option>
                </select>
              </div>

              {/* Name / Description */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Nome / Descrição da Conta ou Dívida *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aluguel da Loja Matriz, Financiamento Santander 24x, DAS Mensal..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Cost Type Selector */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Tipo de Conta / Dívida *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCostType('recorrente');
                      setInstallmentsCount(1);
                      setPaidInstallments(0);
                    }}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      costType === 'recorrente'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold ring-1 ring-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <div>Recorrente Mensal</div>
                    <div className="text-[10px] text-slate-500 font-normal">Todo mês contínuo</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCostType('parcelado');
                      if (installmentsCount <= 1) setInstallmentsCount(12);
                    }}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      costType === 'parcelado'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 font-bold ring-1 ring-rose-500'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mx-auto mb-1 text-rose-600" />
                    <div>Dívida Parcelada</div>
                    <div className="text-[10px] text-slate-500 font-normal">Paga em X parcelas</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCostType('investimento_unico');
                      setInstallmentsCount(1);
                      setPaidInstallments(1);
                    }}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      costType === 'investimento_unico'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold ring-1 ring-blue-500'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <Layers className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    <div>Investimento Único</div>
                    <div className="text-[10px] text-slate-500 font-normal">Custo único / à vista</div>
                  </button>
                </div>
              </div>

              {/* Installment Controls (Only shown for parcelado) */}
              {costType === 'parcelado' && (
                <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                    <CreditCard className="w-4 h-4 text-rose-600" />
                    <span>Configuração do Parcelamento da Dívida</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">
                        Total de Parcelas *
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="120"
                        required
                        value={installmentsCount}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setInstallmentsCount(val);
                          setActualCost(val * installmentValue);
                        }}
                        className="w-full p-2 bg-white border border-rose-200 rounded-lg font-mono font-bold text-slate-900"
                      />
                      <span className="text-[10px] text-slate-500">Ex: 12x, 24x, 36x</span>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">
                        Parcelas já Pagas
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={installmentsCount}
                        value={paidInstallments}
                        onChange={(e) => setPaidInstallments(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-rose-200 rounded-lg font-mono text-slate-900"
                      />
                      <span className="text-[10px] text-slate-500">Restam {Math.max(0, installmentsCount - paidInstallments)}</span>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">
                        Valor da Parcela (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={installmentValue}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setInstallmentValue(val);
                          setActualCost(val * installmentsCount);
                        }}
                        className="w-full p-2 bg-white border border-rose-200 rounded-lg font-mono font-bold text-rose-700"
                      />
                      <span className="text-[10px] text-slate-500">Valor mensal a pagar</span>
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-rose-200 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-600">Total da Dívida Calculado:</span>
                    <strong className="text-slate-900 text-xs font-bold">{formatBRL(installmentValue * installmentsCount)}</strong>
                  </div>
                </div>
              )}

              {/* Value for Recorrente or Unico */}
              {costType !== 'parcelado' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">
                      {costType === 'recorrente' ? 'Valor Mensal (R$) *' : 'Custo Real (R$) *'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={installmentValue}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setInstallmentValue(val);
                        setActualCost(val);
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">
                      Custo Estimado / Inicial (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-600"
                    />
                  </div>
                </div>
              )}

              {/* Dates & Due Day */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Data de Registro / Contrato *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Data de Vencimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
                  />
                  <span className="text-[10px] text-slate-500">Próxima parcela</span>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Dia Fixo do Mês (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
                  />
                  <span className="text-[10px] text-slate-500">Ex: Todo dia 10</span>
                </div>
              </div>

              {/* Creditor / Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Credor / Beneficiário / Banco / Fornecedor
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Santander, SEFAZ, Receita Federal, Imobiliária..."
                    value={creditor}
                    onChange={(e) => setCreditor(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Status Atual da Conta / Dívida
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    <option value="em_andamento">Ativo / Em Andamento</option>
                    <option value="quitado">Quitado / Pago</option>
                    <option value="adquirido">Adquirido (Setup)</option>
                    <option value="planejado">Planejado (Em estudo)</option>
                  </select>
                </div>
              </div>

              {/* Sync Toggle */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-blue-900 text-xs">
                    Sincronizar com Contas a Pagar / Despesas Gerais
                  </div>
                  <div className="text-[11px] text-blue-700">
                    Alimenta automaticamente o fluxo financeiro e contas a pagar do sistema no mês de vencimento.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={syncWithGeneralExpenses}
                  onChange={(e) => setSyncWithGeneralExpenses(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Observações / Detalhes do Contrato
                </label>
                <textarea
                  rows={2}
                  placeholder="Número de apólice, contrato bancário, taxas de juros, garantias..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
                >
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Conta / Dívida'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
