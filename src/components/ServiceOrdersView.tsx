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
  Smartphone
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../context/AppContext';
import { 
  ServiceOrder, 
  ServiceOrderStatus, 
  ServiceItem, 
  PartItem, 
  PaymentMethod, 
  ChecklistItem, 
  PaymentSplit, 
  CardBrand 
} from '../types';
import { ServiceOrderPrintTemplate } from './ServiceOrderPrintTemplate';
import { getScopedServiceOrders } from '../security/secureDataAccess';

interface ServiceOrdersViewProps {
  isNewModalOpen: boolean;
  setIsNewModalOpen: (open: boolean) => void;
}

export const ServiceOrdersView: React.FC<ServiceOrdersViewProps> = ({ 
  isNewModalOpen, 
  setIsNewModalOpen 
}) => {
  const { 
    serviceOrders, 
    employees, 
    vehicles, 
    clients, 
    products, 
    cardRates,
    addServiceOrder, 
    updateServiceOrder, 
    deleteServiceOrder,
    convertBudgetToOrderOrSale,
    currentRole,
    currentUser
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [selectedOSForDetail, setSelectedOSForDetail] = useState<ServiceOrder | null>(null);

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
  const [forecastDate, setForecastDate] = useState('2026-10-31');
  const [status, setStatus] = useState<ServiceOrderStatus>('orcamento_aberto');

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

  // Payment splits
  const [payments, setPayments] = useState<PaymentSplit[]>([
    { id: 'p1', method: 'pix', amount: 1260, netAmount: 1260 }
  ]);

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

  const handleAddService = () => {
    setServices(prev => [
      ...prev,
      { id: String(Date.now()), name: '', hours: 1, price: 150 }
    ]);
  };

  const handleAddPart = () => {
    setParts(prev => [
      ...prev,
      { id: String(Date.now()), name: '', cost: 50, price: 120, quantity: 1, unit: 'PC' }
    ]);
  };

  const handleAddSplitPayment = () => {
    setPayments(prev => [
      ...prev,
      { id: String(Date.now()), method: 'cartao_credito', cardBrand: 'visa', installments: 3, ratePercentage: 4.5, rateAmount: 45, amount: 1000, netAmount: 955 }
    ]);
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

  const handleOpenEdit = (os: ServiceOrder) => {
    setEditingOSId(os.id);
    setEditingOSCode(os.code);
    setClientId(os.clientId);
    setSelectedAddressId('');
    setEmployeeId(os.employeeId);
    setVehicleId(os.vehicleId || '');
    setKmDriven(os.kmDriven || 0);
    setDescription(os.description || '');
    setForecastDate(os.forecastDate || '2026-10-31');
    setStatus(os.status);
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
    setPayments(os.payments && os.payments.length > 0 ? os.payments : []);
    setIsNewModalOpen(true);
  };

  const handlePrintOS = (os: ServiceOrder) => {
    const prevTitle = document.title;
    // Define o título como OS-NUMERO para o navegador preencher no nome do arquivo ao Salvar como PDF
    const printDocTitle = `OS-${os.code}`;
    document.title = printDocTitle;
    setSelectedOSForDetail(os);

    const onAfterPrint = () => {
      window.removeEventListener('afterprint', onAfterPrint);
      setTimeout(() => {
        if (!selectedOSForDetail) {
          document.title = prevTitle || 'MP PISCINA - ERP';
        }
      }, 3000);
    };
    window.addEventListener('afterprint', onAfterPrint);

    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handleDownloadOS = (os: ServiceOrder) => {
    const activeParts = (os.parts || []).filter(p => p.name && p.name.trim() !== '');
    const activeServices = (os.services || []).filter(s => s.name && s.name.trim() !== '');
    const hasParts = activeParts.length > 0;
    const hasServices = activeServices.length > 0;

    const partsTotal = activeParts.reduce((a, p) => a + (Number(p.price || 0) * Number(p.quantity || 1)), 0);
    const srvTotal = activeServices.reduce((a, s) => a + Number(s.price || 0), 0);
    const visitFee = Number(os.visitFee || 0);
    const discount = Number(os.calculatedDiscount || 0);
    const grandTotal = Math.max(0, partsTotal + srvTotal + visitFee - discount);
    const isPaid = os.paymentStatus === 'pago';
    const totalPaid = isPaid ? grandTotal : 0;
    const totalDue = Math.max(0, grandTotal - totalPaid);

    const addressParts = (os.clientAddress || '').split(' - ');
    const streetPart = addressParts[0] || os.clientAddress || '';
    const cityStatePart = addressParts[1] || 'Brasília / DF';
    const technician = employees.find(e => e.id === os.employeeId)?.name || 'Hugo Gandy';

    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${os.code}</title>
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
    .check-item { display: inline-flex; align-items: center; gap: 4px; margin: 1px 6px 1px 0; }
    .check-icon-ok { background: #10b981; color: #fff; width: 13px; height: 13px; display: inline-flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; border-radius: 2px; }
    .check-icon-bad { background: #ef4444; color: #fff; width: 13px; height: 13px; display: inline-flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; border-radius: 2px; }
    .finance-row-total { background: #e8f5e9; font-weight: 900; }
    .finance-row-due { background: ${totalDue > 0 ? '#ffebee' : '#e8f5e9'}; font-weight: 900; color: ${totalDue > 0 ? '#991b1b' : '#166534'}; }
    .signature-area { margin-top: 20px; border-top: 1px solid #cbd5e1; padding-top: 10px; display: grid; grid-template-columns: 1fr 1fr; text-align: center; }
    .sig-line { width: 200px; border-top: 1px solid #0f172a; margin: 20px auto 3px auto; font-weight: bold; font-size: 10.5px; text-transform: uppercase; }
  </style>
</head>
<body>
  {/* Header with Logo on Left and OS Number Box on Top Right */}
  <div class="header">
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="width: 50px; height: 50px; border-radius: 8px; background: linear-gradient(135deg, #0284c7, #1d4ed8); display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; flex-shrink: 0;">
        <svg style="width: 26px; height: 26px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 12h20" /><path d="M20 12v8H4v-8" /><path d="m4 8 16-4" /><path d="m4 4 16 4" />
          <circle cx="12" cy="12" r="3" fill="#ffffff" stroke="none" />
        </svg>
        <span style="font-size: 6px; font-weight: 900; letter-spacing: 0.5px; margin-top: 1px;">MP PISCINA</span>
      </div>
      <div>
        <h1 class="company-title">MP PISCINA</h1>
        <div class="company-sub" style="color: #0f172a; font-weight: bold;">AQUECIMENTO, FILTROS & ASSISTÊNCIA TÉCNICA ESPECIALIZADA</div>
        <div class="company-sub">QUADRA QR 114 CONJUNTO 6, 201 - SAMAMBAIA SUL (SAMAMBAIA) · BRASILIA / DF</div>
        <div class="company-sub" style="color: #0f172a; font-weight: bold;">(61) 99860-1113 | mppiscina2004@gmail.com</div>
      </div>
    </div>

    <div style="border: 2px solid #0f172a; border-radius: 8px; overflow: hidden; background: #fff; text-align: center; min-width: 185px; flex-shrink: 0;">
      <div style="background: #0f172a; color: #fff; padding: 4px 8px; font-size: 9.5px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">
        ORDEM DE SERVIÇO
      </div>
      <div style="padding: 5px 8px; background: #f8fafc;">
        <div style="font-size: 18px; font-weight: 900; font-family: monospace; color: #0f172a; letter-spacing: 1px;">
          Nº ${os.code}
        </div>
        <div style="font-size: 8px; color: #475569; font-weight: bold; margin-top: 1px; text-transform: uppercase;">
          Emissão: ${formatDateBR(os.openDate)}
        </div>
      </div>
    </div>
  </div>

  <div class="grid-2">
    <div class="card" style="margin-bottom: 0;">
      <div class="card-header">DADOS DO CLIENTE</div>
      <div class="card-body">
        <div><span class="label">NOME: </span><span style="font-weight: bold; text-transform: uppercase;">${os.clientName}</span></div>
        <div style="display: flex; justify-content: space-between; margin-top: 3px;">
          <div><span class="label">CPF/CNPJ: </span>${os.clientDocument || '-'}</div>
          <div><span class="label">TEL: </span>${os.clientPhone || '-'}</div>
        </div>
        <div style="margin-top: 3px;"><span class="label">END.: </span>${streetPart || '-'}</div>
        <div style="margin-top: 3px;"><span class="label">CIDADE.: </span>${cityStatePart}</div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 0;">
      <div class="card-header">PRAZOS E RESPONSÁVEL</div>
      <div class="card-body">
        <div style="display: flex; justify-content: space-between;">
          <div><span class="label">ENTRADA: </span>${formatDateBR(os.openDate)}</div>
          <div><span class="label">PREVISÃO: </span>${formatDateBR(os.forecastDate)}</div>
        </div>
        <div style="margin-top: 3px;">
          <span class="label">GARANTIA: </span>${os.warrantyPeriodDays} Dias ${os.warrantyExpiresAt ? `(até ${formatDateBR(os.warrantyExpiresAt)})` : ''}
        </div>
        <div style="margin-top: 3px;">
          <span class="label">TÉCNICO: </span><span style="font-weight: bold; text-transform: uppercase;">${technician}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header">EQUIPAMENTO E DIAGNÓSTICO</div>
    <div class="card-body">
      <div>
        <span class="label">EQUIPAMENTO: </span>
        <span style="font-weight: bold;">${os.equipmentType || 'Multi estruturas Concreto Azul claro'}${os.equipmentModel ? ` · ${os.equipmentModel}` : ''}${os.equipmentSerial ? ` (S/N: ${os.equipmentSerial})` : ''}</span>
      </div>
      <div style="margin-top: 6px;">
        <div style="background: #f1f5f9; padding: 2px 6px; font-size: 9px; font-weight: bold; color: #475569; text-transform: uppercase; border: 1px solid #e2e8f0;">
          DEFEITO RELATADO:
        </div>
        <div style="padding: 4px 6px; font-weight: 500;">
          ${os.description || 'Aquecimento da Piscina / Manutenção Preventiva e Corretiva'}
        </div>
      </div>
    </div>
  </div>

  <div class="grid-2">
    <div class="card" style="margin-bottom: 0;">
      <div class="card-header">CHECKLIST ENTRADA</div>
      <div class="card-body" style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
        <div><span class="check-icon-ok">✓</span> Dreno fundo</div>
        <div><span class="check-icon-ok">✓</span> Retorno</div>
        <div><span class="check-icon-ok">✓</span> Tubulações ida/volta</div>
        <div><span class="check-icon-ok">✓</span> Cabos adequados</div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 0;">
      <div class="card-header">CHECKLIST SAÍDA</div>
      <div class="card-body" style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
        <div><span class="check-icon-bad">✗</span> Teste funcionam. aquec</div>
        <div><span class="check-icon-bad">✗</span> Controlador testado</div>
        <div><span class="check-icon-bad">✗</span> Bomba funcionando</div>
      </div>
    </div>
  </div>

  ${/* CONDITIONAL PRODUCT & SERVICE RENDERING */ ''}
  ${hasParts && hasServices ? `
  <div class="grid-2" style="margin-top: 10px;">
    <div class="card" style="margin-bottom: 0;">
      <div class="card-header">PEÇAS / PRODUTOS</div>
      <table>
        <thead>
          <tr>
            <th>DESCRIÇÃO</th>
            <th style="text-align: center; width: 40px;">QTD</th>
            <th style="text-align: right; width: 80px;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${activeParts.map(p => `
            <tr>
              <td>${p.name}</td>
              <td style="text-align: center; font-family: monospace;">${Number(p.quantity).toFixed(2)}</td>
              <td style="text-align: right; font-family: monospace; font-weight: 500;">${formatBRL(Number(p.price || 0) * Number(p.quantity || 1))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="card" style="margin-bottom: 0;">
      <div class="card-header">MÃO DE OBRA</div>
      <table>
        <thead>
          <tr>
            <th>DESCRIÇÃO</th>
            <th style="text-align: center; width: 40px;">QTD</th>
            <th style="text-align: right; width: 80px;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${activeServices.map(s => `
            <tr>
              <td>${s.name}</td>
              <td style="text-align: center; font-family: monospace;">${Number(s.hours || 1).toFixed(2)}</td>
              <td style="text-align: right; font-family: monospace; font-weight: 500;">${formatBRL(Number(s.price || 0))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
  ` : ''}

  ${hasParts && !hasServices ? `
  <div class="card" style="margin-top: 10px;">
    <div class="card-header">PEÇAS / PRODUTOS (VENDA)</div>
    <table>
      <thead>
        <tr>
          <th>DESCRIÇÃO</th>
          <th style="text-align: center; width: 50px;">QTD</th>
          <th style="text-align: right; width: 90px;">UNITÁRIO</th>
          <th style="text-align: right; width: 90px;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${activeParts.map(p => `
          <tr>
            <td style="font-weight: 500;">${p.name}</td>
            <td style="text-align: center; font-family: monospace;">${Number(p.quantity).toFixed(2)}</td>
            <td style="text-align: right; font-family: monospace;">${formatBRL(Number(p.price || 0))}</td>
            <td style="text-align: right; font-family: monospace; font-weight: bold;">${formatBRL(Number(p.price || 0) * Number(p.quantity || 1))}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${!hasParts && hasServices ? `
  <div class="card" style="margin-top: 10px;">
    <div class="card-header">MÃO DE OBRA (SERVIÇOS)</div>
    <table>
      <thead>
        <tr>
          <th>DESCRIÇÃO DO SERVIÇO</th>
          <th style="text-align: center; width: 60px;">HORAS/QTD</th>
          <th style="text-align: right; width: 100px;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${activeServices.map(s => `
          <tr>
            <td style="font-weight: 500;">${s.name}</td>
            <td style="text-align: center; font-family: monospace;">${Number(s.hours || 1).toFixed(2)}</td>
            <td style="text-align: right; font-family: monospace; font-weight: bold;">${formatBRL(Number(s.price || 0))}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="grid-2" style="margin-top: 10px;">
    <div class="card" style="margin-bottom: 0;">
      <div class="card-header">RESUMO FINANCEIRO</div>
      <table style="font-family: monospace;">
        <tbody>
          ${hasParts ? `
            <tr>
              <td style="font-family: sans-serif;">Total Produtos</td>
              <td style="text-align: right;">${formatBRL(partsTotal)}</td>
            </tr>
          ` : ''}
          ${hasServices ? `
            <tr>
              <td style="font-family: sans-serif;">Total Serviços</td>
              <td style="text-align: right;">${formatBRL(srvTotal)}</td>
            </tr>
          ` : ''}
          ${visitFee > 0 ? `
            <tr>
              <td style="font-family: sans-serif;">Taxa de Visita Técnica</td>
              <td style="text-align: right;">${formatBRL(visitFee)}</td>
            </tr>
          ` : ''}
          ${discount > 0 ? `
            <tr style="color: #b91c1c;">
              <td style="font-family: sans-serif;">Desconto Concedido</td>
              <td style="text-align: right;">-${formatBRL(discount)}</td>
            </tr>
          ` : ''}
          <tr class="finance-row-total">
            <td style="font-family: sans-serif; font-weight: 900;">VALOR TOTAL</td>
            <td style="text-align: right; font-weight: 900;">${formatBRL(grandTotal)}</td>
          </tr>
          <tr>
            <td style="font-family: sans-serif; font-weight: bold;">TOTAL PAGO</td>
            <td style="text-align: right; font-weight: bold;">${formatBRL(totalPaid)}</td>
          </tr>
          <tr class="finance-row-due">
            <td style="font-family: sans-serif; font-weight: 900;">VALOR DEVIDO</td>
            <td style="text-align: right; font-weight: 900;">${formatBRL(totalDue)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card" style="margin-bottom: 0; text-align: center; display: flex; flex-direction: column;">
      <div class="card-header">PAGAMENTO VIA PIX</div>
      <div class="card-body" style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;">
        <div style="border: 2px solid #111827; padding: 4px; border-radius: 6px; width: 90px; height: 90px; margin: 0 auto 6px auto;">
          <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
            <rect width="30" height="30" x="5" y="5" fill="#111827" />
            <rect width="20" height="20" x="10" y="10" fill="white" />
            <rect width="10" height="10" x="15" y="15" fill="#111827" />
            <rect width="30" height="30" x="65" y="5" fill="#111827" />
            <rect width="20" height="20" x="70" y="10" fill="white" />
            <rect width="10" height="10" x="75" y="15" fill="#111827" />
            <rect width="30" height="30" x="5" y="65" fill="#111827" />
            <rect width="20" height="20" x="10" y="70" fill="white" />
            <rect width="10" height="10" x="15" y="75" fill="#111827" />
            <rect width="8" height="8" x="46" y="12" fill="#111827" />
            <rect width="8" height="8" x="46" y="46" fill="#111827" />
            <rect width="8" height="8" x="65" y="46" fill="#111827" />
            <rect width="8" height="8" x="46" y="65" fill="#111827" />
          </svg>
        </div>
        <div style="font-weight: bold; font-size: 10px;">Chave PIX: mppiscina2004@gmail.com</div>
        <div style="font-size: 9px; color: #64748b;">Titular: MP PISCINA</div>
      </div>
    </div>
  </div>

  <div class="signature-area">
    <div>
      ${os.signature ? `
        <div style="margin-bottom: -15px;"><img src="${os.signature.signatureDataUrl}" style="height: 35px;" /></div>
      ` : ''}
      <div class="sig-line">${os.clientName}</div>
    </div>
    <div>
      <div style="font-family: serif; font-style: italic; color: #1e3a8a; font-weight: bold; margin-bottom: -15px;">MP Piscina</div>
      <div class="sig-line">MP PISCINA</div>
      <div style="font-size: 9px; color: #64748b;">Assinatura do Profissional</div>
    </div>
  </div>
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
  };

  const handleOpenPDV = (os: ServiceOrder) => {
    setChargingOS(os);
    setPdvSuccessMessage(null);
    setPdvPaymentMethod(os.paymentMethod || 'pix');
    setPdvCardBrand('visa');
    setPdvInstallments(1);
    setPdvAuthCode('');
    setCopiedPix(false);
    setIsMultiSplit(false);

    const srvTotal = os.services.reduce((a, s) => a + Number(s.price || 0), 0);
    const prtTotal = os.parts.reduce((a, p) => a + (Number(p.price || 0) * Number(p.quantity || 1)), 0);
    const grandTotal = Math.max(0, srvTotal + prtTotal + Number(os.visitFee || 0) - Number(os.calculatedDiscount || 0));

    setPdvCashReceived(grandTotal);
    setPdvSplits([
      { id: 'split-1', method: 'pix', amount: grandTotal, netAmount: grandTotal }
    ]);
  };

  const handleSendToPDVTerminal = () => {
    if (!chargingOS) return;
    const terminalName = pdvTerminal === 'pdv-01' 
      ? 'Caixa 01 - Balcão Principal' 
      : pdvTerminal === 'pdv-02' 
      ? 'Caixa 02 - Balcão Peças & Rápido' 
      : 'PDV Móvel - Maquininha Campo';
    setPdvSuccessMessage(`Fatura ${chargingOS.code} enviada com sucesso para a fila do terminal ${terminalName}! Aguardando liquidação no caixa.`);
  };

  const handleSettleInPDV = () => {
    if (!chargingOS) return;
    const srvTotal = chargingOS.services.reduce((a, s) => a + Number(s.price || 0), 0);
    const prtTotal = chargingOS.parts.reduce((a, p) => a + (Number(p.price || 0) * Number(p.quantity || 1)), 0);
    const grandTotal = Math.max(0, srvTotal + prtTotal + Number(chargingOS.visitFee || 0) - Number(chargingOS.calculatedDiscount || 0));

    let rateAmount = 0;
    let netAmount = grandTotal;
    if (pdvPaymentMethod === 'cartao_credito') {
      const matchedRate = cardRates.find(r => r.brand === pdvCardBrand);
      const ratePct = pdvInstallments === 1 
        ? (matchedRate?.creditSightRate || 3.5) 
        : (matchedRate?.creditInstallmentsRate || 5.2);
      rateAmount = (grandTotal * ratePct) / 100;
      netAmount = grandTotal - rateAmount;
    }

    const finalPayments: PaymentSplit[] = isMultiSplit && pdvSplits.length > 0 
      ? pdvSplits 
      : [{
          id: `pay-${Date.now()}`,
          method: pdvPaymentMethod,
          cardBrand: pdvPaymentMethod.includes('cartao') ? pdvCardBrand : undefined,
          installments: pdvPaymentMethod === 'cartao_credito' ? pdvInstallments : undefined,
          rateAmount,
          amount: grandTotal,
          netAmount
        }];

    updateServiceOrder(chargingOS.id, {
      paymentStatus: 'pago',
      paymentMethod: pdvPaymentMethod,
      payments: finalPayments,
      status: chargingOS.status === 'orcamento_aberto' || chargingOS.status === 'aguardando_aprovacao' ? 'aprovada_em_andamento' : chargingOS.status
    });

    setPdvSuccessMessage(`Fatura ${chargingOS.code} LIQUIDADA no PDV! Valor: ${formatBRL(grandTotal)}. Autenticação: NSU-${Math.floor(100000 + Math.random() * 900000)}.`);
    setTimeout(() => {
      setChargingOS(null);
    }, 2000);
  };

  const handleSendWhatsAppInvoice = () => {
    if (!chargingOS) return;
    const srvTotal = chargingOS.services.reduce((a, s) => a + Number(s.price || 0), 0);
    const prtTotal = chargingOS.parts.reduce((a, p) => a + (Number(p.price || 0) * Number(p.quantity || 1)), 0);
    const grandTotal = Math.max(0, srvTotal + prtTotal + Number(chargingOS.visitFee || 0) - Number(chargingOS.calculatedDiscount || 0));

    const cleanPhone = chargingOS.clientPhone.replace(/\D/g, '');
    const message = `Olá ${chargingOS.clientName}, segue a fatura da sua Ordem de Serviço ${chargingOS.code} no GestãoPro:
Valor Total: ${formatBRL(grandTotal)}
Chave Pix: pix@gestaopro.com.br (GestãoPro ERP)
Equipamento: ${chargingOS.equipmentType || 'Aquecedor / Tanque'}
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

    if (editingOSId) {
      updateServiceOrder(editingOSId, {
        clientId: clientObj.id,
        clientName: clientObj.name,
        clientDocument: clientObj.document,
        clientPhone: clientObj.phone,
        clientAddress: formattedAddress,
        employeeId,
        vehicleId: vehicleId || undefined,
        kmDriven: Number(kmDriven) || 0,
        status,
        forecastDate,
        completionDate: (status === 'concluida_aguardando_retirada' || status === 'entregue_finalizada') ? new Date().toISOString().split('T')[0] : undefined,
        equipmentType,
        equipmentModel,
        equipmentSerial,
        equipmentYear,
        warrantyPeriodDays: Number(warrantyPeriodDays),
        warrantyExpiresAt: new Date(Date.now() + Number(warrantyPeriodDays) * 86400000).toISOString().split('T')[0],
        visitFee: Number(visitFee),
        description,
        services: services.filter(s => s.name.trim() !== ''),
        parts: parts.filter(p => p.name.trim() !== ''),
        discountType,
        discountValue: Number(discountValue),
        calculatedDiscount,
        paymentMethod: payments[0]?.method || 'pix',
        payments,
        checklists
      });
      setEditingOSId(null);
      setEditingOSCode(null);
      setIsNewModalOpen(false);
      return;
    }

    addServiceOrder({
      clientId: clientObj.id,
      clientName: clientObj.name,
      clientDocument: clientObj.document,
      clientPhone: clientObj.phone,
      clientAddress: formattedAddress,
      employeeId,
      vehicleId: vehicleId || undefined,
      kmDriven: Number(kmDriven) || 0,
      status,
      openDate: new Date().toISOString().split('T')[0],
      forecastDate,
      completionDate: (status === 'concluida_aguardando_retirada' || status === 'entregue_finalizada') ? new Date().toISOString().split('T')[0] : undefined,
      equipmentType,
      equipmentModel,
      equipmentSerial,
      equipmentYear,
      warrantyPeriodDays: Number(warrantyPeriodDays),
      warrantyExpiresAt: new Date(Date.now() + Number(warrantyPeriodDays) * 86400000).toISOString().split('T')[0],
      visitFee: Number(visitFee),
      description,
      services: services.filter(s => s.name.trim() !== ''),
      parts: parts.filter(p => p.name.trim() !== ''),
      discountType,
      discountValue: Number(discountValue),
      calculatedDiscount,
      paymentMethod: payments[0]?.method || 'pix',
      payments,
      paymentStatus: (status === 'entregue_finalizada') ? 'pago' : 'pendente',
      checklists,
      entryPhotos: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'
      ],
      exitPhotos: [
        'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&q=80'
      ]
    });

    setIsNewModalOpen(false);
    setDescription('');
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
      status: 'entregue_finalizada'
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
      (o.equipmentSerial && o.equipmentSerial.toLowerCase().includes(searchTerm.toLowerCase())) ||
      o.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todas' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (st: ServiceOrderStatus) => {
    switch (st) {
      case 'orcamento_aberto':
        return <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-indigo-100 text-indigo-800">Orçamento Aberto</span>;
      case 'aguardando_aprovacao':
        return <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-amber-100 text-amber-800">Aguardando Aprovação</span>;
      case 'aprovada_em_andamento':
        return <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-blue-100 text-blue-800">Aprovada / Em Andamento</span>;
      case 'aguardando_pecas':
        return <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-purple-100 text-purple-800">Aguardando Peças</span>;
      case 'concluida_aguardando_retirada':
        return <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-cyan-100 text-cyan-800">Concluída / Aguardando Retirada</span>;
      case 'entregue_finalizada':
        return <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800">Entregue / Finalizada</span>;
      case 'cancelada':
        return <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-rose-100 text-rose-800">Cancelada</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#d8d8d8]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#363739] tracking-tight">
              Gestão de Ordens de Serviço & Checklists
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#f6eff1] text-[#53383e] border border-[#d8d8d8]">
              Checklist com Fotos · Assinatura Digital Touch
            </span>
          </div>
          <p className="text-xs text-[#707174] mt-1">
            Ciclo completo de atendimento técnico para reservatórios térmicos, tanques, bombas e tubulações, com taxa de visita e conversão ágil de orçamento.
          </p>
        </div>

        {currentRole !== 'tecnico' && (
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Ordem de Serviço / Orçamento</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#d8d8d8] shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#707174] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por código, cliente, S/N do equipamento ou laudo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f4f5f6] border border-[#d8d8d8] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#53383e]"
          />
        </div>

        {/* Status segmented tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'orcamento_aberto', label: 'Orçamentos' },
            { id: 'aprovada_em_andamento', label: 'Em Andamento' },
            { id: 'concluida_aguardando_retirada', label: 'Concluídas' },
            { id: 'entregue_finalizada', label: 'Finalizadas' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id ? 'bg-[#53383e] text-white shadow-2xs' : 'text-[#363739] hover:bg-[#d8d8d8]/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
              <tr>
                {/* 1. Código (Abreviado de Código / Status) */}
                <th 
                  className="py-3 px-4 cursor-help group relative"
                  title="Código: Código único da Ordem de Serviço e status operacional de andamento"
                >
                  <div className="inline-flex items-center gap-1 border-b border-dotted border-slate-400 group-hover:border-slate-800 transition-colors">
                    <span>Código</span>
                    <span className="text-[10px] text-slate-400 font-normal">ⓘ</span>
                  </div>
                  <div className="hidden group-hover:block absolute left-2 top-full mt-1.5 z-40 bg-slate-900 text-white text-[11px] font-normal py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
                    <p className="font-semibold text-blue-300">Código / Status Operacional</p>
                    <p className="text-slate-300 text-[10px]">Número da OS, orçamento ou venda com badge de andamento</p>
                  </div>
                </th>

                {/* 2. Cliente (Abreviado de Cliente / Equipamento) */}
                <th 
                  className="py-3 px-4 cursor-help group relative"
                  title="Cliente: Dados do cliente solicitante, endereço do atendimento e equipamento em manutenção"
                >
                  <div className="inline-flex items-center gap-1 border-b border-dotted border-slate-400 group-hover:border-slate-800 transition-colors">
                    <span>Cliente</span>
                    <span className="text-[10px] text-slate-400 font-normal">ⓘ</span>
                  </div>
                  <div className="hidden group-hover:block absolute left-4 top-full mt-1.5 z-40 bg-slate-900 text-white text-[11px] font-normal py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
                    <p className="font-semibold text-blue-300">Cliente / Equipamento & Local</p>
                    <p className="text-slate-300 text-[10px]">Nome do cliente, modelo do equipamento e defeito relatado</p>
                  </div>
                </th>

                {/* 3. Técnico (Abreviado de Técnico / Frota) */}
                <th 
                  className="py-3 px-3 cursor-help group relative"
                  title="Técnico: Técnico responsável alocado para a execução e veículo/frota da empresa"
                >
                  <div className="inline-flex items-center gap-1 border-b border-dotted border-slate-400 group-hover:border-slate-800 transition-colors">
                    <span>Técnico</span>
                    <span className="text-[10px] text-slate-400 font-normal">ⓘ</span>
                  </div>
                  <div className="hidden group-hover:block absolute left-3 top-full mt-1.5 z-40 bg-slate-900 text-white text-[11px] font-normal py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
                    <p className="font-semibold text-blue-300">Técnico / Frota Alocada</p>
                    <p className="text-slate-300 text-[10px]">Colaborador em campo, placa do veículo e quilometragem</p>
                  </div>
                </th>

                {currentRole === 'tecnico' ? (
                  <>
                    <th className="py-3 px-3">Serviços a Realizar</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-900">Diária / A Receber</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-3 text-right">Serviços</th>
                    <th className="py-3 px-3 text-right">Peças</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-900">Total OS</th>
                  </>
                )}
                <th className="py-3 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={currentRole === 'tecnico' ? 6 : 7} className="py-8 text-center text-slate-400">
                    Nenhuma Ordem de Serviço encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(os => {
                  const tech = employees.find(e => e.id === os.employeeId);
                  const veh = vehicles.find(v => v.id === os.vehicleId);
                  const srvTotal = os.services.reduce((a, b) => a + Number(b.price || 0), 0);
                  const prtTotal = os.parts.reduce((a, b) => a + (Number(b.price || 0) * Number(b.quantity || 1)), 0);
                  const grandTotal = srvTotal + prtTotal + Number(os.visitFee || 0) - Number(os.calculatedDiscount || 0);

                  // Remuneração técnica (comissão sobre serviços executados + percentual de diária de visita)
                  const techRate = (tech?.commissionRate || 8) / 100;
                  const techEarnings = (srvTotal * techRate) + (Number(os.visitFee || 0) > 0 ? 80 : 0);

                  const isBudget = os.status === 'orcamento_aberto' || os.status === 'aguardando_aprovacao';

                  const todayIso = new Date().toISOString().split('T')[0];
                  const isUnderWarranty = Boolean(
                    os.warrantyExpiresAt && 
                    os.warrantyExpiresAt >= todayIso && 
                    Number(os.warrantyPeriodDays) > 0
                  );
                  const diffMs = os.warrantyExpiresAt ? new Date(os.warrantyExpiresAt).getTime() - new Date(todayIso).getTime() : 0;
                  const warrantyDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

                  return (
                    <tr key={os.id} className="hover:bg-slate-50 transition-colors">
                      {/* Código */}
                      <td 
                        className="py-3 px-4 font-mono"
                        title={`OS: ${os.code} · Abertura: ${formatDateBR(os.openDate)} · Status: ${os.status.replace(/_/g, ' ')}`}
                      >
                        <div className="font-bold text-blue-600">{os.code}</div>
                        <div className="mt-1">{getStatusBadge(os.status)}</div>
                      </td>

                      {/* Cliente com alta visibilidade e Card de Garantia Condicional */}
                      <td 
                        className="py-3.5 px-4"
                        title={`Cliente: ${os.clientName} | Fone: ${os.clientPhone || 'N/A'}\nEndereço: ${os.clientAddress || 'N/A'}\nEquipamento: ${os.equipmentType || 'N/A'}\nDefeito: ${os.description || 'N/A'}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center shrink-0 text-xs border border-blue-200 mt-0.5">
                            {os.clientName ? os.clientName.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-950 text-sm tracking-tight">{os.clientName}</span>
                              {os.clientDocument && (
                                <span className="text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                                  {os.clientDocument}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                              {os.clientPhone && (
                                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-blue-700 font-semibold bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200/60">
                                  <Smartphone className="w-3 h-3 text-blue-600" />
                                  {os.clientPhone}
                                </span>
                              )}
                              {os.clientAddress && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 truncate max-w-xs" title={os.clientAddress}>
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{os.clientAddress}</span>
                                </span>
                              )}
                            </div>

                            {os.equipmentType && (
                              <div className="mt-1.5 text-xs text-slate-800 font-medium bg-slate-100/90 rounded-md px-2 py-1 inline-flex items-center gap-1.5 border border-slate-200/80">
                                <span className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Aparelho:</span>
                                <span>{os.equipmentType}</span>
                              </div>
                            )}

                            {os.description && (
                              <div className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                                Defeito relatado: "{os.description}"
                              </div>
                            )}

                            {/* CARD DE GARANTIA ATIVA (Aparece SOMENTE quando em garantia; quando fora da garantia NÃO aparece) */}
                            {isUnderWarranty ? (
                              <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-950 text-xs shadow-2xs">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-emerald-900">Em Garantia</span>
                                  <span className="text-emerald-400">·</span>
                                  <span className="bg-emerald-200/80 text-emerald-950 px-1.5 py-0.5 rounded text-[11px] font-bold">
                                    {warrantyDaysRemaining} {warrantyDaysRemaining === 1 ? 'dia restante' : 'dias restantes'}
                                  </span>
                                  <span className="text-emerald-700 text-[11px]">
                                    (válida até {formatDateBR(os.warrantyExpiresAt!)})
                                  </span>
                                  {os.equipmentSerial && (
                                    <span className="font-mono text-[10px] font-bold bg-white text-emerald-900 border border-emerald-300 px-1.5 py-0.5 rounded">
                                      S/N: {os.equipmentSerial}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Técnico */}
                      <td 
                        className="py-3 px-3"
                        title={`Técnico Responsável: ${tech?.name || 'Não alocado'}\nVeículo: ${veh ? `${veh.model} - ${veh.plate}` : 'Sem veículo'}\nKM Deslocamento: ${os.kmDriven} km`}
                      >
                        <div className="text-slate-800 font-medium">{tech?.name || 'Não alocado'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {veh ? `${veh.plate} (${os.kmDriven} km)` : 'Sem veículo'}
                        </div>
                      </td>

                      {currentRole === 'tecnico' ? (
                        <>
                          <td className="py-3 px-3 text-xs text-slate-700 max-w-xs">
                            <div className="font-medium truncate">
                              {os.services.length > 0 ? os.services.map(s => s.name).join(', ') : 'Manutenção / Inspeção Geral'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {os.services.reduce((acc, s) => acc + (s.hours || 1), 0)}h estimadas
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                            {formatBRL(techEarnings)}
                            <div className="text-[10px] text-slate-500 font-normal">
                              Diária + Comis.
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-3 text-right font-mono text-slate-700" title={`Mão de obra e serviços: ${formatBRL(srvTotal)}`}>
                            {formatBRL(srvTotal)}
                          </td>

                          <td className="py-3 px-3 text-right font-mono text-slate-500" title={`Peças e insumos aplicados: ${formatBRL(prtTotal)}`}>
                            {formatBRL(prtTotal)}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700" title={`Valor Total da OS: ${formatBRL(grandTotal)}`}>
                            {formatBRL(grandTotal)}
                            {os.calculatedDiscount > 0 && (
                              <div className="text-[10px] text-rose-600 font-normal">
                                Desc: -{formatBRL(os.calculatedDiscount)}
                              </div>
                            )}
                          </td>
                        </>
                      )}

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          {/* 1. Cobrar (Mandar fatura ao PDV) */}
                          <button
                            onClick={() => handleOpenPDV(os)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md shadow-2xs transition-all cursor-pointer ${
                              os.paymentStatus === 'pago'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                : 'bg-[#53383e] hover:bg-[#432c32] text-white border border-[#53383e]'
                            }`}
                            title="Cobrar e enviar fatura ao PDV / Frente de Caixa"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>{os.paymentStatus === 'pago' ? 'PDV Pago' : 'Cobrar (PDV)'}</span>
                          </button>

                          {/* 2. Editar */}
                          {currentRole !== 'tecnico' && (
                            <button
                              onClick={() => handleOpenEdit(os)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#363739] hover:text-[#53383e] hover:bg-[#d8d8d8]/50 border border-[#d8d8d8] rounded-md transition-colors cursor-pointer"
                              title="Editar Ordem de Serviço, Itens e Garantia"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Editar</span>
                            </button>
                          )}

                          {/* 3. Imprimir */}
                          <button
                            onClick={() => handlePrintOS(os)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#363739] hover:text-blue-700 hover:bg-blue-50 border border-[#d8d8d8] rounded-md transition-colors cursor-pointer"
                            title="Imprimir Ordem de Serviço e Termo de Garantia"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Imprimir</span>
                          </button>

                          {/* 4. Baixar (Download de Fatura/Recibo) */}
                          <button
                            onClick={() => handleDownloadOS(os)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#363739] hover:text-emerald-700 hover:bg-emerald-50 border border-[#d8d8d8] rounded-md transition-colors cursor-pointer"
                            title="Baixar Fatura e Comprovante em HTML/PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Baixar</span>
                          </button>

                          {/* Ver Detalhes */}
                          <button
                            onClick={() => setSelectedOSForDetail(os)}
                            className="p-1.5 text-[#707174] hover:text-[#363739] hover:bg-[#d8d8d8]/40 rounded-md transition-colors cursor-pointer"
                            title="Visualizar laudo técnico, fotos e detalhes completos"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Conversão rápida de Orçamento em Venda ou OS Aprovada */}
                          {isBudget && (
                            <button
                              onClick={() => {
                                if (confirm(`Deseja aprovar e converter o orçamento ${os.code} em Ordem de Serviço em Execução?`)) {
                                  convertBudgetToOrderOrSale(os.id, 'os_aprovada');
                                }
                              }}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md font-bold text-[11px] cursor-pointer"
                              title="Aprovar e Converter em OS"
                            >
                              <ArrowRightCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Coletar Assinatura Digital Touch */}
                          {!os.signature && (
                            <button
                              onClick={() => {
                                setSignOrder(os);
                                setSignerName(os.clientName);
                              }}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md cursor-pointer"
                              title="Coletar assinatura digital touch do cliente"
                            >
                              <PenTool className="w-4 h-4" />
                            </button>
                          )}

                          {/* Excluir */}
                          {currentRole === 'admin' && (
                            <button
                              onClick={() => {
                                if (confirm(`Excluir a OS ${os.code}?`)) {
                                  deleteServiceOrder(os.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                              title="Excluir Ordem de Serviço"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprovante Completo com Checklist, Fotos e Assinatura Digital (Visualização / Impressão) */}
      {selectedOSForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-slate-200">
            {/* Modal Actions */}
            <div className="no-print sticky top-0 bg-white px-6 py-3.5 border-b border-slate-200 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-slate-900 text-sm">
                  Visualizar Ordem de Serviço
                </span>
                <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-slate-900 text-white shadow-2xs">
                  Nº {selectedOSForDetail.code}
                </span>
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

            {/* Document Content rendered with exact MP PISCINA PDF layout */}
            <div className="p-4 sm:p-6 bg-slate-100/60 overflow-y-auto">
              <ServiceOrderPrintTemplate
                os={selectedOSForDetail}
                employee={employees.find(e => e.id === selectedOSForDetail.employeeId)}
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
                    <label className="block text-slate-700 mb-1 font-bold">Cliente *</label>
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-sm shadow-2xs focus:ring-2 focus:ring-blue-500"
                    >
                      {clients.length === 0 ? (
                        <option value="">Nenhum cliente cadastrado (Cadastre em Clientes)</option>
                      ) : (
                        clients.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.document})
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

              {/* Serviços e Peças */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-700">Mão de Obra</span>
                    <button type="button" onClick={handleAddService} className="text-blue-600 font-bold">+ Serviço</button>
                  </div>
                  <div className="space-y-2">
                    {services.map((srv, idx) => (
                      <div key={srv.id || idx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Descrição do serviço"
                          value={srv.name}
                          onChange={(e) => {
                            const up = [...services];
                            up[idx].name = e.target.value;
                            setServices(up);
                          }}
                          className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                        />
                        <input
                          type="number"
                          placeholder="R$"
                          value={srv.price}
                          onChange={(e) => {
                            const up = [...services];
                            up[idx].price = Number(e.target.value);
                            setServices(up);
                          }}
                          className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-700">Peças e Materiais</span>
                    <button type="button" onClick={handleAddPart} className="text-blue-600 font-bold">+ Peça</button>
                  </div>
                  <div className="space-y-2">
                    {parts.map((prt, idx) => (
                      <div key={prt.id || idx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Peça aplicada"
                          value={prt.name}
                          onChange={(e) => {
                            const up = [...parts];
                            up[idx].name = e.target.value;
                            setParts(up);
                          }}
                          className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                        />
                        <input
                          type="number"
                          placeholder="Qtd"
                          value={prt.quantity}
                          onChange={(e) => {
                            const up = [...parts];
                            up[idx].quantity = Number(e.target.value);
                            setParts(up);
                          }}
                          className="w-14 p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-center"
                        />
                        <input
                          type="number"
                          placeholder="R$"
                          value={prt.price}
                          onChange={(e) => {
                            const up = [...parts];
                            up[idx].price = Number(e.target.value);
                            setParts(up);
                          }}
                          className="w-20 p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desconto Flexível e Múltiplas Formas de Pagamento */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
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
                        className={`px-3 py-1 font-bold ${discountType === 'fixed' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                      >
                        R$ Moeda
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('percent')}
                        className={`px-3 py-1 font-bold ${discountType === 'percent' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                      >
                        % Percentual
                      </button>
                    </div>

                    <input
                      type="number"
                      placeholder="Valor"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-24 p-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">Múltiplas Formas de Pagamento (Split de Transação)</span>
                    <button type="button" onClick={handleAddSplitPayment} className="text-blue-600 font-bold">+ Adicionar Forma</button>
                  </div>
                  <div className="space-y-2">
                    {payments.map((pay, idx) => (
                      <div key={pay.id || idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                        <select
                          value={pay.method}
                          onChange={(e) => {
                            const up = [...payments];
                            up[idx].method = e.target.value as PaymentMethod;
                            setPayments(up);
                          }}
                          className="p-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold"
                        >
                          <option value="pix">Pix (Sem Taxa)</option>
                          <option value="cartao_credito">Cartão de Crédito</option>
                          <option value="cartao_debito">Cartão de Débito</option>
                          <option value="dinheiro">Dinheiro</option>
                          <option value="boleto">Boleto Bancário</option>
                        </select>

                        {pay.method === 'cartao_credito' && (
                          <>
                            <select
                              value={pay.cardBrand || 'visa'}
                              onChange={(e) => {
                                const up = [...payments];
                                up[idx].cardBrand = e.target.value as CardBrand;
                                setPayments(up);
                              }}
                              className="p-1 bg-slate-50 border border-slate-200 rounded text-xs"
                            >
                              <option value="visa">Visa (Taxa 4.5%)</option>
                              <option value="mastercard">Mastercard (Taxa 4.5%)</option>
                              <option value="elo">Elo (Taxa 5.2%)</option>
                              <option value="hipercard">Hipercard (Taxa 5.4%)</option>
                            </select>
                            <input
                              type="number"
                              min="1"
                              max="12"
                              value={pay.installments || 1}
                              onChange={(e) => {
                                const up = [...payments];
                                up[idx].installments = Number(e.target.value);
                                setPayments(up);
                              }}
                              className="w-16 p-1 bg-slate-50 border border-slate-200 rounded font-mono text-center"
                              title="Parcelas"
                            />
                          </>
                        )}

                        <input
                          type="number"
                          placeholder="Valor R$"
                          value={pay.amount}
                          onChange={(e) => {
                            const up = [...payments];
                            up[idx].amount = Number(e.target.value);
                            up[idx].netAmount = Number(e.target.value) * (pay.method === 'cartao_credito' ? 0.955 : 1);
                            setPayments(up);
                          }}
                          className="w-28 p-1 bg-slate-50 border border-slate-200 rounded font-mono font-bold"
                        />
                      </div>
                    ))}
                  </div>
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

              {/* Financial Breakdown Summary */}
              {(() => {
                const servicesTotal = chargingOS.services.reduce((acc, s) => acc + s.price, 0);
                const partsTotal = chargingOS.parts.reduce((acc, p) => acc + p.quantity * p.price, 0);
                const visitFee = Number(chargingOS.visitFee || 0);
                const discount = Number(chargingOS.calculatedDiscount || 0);
                const grandTotal = servicesTotal + partsTotal + visitFee - discount;

                return (
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
                      <div className="text-[10px] text-[#707174] font-semibold uppercase">Taxa de Visita</div>
                      <div className="text-xs font-bold font-mono text-[#363739] mt-0.5">{formatBRL(visitFee)}</div>
                    </div>
                    <div className="p-2 bg-[#f4f5f6] rounded-lg">
                      <div className="text-[10px] text-rose-700 font-semibold uppercase">Desconto</div>
                      <div className="text-xs font-bold font-mono text-rose-600 mt-0.5">-{formatBRL(discount)}</div>
                    </div>
                    <div className="col-span-2 sm:col-span-1 p-2 bg-[#f6eff1] border border-[#53383e]/30 rounded-lg">
                      <div className="text-[10px] text-[#53383e] font-bold uppercase">Total a Cobrar</div>
                      <div className="text-sm font-black font-mono text-[#53383e] mt-0.5">{formatBRL(grandTotal)}</div>
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
                {pdvPaymentMethod === 'pix' && (
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-[#d8d8d8]">
                    {/* Simulated Pix QR Code Box */}
                    <div className="w-32 h-32 bg-white p-2 border-2 border-[#53383e] rounded-xl flex flex-col items-center justify-center shrink-0 shadow-2xs">
                      <div className="grid grid-cols-5 gap-1 w-24 h-24 p-1 bg-black/5 rounded">
                        <div className="bg-[#363739] col-span-2 row-span-2 rounded-xs"></div>
                        <div className="bg-[#53383e] col-span-1 rounded-xs"></div>
                        <div className="bg-[#363739] col-span-2 row-span-2 rounded-xs"></div>
                        <div className="bg-[#363739] col-span-1 rounded-xs"></div>
                        <div className="bg-[#53383e] col-span-2 rounded-xs"></div>
                        <div className="bg-[#363739] col-span-2 row-span-2 rounded-xs"></div>
                        <div className="bg-[#363739] col-span-1 rounded-xs"></div>
                        <div className="bg-[#53383e] col-span-1 rounded-xs"></div>
                        <div className="bg-[#363739] col-span-1 rounded-xs"></div>
                      </div>
                      <span className="text-[9px] font-bold text-[#53383e] mt-1">PIX Dinâmico</span>
                    </div>

                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#363739]">Chave PIX Copia e Cola / QR Code</span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Compensação Imediata
                        </span>
                      </div>
                      <p className="text-[11px] text-[#707174]">
                        O cliente pode ler o QR Code na tela do smartphone do técnico ou copiar a chave gerada com o valor exato da fatura.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value="00020126580014br.gov.bcb.pix0136gestaopro-financeiro@empresa.com.br5204000053039865802BR"
                          className="flex-1 p-2 bg-[#f4f5f6] border border-[#d8d8d8] rounded-lg font-mono text-[11px] text-[#363739]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('00020126580014br.gov.bcb.pix0136gestaopro-financeiro@empresa.com.br5204000053039865802BR');
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
                )}

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
                  <span>Liquidar & Baixar no PDV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
