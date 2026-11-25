import React, { useState } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Printer, 
  Eye, 
  CheckCircle, 
  CheckCircle2,
  Clock, 
  AlertCircle, 
  Car, 
  User, 
  Calendar, 
  Trash2, 
  Edit3,
  DollarSign,
  PenTool,
  Camera,
  Image as ImageIcon,
  ShieldCheck,
  Percent,
  CreditCard,
  ArrowRightCircle,
  Share2,
  MapPin,
  Download,
  FileDown,
  Send,
  QrCode,
  Receipt,
  Copy,
  Check,
  MessageSquare,
  Store,
  X,
  Smartphone,
  Wrench,
  CheckSquare,
  Tag,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Calculator,
  UserPlus,
  FileText
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../../context/AppContext';
import { 
  ServiceOrder, 
  ServiceOrderStatus, 
  ServiceItem, 
  PartItem, 
  Product,
  PaymentMethod, 
  ChecklistItem, 
  PaymentSplit, 
  PaymentEntryType,
  PaymentSplitStatus,
  CardBrand 
} from '../../types';
import { ServiceOrderPrintTemplate } from './ServiceOrderPrintTemplate';
import { QuickClientModal } from './QuickClientModal';
import { ServiceOrderPhotosPanel } from './ServiceOrderPhotosPanel';
import { getScopedServiceOrders } from '../../security/secureDataAccess';
import { WhatsAppModal } from '../../components/WhatsAppModal';
import { TablePagination } from '../../components/TablePagination';
import { LiveSearchInput, LiveSearchOption } from '../../components/LiveSearchInput';
import { RecordDetailModal } from '../../components/RecordDetailModal';
import { ViewModeToggle, ViewMode } from '../../components/ViewModeToggle';
import { useRowHoverTooltip } from '../../components/RowHoverTooltip';
import { SERVICE_ORDER_STATUS_LIST, getServiceOrderStatusMeta } from '../../utils/serviceOrderStatus';
import {
  buildCompanyCnpjPixBrCode,
  calculateServiceOrderFinancials,
  generatePixQrDataUrl,
  resolveServiceOrderWarrantyTerm
} from '../../utils/pixBrCode';

interface ServiceOrdersViewProps {
  isNewModalOpen: boolean;
  setIsNewModalOpen: (open: boolean) => void;
  externalStatusFilter?: { status: string; seq: number };
}

