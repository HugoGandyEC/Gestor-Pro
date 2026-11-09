import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  Wrench, 
  Briefcase, 
  Truck, 
  ExternalLink, 
  Filter, 
  Search, 
  AlertCircle, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays, 
  Sparkles, 
  RotateCcw, 
  Lock, 
  ShieldCheck, 
  X, 
  Eye, 
  FileText,
  Building,
  UserCheck,
  MessageSquare,
  Phone
} from 'lucide-react';
import { useApp, formatDateBR } from '../context/AppContext';
import { CompanyAppointment, AppointmentType, AppointmentStatus } from '../types';
import { WhatsAppModal } from './WhatsAppModal';
import { 
  googleSignIn, 
  logoutGoogle, 
  initAuth, 
  getAccessToken 
} from '../services/googleAuthService';
import { 
  createGoogleCalendarEvent, 
  updateGoogleCalendarEvent, 
  deleteGoogleCalendarEvent,
  listGoogleCalendarEvents
} from '../services/googleCalendarService';
import { User as FirebaseUser } from 'firebase/auth';

export const GoogleCalendarView: React.FC = () => {
  const { 
    appointments, 
    addAppointment, 
    updateAppointment, 
    deleteAppointment, 
    clearSampleAppointments, 
    restoreSampleAppointments,
    clients,
    serviceOrders,
    employees,
    currentUser
  } = useApp();

  // Google Authentication State
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // View & Filtering State
  const [viewMode, setViewMode] = useState<'cards' | 'month' | 'week'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<CompanyAppointment | null>(null);
  const [deletingAppointment, setDeletingAppointment] = useState<CompanyAppointment | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [viewDetailsAppointment, setViewDetailsAppointment] = useState<CompanyAppointment | null>(null);

  // WhatsApp Message Modal State
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    isOpen: boolean;
    phone: string;
    clientName: string;
    variables: Record<string, string | number | undefined>;
  }>({
    isOpen: false,
    phone: '',
    clientName: '',
    variables: {}
  });

  const handleOpenWhatsAppForAppointment = (apt: CompanyAppointment) => {
    const client = clients.find(c => c.id === apt.clientId);
    setWhatsAppModalData({
      isOpen: true,
      phone: client?.phone || '',
      clientName: apt.clientName || client?.name || 'Cliente',
      variables: {
        data_visita: formatDateBR(apt.startDate),
        hora_visita: apt.startTime,
        tipo_visita: apt.type === 'visita_tecnica' ? 'Visita Técnica' : apt.type === 'servico' ? 'Serviço Especializado' : 'Atendimento da Empresa',
        tecnico: apt.employeeName || 'Equipe Técnica MP Piscinas',
        endereco: apt.location || 'Local informado no agendamento',
        numero_os: apt.serviceOrderCode || 'Agendamento Direto',
        equipamento_servico: apt.title
      }
    });
  };

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'visita_tecnica' as AppointmentType,
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '10:30',
    clientId: '',
    clientName: '',
    serviceOrderId: '',
    serviceOrderCode: '',
    employeeId: '',
    employeeName: '',
    location: '',
    status: 'agendado' as AppointmentStatus,
    syncWithGoogle: true
  });

  // Check auth state on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setAuthError(null);
      const res = await googleSignIn();
      if (res?.user) {
        setGoogleUser(res.user);
        setSyncFeedback({
          type: 'success',
          message: `Conectado com sucesso à conta Google: ${res.user.email}`
        });
      }
    } catch (err: any) {
      console.error('Erro ao conectar Google Agenda:', err);
      setAuthError(err?.message || 'Falha na autenticação do Google Calendar.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handle Google Sign Out
  const handleGoogleSignOut = async () => {
    try {
      setIsGoogleLoading(true);
      await logoutGoogle();
      setGoogleUser(null);
      setSyncFeedback({
        type: 'info',
        message: 'Desconectado da conta Google Workspace.'
      });
    } catch (err: any) {
      console.error('Erro ao desconectar:', err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = (presetDate?: string) => {
    setEditingAppointment(null);
    setFormData({
      title: '',
      type: 'visita_tecnica',
      description: '',
      startDate: presetDate || new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endDate: presetDate || new Date().toISOString().split('T')[0],
      endTime: '10:30',
      clientId: '',
      clientName: '',
      serviceOrderId: '',
      serviceOrderCode: '',
      employeeId: currentUser?.employeeId || (employees[0]?.id || ''),
      employeeName: employees.find(e => e.id === currentUser?.employeeId)?.name || (employees[0]?.name || ''),
      location: '',
      status: 'agendado',
      syncWithGoogle: Boolean(googleUser)
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (apt: CompanyAppointment) => {
    setEditingAppointment(apt);
    setFormData({
      title: apt.title,
      type: apt.type,
      description: apt.description || '',
      startDate: apt.startDate,
      startTime: apt.startTime,
      endDate: apt.endDate || apt.startDate,
      endTime: apt.endTime,
      clientId: apt.clientId || '',
      clientName: apt.clientName || '',
      serviceOrderId: apt.serviceOrderId || '',
      serviceOrderCode: apt.serviceOrderCode || '',
      employeeId: apt.employeeId || '',
      employeeName: apt.employeeName || '',
      location: apt.location || '',
      status: apt.status,
      syncWithGoogle: Boolean(apt.isSyncedWithGoogle || apt.googleCalendarEventId)
    });
    setIsCreateModalOpen(true);
  };

  // Auto-fill from Client selection
  const handleSelectClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      const addr = [client.street, client.number, client.neighborhood, client.city, client.state]
        .filter(Boolean)
        .join(', ');
      setFormData(prev => ({
        ...prev,
        clientId: client.id,
        clientName: client.name,
        location: addr || prev.location
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        clientId: '',
        clientName: ''
      }));
    }
  };

  // Auto-fill from Service Order selection
  const handleSelectServiceOrder = (orderId: string) => {
    const order = serviceOrders.find(o => o.id === orderId);
    if (order) {
      const emp = employees.find(e => e.id === order.employeeId);
      setFormData(prev => ({
        ...prev,
        serviceOrderId: order.id,
        serviceOrderCode: order.code,
        clientId: order.clientId,
        clientName: order.clientName,
        location: order.clientAddress || prev.location,
        employeeId: order.employeeId || prev.employeeId,
        employeeName: emp?.name || prev.employeeName,
        title: prev.title || `OS ${order.code}: ${order.description.slice(0, 45)}...`
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        serviceOrderId: '',
        serviceOrderCode: ''
      }));
    }
  };

  // Save Appointment Form (Create / Edit)
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Informe o título do agendamento.');
      return;
    }

    let googleCalendarEventId = editingAppointment?.googleCalendarEventId;
    let googleCalendarHtmlLink = editingAppointment?.googleCalendarHtmlLink;
    let isSyncedWithGoogle = editingAppointment?.isSyncedWithGoogle || false;

    // Sincronizar com Google Calendar se conectado
    if (formData.syncWithGoogle && googleUser) {
      try {
        const appointmentPayload: CompanyAppointment = {
          id: editingAppointment?.id || 'temp',
          title: formData.title,
          type: formData.type,
          description: formData.description,
          startDate: formData.startDate,
          startTime: formData.startTime,
          endDate: formData.endDate,
          endTime: formData.endTime,
          clientId: formData.clientId,
          clientName: formData.clientName,
          serviceOrderId: formData.serviceOrderId,
          serviceOrderCode: formData.serviceOrderCode,
          employeeId: formData.employeeId,
          employeeName: formData.employeeName,
          location: formData.location,
          status: formData.status,
          createdAt: editingAppointment?.createdAt || new Date().toISOString()
        };

        if (editingAppointment?.googleCalendarEventId) {
          const updatedEvent = await updateGoogleCalendarEvent(
            editingAppointment.googleCalendarEventId,
            appointmentPayload
          );
          googleCalendarHtmlLink = updatedEvent.htmlLink;
          isSyncedWithGoogle = true;
        } else {
          const createdEvent = await createGoogleCalendarEvent(appointmentPayload);
          googleCalendarEventId = createdEvent.id;
          googleCalendarHtmlLink = createdEvent.htmlLink;
          isSyncedWithGoogle = true;
        }
      } catch (err: any) {
        console.warn('Não foi possível sincronizar diretamente com o Google Calendar:', err);
        setSyncFeedback({
          type: 'error',
          message: `Salvo localmente, mas a sincronização com Google Agenda falhou: ${err?.message || 'Verifique permissões'}`
        });
      }
    }

    if (editingAppointment) {
      updateAppointment(editingAppointment.id, {
        title: formData.title,
        type: formData.type,
        description: formData.description,
        startDate: formData.startDate,
        startTime: formData.startTime,
        endDate: formData.endDate,
        endTime: formData.endTime,
        clientId: formData.clientId || undefined,
        clientName: formData.clientName || undefined,
        serviceOrderId: formData.serviceOrderId || undefined,
        serviceOrderCode: formData.serviceOrderCode || undefined,
        employeeId: formData.employeeId || undefined,
        employeeName: formData.employeeName || undefined,
        location: formData.location || undefined,
        status: formData.status,
        googleCalendarEventId,
        googleCalendarHtmlLink,
        isSyncedWithGoogle
      });
      setSyncFeedback({
        type: 'success',
        message: 'Agendamento atualizado com sucesso!'
      });
    } else {
      addAppointment({
        title: formData.title,
        type: formData.type,
        description: formData.description,
        startDate: formData.startDate,
        startTime: formData.startTime,
        endDate: formData.endDate,
        endTime: formData.endTime,
        clientId: formData.clientId || undefined,
        clientName: formData.clientName || undefined,
        serviceOrderId: formData.serviceOrderId || undefined,
        serviceOrderCode: formData.serviceOrderCode || undefined,
        employeeId: formData.employeeId || undefined,
        employeeName: formData.employeeName || undefined,
        location: formData.location || undefined,
        status: formData.status,
        googleCalendarEventId,
        googleCalendarHtmlLink,
        isSyncedWithGoogle,
        isSample: false
      });
      setSyncFeedback({
        type: 'success',
        message: 'Novo agendamento salvo na agenda!'
      });
    }

    setIsCreateModalOpen(false);
    setEditingAppointment(null);
  };

  // Delete Appointment with Confirmation
  const handleConfirmDelete = async () => {
    if (!deletingAppointment) return;

    if (deletingAppointment.googleCalendarEventId && googleUser) {
      try {
        await deleteGoogleCalendarEvent(deletingAppointment.googleCalendarEventId);
      } catch (err) {
        console.warn('Erro ao excluir evento remoto do Google Calendar:', err);
      }
    }

    deleteAppointment(deletingAppointment.id);
    setDeletingAppointment(null);
    setSyncFeedback({
      type: 'info',
      message: `Agendamento "${deletingAppointment.title}" excluído.`
    });
  };

  // Sync All with Google Calendar
  const handleSyncAllWithGoogle = async () => {
    if (!googleUser) {
      setSyncFeedback({
        type: 'error',
        message: 'Faça login com sua conta do Google para sincronizar os agendamentos.'
      });
      return;
    }

    try {
      setIsSyncing(true);
      setSyncFeedback(null);

      // 1. Enviar agendamentos locais não sincronizados para o Google Calendar
      let syncedCount = 0;
      for (const apt of appointments) {
        if (!apt.googleCalendarEventId) {
          try {
            const ev = await createGoogleCalendarEvent(apt);
            updateAppointment(apt.id, {
              googleCalendarEventId: ev.id,
              googleCalendarHtmlLink: ev.htmlLink,
              isSyncedWithGoogle: true
            });
            syncedCount++;
          } catch (e) {
            console.warn(`Falha ao sincronizar evento ${apt.title}:`, e);
          }
        }
      }

      // 2. Buscar eventos do Google Calendar para conferência
      const remoteEvents = await listGoogleCalendarEvents();
      
      setSyncFeedback({
        type: 'success',
        message: `Sincronização concluída com sucesso! ${syncedCount} novo(s) evento(s) enviado(s) ao Google Agenda. Total de ${remoteEvents.items.length} evento(s) na agenda remota.`
      });
    } catch (err: any) {
      console.error('Erro na sincronização:', err);
      setSyncFeedback({
        type: 'error',
        message: `Erro ao sincronizar com Google Agenda: ${err?.message || 'Falha de conexão'}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      // Type filter
      if (selectedType !== 'all' && apt.type !== selectedType) return false;
      // Status filter
      if (selectedStatus !== 'all' && apt.status !== selectedStatus) return false;
      // Employee filter
      if (selectedEmployee !== 'all' && apt.employeeId !== selectedEmployee) return false;
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const inTitle = apt.title.toLowerCase().includes(query);
        const inClient = apt.clientName?.toLowerCase().includes(query);
        const inDesc = apt.description?.toLowerCase().includes(query);
        const inLoc = apt.location?.toLowerCase().includes(query);
        const inCode = apt.serviceOrderCode?.toLowerCase().includes(query);
        if (!inTitle && !inClient && !inDesc && !inLoc && !inCode) return false;
      }
      return true;
    }).sort((a, b) => {
      const dateA = `${a.startDate}T${a.startTime}`;
      const dateB = `${b.startDate}T${b.startTime}`;
      return dateA.localeCompare(dateB);
    });
  }, [appointments, selectedType, selectedStatus, selectedEmployee, searchTerm]);

  // Sample Items Count
  const sampleItemsCount = useMemo(() => {
    return appointments.filter(a => a.isSample).length;
  }, [appointments]);

  // Format Helper for Type Badge
  const getTypeBadge = (type: AppointmentType) => {
    switch (type) {
      case 'visita_tecnica':
        return {
          label: 'Visita Técnica',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          icon: Wrench
        };
      case 'servico':
        return {
          label: 'Serviço Técnico',
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          icon: CheckCircle2
        };
      case 'compromisso':
        return {
          label: 'Compromisso da Empresa',
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          dot: 'bg-purple-500',
          icon: Briefcase
        };
      case 'entrega':
        return {
          label: 'Entrega & Instalação',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: Truck
        };
      default:
        return {
          label: 'Agendamento',
          bg: 'bg-gray-50 text-gray-800 border-gray-200',
          dot: 'bg-gray-500',
          icon: CalendarIcon
        };
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmado':
        return { label: 'Confirmado', bg: 'bg-emerald-100 text-emerald-800' };
      case 'agendado':
        return { label: 'Agendado', bg: 'bg-blue-100 text-blue-800' };
      case 'em_andamento':
        return { label: 'Em Andamento', bg: 'bg-amber-100 text-amber-800' };
      case 'concluido':
        return { label: 'Concluído', bg: 'bg-gray-100 text-gray-700' };
      case 'cancelado':
        return { label: 'Cancelado', bg: 'bg-rose-100 text-rose-800' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Integration Card */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-[#53383e] to-[#76321A] p-5 sm:p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 text-xs font-medium tracking-wide uppercase mb-2">
                <CalendarIcon className="w-3.5 h-3.5" />
                Google Agenda & Operação
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Google Agenda & Agendamentos
              </h1>
              <p className="text-white/80 text-sm mt-1 max-w-2xl">
                Controle integral de visitas técnicas de campo, serviços especializados de piscinas e aquecedores, 
                e compromissos diários da empresa integrados ao Google Agenda.
              </p>
            </div>

            {/* Google Authentication Box */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/20 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {googleUser ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 font-bold">
                    <Check className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Conectado ao Google
                      </span>
                    </div>
                    <p className="text-xs text-white/90 font-mono truncate max-w-[210px]">
                      {googleUser.email}
                    </p>
                  </div>
                  <button
                    onClick={handleGoogleSignOut}
                    disabled={isGoogleLoading}
                    className="ml-2 text-xs text-white/70 hover:text-white underline"
                    title="Desconectar conta Google"
                  >
                    Desconectar
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Conecte para sincronizar eventos na nuvem:</span>
                  </div>
                  {/* Official Google Sign-In Styled Button */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="inline-flex items-center justify-center gap-2.5 px-4 py-2 bg-white text-gray-700 text-xs font-semibold rounded-lg shadow-xs hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    {isGoogleLoading ? 'Conectando...' : 'Conectar com Google Agenda'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feedback message banner if present */}
        {syncFeedback && (
          <div className={`px-5 py-2.5 text-xs flex items-center justify-between border-b ${
            syncFeedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : syncFeedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}>
            <span className="flex items-center gap-2">
              {syncFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4" />}
              {syncFeedback.message}
            </span>
            <button 
              onClick={() => setSyncFeedback(null)} 
              className="text-gray-400 hover:text-gray-700 font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action bar and Sample Data Controls */}
        <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenCreateModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#53383e] hover:bg-[#422c31] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Agendamento
            </button>

            {googleUser && (
              <button
                onClick={handleSyncAllWithGoogle}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-lg border border-gray-300 shadow-xs transition-colors"
                title="Sincronizar agendamentos pendentes com o Google Calendar"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Google Agenda'}
              </button>
            )}

            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Abrir o Google Agenda em nova aba"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir Google Agenda
            </a>
          </div>

          {/* Sample Data Status & Direction to Configurações */}
          <div className="flex items-center gap-2">
            {sampleItemsCount > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{sampleItemsCount} agendamentos de exemplo</span>
                </span>
                <span className="text-[11px] text-gray-500 hidden md:inline">
                  (Para zerar todos os dados do sistema, acesse <strong>Configurações &gt; Gestão de Dados</strong>)
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Base de agendamentos limpa</span>
              </span>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar título, cliente, OS, local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#53383e] focus:border-transparent"
            />
          </div>

          {/* Filter Type */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#53383e]"
          >
            <option value="all">Todos os Tipos de Agendamento</option>
            <option value="visita_tecnica">🔍 Visitas Técnicas de Campo</option>
            <option value="servico">⚙️ Serviços Técnicos Especializados</option>
            <option value="compromisso">🏢 Compromissos da Empresa</option>
            <option value="entrega">🚚 Entregas & Instalações</option>
          </select>

          {/* Filter Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#53383e]"
          >
            <option value="all">Todos os Status</option>
            <option value="agendado">Agendado</option>
            <option value="confirmado">Confirmado</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>

          {/* Filter Employee */}
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#53383e]"
          >
            <option value="all">Todos os Técnicos / Responsáveis</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notice of active sample data */}
      {sampleItemsCount > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Ambiente com dados fictícios de exemplo:</strong> Existem {sampleItemsCount} compromissos e visitas de exemplo para demonstração. Você pode excluí-los a qualquer momento clicando em <strong>"Limpar Dados de Exemplo"</strong>.
            </span>
          </div>
          <button
            onClick={() => setIsClearConfirmOpen(true)}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline shrink-0 ml-3"
          >
            Limpar agora
          </button>
        </div>
      )}

      {/* Appointments List / Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span>
            Mostrando <strong>{filteredAppointments.length}</strong> compromisso(s) agendado(s)
          </span>
          <span className="text-[11px] text-gray-400">
            Ordenado cronologicamente por data e hora de início
          </span>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-700">Nenhum agendamento encontrado</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Não há compromissos cadastrados com os filtros selecionados. Crie um novo agendamento ou restaure os dados fictícios de exemplo.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => handleOpenCreateModal()}
                className="px-3.5 py-2 bg-[#53383e] text-white text-xs font-semibold rounded-lg hover:bg-[#422c31]"
              >
                + Novo Agendamento
              </button>
              <button
                onClick={() => restoreSampleAppointments()}
                className="px-3.5 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200"
              >
                Restaurar Dados Exemplo
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAppointments.map(apt => {
              const typeBadge = getTypeBadge(apt.type);
              const statusBadge = getStatusBadge(apt.status);
              const TypeIcon = typeBadge.icon;

              return (
                <div 
                  key={apt.id}
                  className={`bg-white rounded-xl border transition-all hover:shadow-md flex flex-col justify-between overflow-hidden ${
                    apt.isSample ? 'border-amber-200/90' : 'border-gray-200'
                  }`}
                >
                  <div className="p-4 space-y-3">
                    {/* Header Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${typeBadge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${typeBadge.dot}`}></span>
                        <TypeIcon className="w-3 h-3" />
                        {typeBadge.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${statusBadge.bg}`}>
                          {statusBadge.label}
                        </span>
                        {apt.isSample && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-mono px-1.5 py-0.5 rounded">
                            Exemplo
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                        {apt.title}
                      </h3>
                      {apt.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {apt.description}
                        </p>
                      )}
                    </div>

                    {/* Details: Date, Time, Client, Technician */}
                    <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50/70 p-2.5 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 font-medium text-gray-800">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>
                          {formatDateBR(apt.startDate)} às {apt.startTime}
                          {apt.endTime ? ` até ${apt.endTime}` : ''}
                        </span>
                      </div>

                      {apt.clientName && (
                        <div className="flex items-center gap-2 truncate">
                          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">Cliente: <strong>{apt.clientName}</strong></span>
                        </div>
                      )}

                      {apt.serviceOrderCode && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>OS: <span className="font-mono font-semibold">{apt.serviceOrderCode}</span></span>
                        </div>
                      )}

                      {apt.employeeName && (
                        <div className="flex items-center gap-2 truncate">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">Técnico: <strong>{apt.employeeName}</strong></span>
                        </div>
                      )}

                      {apt.location && (
                        <div className="flex items-start gap-2 pt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span className="text-[11px] text-gray-600 line-clamp-1">{apt.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="px-4 py-2.5 bg-gray-50/90 border-t border-gray-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {apt.isSyncedWithGoogle || apt.googleCalendarEventId ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Sincronizado
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">
                          Local
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* WhatsApp Notification */}
                      <button
                        onClick={() => handleOpenWhatsAppForAppointment(apt)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                        title="Enviar confirmação desta visita técnica / serviço pelo WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(apt)}
                        className="px-2.5 py-1 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-200/80 rounded transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeletingAppointment(apt)}
                        className="px-2 py-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                        title="Excluir agendamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CRIAR OU EDITAR AGENDAMENTO                                        */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200 my-8">
            <div className="bg-gradient-to-r from-[#53383e] to-[#76321A] p-4 sm:p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento na Agenda'}
                </h3>
                <p className="text-white/80 text-xs">
                  Agende visitas técnicas, manutenções especializadas ou compromissos corporativos
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="p-5 sm:p-6 space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Tipo de Agendamento *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'visita_tecnica' as AppointmentType, label: 'Visita Técnica', icon: Wrench, color: 'text-amber-600' },
                    { id: 'servico' as AppointmentType, label: 'Serviço Técnico', icon: CheckCircle2, color: 'text-blue-600' },
                    { id: 'compromisso' as AppointmentType, label: 'Compromisso', icon: Briefcase, color: 'text-purple-600' },
                    { id: 'entrega' as AppointmentType, label: 'Entrega / Instalação', icon: Truck, color: 'text-emerald-600' },
                  ].map(t => {
                    const Icon = t.icon;
                    const isSelected = formData.type === t.id;
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setFormData({ ...formData, type: t.id })}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                          isSelected 
                            ? 'border-[#53383e] bg-[#53383e]/5 text-[#53383e] shadow-xs ring-1 ring-[#53383e]' 
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mb-1 ${t.color}`} />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Título do Agendamento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Visita Técnica - Diagnóstico Aquecedor Solar Residencial"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#53383e]"
                />
              </div>

              {/* Service Order Linking (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Vincular à Ordem de Serviço (Opcional)
                  </label>
                  <select
                    value={formData.serviceOrderId}
                    onChange={(e) => handleSelectServiceOrder(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#53383e]"
                  >
                    <option value="">Nenhuma OS vinculada</option>
                    {serviceOrders.map(os => (
                      <option key={os.id} value={os.id}>
                        {os.code} - {os.clientName} ({os.description.slice(0, 30)}...)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Client Linking */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Cliente Vinculado
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => handleSelectClient(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#53383e]"
                  >
                    <option value="">Cliente avulso ou interno</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.city ? `(${c.city})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Responsible Employee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Técnico / Responsável
                  </label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => {
                      const emp = employees.find(em => em.id === e.target.value);
                      setFormData({
                        ...formData,
                        employeeId: e.target.value,
                        employeeName: emp?.name || ''
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#53383e]"
                  >
                    <option value="">Selecione o responsável</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} - {emp.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as AppointmentStatus })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#53383e]"
                  >
                    <option value="agendado">Agendado</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Date & Time fields */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Data Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      startDate: e.target.value,
                      endDate: formData.endDate < e.target.value ? e.target.value : formData.endDate 
                    })}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#53383e]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Hora Início *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#53383e]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Data Término
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#53383e]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Hora Término
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#53383e]"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Endereço / Local da Visita
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Ex: Alameda dos Jacarandás, 450 - Condomínio Quinta da Baroneza"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#53383e]"
                  />
                </div>
              </div>

              {/* Description & Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Observações e Orientações Técnicas
                </label>
                <textarea
                  rows={2}
                  placeholder="Instruções para o técnico, pontos de atenção na piscina/aquecedor, materiais necessários..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#53383e]"
                />
              </div>

              {/* Google Sync Toggle */}
              {googleUser && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-blue-50/80 border border-blue-200">
                  <input
                    type="checkbox"
                    id="syncGoogleToggle"
                    checked={formData.syncWithGoogle}
                    onChange={(e) => setFormData({ ...formData, syncWithGoogle: e.target.checked })}
                    className="w-4 h-4 text-[#53383e] rounded border-gray-300 focus:ring-[#53383e]"
                  />
                  <label htmlFor="syncGoogleToggle" className="text-xs text-blue-900 cursor-pointer">
                    <strong>Sincronizar no Google Calendar:</strong> Criar/atualizar este evento automaticamente na conta <em>{googleUser.email}</em>.
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs text-white bg-[#53383e] hover:bg-[#422c31] rounded-lg font-semibold shadow-xs"
                >
                  {editingAppointment ? 'Salvar Alterações' : 'Criar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAR EXCLUSÃO DE AGENDAMENTO (Required by skill)              */}
      {/* ========================================================================= */}
      {deletingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 border border-gray-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Excluir Agendamento?</h3>
                <p className="text-xs text-gray-500">Esta ação removerá o compromisso da agenda.</p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs space-y-1">
              <p className="font-semibold text-gray-800">{deletingAppointment.title}</p>
              <p className="text-gray-600">Data: {formatDateBR(deletingAppointment.startDate)} às {deletingAppointment.startTime}</p>
              {deletingAppointment.googleCalendarEventId && (
                <p className="text-amber-700 font-medium pt-1">
                  ⚠️ O evento correspondente no Google Calendar também será excluído.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingAppointment(null)}
                className="px-3.5 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs text-white bg-rose-600 hover:bg-rose-700 rounded-lg font-semibold"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAR LIMPAR DADOS DE EXEMPLO                                 */}
      {/* ========================================================================= */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 border border-gray-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Limpar Dados de Exemplo?</h3>
                <p className="text-xs text-gray-500">Limpeza dos dados demonstrativos da agenda</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Você deseja remover todos os <strong>{sampleItemsCount} agendamentos fictícios de exemplo</strong>? 
              Seus agendamentos reais criados manualmente não serão alterados. Você poderá restaurar os exemplos futuramente a qualquer momento.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-3.5 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  clearSampleAppointments();
                  setIsClearConfirmOpen(false);
                  setSyncFeedback({
                    type: 'success',
                    message: 'Dados fictícios de exemplo foram limpos com sucesso.'
                  });
                }}
                className="px-4 py-1.5 text-xs text-white bg-rose-600 hover:bg-rose-700 rounded-lg font-semibold"
              >
                Sim, Limpar Exemplos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESTAURAR DADOS DE EXEMPLO                                        */}
      {/* ========================================================================= */}
      {isRestoreConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 border border-gray-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-700">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Restaurar Exemplos Fictícios?</h3>
                <p className="text-xs text-gray-500">Recarregar dados de demonstração</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Deseja recarregar a lista com os 7 agendamentos fictícios de visitas técnicas, serviços de bomba/solar e reuniões da empresa?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRestoreConfirmOpen(false)}
                className="px-3.5 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  restoreSampleAppointments();
                  setIsRestoreConfirmOpen(false);
                  setSyncFeedback({
                    type: 'success',
                    message: 'Dados fictícios de exemplo recarregados na agenda!'
                  });
                }}
                className="px-4 py-1.5 text-xs text-white bg-[#53383e] hover:bg-[#422c31] rounded-lg font-semibold"
              >
                Restaurar Exemplos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Message Modal */}
      <WhatsAppModal
        isOpen={whatsAppModalData.isOpen}
        onClose={() => setWhatsAppModalData(prev => ({ ...prev, isOpen: false }))}
        recipientPhone={whatsAppModalData.phone}
        recipientName={whatsAppModalData.clientName}
        defaultTemplateId="visita_agendada"
        contextVariables={whatsAppModalData.variables}
      />
    </div>
  );
};
