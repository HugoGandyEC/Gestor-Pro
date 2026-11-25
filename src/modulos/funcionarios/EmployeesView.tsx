import React, { useState } from 'react';
import {
  Users,
  Plus,
  Car,
  Trash2,
  Edit3
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../../context/AppContext';
import { Employee, EmployeeRemunerationType } from '../../types';
import {
  REMUNERATION_TYPE_OPTIONS,
  REMUNERATION_TYPE_LABELS,
  getEmployeeRemunerationType,
  getRemunerationConfig,
  computeEmployeeNominalPay,
  computeEmployeeMonthlyFixedCost,
  formatEmployeeRemunerationSummary
} from '../../utils/employeeRemuneration';
import { LiveSearchInput } from '../../components/LiveSearchInput';
import { RecordDetailModal } from '../../components/RecordDetailModal';
import { ViewModeToggle, ViewMode } from '../../components/ViewModeToggle';
import { useRowHoverTooltip } from '../../components/RowHoverTooltip';

export const EmployeesView: React.FC = () => {
  const { employees, vehicles, addEmployee, updateEmployee, deleteEmployee } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [remunerationFilter, setRemunerationFilter] = useState<'todos' | EmployeeRemunerationType>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'Ativo' | 'Férias' | 'Inativo'>('todos');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { showTooltip, hideTooltip, tooltipElement } = useRowHoverTooltip();

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('Técnico de Instalação e Manutenção');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [remunerationType, setRemunerationType] = useState<EmployeeRemunerationType>('salario_comissao');
  const [baseSalary, setBaseSalary] = useState<number>(3000);
  const [hourlyRate, setHourlyRate] = useState<number>(35);
  const [monthlyHoursWorked, setMonthlyHoursWorked] = useState<number>(176);
  const [benefitsCharges, setBenefitsCharges] = useState<number>(1100);
  const [commissionRate, setCommissionRate] = useState<number>(6);
  const [assignedVehicleId, setAssignedVehicleId] = useState('');
  const [status, setStatus] = useState<'Ativo' | 'Férias' | 'Inativo'>('Ativo');
  const [admissionDate, setAdmissionDate] = useState('2025-01-10');

  const remCfg = getRemunerationConfig(remunerationType);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormError(null);
    setName('');
    setRole('Técnico de Instalação e Manutenção');
    setEmail('');
    setPhone('');
    setRemunerationType('salario_comissao');
    setBaseSalary(3000);
    setHourlyRate(35);
    setMonthlyHoursWorked(176);
    setBenefitsCharges(1100);
    setCommissionRate(6);
    setAssignedVehicleId('');
    setStatus('Ativo');
    setAdmissionDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setFormError(null);
    setName(emp.name);
    setRole(emp.role);
    setEmail(emp.email);
    setPhone(emp.phone);
    setRemunerationType(getEmployeeRemunerationType(emp));
    setBaseSalary(emp.baseSalary || 0);
    setHourlyRate(emp.hourlyRate ?? 35);
    setMonthlyHoursWorked(emp.monthlyHoursWorked ?? 176);
    setBenefitsCharges(emp.benefitsCharges || 0);
    setCommissionRate(emp.commissionRate || 0);
    setAssignedVehicleId(emp.assignedVehicleId || '');
    setStatus(emp.status);
    setAdmissionDate(emp.admissionDate);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Informe o nome do funcionário.');
      return;
    }

    const cfg = getRemunerationConfig(remunerationType);
    const effectiveBaseSalary = cfg.usesSalary ? Number(baseSalary || 0) : 0;
    const effectiveHourlyRate = cfg.usesHourly ? Number(hourlyRate || 0) : 0;
    const effectiveMonthlyHours = cfg.usesHourly ? Number(monthlyHoursWorked || 0) : 0;
    const effectiveCommission = cfg.usesCommission ? Number(commissionRate || 0) : 0;

    const payload = {
      name: name.trim(),
      role: role.trim(),
      email: email || `${name.trim().toLowerCase().replace(/\s+/g, '.')}@gestaopro.com.br`,
      phone: phone || '(11) 98888-7777',
      remunerationType,
      baseSalary: effectiveBaseSalary,
      hourlyRate: effectiveHourlyRate,
      monthlyHoursWorked: effectiveMonthlyHours,
      benefitsCharges: Number(benefitsCharges || 0),
      commissionRate: effectiveCommission,
      assignedVehicleId: assignedVehicleId || undefined,
      status,
      admissionDate
    };

    if (editingId) {
      updateEmployee(editingId, payload);
    } else {
      addEmployee(payload);
    }

    setIsModalOpen(false);
  };

  const filteredEmployees = employees.filter(emp => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      emp.name.toLowerCase().includes(q) ||
      emp.role.toLowerCase().includes(q) ||
      (emp.phone || '').toLowerCase().includes(q) ||
      (emp.email || '').toLowerCase().includes(q);
    const empType = getEmployeeRemunerationType(emp);
    const matchesRem = remunerationFilter === 'todos' || empType === remunerationFilter;
    const matchesStatus = statusFilter === 'todos' || emp.status === statusFilter;
    return matchesSearch && matchesRem && matchesStatus;
  });

  const calculatedNominalPreview = remCfg.usesHourly
    ? Number(hourlyRate || 0) * Number(monthlyHoursWorked || 0)
    : remCfg.usesSalary
    ? Number(baseSalary || 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Funcionários & Equipe
            </h1>
            <span className="hidden md:inline-block text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Salários · Hora Trabalhada · Comissões
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl line-clamp-2 leading-relaxed">
            Gerencie técnicos, vendedores, salários e comissões com sincronização automática no módulo financeiro.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Funcionário</span>
        </button>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex-1 w-full lg:max-w-md">
          <LiveSearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar colaborador por nome, cargo, telefone ou e-mail..."
            emptyLabel="Nenhum funcionário"
            getOptions={(query) => {
              const q = query.toLowerCase();
              return employees
                .filter(e => e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q))
                .map(e => ({
                  id: e.id,
                  title: e.name,
                  subtitle: `${e.role} · ${REMUNERATION_TYPE_LABELS[getEmployeeRemunerationType(e)]}`,
                  badgeText: e.status,
                  data: e.name
                }));
            }}
            onSelect={(opt) => setSearchTerm(opt.data)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={remunerationFilter}
            onChange={(e) => setRemunerationFilter(e.target.value as 'todos' | EmployeeRemunerationType)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="todos">Todas as Remunerações</option>
            {REMUNERATION_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'todos' | 'Ativo' | 'Férias' | 'Inativo')}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="todos">Todos os Status</option>
            <option value="Ativo">Ativo</option>
            <option value="Férias">Férias</option>
            <option value="Inativo">Inativo</option>
          </select>

          <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Employees List or Grid Cards */}
      {viewMode === 'list' ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          {filteredEmployees.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              Nenhum funcionário encontrado com os filtros informados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="dense-table text-left text-xs">
                <thead>
                  <tr>
                    <th>Colaborador</th>
                    <th className="hidden md:table-cell">Cargo</th>
                    <th className="hidden md:table-cell">Modelo</th>
                    <th className="hidden md:table-cell">Status</th>
                    <th>Telefone</th>
                    <th className="text-right">Base Mensal</th>
                    <th className="hidden md:table-cell text-center">Comissão</th>
                    <th className="hidden md:table-cell">Veículo</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => {
                    const assignedVeh = vehicles.find(v => v.id === emp.assignedVehicleId);
                    const remType = getEmployeeRemunerationType(emp);
                    const nominalPay = computeEmployeeNominalPay(emp);
                    const totalStaffCost = computeEmployeeMonthlyFixedCost(emp);
                    return (
                      <tr
                        key={emp.id}
                        className="dense-row"
                        onMouseEnter={(e) =>
                          showTooltip(e, {
                            title: emp.name,
                            subtitle: `${emp.role} · ${REMUNERATION_TYPE_LABELS[remType]} · ${emp.status}`,
                            description: `Admitido em ${formatDateBR(emp.admissionDate)} · Custo fixo mensal de ${formatBRL(totalStaffCost)}.`,
                            fields: [
                              { label: 'Telefone / WhatsApp', value: emp.phone || '—' },
                              { label: 'Remuneração', value: formatEmployeeRemunerationSummary(emp, formatBRL) },
                              { label: 'Base Mensal Calculada', value: formatBRL(nominalPay) },
                              { label: 'Encargos / Benefícios', value: formatBRL(emp.benefitsCharges) },
                              { label: 'Comissão', value: `${emp.commissionRate}%` },
                              { label: 'Veículo Alocado', value: assignedVeh ? `${assignedVeh.model} (${assignedVeh.plate})` : 'Nenhum' }
                            ]
                          })
                        }
                        onMouseLeave={hideTooltip}
                      >
                        <td className="font-semibold text-slate-900">{emp.name}</td>
                        <td className="hidden md:table-cell text-blue-700 font-medium">{emp.role}</td>
                        <td className="hidden md:table-cell">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            {REMUNERATION_TYPE_LABELS[remType]}
                          </span>
                        </td>
                        <td className="hidden md:table-cell">
                          <span className={`font-semibold text-[11px] ${emp.status === 'Ativo' ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="font-mono text-slate-600 tabular-nums">{emp.phone || '—'}</td>
                        <td className="text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatBRL(nominalPay)}
                        </td>
                        <td className="hidden md:table-cell text-center font-mono font-bold text-blue-600 tabular-nums">{emp.commissionRate}%</td>
                        <td className="hidden md:table-cell font-mono text-slate-700">{assignedVeh ? assignedVeh.plate : '—'}</td>
                        <td className="text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailEmployee(emp)}
                              className="list-plus-btn"
                              title="Abrir todos os dados do funcionário"
                              aria-label={`Ver detalhes de ${emp.name}`}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(emp)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                              title="Editar funcionário"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Excluir o funcionário ${emp.name}?`)) {
                                  deleteEmployee(emp.id);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Excluir funcionário"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map(emp => {
            const assignedVeh = vehicles.find(v => v.id === emp.assignedVehicleId);
            const remType = getEmployeeRemunerationType(emp);
            const nominalPay = computeEmployeeNominalPay(emp);
            const totalStaffCost = computeEmployeeMonthlyFixedCost(emp);

            return (
              <div key={emp.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-base border border-blue-200 shrink-0">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 truncate">{emp.name}</h3>
                      <div className="text-xs text-slate-500 truncate">{emp.role}</div>
                      <div className="text-[11px] text-blue-700 font-semibold mt-0.5">
                        {REMUNERATION_TYPE_LABELS[remType]}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      emp.status === 'Ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {emp.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDetailEmployee(emp)}
                      className="list-plus-btn"
                      title="Abrir todos os dados do funcionário"
                      aria-label={`Ver detalhes de ${emp.name}`}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(emp)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                      title="Editar funcionário"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Excluir o funcionário ${emp.name}?`)) {
                          deleteEmployee(emp.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Excluir funcionário"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Remuneration details */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Remuneração Base:</span>
                    <span className="font-mono font-medium text-slate-800 tabular-nums">{formatBRL(nominalPay)}</span>
                  </div>
                  {(remType === 'hora_trabalhada' || remType === 'hora_comissao') && (
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Detalhe Horas:</span>
                      <span className="font-mono tabular-nums">
                        {formatBRL(emp.hourlyRate || 0)}/h × {emp.monthlyHoursWorked || 0}h
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Encargos / Provisões:</span>
                    <span className="font-mono font-medium text-slate-800 tabular-nums">{formatBRL(emp.benefitsCharges)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Comissão Serviços/Vendas:</span>
                    <span className="font-mono font-bold text-blue-600 tabular-nums">{emp.commissionRate}%</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                    <span>Custo Fixo Mensal:</span>
                    <span className="font-mono text-rose-700 tabular-nums">{formatBRL(totalStaffCost)}</span>
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
      )}

      {/* Modal Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 border border-slate-200 my-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                {editingId ? 'Editar Funcionário' : 'Novo Funcionário'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs mt-4">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                  {formError}
                </div>
              )}

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
                    onChange={(e) => setStatus(e.target.value as 'Ativo' | 'Férias' | 'Inativo')}
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

              {/* Combobox Forma de Remuneração */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3">
                <div>
                  <label className="block text-blue-950 mb-1 font-bold">
                    Forma de Remuneração (Salário, Hora Trabalhada ou Comissão) *
                  </label>
                  <select
                    value={remunerationType}
                    onChange={(e) => setRemunerationType(e.target.value as EmployeeRemunerationType)}
                    className="w-full p-2 bg-white border border-blue-300 rounded-lg font-semibold text-slate-900"
                  >
                    {REMUNERATION_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {remCfg.usesSalary && (
                    <div>
                      <label className="block text-slate-700 mb-1 font-medium">Salário Base (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={baseSalary}
                        onChange={(e) => setBaseSalary(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                      />
                    </div>
                  )}

                  {remCfg.usesHourly && (
                    <>
                      <div>
                        <label className="block text-slate-700 mb-1 font-medium">Valor da Hora (R$/h) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 mb-1 font-medium">Horas Trabalhadas/Mês *</label>
                        <input
                          type="number"
                          step="1"
                          required
                          value={monthlyHoursWorked}
                          onChange={(e) => setMonthlyHoursWorked(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">Encargos / Benefícios (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={benefitsCharges}
                      onChange={(e) => setBenefitsCharges(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>

                  {remCfg.usesCommission && (
                    <div>
                      <label className="block text-slate-700 mb-1 font-medium">Comissão (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-blue-600"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-blue-200/70 flex flex-wrap items-center justify-between gap-2 text-[11px] text-blue-900">
                  <span>Custo fixo mensal sincronizado no Financeiro:</span>
                  <strong className="font-mono text-xs">
                    {formatBRL(calculatedNominalPreview + Number(benefitsCharges || 0))}
                    {remCfg.usesCommission ? ` + ${commissionRate}% comissão` : ''}
                  </strong>
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
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailEmployee && (() => {
        const assignedVeh = vehicles.find(v => v.id === detailEmployee.assignedVehicleId);
        const remType = getEmployeeRemunerationType(detailEmployee);
        const nominalPay = computeEmployeeNominalPay(detailEmployee);
        const totalStaffCost = computeEmployeeMonthlyFixedCost(detailEmployee);
        return (
          <RecordDetailModal
            isOpen={true}
            onClose={() => setDetailEmployee(null)}
            title={detailEmployee.name}
            subtitle={`${detailEmployee.role} · Admissão: ${formatDateBR(detailEmployee.admissionDate)}`}
            statusText={detailEmployee.status}
            statusClassName={detailEmployee.status === 'Ativo' ? 'text-emerald-700' : 'text-slate-600'}
            sections={[
              {
                heading: 'Contato & Alocação',
                fields: [
                  { label: 'Telefone / WhatsApp', value: detailEmployee.phone || '—' },
                  { label: 'E-mail', value: detailEmployee.email || '—' },
                  { label: 'Veículo Atribuído', value: assignedVeh ? `${assignedVeh.model} (${assignedVeh.plate})` : 'Nenhum veículo fixo', fullWidth: true }
                ]
              },
              {
                heading: 'Remuneração & Encargos',
                fields: [
                  { label: 'Modelo de Remuneração', value: REMUNERATION_TYPE_LABELS[remType] },
                  { label: 'Base Mensal Calculada', value: formatBRL(nominalPay) },
                  ...(remType === 'hora_trabalhada' || remType === 'hora_comissao'
                    ? [{ label: 'Horas × Valor/h', value: `${detailEmployee.monthlyHoursWorked || 0}h × ${formatBRL(detailEmployee.hourlyRate || 0)}` }]
                    : []),
                  { label: 'Encargos / Provisões', value: formatBRL(detailEmployee.benefitsCharges) },
                  { label: 'Custo Total Mensal', value: formatBRL(totalStaffCost) },
                  { label: 'Comissão', value: `${detailEmployee.commissionRate}%` }
                ]
              }
            ]}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => {
                    const target = detailEmployee;
                    setDetailEmployee(null);
                    handleOpenEdit(target);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Funcionário</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Excluir o funcionário ${detailEmployee.name}?`)) {
                      deleteEmployee(detailEmployee.id);
                      setDetailEmployee(null);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </>
            }
          />
        );
      })()}

      {tooltipElement}
    </div>
  );
};
