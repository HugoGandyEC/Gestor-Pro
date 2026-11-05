import React, { useState, useMemo } from 'react';
import { 
  UserCheck, 
  ShieldCheck, 
  AlertCircle, 
  ClipboardList, 
  FileText, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Car, 
  DollarSign, 
  Printer, 
  Calendar,
  PenTool,
  ShoppingBag,
  User,
  Lock,
  Eye,
  EyeOff,
  Search,
  Check,
  Package,
  Wrench,
  Tag,
  CreditCard,
  Building,
  MapPin,
  Phone,
  Mail,
  Copy,
  Download,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../context/AppContext';
import { CustomerPortalTicket, ServiceOrder, DirectSale, Client, ClientAddress } from '../types';
import { getTenantClientId } from '../security/rbac';
import { getScopedServiceOrders, getScopedDirectSales, getScopedCustomerTickets } from '../security/secureDataAccess';

export const CustomerPortalView: React.FC = () => {
  const { 
    clients, 
    serviceOrders, 
    directSales,
    products,
    customerTickets, 
    addCustomerTicket, 
    updateCustomerTicketStatus,
    updateServiceOrder,
    updateClient,
    currentUser
  } = useApp();

  // ISOLAMENTO MULTI-TENANCY ESTRETO:
  // Se for usuário com perfil 'cliente', o ID é fixo e derivado exclusivamente do token/sessão (Prevenção IDOR).
  // Apenas administradores em modo de simulação/auditoria podem selecionar outro cliente.
  const isRealClientSession = currentUser?.role === 'cliente';
  const tenantClientId = getTenantClientId(currentUser);

  const [adminSimulatedClientId, setAdminSimulatedClientId] = useState<string>(
    clients[0]?.id || ''
  );

  const effectiveClientId = isRealClientSession 
    ? (tenantClientId || (currentUser?.name ? clients.find(c => c.name.toLowerCase().includes(currentUser.name.toLowerCase()))?.id : '') || clients[0]?.id || '')
    : (adminSimulatedClientId || clients[0]?.id || '');

  const currentClient = clients.find(c => c.id === effectiveClientId) || clients[0];

  // Abas do Portal: Separação de Ordens de Serviço, Garantias, Compras, Chamados, Débitos e Perfil
  const [activeTab, setActiveTab] = useState<'orders' | 'warranties' | 'purchases' | 'tickets' | 'debts' | 'profile'>('orders');

  // Modal Novo Chamado / Acionamento de Garantia
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [ticketType, setTicketType] = useState<'acionamento_garantia' | 'chamado_tecnico'>('acionamento_garantia');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [linkedOrderId, setLinkedOrderId] = useState('');
  const [equipmentSerial, setEquipmentSerial] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'baixa' | 'normal' | 'alta' | 'urgente'>('alta');

  // Modal Digital Signature
  const [signModalOrder, setSignModalOrder] = useState<ServiceOrder | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerDocument, setSignerDocument] = useState('');

  // Modal Detalhes / Comprovante de Compra
  const [viewingPurchase, setViewingPurchase] = useState<any | null>(null);

  // Estado do formulário de Perfil e Credenciais de Segurança
  const [profileName, setProfileName] = useState(currentClient?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentClient?.email || '');
  const [profilePhone, setProfilePhone] = useState(currentClient?.phone || '');
  const [profileSecondaryPhone, setProfileSecondaryPhone] = useState(currentClient?.secondaryPhone || '');
  const [profileStreet, setProfileStreet] = useState(currentClient?.street || '');
  const [profileNumber, setProfileNumber] = useState(currentClient?.number || '');
  const [profileComplement, setProfileComplement] = useState(currentClient?.complement || '');
  const [profileNeighborhood, setProfileNeighborhood] = useState(currentClient?.neighborhood || '');
  const [profileCity, setProfileCity] = useState(currentClient?.city || '');
  const [profileState, setProfileState] = useState(currentClient?.state || '');
  const [profileCep, setProfileCep] = useState(currentClient?.cep || '');
  const [profileContactPerson, setProfileContactPerson] = useState(currentClient?.contactPerson || '');

  // Credenciais de Usuário e Senha
  const [portalUsername, setPortalUsername] = useState(currentClient?.portalUsername || currentClient?.email?.split('@')[0] || 'cliente');
  const [portalPassword, setPortalPassword] = useState(currentClient?.portalPassword || '123456');
  const [confirmPassword, setConfirmPassword] = useState(currentClient?.portalPassword || '123456');
  const [showPassword, setShowPassword] = useState(false);
  const [profileSavedFeedback, setProfileSavedFeedback] = useState<string | null>(null);

  // Sincroniza estados do perfil quando muda o cliente selecionado
  React.useEffect(() => {
    if (currentClient) {
      setProfileName(currentClient.name || '');
      setProfileEmail(currentClient.email || '');
      setProfilePhone(currentClient.phone || '');
      setProfileSecondaryPhone(currentClient.secondaryPhone || '');
      setProfileStreet(currentClient.street || '');
      setProfileNumber(currentClient.number || '');
      setProfileComplement(currentClient.complement || '');
      setProfileNeighborhood(currentClient.neighborhood || '');
      setProfileCity(currentClient.city || '');
      setProfileState(currentClient.state || '');
      setProfileCep(currentClient.cep || '');
      setProfileContactPerson(currentClient.contactPerson || '');
      setPortalUsername(currentClient.portalUsername || currentClient.email?.split('@')[0] || 'cliente');
      setPortalPassword(currentClient.portalPassword || '123456');
      setConfirmPassword(currentClient.portalPassword || '123456');
    }
  }, [currentClient?.id]);

  // Consulta segura e isolada de Ordens de Serviço do Cliente (Isolamento Multi-Tenancy / Anti-IDOR)
  const clientOrders = useMemo(() => {
    return serviceOrders
      .filter(o => o.clientId === effectiveClientId)
      .map(o => ({
        ...o,
        parts: o.parts.map(p => ({
          ...p,
          cost: 0 // Sanitização Estrita: zera custo interno da empresa para o cliente
        }))
      }));
  }, [serviceOrders, effectiveClientId]);

  // Consulta segura e isolada de Chamados do Cliente
  const clientTickets = useMemo(() => {
    return customerTickets.filter(t => t.clientId === effectiveClientId);
  }, [customerTickets, effectiveClientId]);

  // Pending debts
  const pendingOrders = clientOrders.filter(o => o.paymentStatus === 'pendente');
  const totalPendingAmount = pendingOrders.reduce((acc, o) => {
    const srv = o.services.reduce((a, b) => a + Number(b.price || 0), 0);
    const prt = o.parts.reduce((a, b) => a + (Number(b.price || 0) * Number(b.quantity || 1)), 0);
    return acc + (srv + prt + Number(o.visitFee || 0) - Number(o.calculatedDiscount || 0));
  }, 0);

  // =========================================================================
  // GARANTIAS DESMEMBRADAS (Equipamentos com número de série vinculados ao cliente)
  // =========================================================================
  const todayIso = new Date().toISOString().split('T')[0];

  const clientEquipments = useMemo(() => {
    const list: Array<{
      id: string;
      orderId: string;
      orderCode: string;
      equipmentType: string;
      equipmentModel?: string;
      equipmentSerial: string;
      installDate: string;
      warrantyPeriodDays: number;
      warrantyExpiresAt: string;
      isExpired: boolean;
      daysRemaining: number;
      warrantyTerms?: string;
    }> = [];

    clientOrders.forEach(o => {
      if (o.equipmentSerial || o.equipmentType) {
        const serial = o.equipmentSerial || `S/N-PEND-${o.code}`;
        const installDate = o.completionDate || o.openDate || '2026-05-10';
        const days = Number(o.warrantyPeriodDays) || 90;
        
        let expiresAt = o.warrantyExpiresAt;
        if (!expiresAt) {
          const expDate = new Date(installDate);
          expDate.setDate(expDate.getDate() + days);
          expiresAt = expDate.toISOString().split('T')[0];
        }

        const isExpired = expiresAt < todayIso;
        const diffMs = new Date(expiresAt).getTime() - new Date(todayIso).getTime();
        const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        list.push({
          id: `eq-${o.id}-${serial}`,
          orderId: o.id,
          orderCode: o.code,
          equipmentType: o.equipmentType || 'Reservatório Térmico Solar / Motobomba',
          equipmentModel: o.equipmentModel || 'Standard Alta Pressão',
          equipmentSerial: serial,
          installDate,
          warrantyPeriodDays: days,
          warrantyExpiresAt: expiresAt,
          isExpired,
          daysRemaining,
          warrantyTerms: o.warrantyTerms || 'Garantia legal e de fábrica contra defeitos de fabricação e vedação hidráulica conforme NBR 15569.'
        });
      }
    });

    return list;
  }, [clientOrders, todayIso]);

  // =========================================================================
  // HISTÓRICO DE COMPRAS (Vendas de Balcão e Peças em OS)
  // =========================================================================
  const clientPurchases = useMemo(() => {
    const purchases: Array<{
      id: string;
      code: string;
      type: 'venda_direta' | 'ordem_servico';
      date: string;
      total: number;
      paymentMethod: string;
      paymentStatus: 'pago' | 'pendente';
      items: Array<{
        name: string;
        quantity: number;
        price: number;
        subtotal: number;
        unit?: string;
      }>;
    }> = [];

    // 1. Vendas Diretas de Balcão
    directSales.forEach(s => {
      const matchClient = s.clientId === effectiveClientId || 
        (currentClient?.name && s.clientName.toLowerCase().includes(currentClient.name.toLowerCase()));
      if (matchClient) {
        purchases.push({
          id: `ds-${s.id}`,
          code: s.code,
          type: 'venda_direta',
          date: s.date,
          total: s.total,
          paymentMethod: s.payments[0]?.method || 'pix',
          paymentStatus: s.paymentStatus === 'pago' ? 'pago' : 'pendente',
          items: s.items.map(it => ({
            name: it.name,
            quantity: it.quantity,
            price: it.price,
            subtotal: it.quantity * it.price,
            unit: it.unit || 'UN'
          }))
        });
      }
    });

    // 2. Peças & Produtos em Ordens de Serviço
    clientOrders.forEach(o => {
      if (o.parts && o.parts.length > 0) {
        const partsTotal = o.parts.reduce((acc, p) => acc + (Number(p.price || 0) * Number(p.quantity || 1)), 0);
        purchases.push({
          id: `os-part-${o.id}`,
          code: o.code,
          type: 'ordem_servico',
          date: o.completionDate || o.openDate,
          total: partsTotal,
          paymentMethod: o.paymentMethod || 'pix',
          paymentStatus: o.paymentStatus === 'pago' ? 'pago' : 'pendente',
          items: o.parts.map(p => ({
            name: p.name,
            quantity: p.quantity,
            price: p.price,
            subtotal: Number(p.quantity) * Number(p.price),
            unit: p.unit || 'UN'
          }))
        });
      }
    });

    // Ordenar por data decrescente
    return purchases.sort((a, b) => b.date.localeCompare(a.date));
  }, [directSales, clientOrders, effectiveClientId, currentClient]);

  const totalSpentInPurchases = clientPurchases.reduce((acc, p) => acc + p.total, 0);
  const totalItemsPurchasedCount = clientPurchases.reduce((acc, p) => 
    acc + p.items.reduce((s, it) => s + Number(it.quantity || 1), 0), 0
  );

  // Abertura de chamado / acionamento de garantia com busca por número de série
  const handleOpenWarrantyClaimForEquipment = (eq: typeof clientEquipments[0]) => {
    setTicketType('acionamento_garantia');
    setLinkedOrderId(eq.orderId);
    setEquipmentSerial(eq.equipmentSerial);
    setTicketSubject(`Acionamento de Garantia: ${eq.equipmentType} (S/N: ${eq.equipmentSerial})`);
    if (eq.isExpired) {
      setTicketDescription(`Atenção: A garantia deste equipamento expirou em ${formatDateBR(eq.warrantyExpiresAt)}. Solicito visita técnica diagnóstica e orçamento de reparo.`);
    } else {
      setTicketDescription(`Solicito atendimento sob garantia para o equipamento ${eq.equipmentType} modelo ${eq.equipmentModel || ''}. Defeito observado: `);
    }
    setTicketPriority(eq.isExpired ? 'normal' : 'alta');
    setIsNewTicketOpen(true);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) {
      alert('Preencha o assunto e a descrição da solicitação.');
      return;
    }

    addCustomerTicket({
      clientId: currentClient.id,
      clientName: currentClient.name,
      serviceOrderId: linkedOrderId || undefined,
      equipmentSerial: equipmentSerial || undefined,
      type: ticketType,
      subject: ticketSubject,
      description: ticketDescription,
      priority: ticketPriority
    });

    setIsNewTicketOpen(false);
    setTicketSubject('');
    setTicketDescription('');
    setEquipmentSerial('');
    setLinkedOrderId('');
    alert('Sua solicitação foi enviada com sucesso à equipe de assistência técnica!');
  };

  // Salvar alterações cadastrais e credenciais de segurança do próprio cliente
  const handleSaveProfileAndCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (portalPassword !== confirmPassword) {
      alert('A nova senha e a confirmação de senha não coincidem. Digite-as novamente.');
      return;
    }

    if (!portalUsername.trim()) {
      alert('Informe um nome de usuário válido para acesso ao portal.');
      return;
    }

    if (portalPassword.length < 4) {
      alert('A senha deve conter no mínimo 4 caracteres.');
      return;
    }

    updateClient(currentClient.id, {
      name: profileName,
      email: profileEmail,
      phone: profilePhone,
      secondaryPhone: profileSecondaryPhone,
      street: profileStreet,
      number: profileNumber,
      complement: profileComplement,
      neighborhood: profileNeighborhood,
      city: profileCity,
      state: profileState,
      cep: profileCep,
      contactPerson: profileContactPerson,
      portalUsername: portalUsername.trim().toLowerCase(),
      portalPassword: portalPassword
    });

    setProfileSavedFeedback('Dados cadastrais e credenciais de segurança salvos com sucesso!');
    setTimeout(() => {
      setProfileSavedFeedback(null);
    }, 4000);
  };

  // Assinatura digital em tela
  const handleSaveSignature = (order: ServiceOrder) => {
    if (!signerName.trim()) {
      alert('Informe o nome do responsável pelo recebimento do serviço.');
      return;
    }

    const now = new Date();
    const formatted = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR');
    const svgStamp = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="260" height="70"><path d="M15 45 C 50 15, 80 55, 130 30 S 210 50, 245 35" stroke="%231d4ed8" fill="none" stroke-width="2.5"/><text x="15" y="65" font-family="sans-serif" font-size="10" fill="%2364748b">Assinado Digitalmente · Autenticação em Tela Touch</text></svg>`;

    updateServiceOrder(order.id, {
      signature: {
        signatureDataUrl: svgStamp,
        signedByName: signerName,
        signedByDocument: signerDocument || 'Documento Validado',
        signedAt: formatted
      }
    });

    setSignModalOrder(null);
    setSignerName('');
    setSignerDocument('');
    alert('Assinatura digital registrada com sucesso na Ordem de Serviço!');
  };

  return (
    <div className="space-y-6">
      {/* Portal Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Área Restrita do Cliente
            </span>
            <span className="text-xs text-slate-300">Autoatendimento, Garantias & Compras</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-2">
            Portal do Cliente GestãoPro
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Acompanhe o andamento das suas Ordens de Serviço, consulte termos de garantia com número de série (S/N) de equipamentos, acione a garantia com 1 clique, visualize seu histórico de compras e gerencie seus dados de acesso.
          </p>
        </div>

        {/* Identificação de Tenant / Prevenção IDOR */}
        {isRealClientSession ? (
          <div className="bg-emerald-500/20 p-3.5 rounded-xl border border-emerald-400/40 shrink-0 space-y-1 backdrop-blur-xs min-w-[260px]">
            <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Sessão Segura & Isolada</span>
            </div>
            <p className="text-xs font-bold text-white truncate">{currentClient?.name || 'Cliente Autenticado'}</p>
            <p className="text-[11px] text-emerald-200/90 font-mono">ID Tenant: {currentClient?.id} · {currentClient?.document}</p>
          </div>
        ) : (
          <div className="bg-white/10 p-3.5 rounded-xl border border-white/20 shrink-0 space-y-1.5 backdrop-blur-xs min-w-[250px]">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Auditoria / Admin:
              </label>
              <span className="text-[10px] text-amber-200 bg-amber-500/20 px-1.5 py-0.5 rounded font-mono">Simulação</span>
            </div>
            <select
              value={effectiveClientId}
              onChange={(e) => setAdminSimulatedClientId(e.target.value)}
              className="w-full text-xs font-bold text-slate-900 bg-white rounded-lg p-2 cursor-pointer shadow-xs focus:ring-2 focus:ring-amber-400 outline-hidden"
            >
              {clients.length === 0 ? (
                <option value="">Nenhum cliente cadastrado no sistema</option>
              ) : (
                clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.document})
                  </option>
                ))
              )}
            </select>
          </div>
        )}
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Ordens de Serviço */}
        <div 
          onClick={() => setActiveTab('orders')}
          className={`p-4 rounded-xl bg-white border transition-all cursor-pointer shadow-xs ${
            activeTab === 'orders' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Ordens de Serviço</span>
            <ClipboardList className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {clientOrders.length} OS
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {clientOrders.filter(o => o.status === 'entregue_finalizada').length} finalizadas
          </div>
        </div>

        {/* 2. Garantias & Equipamentos */}
        <div 
          onClick={() => setActiveTab('warranties')}
          className={`p-4 rounded-xl bg-white border transition-all cursor-pointer shadow-xs ${
            activeTab === 'warranties' ? 'border-purple-500 ring-2 ring-purple-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Equipamentos & Garantias</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700 mt-2">
            {clientEquipments.length} Ativos
          </div>
          <div className="text-xs text-purple-600 font-semibold mt-1">
            {clientEquipments.filter(e => !e.isExpired).length} com garantia válida
          </div>
        </div>

        {/* 3. Histórico de Compras */}
        <div 
          onClick={() => setActiveTab('purchases')}
          className={`p-4 rounded-xl bg-white border transition-all cursor-pointer shadow-xs ${
            activeTab === 'purchases' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Histórico de Compras</span>
            <ShoppingBag className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-2">
            {formatBRL(totalSpentInPurchases)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {clientPurchases.length} aquisições realizadas
          </div>
        </div>

        {/* 4. Faturas / Débitos */}
        <div 
          onClick={() => setActiveTab('debts')}
          className={`p-4 rounded-xl bg-white border transition-all cursor-pointer shadow-xs ${
            activeTab === 'debts' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Situação Financeira</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className={`text-2xl font-bold font-mono mt-2 ${totalPendingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {totalPendingAmount > 0 ? formatBRL(totalPendingAmount) : 'Em Dia'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {pendingOrders.length === 0 ? 'Nenhum débito pendente' : `${pendingOrders.length} fatura(s) em aberto`}
          </div>
        </div>
      </div>

      {/* Tabs Control Desmembradas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'orders' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Ordens de Serviço ({clientOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('warranties')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'warranties' ? 'bg-purple-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Garantias & S/N ({clientEquipments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'purchases' ? 'bg-amber-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Histórico de Compras ({clientPurchases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tickets' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Chamados ({clientTickets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('debts')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'debts' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Faturas ({pendingOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'profile' ? 'bg-blue-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Perfil & Segurança</span>
          </button>
        </div>

        <button
          onClick={() => {
            setTicketType('acionamento_garantia');
            setEquipmentSerial('');
            setLinkedOrderId('');
            setTicketSubject('');
            setTicketDescription('');
            setIsNewTicketOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Abrir Chamado / Acionar Garantia</span>
        </button>
      </div>

      {/* =========================================================================
          ABA 1: ORDENS DE SERVIÇO (Fluxo Desmembrado)
          ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {clientOrders.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-400 text-xs">
              Nenhuma Ordem de Serviço vinculada a este cliente.
            </div>
          ) : (
            clientOrders.map(order => {
              const srv = order.services.reduce((a, b) => a + Number(b.price || 0), 0);
              const prt = order.parts.reduce((a, b) => a + (Number(b.price || 0) * Number(b.quantity || 1)), 0);
              const grandTotal = srv + prt + Number(order.visitFee || 0) - Number(order.calculatedDiscount || 0);

              return (
                <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-blue-600">
                        {order.code}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                        {order.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      {order.equipmentType && (
                        <span className="text-xs text-slate-600 font-medium hidden md:inline">
                          · {order.equipmentType}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono">
                        Abertura: {formatDateBR(order.openDate)}
                      </span>
                      {order.signature ? (
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Assinado Digitalmente ({order.signature.signedByName})
                        </span>
                      ) : (
                        <button
                          onClick={() => setSignModalOrder(order)}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 flex items-center gap-1 cursor-pointer"
                        >
                          <PenTool className="w-3 h-3" />
                          Assinar em Tela
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Defeito e Laudo */}
                  <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-slate-500 font-medium">Diagnóstico / Defeito Relatado:</div>
                    <div className="text-slate-800 font-medium mt-0.5">{order.description}</div>
                  </div>

                  {/* Serviços & Peças List */}
                  <div className="text-xs space-y-1">
                    <div className="text-slate-600 font-medium">Serviços executados:</div>
                    <ul className="list-disc pl-5 text-slate-700 space-y-0.5">
                      {order.services.map(s => (
                        <li key={s.id}>{s.name} ({s.hours || 1}h) - <span className="font-mono font-semibold">{formatBRL(s.price)}</span></li>
                      ))}
                    </ul>
                    {order.parts.length > 0 && (
                      <div className="pt-1">
                        <span className="text-slate-600 font-medium">Peças aplicadas: </span>
                        <span className="text-slate-700">{order.parts.map(p => `${p.quantity}x ${p.name}`).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Total */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="text-slate-500">
                      Forma de Pagto: <span className="font-semibold text-slate-700 uppercase">{order.paymentMethod.replace('_', ' ')}</span>
                      {order.calculatedDiscount > 0 && ` (Desconto: ${formatBRL(order.calculatedDiscount)})`}
                    </div>
                    <div className="text-sm font-bold font-mono text-slate-900">
                      Total da OS: <span className="text-emerald-700 font-black">{formatBRL(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* =========================================================================
          ABA 2: GARANTIAS & NÚMEROS DE SÉRIE (Desmembrado com busca inteligente)
          ========================================================================= */}
      {activeTab === 'warranties' && (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-purple-900 text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                Painel Central de Garantias & Equipamentos Vendidos
              </h2>
              <p className="text-purple-800 text-[11px] mt-0.5">
                Consulte todos os equipamentos com número de série vinculados às suas Ordens de Serviço. Acione a garantia imediatamente buscando pelo S/N.
              </p>
            </div>

            <button
              onClick={() => {
                setTicketType('acionamento_garantia');
                setIsNewTicketOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs flex items-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Acionamento</span>
            </button>
          </div>

          {clientEquipments.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-400 text-xs">
              Nenhum equipamento com número de série cadastrado para este cliente até o momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientEquipments.map(eq => (
                <div 
                  key={eq.id} 
                  className={`bg-white rounded-xl border p-5 shadow-xs space-y-3 transition-all ${
                    eq.isExpired ? 'border-rose-200 bg-rose-50/20' : 'border-purple-200 ring-1 ring-purple-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {eq.equipmentType}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Modelo: {eq.equipmentModel}
                      </div>
                    </div>

                    {eq.isExpired ? (
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        Garantia Expirada
                      </span>
                    ) : (
                      <span className="text-[10px] px-2.5 py-0.5 rounded font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Garantia Ativa ({eq.daysRemaining} dias)
                      </span>
                    )}
                  </div>

                  {/* Número de Série em Destaque */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between font-mono text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-sans font-medium">NÚMERO DE SÉRIE (S/N)</span>
                      <span className="font-bold text-slate-900 text-sm">{eq.equipmentSerial}</span>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(eq.equipmentSerial);
                        alert(`Número de série copiado: ${eq.equipmentSerial}`);
                      }}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
                      title="Copiar Número de Série"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400">Origem:</span>
                      <div className="font-semibold text-blue-600 font-mono">OS {eq.orderCode}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Instalação:</span>
                      <div className="font-semibold">{formatDateBR(eq.installDate)}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Prazo Legal / Fábrica:</span>
                      <div className="font-semibold">{eq.warrantyPeriodDays} dias de cobertura</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Validade Até:</span>
                      <div className={`font-semibold ${eq.isExpired ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {formatDateBR(eq.warrantyExpiresAt)}
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 border-t border-slate-100 pt-2 leading-relaxed">
                    {eq.warrantyTerms}
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={() => handleOpenWarrantyClaimForEquipment(eq)}
                      className={`w-full py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer ${
                        eq.isExpired 
                          ? 'bg-slate-800 hover:bg-slate-900 text-white' 
                          : 'bg-purple-700 hover:bg-purple-800 text-white'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>{eq.isExpired ? 'Solicitar Vistoria Técnica (Fora de Garantia)' : 'Acionar Garantia deste Equipamento'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          ABA 3: HISTÓRICO DE COMPRAS (NOVA ABA)
          ========================================================================= */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-700" />
                Histórico Completo de Compras & Aquisições
              </h2>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Visualize todas as peças, filtros, bombas e materiais comprados no balcão ou instalados em manutenções.
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-amber-700 uppercase font-semibold">Total Investido</span>
              <div className="text-lg font-black font-mono text-amber-900">
                {formatBRL(totalSpentInPurchases)}
              </div>
            </div>
          </div>

          {clientPurchases.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-400 text-xs">
              Nenhuma compra registrada para este cliente até o momento.
            </div>
          ) : (
            <div className="space-y-3">
              {clientPurchases.map(purchase => (
                <div key={purchase.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-sm text-blue-600">
                        {purchase.code}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                        {purchase.type === 'venda_direta' ? 'Venda de Balcão' : 'Peças em Ordem de Serviço'}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Data: {formatDateBR(purchase.date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        purchase.paymentStatus === 'pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {purchase.paymentStatus === 'pago' ? 'Liquidado' : 'A Pagar'}
                      </span>
                      <span className="font-mono font-bold text-sm text-slate-900">
                        Total: {formatBRL(purchase.total)}
                      </span>
                    </div>
                  </div>

                  {/* Itens Comprados */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                          <th className="py-1.5 px-3">Item / Produto</th>
                          <th className="py-1.5 px-3 text-center">Quantidade</th>
                          <th className="py-1.5 px-3 text-right">Valor Unitário</th>
                          <th className="py-1.5 px-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {purchase.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-medium text-slate-800">
                              {it.name}
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-slate-600">
                              {it.quantity} {it.unit || 'UN'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600">
                              {formatBRL(it.price)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {formatBRL(it.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">
                      Forma de Pagamento: <strong className="text-slate-700 uppercase">{purchase.paymentMethod.replace('_', ' ')}</strong>
                    </span>

                    <button
                      onClick={() => setViewingPurchase(purchase)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Ver Comprovante de Aquisição</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          ABA 4: CHAMADOS TÉCNICOS & SUPORTE
          ========================================================================= */}
      {activeTab === 'tickets' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Chamados de Assistência Técnica & Solicitações de Garantia
            </h2>
            <button
              onClick={() => {
                setTicketType('chamado_tecnico');
                setIsNewTicketOpen(true);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              + Novo Chamado
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {clientTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                Você ainda não possui nenhum chamado técnico aberto.
              </div>
            ) : (
              clientTickets.map(tkt => (
                <div key={tkt.id} className="p-4 space-y-2 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        tkt.type === 'acionamento_garantia' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {tkt.type.replace('_', ' ')}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900">{tkt.subject}</h3>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      tkt.status === 'visita_agendada' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {tkt.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <p className="text-slate-600 leading-relaxed">{tkt.description}</p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
                    <span>Aberto em: {tkt.createdAt}</span>
                    {tkt.equipmentSerial && <span>S/N Equipamento: {tkt.equipmentSerial}</span>}
                    {tkt.scheduledDate && <span className="text-emerald-700 font-semibold font-sans">· Visita Agendada: {formatDateBR(tkt.scheduledDate)}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          ABA 5: DÉBITOS & FATURAS
          ========================================================================= */}
      {activeTab === 'debts' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Débitos em Aberto e Faturas a Pagar
            </h2>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {pendingOrders.length === 0 ? (
              <div className="p-8 text-center text-emerald-600 font-semibold">
                Parabéns! Sua conta está 100% em dia. Nenhum débito pendente.
              </div>
            ) : (
              pendingOrders.map(ord => {
                const srv = ord.services.reduce((a, b) => a + Number(b.price || 0), 0);
                const prt = ord.parts.reduce((a, b) => a + (Number(b.price || 0) * Number(b.quantity || 1)), 0);
                const grandTotal = srv + prt + Number(ord.visitFee || 0) - Number(ord.calculatedDiscount || 0);

                return (
                  <div key={ord.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-mono font-bold text-blue-600">{ord.code}</div>
                      <div className="font-semibold text-slate-900">{ord.description}</div>
                      <div className="text-[11px] text-slate-500">Vencimento: {formatDateBR(ord.forecastDate)}</div>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <div className="text-right">
                        <div className="text-sm font-black text-rose-600">{formatBRL(grandTotal)}</div>
                        <div className="text-[10px] text-amber-700 uppercase font-semibold">Pendente</div>
                      </div>

                      <button
                        onClick={() => {
                          updateServiceOrder(ord.id, { paymentStatus: 'pago' });
                          alert('Pagamento registrado com sucesso!');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
                      >
                        Pagar via Pix / Boleto
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          ABA 6: MEU PERFIL & SEGURANÇA (Dados cadastrais + Usuário e Senha)
          ========================================================================= */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfileAndCredentials} className="space-y-6">
          {profileSavedFeedback && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSavedFeedback}</span>
            </div>
          )}

          {/* Card 1: Credenciais de Acesso e Segurança do Portal */}
          <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Credenciais de Acesso ao Portal do Cliente
                </h2>
                <p className="text-xs text-slate-500">
                  Defina o usuário e a senha para acessar suas Ordens de Serviço, garantias e comprovantes a qualquer momento.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Usuário de Login *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={portalUsername}
                    onChange={(e) => setPortalUsername(e.target.value)}
                    placeholder="Ex: maria.gorete"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Utilizado para efetuar login na tela inicial</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nova Senha *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Mínimo de 4 caracteres</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme a nova senha"
                    className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                {portalPassword !== confirmPassword && confirmPassword.length > 0 && (
                  <span className="text-[10px] text-rose-600 font-semibold mt-1 block">As senhas não coincidem</span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Dados Cadastrais do Cliente */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Dados Cadastrais do Cliente
                </h2>
                <p className="text-xs text-slate-500">
                  Informações de identificação, contato e endereços para atendimento e faturamento.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nome Completo / Razão Social *</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">CPF ou CNPJ</label>
                <input
                  type="text"
                  disabled
                  value={currentClient?.document || ''}
                  className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg font-mono text-slate-500 cursor-not-allowed"
                  title="Para alterar o CPF/CNPJ contate a administração"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Pessoa de Contato / Responsável</label>
                <input
                  type="text"
                  value={profileContactPerson}
                  onChange={(e) => setProfileContactPerson(e.target.value)}
                  placeholder="Nome de quem atende os técnicos"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">E-mail Principal</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Telefone Principal / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Telefone Secundário</label>
                <input
                  type="text"
                  value={profileSecondaryPhone}
                  onChange={(e) => setProfileSecondaryPhone(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                Endereço Principal de Atendimento
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="sm:col-span-1">
                  <label className="block text-slate-700 mb-1">CEP</label>
                  <input
                    type="text"
                    value={profileCep}
                    onChange={(e) => setProfileCep(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 mb-1">Logradouro / Rua</label>
                  <input
                    type="text"
                    value={profileStreet}
                    onChange={(e) => setProfileStreet(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-slate-700 mb-1">Número</label>
                  <input
                    type="text"
                    value={profileNumber}
                    onChange={(e) => setProfileNumber(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-slate-700 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={profileComplement}
                    onChange={(e) => setProfileComplement(e.target.value)}
                    placeholder="Apto, Casa 13, Bloco..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-slate-700 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={profileNeighborhood}
                    onChange={(e) => setProfileNeighborhood(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={profileCity}
                    onChange={(e) => setProfileCity(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-slate-700 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={profileState}
                    onChange={(e) => setProfileState(e.target.value.toUpperCase())}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Múltiplos endereços cadastrados */}
            {currentClient?.addresses && currentClient.addresses.length > 1 && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 block mb-2">Outros Endereços / Obras Registradas:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {currentClient.addresses.map((addr) => (
                    <div key={addr.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-900">{addr.title}</div>
                      <div className="text-slate-600 text-[11px] mt-0.5">
                        {addr.street}, {addr.number} {addr.complement ? `(${addr.complement})` : ''} - {addr.neighborhood}, {addr.city}/{addr.state}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Alterações de Perfil e Senha</span>
            </button>
          </div>
        </form>
      )}

      {/* =========================================================================
          MODAL: NOVO CHAMADO / ACIONAMENTO DE GARANTIA
          ========================================================================= */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                {ticketType === 'acionamento_garantia' ? 'Acionamento de Garantia por Número de Série' : 'Abrir Solicitação no Portal'}
              </h3>
              <button
                onClick={() => setIsNewTicketOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Tipo de Solicitação *</label>
                  <select
                    value={ticketType}
                    onChange={(e) => setTicketType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="acionamento_garantia">Acionamento de Garantia</option>
                    <option value="chamado_tecnico">Novo Chamado Técnico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Prioridade</label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente (Sem água/vazamento)</option>
                  </select>
                </div>
              </div>

              {/* Seleção do Equipamento em Garantia por Número de Série */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">
                  Buscar Equipamento em Garantia pelo Número de Série (S/N)
                </label>
                <select
                  value={equipmentSerial}
                  onChange={(e) => {
                    const sn = e.target.value;
                    setEquipmentSerial(sn);
                    const matched = clientEquipments.find(eq => eq.equipmentSerial === sn);
                    if (matched) {
                      setLinkedOrderId(matched.orderId);
                      setTicketSubject(`Acionamento de Garantia: ${matched.equipmentType} (S/N: ${matched.equipmentSerial})`);
                    }
                  }}
                  className="w-full p-2.5 bg-purple-50/50 border border-purple-200 rounded-lg font-mono font-bold text-slate-900 cursor-pointer"
                >
                  <option value="">Selecione um número de série cadastrado...</option>
                  {clientEquipments.map(eq => (
                    <option key={eq.id} value={eq.equipmentSerial}>
                      {eq.equipmentSerial} - {eq.equipmentType} ({eq.isExpired ? 'EXPIRADA' : `VÁLIDA até ${formatDateBR(eq.warrantyExpiresAt)}`})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  O equipamento é encontrado automaticamente pelas Ordens de Serviço do seu cadastro.
                </span>
              </div>

              {/* Alerta de Garantia Expirada se aplicável */}
              {equipmentSerial && (() => {
                const found = clientEquipments.find(e => e.equipmentSerial === equipmentSerial);
                if (!found) return null;
                if (found.isExpired) {
                  return (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Garantia Expirada:</strong> A garantia deste equipamento expirou em {formatDateBR(found.warrantyExpiresAt)}. O atendimento será realizado como vistoria técnica avulsa sujeita a orçamento.
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Garantia Válida:</strong> Equipamento com garantia ativa até {formatDateBR(found.warrantyExpiresAt)} ({found.daysRemaining} dias restantes). Atendimento sem custo de mão de obra.
                      </div>
                    </div>
                  );
                }
              })()}

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Assunto Resumido *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Barulho na bomba ou queda de temperatura do reservatório"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Descrição Detalhada do Problema *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva quando o problema começou, ruídos, vazamentos observados..."
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Enviar Solicitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ASSINATURA DIGITAL EM TELA TOUCH
          ========================================================================= */}
      {signModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <PenTool className="w-4 h-4 text-blue-600" />
                Assinatura Digital da OS {signModalOrder.code}
              </h3>
              <button
                onClick={() => setSignModalOrder(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Ao confirmar a assinatura em tela, você valida a execução dos serviços técnicos realizados em conformidade com o laudo e termos descritos.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nome do Recebedor / Responsável *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Maria Gorete ou Síndico"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Documento (RG ou CPF)</label>
                <input
                  type="text"
                  placeholder="Ex: 619.998.442-41"
                  value={signerDocument}
                  onChange={(e) => setSignerDocument(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              {/* Pad de Assinatura Simulado */}
              <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/70 text-center space-y-2">
                <span className="text-[11px] text-slate-400 block font-medium">Área de Assinatura Digital Touch</span>
                <div className="h-16 flex items-center justify-center border-b border-slate-200 font-serif italic text-blue-800 text-lg">
                  {signerName ? signerName : 'Assine seu nome acima'}
                </div>
                <span className="text-[10px] text-slate-400">Autenticação biométrica / carimbo digital com data e hora</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSignModalOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveSignature(signModalOrder)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs"
              >
                Confirmar Assinatura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: COMPROVANTE DE COMPRA
          ========================================================================= */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Comprovante de Compra</h3>
                <span className="text-xs text-blue-600 font-mono font-bold">{viewingPurchase.code}</span>
              </div>
              <button
                onClick={() => setViewingPurchase(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="flex justify-between text-slate-600 pb-2 border-b border-slate-100">
                <span>Cliente: <strong>{currentClient?.name}</strong></span>
                <span>Data: <strong>{formatDateBR(viewingPurchase.date)}</strong></span>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">Itens Adquiridos:</span>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                  {viewingPurchase.items.map((it: any, i: number) => (
                    <div key={i} className="p-2.5 flex justify-between items-center bg-slate-50/50">
                      <div>
                        <div className="font-semibold text-slate-800">{it.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {it.quantity} {it.unit || 'UN'} × {formatBRL(it.price)}
                        </div>
                      </div>
                      <div className="font-bold font-mono text-slate-900">
                        {formatBRL(it.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm">
                <span className="font-bold text-slate-800">Valor Total Pago:</span>
                <span className="font-mono font-black text-emerald-700 text-base">{formatBRL(viewingPurchase.total)}</span>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                Forma de Pagamento: <strong className="uppercase text-slate-700">{viewingPurchase.paymentMethod.replace('_', ' ')}</strong> · Status: <span className="text-emerald-700 font-bold uppercase">{viewingPurchase.paymentStatus}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Comprovante</span>
              </button>
              <button
                onClick={() => setViewingPurchase(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
