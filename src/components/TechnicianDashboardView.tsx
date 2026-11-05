import React, { useState, useMemo } from 'react';
import { 
  HardHat, 
  ClipboardList, 
  Calendar, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Car, 
  DollarSign, 
  ExternalLink, 
  PenTool, 
  CheckSquare, 
  ChevronRight, 
  Search, 
  Filter, 
  Check, 
  User, 
  Wrench,
  Navigation,
  MessageCircle,
  FileText,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../context/AppContext';
import { ActiveTab } from './Sidebar';
import { ServiceOrder, ServiceOrderStatus } from '../types';
import { getTechnicianEmployeeId } from '../security/rbac';

interface TechnicianDashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const TechnicianDashboardView: React.FC<TechnicianDashboardViewProps> = ({ onNavigate }) => {
  const { 
    serviceOrders, 
    employees, 
    vehicles, 
    clients, 
    currentUser, 
    updateServiceOrder 
  } = useApp();

  // Encontrar técnicos na lista de funcionários
  const technicianEmployees = useMemo(() => {
    const list = employees.filter(e => 
      e.role.toLowerCase().includes('técnico') || 
      e.role.toLowerCase().includes('tecnico') || 
      e.role.toLowerCase().includes('campo') ||
      e.role.toLowerCase().includes('instalador')
    );
    return list.length > 0 ? list : employees;
  }, [employees]);

  // ISOLAMENTO MULTI-TENANCY & RBAC ESTRETO PARA TÉCNICO:
  // Se o usuário logado for técnico, ele tem acesso ESTRITO apenas à sua própria escala (Worker ID).
  // Administradores e gestores podem alternar para auditar ou gerenciar escalas.
  const isRealTechSession = currentUser?.role === 'tecnico';
  const authenticatedTechId = getTechnicianEmployeeId(currentUser);

  // Seletor de técnico ativo (padrão: o usuário logado ou o primeiro técnico Carlos Silva)
  const [adminSimulatedTechId, setAdminSimulatedTechId] = useState<string>(() => {
    if (currentUser?.name) {
      const match = technicianEmployees.find(e => 
        e.name.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        currentUser.name.toLowerCase().includes(e.name.toLowerCase())
      );
      if (match) return match.id;
    }
    return technicianEmployees[0]?.id || employees[0]?.id || 'emp-1';
  });

  const effectiveTechId = isRealTechSession 
    ? (authenticatedTechId || 'emp-1')
    : adminSimulatedTechId;

  const activeTechnician = employees.find(e => e.id === effectiveTechId) || technicianEmployees[0];

  // Filtros
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendentes' | 'em_andamento' | 'concluidos'>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Ordens de serviço do técnico selecionado (isolamento estrito)
  const techOrders = useMemo(() => {
    return serviceOrders.filter(os => os.employeeId === effectiveTechId);
  }, [serviceOrders, effectiveTechId]);

  // Veículo alocado ao técnico
  const techVehicle = vehicles.find(v => v.assignedEmployeeId === effectiveTechId || v.id === techOrders[0]?.vehicleId);

  // Remuneração e Diárias calculadas
  // Percentual de comissão do técnico (ex: 8% contratual)
  const commissionRate = (activeTechnician?.commissionRate || 8) / 100;
  // Diária base por atendimento / visita realizada (R$ 80,00 por visita técnica executada)
  const dailyFeeRate = 80;

  // Separação por status
  const pendingOrders = techOrders.filter(os => 
    os.status === 'aprovada_em_andamento' || 
    os.status === 'orcamento_aberto' || 
    os.status === 'aguardando_aprovacao' || 
    os.status === 'aguardando_pecas'
  );

  const completedOrders = techOrders.filter(os => 
    os.status === 'entregue_finalizada' || 
    os.status === 'concluida_aguardando_retirada'
  );

  // Valores a receber dos serviços concluídos
  const completedEarnings = useMemo(() => {
    let commission = 0;
    let dailyFees = 0;

    completedOrders.forEach(os => {
      const srvTotal = os.services.reduce((acc, s) => acc + Number(s.price || 0), 0);
      commission += (srvTotal * commissionRate);
      if (Number(os.visitFee || 0) > 0 || os.kmDriven > 0) {
        dailyFees += dailyFeeRate;
      }
    });

    return {
      commission,
      dailyFees,
      total: commission + dailyFees
    };
  }, [completedOrders, commissionRate, dailyFeeRate]);

  // Previsão de valores a receber dos serviços pendentes
  const pendingEarnings = useMemo(() => {
    let commission = 0;
    let dailyFees = 0;

    pendingOrders.forEach(os => {
      const srvTotal = os.services.reduce((acc, s) => acc + Number(s.price || 0), 0);
      commission += (srvTotal * commissionRate);
      if (Number(os.visitFee || 0) > 0 || os.kmDriven > 0) {
        dailyFees += dailyFeeRate;
      }
    });

    return {
      commission,
      dailyFees,
      total: commission + dailyFees
    };
  }, [pendingOrders, commissionRate, dailyFeeRate]);

  // Filtragem dos serviços na lista
  const filteredTechOrders = useMemo(() => {
    return techOrders.filter(os => {
      const matchesSearch = 
        os.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        os.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        os.clientAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (os.equipmentType && os.equipmentType.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesStatus = true;
      if (statusFilter === 'pendentes') {
        matchesStatus = os.status === 'orcamento_aberto' || os.status === 'aguardando_aprovacao' || os.status === 'aguardando_pecas';
      } else if (statusFilter === 'em_andamento') {
        matchesStatus = os.status === 'aprovada_em_andamento';
      } else if (statusFilter === 'concluidos') {
        matchesStatus = os.status === 'concluida_aguardando_retirada' || os.status === 'entregue_finalizada';
      }

      return matchesSearch && matchesStatus;
    });
  }, [techOrders, searchTerm, statusFilter]);

  // Mudança rápida de status pelo técnico com validação de autorização (Anti-IDOR)
  const handleStartService = (orderId: string) => {
    const target = serviceOrders.find(o => o.id === orderId);
    if (!target) return;
    if (isRealTechSession && target.employeeId !== effectiveTechId) {
      alert('Acesso negado: Você não pode alterar uma ordem de serviço que não foi atribuída a você.');
      return;
    }
    updateServiceOrder(orderId, { status: 'aprovada_em_andamento' });
  };

  const handleFinishService = (orderId: string) => {
    const target = serviceOrders.find(o => o.id === orderId);
    if (!target) return;
    if (isRealTechSession && target.employeeId !== effectiveTechId) {
      alert('Acesso negado: Você não pode alterar uma ordem de serviço que não foi atribuída a você.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    updateServiceOrder(orderId, { 
      status: 'concluida_aguardando_retirada',
      completionDate: today
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Exclusivo do Técnico */}
      <div className="bg-gradient-to-r from-slate-900 via-[#363739] to-slate-800 rounded-2xl p-6 text-white shadow-md border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
              <HardHat className="w-3.5 h-3.5" />
              Área Operacional do Técnico
            </span>
            <span className="text-xs text-slate-300">Escala de Campo & Remuneração</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white mt-2 flex items-center gap-2.5">
            <span>Minha Escala de Serviços & Diárias</span>
          </h1>

          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Acompanhe exclusivamente os atendimentos técnicos alocados a você, endereços para rota, diagnósticos a executar e o extrato dos seus valores a receber por diárias e serviços concluídos.
          </p>
        </div>

        {/* Identificação de Técnico / Prevenção IDOR */}
        {isRealTechSession ? (
          <div className="bg-amber-500/20 p-3.5 rounded-xl border border-amber-400/40 shrink-0 space-y-1.5 backdrop-blur-xs min-w-[270px]">
            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Sessão de Campo Autenticada</span>
            </div>
            <p className="text-sm font-bold text-white truncate">{activeTechnician?.name || 'Técnico de Campo'}</p>
            <p className="text-[11px] text-amber-200/90 font-mono">Matrícula: {effectiveTechId} · {activeTechnician?.role}</p>
            {techVehicle && (
              <div className="text-[10px] text-amber-200 flex items-center gap-1 pt-1 border-t border-amber-400/20 mt-1">
                <Car className="w-3.5 h-3.5 text-amber-300" />
                <span>Veículo: {techVehicle.model} ({techVehicle.plate})</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/10 p-3.5 rounded-xl border border-white/20 shrink-0 space-y-1.5 backdrop-blur-xs min-w-[260px]">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Auditoria / Admin:
              </label>
              <span className="text-[10px] text-amber-200 bg-amber-500/20 px-1.5 py-0.5 rounded font-mono">Simulação</span>
            </div>
            <select
              value={effectiveTechId}
              onChange={(e) => setAdminSimulatedTechId(e.target.value)}
              className="w-full text-xs font-bold text-slate-900 bg-white rounded-lg p-2 cursor-pointer shadow-xs focus:ring-2 focus:ring-amber-500"
            >
              {technicianEmployees.length === 0 ? (
                <option value="">Nenhum técnico cadastrado na equipe</option>
              ) : (
                technicianEmployees.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.role})
                  </option>
                ))
              )}
            </select>
            {techVehicle && (
              <div className="text-[10px] text-slate-300 flex items-center gap-1 pt-1">
                <Car className="w-3 h-3 text-amber-400" />
                <span>Veículo: {techVehicle.model} ({techVehicle.plate})</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cards de Resumo Operacional e Remuneração do Técnico (SEM financeiro da empresa) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Serviços a Realizar */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Serviços a Realizar</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {pendingOrders.length}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            {pendingOrders.filter(o => o.status === 'aprovada_em_andamento').length} em andamento hoje
          </div>
        </div>

        {/* 2. Serviços Concluídos */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Serviços Concluídos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {completedOrders.length}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            Total finalizado no mês
          </div>
        </div>

        {/* 3. Diárias de Campo a Receber */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Diárias / Taxas de Visita</span>
            <Car className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-700 mt-2">
            {formatBRL(completedEarnings.dailyFees)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            +{formatBRL(pendingEarnings.dailyFees)} previsto a realizar
          </div>
        </div>

        {/* 4. Total a Receber do Técnico */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-bold uppercase tracking-wider">Total a Receber</span>
            <DollarSign className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-800 mt-2">
            {formatBRL(completedEarnings.total)}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Comissão ({activeTechnician?.commissionRate || 8}%) + Diárias executadas
          </div>
        </div>
      </div>

      {/* Controles de Filtro e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por código da OS, cliente, endereço ou equipamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-700 font-sans"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'todos', label: `Todos (${techOrders.length})` },
            { id: 'pendentes', label: `Pendentes (${pendingOrders.length})` },
            { id: 'em_andamento', label: 'Em Andamento' },
            { id: 'concluidos', label: `Concluídos (${completedOrders.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id 
                  ? 'bg-slate-900 text-white font-semibold shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listagem dos Serviços do Técnico */}
      <div className="space-y-4">
        {filteredTechOrders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400 text-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600">Nenhum serviço encontrado para este filtro.</p>
            <p>Seus atendimentos técnicos atribuídos aparecerão listados aqui.</p>
          </div>
        ) : (
          filteredTechOrders.map(os => {
            const clientObj = clients.find(c => c.id === os.clientId);
            const srvTotal = os.services.reduce((acc, s) => acc + Number(s.price || 0), 0);
            const myCommission = srvTotal * commissionRate;
            const myDaily = Number(os.visitFee || 0) > 0 || os.kmDriven > 0 ? dailyFeeRate : 0;
            const myTotalEarnings = myCommission + myDaily;

            const isDone = os.status === 'entregue_finalizada' || os.status === 'concluida_aguardando_retirada';
            const cleanPhone = os.clientPhone.replace(/\D/g, '');

            const whatsappMessage = encodeURIComponent(
              `Olá ${os.clientName}! Aqui é ${activeTechnician?.name}, técnico responsável pela sua Ordem de Serviço ${os.code}. Estou a caminho do endereço para o atendimento.`
            );

            return (
              <div 
                key={os.id} 
                className={`bg-white rounded-xl border p-5 shadow-xs transition-all space-y-4 ${
                  isDone ? 'border-slate-200 bg-slate-50/40' : 'border-amber-200 ring-1 ring-amber-100'
                }`}
              >
                {/* Header do Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-base text-blue-600">
                      {os.code}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isDone 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : os.status === 'aprovada_em_andamento'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {os.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-500 font-mono hidden md:inline">
                      Previsão: {formatDateBR(os.forecastDate)}
                    </span>
                  </div>

                  {/* Remuneração a receber por este serviço */}
                  <div className="bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Sua Remuneração:
                    </span>
                    <span className="font-mono font-black text-sm text-emerald-800">
                      {formatBRL(myTotalEarnings)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">
                      ({formatBRL(myDaily)} diária + {formatBRL(myCommission)} comissão)
                    </span>
                  </div>
                </div>

                {/* Dados do Cliente e Localização para Rota */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{os.clientName}</span>
                    </div>

                    <div className="text-slate-600 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span>{os.clientAddress}</span>
                        <div className="mt-1 flex items-center gap-2">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(os.clientAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>Abrir GPS / Rotas</span>
                          </a>

                          {cleanPhone && (
                            <a
                              href={`https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${whatsappMessage}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>Avisar no WhatsApp</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Equipamento & Defeito */}
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-500 font-medium">Equipamento: </span>
                      <span className="font-bold text-slate-800">
                        {os.equipmentType || 'Equipamento / Tanque Solar'} {os.equipmentModel ? `(${os.equipmentModel})` : ''}
                      </span>
                    </div>
                    {os.equipmentSerial && (
                      <div className="font-mono text-[11px] text-slate-600">
                        S/N: <span className="font-bold text-slate-900">{os.equipmentSerial}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500 font-medium">Defeito relatado: </span>
                      <span className="text-slate-700">{os.description}</span>
                    </div>
                  </div>
                </div>

                {/* Serviços a Executar */}
                <div className="text-xs pt-1 border-t border-slate-100">
                  <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-slate-500" />
                    <span>Serviços Mapeados para Execução:</span>
                  </div>
                  <ul className="list-disc pl-5 text-slate-600 space-y-0.5">
                    {os.services.map(s => (
                      <li key={s.id}>
                        <span className="font-medium text-slate-800">{s.name}</span>
                        {s.hours && <span className="text-slate-400"> ({s.hours}h estimadas)</span>}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Barra de Ações Rápidas do Técnico */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    {os.status !== 'aprovada_em_andamento' && !isDone && (
                      <button
                        onClick={() => handleStartService(os.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Iniciar Atendimento</span>
                      </button>
                    )}

                    {!isDone ? (
                      <button
                        onClick={() => handleFinishService(os.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Concluir Serviço</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        <Check className="w-3.5 h-3.5" />
                        Atendimento Concluído
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onNavigate('orders')}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                  >
                    <span>Ver detalhes completos da OS</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
