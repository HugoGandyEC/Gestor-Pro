import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Phone, 
  User, 
  Copy, 
  Check, 
  Sparkles, 
  MessageSquare,
  ExternalLink,
  Edit2
} from 'lucide-react';
import { 
  WhatsAppTemplate, 
  defaultWhatsAppTemplates, 
  renderWhatsAppTemplate, 
  sendWhatsAppMessage,
  formatWhatsAppNumber
} from '../services/whatsappService';
import { useApp } from '../context/AppContext';

export interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientPhone?: string;
  recipientName?: string;
  defaultTemplateId?: string;
  contextVariables?: Record<string, string | number | undefined>;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  recipientPhone = '',
  recipientName = '',
  defaultTemplateId = 'os_orcamento',
  contextVariables = {}
}) => {
  const { companySettings } = useApp();
  const [phone, setPhone] = useState(recipientPhone);
  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplateId);
  const [copied, setCopied] = useState(false);

  // Merge context variables with company defaults
  const allVariables: Record<string, string | number | undefined> = {
    empresa: companySettings.companyName || 'MP Piscinas & Aquecedores',
    cliente: recipientName || 'Cliente',
    chave_pix: companySettings.cnpj || companySettings.phone || 'chave@mppiscinas.com.br',
    ...contextVariables
  };

  // Find template or fallback
  const currentTemplate = defaultWhatsAppTemplates.find(t => t.id === selectedTemplateId) || defaultWhatsAppTemplates[0];

  // Initial computed message text
  const [customMessage, setCustomMessage] = useState<string>(() => {
    return renderWhatsAppTemplate(currentTemplate.template, allVariables);
  });

  // When selected template changes, re-render message
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = defaultWhatsAppTemplates.find(t => t.id === templateId);
    if (tmpl) {
      setCustomMessage(renderWhatsAppTemplate(tmpl.template, allVariables));
    }
  };

  // Sync recipientPhone if prop changes
  React.useEffect(() => {
    if (recipientPhone) setPhone(recipientPhone);
  }, [recipientPhone]);

  // Copy message to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Send WhatsApp message
  const handleSend = () => {
    if (!phone.trim()) {
      alert('Informe o número de WhatsApp do cliente com DDD (ex: 11 99999-8888).');
      return;
    }
    sendWhatsAppMessage(phone, customMessage, 'api');
    onClose();
  };

  if (!isOpen) return null;

  const formattedNum = formatWhatsAppNumber(phone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Enviar Mensagem WhatsApp</h3>
              <p className="text-white/80 text-xs">Comunicação ágil e profissional com o cliente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Recipient & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nome do Cliente / Destinatário
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={recipientName}
                  disabled
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                WhatsApp do Cliente (com DDD) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="(11) 99999-8888"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              {formattedNum && (
                <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                  Número formatado: +{formattedNum}
                </span>
              )}
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
              <span>Selecione um Modelo Pronto</span>
              <span className="text-[11px] text-gray-400 font-normal">Preenchimento com dados reais</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {defaultWhatsAppTemplates.map(tmpl => {
                const isSelected = tmpl.id === selectedTemplateId;
                return (
                  <button
                    type="button"
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl.id)}
                    className={`text-left p-2 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="truncate">{tmpl.title}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                Mensagem a ser enviada (Editável)
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-gray-500 hover:text-emerald-700 flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar texto</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={6}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 leading-relaxed font-sans"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSend}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
            Abrir & Enviar no WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
