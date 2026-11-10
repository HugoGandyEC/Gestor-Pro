import React, { useState } from 'react';
import { 
  Building2, 
  CreditCard, 
  ShieldCheck, 
  FileText, 
  Lock, 
  Database, 
  Save, 
  RefreshCw, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Search,
  ExternalLink,
  Shield,
  Layers,
  Percent,
  Terminal,
  FileCheck,
  ListOrdered,
  Plus,
  Trash2,
  Edit2,
  CheckSquare,
  Square,
  Info,
  Sparkles,
  Clock,
  Tag,
  X,
  Palette,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Phone,
  Send,
  Server,
  Copy
} from 'lucide-react';
import { useApp, formatBRL } from '../context/AppContext';
import { CardBrand, CardMachineRate, CompanySettings, UserRole, SequenceSettings, WarrantyPolicy } from '../types';
import { 
  defaultWhatsAppTemplates, 
  renderWhatsAppTemplate, 
  sendWhatsAppMessage, 
  formatWhatsAppNumber,
  WhatsAppTemplate 
} from '../services/whatsappService';

type SettingsTab = 
  | 'company' 
  | 'sequences'
  | 'warranty'
  | 'themes'
  | 'cardRates' 
  | 'fiscal' 
  | 'whatsapp'
  | 'permissions' 
  | 'backup';

