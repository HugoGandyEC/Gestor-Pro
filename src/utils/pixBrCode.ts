import QRCode from 'qrcode';
import {
  CompanySettings,
  PaymentReceiptKind,
  ServiceOrder,
  WarrantyPolicy,
} from '../types';

/**
 * Remove acentos e caracteres não-ASCII para conformidade com o padrão EMVCo / BACEN BR Code.
 */
function normalizeEmvText(input: string, maxLen: number, fallback: string): string {
  const cleaned = (input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 \-./]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
  const value = cleaned || fallback;
  return value.slice(0, maxLen);
}

/**
 * Formata um campo TLV (Tag-Length-Value) do padrão EMVCo BR Code.
 */
function tlv(id: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Calcula CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF) exigido pelo BACEN para PIX BR Code.
 */
function crc16Ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function extractCnpjDigits(cnpj?: string): string {
  return (cnpj || '').replace(/\D/g, '');
}

export function formatCnpjDisplay(cnpj?: string): string {
  const digits = extractCnpjDigits(cnpj);
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  }
  return (cnpj || '').trim();
}

export interface PixBrCodeResult {
  payload: string;
  pixKey: string;
  pixKeyDisplay: string;
  hasValidCnpjKey: boolean;
  amount: number | null;
  isStaticOpenValue: boolean;
  merchantName: string;
  merchantCity: string;
  txid: string;
}

/**
 * Gera payload oficial BR Code (PIX Copia e Cola) utilizando o CNPJ da empresa como chave PIX.
 * - Se `amount` > 0: inclui tag 54 com valor exato (saldo restante da OS).
 * - Se `amount` for nulo, indefinido ou <= 0: omite tag 54 (QR Code estático para o cliente digitar o valor).
 */
export function buildCompanyCnpjPixBrCode(params: {
  company: CompanySettings;
  amount?: number | null;
  txidSource?: string;
}): PixBrCodeResult {
  const { company, amount, txidSource } = params;
  const cnpjDigits = extractCnpjDigits(company.cnpj);
  const hasValidCnpjKey = cnpjDigits.length === 14;
  // Chave PIX CNPJ oficial no BACEN é composta exclusivamente pelos 14 dígitos numéricos
  const pixKey = hasValidCnpjKey
    ? cnpjDigits
    : cnpjDigits || (company.email || '').trim().toLowerCase() || '00000000000000';
  const pixKeyDisplay = hasValidCnpjKey
    ? formatCnpjDisplay(cnpjDigits)
    : cnpjDigits
    ? company.cnpj
    : company.cnpj || 'CNPJ não cadastrado';

  const merchantName = normalizeEmvText(
    company.tradeName || company.companyName || 'FIRE GESTAO',
    25,
    'FIRE GESTAO'
  );
  const merchantCity = normalizeEmvText(company.city || 'BRASILIA', 15, 'BRASILIA');

  const rawTxid = (txidSource || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 25);
  const txid = rawTxid || '***';

  const numericAmount =
    amount !== undefined && amount !== null && Number.isFinite(Number(amount)) && Number(amount) > 0.009
      ? Number(Number(amount).toFixed(2))
      : null;

  // Tag 26: Merchant Account Information (PIX)
  const merchantAccountInfo = tlv(
    '26',
    tlv('00', 'br.gov.bcb.pix') + tlv('01', pixKey)
  );

  // Tag 62: Additional Data Field Template (Reference Label / TXID)
  const additionalData = tlv('62', tlv('05', txid));

  let payloadWithoutCrc =
    tlv('00', '01') +
    merchantAccountInfo +
    tlv('52', '0000') +
    tlv('53', '986');

  if (numericAmount !== null) {
    payloadWithoutCrc += tlv('54', numericAmount.toFixed(2));
  }

  payloadWithoutCrc +=
    tlv('58', 'BR') +
    tlv('59', merchantName) +
    tlv('60', merchantCity) +
    additionalData +
    '6304';

  const crc = crc16Ccitt(payloadWithoutCrc);
  const payload = `${payloadWithoutCrc}${crc}`;

  return {
    payload,
    pixKey,
    pixKeyDisplay,
    hasValidCnpjKey,
    amount: numericAmount,
    isStaticOpenValue: numericAmount === null,
    merchantName,
    merchantCity,
    txid,
  };
}

