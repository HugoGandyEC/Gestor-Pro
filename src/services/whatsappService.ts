/**
 * WhatsApp Integration Service for MP Piscinas & GestãoPro
 * Provides automated templates, formatting, and direct messaging
 */

export interface WhatsAppTemplate {
  id: string;
  title: string;
  category: 'ordem_servico' | 'orcamento' | 'agendamento' | 'cobranca' | 'geral';
  template: string;
  description: string;
}

export const defaultWhatsAppTemplates: WhatsAppTemplate[] = [
  {
    id: 'os_orcamento',
    title: 'Envio de Orçamento para Aprovação',
    category: 'orcamento',
    template: 'Olá, {cliente}! Aqui é da {empresa}. Seu orçamento para a Ordem de Serviço *{numero_os}* está pronto.\n\n📋 *Equipamento / Serviço:* {equipamento_servico}\n💰 *Valor Total:* {valor_total}\n⏱️ *Previsão de Execução:* {data_previsao}\n\nPodemos confirmar a aprovação dos serviços? Qualquer dúvida estamos à disposição!',
    description: 'Enviado ao gerar um orçamento para cliente aprovar.'
  },
  {
    id: 'os_aprovada',
    title: 'OS Aprovada & Início dos Serviços',
    category: 'ordem_servico',
    template: 'Olá, {cliente}! Informamos que a sua Ordem de Serviço *{numero_os}* foi aprovada e já está em execução.\n\n🔧 *Técnico Responsável:* {tecnico}\n📅 *Previsão de Conclusão:* {data_previsao}\n📍 *Local:* {endereco}\n\nAvisaremos assim que os testes forem concluídos!',
    description: 'Enviado quando o serviço entra em andamento.'
  },
  {
    id: 'os_concluida',
    title: 'OS Concluída & Entrega Técnica com Garantia',
    category: 'ordem_servico',
    template: 'Olá, {cliente}! Sua Ordem de Serviço *{numero_os}* foi finalizada com sucesso! ✅\n\n📋 *Serviço Realizado:* {equipamento_servico}\n🛡️ *Garantia:* {garantia}\n💳 *Status do Pagamento:* {status_pagamento}\n\nAgradecemos a confiança na {empresa}!',
    description: 'Enviado ao finalizar o serviço informando garantia.'
  },
  {
    id: 'visita_agendada',
    title: 'Confirmação de Agendamento / Visita Técnica',
    category: 'agendamento',
    template: 'Olá, {cliente}! Confirmamos seu agendamento com a {empresa}.\n\n📅 *Data:* {data_visita}\n⏰ *Horário:* {hora_visita}\n🔍 *Tipo de Atendimento:* {tipo_visita}\n🔧 *Técnico Responsável:* {tecnico}\n📍 *Local:* {endereco}\n\nFavor confirmar se o horário continua adequado para você. Obrigado!',
    description: 'Enviado para confirmar visita técnica ou serviço agendado.'
  },
  {
    id: 'cobranca_pix',
    title: 'Envio de Chave Pix / Dados de Pagamento',
    category: 'cobranca',
    template: 'Olá, {cliente}! Seguem os dados para pagamento referente à {referencia_documento}:\n\n💰 *Valor:* {valor_total}\n🔑 *Chave Pix:* {chave_pix}\n🏦 *Favorecido:* {empresa}\n\nAssim que efetuar o pagamento, favor nos enviar o comprovante por aqui. Muito obrigado!',
    description: 'Enviado para cobrança com chave Pix.'
  },
  {
    id: 'comprovante_pdv',
    title: 'Comprovante de Compra / Cupom Venda Direta',
    category: 'cobranca',
    template: 'Olá, {cliente}! Obrigado por comprar na {empresa}!\n\n🛍️ *Venda Nº:* {numero_venda}\n📦 *Itens:* {resumo_itens}\n💰 *Total Pago:* {valor_total}\n💳 *Forma de Pagamento:* {forma_pagamento}\n\nFoi um prazer atendê-lo(a)! Conte sempre conosco.',
    description: 'Enviado após uma venda de balcão / PDV.'
  }
];

export interface WhatsAppConfig {
  enabled: boolean;
  countryCode: string; // ex: '55'
  businessPhone: string;
  pixKey: string;
  customTemplates: WhatsAppTemplate[];
  openMode: 'web' | 'api'; // 'web' = web.whatsapp.com, 'api' = api.whatsapp.com
}

export const defaultWhatsAppConfig: WhatsAppConfig = {
  enabled: true,
  countryCode: '55',
  businessPhone: '',
  pixKey: '',
  customTemplates: defaultWhatsAppTemplates,
  openMode: 'api'
};

/**
 * Normalizes phone string to international WhatsApp format: 5511999999999
 */
export const formatWhatsAppNumber = (rawPhone: string, defaultCountryCode = '55'): string => {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';

  // If already starts with country code (55) and has 12 or 13 digits, keep
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }

  // If it's a Brazilian standard 10 or 11 digits (e.g. 11999998888 or 1188887777), prepend defaultCountryCode
  if (digits.length === 10 || digits.length === 11) {
    return `${defaultCountryCode}${digits}`;
  }

  // Fallback
  return digits.length >= 8 ? `${defaultCountryCode}${digits}` : digits;
};

/**
 * Substitutes dynamic tokens in a WhatsApp template string
 */
export const renderWhatsAppTemplate = (
  template: string,
  variables: Record<string, string | number | undefined>
): string => {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const valStr = value !== undefined && value !== null ? String(value) : '';
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, valStr);
  }
  return result;
};

/**
 * Generates the WhatsApp URL for sending
 */
export const buildWhatsAppUrl = (
  phone: string,
  message: string,
  mode: 'web' | 'api' = 'api'
): string => {
  const cleanPhone = formatWhatsAppNumber(phone);
  const encodedMsg = encodeURIComponent(message);
  
  if (mode === 'web') {
    return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
  }
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
};

/**
 * Opens WhatsApp safely in a new window or tab
 */
export const sendWhatsAppMessage = (
  phone: string,
  message: string,
  mode: 'web' | 'api' = 'api'
): void => {
  const url = buildWhatsAppUrl(phone, message, mode);
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) {
    // If popup was blocked, fallback to location href or window link
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};