export const ServiceOrdersView: React.FC<ServiceOrdersViewProps> = ({ 
  isNewModalOpen, 
  setIsNewModalOpen,
  externalStatusFilter
}) => {
  const { 
    serviceOrders, 
    employees, 
    vehicles, 
    clients, 
    products, 
    cardRates,
    cardOperators,
    serviceCatalog,
    checklistTemplates,
    addServiceCatalogItem,
    addChecklistTemplate,
    addServiceOrder, 
    updateServiceOrder, 
    deleteServiceOrder,
    convertBudgetToOrderOrSale,
    sendOrderToPdv,
    settleServiceOrderInPdv,
    getReceiptsForSource,
    getPaidAmountForSource,
    openReceiptModal,
    registerOsDirectPaymentReceipt,
    warrantyPolicies,
    currentRole,
    currentUser,
    appointments,
    addAppointment,
    stockMovements,
    generalExpenses,
    cashMovements,
    companySettings
  } = useApp();

  const [demoLoadedMsg, setDemoLoadedMsg] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  React.useEffect(() => {
    if (externalStatusFilter?.status) {
      setStatusFilter(externalStatusFilter.status);
    }
  }, [externalStatusFilter]);
  const [selectedOSForDetail, setSelectedOSForDetail] = useState<ServiceOrder | null>(null);
  const [printIncludeWarranty, setPrintIncludeWarranty] = useState(false);
  const [warrantyPromptState, setWarrantyPromptState] = useState<{
    os: ServiceOrder;
    mode: 'print' | 'download';
    policyName: string;
    days: number;
    remainingBalance: number;
  } | null>(null);
  const [pdvPixQrUrl, setPdvPixQrUrl] = useState<string>('');
  const [modalOSInfo, setModalOSInfo] = useState<ServiceOrder | null>(null);
  const { showTooltip, hideTooltip, tooltipElement } = useRowHoverTooltip();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleScheduleOSInCalendar = (os: ServiceOrder) => {
    const existing = appointments.find(a => a.serviceOrderId === os.id);
    if (existing) {
      alert(`Esta Ordem de Serviço já possui agendamento na agenda (${formatDateBR(existing.startDate)} às ${existing.startTime}). Acesse o menu Google Agenda para detalhes.`);
      return;
    }
    const emp = employees.find(e => e.id === os.employeeId);
    addAppointment({
      title: `OS ${os.code}: ${os.clientName} - Atendimento Técnico`,
      type: 'servico',
      description: `Execução da Ordem de Serviço ${os.code}.\nEquipamento: ${os.equipmentType || 'N/A'}\nServiços: ${os.services.map(s => s.name).join(', ')}\nObs: ${os.description}`,
      startDate: os.forecastDate || new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endDate: os.forecastDate || new Date().toISOString().split('T')[0],
      endTime: '12:00',
      clientId: os.clientId,
      clientName: os.clientName,
      serviceOrderId: os.id,
      serviceOrderCode: os.code,
      employeeId: os.employeeId,
      employeeName: emp?.name,
      location: os.clientAddress,
      status: 'agendado',
      isSample: false
    });
    alert(`Ordem de Serviço ${os.code} agendada com sucesso no Google Agenda para ${formatDateBR(os.forecastDate || new Date().toISOString().split('T')[0])} às 09:00!`);
  };

  // WhatsApp Message Modal State
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    isOpen: boolean;
    phone: string;
    clientName: string;
    templateId: string;
    variables: Record<string, string | number | undefined>;
  }>({
    isOpen: false,
    phone: '',
    clientName: '',
    templateId: 'os_orcamento',
    variables: {}
  });

  const handleOpenWhatsAppForOS = (os: ServiceOrder) => {
    const isBudget = os.status === 'orcamento_aberto' || os.status === 'aguardando_aprovacao';
    const isCompleted = os.status === 'concluida_aguardando_retirada' || os.status === 'entregue_finalizada';
    const templateId = isBudget ? 'os_orcamento' : isCompleted ? 'os_concluida' : 'os_aprovada';

    const srvTotal = os.services.reduce((a, s) => a + s.price, 0);
    const prtTotal = os.parts.reduce((a, p) => a + (p.price * p.quantity), 0);
    const osTotal = Math.max(0, (srvTotal + prtTotal + (os.visitFee || 0)) - (os.calculatedDiscount || 0));
    const emp = employees.find(e => e.id === os.employeeId);

    setWhatsAppModalData({
      isOpen: true,
      phone: os.clientPhone || '',
      clientName: os.clientName || 'Cliente',
      templateId,
      variables: {
        numero_os: os.code,
        equipamento_servico: os.equipmentType || (os.services.length > 0 ? os.services.map(s => s.name).join(', ') : os.description.slice(0, 45)),
        valor_total: formatBRL(osTotal),
        data_previsao: formatDateBR(os.forecastDate),
        tecnico: emp?.name || 'Técnico MP Piscinas',
        endereco: os.clientAddress || 'Endereço cadastrado',
        garantia: `${os.warrantyPeriodDays || 90} dias`,
        status_pagamento: os.paymentStatus === 'pago' ? 'Pago ✅' : 'Pendente de Pagamento'
      }
    });
  };

  // Sincroniza o título da página com o número da OS para que ao imprimir ou salvar como PDF o arquivo venha com o número correto da OS
  React.useEffect(() => {
    if (selectedOSForDetail) {
      const prevTitle = document.title;
      document.title = `OS-${selectedOSForDetail.code}`;
      return () => {
        document.title = prevTitle || 'MP PISCINA - ERP';
      };
    }
  }, [selectedOSForDetail]);

  // Touch Signature Modal State
  const [signOrder, setSignOrder] = useState<ServiceOrder | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerDocument, setSignerDocument] = useState('');

  // New OS Form State
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || '');
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || '');
  const [kmDriven, setKmDriven] = useState(40);
  const [description, setDescription] = useState('');
  const [forecastDate, setForecastDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [completionDate, setCompletionDate] = useState<string>('');
  const [status, setStatus] = useState<ServiceOrderStatus>('orcamento_aberto');
  const [contractReference, setContractReference] = useState<string>('');

  // Quick Status & Delivery Date Modal + Detail Modal Inline Controls
  const [statusModalOS, setStatusModalOS] = useState<ServiceOrder | null>(null);
  const [quickStatus, setQuickStatus] = useState<ServiceOrderStatus>('aprovada_em_andamento');
  const [quickForecastDate, setQuickForecastDate] = useState<string>('');
  const [quickCompletionDate, setQuickCompletionDate] = useState<string>('');

  const [detailStatus, setDetailStatus] = useState<ServiceOrderStatus>('orcamento_aberto');
  const [detailForecastDate, setDetailForecastDate] = useState<string>('');
  const [detailCompletionDate, setDetailCompletionDate] = useState<string>('');
  const [detailSavedMsg, setDetailSavedMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (modalOSInfo) {
      setDetailStatus(modalOSInfo.status);
      setDetailForecastDate(modalOSInfo.forecastDate || '');
      setDetailCompletionDate(modalOSInfo.completionDate || '');
      setDetailSavedMsg(null);
    }
  }, [modalOSInfo]);

  // Equipment & Warranty
  const [equipmentType, setEquipmentType] = useState('Reservatório Térmico Solar 600L Inox 316');
  const [equipmentModel, setEquipmentModel] = useState('TermoMax Boiler Alta Pressão');
  const [equipmentSerial, setEquipmentSerial] = useState('TMX-2026-9042');
  const [equipmentYear, setEquipmentYear] = useState('2024');
  const [warrantyPeriodDays, setWarrantyPeriodDays] = useState(365);

  // Fees & Discount
  const [visitFee, setVisitFee] = useState<number>(150);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Services & Parts
  const [services, setServices] = useState<ServiceItem[]>([
    { id: '1', name: 'Manutenção técnica e revisão periódica', hours: 4, price: 950 }
  ]);
  const [parts, setParts] = useState<PartItem[]>([
    { id: '1', name: 'Válvula de Segurança e Alívio de Pressão 3/4" 3 Bar', cost: 65, price: 160, quantity: 1, unit: 'PC' }
  ]);

  // Checklist
  const [checklists, setChecklists] = useState<ChecklistItem[]>([
    { id: 'c1', label: 'Integridade física do reservatório / sem vazamentos', category: 'Estrutura e Tanque', status: 'ok' },
    { id: 'c2', label: 'Isolamento térmico de poliuretano expandido', category: 'Estrutura e Tanque', status: 'ok' },
    { id: 'c3', label: 'Tensão de alimentação da resistência e relé térmico', category: 'Elétrica e Comando', status: 'ok' },
    { id: 'c4', label: 'Funcionamento da válvula de alívio e vácuo', category: 'Acessórios e Segurança', status: 'ok' }
  ]);

  // Fotos da OS (Início: antes de começar os serviços | Entrega: local de entrega dos serviços)
  const [entryPhotos, setEntryPhotos] = useState<string[]>([]);
  const [exitPhotos, setExitPhotos] = useState<string[]>([]);
  const [isQuickClientModalOpen, setIsQuickClientModalOpen] = useState(false);
  const [photosModalOS, setPhotosModalOS] = useState<ServiceOrder | null>(null);

  // Payment splits & automatic installment calculator
  const getTodayIso = () => new Date().toISOString().split('T')[0];

  const [payments, setPayments] = useState<PaymentSplit[]>([
    {
      id: 'p1',
      method: 'pix',
      entryType: 'vista',
      dueDate: getTodayIso(),
      status: 'pendente',
      amount: 1260,
      netAmount: 1260
    }
  ]);
  const [hasCustomPayments, setHasCustomPayments] = useState(false);
  const [calcEntryAmount, setCalcEntryAmount] = useState<string>('');
  const [calcEntryMethod, setCalcEntryMethod] = useState<PaymentMethod>('dinheiro');
  const [calcEntryDate, setCalcEntryDate] = useState<string>(getTodayIso);
  const [calcEntryPaid, setCalcEntryPaid] = useState<boolean>(true);
  const [calcInstallmentMethod, setCalcInstallmentMethod] = useState<PaymentMethod>('cartao_credito');
  const [calcCardBrand, setCalcCardBrand] = useState<CardBrand>('visa');
  const [calcInstallments, setCalcInstallments] = useState<number>(3);
  const [calcFirstDueDate, setCalcFirstDueDate] = useState<string>(getTodayIso);
  const [calcIntervalDays, setCalcIntervalDays] = useState<number>(30);

  // Editing OS state
  const [editingOSId, setEditingOSId] = useState<string | null>(null);
  const [editingOSCode, setEditingOSCode] = useState<string | null>(null);

  // PDV Charging Modal State
  const [chargingOS, setChargingOS] = useState<ServiceOrder | null>(null);
  const [pdvSuccessMessage, setPdvSuccessMessage] = useState<string | null>(null);
  const [pdvTerminal, setPdvTerminal] = useState('pdv-01');
  const [pdvPaymentMethod, setPdvPaymentMethod] = useState<PaymentMethod>('pix');
  const [pdvCardBrand, setPdvCardBrand] = useState<CardBrand>('visa');
  const [pdvInstallments, setPdvInstallments] = useState<number>(1);
  const [pdvCashReceived, setPdvCashReceived] = useState<number>(0);
  const [pdvAuthCode, setPdvAuthCode] = useState<string>('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [isMultiSplit, setIsMultiSplit] = useState(false);
  const [pdvSplits, setPdvSplits] = useState<PaymentSplit[]>([]);
  const [pdvPayMode, setPdvPayMode] = useState<'full' | 'partial' | 'installment'>('full');
  const [pdvPartialAmount, setPdvPartialAmount] = useState<number>(0);
  const [pdvSelectedSplitId, setPdvSelectedSplitId] = useState<string | null>(null);
  const [pdvReceiptNotes, setPdvReceiptNotes] = useState<string>('');

  React.useEffect(() => {
    if (!chargingOS || pdvPaymentMethod !== 'pix') {
      setPdvPixQrUrl('');
      return;
    }
    const osFin = calculateServiceOrderFinancials(chargingOS, getPaidAmountForSource('os', chargingOS.id));
    const rem = osFin.remainingBalance;
    let pixTargetAmount: number | null = osFin.hasDefinedValue ? rem : null;
    if (osFin.hasDefinedValue) {
      if (pdvPayMode === 'partial') {
        pixTargetAmount = Math.max(0.01, Math.min(rem, Number(pdvPartialAmount) || rem));
      } else if (pdvPayMode === 'installment' && pdvSelectedSplitId) {
        const sp = (chargingOS.payments || []).find(p => p.id === pdvSelectedSplitId);
        if (sp) pixTargetAmount = Math.min(rem, Number(sp.amount || rem));
      }
    }
    const pdvPixData = buildCompanyCnpjPixBrCode({
      company: companySettings,
      amount: pixTargetAmount,
      txidSource: chargingOS.code
    });
    let active = true;
    generatePixQrDataUrl(pdvPixData.payload, 240).then(url => {
      if (active) setPdvPixQrUrl(url);
    });
    return () => {
      active = false;
    };
  }, [chargingOS, pdvPaymentMethod, pdvPayMode, pdvPartialAmount, pdvSelectedSplitId, companySettings, getPaidAmountForSource]);

  // Catalog & Custom Services in OS State
  const [serviceAddMode, setServiceAddMode] = useState<'catalogo' | 'avulso' | 'novo_vinculado'>('catalogo');
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [selectedCatalogServiceId, setSelectedCatalogServiceId] = useState('');
  const [customServiceName, setCustomServiceName] = useState('');
  const [customServiceCategory, setCustomServiceCategory] = useState('Serviço Geral');
  const [customServiceHours, setCustomServiceHours] = useState<number>(1);
  const [customServicePrice, setCustomServicePrice] = useState<number | ''>('');

  // Stock Products / Parts Search & Add in OS State
  const [partSearchTerm, setPartSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedPartQty, setSelectedPartQty] = useState<number>(1);
  const [partFeedback, setPartFeedback] = useState<string | null>(null);

  // States for 'novo_vinculado': Criar Serviço e Checklist simultaneamente e vinculá-los
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('Aquecimento Solar & Piscinas');
  const [newServiceHours, setNewServiceHours] = useState<number>(2);
  const [newServicePrice, setNewServicePrice] = useState<number | ''>('');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newChecklistEquipType, setNewChecklistEquipType] = useState('Reservatório Térmico Solar / Boiler');
  const [newChecklistDraftItems, setNewChecklistDraftItems] = useState<{ label: string; category: ChecklistItem['category'] }[]>([
    { label: 'Condição das conexões hidráulicas e sem vazamentos', category: 'Hidráulica e Pressão' },
    { label: 'Teste de isolamento elétrico e fiação', category: 'Elétrica e Comando' }
  ]);
  const [newDraftItemText, setNewDraftItemText] = useState('');
  const [newDraftItemCat, setNewDraftItemCat] = useState<ChecklistItem['category']>('Estrutura e Tanque');

  // Checklist Interactive State
  const [selectedTemplateToImport, setSelectedTemplateToImport] = useState('');
  const [newChecklistLabel, setNewChecklistLabel] = useState('');
  const [newChecklistCategory, setNewChecklistCategory] = useState<ChecklistItem['category']>('Estrutura e Tanque');
  const [newChecklistServiceTag, setNewChecklistServiceTag] = useState('');
  const [isAddingManualChecklist, setIsAddingManualChecklist] = useState(false);
  const [checklistFeedback, setChecklistFeedback] = useState<string | null>(null);

  const handleAddCatalogService = (catalogServiceId: string) => {
    const item = serviceCatalog.find(s => s.id === catalogServiceId);
    if (!item) return;

    const newServiceItem: ServiceItem = {
      id: `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      serviceId: item.id,
      isCustom: false,
      name: item.name,
      category: item.category,
      hours: item.defaultHours || 1,
      price: item.standardPrice || 0
    };

    setServices(prev => [...prev.filter(s => s.name.trim() !== ''), newServiceItem]);
    setSelectedCatalogServiceId('');
    setCatalogSearchTerm('');

    // Sincroniza / anexa automaticamente os checklists vinculados a este serviço
    const linkedChecklists = checklistTemplates.filter(t => 
      t.serviceIds?.includes(item.id) || 
      (t.title && t.title.toLowerCase().includes(item.name.toLowerCase())) ||
      (t.equipmentType && item.category && item.category.toLowerCase().includes(t.equipmentType.toLowerCase()))
    );

    if (linkedChecklists.length > 0) {
      linkedChecklists.forEach(tmpl => {
        tmpl.items.forEach(it => {
          setChecklists(prev => {
            if (prev.some(c => c.label.toLowerCase() === it.label.toLowerCase() && (c.serviceId === item.id || c.serviceName === item.name))) {
              return prev;
            }
            return [
              ...prev,
              {
                id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                label: it.label,
                category: it.category,
                status: 'ok',
                serviceName: item.name,
                serviceId: item.id
              }
            ];
          });
        });
      });
      setChecklistFeedback(`Serviço "${item.name}" adicionado com checklist(s) vinculado(s) anexado(s) automaticamente!`);
      setTimeout(() => setChecklistFeedback(null), 4000);
    } else {
      setChecklistFeedback(`Serviço "${item.name}" adicionado do catálogo.`);
      setTimeout(() => setChecklistFeedback(null), 3000);
    }
  };

  const handleCreateServiceAndLinkedChecklist = () => {
    if (!newServiceName.trim()) return;

    const srvId = `srv-${Date.now()}`;
    const srvCode = `SRV-${Date.now().toString().slice(-4)}`;
    const finalPrice = Number(newServicePrice) || 0;
    const finalHours = Number(newServiceHours) || 1;

    // 1. Cadastra o novo serviço no catálogo do sistema
    addServiceCatalogItem({
      code: srvCode,
      name: newServiceName.trim(),
      category: newServiceCategory.trim() || 'Serviço Geral',
      defaultHours: finalHours,
      standardPrice: finalPrice,
      minPrice: Math.round(finalPrice * 0.8)
    });

    // 2. Prepara os itens do checklist
    const itemsToAttach = newChecklistDraftItems.length > 0 
      ? newChecklistDraftItems 
      : [{ label: `Inspeção e teste de ${newServiceName.trim()}`, category: 'Estrutura e Tanque' as const }];

    // 3. Cadastra o checklist template no sistema vinculado ao serviço criado
    const chkTitle = newChecklistTitle.trim() || `Checklist Técnico - ${newServiceName.trim()}`;
    addChecklistTemplate({
      title: chkTitle,
      equipmentType: newChecklistEquipType.trim() || 'Equipamento Geral',
      serviceIds: [srvId],
      items: itemsToAttach.map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        label: it.label,
        category: it.category,
        required: true
      }))
    });

    // 4. Adiciona o serviço recém-criado à lista de serviços da OS atual
    const newServiceItem: ServiceItem = {
      id: `srv-item-${Date.now()}`,
      serviceId: srvId,
      isCustom: false,
      name: newServiceName.trim(),
      category: newServiceCategory.trim() || 'Serviço Geral',
      hours: finalHours,
      price: finalPrice
    };
    setServices(prev => [...prev.filter(s => s.name.trim() !== ''), newServiceItem]);

    // 5. Adiciona os itens do checklist criado diretamente na OS atual
    const newOSChecklistItems: ChecklistItem[] = itemsToAttach.map((it, idx) => ({
      id: `chk-os-${Date.now()}-${idx}`,
      label: it.label,
      category: it.category,
      status: 'ok',
      serviceName: newServiceName.trim(),
      serviceId: srvId
    }));
    setChecklists(prev => [...prev, ...newOSChecklistItems]);

    // Limpa campos
    setNewServiceName('');
    setNewServicePrice('');
    setNewChecklistTitle('');
    setNewChecklistDraftItems([
      { label: 'Condição das conexões hidráulicas e sem vazamentos', category: 'Hidráulica e Pressão' },
      { label: 'Teste de isolamento elétrico e fiação', category: 'Elétrica e Comando' }
    ]);
    setServiceAddMode('catalogo');

    setChecklistFeedback(`Serviço "${newServiceItem.name}" e Checklist "${chkTitle}" cadastrados no sistema e vinculados a esta OS!`);
    setTimeout(() => setChecklistFeedback(null), 5000);
  };

  const handleAddCustomService = () => {
    if (!customServiceName.trim()) return;

    const newServiceItem: ServiceItem = {
      id: `srv-avulso-${Date.now()}`,
      isCustom: true,
      name: customServiceName.trim(),
      category: customServiceCategory || 'Serviço Avulso',
      hours: Number(customServiceHours) || 1,
      price: Number(customServicePrice) || 0
    };

    setServices(prev => [...prev.filter(s => s.name.trim() !== ''), newServiceItem]);
    setCustomServiceName('');
    setCustomServicePrice('');
    setCustomServiceHours(1);
    setChecklistFeedback(`Serviço avulso "${newServiceItem.name}" adicionado à OS!`);
    setTimeout(() => setChecklistFeedback(null), 3500);
  };

  const handleImportChecklistTemplate = (templateId: string) => {
    const tmpl = checklistTemplates.find(t => t.id === templateId);
    if (!tmpl) return;

    const newItems: ChecklistItem[] = tmpl.items.map(it => ({
      id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      label: it.label,
      category: it.category,
      status: 'ok',
      serviceName: tmpl.title
    }));

    setChecklists(prev => [...prev, ...newItems]);
    setSelectedTemplateToImport('');
    setChecklistFeedback(`Modelo "${tmpl.title}" anexado com ${newItems.length} itens de inspeção!`);
    setTimeout(() => setChecklistFeedback(null), 3500);
  };

  const handleSyncServicesChecklists = () => {
    let countAdded = 0;
    services.forEach(srv => {
      if (srv.serviceId) {
        const templates = checklistTemplates.filter(t => t.serviceIds?.includes(srv.serviceId!));
        templates.forEach(t => {
          t.items.forEach(it => {
            setChecklists(prev => {
              if (prev.some(c => c.label.toLowerCase() === it.label.toLowerCase() && (c.serviceId === srv.serviceId || c.serviceName === srv.name))) {
                return prev;
              }
              countAdded++;
              return [
                ...prev,
                {
                  id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                  label: it.label,
                  category: it.category,
                  status: 'ok',
                  serviceName: srv.name,
                  serviceId: srv.serviceId
                }
              ];
            });
          });
        });
      }
    });

    setChecklistFeedback(countAdded > 0 ? `${countAdded} itens de checklist sincronizados dos serviços!` : 'Todos os checklists dos serviços da OS já estão inclusos.');
    setTimeout(() => setChecklistFeedback(null), 3500);
  };

  const handleAddManualChecklistItem = () => {
    if (!newChecklistLabel.trim()) return;
    setChecklists(prev => [
      ...prev,
      {
        id: `chk-manual-${Date.now()}`,
        label: newChecklistLabel.trim(),
        category: newChecklistCategory,
        status: 'ok',
        serviceName: newChecklistServiceTag || undefined
      }
    ]);
    setNewChecklistLabel('');
    setIsAddingManualChecklist(false);
  };

  const handleToggleChecklistStatus = (id: string, newStatus: 'ok' | 'defeito' | 'nao_aplicavel') => {
    setChecklists(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const handleUpdateChecklistNotes = (id: string, notes: string) => {
    setChecklists(prev => prev.map(c => c.id === id ? { ...c, notes } : c));
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklists(prev => prev.filter(c => c.id !== id));
  };

  const handleAddService = () => {
    setServices(prev => [
      ...prev,
      { id: String(Date.now()), name: '', hours: 1, price: 150, isCustom: true }
    ]);
  };

  const handleAddPart = () => {
    setParts(prev => [
      ...prev,
      { id: `part-avulso-${Date.now()}`, name: '', cost: 0, price: 0, quantity: 1, unit: 'UN' }
    ]);
  };

  const handleAddRegisteredProduct = (product: Product, qtyInput?: number) => {
    const selectedClientObj = clients.find(c => c.id === clientId);
    const isWholesale = selectedClientObj?.customerType === 'atacado';
    const unitPrice = isWholesale
      ? Number(product.wholesalePrice || product.retailPrice || 0)
      : Number(product.retailPrice || 0);
    const qtyToAdd = Math.max(1, Number(qtyInput ?? selectedPartQty) || 1);

    setParts(prev => {
      const cleaned = prev.filter(p => p.name.trim() !== '');
      const existingIdx = cleaned.findIndex(p => p.productId === product.id);
      if (existingIdx >= 0) {
        return cleaned.map((p, i) =>
          i === existingIdx ? { ...p, quantity: Number(p.quantity || 0) + qtyToAdd } : p
        );
      }
      return [
        ...cleaned,
        {
          id: `part-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productId: product.id,
          name: product.name,
          cost: Number(product.costPrice || 0),
          price: unitPrice,
          quantity: qtyToAdd,
          unit: product.unit || 'UN'
        }
      ];
    });

    setPartSearchTerm('');
    setSelectedProductId('');
    setSelectedPartQty(1);
    setPartFeedback(`Produto "${product.name}" (${qtyToAdd} ${product.unit || 'UN'}) adicionado à OS!`);
    setTimeout(() => setPartFeedback(null), 3500);
  };

  const addDaysIso = (baseIso: string, days: number): string => {
    const clean = baseIso || getTodayIso();
    const d = new Date(`${clean}T12:00:00`);
    if (Number.isNaN(d.getTime())) return getTodayIso();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const getFeeRateForMethod = (method: PaymentMethod, brand: CardBrand = 'visa', inst: number = 1): number => {
    if (method === 'dinheiro' || method === 'boleto' || method === 'faturado_30d') return 0;
    const defaultOp = cardOperators.find(o => o.active) || cardOperators[0];
    if (method === 'pix') {
      return defaultOp ? defaultOp.pixRate : 0;
    }
    const brandRate = cardRates.find(r => r.brand === brand);
    if (method === 'cartao_debito') {
      return brandRate?.debitRate ?? defaultOp?.debitRate ?? 1.99;
    }
    if (method === 'cartao_credito') {
      if (inst <= 1) {
        return brandRate?.creditSightRate ?? defaultOp?.creditSightRate ?? 3.19;
      }
      const customInst = defaultOp?.installmentRates?.find(ir => ir.installment === inst);
      if (customInst) return customInst.rate;
      return brandRate?.creditInstallmentsRate ?? (inst <= 6 ? defaultOp?.creditInstallments2to6Rate : defaultOp?.creditInstallments7to12Rate) ?? 4.5;
    }
    return 0;
  };

  const buildPaymentSplitWithFees = (
    partial: Omit<PaymentSplit, 'netAmount'> & { netAmount?: number }
  ): PaymentSplit => {
    const amount = Math.max(0, Number(Number(partial.amount || 0).toFixed(2)));
    const brand = partial.cardBrand || 'visa';
    const inst = partial.installments || 1;
    const ratePercentage = getFeeRateForMethod(partial.method, brand, inst);
    const rateAmount = Number(((amount * ratePercentage) / 100).toFixed(2));
    const netAmount = Number((amount - rateAmount).toFixed(2));
    return {
      ...partial,
      cardBrand: partial.method === 'cartao_credito' || partial.method === 'cartao_debito' ? brand : undefined,
      installments: partial.method === 'cartao_credito' ? inst : undefined,
      ratePercentage,
      rateAmount,
      amount,
      netAmount
    };
  };

  const calculateSubtotal = () => {
    const srv = services.reduce((a, b) => a + Number(b.price || 0), 0);
    const prt = parts.reduce((a, b) => a + (Number(b.price || 0) * Number(b.quantity || 1)), 0);
    return srv + prt + Number(visitFee || 0);
  };

  const calculateDiscountAmount = (subtotal: number) => {
    if (discountType === 'percent') {
      return (subtotal * (Number(discountValue) || 0)) / 100;
    }
    return Number(discountValue) || 0;
  };

  const modalSubtotal = calculateSubtotal();
  const modalDiscount = calculateDiscountAmount(modalSubtotal);
  const modalGrandTotal = Math.max(0, Number((modalSubtotal - modalDiscount).toFixed(2)));

  // Mantém o pagamento padrão sincronizado automaticamente enquanto o usuário não personalizar ou dividir parcelas
  React.useEffect(() => {
    if (isNewModalOpen && !editingOSId && !hasCustomPayments) {
      setPayments(prev => {
        const base = prev[0] || {
          id: `pay-${Date.now()}`,
          method: 'pix' as PaymentMethod,
          entryType: 'vista' as PaymentEntryType,
          dueDate: getTodayIso(),
          status: 'pendente' as PaymentSplitStatus
        };
        return [
          buildPaymentSplitWithFees({
            ...base,
            amount: modalGrandTotal
          })
        ];
      });
    }
  }, [isNewModalOpen, editingOSId, hasCustomPayments, modalGrandTotal]);

  const handleGenerateInstallments = () => {
    const today = getTodayIso();
    const netTotal = modalGrandTotal;
    const rawEntry = Math.max(0, Number(String(calcEntryAmount).replace(',', '.')) || 0);
    const entryVal = Math.min(netTotal, Number(rawEntry.toFixed(2)));
    const remaining = Number((netTotal - entryVal).toFixed(2));
    const count = Math.max(1, Math.min(24, Math.floor(Number(calcInstallments) || 1)));
    const interval = Math.max(0, Math.floor(Number(calcIntervalDays) || 0));
    const baseDueDate = calcFirstDueDate || today;
    const entryDate = calcEntryDate || today;

    const generated: PaymentSplit[] = [];

    if (entryVal > 0) {
      generated.push(
        buildPaymentSplitWithFees({
          id: `pay-entry-${Date.now()}`,
          method: calcEntryMethod,
          cardBrand: calcEntryMethod === 'cartao_credito' || calcEntryMethod === 'cartao_debito' ? calcCardBrand : undefined,
          installments: calcEntryMethod === 'cartao_credito' ? 1 : undefined,
          entryType: 'entrada',
          dueDate: entryDate,
          status: calcEntryPaid ? 'pago' : 'pendente',
          paidAt: calcEntryPaid ? entryDate : undefined,
          notes: 'Entrada',
          amount: entryVal
        })
      );
    }

    if (remaining > 0 || generated.length === 0) {
      const totalCents = Math.round(remaining * 100);
      const baseCents = Math.floor(totalCents / count);
      const remainderCents = totalCents - baseCents * count;

      for (let i = 0; i < count; i++) {
        const cents = baseCents + (i === 0 ? remainderCents : 0);
        const amount = Number((cents / 100).toFixed(2));
        const dueDate = addDaysIso(baseDueDate, i * interval);
        const isSingleSight = count === 1 && entryVal === 0;

        generated.push(
          buildPaymentSplitWithFees({
            id: `pay-inst-${Date.now()}-${i + 1}`,
            method: calcInstallmentMethod,
            cardBrand:
              calcInstallmentMethod === 'cartao_credito' || calcInstallmentMethod === 'cartao_debito'
                ? calcCardBrand
                : undefined,
            installments: calcInstallmentMethod === 'cartao_credito' ? 1 : undefined,
            entryType: isSingleSight ? 'vista' : 'parcela',
            installmentNumber: isSingleSight ? undefined : i + 1,
            totalInstallments: isSingleSight ? undefined : count,
            dueDate,
            status: 'pendente',
            notes: isSingleSight ? 'Pagamento Integral' : `Parcela ${i + 1}/${count}`,
            amount
          })
        );
      }
    }

    setPayments(generated);
    setHasCustomPayments(true);
  };

  const handleAddSplitPayment = () => {
    const today = getTodayIso();
    const allocated = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const remaining = Math.max(0, Number((modalGrandTotal - allocated).toFixed(2)));
    const nextIdx = payments.filter(p => p.entryType !== 'entrada').length + 1;
    setHasCustomPayments(true);
    setPayments(prev => [
      ...prev,
      buildPaymentSplitWithFees({
        id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        method: 'dinheiro',
        entryType: 'parcela',
        installmentNumber: nextIdx,
        dueDate: today,
        status: 'pendente',
        notes: `Parcela ${nextIdx}`,
        amount: remaining > 0 ? remaining : 0
      })
    ]);
  };

  const handleUpdatePaymentRow = (idx: number, patch: Partial<PaymentSplit>) => {
    setHasCustomPayments(true);
    setPayments(prev =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const merged = { ...item, ...patch };
        if (patch.status === 'pago' && !merged.paidAt) {
          merged.paidAt = merged.dueDate || getTodayIso();
        }
        if (patch.status === 'pendente') {
          merged.paidAt = undefined;
        }
        return buildPaymentSplitWithFees(merged);
      })
    );
  };

  const handleRemovePaymentRow = (idx: number) => {
    setHasCustomPayments(true);
    setPayments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleBalanceRemainingToLastPending = () => {
    if (payments.length === 0) {
      handleAddSplitPayment();
      return;
    }
    const allocated = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const diff = Number((modalGrandTotal - allocated).toFixed(2));
    if (Math.abs(diff) < 0.01) return;

    const pendingIndices = payments
      .map((p, idx) => (p.status !== 'pago' ? idx : -1))
      .filter(idx => idx !== -1);
    const targetIdx = pendingIndices.length > 0 ? pendingIndices[pendingIndices.length - 1] : payments.length - 1;

    setHasCustomPayments(true);
    setPayments(prev =>
      prev.map((p, idx) => {
        if (idx !== targetIdx) return p;
        const nextAmount = Math.max(0, Number((Number(p.amount || 0) + diff).toFixed(2)));
        return buildPaymentSplitWithFees({ ...p, amount: nextAmount });
      })
    );
  };

  const handleOpenNewOS = () => {
    const today = getTodayIso();
    setEditingOSId(null);
    setEditingOSCode(null);
    setStatus('orcamento_aberto');
    setContractReference('');
    setForecastDate(today);
    setCompletionDate('');
    setHasCustomPayments(false);
    setCalcEntryAmount('');
    setCalcEntryMethod('dinheiro');
    setCalcEntryDate(today);
    setCalcEntryPaid(true);
    setCalcInstallmentMethod('cartao_credito');
    setCalcCardBrand('visa');
    setCalcInstallments(3);
    setCalcFirstDueDate(today);
    setCalcIntervalDays(30);
    setPayments([
      buildPaymentSplitWithFees({
        id: `pay-${Date.now()}`,
        method: 'pix',
        entryType: 'vista',
        dueDate: today,
        status: 'pendente',
        amount: modalGrandTotal
      })
    ]);
    setPartSearchTerm('');
    setSelectedProductId('');
    setSelectedPartQty(1);
    setPartFeedback(null);
    setEntryPhotos([]);
    setExitPhotos([]);
    if (!clientId && clients[0]?.id) {
      setClientId(clients[0].id);
    }
    setIsNewModalOpen(true);
  };

  const handleOpenEdit = (os: ServiceOrder) => {
    const today = getTodayIso();
    setEditingOSId(os.id);
    setEditingOSCode(os.code);
    setClientId(os.clientId);
    setSelectedAddressId('');
    setEmployeeId(os.employeeId);
    setVehicleId(os.vehicleId || '');
    setKmDriven(os.kmDriven || 0);
    setDescription(os.description || '');
    setForecastDate(os.forecastDate || today);
    setCompletionDate(os.completionDate || '');
    setStatus(os.status);
    setContractReference(os.contractReference || '');
    setEquipmentType(os.equipmentType || '');
    setEquipmentModel(os.equipmentModel || '');
    setEquipmentSerial(os.equipmentSerial || '');
    setEquipmentYear(os.equipmentYear || '');
    setWarrantyPeriodDays(os.warrantyPeriodDays || 90);
    setVisitFee(os.visitFee || 0);
    setDiscountType(os.discountType || 'fixed');
    setDiscountValue(os.discountValue || 0);
    setServices(os.services && os.services.length > 0 ? os.services : [{ id: '1', name: '', hours: 1, price: 0 }]);
    setParts(os.parts && os.parts.length > 0 ? os.parts : []);
    setChecklists(os.checklists && os.checklists.length > 0 ? os.checklists : []);
    setEntryPhotos(os.entryPhotos && os.entryPhotos.length > 0 ? [...os.entryPhotos] : []);
    setExitPhotos(os.exitPhotos && os.exitPhotos.length > 0 ? [...os.exitPhotos] : []);

    const srvTotal = (os.services || []).reduce((a, b) => a + Number(b.price || 0), 0);
    const prtTotal = (os.parts || []).reduce((a, b) => a + Number(b.price || 0) * Number(b.quantity || 1), 0);
    const osTotal = Math.max(0, Number((srvTotal + prtTotal + Number(os.visitFee || 0) - Number(os.calculatedDiscount || 0)).toFixed(2)));

    if (os.payments && os.payments.length > 0) {
      setPayments(
        os.payments.map((p, i) => ({
          ...p,
          id: p.id || `pay-edit-${Date.now()}-${i}`,
          entryType: p.entryType || (os.payments!.length > 1 ? 'parcela' : 'vista'),
          dueDate: p.dueDate || os.openDate || today,
          status: p.status || (os.paymentStatus === 'pago' ? 'pago' : 'pendente')
        }))
      );
      setHasCustomPayments(true);
    } else {
      setPayments([
        buildPaymentSplitWithFees({
          id: `pay-${Date.now()}`,
          method: os.paymentMethod || 'pix',
          entryType: 'vista',
          dueDate: os.openDate || today,
          status: os.paymentStatus === 'pago' ? 'pago' : 'pendente',
          paidAt: os.paymentStatus === 'pago' ? os.settledInPdvAt?.split('T')[0] || today : undefined,
          amount: osTotal
        })
      ]);
      setHasCustomPayments(false);
    }

    setCalcEntryAmount('');
    setCalcEntryDate(today);
    setCalcFirstDueDate(today);
    setPartSearchTerm('');
    setSelectedProductId('');
    setSelectedPartQty(1);
    setPartFeedback(null);
    setIsNewModalOpen(true);
  };

  const executePrintOS = (os: ServiceOrder, includeWarranty: boolean) => {
    const prevTitle = document.title;
    const printDocTitle = `OS-${os.code}`;
    document.title = printDocTitle;
    setPrintIncludeWarranty(includeWarranty);
    setSelectedOSForDetail(os);

    const onAfterPrint = () => {
      window.removeEventListener('afterprint', onAfterPrint);
      setTimeout(() => {
        if (!selectedOSForDetail) {
          document.title = prevTitle || 'FIRE GESTÃO';
        }
      }, 3000);
    };
    window.addEventListener('afterprint', onAfterPrint);

    setTimeout(() => {
      window.print();
    }, 380);
  };

  const handlePrintOS = (os: ServiceOrder) => {
    const warrantyInfo = resolveServiceOrderWarrantyTerm(os, warrantyPolicies, companySettings);
    if (warrantyInfo.canGenerateWarrantyTerm) {
      const financials = calculateServiceOrderFinancials(os, getPaidAmountForSource('os', os.id));
      setWarrantyPromptState({
        os,
        mode: 'print',
        policyName: warrantyInfo.policyName,
        days: warrantyInfo.days,
        remainingBalance: financials.remainingBalance
      });
      return;
    }
    executePrintOS(os, false);
  };

  const executeDownloadOS = async (os: ServiceOrder, includeWarranty: boolean) => {
    const escapeHtml = (val?: string) =>
      (val || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const activeParts = (os.parts || []).filter(p => p.name && p.name.trim() !== '');
    const activeServices = (os.services || []).filter(s => s.name && s.name.trim() !== '');
    const hasParts = activeParts.length > 0;
    const hasServices = activeServices.length > 0;

    const financials = calculateServiceOrderFinancials(os, getPaidAmountForSource('os', os.id));
    const {
      partsTotal,
      servicesTotal: srvTotal,
      visitFee,
      discount,
      grandTotal,
      totalPaid,
      remainingBalance: totalDue,
      hasDefinedValue,
      isFullyPaid
    } = financials;

    const pixInfo = buildCompanyCnpjPixBrCode({
      company: companySettings,
      amount: hasDefinedValue && !isFullyPaid ? totalDue : null,
      txidSource: os.code
    });
    const pixQrPng = !isFullyPaid ? await generatePixQrDataUrl(pixInfo.payload, 240) : '';

    const warrantyInfo = resolveServiceOrderWarrantyTerm(os, warrantyPolicies, companySettings);
    const shouldRenderWarrantyPage = includeWarranty && warrantyInfo.canGenerateWarrantyTerm;

    const companyDisplayName = companySettings.tradeName || companySettings.companyName || 'FIRE GESTÃO';
    const companyAddressLine =
      [
        [companySettings.street, companySettings.number].filter(Boolean).join(', '),
        companySettings.neighborhood,
        companySettings.city ? `${companySettings.city} / ${companySettings.state || ''}` : ''
      ]
        .filter(Boolean)
        .join(' - ') || 'Endereço Comercial Cadastrado';
    const companyContactLine = [
      companySettings.phone ? `Tel: ${companySettings.phone}` : '',
      companySettings.email ? `E-mail: ${companySettings.email}` : '',
      companySettings.cnpj ? `CNPJ: ${companySettings.cnpj}` : ''
    ]
      .filter(Boolean)
      .join(' | ');

    const addressParts = (os.clientAddress || '').split(' - ');
    const streetPart = addressParts[0] || os.clientAddress || '';
    const cityStatePart =
      addressParts[1] ||
      (companySettings.city ? `${companySettings.city} / ${companySettings.state || ''}` : '-');
    const technician = employees.find(e => e.id === os.employeeId)?.name || 'Equipe Técnica';
    const safeContractRef = escapeHtml(os.contractReference);

    const buildStandardHeaderHtml = (badgeLabel: string, subLabel: string) => `
  <div class="header">
    <div style="display: flex; align-items: center; gap: 12px;">
      ${
        companySettings.logoUrl
          ? `<img src="${companySettings.logoUrl}" alt="${escapeHtml(companyDisplayName)}" style="max-height: 54px; max-width: 140px; object-fit: contain; border-radius: 6px; flex-shrink: 0;" />`
          : `<div style="width: 50px; height: 50px; border-radius: 8px; background: linear-gradient(135deg, #f59e0b, #ea580c); display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; flex-shrink: 0;">
              <span style="font-size: 16px; font-weight: 900; line-height: 1;">${escapeHtml(companyDisplayName.slice(0, 2).toUpperCase())}</span>
              <span style="font-size: 6px; font-weight: 900; letter-spacing: 0.5px; margin-top: 2px;">${escapeHtml(companyDisplayName.slice(0, 8).toUpperCase())}</span>
            </div>`
      }
      <div>
        <h1 class="company-title">${escapeHtml(companyDisplayName)}</h1>
        ${
          companySettings.companyName && companySettings.companyName !== companySettings.tradeName
            ? `<div class="company-sub" style="color: #0f172a; font-weight: bold;">${escapeHtml(companySettings.companyName)}</div>`
            : ''
        }
        <div class="company-sub">${escapeHtml(companyAddressLine)}</div>
        ${
          companyContactLine
            ? `<div class="company-sub" style="color: #0f172a; font-weight: bold;">${escapeHtml(companyContactLine)}</div>`
            : ''
        }
      </div>
    </div>

    <div style="border: 2px solid #0f172a; border-radius: 8px; overflow: hidden; background: #fff; text-align: center; min-width: 190px; flex-shrink: 0;">
      <div style="background: #0f172a; color: #fff; padding: 4px 8px; font-size: 9.5px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">
        ${escapeHtml(badgeLabel)}
      </div>
      <div style="padding: 5px 8px; background: #f8fafc;">
        <div style="font-size: 18px; font-weight: 900; font-family: monospace; color: #0f172a; letter-spacing: 1px;">
          OS Nº ${escapeHtml(os.code)}
        </div>
        <div style="font-size: 8px; color: #475569; font-weight: bold; margin-top: 1px; text-transform: uppercase;">
          ${escapeHtml(subLabel)}
        </div>
      </div>
    </div>
  </div>`;

    const buildClientCardHtml = () => `
    <div class="card" style="margin-bottom: 0;">
      <div class="card-header">DADOS DO CLIENTE</div>
      <div class="card-body">
        <div><span class="label">NOME: </span><span style="font-weight: bold; text-transform: uppercase;">${escapeHtml(os.clientName)}</span></div>
        <div style="display: flex; justify-content: space-between; margin-top: 3px;">
          <div><span class="label">CPF/CNPJ: </span>${escapeHtml(os.clientDocument) || '-'}</div>
          <div><span class="label">TEL: </span>${escapeHtml(os.clientPhone) || '-'}</div>
        </div>
        <div style="margin-top: 3px;"><span class="label">END.: </span>${escapeHtml(streetPart) || '-'}</div>
        <div style="margin-top: 3px;"><span class="label">CIDADE: </span>${escapeHtml(cityStatePart)}</div>
      </div>
    </div>`;

    const mainBadgeLabel =
      os.status === 'orcamento_aberto' || os.status === 'aguardando_aprovacao'
        ? 'ORÇAMENTO & PROPOSTA'
        : 'ORDEM DE SERVIÇO';

    const warrantyPageHtml = shouldRenderWarrantyPage
      ? `
  <div class="warranty-page">
    ${buildStandardHeaderHtml('TERMO DE GARANTIA', `Vinculado à OS Nº ${os.code}`)}

    <div class="grid-2">
      ${buildClientCardHtml()}
      <div class="card" style="margin-bottom: 0;">
        <div class="card-header">DETALHES DA GARANTIA</div>
        <div class="card-body">
          <div><span class="label">POLÍTICA / MODALIDADE: </span><span style="font-weight: bold;">${escapeHtml(warrantyInfo.policyName)}</span></div>
          <div style="display: flex; justify-content: space-between; margin-top: 3px;">
            <div><span class="label">PRAZO: </span><strong>${warrantyInfo.days > 0 ? `${warrantyInfo.days} Dias` : 'Conforme Termo'}</strong></div>
            <div><span class="label">VALIDADE: </span>${warrantyInfo.expiresAt ? formatDateBR(warrantyInfo.expiresAt) : 'A partir da entrega'}</div>
          </div>
          <div style="margin-top: 3px;"><span class="label">STATUS DA OS: </span><strong style="color: #065f46;">Entregue / Finalizada</strong></div>
          ${totalDue > 0.01 ? `<div style="margin-top: 4px; padding: 3px 6px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 3px; font-size: 9px; color: #78350f;"><strong>Situação Financeira:</strong> Saldo pendente de <span style="font-family: monospace; font-weight: bold;">${formatBRL(totalDue)}</span> (garantia liberada pela finalização da OS).</div>` : ''}
          <div style="margin-top: 3px;"><span class="label">EQUIPAMENTO: </span>${escapeHtml(os.equipmentType || '-')}${os.equipmentModel ? ` · ${escapeHtml(os.equipmentModel)}` : ''}${os.equipmentSerial ? ` (S/N: ${escapeHtml(os.equipmentSerial)})` : ''}</div>
          ${safeContractRef ? `<div style="margin-top: 3px;"><span class="label">REF. CONTRATO: </span><strong>${safeContractRef}</strong></div>` : ''}
        </div>
      </div>
    </div>

    <div class="card" style="border: 2px solid #0f172a;">
      <div style="background: #0f172a; color: #fff; padding: 6px 10px; font-size: 10px; font-weight: 900; text-transform: uppercase; display: flex; justify-content: space-between;">
        <span>CLÁUSULAS E CONDIÇÕES DO TERMO DE GARANTIA</span>
        <span style="font-family: monospace; color: #fcd34d;">OS Nº ${escapeHtml(os.code)}</span>
      </div>
      <div class="card-body" style="padding: 12px; font-size: 10.5px; line-height: 1.5; white-space: pre-line; min-height: 240px;">
        ${escapeHtml(warrantyInfo.termsText)}
      </div>
    </div>

    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px 10px; font-size: 9.5px; color: #334155; margin-bottom: 14px;">
      Declaro estar ciente e de acordo com todos os prazos, coberturas e exclusões descritas neste Termo de Garantia, referente aos serviços e/ou peças executados na <strong>Ordem de Serviço Nº ${escapeHtml(os.code)}</strong>.
    </div>

    <div class="signature-area">
      <div>
        ${os.signature ? `<div style="margin-bottom: -15px;"><img src="${os.signature.signatureDataUrl}" style="height: 35px;" /></div>` : ''}
        <div class="sig-line">${escapeHtml(os.clientName)}</div>
        <div style="font-size: 9px; color: #64748b;">Ciência e Assinatura do Cliente</div>
      </div>
      <div>
        <div style="font-family: serif; font-style: italic; color: #1e293b; font-weight: bold; margin-bottom: -15px;">${escapeHtml(companyDisplayName)}</div>
        <div class="sig-line">${escapeHtml(companyDisplayName)}</div>
        <div style="font-size: 9px; color: #64748b;">Responsável pela Garantia</div>
      </div>
    </div>
  </div>`
      : '';

    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>OS-${escapeHtml(os.code)}</title>
  <style>
    @page { size: A4 portrait; margin: 6mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 15px; color: #1f2937; margin: 0; background: #fff; font-size: 10.5px; line-height: 1.25; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 8px; gap: 12px; }
    .company-title { font-size: 20px; font-weight: 900; text-transform: uppercase; color: #0f172a; margin: 0; line-height: 1; }
    .company-sub { font-size: 9px; color: #4b5563; font-weight: 500; text-transform: uppercase; margin: 1px 0; }
    .card { border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
    .card-header { background: #eef3f8; padding: 4px 8px; font-size: 9.5px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; color: #1e293b; letter-spacing: 0.5px; }
    .card-body { padding: 6px 8px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
    .label { font-weight: bold; color: #334155; }
    table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
    th { background: #f8fafc; border-bottom: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; font-weight: bold; color: #1e293b; }
    td { padding: 4px 6px; border-bottom: 1px solid #e2e8f0; }
    .finance-row-total { background: #e8f5e9; font-weight: 900; }
    .finance-row-due { background: ${totalDue > 0.01 ? '#ffebee' : '#e8f5e9'}; font-weight: 900; color: ${totalDue > 0.01 ? '#991b1b' : '#166534'}; }
    .signature-area { margin-top: 20px; border-top: 1px solid #cbd5e1; padding-top: 10px; display: grid; grid-template-columns: 1fr 1fr; text-align: center; }
    .sig-line { width: 200px; border-top: 1px solid #0f172a; margin: 20px auto 3px auto; font-weight: bold; font-size: 10.5px; text-transform: uppercase; }
    .warranty-page { page-break-before: always; break-before: page; padding-top: 8px; }
  </style>
</head>
<body>
  ${buildStandardHeaderHtml(mainBadgeLabel, `Emissão: ${formatDateBR(os.openDate)}`)}

  <div class="grid-2">
    ${buildClientCardHtml()}

    <div class="card" style="margin-bottom: 0;">
      <div class="card-header">PRAZOS E RESPONSÁVEL</div>
      <div class="card-body">
        <div style="display: flex; justify-content: space-between;">
          <div><span class="label">ENTRADA: </span>${formatDateBR(os.openDate)}</div>
          <div><span class="label">PREVISÃO: </span>${formatDateBR(os.forecastDate)}</div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 3px;">
          <div><span class="label">ENTREGA SERVIÇOS: </span>${os.completionDate ? formatDateBR(os.completionDate) : 'Em andamento'}</div>
          <div><span class="label">GARANTIA: </span>${os.warrantyPeriodDays} Dias</div>
        </div>
        <div style="margin-top: 3px;">
          <span class="label">TÉCNICO: </span><span style="font-weight: bold; text-transform: uppercase;">${escapeHtml(technician)}</span>
        </div>
        ${safeContractRef ? `<div style="margin-top: 3px;"><span class="label">REF. CONTRATO: </span><span style="font-weight: bold;">${safeContractRef}</span></div>` : ''}
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header">EQUIPAMENTO E DIAGNÓSTICO</div>
    <div class="card-body">
      <div>
        <span class="label">EQUIPAMENTO: </span>
        <span style="font-weight: bold;">${escapeHtml(os.equipmentType || 'Equipamento / Estrutura atendida')}${os.equipmentModel ? ` · ${escapeHtml(os.equipmentModel)}` : ''}${os.equipmentSerial ? ` (S/N: ${escapeHtml(os.equipmentSerial)})` : ''}</span>
      </div>
      <div style="margin-top: 6px;">
        <div style="background: #f1f5f9; padding: 2px 6px; font-size: 9px; font-weight: bold; color: #475569; text-transform: uppercase; border: 1px solid #e2e8f0;">
          DEFEITO RELATADO / DESCRIÇÃO DOS SERVIÇOS:
        </div>
        <div style="padding: 4px 6px; font-weight: 500;">
          ${escapeHtml(os.description || 'Manutenção / Serviço Técnico')}
        </div>
      </div>
    </div>
  </div>

  ${hasParts && hasServices ? `
    <div class="grid-2" style="margin-top: 8px;">
      <div class="card" style="margin-bottom: 0;">
        <div class="card-header">PEÇAS / PRODUTOS</div>
        <table>
          <thead><tr><th>DESCRIÇÃO</th><th style="text-align: center; width: 45px;">QTD</th><th style="text-align: right; width: 75px;">TOTAL</th></tr></thead>
          <tbody>
            ${activeParts.map(p => `<tr><td>${escapeHtml(p.name)}</td><td style="text-align: center; font-family: monospace;">${Number(p.quantity).toFixed(2)}</td><td style="text-align: right; font-family: monospace;">${formatBRL(Number(p.price || 0) * Number(p.quantity || 1))}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="card" style="margin-bottom: 0;">
        <div class="card-header">MÃO DE OBRA</div>
        <table>
          <thead><tr><th>DESCRIÇÃO</th><th style="text-align: center; width: 45px;">QTD</th><th style="text-align: right; width: 75px;">TOTAL</th></tr></thead>
          <tbody>
            ${activeServices.map(s => `<tr><td>${escapeHtml(s.name)}</td><td style="text-align: center; font-family: monospace;">${Number(s.hours || 1).toFixed(2)}</td><td style="text-align: right; font-family: monospace;">${formatBRL(Number(s.price || 0))}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  ` : hasParts ? `
    <div class="card" style="margin-top: 8px;">
      <div class="card-header">PEÇAS / PRODUTOS (VENDA)</div>
      <table>
        <thead><tr><th>DESCRIÇÃO</th><th style="text-align: center; width: 55px;">QTD</th><th style="text-align: right; width: 85px;">UNITÁRIO</th><th style="text-align: right; width: 85px;">TOTAL</th></tr></thead>
        <tbody>
          ${activeParts.map(p => `<tr><td style="font-weight: 500;">${escapeHtml(p.name)}</td><td style="text-align: center; font-family: monospace;">${Number(p.quantity).toFixed(2)}</td><td style="text-align: right; font-family: monospace;">${formatBRL(Number(p.price || 0))}</td><td style="text-align: right; font-family: monospace; font-weight: bold;">${formatBRL(Number(p.price || 0) * Number(p.quantity || 1))}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  ` : hasServices ? `
    <div class="card" style="margin-top: 8px;">
      <div class="card-header">MÃO DE OBRA (SERVIÇOS)</div>
      <table>
        <thead><tr><th>DESCRIÇÃO DO SERVIÇO</th><th style="text-align: center; width: 65px;">HORAS/QTD</th><th style="text-align: right; width: 85px;">TOTAL</th></tr></thead>
        <tbody>
          ${activeServices.map(s => `<tr><td style="font-weight: 500;">${escapeHtml(s.name)}</td><td style="text-align: center; font-family: monospace;">${Number(s.hours || 1).toFixed(2)}</td><td style="text-align: right; font-family: monospace; font-weight: bold;">${formatBRL(Number(s.price || 0))}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  ` : ''}

  <div class="grid-2" style="margin-top: 8px;">
    <div class="card" style="margin-bottom: 0;">
      <div class="card-header">RESUMO FINANCEIRO</div>
      <table style="font-family: monospace;">
        <tbody>
          ${hasParts ? `<tr><td style="font-family: sans-serif;">Total Produtos</td><td style="text-align: right;">${formatBRL(partsTotal)}</td></tr>` : ''}
          ${hasServices ? `<tr><td style="font-family: sans-serif;">Total Serviços</td><td style="text-align: right;">${formatBRL(srvTotal)}</td></tr>` : ''}
          ${visitFee > 0 ? `<tr><td style="font-family: sans-serif;">Taxa de Visita Técnica</td><td style="text-align: right;">${formatBRL(visitFee)}</td></tr>` : ''}
          ${discount > 0 ? `<tr style="color: #b91c1c;"><td style="font-family: sans-serif;">Desconto Concedido</td><td style="text-align: right;">-${formatBRL(discount)}</td></tr>` : ''}
          <tr class="finance-row-total">
            <td style="font-family: sans-serif; font-weight: 900;">VALOR TOTAL DA OS</td>
            <td style="text-align: right; font-weight: 900;">${formatBRL(grandTotal)}</td>
          </tr>
          <tr>
            <td style="font-family: sans-serif; font-weight: bold;">TOTAL PAGO</td>
            <td style="text-align: right; font-weight: bold; color: #166534;">${formatBRL(totalPaid)}</td>
          </tr>
          <tr class="finance-row-due">
            <td style="font-family: sans-serif; font-weight: 900;">SALDO RESTANTE A PAGAR</td>
            <td style="text-align: right; font-weight: 900;">${formatBRL(totalDue)}</td>
          </tr>
        </tbody>
      </table>
      ${(os.payments && os.payments.length > 0) ? `
        <div style="border-top: 1px solid #cbd5e1; padding: 5px 8px; background: #f8fafc;">
          <div style="font-size: 8.5px; font-weight: bold; text-transform: uppercase; color: #334155; margin-bottom: 3px;">LANÇAMENTOS E PARCELAS</div>
          <table style="font-size: 8.5px;">
            <tbody>
              ${os.payments.map((p, idx) => {
                const tipoLabel = p.entryType === 'entrada' ? 'Entrada' : p.entryType === 'parcela' ? `Parcela ${p.installmentNumber || idx + 1}${p.totalInstallments ? '/' + p.totalInstallments : ''}` : 'À Vista';
                const methodLabel = p.method === 'pix' ? 'PIX' : p.method === 'dinheiro' ? 'Dinheiro' : p.method === 'cartao_credito' ? 'Crédito' : p.method === 'cartao_debito' ? 'Débito' : p.method === 'boleto' ? 'Boleto' : 'Faturado 30d';
                const statusLabel = p.status === 'pago' ? `Pago${p.paidAt ? ' em ' + formatDateBR(p.paidAt) : ''}` : `Venc. ${p.dueDate ? formatDateBR(p.dueDate) : '-'}`;
                return `<tr>
                  <td><strong>${tipoLabel}</strong> · ${methodLabel}</td>
                  <td style="color: ${p.status === 'pago' ? '#166534' : '#475569'};">${statusLabel}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold;">${formatBRL(Number(p.amount || 0))}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    </div>

    <div class="card" style="margin-bottom: 0; border: 2px solid #0f172a; text-align: center; display: flex; flex-direction: column;">
      <div style="background: #0f172a; color: #fff; padding: 5px 8px; font-size: 9.5px; font-weight: 900; text-transform: uppercase; display: flex; justify-content: space-between;">
        <span>Pague via PIX (Chave CNPJ)</span>
        <span style="font-family: monospace; color: #6ee7b7;">BR Code</span>
      </div>
      <div class="card-body" style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; padding: 10px;">
        ${
          isFullyPaid
            ? `<div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 12px; width: 100%;">
                <div style="font-size: 11px; font-weight: 900; color: #065f46; text-transform: uppercase;">OS 100% Quitada</div>
                <div style="font-size: 16px; font-weight: 900; font-family: monospace; color: #047857; margin-top: 2px;">Saldo: ${formatBRL(0)}</div>
                <div style="font-size: 9px; color: #065f46; margin-top: 4px;">Chave CNPJ: ${escapeHtml(pixInfo.pixKeyDisplay)}</div>
              </div>`
            : `${pixQrPng ? `<div style="border: 2px solid #0f172a; padding: 4px; border-radius: 6px; width: 118px; height: 118px; margin: 0 auto 6px auto; background: #fff;"><img src="${pixQrPng}" alt="QR Code PIX" style="width: 100%; height: 100%; object-fit: contain;" /></div>` : ''}
               <div style="font-weight: 900; font-size: 10.5px; color: #0f172a; text-transform: uppercase;">Pague via PIX (Chave CNPJ)</div>
               ${
                 hasDefinedValue
                   ? `<div style="margin: 4px 0; padding: 3px 10px; background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 4px; font-weight: 900; font-size: 12px; font-family: monospace; color: #065f46;">Saldo a Pagar: ${formatBRL(totalDue)}</div>`
                   : `<div style="margin: 4px 0; padding: 3px 8px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 4px; font-weight: bold; font-size: 9px; color: #92400e;">QR Code Estático · Valor em aberto (digite no app do banco)</div>`
               }
               <div style="font-weight: bold; font-size: 9.5px; color: #1e293b;">Chave CNPJ: <span style="font-family: monospace;">${escapeHtml(pixInfo.pixKeyDisplay)}</span></div>
               <div style="font-size: 8.5px; color: #64748b;">Favorecido: ${escapeHtml(companyDisplayName)}</div>`
        }
      </div>
    </div>
  </div>

  <div class="signature-area">
    <div>
      ${os.signature ? `<div style="margin-bottom: -15px;"><img src="${os.signature.signatureDataUrl}" style="height: 35px;" /></div>` : ''}
      <div class="sig-line">${escapeHtml(os.clientName)}</div>
      <div style="font-size: 9px; color: #64748b;">Assinatura do Cliente</div>
    </div>
    <div>
      <div style="font-family: serif; font-style: italic; color: #1e293b; font-weight: bold; margin-bottom: -15px;">${escapeHtml(companyDisplayName)}</div>
      <div class="sig-line">${escapeHtml(companyDisplayName)}</div>
      <div style="font-size: 9px; color: #64748b;">Assinatura do Responsável Técnico</div>
    </div>
  </div>

  ${warrantyPageHtml}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OS-${os.code}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadOS = (os: ServiceOrder) => {
    const warrantyInfo = resolveServiceOrderWarrantyTerm(os, warrantyPolicies, companySettings);
    if (warrantyInfo.canGenerateWarrantyTerm) {
      const financials = calculateServiceOrderFinancials(os, getPaidAmountForSource('os', os.id));
      setWarrantyPromptState({
        os,
        mode: 'download',
        policyName: warrantyInfo.policyName,
        days: warrantyInfo.days,
        remainingBalance: financials.remainingBalance
      });
      return;
    }
    void executeDownloadOS(os, false);
  };

  const handleOpenPDV = (os: ServiceOrder) => {
    setChargingOS(os);
    setPdvSuccessMessage(null);
    setPdvReceiptNotes('');
    const pendingSplits = (os.payments || []).filter(p => p.status !== 'pago');
    const firstPending = pendingSplits[0] || os.payments?.[0];
    setPdvPaymentMethod(firstPending?.method || os.paymentMethod || 'pix');
    setPdvCardBrand(firstPending?.cardBrand || 'visa');
    setPdvInstallments(firstPending?.installments || 1);
    setPdvAuthCode('');
    setCopiedPix(false);

    const srvTotal = os.services.reduce((a, s) => a + Number(s.price || 0), 0);
    const prtTotal = os.parts.reduce((a, p) => a + (Number(p.price || 0) * Number(p.quantity || 1)), 0);
    const grandTotal = Math.max(0, srvTotal + prtTotal + Number(os.visitFee || 0) - Number(os.calculatedDiscount || 0));
    const paidSoFar = getPaidAmountForSource('os', os.id);
    const remaining = Math.max(0, Number((grandTotal - paidSoFar).toFixed(2))) || grandTotal;

    setPdvPayMode('full');
    setPdvPartialAmount(remaining);
    setPdvSelectedSplitId(firstPending?.id || null);
    setPdvCashReceived(remaining);
    if (os.payments && os.payments.length > 0 && paidSoFar <= 0) {
      setIsMultiSplit(os.payments.length > 1);
      setPdvSplits(os.payments);
    } else {
      setIsMultiSplit(false);
      setPdvSplits([
        { id: 'split-1', method: firstPending?.method || 'pix', amount: remaining, netAmount: remaining }
      ]);
    }
  };

  const handleSendToPDVTerminal = () => {
    if (!chargingOS) return;
    const terminalName =
      pdvTerminal === 'caixa_01' || pdvTerminal === 'pdv-01'
        ? 'Caixa 01 - Balcão Principal'
        : pdvTerminal === 'caixa_02' || pdvTerminal === 'pdv-02'
        ? 'Caixa 02 - Vendas Rápidas / Atacado'
        : pdvTerminal === 'caixa_retirada'
        ? 'Caixa 03 - Retirada & Assistência Técnica'
        : 'PDV Móvel - Maquininha Campo';
    sendOrderToPdv(chargingOS.id, terminalName);
    setPdvSuccessMessage(`Fatura ${chargingOS.code} enviada com sucesso para a fila do ${terminalName}! Aguardando liquidação no caixa.`);
  };

  const handleSettleInPDV = () => {
    if (!chargingOS) return;
    const srvTotal = chargingOS.services.reduce((a, s) => a + Number(s.price || 0), 0);
    const prtTotal = chargingOS.parts.reduce((a, p) => a + (Number(p.price || 0) * Number(p.quantity || 1)), 0);
    const grandTotal = Math.max(0, srvTotal + prtTotal + Number(chargingOS.visitFee || 0) - Number(chargingOS.calculatedDiscount || 0));
    const paidSoFar = getPaidAmountForSource('os', chargingOS.id);
    const remaining = Math.max(0, Number((grandTotal - paidSoFar).toFixed(2))) || grandTotal;

    let amountToSettle = remaining;
    if (pdvPayMode === 'partial') {
      amountToSettle = Math.max(0.01, Math.min(remaining, Number(pdvPartialAmount) || remaining));
    } else if (pdvPayMode === 'installment' && pdvSelectedSplitId) {
      const sp = (chargingOS.payments || []).find(p => p.id === pdvSelectedSplitId);
      if (sp) amountToSettle = Math.min(remaining, Number(sp.amount || remaining));
    }

    let ratePct = 0;
    let rateAmount = 0;
    let netAmount = amountToSettle;
    if (pdvPaymentMethod === 'cartao_credito') {
      const matchedRate = cardRates.find(r => r.brand === pdvCardBrand);
      ratePct = pdvInstallments === 1 
        ? (matchedRate?.creditSightRate || 3.5) 
        : (matchedRate?.creditInstallmentsRate || 5.2);
      rateAmount = Number(((amountToSettle * ratePct) / 100).toFixed(2));
      netAmount = Number((amountToSettle - rateAmount).toFixed(2));
    }

    const finalPayments: PaymentSplit[] = isMultiSplit && pdvSplits.length > 0 && pdvPayMode === 'full'
      ? pdvSplits 
      : [{
          id: `pay-${Date.now()}`,
          method: pdvPaymentMethod,
          cardBrand: pdvPaymentMethod.includes('cartao') ? pdvCardBrand : undefined,
          installments: pdvPaymentMethod === 'cartao_credito' ? pdvInstallments : undefined,
          ratePercentage: ratePct,
          rateAmount,
          amount: amountToSettle,
          netAmount
        }];

    const terminalName =
      pdvTerminal === 'caixa_01' || pdvTerminal === 'pdv-01'
        ? 'Caixa 01 - Balcão Principal'
        : pdvTerminal === 'caixa_02' || pdvTerminal === 'pdv-02'
        ? 'Caixa 02 - Vendas Rápidas / Atacado'
        : pdvTerminal === 'caixa_retirada'
        ? 'Caixa 03 - Retirada & Assistência Técnica'
        : 'PDV Móvel - Maquininha Campo';

    const paymentKind =
      pdvPayMode === 'installment'
        ? 'parcela'
        : amountToSettle >= remaining - 0.01
        ? paidSoFar > 0
          ? 'quitacao'
          : 'vista'
        : paidSoFar <= 0
        ? 'entrada'
        : 'parcial';

    settleServiceOrderInPdv(chargingOS.id, {
      payments: finalPayments,
      paymentMethod: pdvPaymentMethod,
      amountReceived: pdvPaymentMethod === 'dinheiro' ? pdvCashReceived : undefined,
      changeAmount: pdvPaymentMethod === 'dinheiro' ? Math.max(0, pdvCashReceived - amountToSettle) : undefined,
      nsu: pdvAuthCode || undefined,
      terminalName,
      orderOverride: chargingOS,
      paidAmount: amountToSettle,
      splitId: pdvPayMode === 'installment' ? pdvSelectedSplitId || undefined : undefined,
      paymentKind,
      notes: pdvReceiptNotes.trim() || undefined
    });

    setChargingOS(null);
    setPdvSuccessMessage(null);
  };

  const handleSendWhatsAppInvoice = () => {
    if (!chargingOS) return;
    const srvTotal = chargingOS.services.reduce((a, s) => a + Number(s.price || 0), 0);
    const prtTotal = chargingOS.parts.reduce((a, p) => a + (Number(p.price || 0) * Number(p.quantity || 1)), 0);
    const grandTotal = Math.max(0, srvTotal + prtTotal + Number(chargingOS.visitFee || 0) - Number(chargingOS.calculatedDiscount || 0));

    const cleanPhone = chargingOS.clientPhone.replace(/\D/g, '');
    const message = `Olá ${chargingOS.clientName}, segue a fatura da sua Ordem de Serviço ${chargingOS.code} (${companySettings.tradeName || 'FIRE GESTÃO'}):
Valor Total: ${formatBRL(grandTotal)}
Equipamento: ${chargingOS.equipmentType || 'Serviço / Equipamento'}
Após o pagamento, envie o comprovante por aqui. Obrigado!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encoded}`, '_blank');
  };

  const handleCreateOS = (e: React.FormEvent) => {
    e.preventDefault();
    const clientObj = clients.find(c => c.id === clientId) || clients[0];
    if (!clientObj || !employeeId) {
      alert('Selecione o cliente e o técnico responsável.');
      return;
    }

    const subtotal = calculateSubtotal();
    const calculatedDiscount = calculateDiscountAmount(subtotal);

    const clientAddrObj = clientObj.addresses?.find(a => a.id === selectedAddressId) || 
      clientObj.addresses?.find(a => a.isDefault) || 
      clientObj.addresses?.[0];

    const formattedAddress = clientAddrObj
      ? `[${clientAddrObj.title}] ${clientAddrObj.street}, ${clientAddrObj.number}${clientAddrObj.complement ? ` (${clientAddrObj.complement})` : ''} - ${clientAddrObj.neighborhood}, ${clientAddrObj.city}/${clientAddrObj.state}`
      : `${clientObj.street}, ${clientObj.number} - ${clientObj.city}/${clientObj.state}`;

    const resolvedCompletionDate = completionDate
      ? completionDate
      : (status === 'concluida_aguardando_retirada' || status === 'entregue_finalizada')
      ? getTodayIso()
      : undefined;

    const normalizedContractRef = contractReference.trim() || undefined;

    const grandTotal = Math.max(0, Number((subtotal - calculatedDiscount).toFixed(2)));
    const filteredServices = services.filter(s => s.name.trim() !== '');
    const filteredParts = parts.filter(p => p.name.trim() !== '');
    const currentPaidSplits = (payments || []).filter(p => p.status === 'pago' && Number(p.amount || 0) > 0.009);
    const totalPaidInForm = Number(currentPaidSplits.reduce((acc, p) => acc + Number(p.amount || 0), 0).toFixed(2));

    if (editingOSId) {
      const previousOrder = serviceOrders.find(o => o.id === editingOSId);
      const prevPaidSplits = (previousOrder?.payments || []).filter(p => p.status === 'pago' && Number(p.amount || 0) > 0.009);
      const prevPaidIds = new Set(prevPaidSplits.map(p => p.id));
      const newlyPaidSplits = currentPaidSplits.filter(p => !prevPaidIds.has(p.id));
      const previouslyPaidAmount = previousOrder
        ? Math.max(
            getPaidAmountForSource('os', editingOSId),
            Number(prevPaidSplits.reduce((acc, p) => acc + Number(p.amount || 0), 0).toFixed(2))
          )
        : 0;

      const updatedPaymentStatus: ServiceOrder['paymentStatus'] =
        grandTotal > 0.009 && (previouslyPaidAmount + newlyPaidSplits.reduce((a, p) => a + Number(p.amount || 0), 0)) >= grandTotal - 0.01
          ? 'pago'
          : totalPaidInForm >= grandTotal - 0.01 && grandTotal > 0.009
          ? 'pago'
          : previousOrder?.paymentStatus === 'pago' && newlyPaidSplits.length === 0
          ? 'pago'
          : 'pendente';

      const orderUpdates: Partial<ServiceOrder> = {
        clientId: clientObj.id,
        clientName: clientObj.name,
        clientDocument: clientObj.document,
        clientPhone: clientObj.phone,
        clientAddress: formattedAddress,
        employeeId,
        vehicleId: vehicleId || undefined,
        kmDriven: Number(kmDriven) || 0,
        status,
        contractReference: normalizedContractRef,
        forecastDate,
        completionDate: resolvedCompletionDate,
        equipmentType,
        equipmentModel,
        equipmentSerial,
        equipmentYear,
        warrantyPeriodDays: Number(warrantyPeriodDays),
        warrantyExpiresAt: new Date(Date.now() + Number(warrantyPeriodDays) * 86400000).toISOString().split('T')[0],
        visitFee: Number(visitFee),
        description,
        services: filteredServices,
        parts: filteredParts,
        discountType,
        discountValue: Number(discountValue),
        calculatedDiscount,
        paymentMethod: payments[0]?.method || 'pix',
        paymentStatus: updatedPaymentStatus,
        payments,
        checklists,
        entryPhotos,
        exitPhotos
      };

      updateServiceOrder(editingOSId, orderUpdates);

      if (previousOrder && newlyPaidSplits.length > 0) {
        registerOsDirectPaymentReceipt({
          order: { ...previousOrder, ...orderUpdates } as ServiceOrder,
          newlyPaidSplits,
          previouslyPaid: previouslyPaidAmount
        });
      }

      setEditingOSId(null);
      setEditingOSCode(null);
      setContractReference('');
      setHasCustomPayments(false);
      setEntryPhotos([]);
      setExitPhotos([]);
      setIsNewModalOpen(false);
      return;
    }

    const derivedCreatePaymentStatus: ServiceOrder['paymentStatus'] =
      grandTotal > 0.009 && totalPaidInForm >= grandTotal - 0.01
        ? 'pago'
        : 'pendente';

    const createdOrder = addServiceOrder({
      clientId: clientObj.id,
      clientName: clientObj.name,
      clientDocument: clientObj.document,
      clientPhone: clientObj.phone,
      clientAddress: formattedAddress,
      employeeId,
      vehicleId: vehicleId || undefined,
      kmDriven: Number(kmDriven) || 0,
      status,
      contractReference: normalizedContractRef,
      openDate: new Date().toISOString().split('T')[0],
      forecastDate,
      completionDate: resolvedCompletionDate,
      equipmentType,
      equipmentModel,
      equipmentSerial,
      equipmentYear,
      warrantyPeriodDays: Number(warrantyPeriodDays),
      warrantyExpiresAt: new Date(Date.now() + Number(warrantyPeriodDays) * 86400000).toISOString().split('T')[0],
      visitFee: Number(visitFee),
      description,
      services: filteredServices,
      parts: filteredParts,
      discountType,
      discountValue: Number(discountValue),
      calculatedDiscount,
      paymentMethod: payments[0]?.method || 'pix',
      payments,
      paymentStatus: derivedCreatePaymentStatus,
      checklists,
      entryPhotos,
      exitPhotos
    });

    if (currentPaidSplits.length > 0) {
      registerOsDirectPaymentReceipt({
        order: createdOrder,
        newlyPaidSplits: currentPaidSplits,
        previouslyPaid: 0
      });
    }

    setHasCustomPayments(false);
    setCompletionDate('');
    setContractReference('');
    setEntryPhotos([]);
    setExitPhotos([]);
    setIsNewModalOpen(false);
    setDescription('');
  };

  const handleOpenQuickStatusModal = (os: ServiceOrder, nextStatusOverride?: ServiceOrderStatus) => {
    const targetStatus = nextStatusOverride || os.status;
    setStatusModalOS(os);
    setQuickStatus(targetStatus);
    setQuickForecastDate(os.forecastDate || getTodayIso());
    setQuickCompletionDate(
      os.completionDate ||
        (targetStatus === 'concluida_aguardando_retirada' || targetStatus === 'entregue_finalizada'
          ? getTodayIso()
          : '')
    );
  };

  const handleSaveQuickStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalOS) return;
    const cleanCompletion = quickCompletionDate.trim() || undefined;
    const cleanForecast = quickForecastDate.trim() || statusModalOS.forecastDate;
    updateServiceOrder(statusModalOS.id, {
      status: quickStatus,
      forecastDate: cleanForecast,
      completionDate: cleanCompletion
    });
    if (modalOSInfo && modalOSInfo.id === statusModalOS.id) {
      setModalOSInfo({
        ...modalOSInfo,
        status: quickStatus,
        forecastDate: cleanForecast,
        completionDate: cleanCompletion
      });
    }
    setStatusModalOS(null);
  };

  const handleConfirmSignature = () => {
    if (!signOrder || !signerName.trim()) return;
    const now = new Date();
    const formatted = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR');
    const svgStamp = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="260" height="70"><path d="M15 45 C 50 15, 80 55, 130 30 S 210 50, 245 35" stroke="%231d4ed8" fill="none" stroke-width="2.5"/><text x="15" y="65" font-family="sans-serif" font-size="10" fill="%2364748b">Assinado Digitalmente na Tela</text></svg>`;

    updateServiceOrder(signOrder.id, {
      signature: {
        signatureDataUrl: svgStamp,
        signedByName: signerName,
        signedByDocument: signerDocument || 'Documento Validado',
        signedAt: formatted
      },
      status: 'entregue_finalizada',
      completionDate: signOrder.completionDate || getTodayIso()
    });

    setSignOrder(null);
    setSignerName('');
    setSignerDocument('');
    alert('Assinatura registrada e OS finalizada!');
  };

  // Multi-Tenancy & RBAC Scoping: técnicos e clientes visualizam apenas seus registros autorizados
  const scopedOrders = React.useMemo(() => {
    return getScopedServiceOrders(serviceOrders, currentUser);
  }, [serviceOrders, currentUser]);

  // Filter
  const filteredOrders = scopedOrders.filter(o => {
    const matchesSearch = 
      o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.contractReference && o.contractReference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.equipmentSerial && o.equipmentSerial.toLowerCase().includes(searchTerm.toLowerCase())) ||
      o.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todas' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Reset page when search or status filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const paginatedOrders = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const getCompactStatusMeta = (st: ServiceOrderStatus) => {
    const meta = getServiceOrderStatusMeta(st);
    return {
      label: meta.label,
      className: meta.textClass,
      badgeClass: meta.badgeClass,
      selectClass: meta.selectClass,
      dotClass: meta.dotClass
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#d8d8d8]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-[#363739] tracking-tight sm:whitespace-nowrap">
              Ordens de Serviço
            </h1>
            <span className="hidden md:inline-block text-xs font-semibold px-2 py-0.5 rounded bg-[#f6eff1] text-[#53383e] border border-[#d8d8d8] whitespace-nowrap">
              Checklist com Fotos · Assinatura Digital Touch
            </span>
          </div>
          <p className="text-xs text-[#707174] mt-1 max-w-2xl line-clamp-2 leading-relaxed">
            Gerencie orçamentos, atendimentos técnicos, fotos, garantias e assinaturas digitais do início à entrega.
          </p>
        </div>

        {currentRole !== 'tecnico' && currentRole !== 'cliente' && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsQuickClientModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Atalho rápido para cadastrar um novo cliente sem sair das Ordens de Serviço"
            >
              <UserPlus className="w-4 h-4 text-emerald-700" />
              <span>Cadastrar Cliente</span>
            </button>
            <button
              onClick={handleOpenNewOS}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="md:hidden">Nova OS</span>
              <span className="hidden md:inline">Nova Ordem de Serviço / Orçamento</span>
            </button>
          </div>
        )}
      </div>

      {demoLoadedMsg && (
        <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2">
          <span>{demoLoadedMsg}</span>
          <button
            type="button"
            onClick={() => setDemoLoadedMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
            aria-label="Fechar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#d8d8d8] shadow-xs">
        <div className="flex-1 w-full">
          <LiveSearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por código, cliente, contrato, S/N do equipamento ou laudo..."
            emptyLabel="Nenhuma OS"
            inputClassName="w-full pl-9 pr-8 py-1.5 text-xs bg-[#f4f5f6] border border-[#d8d8d8] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#53383e] focus:bg-white"
            getOptions={(query) => {
              const q = query.toLowerCase();
              return scopedOrders
                .filter(
                  o =>
                    o.code.toLowerCase().includes(q) ||
                    o.clientName.toLowerCase().includes(q) ||
                    (o.contractReference && o.contractReference.toLowerCase().includes(q)) ||
                    (o.equipmentSerial && o.equipmentSerial.toLowerCase().includes(q)) ||
                    (o.description || '').toLowerCase().includes(q)
                )
                .map(o => {
                  const srv = o.services.reduce((a, s) => a + Number(s.price || 0), 0);
                  const prt = o.parts.reduce((a, p) => a + Number(p.price || 0) * Number(p.quantity || 1), 0);
                  const total = Math.max(0, srv + prt + Number(o.visitFee || 0) - Number(o.calculatedDiscount || 0));
                  return {
                    id: o.id,
                    title: `OS ${o.code} · ${o.clientName}`,
                    subtitle: `${getServiceOrderStatusMeta(o.status).label}${o.contractReference ? ` · Contrato: ${o.contractReference}` : ''} · ${o.equipmentType || o.description || 'Atendimento Técnico'}`,
                    priceText: formatBRL(total),
                    badgeText: o.paymentStatus === 'pago' ? 'Pago' : 'Pendente',
                    badgeClassName:
                      o.paymentStatus === 'pago'
                        ? 'shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800'
                        : 'shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800',
                    data: o
                  };
                });
            }}
            onSelect={(opt) => setSelectedOSForDetail(opt.data)}
          />
        </div>

        {/* Combobox de Status (mesma qualificação da OS) & ViewModeToggle */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar Ordens de Serviço por status"
            className="px-3 py-1.5 text-xs font-semibold bg-[#f4f5f6] border border-[#d8d8d8] rounded-lg text-[#363739] focus:outline-hidden focus:ring-1 focus:ring-[#53383e] focus:bg-white cursor-pointer"
          >
            <option value="todas">Todos os Status ({scopedOrders.length})</option>
            {SERVICE_ORDER_STATUS_LIST.map(st => {
              const count = scopedOrders.filter(o => o.status === st.value).length;
              return (
                <option key={st.value} value={st.value}>
                  {st.label} ({count})
                </option>
              );
            })}
          </select>
          <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Listagem em Linha Única (com Hover de Descrição) ou Grade em Cards */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="py-10 px-4 text-center space-y-2">
            <p className="text-xs text-slate-500">
              Nenhuma Ordem de Serviço encontrada com os filtros selecionados.
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="dense-table text-left text-xs">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status da OS</th>
                  <th className="hidden md:table-cell">Abertura</th>
                  <th className="hidden md:table-cell">Entrega Serviços</th>
                  <th>Cliente / Responsável</th>
                  <th className="text-right">
                    {currentRole === 'tecnico' ? 'A Receber' : 'Total OS'}
                  </th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map(os => {
                  const tech = employees.find(e => e.id === os.employeeId);
                  const veh = vehicles.find(v => v.id === os.vehicleId);
                  const srvTotal = os.services.reduce((a, b) => a + Number(b.price || 0), 0);
                  const prtTotal = os.parts.reduce((a, b) => a + (Number(b.price || 0) * Number(b.quantity || 1)), 0);
                  const grandTotal = srvTotal + prtTotal + Number(os.visitFee || 0) - Number(os.calculatedDiscount || 0);

                  const techRate = (tech?.commissionRate || 8) / 100;
                  const techEarnings = (srvTotal * techRate) + (Number(os.visitFee || 0) > 0 ? 80 : 0);
                  const statusMeta = getCompactStatusMeta(os.status);
                  const canEditStatus = currentRole !== 'cliente';

                  return (
                    <tr
                      key={os.id}
                      className="dense-row"
                      onMouseEnter={(e) =>
                        showTooltip(e, {
                          title: `OS ${os.code} · ${os.clientName}`,
                          subtitle: `${statusMeta.label} · ${os.equipmentType || 'Atendimento Técnico'}${os.equipmentSerial ? ` (S/N: ${os.equipmentSerial})` : ''}`,
                          description: os.description,
                          fields: [
                            { label: 'Telefone / Doc', value: `${os.clientPhone || '—'}${os.clientDocument ? ` · ${os.clientDocument}` : ''}` },
                            { label: 'Técnico / Veículo', value: `${tech?.name || 'Não alocado'}${veh ? ` · ${veh.plate}` : ''}` },
                            { label: 'Abertura / Previsão', value: `${formatDateBR(os.openDate)} · Prev. ${formatDateBR(os.forecastDate)}` },
                            { label: 'Entrega Serviços', value: os.completionDate ? formatDateBR(os.completionDate) : 'Em aberto' },
                            { label: 'Serviços / Peças', value: `${os.services.length} serviço(s) · ${os.parts.length} peça(s)` },
                            {
                              label: currentRole === 'tecnico' ? 'A Receber' : 'Total & Financeiro',
                              value: currentRole === 'tecnico'
                                ? formatBRL(techEarnings)
                                : `${formatBRL(grandTotal)} (${os.paymentStatus === 'pago' ? 'Pago' : 'Pendente'})`
                            },
                            ...(os.contractReference ? [{ label: 'Referência do Contrato', value: os.contractReference }] : []),
                            ...(os.clientAddress ? [{ label: 'Endereço', value: os.clientAddress, fullWidth: true }] : [])
                          ]
                        })
                      }
                      onMouseLeave={hideTooltip}
                    >
                      <td className="font-mono font-bold text-[#53383e]">
                        <div>{os.code}</div>
                        {os.contractReference && (
                          <div
                            className="text-[10px] font-sans font-semibold text-indigo-700 truncate max-w-[140px]"
                            title={`Referência do Contrato: ${os.contractReference}`}
                          >
                            Ctr: {os.contractReference}
                          </div>
                        )}
                      </td>
                      <td>
                        {canEditStatus ? (
                          <select
                            value={os.status}
                            aria-label={`Alterar status da OS ${os.code}`}
                            onChange={(e) => {
                              const nextSt = e.target.value as ServiceOrderStatus;
                              if (nextSt === 'concluida_aguardando_retirada' || nextSt === 'entregue_finalizada') {
                                handleOpenQuickStatusModal(os, nextSt);
                              } else {
                                updateServiceOrder(os.id, { status: nextSt });
                              }
                            }}
                            className={`border rounded-md px-2 py-1 text-xs font-semibold cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-[#53383e] ${statusMeta.selectClass}`}
                          >
                            {SERVICE_ORDER_STATUS_LIST.map(st => (
                              <option key={st.value} value={st.value}>
                                {st.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-semibold ${statusMeta.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                            {statusMeta.label}
                          </span>
                        )}
                      </td>
                      <td className="hidden md:table-cell font-mono text-slate-600 tabular-nums">{formatDateBR(os.openDate)}</td>
                      <td className="hidden md:table-cell">
                        {canEditStatus ? (
                          <button
                            type="button"
                            onClick={() => handleOpenQuickStatusModal(os)}
                            title="Clique para alterar status e informar a data de entrega dos serviços"
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-mono tabular-nums transition-colors cursor-pointer ${
                              os.completionDate
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-bold'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>
                              {os.completionDate
                                ? formatDateBR(os.completionDate)
                                : os.forecastDate
                                ? `Prev. ${formatDateBR(os.forecastDate)}`
                                : 'Definir entrega'}
                            </span>
                          </button>
                        ) : (
                          <span className="font-mono text-slate-700 tabular-nums">
                            {os.completionDate ? formatDateBR(os.completionDate) : `Prev. ${formatDateBR(os.forecastDate)}`}
                          </span>
                        )}
                      </td>
                      <td className="font-semibold text-slate-900">{os.clientName}</td>
                      <td className="text-right font-mono font-bold text-emerald-700 tabular-nums">
                        {currentRole === 'tecnico' ? formatBRL(techEarnings) : formatBRL(grandTotal)}
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPhotosModalOS(os)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-md bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 transition-colors cursor-pointer"
                            title="Fotografar Início (antes dos serviços) e Local de Entrega"
                          >
                            <Camera className="w-3.5 h-3.5 text-amber-700" />
                            <span>{(os.entryPhotos?.length || 0) + (os.exitPhotos?.length || 0)}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenPDV(os)}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                              os.paymentStatus === 'pago'
                                ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-[#53383e] hover:bg-[#432c32] text-white'
                            }`}
                            title="Cobrar no PDV"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>{os.paymentStatus === 'pago' ? 'Pago' : 'PDV'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setModalOSInfo(os)}
                            className="list-plus-btn"
                            title="Abrir todos os dados da Ordem de Serviço"
                            aria-label={`Abrir detalhes da OS ${os.code}`}
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 bg-slate-50/40">
            {paginatedOrders.map(os => {
              const tech = employees.find(e => e.id === os.employeeId);
              const srvTotal = os.services.reduce((a, b) => a + Number(b.price || 0), 0);
              const prtTotal = os.parts.reduce((a, b) => a + (Number(b.price || 0) * Number(b.quantity || 1)), 0);
              const grandTotal = srvTotal + prtTotal + Number(os.visitFee || 0) - Number(os.calculatedDiscount || 0);
              const techRate = (tech?.commissionRate || 8) / 100;
              const techEarnings = (srvTotal * techRate) + (Number(os.visitFee || 0) > 0 ? 80 : 0);
              const statusMeta = getCompactStatusMeta(os.status);
              const canEditStatus = currentRole !== 'cliente';

              return (
                <div
                  key={os.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between gap-3 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-[#53383e]">{os.code}</span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="font-mono text-[11px] text-slate-500 tabular-nums">{formatDateBR(os.openDate)}</span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 mt-0.5 leading-snug break-words">
                          {os.clientName}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalOSInfo(os)}
                        className="list-plus-btn shrink-0"
                        title="Abrir todos os dados da Ordem de Serviço"
                        aria-label={`Abrir detalhes da OS ${os.code}`}
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {canEditStatus ? (
                        <select
                          value={os.status}
                          aria-label={`Alterar status da OS ${os.code}`}
                          onChange={(e) => {
                            const nextSt = e.target.value as ServiceOrderStatus;
                            if (nextSt === 'concluida_aguardando_retirada' || nextSt === 'entregue_finalizada') {
                              handleOpenQuickStatusModal(os, nextSt);
                            } else {
                              updateServiceOrder(os.id, { status: nextSt });
                            }
                          }}
                          className={`border rounded-md px-2 py-1 text-xs font-semibold cursor-pointer max-w-full ${statusMeta.selectClass}`}
                        >
                          {SERVICE_ORDER_STATUS_LIST.map(st => (
                            <option key={st.value} value={st.value}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-semibold ${statusMeta.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                          {statusMeta.label}
                        </span>
                      )}

                      {canEditStatus ? (
                        <button
                          type="button"
                          onClick={() => handleOpenQuickStatusModal(os)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-mono tabular-nums cursor-pointer ${
                            os.completionDate
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span>{os.completionDate ? `Entregue ${formatDateBR(os.completionDate)}` : `Prev. ${formatDateBR(os.forecastDate)}`}</span>
                        </button>
                      ) : (
                        <span className="font-mono text-[11px] text-slate-600 tabular-nums">
                          {os.completionDate ? formatDateBR(os.completionDate) : `Prev. ${formatDateBR(os.forecastDate)}`}
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                      <div className="truncate font-medium text-slate-800">
                        {os.equipmentType || 'Atendimento Técnico'}
                      </div>
                      {os.contractReference && (
                        <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded max-w-full">
                          <FileText className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span className="truncate">Contrato: {os.contractReference}</span>
                        </div>
                      )}
                      {os.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2">{os.description}</p>
                      )}
                      <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                        <span>Técnico: {tech?.name || 'Não alocado'}</span>
                        <span>{os.services.length} srv · {os.parts.length} pç</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        {currentRole === 'tecnico' ? 'A Receber' : 'Total OS'}
                      </span>
                      <span className="font-mono font-bold text-sm text-emerald-700 tabular-nums">
                        {currentRole === 'tecnico' ? formatBRL(techEarnings) : formatBRL(grandTotal)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPhotosModalOS(os)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 transition-colors cursor-pointer"
                        title="Fotografar Início (antes dos serviços) e Local de Entrega"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-700" />
                        <span>Fotos ({(os.entryPhotos?.length || 0) + (os.exitPhotos?.length || 0)})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenPDV(os)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                          os.paymentStatus === 'pago'
                            ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-[#53383e] hover:bg-[#432c32] text-white'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{os.paymentStatus === 'pago' ? 'Pago' : 'Cobrar PDV'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Paginação da Tabela de Ordens de Serviço */}
        <TablePagination
          currentPage={currentPage}
          totalItems={filteredOrders.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemName="ordens de serviço"
        />
      </div>

      {tooltipElement}

      {/* Modal Completa da O.S. (Aberta pelo botão + na lista) */}
      {(() => {
        if (!modalOSInfo) return null;
        const os = modalOSInfo;
        const tech = employees.find(e => e.id === os.employeeId);
        const veh = vehicles.find(v => v.id === os.vehicleId);
        const srvTotal = os.services.reduce((a, b) => a + Number(b.price || 0), 0);
        const prtTotal = os.parts.reduce((a, b) => a + (Number(b.price || 0) * Number(b.quantity || 1)), 0);
        const grandTotal = srvTotal + prtTotal + Number(os.visitFee || 0) - Number(os.calculatedDiscount || 0);
        const techRate = (tech?.commissionRate || 8) / 100;
        const techEarnings = (srvTotal * techRate) + (Number(os.visitFee || 0) > 0 ? 80 : 0);
        const isBudget = os.status === 'orcamento_aberto' || os.status === 'aguardando_aprovacao';
        const statusMeta = getCompactStatusMeta(os.status);
        const todayIso = new Date().toISOString().split('T')[0];
        const isUnderWarranty = Boolean(
          os.warrantyExpiresAt &&
          os.warrantyExpiresAt >= todayIso &&
          Number(os.warrantyPeriodDays) > 0
        );

        return (
          <RecordDetailModal
            isOpen={true}
            onClose={() => setModalOSInfo(null)}
            title={`Ordem de Serviço ${os.code}`}
            subtitle={`Abertura: ${formatDateBR(os.openDate)}${os.forecastDate ? ` · Previsão: ${formatDateBR(os.forecastDate)}` : ''}${os.completionDate ? ` · Entrega: ${formatDateBR(os.completionDate)}` : ''}`}
            statusText={statusMeta.label}
            statusClassName={statusMeta.className}
            sections={[
              {
                heading: 'Cliente & Prazos',
                fields: [
                  { label: 'Cliente / Responsável', value: os.clientName },
                  { label: 'Telefone', value: os.clientPhone || 'Não informado' },
                  { label: 'CPF / CNPJ', value: os.clientDocument || 'Não informado' },
                  { label: 'Data de Entrega dos Serviços', value: os.completionDate ? formatDateBR(os.completionDate) : 'Ainda não entregue' },
                  ...(os.contractReference ? [{ label: 'Referência do Contrato', value: os.contractReference, fullWidth: true }] : []),
                  { label: 'Endereço Completo', value: os.clientAddress || 'Não informado', fullWidth: true }
                ]
              },
              {
                heading: 'Execução Técnica & Equipamento',
                fields: [
                  { label: 'Técnico Alocado', value: tech?.name || 'Não alocado' },
                  { label: 'Veículo & KM', value: veh ? `${veh.model} (${veh.plate}) · ${os.kmDriven} km` : `${os.kmDriven} km` },
                  { label: 'Equipamento / Sistema', value: os.equipmentType || 'Atendimento Técnico' },
                  {
                    label: 'Modelo / Série / Garantia',
                    value: `${os.equipmentModel || '—'}${os.equipmentSerial ? ` · S/N ${os.equipmentSerial}` : ''}${isUnderWarranty ? ` · Garantia até ${formatDateBR(os.warrantyExpiresAt!)}` : ''}`
                  },
                  { label: 'Descrição Técnica / Defeito', value: os.description || 'Nenhuma descrição registrada.', fullWidth: true }
                ]
              },
              {
                heading: 'Resumo Financeiro',
                fields:
                  currentRole === 'tecnico'
                    ? [{ label: 'Diária + Comissão Prevista', value: formatBRL(techEarnings) }]
                    : [
                        { label: 'Serviços', value: formatBRL(srvTotal) },
                        { label: 'Peças Utilizadas', value: formatBRL(prtTotal) },
                        { label: 'Taxa de Visita', value: formatBRL(os.visitFee || 0) },
                        { label: 'Desconto', value: `-${formatBRL(os.calculatedDiscount || 0)}` },
                        { label: 'Total Líquido da OS', value: formatBRL(grandTotal) },
                        { label: 'Status Financeiro', value: os.paymentStatus === 'pago' ? 'Pago / Liquidado' : 'Pendente no PDV' }
                      ]
              }
            ]}
            customContent={
              <div className="space-y-4">
                {currentRole !== 'cliente' && (
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        Alterar Status & Data de Entrega dos Serviços
                      </h4>
                      {detailSavedMsg && (
                        <span className="text-[11px] font-semibold text-emerald-700">
                          {detailSavedMsg}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Status da OS
                        </label>
                        <select
                          value={detailStatus}
                          onChange={(e) => {
                            const next = e.target.value as ServiceOrderStatus;
                            setDetailStatus(next);
                            if ((next === 'concluida_aguardando_retirada' || next === 'entregue_finalizada') && !detailCompletionDate) {
                              setDetailCompletionDate(getTodayIso());
                            }
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                        >
                          {SERVICE_ORDER_STATUS_LIST.map(st => (
                            <option key={st.value} value={st.value}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Previsão
                        </label>
                        <input
                          type="date"
                          value={detailForecastDate}
                          onChange={(e) => setDetailForecastDate(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Data de Entrega
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={detailCompletionDate}
                            onChange={(e) => setDetailCompletionDate(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setDetailCompletionDate(getTodayIso())}
                            className="px-2 py-1.5 text-[10px] font-bold bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 cursor-pointer shrink-0"
                            title="Preencher com a data de hoje"
                          >
                            Hoje
                          </button>
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={() => {
                            const nextCompletion = detailCompletionDate.trim() || undefined;
                            const nextForecast = detailForecastDate.trim() || os.forecastDate;
                            updateServiceOrder(os.id, {
                              status: detailStatus,
                              forecastDate: nextForecast,
                              completionDate: nextCompletion
                            });
                            setModalOSInfo({
                              ...os,
                              status: detailStatus,
                              forecastDate: nextForecast,
                              completionDate: nextCompletion
                            });
                            setDetailSavedMsg('Status e entrega salvos!');
                            setTimeout(() => setDetailSavedMsg(null), 3000);
                          }}
                          className="w-full px-3 py-1.5 bg-[#53383e] hover:bg-[#432c32] text-white rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Serviços ({os.services.length})
                  </h4>
                  {os.services.length === 0 ? (
                    <p className="text-slate-400 text-xs">Nenhum serviço lançado.</p>
                  ) : (
                    <ul className="space-y-1 text-xs text-slate-700 border border-slate-200 rounded-lg p-3 bg-slate-50">
                      {os.services.map((srv, idx) => (
                        <li key={srv.id || idx} className="flex justify-between gap-2">
                          <span>{srv.name}</span>
                          {currentRole !== 'tecnico' && (
                            <span className="font-mono font-semibold tabular-nums">{formatBRL(srv.price)}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Peças Utilizadas ({os.parts.length})
                  </h4>
                  {os.parts.length === 0 ? (
                    <p className="text-slate-400 text-xs">Nenhuma peça aplicada.</p>
                  ) : (
                    <ul className="space-y-1 text-xs text-slate-700 border border-slate-200 rounded-lg p-3 bg-slate-50">
                      {os.parts.map((prt, idx) => (
                        <li key={prt.id || idx} className="flex justify-between gap-2">
                          <span>{prt.quantity}x {prt.name}</span>
                          {currentRole !== 'tecnico' && (
                            <span className="font-mono font-semibold tabular-nums">
                              {formatBRL(Number(prt.price || 0) * Number(prt.quantity || 1))}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {os.payments && os.payments.length > 0 && currentRole !== 'tecnico' && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Parcelas & Pagamentos ({os.payments.length})
                    </h4>
                    <div className="space-y-1 text-xs font-mono text-slate-700 border border-slate-200 rounded-lg p-3 bg-slate-50 tabular-nums">
                      {os.payments.map((p, idx) => (
                        <div key={p.id || idx} className="flex justify-between gap-2 flex-wrap">
                          <span>
                            {p.entryType === 'entrada' ? 'Entrada' : `Parcela ${idx + 1}`} · {p.method.replace('_', ' ')}
                            {p.dueDate ? ` · Venc. ${formatDateBR(p.dueDate)}` : ''}
                            {p.paidAt ? ` · Pago em ${formatDateBR(p.paidAt)}` : ''}
                          </span>
                          <span className="font-bold">
                            {formatBRL(p.amount)} ({p.status === 'pago' ? 'Pago' : 'Pendente'})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentRole !== 'tecnico' && currentRole !== 'cliente' && (() => {
                  const partsCostCmv = os.parts.reduce(
                    (acc, p) => acc + Number(p.cost || 0) * Number(p.quantity || 1),
                    0
                  );
                  const totalHours = os.services.reduce((acc, s) => acc + Number(s.hours || 0), 0);
                  const hourlyRate = Number(os.kmDriven || 0) > 0 ? 85 : 75;
                  const laborCost = totalHours * hourlyRate;
                  const commissionCost =
                    os.paymentStatus === 'pago' && srvTotal > 0
                      ? Number(((srvTotal * ((tech?.commissionRate || 8) / 100))).toFixed(2))
                      : 0;
                  const kmCost = Number(os.kmDriven || 0) * 1.8;
                  const linkedExpenses = generalExpenses.filter(
                    ge => ge.invoiceNumber === os.code || ge.description.includes(os.code)
                  );
                  const linkedExpensesCost = linkedExpenses.reduce((acc, ge) => acc + Number(ge.cost || 0), 0);
                  const cardFees = (os.payments || []).reduce((acc, p) => acc + Number(p.rateAmount || 0), 0);
                  const estimatedTax = Number((grandTotal * 0.085).toFixed(2));
                  const totalCostsAndExits =
                    partsCostCmv + laborCost + commissionCost + kmCost + linkedExpensesCost + cardFees + estimatedTax;
                  const paidViaReceipts = getPaidAmountForSource('os', os.id);
                  const paidViaSplits = (os.payments || [])
                    .filter(p => p.status === 'pago')
                    .reduce((acc, p) => acc + Number(p.amount || 0), 0);
                  const cashReceived = Math.max(
                    paidViaReceipts,
                    paidViaSplits,
                    os.paymentStatus === 'pago' ? grandTotal : 0
                  );
                  const pendingReceivable = Math.max(0, grandTotal - cashReceived);
                  const netResult = grandTotal - totalCostsAndExits;
                  const netMargin = grandTotal > 0 ? (netResult / grandTotal) * 100 : 0;
                  const osStockMoves = stockMovements.filter(m => m.referenceDoc === os.code);
                  const osCashMoves = cashMovements.filter(m => m.sourceId === os.id || m.sourceCode === os.code);

                  return (
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                          Custos, Entradas & Saídas da O.S.
                        </h4>
                        <span
                          className={`text-xs font-mono font-black px-2 py-0.5 rounded-md border ${
                            netResult >= 0
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {netResult >= 0 ? 'LUCRO' : 'PREJUÍZO'}: {netResult >= 0 ? '+' : ''}
                          {formatBRL(netResult)} ({netMargin >= 0 ? '+' : ''}
                          {netMargin.toFixed(1)}%)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-white border border-slate-200 rounded-lg p-2">
                          <div className="text-[10px] text-slate-500 font-semibold">Entradas (Caixa)</div>
                          <div className="font-mono font-bold text-emerald-700 tabular-nums">
                            {formatBRL(cashReceived)}
                          </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-lg p-2">
                          <div className="text-[10px] text-slate-500 font-semibold">A Receber</div>
                          <div className="font-mono font-bold text-amber-700 tabular-nums">
                            {formatBRL(pendingReceivable)}
                          </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-lg p-2">
                          <div className="text-[10px] text-slate-500 font-semibold">Saída Estoque (CMV)</div>
                          <div className="font-mono font-bold text-slate-800 tabular-nums">
                            {formatBRL(partsCostCmv)}
                          </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-lg p-2">
                          <div className="text-[10px] text-slate-500 font-semibold">Custos Totais</div>
                          <div className="font-mono font-bold text-rose-700 tabular-nums">
                            {formatBRL(totalCostsAndExits)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white border border-slate-200 rounded-lg p-2.5 font-mono tabular-nums">
                        <div className="flex justify-between">
                          <span>MO ({totalHours}h × {formatBRL(hourlyRate)}):</span>
                          <span className="font-semibold text-slate-900">{formatBRL(laborCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Comissão Técnica:</span>
                          <span className="font-semibold text-slate-900">{formatBRL(commissionCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Desloc. ({os.kmDriven || 0} km × R$ 1,80):</span>
                          <span className="font-semibold text-slate-900">{formatBRL(kmCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Viagem / Terceiros / Taxas:</span>
                          <span className="font-semibold text-slate-900">{formatBRL(linkedExpensesCost + cardFees)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Impostos Estimados (8,5%):</span>
                          <span className="font-semibold text-slate-900">{formatBRL(estimatedTax)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Baixas Estoque / Mov. Caixa:</span>
                          <span className="font-semibold text-slate-900">
                            {osStockMoves.length} peça(s) · {osCashMoves.length} entrada(s)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const osReceipts = getReceiptsForSource('os', os.id);
                  if (osReceipts.length === 0 || currentRole === 'tecnico') return null;
                  return (
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Recibos de Pagamento Emitidos ({osReceipts.length})
                      </h4>
                      <div className="space-y-1.5">
                        {osReceipts.map(rec => (
                          <div
                            key={rec.id}
                            className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-200 bg-white text-xs"
                          >
                            <div className="min-w-0">
                              <span className="font-mono font-bold text-[#53383e]">{rec.receiptNumber}</span>
                              <span className="text-slate-500 ml-2">
                                {new Date(rec.createdAt).toLocaleDateString('pt-BR')} · Pago {formatBRL(rec.amountPaidNow)}
                              </span>
                              {!rec.isFullyPaid ? (
                                <span className="ml-2 text-[10px] font-bold text-amber-700">
                                  (Resta {formatBRL(rec.remainingBalance)})
                                </span>
                              ) : (
                                <span className="ml-2 text-[10px] font-bold text-emerald-700">(QUITADO)</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => openReceiptModal(rec)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-md cursor-pointer shrink-0"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>Ver Recibo</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Registro Fotográfico Interativo (Início · Antes do Serviço & Local de Entrega) */}
                <ServiceOrderPhotosPanel
                  compact
                  readOnly={currentRole === 'cliente'}
                  entryPhotos={os.entryPhotos || []}
                  exitPhotos={os.exitPhotos || []}
                  onChangeEntryPhotos={(nextEntry) => {
                    updateServiceOrder(os.id, { entryPhotos: nextEntry });
                    setModalOSInfo(prev => (prev && prev.id === os.id ? { ...prev, entryPhotos: nextEntry } : prev));
                  }}
                  onChangeExitPhotos={(nextExit) => {
                    updateServiceOrder(os.id, { exitPhotos: nextExit });
                    setModalOSInfo(prev => (prev && prev.id === os.id ? { ...prev, exitPhotos: nextExit } : prev));
                  }}
                />
              </div>
            }
            actions={
              <>
                <button
                  type="button"
                  onClick={() => {
                    setModalOSInfo(null);
                    setSelectedOSForDetail(os);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ficha A4</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalOSInfo(null);
                    handleOpenPDV(os);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Cobrar PDV</span>
                </button>
                {currentRole !== 'tecnico' && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalOSInfo(null);
                      handleOpenEdit(os);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handlePrintOS(os)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-slate-300 rounded-lg cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadOS(os)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-300 rounded-lg cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleScheduleOSInCalendar(os)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-purple-700 bg-white hover:bg-purple-50 border border-purple-200 rounded-lg cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Agendar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalOSInfo(null);
                    handleOpenWhatsAppForOS(os);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                {isBudget && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Deseja aprovar e converter o orçamento ${os.code} em Ordem de Serviço em Execução?`)) {
                        convertBudgetToOrderOrSale(os.id, 'os_aprovada');
                        setModalOSInfo(null);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg cursor-pointer"
                  >
                    <ArrowRightCircle className="w-3.5 h-3.5" />
                    <span>Aprovar OS</span>
                  </button>
                )}
                {!os.signature && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalOSInfo(null);
                      setSignOrder(os);
                      setSignerName(os.clientName);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-white hover:bg-amber-50 border border-amber-200 rounded-lg cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Assinar</span>
                  </button>
                )}
                {currentRole === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Excluir a OS ${os.code}?`)) {
                        deleteServiceOrder(os.id);
                        setModalOSInfo(null);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                )}
              </>
            }
          />
        );
      })()}

      {/* Comprovante Completo com Checklist, Fotos e Assinatura Digital (Visualização / Impressão) */}
      {selectedOSForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-slate-200">
            {/* Modal Actions */}
            <div className="no-print sticky top-0 bg-white px-6 py-3.5 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-slate-900 text-sm">
                  Visualizar Ordem de Serviço
                </span>
                <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-slate-900 text-white shadow-2xs">
                  Nº {selectedOSForDetail.code}
                </span>
                {(() => {
                  const detailWarrantyInfo = resolveServiceOrderWarrantyTerm(
                    selectedOSForDetail,
                    warrantyPolicies,
                    companySettings
                  );
                  if (detailWarrantyInfo.canGenerateWarrantyTerm) {
                    return (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
                        title="OS Finalizada: Termo de Garantia liberado para impressão/PDF mesmo que exista saldo financeiro pendente"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Garantia Liberada · OS Finalizada
                      </span>
                    );
                  }
                  if (detailWarrantyInfo.hasWarrantyTerm && !detailWarrantyInfo.isFinalized) {
                    return (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                        title="O Termo de Garantia só pode ser gerado quando o status da OS estiver como Entregue / Finalizada"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                        Termo de Garantia disponível ao Finalizar OS
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const os = selectedOSForDetail;
                    setSelectedOSForDetail(null);
                    handleOpenPDV(os);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg shadow-2xs cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Cobrar no PDV
                </button>
                {currentRole !== 'tecnico' && (
                  <button
                    onClick={() => {
                      const os = selectedOSForDetail;
                      setSelectedOSForDetail(null);
                      handleOpenEdit(os);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#363739] bg-white border border-[#d8d8d8] rounded-lg hover:bg-[#d8d8d8]/40 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                )}
                {/* Botão Salvar OS com o seu respectivo número */}
                <button
                  onClick={() => handleDownloadOS(selectedOSForDetail)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                  title={`Salvar e Baixar o documento oficial da OS Nº ${selectedOSForDetail.code}`}
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Salvar OS Nº {selectedOSForDetail.code}</span>
                </button>

                {/* Botão Imprimir OS com o seu respectivo número */}
                <button
                  onClick={() => handlePrintOS(selectedOSForDetail)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer ring-1 ring-slate-900/10"
                  title={`Imprimir ou Salvar em PDF A4 a OS Nº ${selectedOSForDetail.code}`}
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
                  <span>Imprimir OS Nº {selectedOSForDetail.code}</span>
                </button>
                <button
                  onClick={() => setSelectedOSForDetail(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="p-4 sm:p-6 bg-slate-100/60 overflow-y-auto">
              <ServiceOrderPrintTemplate
                os={selectedOSForDetail}
                employee={employees.find(e => e.id === selectedOSForDetail.employeeId)}
                includeWarrantyPage={printIncludeWarranty}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova OS / Orçamento */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-slate-200">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#53383e]" />
                <div>
                  <h3 className="font-bold text-[#363739] text-base">
                    {editingOSId ? `Editar Ordem de Serviço · ${editingOSCode}` : 'Abertura de Ordem de Serviço & Checklist'}
                  </h3>
                  <p className="text-[11px] text-[#707174]">
                    {editingOSId ? 'Atualize os dados, serviços, peças alocadas, taxas e termos' : 'Cadastre um novo atendimento técnico ou orçamento'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNewModalOpen(false);
                  setEditingOSId(null);
                  setEditingOSCode('');
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOS} className="p-6 space-y-5 text-xs">
              {/* 1. Cliente & Técnico */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">1. Dados do Cliente e Técnico</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label className="block text-slate-700 font-bold">Cliente *</label>
                      <button
                        type="button"
                        onClick={() => setIsQuickClientModalOpen(true)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors cursor-pointer"
                        title="Cadastrar novo cliente agora e já selecionar nesta O.S."
                      >
                        <UserPlus className="w-3 h-3 text-emerald-700" />
                        <span>+ Cadastrar Cliente</span>
                      </button>
                    </div>
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-sm shadow-2xs focus:ring-2 focus:ring-blue-500"
                    >
                      {clients.length === 0 ? (
                        <option value="">Nenhum cliente cadastrado — clique em "+ Cadastrar Cliente"</option>
                      ) : (
                        clients.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}{c.document ? ` (${c.document})` : ''}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Técnico Responsável *</label>
                    <select
                      value={employeeId}
                      onChange={(e) => {
                        setEmployeeId(e.target.value);
                        const emp = employees.find(x => x.id === e.target.value);
                        if (emp?.assignedVehicleId) setVehicleId(emp.assignedVehicleId);
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                    >
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Veículo / KM Deslocamento</label>
                    <div className="flex gap-2">
                      <select
                        value={vehicleId}
                        onChange={(e) => setVehicleId(e.target.value)}
                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      >
                        <option value="">Sem veículo</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.model} ({v.plate})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="KM"
                        value={kmDriven}
                        onChange={(e) => setKmDriven(Number(e.target.value))}
                        className="w-16 p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Painel com Dados Claros e Visíveis do Cliente Selecionado */}
                {(() => {
                  const currentSelectedClient = clients.find(c => c.id === clientId) || clients[0];
                  if (!currentSelectedClient) return null;
                  return (
                    <div className="mt-3 p-3.5 bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50/40 border border-blue-200/80 rounded-xl space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-700" />
                          <span className="font-bold text-sm text-slate-950">{currentSelectedClient.name}</span>
                          <span className="text-[10px] font-semibold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-full">
                            Cliente Selecionado
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold bg-white text-slate-800 border border-slate-300 px-2.5 py-0.5 rounded shadow-2xs">
                          Doc: {currentSelectedClient.document || 'Não informado'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="text-slate-500">Contato:</span>
                          <span className="font-semibold text-slate-900">{currentSelectedClient.phone || 'Não informado'}</span>
                        </div>
                        <div className="truncate">
                          <span className="text-slate-500">E-mail:</span>{' '}
                          <span className="font-semibold text-slate-900">{currentSelectedClient.email || 'Não informado'}</span>
                        </div>
                        <div className="truncate">
                          <span className="text-slate-500">Endereço:</span>{' '}
                          <span className="font-semibold text-slate-900" title={`${currentSelectedClient.street}, ${currentSelectedClient.number} - ${currentSelectedClient.city}`}>
                            {currentSelectedClient.street ? `${currentSelectedClient.street}, ${currentSelectedClient.number}` : 'Endereço padrão'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Local de Atendimento / Endereço com Título de Referência */}
                {(() => {
                  const currentSelectedClient = clients.find(c => c.id === clientId) || clients[0];
                  const addrs = currentSelectedClient?.addresses || [];
                  if (addrs.length === 0) return null;
                  return (
                    <div className="mt-3 p-3 bg-blue-50/60 border border-blue-200/70 rounded-xl space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <label className="text-slate-800 font-bold text-[11px] flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          Local de Atendimento / Endereço do Cliente ({addrs.length} cadastrados):
                        </label>
                        <span className="text-[10px] text-blue-700 font-medium">
                          Selecione o local exato da execução
                        </span>
                      </div>
                      <select
                        value={selectedAddressId || (addrs.find(a => a.isDefault)?.id || addrs[0]?.id)}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 text-xs shadow-2xs"
                      >
                        {addrs.map(a => (
                          <option key={a.id} value={a.id}>
                            [{a.title}] {a.street}, {a.number} {a.complement ? `(${a.complement})` : ''} - {a.neighborhood}, {a.city}/{a.state} {a.isDefault ? '★ Principal' : ''} {a.referencePoint ? `• Ref: ${a.referencePoint}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })()}
              </div>

              {/* Bloco Status da OS & Data de Entrega dos Serviços */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#53383e]" />
                  <span>Status da Ordem de Serviço & Prazos / Entrega dos Serviços</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Status da O.S. *</label>
                    <select
                      value={status}
                      onChange={(e) => {
                        const nextSt = e.target.value as ServiceOrderStatus;
                        setStatus(nextSt);
                        if ((nextSt === 'concluida_aguardando_retirada' || nextSt === 'entregue_finalizada') && !completionDate) {
                          setCompletionDate(getTodayIso());
                        }
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 text-xs"
                    >
                      {SERVICE_ORDER_STATUS_LIST.map(st => (
                        <option key={st.value} value={st.value}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Previsão de Entrega</label>
                    <input
                      type="date"
                      value={forecastDate}
                      onChange={(e) => setForecastDate(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">
                      Data de Entrega dos Serviços
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        value={completionDate}
                        onChange={(e) => setCompletionDate(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setCompletionDate(getTodayIso())}
                        className="px-2.5 py-2 text-[11px] font-bold bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 cursor-pointer shrink-0"
                        title="Definir entrega para hoje"
                      >
                        Hoje
                      </button>
                      {completionDate && (
                        <button
                          type="button"
                          onClick={() => setCompletionDate('')}
                          className="px-2 py-2 text-[11px] font-semibold bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-500 cursor-pointer shrink-0"
                          title="Limpar data de entrega"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Referência do Contrato (Opcional — caso exista) */}
                <div className="pt-2.5 border-t border-slate-200">
                  <label className="flex items-center justify-between gap-2 text-slate-700 mb-1 font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Referência do Contrato</span>
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">
                      Opcional — preencha apenas caso exista contrato vinculado
                    </span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={contractReference}
                      onChange={(e) => setContractReference(e.target.value)}
                      placeholder="Ex: Contrato nº 045/2026, Manutenção Mensal Condomínio, Aditivo 02..."
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#53383e]"
                    />
                    {contractReference && (
                      <button
                        type="button"
                        onClick={() => setContractReference('')}
                        className="px-2 py-2 text-[11px] font-semibold bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-500 cursor-pointer shrink-0"
                        title="Limpar referência do contrato"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Equipamento & Termo de Garantia */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">2. Equipamento & Regras de Garantia</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 mb-1 font-medium">Equipamento / Tanque / Reservatório *</label>
                    <input
                      type="text"
                      required
                      value={equipmentType}
                      onChange={(e) => setEquipmentType(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Número de Série (S/N)</label>
                    <input
                      type="text"
                      value={equipmentSerial}
                      onChange={(e) => setEquipmentSerial(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Garantia (Dias)</label>
                    <select
                      value={warrantyPeriodDays}
                      onChange={(e) => setWarrantyPeriodDays(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                    >
                      <option value="90">90 dias (Padrão Serviços)</option>
                      <option value="180">180 dias (6 meses)</option>
                      <option value="365">365 dias (1 ano Reservatórios)</option>
                      <option value="1095">3 anos (Garantia Estendida)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Descrição e Taxa de Visita */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-slate-600 mb-1 font-medium">Laudo Inicial / Descrição do Problema *</label>
                  <input
                    type="text"
                    required
                    placeholder="Descreva o defeito informado ou objetivo da visita técnica..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Taxa de Visita Técnica (R$)</label>
                  <input
                    type="number"
                    value={visitFee}
                    onChange={(e) => setVisitFee(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              {/* Notificação / Feedback de Checklist e Serviços */}
              {checklistFeedback && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{checklistFeedback}</span>
                </div>
              )}

              {/* Mão de Obra & Serviços (Buscar Cadastrados + Serviços Avulsos) */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Mão de Obra & Serviços</h4>
                      <p className="text-[11px] text-slate-500">Busque serviços cadastrados no catálogo ou adicione serviços avulsos</p>
                    </div>
                  </div>

                  {/* Mode switcher tabs */}
                  <div className="flex flex-wrap items-center bg-white p-0.5 rounded-lg border border-slate-200 gap-1 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setServiceAddMode('catalogo')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        serviceAddMode === 'catalogo'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Buscar Cadastrado</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceAddMode('avulso')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        serviceAddMode === 'avulso'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Serviço Avulso</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceAddMode('novo_vinculado')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        serviceAddMode === 'novo_vinculado'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Criar Serviço & Checklist Vinculado</span>
                    </button>
                  </div>
                </div>

                {/* Sub-form 1: Buscar Serviços Cadastrados */}
                {serviceAddMode === 'catalogo' && (
                  <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-blue-600" />
                        <span>Selecione um Serviço do Catálogo</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {serviceCatalog.length} cadastrado(s)
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={selectedCatalogServiceId}
                        onChange={(e) => setSelectedCatalogServiceId(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white"
                      >
                        <option value="">-- Escolha um serviço cadastrado no catálogo --</option>
                        {serviceCatalog.map((catItem) => {
                          const linkedChk = checklistTemplates.filter(t => t.serviceIds?.includes(catItem.id));
                          return (
                            <option key={catItem.id} value={catItem.id}>
                              {catItem.name} — {formatBRL(catItem.standardPrice)} ({catItem.defaultHours || 1}h) [{catItem.category}]{linkedChk.length > 0 ? ` 📋 ${linkedChk.length} checklist(s)` : ''}
                            </option>
                          );
                        })}
                      </select>

                      <button
                        type="button"
                        disabled={!selectedCatalogServiceId}
                        onClick={() => handleAddCatalogService(selectedCatalogServiceId)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Incluir Serviço Cadastrado</span>
                      </button>
                    </div>

                    {selectedCatalogServiceId && (
                      <div className="p-2 bg-blue-50/60 rounded-lg text-xs text-blue-900 flex items-center justify-between border border-blue-100">
                        {(() => {
                          const item = serviceCatalog.find(s => s.id === selectedCatalogServiceId);
                          if (!item) return null;
                          const linked = checklistTemplates.filter(t => t.serviceIds?.includes(item.id));
                          return (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{item.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-200/70 font-mono text-blue-900">
                                  {item.category}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span>Estimado: <strong>{item.defaultHours || 1}h</strong></span>
                                <span>Padrão: <strong>{formatBRL(item.standardPrice)}</strong></span>
                                {linked.length > 0 && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                                    ✓ {linked.length} checklist(s) vinculado(s)
                                  </span>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-form 2: Adicionar Serviço Avulso (Fora do Catálogo) */}
                {serviceAddMode === 'avulso' && (
                  <div className="p-3 bg-white rounded-xl border border-amber-200/80 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-amber-600" />
                        <span>Cadastro Rápido de Serviço Avulso (Não Consta no Catálogo)</span>
                      </label>
                      <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Uso exclusivo nesta OS
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Descrição do Serviço Avulso *</label>
                        <input
                          type="text"
                          placeholder="Ex: Reparo emergencial no cano da piscina..."
                          value={customServiceName}
                          onChange={(e) => setCustomServiceName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Categoria / Área</label>
                        <input
                          type="text"
                          placeholder="Ex: Hidráulica"
                          value={customServiceCategory}
                          onChange={(e) => setCustomServiceCategory(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Horas (h)</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={customServiceHours}
                          onChange={(e) => setCustomServiceHours(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-center"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Preço (R$) *</label>
                        <input
                          type="number"
                          placeholder="0,00"
                          value={customServicePrice}
                          onChange={(e) => setCustomServicePrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        disabled={!customServiceName.trim()}
                        onClick={handleAddCustomService}
                        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Serviço Avulso à OS</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub-form 3: Criar Novo Serviço & Checklist Vinculado (Salva no Sistema e Anexa à OS) */}
                {serviceAddMode === 'novo_vinculado' && (
                  <div className="p-4 bg-linear-to-br from-emerald-50/70 via-white to-teal-50/40 rounded-xl border-2 border-emerald-300 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-emerald-950">
                            Cadastrar Novo Serviço & Criar Checklist Vinculado
                          </h5>
                          <p className="text-[11px] text-emerald-700">
                            Cadastra o serviço no catálogo, cria o checklist padrão vinculado a ele e já inclui ambos nesta OS de uma só vez!
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                        Salva no Catálogo + Anexa à OS
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Lado 1: Cadastro do Serviço */}
                      <div className="p-3 bg-white rounded-lg border border-emerald-200/80 shadow-2xs space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">
                          <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                          <span>1. Dados do Novo Serviço</span>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                              Nome / Descrição do Serviço *
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Instalação de Bomba de Calor Inverter"
                              value={newServiceName}
                              onChange={(e) => setNewServiceName(e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="sm:col-span-1">
                              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                Categoria
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: Aquecimento"
                                value={newServiceCategory}
                                onChange={(e) => setNewServiceCategory(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                Horas Estimadas
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                min="0.5"
                                value={newServiceHours}
                                onChange={(e) => setNewServiceHours(Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-center font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                Preço Padrão (R$) *
                              </label>
                              <input
                                type="number"
                                placeholder="0,00"
                                value={newServicePrice}
                                onChange={(e) => setNewServicePrice(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-700"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lado 2: Criação do Checklist Vinculado */}
                      <div className="p-3 bg-white rounded-lg border border-teal-200/80 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
                            <span>2. Checklist Técnico Vinculado</span>
                          </div>
                          <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full">
                            {newChecklistDraftItems.length} item(ns)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Título do Checklist</label>
                            <input
                              type="text"
                              placeholder={newServiceName ? `Checklist - ${newServiceName}` : 'Ex: Checklist de Instalação'}
                              value={newChecklistTitle}
                              onChange={(e) => setNewChecklistTitle(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Tipo de Equipamento / Alvo</label>
                            <input
                              type="text"
                              placeholder="Ex: Bomba de Calor / Boiler"
                              value={newChecklistEquipType}
                              onChange={(e) => setNewChecklistEquipType(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                        </div>

                        {/* Adicionar item ao checklist */}
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/70 space-y-1.5">
                          <div className="text-[10px] font-bold text-slate-600">Adicionar Item de Checagem:</div>
                          <div className="flex flex-col sm:flex-row gap-1.5">
                            <input
                              type="text"
                              placeholder="Item a inspecionar (ex: Tensão 220V e disjuntor dedicado)"
                              value={newDraftItemText}
                              onChange={(e) => setNewDraftItemText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (newDraftItemText.trim()) {
                                    setNewChecklistDraftItems(prev => [...prev, { label: newDraftItemText.trim(), category: newDraftItemCat }]);
                                    setNewDraftItemText('');
                                  }
                                }
                              }}
                              className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                            />
                            <select
                              value={newDraftItemCat}
                              onChange={(e) => setNewDraftItemCat(e.target.value as ChecklistItem['category'])}
                              className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-700"
                            >
                              <option value="Estrutura e Tanque">Estrutura & Tanque</option>
                              <option value="Hidráulica e Pressão">Hidráulica & Pressão</option>
                              <option value="Elétrica e Comando">Elétrica & Comando</option>
                              <option value="Sensores e Termostato">Sensores & Termostato</option>
                              <option value="Geral e Limpeza">Geral & Limpeza</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                if (newDraftItemText.trim()) {
                                  setNewChecklistDraftItems(prev => [...prev, { label: newDraftItemText.trim(), category: newDraftItemCat }]);
                                  setNewDraftItemText('');
                                }
                              }}
                              className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs font-bold cursor-pointer shrink-0"
                            >
                              + Item
                            </button>
                          </div>

                          {/* Itens adicionados no rascunho do checklist */}
                          <div className="max-h-28 overflow-y-auto space-y-1 pt-1 pr-1">
                            {newChecklistDraftItems.map((draft, dIdx) => (
                              <div key={dIdx} className="flex items-center justify-between p-1.5 bg-white rounded border border-slate-200 text-xs">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-semibold shrink-0">
                                    {draft.category}
                                  </span>
                                  <span className="truncate text-slate-700 font-medium">{draft.label}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setNewChecklistDraftItems(prev => prev.filter((_, idx) => idx !== dIdx))}
                                  className="text-red-400 hover:text-red-600 p-0.5 ml-1 shrink-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 border-t border-emerald-100">
                      <div className="text-[11px] text-slate-500">
                        {newServiceName.trim() ? (
                          <span>Criará o serviço <strong className="text-emerald-700">"{newServiceName}"</strong> com <strong className="text-teal-700">{newChecklistDraftItems.length} itens</strong> no checklist.</span>
                        ) : (
                          <span>Preencha o nome do serviço para habilitar o salvamento integrado.</span>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={!newServiceName.trim()}
                        onClick={handleCreateServiceAndLinkedChecklist}
                        className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Salvar no Catálogo & Anexar Serviço com Checklist na OS</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de Serviços Adicionados na OS */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Serviços Inclusos na OS ({services.filter(s => s.name.trim() !== '').length}):</span>
                    <span className="font-mono text-blue-700 font-bold">
                      Subtotal Serviços: {formatBRL(services.reduce((a, b) => a + Number(b.price || 0), 0))}
                    </span>
                  </div>

                  {services.length === 0 || services.every(s => s.name.trim() === '') ? (
                    <div className="p-3 text-center text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-300">
                      Nenhum serviço adicionado. Use os botões acima para buscar serviços cadastrados ou inserir um serviço avulso.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {services.map((srv, idx) => {
                        const isCatalog = !srv.isCustom && Boolean(srv.serviceId);
                        const hasLinkedChecklists = srv.serviceId && checklistTemplates.some(t => t.serviceIds?.includes(srv.serviceId!));

                        return (
                          <div 
                            key={srv.id || idx} 
                            className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                              isCatalog ? 'bg-white border-blue-200/80 shadow-2xs' : 'bg-amber-50/40 border-amber-200/70'
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                                isCatalog ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {isCatalog ? 'Catálogo' : 'Avulso'}
                              </span>

                              <div className="flex-1 min-w-0">
                                <input
                                  type="text"
                                  placeholder="Descrição do serviço"
                                  value={srv.name}
                                  onChange={(e) => {
                                    const up = [...services];
                                    up[idx].name = e.target.value;
                                    setServices(up);
                                  }}
                                  className="w-full text-xs font-semibold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white px-1 py-0.5 rounded"
                                />
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 px-1">
                                  {srv.category && <span>{srv.category}</span>}
                                  {hasLinkedChecklists && (
                                    <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                                      <CheckCircle2 className="w-3 h-3" /> Checklist vinculado
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0.5"
                                  title="Horas de execução"
                                  value={srv.hours || 1}
                                  onChange={(e) => {
                                    const up = [...services];
                                    up[idx].hours = Number(e.target.value);
                                    setServices(up);
                                  }}
                                  className="w-12 text-xs font-mono text-center bg-transparent"
                                />
                                <span className="text-[10px] text-slate-500 font-mono">h</span>
                              </div>

                              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                <span className="text-[10px] text-slate-500 font-mono">R$</span>
                                <input
                                  type="number"
                                  placeholder="0,00"
                                  value={srv.price}
                                  onChange={(e) => {
                                    const up = [...services];
                                    up[idx].price = Number(e.target.value);
                                    setServices(up);
                                  }}
                                  className="w-20 text-xs font-mono font-bold text-slate-900 bg-transparent"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => setServices(prev => prev.filter((_, i) => i !== idx))}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Remover este serviço"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Peças e Materiais Aplicados */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Peças & Materiais Aplicados</h4>
                      <p className="text-[11px] text-slate-500">Busque produtos cadastrados no estoque ou adicione peças avulsas</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddPart} 
                    className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" /> Peça Avulsa
                  </button>
                </div>

                {/* Busca e Seleção de Produtos Cadastrados no Estoque */}
                {(() => {
                  const selectedClientObj = clients.find(c => c.id === clientId);
                  const isWholesaleClient = selectedClientObj?.customerType === 'atacado';
                  const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));
                  const chosenProduct = products.find(p => p.id === selectedProductId);

                  return (
                    <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Buscar &amp; Incluir Produto Cadastrado no Estoque</span>
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {products.length} item(ns) · Tabela {isWholesaleClient ? 'Atacado' : 'Varejo'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <div className="md:col-span-5">
                          <LiveSearchInput<Product>
                            value={partSearchTerm}
                            onChange={setPartSearchTerm}
                            minChars={1}
                            maxResults={20}
                            clearOnSelect
                            placeholder="Buscar produto por nome, código, SKU, marca ou código de barras..."
                            emptyLabel="Nenhum produto encontrado"
                            inputClassName="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white"
                            getOptions={(query): LiveSearchOption<Product>[] => {
                              const q = query.trim().toLowerCase();
                              return sortedProducts
                                .filter(p =>
                                  p.name.toLowerCase().includes(q) ||
                                  (p.code || '').toLowerCase().includes(q) ||
                                  (p.sku || '').toLowerCase().includes(q) ||
                                  (p.barcode || '').toLowerCase().includes(q) ||
                                  (p.brand || '').toLowerCase().includes(q) ||
                                  (p.category || '').toLowerCase().includes(q) ||
                                  (p.tags || []).some(t => t.toLowerCase().includes(q))
                                )
                                .map((prod) => {
                                  const unitPrice = isWholesaleClient
                                    ? Number(prod.wholesalePrice || prod.retailPrice || 0)
                                    : Number(prod.retailPrice || 0);
                                  return {
                                    id: prod.id,
                                    title: prod.name,
                                    subtitle: `${prod.code || prod.sku || 'S/C'}${prod.brand ? ` · ${prod.brand}` : ''} · Estoque: ${prod.currentStock} ${prod.unit}`,
                                    priceText: formatBRL(unitPrice),
                                    thumbnailUrl: prod.photos?.[0],
                                    badgeText: isWholesaleClient ? 'Atacado' : 'Varejo',
                                    badgeClassName: isWholesaleClient
                                      ? 'shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800'
                                      : 'shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700',
                                    data: prod
                                  };
                                });
                            }}
                            onSelect={(opt) => handleAddRegisteredProduct(opt.data, selectedPartQty)}
                          />
                        </div>

                        <div className="md:col-span-4">
                          <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            aria-label="Selecionar produto cadastrado do estoque"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white"
                          >
                            <option value="">-- Ou escolha na lista do Estoque ({products.length}) --</option>
                            {sortedProducts.map(prod => {
                              const unitPrice = isWholesaleClient
                                ? Number(prod.wholesalePrice || prod.retailPrice || 0)
                                : Number(prod.retailPrice || 0);
                              return (
                                <option key={prod.id} value={prod.id}>
                                  {prod.name} ({prod.code || prod.sku || 'S/C'}) — {formatBRL(unitPrice)} · Est: {prod.currentStock} {prod.unit}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="md:col-span-3 flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200 shrink-0">
                            <span className="text-[10px] text-slate-500 font-mono">Qtd:</span>
                            <input
                              type="number"
                              min="1"
                              value={selectedPartQty}
                              onChange={(e) => setSelectedPartQty(Math.max(1, Number(e.target.value) || 1))}
                              className="w-12 text-xs font-mono font-bold text-center bg-transparent"
                            />
                          </div>
                          <button
                            type="button"
                            disabled={!chosenProduct}
                            onClick={() => chosenProduct && handleAddRegisteredProduct(chosenProduct, selectedPartQty)}
                            className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs whitespace-nowrap"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Incluir</span>
                          </button>
                        </div>
                      </div>

                      {partFeedback && (
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{partFeedback}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="space-y-2">
                  {parts.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-300">
                      Nenhuma peça vinculada a esta OS. Busque acima no estoque ou clique em &quot;Peça Avulsa&quot;.
                    </div>
                  ) : (
                    parts.map((prt, idx) => {
                      const linkedProd = prt.productId ? products.find(p => p.id === prt.productId) : undefined;
                      return (
                        <div key={prt.id || idx} className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span
                              className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                prt.productId
                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {prt.productId ? 'Estoque' : 'Avulsa'}
                            </span>
                            <input
                              type="text"
                              placeholder="Nome / Descrição da peça aplicada"
                              value={prt.name}
                              onChange={(e) => {
                                const up = [...parts];
                                up[idx] = { ...up[idx], name: e.target.value };
                                setParts(up);
                              }}
                              className="flex-1 min-w-0 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                            />
                            {linkedProd && (
                              <span className="hidden lg:inline text-[10px] font-mono text-slate-400 shrink-0">
                                Est: {linkedProd.currentStock} {linkedProd.unit}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-400 font-mono">Qtd:</span>
                              <input
                                type="number"
                                min="1"
                                placeholder="1"
                                value={prt.quantity}
                                onChange={(e) => {
                                  const up = [...parts];
                                  up[idx] = { ...up[idx], quantity: Math.max(1, Number(e.target.value) || 1) };
                                  setParts(up);
                                }}
                                className="w-12 text-xs font-mono font-semibold text-center bg-transparent"
                              />
                            </div>

                            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-400 font-mono">R$:</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={prt.price}
                                onChange={(e) => {
                                  const up = [...parts];
                                  up[idx] = { ...up[idx], price: Number(e.target.value) || 0 };
                                  setParts(up);
                                }}
                                className="w-20 text-xs font-mono font-bold text-slate-900 bg-transparent"
                              />
                            </div>

                            <span className="text-[11px] font-mono font-bold text-slate-700 w-20 text-right tabular-nums">
                              {formatBRL(Number(prt.price || 0) * Number(prt.quantity || 1))}
                            </span>

                            <button
                              type="button"
                              onClick={() => setParts(prev => prev.filter((_, i) => i !== idx))}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Remover peça"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Checklist Técnico de Inspeção e Qualidade */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Checklist Técnico & Inspeção</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          {checklists.length} itens ({checklists.filter(c => c.status === 'ok').length} OK / {checklists.filter(c => c.status === 'defeito').length} Defeito)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Checklists anexados aos serviços da OS e inspeções de vistoria técnica</p>
                    </div>
                  </div>

                  {/* Checklist Actions Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {checklistTemplates.length > 0 && (
                      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                        <select
                          value={selectedTemplateToImport}
                          onChange={(e) => setSelectedTemplateToImport(e.target.value)}
                          className="text-xs bg-transparent border-none text-slate-700 font-medium py-1 px-1.5 focus:ring-0"
                        >
                          <option value="">-- Importar Modelo --</option>
                          {checklistTemplates.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.title} ({t.items.length} itens)
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!selectedTemplateToImport}
                          onClick={() => handleImportChecklistTemplate(selectedTemplateToImport)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                        >
                          Importar
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleSyncServicesChecklists}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Sincronizar checklists dos serviços selecionados"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Sincronizar dos Serviços</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAddingManualChecklist(!isAddingManualChecklist)}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Item Manual</span>
                    </button>
                  </div>
                </div>

                {/* Form to add manual checklist item */}
                {isAddingManualChecklist && (
                  <div className="p-3 bg-white rounded-xl border border-slate-300 shadow-2xs space-y-2.5 animate-fadeIn">
                    <span className="text-xs font-bold text-slate-800 block">Adicionar Novo Item de Inspeção</span>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          placeholder="Ex: Teste da válvula redutora de pressão 2.5 bar..."
                          value={newChecklistLabel}
                          onChange={(e) => setNewChecklistLabel(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <select
                          value={newChecklistCategory}
                          onChange={(e) => setNewChecklistCategory(e.target.value as ChecklistItem['category'])}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="Estrutura e Tanque">Estrutura e Tanque</option>
                          <option value="Elétrica e Comando">Elétrica e Comando</option>
                          <option value="Hidráulica e Pressão">Hidráulica e Pressão</option>
                          <option value="Acessórios e Segurança">Acessórios e Segurança</option>
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <select
                          value={newChecklistServiceTag}
                          onChange={(e) => setNewChecklistServiceTag(e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="">Geral (Sem serviço específico)</option>
                          {services.filter(s => s.name.trim() !== '').map((s, i) => (
                            <option key={s.id || i} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingManualChecklist(false)}
                        className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAddManualChecklistItem}
                        disabled={!newChecklistLabel.trim()}
                        className="px-3.5 py-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-md text-xs font-bold"
                      >
                        Salvar Item no Checklist
                      </button>
                    </div>
                  </div>
                )}

                {/* Checklist Items Table */}
                {checklists.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                    Nenhum checklist de vistoria registrado para esta OS. Use as opções acima para importar um modelo, sincronizar dos serviços ou adicionar itens manuais.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {checklists.map((chk, idx) => (
                      <div 
                        key={chk.id || idx}
                        className={`p-2.5 bg-white rounded-xl border transition-all ${
                          chk.status === 'defeito'
                            ? 'border-rose-300 bg-rose-50/30'
                            : chk.status === 'ok'
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {chk.category}
                              </span>
                              {chk.serviceName && (
                                <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                                  Vinculado a: {chk.serviceName}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-slate-900 block leading-tight">
                              {chk.label}
                            </span>
                          </div>

                          {/* Status toggle buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                              <button
                                type="button"
                                onClick={() => handleToggleChecklistStatus(chk.id, 'ok')}
                                className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                  chk.status === 'ok'
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-emerald-700'
                                }`}
                              >
                                ✓ Conforme (OK)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleChecklistStatus(chk.id, 'defeito')}
                                className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                  chk.status === 'defeito'
                                    ? 'bg-rose-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-rose-700'
                                }`}
                              >
                                ✗ Defeito
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleChecklistStatus(chk.id, 'nao_aplicavel')}
                                className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                                  chk.status === 'nao_aplicavel'
                                    ? 'bg-slate-600 text-white shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                N/A
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveChecklistItem(chk.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Remover item do checklist"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Defect notes or observations */}
                        {chk.status === 'defeito' && (
                          <div className="mt-2 pt-1.5 border-t border-rose-200/80">
                            <input
                              type="text"
                              placeholder="Descreva o defeito observado ou peça sugerida para troca..."
                              value={chk.notes || ''}
                              onChange={(e) => handleUpdateChecklistNotes(chk.id, e.target.value)}
                              className="w-full text-xs p-1.5 bg-white border border-rose-300 rounded text-rose-900 placeholder:text-rose-400"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Registro Fotográfico: Início (Antes dos Serviços) e Local de Entrega */}
              <ServiceOrderPhotosPanel
                entryPhotos={entryPhotos}
                exitPhotos={exitPhotos}
                onChangeEntryPhotos={setEntryPhotos}
                onChangeExitPhotos={setExitPhotos}
              />

              {/* Desconto Flexível, Calculadora de Parcelas e Formas de Pagamento */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-800">Desconto Flexível (Nativo)</span>
                    <div className="text-[11px] text-slate-500">Aplique desconto em moeda (R$) ou percentual (%)</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => setDiscountType('fixed')}
                        className={`px-3 py-1 font-bold cursor-pointer ${discountType === 'fixed' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                      >
                        R$ Moeda
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('percent')}
                        className={`px-3 py-1 font-bold cursor-pointer ${discountType === 'percent' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                      >
                        % Percentual
                      </button>
                    </div>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Valor"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-24 p-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold tabular-nums"
                    />
                  </div>
                </div>

                {/* Resumo Financeiro em Tempo Real */}
                {(() => {
                  const allocatedTotal = Number(payments.reduce((acc, p) => acc + Number(p.amount || 0), 0).toFixed(2));
                  const paidTotal = Number(
                    payments.reduce((acc, p) => (p.status === 'pago' ? acc + Number(p.amount || 0) : acc), 0).toFixed(2)
                  );
                  const diff = Number((modalGrandTotal - allocatedTotal).toFixed(2));
                  const isBalanced = Math.abs(diff) < 0.02;

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-200">
                      <div className="bg-white px-3 py-2 rounded-lg border border-slate-200">
                        <div className="text-[10px] font-semibold text-slate-500">Total Líquido da OS</div>
                        <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                          {formatBRL(modalGrandTotal)}
                        </div>
                        {modalDiscount > 0 && (
                          <div className="text-[10px] text-rose-600 font-mono tabular-nums">
                            Desc: -{formatBRL(modalDiscount)}
                          </div>
                        )}
                      </div>

                      <div className="bg-white px-3 py-2 rounded-lg border border-slate-200">
                        <div className="text-[10px] font-semibold text-slate-500">Total nas Parcelas</div>
                        <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                          {formatBRL(allocatedTotal)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {payments.length} {payments.length === 1 ? 'lançamento' : 'lançamentos'}
                        </div>
                      </div>

                      <div className="bg-white px-3 py-2 rounded-lg border border-slate-200">
                        <div className="text-[10px] font-semibold text-slate-500">Já Pago (Entrada/Parc.)</div>
                        <div className="text-sm font-bold font-mono tabular-nums text-emerald-700">
                          {formatBRL(paidTotal)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          A receber: {formatBRL(Math.max(0, modalGrandTotal - paidTotal))}
                        </div>
                      </div>

                      <div
                        className={`px-3 py-2 rounded-lg border ${
                          isBalanced
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-amber-50 border-amber-300'
                        }`}
                      >
                        <div className="text-[10px] font-semibold text-slate-600">
                          {isBalanced ? 'Conferência' : diff > 0 ? 'Falta Alocar' : 'Valor Excedente'}
                        </div>
                        <div
                          className={`text-sm font-bold font-mono tabular-nums ${
                            isBalanced ? 'text-emerald-700' : 'text-amber-800'
                          }`}
                        >
                          {isBalanced ? 'Total Conferido' : formatBRL(Math.abs(diff))}
                        </div>
                        {!isBalanced && (
                          <button
                            type="button"
                            onClick={handleBalanceRemainingToLastPending}
                            className="text-[10px] font-bold text-blue-700 hover:underline cursor-pointer mt-0.5"
                          >
                            Ajustar na última parcela
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Calculadora Automática de Entrada e Divisão de Parcelas */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-[#53383e]" />
                      <div>
                        <h5 className="font-bold text-slate-900 text-xs">
                          Calculadora Automática de Entrada & Parcelamento
                        </h5>
                        <p className="text-[11px] text-slate-500">
                          Defina uma entrada opcional e divida o restante em parcelas com datas automáticas; depois edite qualquer linha abaixo se precisar.
                        </p>
                      </div>
                    </div>
                    {(() => {
                      const entryPreview = Math.min(modalGrandTotal, Math.max(0, Number(String(calcEntryAmount).replace(',', '.')) || 0));
                      const balancePreview = Math.max(0, Number((modalGrandTotal - entryPreview).toFixed(2)));
                      const instPreview = Math.max(1, Math.min(24, Math.floor(Number(calcInstallments) || 1)));
                      const perInst = balancePreview / instPreview;
                      return (
                        <div className="text-right font-mono tabular-nums text-[11px] text-slate-700 shrink-0 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                          {entryPreview > 0 ? (
                            <span>
                              Entrada <strong>{formatBRL(entryPreview)}</strong> + {instPreview}x de{' '}
                              <strong className="text-[#53383e]">{formatBRL(perInst)}</strong>
                            </span>
                          ) : (
                            <span>
                              {instPreview}x de <strong className="text-[#53383e]">{formatBRL(perInst)}</strong>
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Linha 1 da Calculadora: Entrada */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Valor da Entrada (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00 (Sem entrada)"
                        value={calcEntryAmount}
                        onChange={(e) => setCalcEntryAmount(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold tabular-nums text-xs"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Forma da Entrada
                      </label>
                      <select
                        value={calcEntryMethod}
                        onChange={(e) => setCalcEntryMethod(e.target.value as PaymentMethod)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                      >
                        <option value="dinheiro">Dinheiro</option>
                        <option value="pix">PIX</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="boleto">Boleto Bancário</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Data da Entrada
                      </label>
                      <input
                        type="date"
                        value={calcEntryDate}
                        onChange={(e) => setCalcEntryDate(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                      />
                    </div>

                    <div className="sm:col-span-3 flex items-center justify-between gap-2 pb-1">
                      <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={calcEntryPaid}
                          onChange={(e) => setCalcEntryPaid(e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Entrada já paga</span>
                      </label>
                      <div className="flex items-center gap-1">
                        {[0, 30, 50].map(pct => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() =>
                              setCalcEntryAmount(
                                pct === 0 ? '' : String(Number(((modalGrandTotal * pct) / 100).toFixed(2)))
                              )
                            }
                            className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                            title={pct === 0 ? 'Limpar entrada' : `Aplicar ${pct}% de entrada`}
                          >
                            {pct === 0 ? '0%' : `${pct}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Linha 2 da Calculadora: Parcelas do Saldo */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end pt-2 border-t border-slate-100">
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Forma das Parcelas
                      </label>
                      <select
                        value={calcInstallmentMethod}
                        onChange={(e) => setCalcInstallmentMethod(e.target.value as PaymentMethod)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                      >
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="boleto">Boleto Bancário</option>
                        <option value="pix">PIX</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                        <option value="faturado_30d">Faturado 30d</option>
                      </select>
                    </div>

                    {(calcInstallmentMethod === 'cartao_credito' || calcInstallmentMethod === 'cartao_debito') && (
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Bandeira</label>
                        <select
                          value={calcCardBrand}
                          onChange={(e) => setCalcCardBrand(e.target.value as CardBrand)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="visa">Visa</option>
                          <option value="mastercard">Mastercard</option>
                          <option value="elo">Elo</option>
                          <option value="hipercard">Hipercard</option>
                          <option value="outra">Outra</option>
                        </select>
                      </div>
                    )}

                    <div className={calcInstallmentMethod === 'cartao_credito' || calcInstallmentMethod === 'cartao_debito' ? 'sm:col-span-2' : 'sm:col-span-2'}>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Qtd. Parcelas</label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={calcInstallments}
                        onChange={(e) => setCalcInstallments(Math.max(1, Math.min(24, Number(e.target.value) || 1)))}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-center text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">1º Vencimento</label>
                      <input
                        type="date"
                        value={calcFirstDueDate}
                        onChange={(e) => setCalcFirstDueDate(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1" title="Intervalo em dias entre parcelas">
                        Dias
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={calcIntervalDays}
                        onChange={(e) => setCalcIntervalDays(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-center text-xs"
                      />
                    </div>

                    <div className={calcInstallmentMethod === 'cartao_credito' || calcInstallmentMethod === 'cartao_debito' ? 'sm:col-span-2' : 'sm:col-span-4'}>
                      <button
                        type="button"
                        onClick={handleGenerateInstallments}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Calcular e Dividir</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lista Editável Individual de Entrada e Parcelas */}
                <div className="pt-1">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                    <div>
                      <span className="font-bold text-slate-800">
                        Parcelas e Formas de Pagamento (Edição Individual)
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        Altere livremente data, tipo (Entrada / Parcela / À Vista), forma (ex: Dinheiro) ou marque como Pago em uma data específica.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSplitPayment}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Parcela / Forma</span>
                    </button>
                  </div>

                  {payments.length === 0 ? (
                    <div className="p-4 bg-white border border-dashed border-slate-300 rounded-xl text-center text-slate-500 text-xs">
                      Nenhuma parcela cadastrada. Use a calculadora acima ou clique em "Adicionar Parcela / Forma".
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {payments.map((pay, idx) => {
                        const rowType: PaymentEntryType = pay.entryType || (payments.length > 1 ? 'parcela' : 'vista');
                        const rowStatus: PaymentSplitStatus = pay.status || 'pendente';
                        const isCard = pay.method === 'cartao_credito' || pay.method === 'cartao_debito';

                        return (
                          <div
                            key={pay.id || idx}
                            className={`p-2.5 rounded-xl border transition-colors ${
                              rowStatus === 'pago'
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            {/* Linha principal editável */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                              {/* Tipo (Entrada / Parcela / À Vista) */}
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                  Tipo {pay.installmentNumber && pay.totalInstallments ? `(${pay.installmentNumber}/${pay.totalInstallments})` : `#${idx + 1}`}
                                </label>
                                <select
                                  value={rowType}
                                  onChange={(e) => {
                                    const nextType = e.target.value as PaymentEntryType;
                                    handleUpdatePaymentRow(idx, {
                                      entryType: nextType,
                                      notes:
                                        nextType === 'entrada'
                                          ? 'Entrada'
                                          : nextType === 'vista'
                                          ? 'Pagamento À Vista'
                                          : pay.notes === 'Entrada' || pay.notes === 'Pagamento À Vista'
                                          ? `Parcela ${idx + 1}`
                                          : pay.notes
                                    });
                                  }}
                                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                                >
                                  <option value="entrada">Entrada</option>
                                  <option value="parcela">Parcela</option>
                                  <option value="vista">À Vista</option>
                                </select>
                              </div>

                              {/* Forma de Pagamento */}
                              <div className={isCard ? 'sm:col-span-3' : 'sm:col-span-4'}>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                  Forma de Pagamento
                                </label>
                                <select
                                  value={pay.method}
                                  onChange={(e) =>
                                    handleUpdatePaymentRow(idx, { method: e.target.value as PaymentMethod })
                                  }
                                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                                >
                                  <option value="pix">PIX (Sem Taxa)</option>
                                  <option value="dinheiro">Dinheiro</option>
                                  <option value="cartao_credito">Cartão de Crédito</option>
                                  <option value="cartao_debito">Cartão de Débito</option>
                                  <option value="boleto">Boleto Bancário</option>
                                  <option value="faturado_30d">Faturado 30d</option>
                                </select>
                              </div>

                              {/* Bandeira (se cartão) */}
                              {isCard && (
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                    Bandeira {pay.ratePercentage ? `(${pay.ratePercentage}%)` : ''}
                                  </label>
                                  <select
                                    value={pay.cardBrand || 'visa'}
                                    onChange={(e) =>
                                      handleUpdatePaymentRow(idx, { cardBrand: e.target.value as CardBrand })
                                    }
                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                  >
                                    <option value="visa">Visa</option>
                                    <option value="mastercard">Mastercard</option>
                                    <option value="elo">Elo</option>
                                    <option value="hipercard">Hipercard</option>
                                    <option value="outra">Outra</option>
                                  </select>
                                </div>
                              )}

                              {/* Data Prevista / Vencimento */}
                              <div className={isCard ? 'sm:col-span-2' : 'sm:col-span-3'}>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                  Data / Vencimento
                                </label>
                                <input
                                  type="date"
                                  value={pay.dueDate || ''}
                                  onChange={(e) => handleUpdatePaymentRow(idx, { dueDate: e.target.value })}
                                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                                />
                              </div>

                              {/* Valor (R$) + Excluir */}
                              <div className={isCard ? 'sm:col-span-3' : 'sm:col-span-3'}>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                  Valor (R$)
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0,00"
                                    value={pay.amount}
                                    onChange={(e) =>
                                      handleUpdatePaymentRow(idx, { amount: Number(e.target.value) || 0 })
                                    }
                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold tabular-nums text-xs text-slate-900"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePaymentRow(idx)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                                    title="Remover esta parcela / forma"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Linha secundária: Status Pago/Pendente, Data específica de pagamento, Observação e Líquido */}
                            <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdatePaymentRow(idx, { status: 'pendente' })}
                                    className={`px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                                      rowStatus === 'pendente'
                                        ? 'bg-amber-600 text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                  >
                                    Pendente
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdatePaymentRow(idx, {
                                        status: 'pago',
                                        paidAt: pay.paidAt || pay.dueDate || getTodayIso()
                                      })
                                    }
                                    className={`px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                                      rowStatus === 'pago'
                                        ? 'bg-emerald-600 text-white'
                                        : 'text-slate-600 hover:text-emerald-700'
                                    }`}
                                  >
                                    Pago
                                  </button>
                                </div>

                                {rowStatus === 'pago' && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-semibold text-emerald-800 whitespace-nowrap">
                                      Pago em:
                                    </span>
                                    <input
                                      type="date"
                                      value={pay.paidAt || pay.dueDate || getTodayIso()}
                                      onChange={(e) => handleUpdatePaymentRow(idx, { paidAt: e.target.value })}
                                      className="px-2 py-1 bg-white border border-emerald-300 rounded-md font-mono text-[11px] text-emerald-900"
                                    />
                                  </div>
                                )}

                                <input
                                  type="text"
                                  placeholder="Obs. (ex: pago em dinheiro na loja)"
                                  value={pay.notes || ''}
                                  onChange={(e) => handleUpdatePaymentRow(idx, { notes: e.target.value })}
                                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-700 w-52 sm:w-60"
                                />
                              </div>

                              <div className="text-[11px] font-mono tabular-nums text-slate-600">
                                Líquido:{' '}
                                <strong className="text-slate-900">{formatBRL(pay.netAmount ?? pay.amount)}</strong>
                                {Number(pay.rateAmount || 0) > 0 && (
                                  <span className="text-rose-600 ml-1">(-{formatBRL(pay.rateAmount || 0)})</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewModalOpen(false);
                    setEditingOSId(null);
                    setEditingOSCode('');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg shadow-xs cursor-pointer"
                >
                  {editingOSId ? 'Salvar Alterações da OS' : 'Gerar Ordem de Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rápida: Alterar Status e Data de Entrega dos Serviços */}
      {statusModalOS && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setStatusModalOS(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Alterar Status & Entrega · OS {statusModalOS.code}
                </h3>
                <p className="text-[11px] text-slate-500">{statusModalOS.clientName}</p>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalOS(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickStatus} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status da Ordem de Serviço *</label>
                <select
                  value={quickStatus}
                  onChange={(e) => {
                    const next = e.target.value as ServiceOrderStatus;
                    setQuickStatus(next);
                    if ((next === 'concluida_aguardando_retirada' || next === 'entregue_finalizada') && !quickCompletionDate) {
                      setQuickCompletionDate(getTodayIso());
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900"
                >
                  {SERVICE_ORDER_STATUS_LIST.map(st => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Previsão de Entrega</label>
                  <input
                    type="date"
                    value={quickForecastDate}
                    onChange={(e) => setQuickForecastDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data de Entrega dos Serviços</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={quickCompletionDate}
                      onChange={(e) => setQuickCompletionDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setQuickCompletionDate(getTodayIso())}
                      className="px-2.5 py-2 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 cursor-pointer shrink-0"
                    >
                      Hoje
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 gap-2">
                {quickCompletionDate ? (
                  <button
                    type="button"
                    onClick={() => setQuickCompletionDate('')}
                    className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 cursor-pointer"
                  >
                    Limpar data de entrega
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400">Opcional enquanto em aberto</span>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setStatusModalOS(null)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg cursor-pointer"
                  >
                    Salvar Status e Entrega
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Assinatura Digital Touch */}
      {signOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Assinatura em Tela do Cliente</h3>
              </div>
              <button onClick={() => setSignOrder(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-4 text-xs mt-4">
              <p className="text-slate-600">
                Coleta da assinatura touch do cliente para encerramento e emissão do termo de garantia da <strong className="text-slate-900">{signOrder.code}</strong>.
              </p>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Nome do Responsável *</label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Documento (RG / CPF)</label>
                <input
                  type="text"
                  placeholder="Doc de identificação"
                  value={signerDocument}
                  onChange={(e) => setSignerDocument(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              {/* Touch Signature Area */}
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Desenhe a assinatura com o dedo ou caneta stylus:</label>
                <div className="h-32 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 cursor-crosshair">
                  <span className="text-center text-[11px] px-4">
                    [ Área de Captura de Assinatura Digital Touch ]
                    <br />
                    <span className="text-[10px] text-blue-600 font-semibold">Toque na tela do smartphone ou mouse do cliente</span>
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSignOrder(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSignature}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
                >
                  Salvar Assinatura & Finalizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cobrança / Envio de Fatura ao PDV (Frente de Caixa) */}
      {chargingOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[94vh] overflow-y-auto border border-[#d8d8d8] flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-5 sm:px-6 py-4 border-b border-[#d8d8d8] flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#53383e]/10 text-[#53383e] flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#363739] text-base">
                      Cobrança & Envio ao PDV (Frente de Caixa)
                    </h3>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#53383e] text-white">
                      {chargingOS.code}
                    </span>
                  </div>
                  <p className="text-xs text-[#707174]">
                    Cliente: <strong className="text-[#363739]">{chargingOS.clientName}</strong> · Doc: {chargingOS.clientDocument}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setChargingOS(null);
                  setPdvSuccessMessage('');
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 text-xs">
              {/* Success Notification Alert */}
              {pdvSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-3 text-emerald-900 animate-in fade-in duration-200">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-xs">{pdvSuccessMessage}</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      A fatura está disponível para o operador do terminal efetuar o recebimento ou impressão do cupom térmico.
                    </p>
                  </div>
                </div>
              )}

              {/* Top Banner: Dispatch to POS Terminal */}
              <div className="p-4 bg-[#f4f5f6] rounded-xl border border-[#d8d8d8] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#53383e]" />
                    <span className="font-bold text-xs text-[#363739] uppercase tracking-wide">
                      Mandar Fatura Direto para Terminal PDV:
                    </span>
                  </div>
                  <span className="text-[11px] text-[#707174]">
                    Integração Frente de Caixa / Balcão
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <select
                    value={pdvTerminal}
                    onChange={(e) => setPdvTerminal(e.target.value)}
                    className="flex-1 p-2 bg-white border border-[#d8d8d8] rounded-lg font-medium text-xs text-[#363739] focus:outline-hidden focus:ring-1 focus:ring-[#53383e]"
                  >
                    <option value="caixa_01">Caixa 01 - Balcão Principal (Frente de Loja)</option>
                    <option value="caixa_02">Caixa 02 - Vendas & Atacado</option>
                    <option value="pdv_movel">PDV Móvel - Maquininha / Smartphone do Técnico</option>
                    <option value="caixa_retirada">Caixa 03 - Retirada & Assistência Técnica</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleSendToPDVTerminal}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#363739] hover:bg-[#252627] rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Mandar Fatura ao PDV</span>
                  </button>
                </div>
              </div>

              {/* Financial Breakdown & Partial/Installment Mode */}
              {(() => {
                const servicesTotal = chargingOS.services.reduce((acc, s) => acc + s.price, 0);
                const partsTotal = chargingOS.parts.reduce((acc, p) => acc + p.quantity * p.price, 0);
                const visitFee = Number(chargingOS.visitFee || 0);
                const discount = Number(chargingOS.calculatedDiscount || 0);
                const grandTotal = Math.max(0, servicesTotal + partsTotal + visitFee - discount);
                const paidSoFar = getPaidAmountForSource('os', chargingOS.id);
                const remainingBalance = Math.max(0, Number((grandTotal - paidSoFar).toFixed(2))) || grandTotal;
                const pendingSplits = (chargingOS.payments || []).filter(p => p.status !== 'pago');
                const currentPayAmount =
                  pdvPayMode === 'partial'
                    ? Math.max(0, Math.min(remainingBalance, Number(pdvPartialAmount) || 0))
                    : pdvPayMode === 'installment' && pdvSelectedSplitId
                    ? Math.min(remainingBalance, Number(pendingSplits.find(s => s.id === pdvSelectedSplitId)?.amount || remainingBalance))
                    : remainingBalance;

                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-white border border-[#d8d8d8] rounded-xl text-center">
                      <div className="p-2 bg-[#f4f5f6] rounded-lg">
                        <div className="text-[10px] text-[#707174] font-semibold uppercase">Serviços</div>
                        <div className="text-xs font-bold font-mono text-[#363739] mt-0.5">{formatBRL(servicesTotal)}</div>
                      </div>
                      <div className="p-2 bg-[#f4f5f6] rounded-lg">
                        <div className="text-[10px] text-[#707174] font-semibold uppercase">Peças / Estoque</div>
                        <div className="text-xs font-bold font-mono text-[#363739] mt-0.5">{formatBRL(partsTotal)}</div>
                      </div>
                      <div className="p-2 bg-[#f4f5f6] rounded-lg">
                        <div className="text-[10px] text-[#707174] font-semibold uppercase">Total da OS</div>
                        <div className="text-xs font-bold font-mono text-[#363739] mt-0.5">{formatBRL(grandTotal)}</div>
                      </div>
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <div className="text-[10px] text-emerald-700 font-semibold uppercase">Já Pago</div>
                        <div className="text-xs font-bold font-mono text-emerald-700 mt-0.5">{formatBRL(paidSoFar)}</div>
                      </div>
                      <div className="col-span-2 sm:col-span-1 p-2 bg-[#f6eff1] border border-[#53383e]/30 rounded-lg">
                        <div className="text-[10px] text-[#53383e] font-bold uppercase">Saldo a Pagar</div>
                        <div className="text-sm font-black font-mono text-[#53383e] mt-0.5">{formatBRL(currentPayAmount)}</div>
                      </div>
                    </div>

                    <div className="p-3 bg-[#f4f5f6] border border-[#d8d8d8] rounded-xl space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-[#363739] mr-1">Tipo de Baixa:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPdvPayMode('full');
                            setPdvPartialAmount(remainingBalance);
                            setPdvCashReceived(remainingBalance);
                          }}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                            pdvPayMode === 'full'
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-white text-[#363739] border-[#d8d8d8]'
                          }`}
                        >
                          Quitação Total ({formatBRL(remainingBalance)})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPdvPayMode('partial');
                            const suggested = Number((remainingBalance * 0.5).toFixed(2));
                            setPdvPartialAmount(suggested);
                            setPdvCashReceived(suggested);
                          }}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                            pdvPayMode === 'partial'
                              ? 'bg-amber-600 text-white border-amber-700'
                              : 'bg-white text-[#363739] border-[#d8d8d8]'
                          }`}
                        >
                          Entrada / Parcial
                        </button>
                        {pendingSplits.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPdvPayMode('installment');
                              setPdvSelectedSplitId(pendingSplits[0].id);
                              setPdvPaymentMethod(pendingSplits[0].method);
                              setPdvCashReceived(pendingSplits[0].amount);
                            }}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                              pdvPayMode === 'installment'
                                ? 'bg-indigo-600 text-white border-indigo-700'
                                : 'bg-white text-[#363739] border-[#d8d8d8]'
                            }`}
                          >
                            Parcela ({pendingSplits.length})
                          </button>
                        )}
                      </div>

                      {pdvPayMode === 'partial' && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                          <div>
                            <label className="block text-[10px] font-bold text-[#363739] mb-1">Valor Recebido Agora (R$)</label>
                            <input
                              type="number"
                              min="0.01"
                              max={remainingBalance}
                              step="0.01"
                              value={pdvPartialAmount}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(remainingBalance, Number(e.target.value) || 0));
                                setPdvPartialAmount(val);
                                setPdvCashReceived(val);
                              }}
                              className="w-full p-2 bg-white border border-amber-400 rounded-lg font-mono font-bold text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#363739] mb-1">Observação do Recibo</label>
                            <input
                              type="text"
                              value={pdvReceiptNotes}
                              onChange={(e) => setPdvReceiptNotes(e.target.value)}
                              placeholder="Ex: Sinal de entrada OS"
                              className="w-full p-2 bg-white border border-[#d8d8d8] rounded-lg text-xs"
                            />
                          </div>
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="text-[10px] text-amber-800 font-bold uppercase">Saldo Restante</div>
                            <div className="text-sm font-black font-mono text-amber-900">
                              {formatBRL(Math.max(0, remainingBalance - currentPayAmount))}
                            </div>
                          </div>
                        </div>
                      )}

                      {pdvPayMode === 'installment' && pendingSplits.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {pendingSplits.map((sp, idx) => (
                            <button
                              key={sp.id}
                              type="button"
                              onClick={() => {
                                setPdvSelectedSplitId(sp.id);
                                setPdvPaymentMethod(sp.method);
                                setPdvCashReceived(sp.amount);
                              }}
                              className={`p-2 rounded-lg border text-left flex items-center justify-between cursor-pointer ${
                                pdvSelectedSplitId === sp.id
                                  ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold'
                                  : 'bg-white border-[#d8d8d8]'
                              }`}
                            >
                              <span>{sp.entryType === 'entrada' ? 'Entrada' : `Parcela ${idx + 1}`} · {sp.method.replace('_', ' ')}</span>
                              <span className="font-mono font-bold">{formatBRL(sp.amount)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Payment Methods Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-[#363739] uppercase tracking-wider text-xs">
                    Forma de Pagamento para Baixa no Caixa
                  </h4>
                  <span className="text-[11px] text-[#707174]">
                    Taxas por bandeira calculadas automaticamente
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'pix', label: 'PIX (Instantâneo)', icon: QrCode },
                    { id: 'cartao_credito', label: 'Cartão de Crédito', icon: CreditCard },
                    { id: 'cartao_debito', label: 'Cartão de Débito', icon: CreditCard },
                    { id: 'dinheiro', label: 'Dinheiro (Espécie)', icon: Receipt },
                    { id: 'boleto', label: 'Boleto Bancário', icon: Receipt },
                    { id: 'faturado_30d', label: 'Faturado (30 Dias)', icon: Store },
                  ].map(m => {
                    const Icon = m.icon;
                    const isSelected = pdvPaymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPdvPaymentMethod(m.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-[#53383e] text-white border-[#53383e] shadow-2xs'
                            : 'bg-white text-[#363739] border-[#d8d8d8] hover:border-[#53383e]/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] font-bold leading-tight">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Method Details */}
              <div className="p-4 bg-[#f4f5f6] rounded-xl border border-[#d8d8d8] space-y-3">
                {pdvPaymentMethod === 'pix' && chargingOS && (() => {
                  const osFin = calculateServiceOrderFinancials(chargingOS, getPaidAmountForSource('os', chargingOS.id));
                  const rem = osFin.remainingBalance;
                  let pixTargetAmount: number | null = osFin.hasDefinedValue ? rem : null;
                  if (osFin.hasDefinedValue) {
                    if (pdvPayMode === 'partial') {
                      pixTargetAmount = Math.max(0.01, Math.min(rem, Number(pdvPartialAmount) || rem));
                    } else if (pdvPayMode === 'installment' && pdvSelectedSplitId) {
                      const sp = (chargingOS.payments || []).find(p => p.id === pdvSelectedSplitId);
                      if (sp) pixTargetAmount = Math.min(rem, Number(sp.amount || rem));
                    }
                  }
                  const pdvPixData = buildCompanyCnpjPixBrCode({
                    company: companySettings,
                    amount: pixTargetAmount,
                    txidSource: chargingOS.code
                  });

                  return (
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-[#d8d8d8]">
                      {/* Real BR Code PIX QR */}
                      <div className="w-36 h-36 bg-white p-2 border-2 border-[#53383e] rounded-xl flex flex-col items-center justify-center shrink-0 shadow-2xs">
                        {pdvPixQrUrl ? (
                          <img
                            src={pdvPixQrUrl}
                            alt="QR Code PIX BR Code"
                            className="w-28 h-28 object-contain"
                          />
                        ) : (
                          <div className="text-[10px] text-slate-400">Gerando QR...</div>
                        )}
                        <span className="text-[8.5px] font-black text-[#53383e] mt-0.5 uppercase">
                          Chave CNPJ
                        </span>
                      </div>

                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs font-bold text-[#363739]">
                            Pague via PIX (Chave CNPJ: {pdvPixData.pixKeyDisplay})
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                            {pixTargetAmount && pixTargetAmount > 0
                              ? `Valor no QR: ${formatBRL(pixTargetAmount)}`
                              : 'QR Estático (Valor aberto)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#707174]">
                          QR Code gerado automaticamente no padrão BR Code com o CNPJ da empresa e o saldo selecionado para cobrança.
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={pdvPixData.payload}
                            className="flex-1 p-2 bg-[#f4f5f6] border border-[#d8d8d8] rounded-lg font-mono text-[11px] text-[#363739]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(pdvPixData.payload);
                              setCopiedPix(true);
                              setTimeout(() => setCopiedPix(false), 2500);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg cursor-pointer"
                          >
                            {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {pdvPaymentMethod === 'cartao_credito' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[#707174] font-medium mb-1">Bandeira do Cartão</label>
                        <select
                          value={pdvCardBrand}
                          onChange={(e) => setPdvCardBrand(e.target.value as any)}
                          className="w-full p-2 bg-white border border-[#d8d8d8] rounded-lg font-semibold text-xs"
                        >
                          <option value="visa">Visa</option>
                          <option value="mastercard">Mastercard</option>
                          <option value="elo">Elo</option>
                          <option value="hipercard">Hipercard</option>
                          <option value="outra">Outras Bandeiras (Amex / Diners)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[#707174] font-medium mb-1">Número de Parcelas</label>
                        <select
                          value={pdvInstallments}
                          onChange={(e) => setPdvInstallments(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-[#d8d8d8] rounded-lg font-semibold text-xs"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => {
                            const sub = chargingOS.services.reduce((acc, s) => acc + s.price, 0) + chargingOS.parts.reduce((acc, p) => acc + p.quantity * p.price, 0) + (chargingOS.visitFee || 0) - (chargingOS.calculatedDiscount || 0);
                            return (
                              <option key={n} value={n}>
                                {n}x de {formatBRL(sub / n)} {n === 1 ? '(à vista)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[#707174] font-medium mb-1">Cód. Autorização / Maquininha</label>
                        <input
                          type="text"
                          placeholder="Ex: NSU 847291"
                          value={pdvAuthCode}
                          onChange={(e) => setPdvAuthCode(e.target.value)}
                          className="w-full p-2 bg-white border border-[#d8d8d8] rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>

                    {/* Card Fee Calculation notice */}
                    {(() => {
                      const grandTotal = chargingOS.services.reduce((acc, s) => acc + s.price, 0) + chargingOS.parts.reduce((acc, p) => acc + p.quantity * p.price, 0) + (chargingOS.visitFee || 0) - (chargingOS.calculatedDiscount || 0);
                      const rateConfig = cardRates.find(r => r.brand === pdvCardBrand);
                      const ratePct = pdvInstallments === 1 
                        ? (rateConfig?.creditSightRate ?? 2.99)
                        : (rateConfig?.creditInstallmentsRate ?? 4.20);
                      const feeVal = grandTotal * (ratePct / 100);
                      const netVal = grandTotal - feeVal;

                      return (
                        <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-[#d8d8d8] text-[11px]">
                          <span className="text-[#707174]">
                            Taxa Máquina ({pdvCardBrand.toUpperCase()} {pdvInstallments}x): <strong className="text-[#363739]">{ratePct}%</strong> (-{formatBRL(feeVal)})
                          </span>
                          <span className="text-emerald-700 font-bold font-mono">
                            Líquido a Receber: {formatBRL(netVal)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {pdvPaymentMethod === 'cartao_debito' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#707174] font-medium mb-1">Bandeira</label>
                      <select
                        value={pdvCardBrand}
                        onChange={(e) => setPdvCardBrand(e.target.value as any)}
                        className="w-full p-2 bg-white border border-[#d8d8d8] rounded-lg font-semibold text-xs"
                      >
                        <option value="visa">Visa Electron</option>
                        <option value="mastercard">Mastercard Débito</option>
                        <option value="elo">Elo Débito</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#707174] font-medium mb-1">Cód. Autorização / NSU</label>
                      <input
                        type="text"
                        placeholder="Ex: NSU 982143"
                        value={pdvAuthCode}
                        onChange={(e) => setPdvAuthCode(e.target.value)}
                        className="w-full p-2 bg-white border border-[#d8d8d8] rounded-lg font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                {pdvPaymentMethod === 'dinheiro' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#707174] font-medium mb-1">Valor Entregue pelo Cliente (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 500,00"
                          value={pdvCashReceived || ''}
                          onChange={(e) => setPdvCashReceived(Number(e.target.value) || 0)}
                          className="w-full p-2 bg-white border border-[#d8d8d8] rounded-lg font-mono font-bold text-sm text-[#363739]"
                        />
                      </div>

                      {(() => {
                        const grandTotal = chargingOS.services.reduce((acc, s) => acc + s.price, 0) + chargingOS.parts.reduce((acc, p) => acc + p.quantity * p.price, 0) + (chargingOS.visitFee || 0) - (chargingOS.calculatedDiscount || 0);
                        const received = Number(pdvCashReceived || 0);
                        const change = received > grandTotal ? received - grandTotal : 0;
                        const pending = received > 0 && received < grandTotal ? grandTotal - received : 0;

                        return (
                          <div className="p-2.5 bg-white rounded-lg border border-[#d8d8d8] flex flex-col justify-center">
                            {received >= grandTotal ? (
                              <div>
                                <span className="text-[10px] text-emerald-700 font-bold uppercase">Troco a Devolver:</span>
                                <div className="text-base font-black font-mono text-emerald-700">{formatBRL(change)}</div>
                              </div>
                            ) : pending > 0 ? (
                              <div>
                                <span className="text-[10px] text-rose-700 font-bold uppercase">Falta Pagar:</span>
                                <div className="text-base font-black font-mono text-rose-600">{formatBRL(pending)}</div>
                              </div>
                            ) : (
                              <div className="text-[#707174] text-[11px]">
                                Digite o valor recebido para calcular o troco exato na gaveta do caixa.
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {pdvPaymentMethod === 'boleto' && (
                  <div className="p-3 bg-white rounded-lg border border-[#d8d8d8] space-y-1">
                    <div className="font-bold text-xs text-[#363739]">Boleto Bancário Registrado</div>
                    <p className="text-[11px] text-[#707174]">
                      Vencimento padrão: <strong>{new Date(Date.now() + 3 * 86400000).toLocaleDateString('pt-BR')}</strong> (3 dias úteis). O código de barras será anexado à fatura.
                    </p>
                  </div>
                )}

                {pdvPaymentMethod === 'faturado_30d' && (
                  <div className="p-3 bg-white rounded-lg border border-[#d8d8d8] space-y-1">
                    <div className="font-bold text-xs text-[#363739]">Faturamento a Prazo (30 Dias)</div>
                    <p className="text-[11px] text-[#707174]">
                      Condição exclusiva para Pessoa Jurídica com cadastro aprovado e limite de crédito vigente. Vencimento: <strong>{new Date(Date.now() + 30 * 86400000).toLocaleDateString('pt-BR')}</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="sticky bottom-0 bg-white px-5 sm:px-6 py-3.5 border-t border-[#d8d8d8] flex flex-wrap items-center justify-between gap-2 z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSendWhatsAppInvoice}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                  title="Enviar link de cobrança e fatura no WhatsApp do cliente"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Cobrar no WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintOS(chargingOS)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#363739] bg-white hover:bg-[#d8d8d8]/40 border border-[#d8d8d8] rounded-lg transition-colors cursor-pointer"
                  title="Imprimir cupom térmico / comprovante PDV"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Cupom</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadOS(chargingOS)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#363739] bg-white hover:bg-[#d8d8d8]/40 border border-[#d8d8d8] rounded-lg transition-colors cursor-pointer"
                  title="Baixar fatura em arquivo HTML/PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Fatura</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setChargingOS(null);
                    setPdvSuccessMessage('');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#707174] bg-[#f4f5f6] hover:bg-[#d8d8d8] rounded-lg transition-colors cursor-pointer"
                >
                  Fechar
                </button>

                <button
                  type="button"
                  onClick={handleSettleInPDV}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar & Gerar Recibo</span>
                </button>
              </div>
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
        defaultTemplateId={whatsAppModalData.templateId}
        contextVariables={whatsAppModalData.variables}
      />

      {/* Atalho: Modal de Cadastro Rápido de Cliente direto na tela de OS */}
      <QuickClientModal
        isOpen={isQuickClientModalOpen}
        onClose={() => setIsQuickClientModalOpen(false)}
        onClientCreated={(createdClient) => {
          setClientId(createdClient.id);
          if (createdClient.addresses && createdClient.addresses.length > 0) {
            setSelectedAddressId(createdClient.addresses[0].id);
          } else {
            setSelectedAddressId('');
          }
          setDemoLoadedMsg(`Cliente "${createdClient.name}" cadastrado com sucesso e já selecionado para Ordens de Serviço!`);
          setTimeout(() => setDemoLoadedMsg(null), 5000);
        }}
      />

      {/* Modal Rápida de Fotos da OS (Início · Antes do Serviço & Local de Entrega) */}
      {photosModalOS && (() => {
        const liveOS = serviceOrders.find(o => o.id === photosModalOS.id) || photosModalOS;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPhotosModalOS(null);
            }}
          >
            <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
              <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Fotos da Ordem de Serviço · {liveOS.code}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {liveOS.clientName} · {liveOS.clientAddress || 'Local de atendimento'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPhotosModalOS(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-5 overflow-y-auto">
                <ServiceOrderPhotosPanel
                  readOnly={currentRole === 'cliente'}
                  entryPhotos={liveOS.entryPhotos || []}
                  exitPhotos={liveOS.exitPhotos || []}
                  onChangeEntryPhotos={(nextEntry) => {
                    updateServiceOrder(liveOS.id, { entryPhotos: nextEntry });
                  }}
                  onChangeExitPhotos={(nextExit) => {
                    updateServiceOrder(liveOS.id, { exitPhotos: nextExit });
                  }}
                />
              </div>

              <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
                <span className="text-slate-500">
                  As fotos são salvas automaticamente na Ordem de Serviço.
                </span>
                <button
                  type="button"
                  onClick={() => setPhotosModalOS(null)}
                  className="px-4 py-1.5 font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Modal Condicional: Impressão / PDF do Termo de Garantia */}
      {warrantyPromptState && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Termo de Garantia Vinculado
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    OS Nº <strong>{warrantyPromptState.os.code}</strong> · {warrantyPromptState.policyName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWarrantyPromptState(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-800 leading-relaxed font-medium">
                Esta OS possui termo de garantia vinculado. Deseja imprimir o termo de garantia junto?
              </p>
              {warrantyPromptState.remainingBalance > 0.01 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                  <strong>Saldo pendente de {formatBRL(warrantyPromptState.remainingBalance)}:</strong> como esta OS já está com o status{' '}
                  <strong>Entregue / Finalizada</strong>, o Termo de Garantia está liberado e pode ser gerado normalmente.
                </div>
              )}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                Ao escolher <strong>Sim</strong>, o Termo de Garantia será gerado obrigatoriamente em uma{' '}
                <strong>nova página separada</strong>, repetindo o cabeçalho padrão da OS (logo, dados da empresa, dados do cliente e o número{' '}
                <strong>OS Nº {warrantyPromptState.os.code}</strong> em destaque).
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setWarrantyPromptState(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const { os, mode } = warrantyPromptState;
                  setWarrantyPromptState(null);
                  if (mode === 'print') {
                    executePrintOS(os, false);
                  } else {
                    void executeDownloadOS(os, false);
                  }
                }}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Não
              </button>
              <button
                type="button"
                onClick={() => {
                  const { os, mode } = warrantyPromptState;
                  setWarrantyPromptState(null);
                  if (mode === 'print') {
                    executePrintOS(os, true);
                  } else {
                    void executeDownloadOS(os, true);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Sim</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
