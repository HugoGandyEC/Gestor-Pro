import React, { useState } from 'react';
import { 
  Calculator, 
  Plus, 
  TrendingUp, 
  CheckCircle2, 
  DollarSign, 
  PieChart, 
  Trash2, 
  Layers, 
  Target,
  Sparkles
} from 'lucide-react';
import { useApp, formatBRL } from '../context/AppContext';

export const InitialCostSimulatorView: React.FC = () => {
  const { 
    setupCosts, 
    addSetupCost, 
    deleteSetupCost,
    employees,
    vehicles,
    generalExpenses 
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Ferramental & Equipamentos');
  const [estimatedCost, setEstimatedCost] = useState<number>(5000);
  const [actualCost, setActualCost] = useState<number>(5000);
  const [notes, setNotes] = useState('');

  // Break-even simulator parameters
  const [averageOSTicket, setAverageOSTicket] = useState(1400); // Ticket médio por OS
  const [partsCostPercentage, setPartsCostPercentage] = useState(30); // 30% em peças/insumos
  const [targetProfit, setTargetProfit] = useState(15000); // Meta de lucro líquido mensal

  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addSetupCost({
      name,
      category,
      estimatedCost: Number(estimatedCost),
      actualCost: Number(actualCost),
      status: 'adquirido',
      date: new Date().toISOString().split('T')[0],
      notes
    });

    setIsModalOpen(false);
    setName('');
    setNotes('');
  };

  // Setup Totals
  const totalEstimatedSetup = setupCosts.reduce((a, b) => a + b.estimatedCost, 0);
  const totalActualSetup = setupCosts.reduce((a, b) => a + b.actualCost, 0);

  // Projeção de Custo Mensal Recorrente da Estrutura Cadastrada
  const totalMonthlySalaries = employees.reduce((a, b) => a + b.baseSalary + b.benefitsCharges, 0);
  const totalMonthlyRent = generalExpenses.filter(e => e.category === 'aluguel' && e.isRecurring).reduce((a, b) => a + b.cost, 0) || 3850;
  const totalMonthlyInternet = generalExpenses.filter(e => e.category === 'internet' && e.isRecurring).reduce((a, b) => a + b.cost, 0) || 219.90;
  const totalMonthlyCellphones = generalExpenses.filter(e => e.category === 'celular' && e.isRecurring).reduce((a, b) => a + b.cost, 0) || 339.60;
  const totalMonthlyUtilities = generalExpenses.filter(e => e.category === 'energia_agua' && e.isRecurring).reduce((a, b) => a + b.cost, 0) || 540.30;
  const totalMonthlyAccountant = generalExpenses.filter(e => e.category === 'software_contabilidade' && e.isRecurring).reduce((a, b) => a + b.cost, 0) || 850.00;
  const totalMonthlyVehicleProrated = vehicles.reduce((a, v) => a + ((v.annualIpvaValue + v.annualInsuranceValue) / 12), 0);
  const estimatedMonthlyFuel = 1800.00;
  const estimatedMonthlyMaintenance = 800.00;

  const totalMonthlyFixedCost = 
    totalMonthlySalaries + 
    totalMonthlyRent + 
    totalMonthlyInternet + 
    totalMonthlyCellphones + 
    totalMonthlyUtilities + 
    totalMonthlyAccountant + 
    totalMonthlyVehicleProrated + 
    estimatedMonthlyFuel + 
    estimatedMonthlyMaintenance;

  // Break-even Calculations
  const grossMarginPerOS = averageOSTicket * (1 - partsCostPercentage / 100);
  const breakEvenOSCount = grossMarginPerOS > 0 ? Math.ceil(totalMonthlyFixedCost / grossMarginPerOS) : 0;
  const breakEvenRevenue = breakEvenOSCount * averageOSTicket;

  // Target profit OS count
  const targetOSCount = grossMarginPerOS > 0 ? Math.ceil((totalMonthlyFixedCost + targetProfit) / grossMarginPerOS) : 0;
  const targetRevenue = targetOSCount * averageOSTicket;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Custos Iniciais de Setup & Ponto de Equilíbrio (Break-Even)
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Planejamento & Viabilidade
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mapeamento dos investimentos de implantação da empresa (ferramental, capital de giro, caução) e cálculo da meta mínima de OS para cobrir todos os custos.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Item de Investimento Inicial</span>
        </button>
      </div>

      {/* Break-even & Viability Simulator Box */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Simulador de Ponto de Equilíbrio Operacional
              </h2>
              <p className="text-xs text-slate-300">
                Quantas Ordens de Serviço a empresa precisa realizar no mês para pagar 100% dos custos fixos?
              </p>
            </div>
          </div>
        </div>

        {/* Sliders & Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/5 p-4 rounded-xl border border-white/10">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Ticket Médio Previsto por OS:
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">R$</span>
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
              <span className="text-xs text-slate-400">R$</span>
              <input
                type="number"
                value={targetProfit}
                onChange={(e) => setTargetProfit(Number(e.target.value))}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white font-mono text-sm font-bold text-emerald-400"
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Lucro líquido após pagar tudo</div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs text-slate-400 font-medium">Custo Fixo Mensal Base</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {formatBRL(totalMonthlyFixedCost)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Salários, frota, aluguel, internet, gasolina
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-xs text-amber-300 font-medium">Ponto de Equilíbrio (Break-Even)</span>
            <div className="text-2xl font-black font-mono text-amber-400 mt-1">
              {breakEvenOSCount} Ordens de Serviço
            </div>
            <div className="text-[11px] text-amber-200 mt-1">
              Faturamento zero a zero: {formatBRL(breakEvenRevenue)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-xs text-emerald-300 font-medium">Meta para Lucro de {formatBRL(targetProfit)}</span>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {targetOSCount} Ordens de Serviço
            </div>
            <div className="text-[11px] text-emerald-200 mt-1">
              Faturamento necessário: {formatBRL(targetRevenue)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <span className="text-xs text-blue-300 font-medium">Meta por Técnico ({employees.length} colaboradores)</span>
            <div className="text-2xl font-black font-mono text-blue-400 mt-1">
              {Math.ceil(targetOSCount / employees.length)} OS / mês
            </div>
            <div className="text-[11px] text-blue-200 mt-1">
              ~{(Math.ceil(targetOSCount / employees.length) / 22).toFixed(1)} OS por dia útil / técnico
            </div>
          </div>
        </div>
      </div>

      {/* Setup Investment Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Investimento Inicial de Implantação (Setup Realizado)
            </h2>
            <p className="text-xs text-slate-500">
              Total investido na estruturação física, capital de giro e ferramentas para operar a empresa.
            </p>
          </div>
          <div className="font-mono text-sm font-bold text-slate-900">
            Investimento Total: <span className="text-blue-600">{formatBRL(totalActualSetup)}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Item de Investimento</th>
                <th className="py-3 px-3">Observações / Detalhes</th>
                <th className="py-3 px-3 text-right">Estimado</th>
                <th className="py-3 px-4 text-right">Custo Real</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {setupCosts.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {item.category}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {item.name}
                  </td>
                  <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                    {item.notes || '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500">
                    {formatBRL(item.estimatedCost)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {formatBRL(item.actualCost)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800">
                      Adquirido
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => {
                        if (confirm(`Excluir item ${item.name}?`)) {
                          deleteSetupCost(item.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-mono font-bold text-slate-900 border-t-2 border-slate-300">
                <td colSpan={3} className="py-3 px-4 font-sans font-bold">
                  TOTAL DO INVESTIMENTO INICIAL DE SETUP
                </td>
                <td className="py-3 px-3 text-right text-slate-600">
                  {formatBRL(totalEstimatedSetup)}
                </td>
                <td className="py-3 px-4 text-right text-blue-700 font-black">
                  {formatBRL(totalActualSetup)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal Novo Item de Setup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Novo Item de Investimento Inicial</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCost} className="space-y-4 text-xs mt-4">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Categoria do Investimento *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="Ferramental & Equipamentos">Ferramental & Equipamentos</option>
                  <option value="Capital de Giro Inicial">Capital de Giro Inicial</option>
                  <option value="Estrutura & Ponto Comercial">Estrutura & Ponto Comercial</option>
                  <option value="Frota & Mobilidade">Frota & Mobilidade</option>
                  <option value="TI & Softwares">TI & Softwares</option>
                  <option value="Legalização & Abertura">Legalização & Abertura</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Nome do Item *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Maletas de ferramentas, Caução, Adesivação de carros"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Custo Estimado (R$)</label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Custo Real (R$) *</label>
                  <input
                    type="number"
                    required
                    value={actualCost}
                    onChange={(e) => setActualCost(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Observações / Especificação</label>
                <textarea
                  rows={2}
                  placeholder="Detalhes técnicos, marcas, garantias..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Salvar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