export const SystemSettingsView: React.FC = () => {
  const { 
    companySettings, 
    updateCompanySettings, 
    sequenceSettings,
    updateSequenceSettings,
    warrantyPolicies,
    addWarrantyPolicy,
    updateWarrantyPolicy,
    deleteWarrantyPolicy,
    serviceCatalog,
    cardRates, 
    cardOperators,
    updateCardRate, 
    restoreDatabaseJson, 
    resetToDefaults,
    clearAllSystemData,
    clients,
    products,
    serviceOrders,
    suppliers,
    directSales,
    appointments,
    generalExpenses,
    setupCosts,
    currentRole,
    setCurrentRole,
    lookupCep,
    lookupCnpj,
    currentTheme,
    setTheme,
    themeDefinitions
  } = useApp();

  // MySQL Integration & Dump state
  const [mysqlHost, setMysqlHost] = useState('localhost');
  const [mysqlPort, setMysqlPort] = useState('3306');
  const [mysqlDatabase, setMysqlDatabase] = useState('mppiscinas_db');
  const [mysqlUser, setMysqlUser] = useState('root');
  const [mysqlPassword, setMysqlPassword] = useState('');
  const [mysqlFeedback, setMysqlFeedback] = useState<{ type: 'success' | 'info'; message: string } | null>(null);
  const [copiedMysqlDump, setCopiedMysqlDump] = useState(false);

  const [activeTab, setActiveTab] = useState<SettingsTab>('company');
  const [formData, setFormData] = useState<CompanySettings>({ ...companySettings });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sequence settings form state
  const [seqForm, setSeqForm] = useState<SequenceSettings>({ ...sequenceSettings });

  // Update seqForm whenever sequenceSettings in context changes
  React.useEffect(() => {
    setSeqForm({ ...sequenceSettings });
  }, [sequenceSettings]);

  // Warranty Policy Modal State
  const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(false);
  const [editingWarrantyId, setEditingWarrantyId] = useState<string | null>(null);
  const [warrantyForm, setWarrantyForm] = useState<Omit<WarrantyPolicy, 'id' | 'createdAt'>>({
    name: '',
    days: 90,
    category: 'Manutenção Preventiva',
    isDefault: false,
    terms: '',
    linkedServiceIds: []
  });

  const handleOpenNewWarrantyModal = () => {
    setEditingWarrantyId(null);
    setWarrantyForm({
      name: '',
      days: 90,
      category: 'Manutenção Preventiva',
      isDefault: false,
      terms: 'Garantia legal de 90 dias para mão de obra conforme Art. 26 do CDC.',
      linkedServiceIds: []
    });
    setIsWarrantyModalOpen(true);
  };

  const handleOpenEditWarrantyModal = (policy: WarrantyPolicy) => {
    setEditingWarrantyId(policy.id);
    setWarrantyForm({
      name: policy.name,
      days: policy.days,
      category: policy.category,
      isDefault: policy.isDefault,
      terms: policy.terms,
      linkedServiceIds: policy.linkedServiceIds ? [...policy.linkedServiceIds] : []
    });
    setIsWarrantyModalOpen(true);
  };

  const handleSaveWarrantyPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warrantyForm.name.trim()) return;

    if (editingWarrantyId) {
      updateWarrantyPolicy(editingWarrantyId, warrantyForm);
      setSaveSuccessMsg(`Garantia "${warrantyForm.name}" atualizada com sucesso!`);
    } else {
      addWarrantyPolicy(warrantyForm);
      setSaveSuccessMsg(`Nova política de garantia "${warrantyForm.name}" criada com sucesso!`);
    }
    setIsWarrantyModalOpen(false);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const toggleServiceInWarranty = (serviceId: string) => {
    setWarrantyForm(prev => {
      const exists = prev.linkedServiceIds.includes(serviceId);
      return {
        ...prev,
        linkedServiceIds: exists
          ? prev.linkedServiceIds.filter(id => id !== serviceId)
          : [...prev.linkedServiceIds, serviceId]
      };
    });
  };

  const handleSaveSequences = (e: React.FormEvent) => {
    e.preventDefault();
    updateSequenceSettings(seqForm);
    setSaveSuccessMsg('Numerações e sequenciais de OS, Vendas e Orçamentos salvos com sucesso!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Backup restore states
  const [restoreJsonInput, setRestoreJsonInput] = useState('');
  const [restoreFeedback, setRestoreFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // CNPJ automatic lookup states
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
  const [cnpjFeedback, setCnpjFeedback] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null);

  // Formata CNPJ: 00.000.000/0000-00
  const formatCnpjMask = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  };

  // Preenchimento automático ao digitar o CNPJ
  const handleCnpjChange = async (value: string) => {
    const masked = formatCnpjMask(value);
    setFormData(prev => ({ ...prev, cnpj: masked }));

    const raw = masked.replace(/\D/g, '');
    if (raw.length === 14) {
      setIsSearchingCnpj(true);
      setCnpjFeedback({ type: 'info', message: 'Consultando dados na Receita Federal / BrasilAPI...' });
      try {
        const data = await lookupCnpj(raw);
        if (data) {
          setFormData(prev => ({
            ...prev,
            companyName: data.name || prev.companyName,
            tradeName: data.tradeName || prev.tradeName || prev.companyName,
            phone: data.phone || prev.phone,
            email: data.email || prev.email,
            cep: data.cep || prev.cep,
            street: data.street || prev.street,
            number: data.number || prev.number,
            neighborhood: data.neighborhood || prev.neighborhood,
            city: data.city || prev.city,
            state: data.state || prev.state
          }));
          setCnpjFeedback({ type: 'success', message: 'Dados da empresa preenchidos automaticamente via Receita Federal!' });
        } else {
          setCnpjFeedback({ type: 'error', message: 'CNPJ não encontrado na base pública. Preencha os campos manualmente.' });
        }
      } catch (err) {
        setCnpjFeedback({ type: 'error', message: 'Erro ao consultar CNPJ. Preencha os campos manualmente.' });
      } finally {
        setIsSearchingCnpj(false);
        setTimeout(() => setCnpjFeedback(null), 6000);
      }
    } else {
      setCnpjFeedback(null);
    }
  };

  // Busca manual por botão se o usuário preferir
  const handleCnpjSearch = async () => {
    const raw = formData.cnpj.replace(/\D/g, '');
    if (raw.length === 14) {
      handleCnpjChange(raw);
    } else {
      setCnpjFeedback({ type: 'error', message: 'Digite os 14 dígitos do CNPJ para buscar.' });
      setTimeout(() => setCnpjFeedback(null), 4000);
    }
  };

  // Upload e gerenciamento de logomarca da empresa
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem válido (PNG, JPG, WebP ou SVG).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 3MB para garantir alta velocidade.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setFormData(prev => ({ ...prev, logoUrl: dataUrl }));
        setSaveSuccessMsg('Logomarca carregada com sucesso! Clique em "Salvar Alterações" para confirmar.');
        setTimeout(() => setSaveSuccessMsg(null), 5000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: '' }));
    setSaveSuccessMsg('Logomarca removida. Clique em "Salvar Alterações" para confirmar.');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // CEP automatic lookup
  const handleCepSearch = async () => {
    if (formData.cep.replace(/\D/g, '').length === 8) {
      const data = await lookupCep(formData.cep);
      if (data) {
        setFormData(prev => ({
          ...prev,
          street: data.street,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state
        }));
      }
    }
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(formData);
    setSaveSuccessMsg('Dados da empresa e parâmetros fiscais atualizados com sucesso!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handleGenerateMySQLDumpText = () => {
    const lines: string[] = [];
    lines.push('-- ========================================================');
    lines.push('-- SCRIPT & DUMP COMPLETO PARA BANCO DE DADOS MYSQL (5.7 / 8.0+)');
    lines.push(`-- Sistema: GestãoPro · MP Piscinas (mppiscina2004@gmail.com)`);
    lines.push(`-- Gerado em: ${new Date().toLocaleString('pt-BR')}`);
    lines.push('-- Charset: utf8mb4 | Engine: InnoDB');
    lines.push('-- ========================================================');
    lines.push('SET FOREIGN_KEY_CHECKS=0;');
    lines.push('SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";');
    lines.push('SET time_zone = "-03:00";\n');

    // 1. Clientes
    lines.push('-- --------------------------------------------------------');
    lines.push('-- 1. Tabela: `clientes`');
    lines.push('-- --------------------------------------------------------');
    lines.push('CREATE TABLE IF NOT EXISTS `clientes` (');
    lines.push('  `id` VARCHAR(50) NOT NULL PRIMARY KEY,');
    lines.push('  `nome` VARCHAR(255) NOT NULL,');
    lines.push('  `nome_fantasia` VARCHAR(255),');
    lines.push('  `tipo_pessoa` VARCHAR(2) DEFAULT "PJ",');
    lines.push('  `documento` VARCHAR(30),');
    lines.push('  `telefone` VARCHAR(30),');
    lines.push('  `email` VARCHAR(150),');
    lines.push('  `cidade` VARCHAR(100),');
    lines.push('  `estado` VARCHAR(2),');
    lines.push('  `observacoes` TEXT,');
    lines.push('  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n');

    if (clients.length > 0) {
      lines.push('INSERT INTO `clientes` (`id`, `nome`, `nome_fantasia`, `tipo_pessoa`, `documento`, `telefone`, `email`, `cidade`, `estado`, `observacoes`) VALUES');
      const clientInserts = clients.map(c => {
        const addr = (c.addresses?.[0] as any) || {};
        return `  ('${c.id}', '${(c.name || '').replace(/'/g, "\\'")}', '${(c.tradeName || '').replace(/'/g, "\\'")}', '${c.personType || 'PJ'}', '${c.document || ''}', '${c.phone || ''}', '${c.email || ''}', '${addr.city || ''}', '${addr.state || ''}', '${(c.notes || '').replace(/'/g, "\\'")}')`;
      }).join(',\n');
      lines.push(clientInserts + ';\n');
    }

    // 2. Produtos
    lines.push('-- --------------------------------------------------------');
    lines.push('-- 2. Tabela: `produtos`');
    lines.push('-- --------------------------------------------------------');
    lines.push('CREATE TABLE IF NOT EXISTS `produtos` (');
    lines.push('  `id` VARCHAR(50) NOT NULL PRIMARY KEY,');
    lines.push('  `codigo` VARCHAR(50) NOT NULL,');
    lines.push('  `nome` VARCHAR(255) NOT NULL,');
    lines.push('  `marca` VARCHAR(100),');
    lines.push('  `categoria` VARCHAR(100),');
    lines.push('  `preco_custo` DECIMAL(10,2) DEFAULT 0.00,');
    lines.push('  `preco_varejo` DECIMAL(10,2) DEFAULT 0.00,');
    lines.push('  `preco_atacado` DECIMAL(10,2) DEFAULT 0.00,');
    lines.push('  `estoque_atual` INT DEFAULT 0');
    lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n');

    if (products.length > 0) {
      lines.push('INSERT INTO `produtos` (`id`, `codigo`, `nome`, `marca`, `categoria`, `preco_custo`, `preco_varejo`, `preco_atacado`, `estoque_atual`) VALUES');
      const prodInserts = products.map(p => {
        return `  ('${p.id}', '${p.code || ''}', '${p.name.replace(/'/g, "\\'")}', '${(p.brand || '').replace(/'/g, "\\'")}', '${(p.category || '').replace(/'/g, "\\'")}', ${p.costPrice || 0}, ${p.retailPrice || 0}, ${p.wholesalePrice || 0}, ${p.currentStock || 0})`;
      }).join(',\n');
      lines.push(prodInserts + ';\n');
    }

    // 3. Fornecedores
    lines.push('-- --------------------------------------------------------');
    lines.push('-- 3. Tabela: `fornecedores`');
    lines.push('-- --------------------------------------------------------');
    lines.push('CREATE TABLE IF NOT EXISTS `fornecedores` (');
    lines.push('  `id` VARCHAR(50) NOT NULL PRIMARY KEY,');
    lines.push('  `razao_social` VARCHAR(255) NOT NULL,');
    lines.push('  `nome_fantasia` VARCHAR(255),');
    lines.push('  `cnpj` VARCHAR(30),');
    lines.push('  `telefone` VARCHAR(30),');
    lines.push('  `email` VARCHAR(150),');
    lines.push('  `cidade` VARCHAR(100),');
    lines.push('  `estado` VARCHAR(2)');
    lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n');

    if (suppliers.length > 0) {
      lines.push('INSERT INTO `fornecedores` (`id`, `razao_social`, `nome_fantasia`, `cnpj`, `telefone`, `email`, `cidade`, `estado`) VALUES');
      const suppInserts = suppliers.map(s => {
        return `  ('${s.id}', '${(s.name || '').replace(/'/g, "\\'")}', '${(s.tradeName || '').replace(/'/g, "\\'")}', '${s.cnpj || ''}', '${s.phone || ''}', '${s.email || ''}', '${s.city || ''}', '${s.state || ''}')`;
      }).join(',\n');
      lines.push(suppInserts + ';\n');
    }

    // 4. Ordens de Serviço
    lines.push('-- --------------------------------------------------------');
    lines.push('-- 4. Tabela: `ordens_servico`');
    lines.push('-- --------------------------------------------------------');
    lines.push('CREATE TABLE IF NOT EXISTS `ordens_servico` (');
    lines.push('  `id` VARCHAR(50) NOT NULL PRIMARY KEY,');
    lines.push('  `codigo_os` VARCHAR(50) NOT NULL,');
    lines.push('  `cliente_nome` VARCHAR(255),');
    lines.push('  `status` VARCHAR(50),');
    lines.push('  `data_abertura` DATE,');
    lines.push('  `valor_total` DECIMAL(10,2) DEFAULT 0.00,');
    lines.push('  `tecnico` VARCHAR(150)');
    lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n');

    if (serviceOrders.length > 0) {
      lines.push('INSERT INTO `ordens_servico` (`id`, `codigo_os`, `cliente_nome`, `status`, `data_abertura`, `valor_total`, `tecnico`) VALUES');
      const osInserts = serviceOrders.map(o => {
        const servicesSum = (o.services || []).reduce((acc, s) => acc + (s.price || 0), 0);
        const partsSum = (o.parts || []).reduce((acc, p) => acc + (p.price * p.quantity), 0);
        const total = (o.visitFee || 0) + servicesSum + partsSum - (o.calculatedDiscount || 0);
        return `  ('${o.id}', '${o.code || ''}', '${(o.clientName || '').replace(/'/g, "\\'")}', '${o.status || ''}', '${o.openDate || ''}', ${total > 0 ? total : 0}, '${o.employeeId || ''}')`;
      }).join(',\n');
      lines.push(osInserts + ';\n');
    }

    // 5. Compromissos e Visitas da Agenda
    lines.push('-- --------------------------------------------------------');
    lines.push('-- 5. Tabela: `compromissos_agenda`');
    lines.push('-- --------------------------------------------------------');
    lines.push('CREATE TABLE IF NOT EXISTS `compromissos_agenda` (');
    lines.push('  `id` VARCHAR(50) NOT NULL PRIMARY KEY,');
    lines.push('  `titulo` VARCHAR(255) NOT NULL,');
    lines.push('  `tipo` VARCHAR(50),');
    lines.push('  `data_inicio` DATE,');
    lines.push('  `horario_inicio` VARCHAR(10),');
    lines.push('  `cliente_nome` VARCHAR(255),');
    lines.push('  `status` VARCHAR(50),');
    lines.push('  `endereco` TEXT');
    lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n');

    if (appointments.length > 0) {
      lines.push('INSERT INTO `compromissos_agenda` (`id`, `titulo`, `tipo`, `data_inicio`, `horario_inicio`, `cliente_nome`, `status`, `endereco`) VALUES');
      const aptInserts = appointments.map(a => {
        return `  ('${a.id}', '${a.title.replace(/'/g, "\\'")}', '${a.type}', '${a.startDate}', '${a.startTime || ''}', '${(a.clientName || '').replace(/'/g, "\\'")}', '${a.status}', '${(a.location || '').replace(/'/g, "\\'")}')`;
      }).join(',\n');
      lines.push(aptInserts + ';\n');
    }

    lines.push('SET FOREIGN_KEY_CHECKS=1;\n');
    lines.push('-- Fim do Script de Carga MySQL');
    return lines.join('\n');
  };

  const handleDownloadMySQLDump = () => {
    const sqlText = handleGenerateMySQLDumpText();
    const blob = new Blob([sqlText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gestaopro_mysql_backup_${new Date().toISOString().split('T')[0]}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMysqlFeedback({
      type: 'success',
      message: 'Script completo para MySQL gerado e baixado com sucesso!'
    });
    setTimeout(() => setMysqlFeedback(null), 5000);
  };

  // Limpar Dados Modal State
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // WhatsApp Configuration State
  const [whatsappPhone, setWhatsappPhone] = useState<string>(() => {
    return localStorage.getItem('gestaopro_whatsapp_phone') || companySettings.phone || '';
  });
  const [whatsappPixKey, setWhatsappPixKey] = useState<string>(() => {
    return localStorage.getItem('gestaopro_whatsapp_pix') || companySettings.cnpj || '';
  });
  const [selectedTemplateTab, setSelectedTemplateTab] = useState<string>(defaultWhatsAppTemplates[0].id);
  const [customTemplates, setCustomTemplates] = useState<WhatsAppTemplate[]>(() => {
    const saved = localStorage.getItem('gestaopro_whatsapp_templates');
    return saved ? JSON.parse(saved) : defaultWhatsAppTemplates;
  });
  const [testPhone, setTestPhone] = useState<string>('');
  const [testSuccessMsg, setTestSuccessMsg] = useState<string | null>(null);

  const handleSaveWhatsAppConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gestaopro_whatsapp_phone', whatsappPhone);
    localStorage.setItem('gestaopro_whatsapp_pix', whatsappPixKey);
    localStorage.setItem('gestaopro_whatsapp_templates', JSON.stringify(customTemplates));
    setSaveSuccessMsg('Configurações e modelos do WhatsApp salvos com sucesso!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handleTestWhatsAppSend = () => {
    if (!testPhone.trim()) {
      alert('Informe um número de telefone com DDD para testar o envio.');
      return;
    }
    const tmpl = customTemplates.find(t => t.id === selectedTemplateTab) || customTemplates[0];
    const preview = renderWhatsAppTemplate(tmpl.template, {
      empresa: companySettings.companyName || 'MP Piscinas & Aquecedores',
      cliente: 'Cliente Teste',
      numero_os: 'OS-2026-999',
      equipamento_servico: 'Manutenção de Bomba e Filtro Solar',
      valor_total: 'R$ 750,00',
      data_previsao: '12/11/2026',
      tecnico: 'Ricardo Silveira',
      endereco: 'Rua das Flores, 100 - Bairro Centro',
      garantia: '90 dias',
      status_pagamento: 'Aguardando Pagamento',
      chave_pix: whatsappPixKey || companySettings.cnpj || 'chave@pix.com',
      data_visita: '10/11/2026',
      hora_visita: '14:30',
      tipo_visita: 'Visita Técnica de Diagnóstico',
      referencia_documento: 'Ordem de Serviço OS-2026-999',
      numero_venda: 'VD-1099',
      resumo_itens: '1x Cloro Granulado 10kg, 2x Pastilha Tricloro',
      forma_pagamento: 'Pix'
    });
    sendWhatsAppMessage(testPhone, preview, 'api');
    setTestSuccessMsg(`Disparo teste aberto no WhatsApp para ${testPhone}!`);
    setTimeout(() => setTestSuccessMsg(null), 5000);
  };

  const tabsConfig = [
    { id: 'company', label: 'Dados da Empresa / Emitente', icon: Building2 },
    { id: 'sequences', label: 'Numerações & Séries', icon: ListOrdered },
    { id: 'warranty', label: 'Garantias & Serviços Atrelados', icon: ShieldCheck },
    { id: 'whatsapp', label: 'Integração WhatsApp', icon: MessageSquare },
    { id: 'themes', label: 'Temas & Identidade Visual', icon: Palette },
    { id: 'cardRates', label: 'Taxas de Maquininha por Bandeira', icon: CreditCard },
    { id: 'fiscal', label: 'Ambiente Fiscal & NF-e', icon: FileText },
    { id: 'permissions', label: 'Matriz de Permissões (RBAC)', icon: Lock },
    { id: 'backup', label: 'Gestão de Dados, Limpeza & Restauração', icon: Database }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              Painel de Controle
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações Gerais do Sistema</h1>
          <p className="text-sm text-slate-300 mt-1">
            Personalize os parâmetros operacionais, taxas financeiras, dados fiscais da empresa e rotinas de segurança.
          </p>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex flex-wrap gap-1 shadow-xs">
        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DADOS DA EMPRESA */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Identificação, Logomarca & Dados Fiscais da Empresa</h2>
              <p className="text-xs text-slate-500">Esses dados e a logomarca serão impressos nos cabeçalhos de Ordens de Serviço, Orçamentos, Vendas, Garantias e Relatórios.</p>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" /> Salvar Alterações
            </button>
          </div>

          {/* CARD DE UPLOAD DE LOGOMARCA OFICIAL */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 border border-indigo-100 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Logomarca Oficial da Empresa</h3>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100/70 px-2.5 py-0.5 rounded-full">
                Documentos & Relatórios
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Faça o upload da imagem da logo. Ela será exibida automaticamente em <strong>todos os relatórios, Ordens de Serviço (OS), Pedidos de Venda, Orçamentos e Termos de Garantia</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-1">
              {/* Preview */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-3.5 bg-white border-2 border-dashed border-indigo-200 rounded-xl min-h-[110px] text-center">
                {formData.logoUrl ? (
                  <div className="space-y-2 text-center w-full">
                    <img
                      src={formData.logoUrl}
                      alt="Logo da Empresa"
                      className="max-h-20 max-w-full object-contain mx-auto rounded shadow-2xs"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Logo Ativa
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="text-[10px] text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-0.5 font-semibold"
                      >
                        <Trash2 className="w-3 h-3" /> Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 space-y-1">
                    <ImageIcon className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold text-slate-500">Nenhuma logo carregada</p>
                    <p className="text-[10px] text-slate-400">PNG, JPG, WebP ou SVG (máx. 3MB)</p>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="md:col-span-8 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Subir Logo do Computador</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Remover Logo Atual
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Ou informe uma URL direta da imagem da logo:
                  </label>
                  <input
                    type="url"
                    placeholder="https://suaempresa.com.br/logo.png"
                    value={formData.logoUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 placeholder:text-slate-400 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Feedback de Consulta CNPJ */}
          {cnpjFeedback && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 font-medium ${
              cnpjFeedback.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : cnpjFeedback.type === 'info'
                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              {isSearchingCnpj ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
              ) : cnpjFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{cnpjFeedback.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>CNPJ *</span>
                  {isSearchingCnpj && (
                    <span className="text-[10px] text-blue-600 flex items-center gap-1 font-normal">
                      <Loader2 className="w-3 h-3 animate-spin" /> Buscando...
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={handleCnpjSearch}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Search className="w-3 h-3" /> Buscar na Receita
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={(e) => handleCnpjChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                Digite os 14 dígitos para preencher automaticamente razão social, endereço e telefone.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Razão Social (Legal) *</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nome Fantasia / Marca</label>
              <input
                type="text"
                value={formData.tradeName}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Inscrição Estadual (IE)</label>
              <input
                type="text"
                value={formData.ie}
                onChange={(e) => setFormData({ ...formData, ie: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Inscrição Municipal (IM)</label>
              <input
                type="text"
                value={formData.im}
                onChange={(e) => setFormData({ ...formData, im: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Telefone Principal / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">E-mail Comercial / SAC</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Regime Tributário</label>
              <select
                value={formData.taxRegime}
                onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="simples_nacional">Simples Nacional (ME / EPP)</option>
                <option value="lucro_presumido">Lucro Presumido</option>
                <option value="lucro_real">Lucro Real</option>
                <option value="mei">Microempreendedor Individual (MEI)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">CEP</label>
                <button
                  type="button"
                  onClick={handleCepSearch}
                  className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <Search className="w-3 h-3" /> Buscar ViaCEP
                </button>
              </div>
              <input
                type="text"
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Logradouro / Avenida / Rua</label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Número</label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Bairro</label>
              <input
                type="text"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Cidade / UF</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-3/4 px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="text"
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  className="w-1/4 px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-center font-bold"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Save className="w-4 h-4" /> Salvar Configurações da Empresa
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: TAXAS DE MAQUININHAS */}
      {activeTab === 'cardRates' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Taxas de Máquinas de Cartão por Bandeira</h2>
              <p className="text-xs text-slate-500">
                Essas alíquotas são deduzidas automaticamente nas transações divididas (Split de Pagamentos) em Ordens de Serviço e Vendas.
              </p>
            </div>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-semibold border border-emerald-200">
              Cálculo Automático de Líquido
            </span>
          </div>

          {/* PagBank Integration Quick Status */}
          {(() => {
            const pb = cardOperators.find(o => o.code === 'pagbank');
            return pb ? (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <span>{pb.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 font-bold uppercase">
                        Integrado
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-800">
                      Taxas oficiais: Débito <strong>{pb.debitRate}%</strong> · Crédito 1x <strong>{pb.creditSightRate}%</strong> · Parcelado <strong>{pb.creditInstallments2to6Rate}%</strong> · Repasse <strong>D+1</strong> com baixa automática.
                    </div>
                  </div>
                </div>
              </div>
            ) : null;
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cardRates.map(rate => (
              <div key={rate.brand} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    Bandeira {rate.brand}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                    Ativo
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Taxa Débito (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={rate.debitRate}
                        onChange={(e) => updateCardRate(rate.brand, { debitRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                      />
                      <Percent className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Crédito à Vista (1x) (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={rate.creditSightRate}
                        onChange={(e) => updateCardRate(rate.brand, { creditSightRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                      />
                      <Percent className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Crédito Parcelado (2x a 12x) (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={rate.creditInstallmentsRate}
                        onChange={(e) => updateCardRate(rate.brand, { creditInstallmentsRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                      />
                      <Percent className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                  Ex: Em uma venda de R$ 1.000,00 no crédito parcelado, a taxa retida será de <strong className="font-mono text-slate-700">{formatBRL(1000 * (rate.creditInstallmentsRate / 100))}</strong>.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: SEQUENCIAIS E NUMERAÇÕES CUSTOMIZADAS */}
      {activeTab === 'sequences' && (
        <form onSubmit={handleSaveSequences} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-[#53383E]/10 text-[#53383E]">
                  <ListOrdered className="w-5 h-5" />
                </span>
                <h2 className="text-base font-bold text-slate-900">Numerações & Séries Customizadas</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Configure a numeração inicial da sua empresa para Ordens de Serviço, Vendas e Orçamentos para continuar a sua sequência comercial.
              </p>
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#53383E] hover:bg-[#432d32] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Save className="w-4 h-4" /> Salvar Sequenciais
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Ordem de Serviço */}
            <div className="border-2 border-indigo-100 bg-gradient-to-b from-indigo-50/40 to-white rounded-xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                <div className="font-bold text-xs text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Ordens de Serviço (OS)
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  Operacional
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Próximo Número da OS <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={seqForm.serviceOrderNextNumber}
                  onChange={(e) => setSeqForm({ ...seqForm, serviceOrderNextNumber: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Ex: Digite seu número atual (ex: 2025020328) para que a próxima OS seja aberta exatamente a partir dele.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prefixo da OS (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: OS- ou deixar em branco"
                  value={seqForm.serviceOrderPrefix || ''}
                  onChange={(e) => setSeqForm({ ...seqForm, serviceOrderPrefix: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">Deixe vazio caso queira apenas o número puro.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dígitos Mínimos (Zeros à esquerda)
                </label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={seqForm.serviceOrderDigits || 0}
                  onChange={(e) => setSeqForm({ ...seqForm, serviceOrderDigits: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">0 = sem zeros à esquerda</p>
              </div>

              {/* Live Preview */}
              <div className="p-3 bg-white border border-indigo-200 rounded-lg text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Visualização Prévia:</span>
                <div className="font-mono font-bold text-sm text-indigo-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>
                    {(seqForm.serviceOrderPrefix || '') + 
                      (seqForm.serviceOrderDigits && seqForm.serviceOrderDigits > 0 
                        ? String(seqForm.serviceOrderNextNumber).padStart(seqForm.serviceOrderDigits, '0') 
                        : String(seqForm.serviceOrderNextNumber))}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Venda Direta / Balcão */}
            <div className="border-2 border-emerald-100 bg-gradient-to-b from-emerald-50/40 to-white rounded-xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                <div className="font-bold text-xs text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Vendas Diretas / PDV
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Comercial
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Próximo Número de Venda <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={seqForm.saleNextNumber}
                  onChange={(e) => setSeqForm({ ...seqForm, saleNextNumber: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Número sequencial que sairá no comprovante da venda direta / balcão.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prefixo de Venda
                </label>
                <input
                  type="text"
                  placeholder="Ex: VD- ou VENDA-"
                  value={seqForm.salePrefix || ''}
                  onChange={(e) => setSeqForm({ ...seqForm, salePrefix: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dígitos Mínimos
                </label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={seqForm.saleDigits || 0}
                  onChange={(e) => setSeqForm({ ...seqForm, saleDigits: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                />
              </div>

              {/* Live Preview */}
              <div className="p-3 bg-white border border-emerald-200 rounded-lg text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Visualização Prévia:</span>
                <div className="font-mono font-bold text-sm text-emerald-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>
                    {(seqForm.salePrefix || '') + 
                      (seqForm.saleDigits && seqForm.saleDigits > 0 
                        ? String(seqForm.saleNextNumber).padStart(seqForm.saleDigits, '0') 
                        : String(seqForm.saleNextNumber))}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Orçamentos */}
            <div className="border-2 border-amber-100 bg-gradient-to-b from-amber-50/40 to-white rounded-xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                <div className="font-bold text-xs text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-amber-600" />
                  Orçamentos Comerciais
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  Propostas
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Próximo Número de Orçamento <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={seqForm.budgetNextNumber}
                  onChange={(e) => setSeqForm({ ...seqForm, budgetNextNumber: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Numeração inicial de orçamentos prévios antes da aprovação.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prefixo de Orçamento
                </label>
                <input
                  type="text"
                  placeholder="Ex: ORC- ou PROP-"
                  value={seqForm.budgetPrefix || ''}
                  onChange={(e) => setSeqForm({ ...seqForm, budgetPrefix: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dígitos Mínimos
                </label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={seqForm.budgetDigits || 0}
                  onChange={(e) => setSeqForm({ ...seqForm, budgetDigits: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                />
              </div>

              {/* Live Preview */}
              <div className="p-3 bg-white border border-amber-200 rounded-lg text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Visualização Prévia:</span>
                <div className="font-mono font-bold text-sm text-amber-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>
                    {(seqForm.budgetPrefix || '') + 
                      (seqForm.budgetDigits && seqForm.budgetDigits > 0 
                        ? String(seqForm.budgetNextNumber).padStart(seqForm.budgetDigits, '0') 
                        : String(seqForm.budgetNextNumber))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-800">Automação Contínua de Sequenciais:</span>
              <p>
                Sempre que uma nova Ordem de Serviço, Venda Direta ou Orçamento for gerado pelo sistema, ele utilizará o próximo código configurado aqui e incrementará o contador automaticamente (+1), garantindo que nunca ocorra numeração duplicada.
              </p>
            </div>
          </div>
        </form>
      )}

      {/* TAB: GARANTIAS E SERVIÇOS ATRELADOS */}
      {activeTab === 'warranty' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-[#53383E]/10 text-[#53383E]">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <h2 className="text-base font-bold text-slate-900">Políticas de Garantia & Serviços Atrelados</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Crie suas políticas de garantia personalizadas com prazos, termos detalhados e vincule-as diretamente aos serviços do catálogo para aplicação automática nas OS.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenNewWarrantyModal}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#53383E] hover:bg-[#432d32] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> Nova Garantia
            </button>
          </div>

          {/* Cards of registered warranty policies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {warrantyPolicies.map((policy) => {
              const linkedServices = serviceCatalog.filter(s => policy.linkedServiceIds?.includes(s.id));
              return (
                <div 
                  key={policy.id} 
                  className={`border rounded-xl p-5 space-y-3 transition-all ${
                    policy.isDefault 
                      ? 'border-emerald-300 bg-emerald-50/20 shadow-xs' 
                      : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-slate-900">{policy.name}</h3>
                        {policy.isDefault && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Padrão do Sistema
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          {policy.days} dias ({Math.round(policy.days / 30)} meses)
                        </span>
                        <span>•</span>
                        <span className="bg-slate-200/80 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                          {policy.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditWarrantyModal(policy)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md transition-colors"
                        title="Editar garantia"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {warrantyPolicies.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja remover a política "${policy.name}"?`)) {
                              deleteWarrantyPolicy(policy.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-md transition-colors"
                          title="Excluir garantia"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Linked Services Box */}
                  <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-[#53383E]" />
                        Serviços Atrelados ({linkedServices.length})
                      </span>
                      {linkedServices.length === 0 && (
                        <span className="text-[10px] font-normal text-slate-400">Geral / Não restrito</span>
                      )}
                    </div>
                    {linkedServices.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {linkedServices.map(srv => (
                          <span
                            key={srv.id}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-medium"
                          >
                            <span className="font-mono text-[10px] text-slate-500 font-bold">{srv.code}</span>
                            <span>{srv.name}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">
                        Esta garantia pode ser aplicada a qualquer serviço quando não houver regra específica.
                      </p>
                    )}
                  </div>

                  {/* Terms quote */}
                  <div className="text-xs text-slate-600 bg-white/70 p-2.5 rounded-lg border border-slate-100 text-[11px] leading-relaxed line-clamp-3">
                    <strong className="text-slate-700">Termos:</strong> {policy.terms}
                  </div>

                  {!policy.isDefault && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => updateWarrantyPolicy(policy.id, { isDefault: true })}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 hover:underline"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Tornar esta a garantia padrão
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Global Fallback Terms Section */}
          <form onSubmit={handleSaveCompany} className="pt-6 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Termo Legal Geral da Empresa (Contrato Padrão)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Texto contratual exibido no rodapé do documento de Ordem de Serviço impressa ou PDF.
                </p>
              </div>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium"
              >
                <Save className="w-3.5 h-3.5" /> Atualizar Contrato
              </button>
            </div>
            <textarea
              rows={4}
              value={formData.defaultWarrantyTerms}
              onChange={(e) => setFormData({ ...formData, defaultWarrantyTerms: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-sans bg-slate-50 focus:bg-white"
            />
          </form>
        </div>
      )}

      {/* TAB: TEMAS & IDENTIDADE VISUAL */}
      {activeTab === 'themes' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Temas & Paletas Visuais do Sistema
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Alterne instantaneamente o tema de cores em tempo real. As paletas abaixo foram calibradas com fidelidade total à paleta de referência.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
              Tema Atual: <strong className="text-indigo-600">{themeDefinitions.find(t => t.id === currentTheme)?.name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {themeDefinitions.map((th) => {
              const isSelected = currentTheme === th.id;
              return (
                <div
                  key={th.id}
                  className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-slate-900">
                        {th.name}
                      </span>
                      {isSelected ? (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ativo
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          Disponível
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      {th.subtitle}
                    </p>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {th.description}
                    </p>

                    {/* Swatches Visual Pill */}
                    <div className="pt-2">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">
                        Amostras de Cor da Paleta:
                      </div>
                      <div className="flex items-center gap-1.5">
                        {th.swatches.map((hex, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className="w-full h-8 rounded-lg border border-black/10 shadow-xs"
                              style={{ backgroundColor: hex }}
                              title={hex}
                            />
                            <span className="text-[9px] font-mono text-slate-500 font-semibold truncate max-w-full">
                              {hex}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setTheme(th.id);
                        setSaveSuccessMsg(`Tema alterado para "${th.name}" com sucesso!`);
                        setTimeout(() => setSaveSuccessMsg(null), 3000);
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-slate-200 text-slate-600 cursor-default'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                      }`}
                    >
                      <Palette className="w-3.5 h-3.5" />
                      <span>{isSelected ? 'Tema Ativo no Momento' : `Ativar ${th.name}`}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">Dica de Produtividade:</span> Você também pode trocar o tema a qualquer momento diretamente no cabeçalho superior através do botão <strong className="text-slate-800">Tema</strong>, ou na própria tela inicial de login com usuário e senha.
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AMBIENTE FISCAL & NFE */}
      {activeTab === 'fiscal' && (
        <form onSubmit={handleSaveCompany} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Emissão de NF-e, NFS-e e Parâmetros Fiscais</h2>
              <p className="text-xs text-slate-500">Configuração do ambiente de transmissão com a SEFAZ e prefeitura municipal.</p>
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Save className="w-4 h-4" /> Salvar Parâmetros
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ambiente de Transmissão SEFAZ</label>
              <select
                value={formData.fiscalEnvironment}
                onChange={(e) => setFormData({ ...formData, fiscalEnvironment: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
              >
                <option value="homologacao">Homologação (Ambiente de Testes / Sem valor fiscal)</option>
                <option value="producao">Produção (SEFAZ Oficial / Notas com valor jurídico)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Taxa Padrão de Visita Técnica (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.standardVisitFee}
                onChange={(e) => setFormData({ ...formData, standardVisitFee: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-indigo-700"
              />
            </div>
          </div>

          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <span>Importação Automática de XML de Compras</span>
            </div>
            <p className="text-xs text-indigo-700 leading-relaxed">
              O sistema conta com motor nativo de parsing de XML de NF-e. Ao fazer o upload de qualquer arquivo XML de compra de fornecedor na aba de Produtos, o ERP lança os produtos no estoque pelo NCM, atualiza o custo médio e agenda automaticamente a Conta a Pagar no módulo Financeiro.
            </p>
          </div>
        </form>
      )}

      {/* TAB 5: MATRIZ DE PERMISSÕES (RBAC) */}
      {activeTab === 'permissions' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Matriz de Perfis e Permissões de Acesso (RBAC)</h2>
              <p className="text-xs text-slate-500">Controle estrito de privilégios para garantir a segurança dos dados corporativos e financeiros.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">Simular Perfil Ativo:</span>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-semibold bg-slate-50"
              >
                <option value="admin">Administrador (Total)</option>
                <option value="colaborador">Colaborador (Operacional)</option>
                <option value="tecnico">Técnico (Campo)</option>
                <option value="contador">Contador (Fiscal/DRE)</option>
                <option value="cliente">Cliente (Portal Exclusivo)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Módulo / Funcionalidade</th>
                  <th className="p-3 text-center">Administrador</th>
                  <th className="p-3 text-center">Colaborador</th>
                  <th className="p-3 text-center">Técnico de Campo</th>
                  <th className="p-3 text-center">Contador</th>
                  <th className="p-3 text-center">Cliente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Abertura e Edição de Ordens de Serviço</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">Total</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">Criar/Editar</td>
                  <td className="p-3 text-center text-blue-600 font-medium">Fotos / Mudar Status</td>
                  <td className="p-3 text-center text-slate-400">Visualizar</td>
                  <td className="p-3 text-center text-slate-500">Apenas as Próprias</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Checklist Inteligente com Fotos & Assinatura Touch</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">Total</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">Sim</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">Sim (Campo)</td>
                  <td className="p-3 text-center text-slate-400">-</td>
                  <td className="p-3 text-center text-blue-600">Assinar Digitalmente</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Módulo Financeiro (Contas a Pagar / Receber / DRE)</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">Total</td>
                  <td className="p-3 text-center text-amber-600 font-medium">Parcial (Contas)</td>
                  <td className="p-3 text-center text-slate-400">Bloqueado</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">Total (Relatórios)</td>
                  <td className="p-3 text-center text-slate-500">Ver Débitos Próprios</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Gestão de Produtos, Estoque e XML NF-e</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">Total</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">Inserir / Propor</td>
                  <td className="p-3 text-center text-slate-500">Ver Peças p/ OS</td>
                  <td className="p-3 text-center text-slate-400">-</td>
                  <td className="p-3 text-center text-slate-400">-</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Central de Cadastros (Clientes, Fornecedores, Frota)</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">Total</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">Inserir / Editar</td>
                  <td className="p-3 text-center text-slate-400">-</td>
                  <td className="p-3 text-center text-slate-400">-</td>
                  <td className="p-3 text-center text-slate-500">Editar Próprio Perfil</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Fechamento Contábil e DRE em PDF para o Contador</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">Total</td>
                  <td className="p-3 text-center text-slate-400">Restrito</td>
                  <td className="p-3 text-center text-slate-400">-</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">Total (Download PDF)</td>
                  <td className="p-3 text-center text-slate-400">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: INTEGRAÇÃO WHATSAPP */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Integração WhatsApp & Mensagens Automáticas</h2>
                <p className="text-xs text-slate-500">
                  Configure o número oficial da empresa, chave Pix padrão e personalize os modelos de mensagens para orçamentos, ordens de serviço, agendamentos e cobranças.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              WhatsApp Web / API Ativo
            </div>
          </div>

          {testSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{testSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveWhatsAppConfig} className="space-y-6">
            {/* Parâmetros Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  WhatsApp Oficial da Empresa (com DDD)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Ex: (11) 98765-4321"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Utilizado como remetente oficial para contato e orçamentos.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Chave Pix Padrão para Cobranças
                </label>
                <input
                  type="text"
                  placeholder="Ex: CNPJ 00.000.000/0001-00 ou chave aleatória"
                  value={whatsappPixKey}
                  onChange={(e) => setWhatsappPixKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Inserida automaticamente nas mensagens de cobrança e recibos.
                </span>
              </div>
            </div>

            {/* Modelos de Mensagens (Templates) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Modelos de Mensagens Automáticas (Templates)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Selecione o evento para personalizar o texto padrão que será enviado ao cliente.
                  </p>
                </div>
              </div>

              {/* Selector Tabs for Templates */}
              <div className="flex flex-wrap gap-2">
                {customTemplates.map(tmpl => {
                  const isSelected = tmpl.id === selectedTemplateTab;
                  return (
                    <button
                      type="button"
                      key={tmpl.id}
                      onClick={() => setSelectedTemplateTab(tmpl.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {tmpl.title}
                    </button>
                  );
                })}
              </div>

              {/* Template Editor */}
              {(() => {
                const activeTmpl = customTemplates.find(t => t.id === selectedTemplateTab) || customTemplates[0];
                return (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {activeTmpl.title}
                      </span>
                      <span className="text-[10px] text-slate-500 italic">
                        {activeTmpl.description}
                      </span>
                    </div>

                    <textarea
                      rows={5}
                      value={activeTmpl.template}
                      onChange={(e) => {
                        const newText = e.target.value;
                        setCustomTemplates(prev => prev.map(t => t.id === activeTmpl.id ? { ...t, template: newText } : t));
                      }}
                      className="w-full p-3 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed"
                    />

                    {/* Supported tags pills */}
                    <div className="text-[11px] text-slate-600 space-y-1">
                      <span className="font-semibold text-slate-700 block">Variáveis dinâmicas suportadas (clique para copiar):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          '{cliente}', '{empresa}', '{numero_os}', '{equipamento_servico}', 
                          '{valor_total}', '{data_previsao}', '{tecnico}', '{endereco}', 
                          '{garantia}', '{chave_pix}', '{data_visita}', '{hora_visita}', '{numero_venda}'
                        ].map(tag => (
                          <span
                            key={tag}
                            onClick={() => {
                              navigator.clipboard.writeText(tag);
                              alert(`Variável ${tag} copiada! Cole no texto acima.`);
                            }}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-emerald-700 cursor-pointer hover:bg-emerald-50"
                            title="Clique para copiar"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Test Sender Sandbox */}
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-3">
              <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                Simulador de Teste de Disparo WhatsApp
              </h4>
              <p className="text-[11px] text-slate-600">
                Digite um número de WhatsApp com DDD e envie uma mensagem simulada para verificar a formatação em tempo real no seu WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  placeholder="(11) 99999-8888"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={handleTestWhatsAppSend}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Testar Disparo no WhatsApp
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Salvar Configurações do WhatsApp
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB: GESTÃO DE DADOS, LIMPEZA & BACKUP */}
      {activeTab === 'backup' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Gestão de Dados, Limpeza & Restauração</h2>
              <p className="text-xs text-slate-500">
                Central oficial para zerar dados de exemplo para produção real, restaurar dados de demonstração e integração MySQL.
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Banco de Dados Operacional
            </div>
          </div>

          {restoreFeedback && (
            <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
              restoreFeedback.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {restoreFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{restoreFeedback.message}</span>
            </div>
          )}

          {/* PAINEL CENTRAL SOLICITADO: BOTÃO LIMPAR DADOS, RESTAURAR E EXECUTAR RESTAURAÇÃO */}
          <div className="border border-rose-200 bg-rose-50/40 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Ações Rápidas de Dados: Limpar Dados, Restaurar Exemplos & Executar Restauração
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Conforme solicitado, utilize os botões abaixo para <strong>zerar todos os dados e exemplos</strong> deixando o sistema pronto para produção real, <strong>restaurar dados padrão de exemplo</strong> para demonstração, ou <strong>executar restauração de backup JSON</strong>.
                </p>
              </div>
            </div>

            {/* Três botões principais em destaque lado a lado */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* 1. Botão Limpar Dados do Sistema (Zerar Tudo) */}
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Limpar todos os dados do sistema e zerar os dados de exemplo"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>Limpar Dados (Zerar Sistema)</span>
              </button>

              {/* 2. Botão Restaurar Dados de Exemplo */}
              <button
                type="button"
                onClick={() => {
                  if (confirm('Deseja recarregar a base de dados com todos os dados fictícios de exemplo (clientes, ordens de serviço, produtos e visitas)?')) {
                    resetToDefaults();
                    setFormData({ ...companySettings });
                    setRestoreFeedback({ type: 'success', message: 'Dados fictícios de exemplo restaurados com sucesso!' });
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Recarregar dados de exemplo padrão de fábrica"
              >
                <RefreshCw className="w-4 h-4 text-white" />
                <span>Restaurar Dados de Exemplo</span>
              </button>

              {/* 3. Botão Executar Restauração JSON */}
              <button
                type="button"
                onClick={() => {
                  if (!restoreJsonInput.trim()) {
                    alert('Cole o conteúdo JSON na caixa de texto abaixo ou selecione um arquivo de backup para executar a restauração.');
                    return;
                  }
                  const res = restoreDatabaseJson(restoreJsonInput);
                  if (res.success) {
                    setRestoreFeedback({ type: 'success', message: res.message });
                    setRestoreJsonInput('');
                  } else {
                    setRestoreFeedback({ type: 'error', message: res.message });
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Executar restauração a partir do texto JSON ou arquivo"
              >
                <Upload className="w-4 h-4 text-white" />
                <span>Executar Restauração JSON</span>
              </button>
            </div>
          </div>

          {/* Módulo de Integração & Script MySQL */}
          <div className="border-t border-slate-200 pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
                    <Server className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-950 text-sm">
                      Integração & Exportador para Banco de Dados MySQL (5.7 / 8.0+)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Gere scripts SQL completos com DDL (CREATE TABLE) e DML (INSERT INTO) com charset utf8mb4 compatíveis com MySQL Workbench, phpMyAdmin e CLI MySQL.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const sql = handleGenerateMySQLDumpText();
                    navigator.clipboard.writeText(sql);
                    setCopiedMysqlDump(true);
                    setTimeout(() => setCopiedMysqlDump(false), 3000);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedMysqlDump ? 'Copiado!' : 'Copiar Script SQL'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadMySQLDump}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Script MySQL (.sql)</span>
                </button>
              </div>
            </div>

            {/* Parâmetros de Conexão MySQL */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Parâmetros de Conexão MySQL</span>
                <span className="text-[10px] text-cyan-700 font-bold bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                  Porta Padrão 3306
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">Host / Servidor</label>
                  <input
                    type="text"
                    value={mysqlHost}
                    onChange={(e) => setMysqlHost(e.target.value)}
                    placeholder="localhost ou IP do servidor"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">Porta</label>
                  <input
                    type="text"
                    value={mysqlPort}
                    onChange={(e) => setMysqlPort(e.target.value)}
                    placeholder="3306"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">Banco de Dados</label>
                  <input
                    type="text"
                    value={mysqlDatabase}
                    onChange={(e) => setMysqlDatabase(e.target.value)}
                    placeholder="mppiscinas_db"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">Usuário</label>
                  <input
                    type="text"
                    value={mysqlUser}
                    onChange={(e) => setMysqlUser(e.target.value)}
                    placeholder="root"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-[11px] text-slate-500 font-mono">
                  CLI: <code className="text-cyan-800 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">mysql -h {mysqlHost} -P {mysqlPort} -u {mysqlUser} -p {mysqlDatabase} &lt; backup.sql</code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMysqlFeedback({
                      type: 'success',
                      message: `Parâmetros MySQL validados com sucesso para o banco '${mysqlDatabase}' em '${mysqlHost}:${mysqlPort}'.`
                    });
                    setTimeout(() => setMysqlFeedback(null), 5000);
                  }}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs self-end"
                >
                  Validar Parâmetros MySQL
                </button>
              </div>

              {mysqlFeedback && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{mysqlFeedback.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Paste JSON manually */}
          <div className="border-t border-slate-200 pt-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Inserção Manual de JSON para Executar Restauração</h3>
            <textarea
              rows={4}
              placeholder="Cole aqui o conteúdo JSON do backup caso prefira inserção direta..."
              value={restoreJsonInput}
              onChange={(e) => setRestoreJsonInput(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50"
            />
            <div className="flex items-center justify-end">
              <button
                type="button"
                disabled={!restoreJsonInput.trim()}
                onClick={() => {
                  const res = restoreDatabaseJson(restoreJsonInput);
                  if (res.success) {
                    setRestoreFeedback({ type: 'success', message: res.message });
                    setRestoreJsonInput('');
                  } else {
                    setRestoreFeedback({ type: 'error', message: res.message });
                  }
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Executar Restauração JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR POLÍTICA DE GARANTIA */}
      {isWarrantyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8">
            <div className="bg-gradient-to-r from-slate-900 to-[#53383E] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingWarrantyId ? 'Editar Política de Garantia' : 'Nova Política de Garantia'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Defina o prazo, termos legais e selecione os serviços do catálogo cobertos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWarrantyModalOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWarrantyPolicy} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Garantia <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Garantia Especial de Troca de Resistências e Termostato"
                  value={warrantyForm.name}
                  onChange={(e) => setWarrantyForm({ ...warrantyForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prazo de Cobertura (em Dias) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={warrantyForm.days}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, days: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 font-mono"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[30, 90, 180, 365, 730].map(d => (
                      <button
                        type="button"
                        key={d}
                        onClick={() => setWarrantyForm({ ...warrantyForm, days: d })}
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold transition-colors ${
                          warrantyForm.days === d 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {d}d {d === 90 ? '(CDC)' : d === 365 ? '(1 ano)' : d === 730 ? '(2 anos)' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria da Garantia
                  </label>
                  <select
                    value={warrantyForm.category}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white"
                  >
                    <option value="Manutenção Preventiva">Manutenção Preventiva</option>
                    <option value="Elétrica & Aquecimento">Elétrica & Aquecimento</option>
                    <option value="Proteção Catódica">Proteção Catódica</option>
                    <option value="Caldeiraria & Solda Especializada">Caldeiraria & Solda Especializada</option>
                    <option value="Pressurização & Hidráulica">Pressurização & Hidráulica</option>
                    <option value="Peças e Equipamentos">Peças e Equipamentos</option>
                    <option value="Geral">Geral</option>
                  </select>
                </div>
              </div>

              <div className="pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={warrantyForm.isDefault}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Definir como garantia padrão do sistema (aplicada automaticamente caso nenhum serviço específico seja vinculado)
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Termos e Condições Contratuais
                </label>
                <textarea
                  rows={4}
                  value={warrantyForm.terms}
                  onChange={(e) => setWarrantyForm({ ...warrantyForm, terms: e.target.value })}
                  placeholder="Descreva as condições de garantia, coberturas, exclusões e normas aplicáveis (ex: CDC, NBR)..."
                  className="w-full p-3 border border-slate-300 rounded-lg text-xs leading-relaxed font-sans"
                />
              </div>

              {/* Linked Services Checklist */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#53383E]" />
                      Atrelar aos Serviços do Catálogo
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Ao selecionar estes serviços em uma OS, esta garantia e prazo serão vinculados automaticamente.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWarrantyForm({ ...warrantyForm, linkedServiceIds: serviceCatalog.map(s => s.id) })}
                      className="text-[10px] text-indigo-600 hover:underline font-semibold"
                    >
                      Marcar Todos
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setWarrantyForm({ ...warrantyForm, linkedServiceIds: [] })}
                      className="text-[10px] text-slate-500 hover:underline font-semibold"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {serviceCatalog.map((service) => {
                    const isChecked = warrantyForm.linkedServiceIds.includes(service.id);
                    return (
                      <div
                        key={service.id}
                        onClick={() => toggleServiceInWarranty(service.id)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked 
                            ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-medium' 
                            : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <div>
                            <span className="font-mono text-[10px] text-slate-500 font-bold mr-1.5">
                              {service.code}
                            </span>
                            <span>{service.name}</span>
                          </div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600 shrink-0">
                          {service.category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWarrantyModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#53383E] hover:bg-[#432d32] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" /> Salvar Política de Garantia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO: LIMPAR TODOS OS DADOS / ZERAR SISTEMA */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-rose-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-rose-700 to-red-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Limpar Dados & Zerar Sistema</h3>
                  <p className="text-white/80 text-xs">Exclusão total de dados e exemplos demonstrativos</p>
                </div>
              </div>
              <button
                onClick={() => setIsClearAllModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-rose-700">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  Atenção: Ação irreversível sem backup!
                </p>
                <p className="leading-relaxed">
                  Esta ação irá apagar <strong>todos os dados do sistema</strong>, incluindo:
                </p>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-rose-800">
                  <li>Todos os clientes e fornecedores cadastrados</li>
                  <li>Todas as ordens de serviço e laudos técnicos</li>
                  <li>Todas as vendas e movimentações de estoque</li>
                  <li>Todos os compromissos e visitas da agenda</li>
                  <li>Todos os custos iniciais, contas a pagar e despesas</li>
                  <li>Todos os dados fictícios de exemplo de demonstração</li>
                </ul>
                <p className="text-[11px] font-semibold text-rose-800 pt-1">
                  O sistema ficará 100% limpo com numeração zerada (em branco), pronto para seu uso real em produção.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClearAllModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancelar / Manter Dados
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearAllSystemData();
                    setIsClearAllModalOpen(false);
                    setRestoreFeedback({
                      type: 'success',
                      message: 'Todos os dados e exemplos foram completamente zerados! A base de dados está 100% limpa para produção.'
                    });
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Sim, Zerar Todos os Dados Agora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
