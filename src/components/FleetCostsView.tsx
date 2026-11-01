import React, { useState } from 'react';
import { 
  Truck, 
  Plus, 
  Fuel, 
  Wrench, 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  Calendar, 
  Trash2, 
  DollarSign,
  Car
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../context/AppContext';
import { VehicleMaintenance, PaymentMethod } from '../types';

export const FleetCostsView: React.FC = () => {
  const { 
    vehicles, 
    vehicleExpenses, 
    employees, 
    addVehicleExpense, 
    deleteVehicleExpense,
    addVehicle,
    selectedMonthYear 
  } = useApp();

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');

  // New Expense Form State
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || '');
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || '');
  const [category, setCategory] = useState<VehicleMaintenance['category']>('combustivel');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState<number>(0);
  const [date, setDate] = useState('2026-10-28');
  const [kmAtService, setKmAtService] = useState<number>(48900);
  const [litersFuel, setLitersFuel] = useState<number>(45);
  const [workshopOrSupplier, setWorkshopOrSupplier] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cartao_debito');

  // New Vehicle Form State
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState(2023);
  const [currentKm, setCurrentKm] = useState(40000);
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('');
  const [nextOilChangeKm, setNextOilChangeKm] = useState(50000);
  const [annualIpvaValue, setAnnualIpvaValue] = useState(1900);
  const [annualInsuranceValue, setAnnualInsuranceValue] = useState(2400);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || cost <= 0) {
      alert('Informe a descrição e o valor do custo.');
      return;
    }

    addVehicleExpense({
      vehicleId,
      employeeId: employeeId || undefined,
      category,
      description,
      cost: Number(cost),
      date,
      kmAtService: kmAtService ? Number(kmAtService) : undefined,
      litersFuel: category === 'combustivel' ? Number(litersFuel) : undefined,
      workshopOrSupplier: workshopOrSupplier || 'Fornecedor padrão',
      paymentMethod
    });

    setIsExpenseModalOpen(false);
    setDescription('');
    setCost(0);
  };

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!model.trim() || !plate.trim()) {
      alert('Informe o modelo e a placa do veículo.');
      return;
    }

    addVehicle({
      model,
      plate: plate.toUpperCase(),
      year: Number(year),
      currentKm: Number(currentKm),
      assignedEmployeeId: assignedEmployeeId || undefined,
      status: 'Operacional',
      nextOilChangeKm: Number(nextOilChangeKm),
      annualIpvaValue: Number(annualIpvaValue),
      annualInsuranceValue: Number(annualInsuranceValue)
    });

    setIsVehicleModalOpen(false);
    setModel('');
    setPlate('');
  };

  // Filtered maintenance list
  const filteredExpenses = vehicleExpenses.filter(e => {
    if (categoryFilter === 'todos') return true;
    return e.category === categoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Frota de Veículos & Custos de Manutenção
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Controle Individual por Placa
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de combustível, troca de óleo, pastilhas de freio, IPVA, seguro e cálculo de amortização alocada a cada técnico.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsVehicleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Car className="w-4 h-4 text-slate-500" />
            <span>+ Novo Veículo</span>
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Despesa Veicular</span>
          </button>
        </div>
      </div>

      {/* Vehicle Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vehicles.map(veh => {
          const driver = employees.find(e => e.id === veh.assignedEmployeeId);
          const kmRemainingOil = veh.nextOilChangeKm - veh.currentKm;
          const isOilNear = kmRemainingOil <= 1500;

          // Month fuel spent on this vehicle
          const vehicleMonthFuel = vehicleExpenses
            .filter(e => e.vehicleId === veh.id && e.category === 'combustivel' && e.date.startsWith(selectedMonthYear))
            .reduce((a, b) => a + b.cost, 0);

          // Month maintenance spent on this vehicle
          const vehicleMonthMnt = vehicleExpenses
            .filter(e => e.vehicleId === veh.id && e.category !== 'combustivel' && e.date.startsWith(selectedMonthYear))
            .reduce((a, b) => a + b.cost, 0);

          const monthlyFixedAmortization = (veh.annualIpvaValue + veh.annualInsuranceValue) / 12;

          return (
            <div key={veh.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-white font-bold">
                    {veh.plate}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 mt-1">{veh.model}</h3>
                  <div className="text-xs text-slate-500">Ano: {veh.year} · Odômetro: <span className="font-mono font-semibold text-slate-700">{veh.currentKm.toLocaleString('pt-BR')} km</span></div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {veh.status}
                </span>
              </div>

              {/* Driver */}
              <div className="p-2.5 bg-slate-50 rounded-lg text-xs flex items-center justify-between">
                <span className="text-slate-500">Condutor Responsável:</span>
                <span className="font-semibold text-slate-800">{driver ? driver.name : 'Frota Compartilhada'}</span>
              </div>

              {/* Maintenance Metrics */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5 text-amber-500" />
                    Gasolina no Mês:
                  </span>
                  <span className="font-mono font-bold text-amber-800">{formatBRL(vehicleMonthFuel)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-blue-500" />
                    Manutenção Mecânica:
                  </span>
                  <span className="font-mono font-bold text-slate-700">{formatBRL(vehicleMonthMnt)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">IPVA Anual:</span>
                  <span className="font-mono text-slate-700">{formatBRL(veh.annualIpvaValue)} <span className="text-[10px] text-slate-400">({formatBRL(veh.annualIpvaValue / 12)}/mês)</span></span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Seguro Anual:</span>
                  <span className="font-mono text-slate-700">{formatBRL(veh.annualInsuranceValue)} <span className="text-[10px] text-slate-400">({formatBRL(veh.annualInsuranceValue / 12)}/mês)</span></span>
                </div>
              </div>

              {/* Oil Status Callout */}
              <div className={`p-2.5 rounded-lg text-xs flex items-center justify-between ${
                isOilNear ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-slate-50 text-slate-600'
              }`}>
                <span>Próxima Troca de Óleo:</span>
                <span className="font-mono font-bold">
                  {veh.nextOilChangeKm.toLocaleString('pt-BR')} km ({kmRemainingOil} km restantes)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expenses History Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Histórico de Gastos Veiculares (Combustível, Peças, Taxas)
            </h2>
            <p className="text-xs text-slate-500">
              Todos os lançamentos vinculados a veículos e motoristas para composição do custo por técnico.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'combustivel', label: 'Gasolina' },
              { id: 'troca_oleo', label: 'Troca de Óleo' },
              { id: 'pastilhas_freio', label: 'Pastilhas' },
              { id: 'pneus', label: 'Pneus / Alinhamento' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  categoryFilter === tab.id
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
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-3">Veículo</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-4">Descrição do Serviço / Abastecimento</th>
                <th className="py-3 px-3">Condutor / Técnico</th>
                <th className="py-3 px-3">KM / Litros</th>
                <th className="py-3 px-3">Fornecedor / Posto</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredExpenses.map(exp => {
                const veh = vehicles.find(v => v.id === exp.vehicleId);
                const tech = employees.find(e => e.id === exp.employeeId);

                return (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {formatDateBR(exp.date)}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      {veh?.plate || '-'}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        exp.category === 'combustivel'
                          ? 'bg-amber-100 text-amber-800'
                          : exp.category === 'troca_oleo'
                          ? 'bg-blue-100 text-blue-800'
                          : exp.category === 'pastilhas_freio'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {exp.category.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {exp.description}
                    </td>

                    <td className="py-3 px-3 text-slate-700">
                      {tech?.name || 'Não vinculado'}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-600">
                      {exp.kmAtService ? `${exp.kmAtService} km` : '-'}
                      {exp.litersFuel ? ` (${exp.litersFuel}L)` : ''}
                    </td>

                    <td className="py-3 px-3 text-slate-500">
                      {exp.workshopOrSupplier}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                      {formatBRL(exp.cost)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          if (confirm('Deseja excluir este lançamento de despesa veicular?')) {
                            deleteVehicleExpense(exp.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Excluir despesa"
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

      {/* Modal Lançar Despesa */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Lançamento de Despesa da Frota</h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4 text-xs mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Veículo *</label>
                  <select
                    value={vehicleId}
                    onChange={(e) => {
                      setVehicleId(e.target.value);
                      const v = vehicles.find(item => item.id === e.target.value);
                      if (v?.assignedEmployeeId) {
                        setEmployeeId(v.assignedEmployeeId);
                      }
                      if (v?.currentKm) {
                        setKmAtService(v.currentKm);
                      }
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.model} ({v.plate})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Condutor Responsável</label>
                  <select
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="">Não atribuído</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Tipo de Custo *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as VehicleMaintenance['category'])}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="combustivel">Gasolina / Combustível</option>
                    <option value="troca_oleo">Troca de Óleo e Filtros</option>
                    <option value="pastilhas_freio">Pastilhas de Freio / Fluido</option>
                    <option value="pneus">Pneus / Alinhamento / Balanceamento</option>
                    <option value="ipva">IPVA / Taxas de Licenciamento</option>
                    <option value="seguro">Seguro Automotivo</option>
                    <option value="manutencao_veiculo">Manutenção Mecânica Geral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Data do Lançamento</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Descrição *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Abastecimento 45L Gasolina Comum / Troca de Óleo 5W30"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Valor Total (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={cost || ''}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-rose-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">KM Atual</label>
                  <input
                    type="number"
                    value={kmAtService || ''}
                    onChange={(e) => setKmAtService(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                {category === 'combustivel' && (
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Litros</label>
                    <input
                      type="number"
                      step="0.1"
                      value={litersFuel || ''}
                      onChange={(e) => setLitersFuel(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Oficina / Posto de Combustível</label>
                <input
                  type="text"
                  placeholder="Ex: Posto Shell, Oficina Freios & Cia"
                  value={workshopOrSupplier}
                  onChange={(e) => setWorkshopOrSupplier(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
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

      {/* Modal Novo Veículo */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Cadastrar Novo Veículo na Frota</h3>
              <button
                onClick={() => setIsVehicleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Modelo do Veículo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fiat Strada 1.4 Hard Working"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Placa (Padrão Mercosul) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: BRA2E19"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg uppercase font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Ano</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">KM Atual</label>
                  <input
                    type="number"
                    value={currentKm}
                    onChange={(e) => setCurrentKm(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Próx. Troca Óleo (KM)</label>
                  <input
                    type="number"
                    value={nextOilChangeKm}
                    onChange={(e) => setNextOilChangeKm(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">IPVA Anual Previsto (R$)</label>
                  <input
                    type="number"
                    value={annualIpvaValue}
                    onChange={(e) => setAnnualIpvaValue(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Seguro Anual Previsto (R$)</label>
                  <input
                    type="number"
                    value={annualInsuranceValue}
                    onChange={(e) => setAnnualInsuranceValue(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Condutor Técnico Padrão</label>
                <select
                  value={assignedEmployeeId}
                  onChange={(e) => setAssignedEmployeeId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="">Nenhum fixo (compartilhado)</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Cadastrar Veículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
