import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Mail, 
  Phone, 
  Car, 
  DollarSign, 
  Percent, 
  Calendar, 
  Trash2, 
  Edit3,
  Award
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../context/AppContext';
import { Employee } from '../types';

export const EmployeesView: React.FC = () => {
  const { employees, vehicles, addEmployee, updateEmployee, deleteEmployee } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('Técnico de Instalação e Manutenção');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [baseSalary, setBaseSalary] = useState<number>(3000);
  const [benefitsCharges, setBenefitsCharges] = useState<number>(1100);
  const [commissionRate, setCommissionRate] = useState<number>(6);
  const [assignedVehicleId, setAssignedVehicleId] = useState('');
  const [status, setStatus] = useState<'Ativo' | 'Férias' | 'Inativo'>('Ativo');
  const [admissionDate, setAdmissionDate] = useState('2025-01-10');

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPhone('');
    setBaseSalary(3000);
    setBenefitsCharges(1100);
    setCommissionRate(6);
    setAssignedVehicleId('');
    setStatus('Ativo');
    setAdmissionDate('2025-01-10');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setName(emp.name);
    setRole(emp.role);
    setEmail(emp.email);
    setPhone(emp.phone);
    setBaseSalary(emp.baseSalary);
    setBenefitsCharges(emp.benefitsCharges);
    setCommissionRate(emp.commissionRate);
    setAssignedVehicleId(emp.assignedVehicleId || '');
    setStatus(emp.status);
    setAdmissionDate(emp.admissionDate);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Informe o nome do funcionário.');
      return;
    }

    if (editingId) {
      updateEmployee(editingId, {
        name,
        role,
        email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@gestaopro.com.br`,
        phone,
        baseSalary: Number(baseSalary),
        benefitsCharges: Number(benefitsCharges),
        commissionRate: Number(commissionRate),
        assignedVehicleId: assignedVehicleId || undefined,
        status,
        admissionDate
      });
    } else {
      addEmployee({
        name,
        role,
        email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@gestaopro.com.br`,
        phone: phone || '(11) 98888-7777',
        baseSalary: Number(baseSalary),
        benefitsCharges: Number(benefitsCharges),
        commissionRate: Number(commissionRate),
        assignedVehicleId: assignedVehicleId || undefined,
        status,
        admissionDate
      });
    }

    setIsModalOpen(false);
  };

  const totalBaseSalaries = employees.reduce((a, b) => a + b.baseSalary, 0);
  const totalCharges = employees.reduce((a, b) => a + b.benefitsCharges, 0);
  const totalPayroll = totalBaseSalaries + totalCharges;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Quadro de Funcionários & Custos de Folha
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Salários · Encargos · Comissões
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão da equipe técnica e de vendas: remuneração base, provisões trabalhistas e veículos associados.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Funcionário</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Custo Total de Folha Mensal</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {formatBRL(totalPayroll)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Salários Base + Encargos Trabalhistas
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Salários Base Nominais</span>
          <div className="text-2xl font-bold font-mono text-blue-600 mt-1">
            {formatBRL(totalBaseSalaries)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {employees.length} colaboradores ativos
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Encargos & Benefícios (INSS/FGTS)</span>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
            {formatBRL(totalCharges)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Média de ~37% sobre a folha base
          </div>
        </div>
      </div>

      {/* Employees Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {employees.map(emp => {
          const assignedVeh = vehicles.find(v => v.id === emp.assignedVehicleId);
          const totalStaffCost = emp.baseSalary + emp.benefitsCharges;

          return (
            <div key={emp.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-base border border-blue-200">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{emp.name}</h3>
                    <div className="text-xs text-slate-500">{emp.role}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Admissão: {formatDateBR(emp.admissionDate)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    emp.status === 'Ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {emp.status}
                  </span>
                  <button
                    onClick={() => handleOpenEdit(emp)}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded"
                    title="Editar funcionário"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir o funcionário ${emp.name}?`)) {
                        deleteEmployee(emp.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Excluir funcionário"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Remuneration details */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Salário Base:</span>
                  <span className="font-mono font-medium text-slate-800">{formatBRL(emp.baseSalary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Encargos Trabalhistas / Provisões:</span>
                  <span className="font-mono font-medium text-slate-800">{formatBRL(emp.benefitsCharges)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Comissão sobre Serviços / Vendas:</span>
                  <span className="font-mono font-bold text-blue-600">{emp.commissionRate}%</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                  <span>Custo Fixo Mensal do Colaborador:</span>
                  <span className="font-mono text-rose-700">{formatBRL(totalStaffCost)}</span>
                </div>
              </div>

              {/* Assigned Vehicle */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-slate-400" />
                  Veículo Atribuído:
                </span>
                <span className="font-medium text-slate-800">
                  {assignedVeh ? (
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {assignedVeh.model} ({assignedVeh.plate})
                    </span>
                  ) : (
                    <span className="text-slate-400">Nenhum</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                {editingId ? 'Editar Funcionário' : 'Novo Funcionário'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs mt-4">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Alberto Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Cargo / Função *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Técnico Sênior, Eletricista"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Férias">Férias</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">E-mail</label>
                  <input
                    type="email"
                    placeholder="carlos@gestaopro.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Salário Base (R$) *</label>
                  <input
                    type="number"
                    required
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Encargos / Benefícios (R$)</label>
                  <input
                    type="number"
                    value={benefitsCharges}
                    onChange={(e) => setBenefitsCharges(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Comissão (%)</label>
                  <input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Veículo da Frota Alocado</label>
                  <select
                    value={assignedVehicleId}
                    onChange={(e) => setAssignedVehicleId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="">Nenhum veículo fixo</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.model} ({v.plate})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Data de Admissão</label>
                  <input
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
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
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