/**
 * Gera uma imagem PNG Data URL de QR Code escaneável a partir do payload BR Code.
 */
export async function generatePixQrDataUrl(payload: string, width = 240): Promise<string> {
  try {
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch {
    return '';
  }
}

export interface ServiceOrderFinancialSummary {
  partsTotal: number;
  servicesTotal: number;
  visitFee: number;
  discount: number;
  grandTotal: number;
  totalPaid: number;
  remainingBalance: number;
  hasDefinedValue: boolean;
  isFullyPaid: boolean;
}

/**
 * Calcula o valor total, total já pago e saldo restante de uma Ordem de Serviço.
 */
export function calculateServiceOrderFinancials(
  os: ServiceOrder,
  paidFromReceipts = 0
): ServiceOrderFinancialSummary {
  const activeParts = (os.parts || []).filter((p) => p.name && p.name.trim() !== '');
  const activeServices = (os.services || []).filter((s) => s.name && s.name.trim() !== '');

  const partsTotal = Number(
    activeParts
      .reduce((acc, p) => acc + Number(p.price || 0) * Number(p.quantity || 1), 0)
      .toFixed(2)
  );
  const servicesTotal = Number(
    activeServices.reduce((acc, s) => acc + Number(s.price || 0), 0).toFixed(2)
  );
  const visitFee = Number(Number(os.visitFee || 0).toFixed(2));
  const discount = Number(Number(os.calculatedDiscount || 0).toFixed(2));
  const grandTotal = Math.max(
    0,
    Number((partsTotal + servicesTotal + visitFee - discount).toFixed(2))
  );

  const paidFromSplits = Number(
    (os.payments || [])
      .reduce((acc, p) => (p.status === 'pago' ? acc + Number(p.amount || 0) : acc), 0)
      .toFixed(2)
  );

  const rawPaid = Math.max(Number(paidFromReceipts || 0), paidFromSplits);
  const totalPaid =
    os.paymentStatus === 'pago' && grandTotal > 0
      ? grandTotal
      : Number(Math.min(grandTotal, rawPaid).toFixed(2));

  const remainingBalance = Math.max(0, Number((grandTotal - totalPaid).toFixed(2)));
  const hasDefinedValue = grandTotal > 0.009;
  const isFullyPaid = hasDefinedValue && remainingBalance <= 0.01;

  return {
    partsTotal,
    servicesTotal,
    visitFee,
    discount,
    grandTotal,
    totalPaid,
    remainingBalance,
    hasDefinedValue,
    isFullyPaid,
  };
}

export type OsPaymentClassificationShort = 'Entrada' | 'Pagamento Parcial' | 'Quitação';

export interface OsPaymentClassificationResult {
  paymentKind: PaymentReceiptKind;
  shortLabel: OsPaymentClassificationShort;
  receiptTitle: 'Recibo de Entrada' | 'Recibo de Pagamento Parcial' | 'Recibo de Quitação';
  totalPaidAccumulated: number;
  remainingBalance: number;
  isFullyPaid: boolean;
}

/**
 * Classifica automaticamente um lançamento financeiro de OS:
 * - Sinal / Entrada: primeiro pagamento registrado (previouslyPaid == 0) e valor < total da OS.
 * - Pagamento Parcial: já existem pagamentos anteriores, mas soma acumulada < total da OS.
 * - Quitação / Pagamento Total: valor lançado liquida 100% do saldo devedor da OS.
 */
export function classifyServiceOrderPayment(params: {
  orderTotal: number;
  previouslyPaid: number;
  amountPaidNow: number;
}): OsPaymentClassificationResult {
  const orderTotal = Math.max(0, Number(Number(params.orderTotal || 0).toFixed(2)));
  const previouslyPaid = Math.max(0, Number(Number(params.previouslyPaid || 0).toFixed(2)));
  const amountPaidNow = Math.max(0, Number(Number(params.amountPaidNow || 0).toFixed(2)));

  const totalPaidAccumulated = Number(
    Math.min(orderTotal > 0 ? orderTotal : previouslyPaid + amountPaidNow, previouslyPaid + amountPaidNow).toFixed(2)
  );
  const remainingBalance =
    orderTotal > 0 ? Math.max(0, Number((orderTotal - totalPaidAccumulated).toFixed(2))) : 0;

  const isFullyPaid = orderTotal > 0 ? remainingBalance <= 0.01 : amountPaidNow > 0;

  if (isFullyPaid) {
    return {
      paymentKind: previouslyPaid > 0.01 ? 'quitacao' : 'vista',
      shortLabel: 'Quitação',
      receiptTitle: 'Recibo de Quitação',
      totalPaidAccumulated,
      remainingBalance: 0,
      isFullyPaid: true,
    };
  }

  if (previouslyPaid <= 0.01) {
    return {
      paymentKind: 'entrada',
      shortLabel: 'Entrada',
      receiptTitle: 'Recibo de Entrada',
      totalPaidAccumulated,
      remainingBalance,
      isFullyPaid: false,
    };
  }

  return {
    paymentKind: 'parcial',
    shortLabel: 'Pagamento Parcial',
    receiptTitle: 'Recibo de Pagamento Parcial',
    totalPaidAccumulated,
    remainingBalance,
    isFullyPaid: false,
  };
}

export function getOsReceiptClassificationTitle(
  paymentKind: PaymentReceiptKind,
  isFullyPaid: boolean
): 'Recibo de Entrada' | 'Recibo de Pagamento Parcial' | 'Recibo de Quitação' {
  if (isFullyPaid || paymentKind === 'quitacao' || paymentKind === 'vista') {
    return 'Recibo de Quitação';
  }
  if (paymentKind === 'entrada') {
    return 'Recibo de Entrada';
  }
  return 'Recibo de Pagamento Parcial';
}

export interface ResolvedWarrantyTerm {
  hasWarrantyTerm: boolean;
  policyName: string;
  days: number;
  expiresAt?: string;
  termsText: string;
}

/**
 * Resolve se uma OS possui Termo de Garantia vinculado (seja salvo diretamente na OS,
 * via política de garantia vinculada aos serviços, ou garantia padrão da empresa quando warrantyPeriodDays > 0).
 */
export function resolveServiceOrderWarrantyTerm(
  os: ServiceOrder,
  warrantyPolicies: WarrantyPolicy[],
  companySettings: CompanySettings
): ResolvedWarrantyTerm {
  const days = Number(os.warrantyPeriodDays || 0);

  // 1) Termo explicitamente salvo na OS
  if (os.warrantyTerms && os.warrantyTerms.trim().length > 0) {
    return {
      hasWarrantyTerm: true,
      policyName: os.warranty || (days > 0 ? `Garantia de ${days} Dias` : 'Termo de Garantia'),
      days,
      expiresAt: os.warrantyExpiresAt,
      termsText: os.warrantyTerms.trim(),
    };
  }

  // 2) Política de garantia vinculada aos serviços da OS
  const serviceIds = (os.services || [])
    .map((s) => s.serviceId || s.id)
    .filter(Boolean);

  if (serviceIds.length > 0 && warrantyPolicies.length > 0) {
    const matchedPolicy = warrantyPolicies.find((wp) =>
      (wp.linkedServiceIds || []).some((sid) => serviceIds.includes(sid))
    );
    if (matchedPolicy && matchedPolicy.terms.trim().length > 0) {
      return {
        hasWarrantyTerm: true,
        policyName: matchedPolicy.name,
        days: days > 0 ? days : matchedPolicy.days,
        expiresAt: os.warrantyExpiresAt,
        termsText: matchedPolicy.terms.trim(),
      };
    }
  }

  // 3) Política padrão ou Termo padrão da empresa quando a OS possui prazo de garantia > 0
  if (days > 0) {
    const defaultPolicy = warrantyPolicies.find((wp) => wp.isDefault && wp.terms.trim().length > 0);
    if (defaultPolicy) {
      return {
        hasWarrantyTerm: true,
        policyName: os.warranty || defaultPolicy.name,
        days,
        expiresAt: os.warrantyExpiresAt,
        termsText: defaultPolicy.terms.trim(),
      };
    }
    if (companySettings.defaultWarrantyTerms && companySettings.defaultWarrantyTerms.trim().length > 0) {
      return {
        hasWarrantyTerm: true,
        policyName: os.warranty || `Garantia Contratual de ${days} Dias`,
        days,
        expiresAt: os.warrantyExpiresAt,
        termsText: companySettings.defaultWarrantyTerms.trim(),
      };
    }
  }

  return {
    hasWarrantyTerm: false,
    policyName: '',
    days: 0,
    expiresAt: undefined,
    termsText: '',
  };
}
