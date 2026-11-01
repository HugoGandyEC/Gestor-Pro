import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Wifi, 
  Smartphone, 
  Utensils, 
  Zap, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../context/AppContext';
import { GeneralExpense, ExpenseCategory } from '../types';

export const OperationalCostsView: React.FC = () => {
  const { 
    generalExpenses, 
    employees, 
    addGeneralExpense, 
    updateGeneralExpense, 
    deleteGeneralExpense,
    selectedMonthYear 
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('todos');

  // Form State
  const [category, setCategory] = useState<ExpenseCategory>('aluguel');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState<number>(0);
  const [dueDate, setDueDate] = useState('2026-10-15');
  const [isPaid, setIsPaid] = useState(true);
  const [employeeId, setEmployeeId] = useState('');
  const [supplier, setSupplier] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || cost <= 0) {
      alert('Preencha a descrição e o valor do custo.');
      return;
    }

    addGeneralExpense({
      category,
      description,
      cost: Number(cost),
      dueDate,
      paymentDate: isPaid ? dueDate : undefined,
      isPaid,
      employeeId: employeeId || undefined,
      supplier: supplier || 'Fornecedor',
      isRecurring
    });

    setIsModalOpen(false);
    setDescription('');
    setCost(0);
    setSupplier('');
  };

  const monthExpenses = generalExpenses.filter(e => e.dueDate.startsWith(selectedMonthYear));
  const totalMonthCosts = monthExpenses.reduce((a, b) => a + b.cost, 0);
  const totalPaid = monthExpenses.filter(e => e.isPaid).reduce((a, b) => a + b.cost, 0);
  const totalPending = monthExpenses.filter(e => !e.isPaid).reduce((a, b) => a + b.cost, 0);

  const filteredList = generalExpenses.filter(e => {
    if (filterCategory === 'todos') return true;
    return e.category === filterCategory;
  });

  const getCategoryIcon = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'aluguel':
        return <Building2 className="w-4 h-4 text-slate-700" />;
      case 'internet':
        return <Wifi className="w-4 h-4 text-blue-600" />;
      case 'celular':
        return <Smartphone className="w-4 h-4 text-purple-600" />;
      case 'alimentacao':
        return <Utensils className="w-4 h-4 text-amber-600" />;
      case 'energia_agua':
        return <Zap className="w-4 h-4 text-yellow-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Custos Fixos & Operacionais da Empresa
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Aluguel · Internet · Celular · Alimentação
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle de despesas estruturais e rateio de linhas celulares e refeições em campo diretamente para cada colaborador.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Lançar Nova Despesa</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Custos Operacionais ({selectedMonthYear})</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {formatBRL(totalMonthCosts)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {monthExpenses.length} lançamentos cadastrados no mês
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Contas Já Pagas</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {formatBRL(totalPaid)}
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">
            Liquidado no fluxo de caixa
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Contas a Pagar / Pendentes</span>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
            {formatBRL(totalPending)}
          </div>
          <div className="text-xs text-amber-700 font-semibold mt-1">
            {monthExpenses.filter(e => !e.isPaid).length} contas com vencimento em aberto
          </div>
        </div>
      </div>

      {/* Table & Category Filter */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Demonstrativo de Despesas Operacionais
            </h2>
            <p className="text-xs text-slate-500">
              Despesas com atribuição direta a funcionários entram no cálculo individual de lucratividade.
            </p>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'todos', label: 'Todas' },
              { id: 'aluguel', label: 'Aluguel' },
              { id: 'internet', label: 'Internet' },
              { id: 'celular', label: 'Celulares' },
              { id: 'alimentacao', label: 'Alimentação' },
              { id: 'energia_agua', label: 'Energia / Água' },
              { id: 'software_contabilidade', label: 'Contabilidade' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterCategory(tab.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  filterCategory === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-4">Descrição da Conta</th>
                <th className="py-3 px-3">Fornecedor / Credor</th>
                <th className="py-3 px-3">Atribuído ao Técnico</th>
                <th className="py-3 px-3">Recorrência</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredList.map(exp => {
                const assignedEmp = employees.find(e => e.id === exp.employeeId);
                return (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {formatDateBR(exp.dueDate)}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700 capitalize">
                        {getCategoryIcon(exp.category)}
                        <span>{exp.category.replace('_', ' ')}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-900">
                      {exp.description}
                    </td>

                    <td className="py-3 px-3 text-slate-500">
                      {exp.supplier}
                    </td>

                    <td className="py-3 px-3">
                      {assignedEmp ? (
                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                          {assignedEmp.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">Geral / Empresa</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {exp.isRecurring ? 'Mensal' : 'Pontual'}
                    </td>

                    <td className="py-3 px-3">
                      <button
                        onClick={() => updateGeneralExpense(exp.id, { isPaid: !exp.isPaid })}
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold cursor-pointer ${
                          exp.isPaid 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {exp.isPaid ? 'Pago' : 'A Pagar'}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatBRL(exp.cost)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          if (confirm('Deseja excluir esta conta?')) {
                            deleteGeneralExpense(exp.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Despesa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Lançar Nova Despesa Operacional</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4 text-xs mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Categoria da Despesa *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="aluguel">Aluguel do Ponto / Galpão</option>
                    <option value="internet">Internet & Telefonia Fibra</option>
                    <option value="celular">Conta de Celular Corporativo</option>
                    <option value="alimentacao">Alimentação / Diária em Campo</option>
                    <option value="energia_agua">Energia Elétrica & Água</option>
                    <option value="software_contabilidade">Contabilidade & Softwares</option>
                    <option value="ferramental">Ferramental & Reparos</option>
                    <option value="outros">Outros Custos Fixos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Atribuir a Funcionário</label>
                  <select
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="">Geral (Custo Fixo da Empresa)</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Descrição da Conta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aluguel Galpão Outubro / Conta Celular Carlos / Almoço em Campo"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={cost || ''}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Data de Vencimento</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Fornecedor / Credor</label>
                  <input
                    type="text"
                    placeholder="Ex: Imobiliária, Vivo, Claro, Restaurante"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Status de Pagamento</label>
                  <select
                    value={isPaid ? 'pago' : 'pendente'}
                    onChange={(e) => setIsPaid(e.target.value === 'pago')}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="pago">Pago / Quitado</option>
                    <option value="pendente">A Pagar (Pendente)</option>
                  </select>
                </div>
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
                  Salvar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
