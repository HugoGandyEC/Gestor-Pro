import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  FileText, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  ArrowRight, 
  RefreshCw, 
  Trash2, 
  Eye, 
  Check, 
  FileCode, 
  FileUp,
  Table,
  Layers,
  Users,
  Wrench,
  ClipboardList,
  ShoppingCart,
  Building,
  CreditCard,
  Package,
  HelpCircle,
  Sparkles,
  Copy,
  Printer,
  BookOpen,
  Code2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp, formatBRL } from '../context/AppContext';
import { Client, ServiceCatalogItem, ServiceOrder, DirectSale, Supplier, GeneralExpense, Product } from '../types';
import { 
  checkDuplicateUpload, 
  generateFileChecksum, 
  registerUploadedFile, 
  UploadedFileRecord,
  getUploadedFilesHistory,
  formatBytes
} from '../services/fileUploadTracker';
import { DuplicateUploadModal } from './DuplicateUploadModal';

export type ImportEntity = 
  | 'clients' 
  | 'services' 
  | 'serviceOrders' 
  | 'sales' 
  | 'suppliers' 
  | 'payments' 
  | 'products';

interface EntityDefinition {
  id: ImportEntity;
  label: string;
  singular: string;
  icon: React.ElementType;
  description: string;
  fields: { key: string; label: string; required: boolean; sample: string }[];
}

const ENTITIES_CONFIG: EntityDefinition[] = [
  {
    id: 'clients',
    label: 'Clientes',
    singular: 'Cliente',
    icon: Users,
    description: 'Cadastro de clientes físicos e jurídicos, contatos e endereços.',
    fields: [
      { key: 'name', label: 'Nome / Razão Social', required: true, sample: 'Hotel Fazenda das Águas Ltda' },
      { key: 'document', label: 'CPF / CNPJ', required: false, sample: '12.345.678/0001-90' },
      { key: 'phone', label: 'Telefone / WhatsApp', required: true, sample: '(11) 98765-4321' },
      { key: 'email', label: 'E-mail', required: false, sample: 'contato@aguas.com.br' },
      { key: 'city', label: 'Cidade', required: false, sample: 'Campinas' },
      { key: 'state', label: 'Estado (UF)', required: false, sample: 'SP' },
      { key: 'street', label: 'Logradouro / Rua', required: false, sample: 'Av. das Termas' },
      { key: 'number', label: 'Número', required: false, sample: '500' },
      { key: 'neighborhood', label: 'Bairro', required: false, sample: 'Solar' },
      { key: 'cep', label: 'CEP', required: false, sample: '13080-000' }
    ]
  },
  {
    id: 'services',
    label: 'Serviços do Catálogo',
    singular: 'Serviço',
    icon: Wrench,
    description: 'Catálogo de mão de obra tabelada, tempo padrão e preços.',
    fields: [
      { key: 'name', label: 'Nome do Serviço', required: true, sample: 'Manutenção Preventiva de Boiler Solar' },
      { key: 'code', label: 'Código / SKU', required: false, sample: 'SRV-BOILER-01' },
      { key: 'category', label: 'Categoria', required: true, sample: 'Aquecimento Solar' },
      { key: 'standardPrice', label: 'Preço Padrão (R$)', required: true, sample: '450.00' },
      { key: 'defaultHours', label: 'Horas Estimadas', required: false, sample: '3' },
      { key: 'minPrice', label: 'Preço Mínimo (R$)', required: false, sample: '380.00' }
    ]
  },
  {
    id: 'serviceOrders',
    label: 'Ordens de Serviço (OS)',
    singular: 'Ordem de Serviço',
    icon: ClipboardList,
    description: 'Histórico de ordens de serviço, atendimentos técnicos e orçamentos.',
    fields: [
      { key: 'code', label: 'Número / Código OS', required: true, sample: 'OS-2026-101' },
      { key: 'clientName', label: 'Nome do Cliente', required: true, sample: 'Condomínio Residencial Alphaville' },
      { key: 'clientPhone', label: 'Telefone Cliente', required: false, sample: '(19) 99881-2233' },
      { key: 'description', label: 'Descrição do Problema / Serviço', required: true, sample: 'Revisão geral do sistema de aquecimento' },
      { key: 'status', label: 'Status (ex: finalizada, aberta)', required: false, sample: 'finalizada' },
      { key: 'openDate', label: 'Data de Abertura', required: false, sample: '2026-10-15' },
      { key: 'totalValue', label: 'Valor Total (R$)', required: false, sample: '1850.00' }
    ]
  },
  {
    id: 'sales',
    label: 'Vendas & Pedidos',
    singular: 'Pedido de Venda',
    icon: ShoppingCart,
    description: 'Pedidos de venda direta de peças, balcão e produtos.',
    fields: [
      { key: 'code', label: 'Código do Pedido', required: true, sample: 'PED-9012' },
      { key: 'clientName', label: 'Nome do Comprador', required: true, sample: 'Clube Campestre de Campo' },
      { key: 'totalAmount', label: 'Valor Total (R$)', required: true, sample: '3450.00' },
      { key: 'date', label: 'Data da Venda', required: false, sample: '2026-10-20' },
      { key: 'status', label: 'Status da Venda', required: false, sample: 'aprovado' }
    ]
  },
  {
    id: 'suppliers',
    label: 'Compras & Fornecedores',
    singular: 'Fornecedor',
    icon: Building,
    description: 'Fabricantes, distribuidores e compras de mercadorias.',
    fields: [
      { key: 'name', label: 'Razão Social', required: true, sample: 'TermoMax Indústria Solar Ltda' },
      { key: 'tradeName', label: 'Nome Fantasia', required: false, sample: 'TermoMax' },
      { key: 'cnpj', label: 'CNPJ', required: true, sample: '98.765.432/0001-10' },
      { key: 'phone', label: 'Telefone', required: false, sample: '(11) 3456-7890' },
      { key: 'email', label: 'E-mail Comercial', required: false, sample: 'pedidos@termomax.com.br' },
      { key: 'city', label: 'Cidade', required: false, sample: 'São Paulo' },
      { key: 'state', label: 'UF', required: false, sample: 'SP' }
    ]
  },
  {
    id: 'payments',
    label: 'Pagamentos & Financeiro',
    singular: 'Lançamento',
    icon: CreditCard,
    description: 'Despesas, contas a pagar, custos operacionais e recibos.',
    fields: [
      { key: 'description', label: 'Descrição da Despesa / Pagamento', required: true, sample: 'Compra de tubos e válvulas PPR' },
      { key: 'cost', label: 'Valor (R$)', required: true, sample: '890.50' },
      { key: 'category', label: 'Categoria de Custo', required: true, sample: 'manutencao_veiculo' },
      { key: 'supplier', label: 'Fornecedor / Beneficiário', required: true, sample: 'Distribuidora Hidráulica SP' },
      { key: 'dueDate', label: 'Data de Vencimento', required: true, sample: '2026-11-10' },
      { key: 'isPaid', label: 'Pago? (sim / nao)', required: false, sample: 'sim' }
    ]
  },
  {
    id: 'products',
    label: 'Produtos & Estoque',
    singular: 'Produto',
    icon: Package,
    description: 'Estoque de reservatórios, bombas, conexões, marcas e custos.',
    fields: [
      { key: 'code', label: 'Código SKU', required: true, sample: 'PROD-600L' },
      { key: 'name', label: 'Nome do Produto', required: true, sample: 'Reservatório Boiler 600L Alta Pressão' },
      { key: 'brand', label: 'Marca / Fabricante', required: false, sample: 'TermoMax' },
      { key: 'category', label: 'Categoria', required: true, sample: 'Reservatórios Térmicos' },
      { key: 'subcategory', label: 'Subcategoria', required: false, sample: 'Alta Pressão' },
      { key: 'costPrice', label: 'Preço de Custo (R$)', required: true, sample: '1000.00' },
      { key: 'retailPrice', label: 'Preço Varejo (R$)', required: true, sample: '1600.00' },
      { key: 'currentStock', label: 'Estoque Atual', required: true, sample: '8' },
      { key: 'unit', label: 'Unidade (UN, PC, MT)', required: false, sample: 'UN' }
    ]
  }
];

export type SupportedFormat = 'xlsx' | 'csv' | 'txt' | 'pdf' | 'xml' | 'sql';

export const FORMATS_CONFIG: {
  id: SupportedFormat;
  label: string;
  ext: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  mime: string;
}[] = [
  {
    id: 'xlsx',
    label: 'Excel (.xlsx)',
    ext: '.xlsx',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: FileSpreadsheet,
    description: 'Planilha Microsoft Excel com cabeçalhos formatados e 3 linhas de amostra.',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  },
  {
    id: 'csv',
    label: 'CSV (.csv)',
    ext: '.csv',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: FileText,
    description: 'Arquivo delimitado por ponto e vírgula (;), aspas e codificação UTF-8.',
    mime: 'text/csv;charset=utf-8;'
  },
  {
    id: 'txt',
    label: 'Texto Tabulado (.txt)',
    ext: '.txt',
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
    icon: FileText,
    description: 'Texto puro com colunas separadas por tabulação (TAB) para bloco de notas.',
    mime: 'text/plain;charset=utf-8;'
  },
  {
    id: 'pdf',
    label: 'Lista / Relatório PDF (.pdf)',
    ext: '.pdf',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: Printer,
    description: 'Documento PDF com tabela de regras, especificações técnicas e linhas válidas.',
    mime: 'application/pdf'
  },
  {
    id: 'xml',
    label: 'XML Estruturado (.xml)',
    ext: '.xml',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: FileCode,
    description: 'Estrutura XML padronizada com nós <registro> e tags correspondentes.',
    mime: 'application/xml;charset=utf-8;'
  },
  {
    id: 'sql',
    label: 'Backup SQL (.sql)',
    ext: '.sql',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Database,
    description: 'Script SQL padrão com comandos INSERT INTO e dados tipados.',
    mime: 'text/plain;charset=utf-8;'
  }
];

export const ENTITY_SAMPLES_MAP: Record<ImportEntity, Record<string, string>[]> = {
  clients: [
    {
      'Nome / Razão Social': 'Hotel Fazenda das Águas Ltda',
      'CPF / CNPJ': '12.345.678/0001-90',
      'Telefone / WhatsApp': '(11) 98765-4321',
      'E-mail': 'contato@aguas.com.br',
      'Cidade': 'Campinas',
      'Estado (UF)': 'SP',
      'Logradouro / Rua': 'Av. das Termas',
      'Número': '500',
      'Bairro': 'Solar',
      'CEP': '13080-000'
    },
    {
      'Nome / Razão Social': 'Carlos Eduardo Mendes',
      'CPF / CNPJ': '234.567.890-12',
      'Telefone / WhatsApp': '(19) 99123-4567',
      'E-mail': 'carlos.mendes@gmail.com',
      'Cidade': 'Valinhos',
      'Estado (UF)': 'SP',
      'Logradouro / Rua': 'Rua dos Ipês',
      'Número': '142',
      'Bairro': 'Jardim Primavera',
      'CEP': '13270-100'
    },
    {
      'Nome / Razão Social': 'Academia Corpo & Vida Eireli',
      'CPF / CNPJ': '34.567.890/0001-23',
      'Telefone / WhatsApp': '(19) 3888-9900',
      'E-mail': 'gerencia@corpovida.com.br',
      'Cidade': 'Campinas',
      'Estado (UF)': 'SP',
      'Logradouro / Rua': 'Rua Coronel Silva',
      'Número': '850',
      'Bairro': 'Cambuí',
      'CEP': '13025-001'
    }
  ],
  services: [
    {
      'Nome do Serviço': 'Manutenção Preventiva de Boiler Solar',
      'Código / SKU': 'SRV-BOILER-01',
      'Categoria': 'Aquecimento Solar',
      'Preço Padrão (R$)': '450.00',
      'Horas Estimadas': '3',
      'Preço Mínimo (R$)': '380.00'
    },
    {
      'Nome do Serviço': 'Instalação de Bomba de Calor Inverter',
      'Código / SKU': 'SRV-BOMBA-02',
      'Categoria': 'Piscinas & Aquecimento',
      'Preço Padrão (R$)': '850.00',
      'Horas Estimadas': '4',
      'Preço Mínimo (R$)': '720.00'
    },
    {
      'Nome do Serviço': 'Limpeza e Sanitização Química de Piscinas',
      'Código / SKU': 'SRV-LIMPEZA-03',
      'Categoria': 'Tratamento de Água',
      'Preço Padrão (R$)': '220.00',
      'Horas Estimadas': '1.5',
      'Preço Mínimo (R$)': '180.00'
    }
  ],
  serviceOrders: [
    {
      'Número / Código OS': 'OS-2026-101',
      'Nome do Cliente': 'Condomínio Residencial Alphaville',
      'Telefone Cliente': '(19) 99881-2233',
      'Descrição do Problema / Serviço': 'Revisão geral do sistema de aquecimento solar do bloco central',
      'Status (ex: finalizada, aberta)': 'finalizada',
      'Data de Abertura': '2026-10-15',
      'Valor Total (R$)': '1850.00'
    },
    {
      'Número / Código OS': 'OS-2026-102',
      'Nome do Cliente': 'Hotel Fazenda das Águas Ltda',
      'Telefone Cliente': '(11) 98765-4321',
      'Descrição do Problema / Serviço': 'Troca de resistência elétrica e termostato de segurança no boiler',
      'Status (ex: finalizada, aberta)': 'em_andamento',
      'Data de Abertura': '2026-10-22',
      'Valor Total (R$)': '920.00'
    },
    {
      'Número / Código OS': 'OS-2026-103',
      'Nome do Cliente': 'Carlos Eduardo Mendes',
      'Telefone Cliente': '(19) 99123-4567',
      'Descrição do Problema / Serviço': 'Instalação de válvula de alívio e checagem de pressão hidráulica',
      'Status (ex: finalizada, aberta)': 'aberta',
      'Data de Abertura': '2026-10-25',
      'Valor Total (R$)': '480.00'
    }
  ],
  sales: [
    {
      'Código do Pedido': 'PED-9012',
      'Nome do Comprador': 'Clube Campestre de Campo',
      'Valor Total (R$)': '3450.00',
      'Data da Venda': '2026-10-20',
      'Status da Venda': 'aprovado'
    },
    {
      'Código do Pedido': 'PED-9013',
      'Nome do Comprador': 'Pousada Recanto Verde',
      'Valor Total (R$)': '1280.00',
      'Data da Venda': '2026-10-24',
      'Status da Venda': 'aprovado'
    },
    {
      'Código do Pedido': 'PED-9014',
      'Nome do Comprador': 'Roberto Alencar ME',
      'Valor Total (R$)': '790.00',
      'Data da Venda': '2026-10-28',
      'Status da Venda': 'faturado'
    }
  ],
  suppliers: [
    {
      'Razão Social': 'TermoMax Indústria Solar Ltda',
      'Nome Fantasia': 'TermoMax Solar',
      'CNPJ': '98.765.432/0001-10',
      'Telefone': '(11) 3456-7890',
      'E-mail Comercial': 'pedidos@termomax.com.br',
      'Cidade': 'São Paulo',
      'UF': 'SP'
    },
    {
      'Razão Social': 'Hidráulica Central Peças & Bombas SA',
      'Nome Fantasia': 'HidroCentral',
      'CNPJ': '11.222.333/0001-44',
      'Telefone': '(19) 3234-5678',
      'E-mail Comercial': 'vendas@hidrocentral.com.br',
      'Cidade': 'Campinas',
      'UF': 'SP'
    },
    {
      'Razão Social': 'PiscinaTech Automação e Filtros Ltda',
      'Nome Fantasia': 'PiscinaTech',
      'CNPJ': '55.666.777/0001-88',
      'Telefone': '(11) 4004-9800',
      'E-mail Comercial': 'contato@piscinatech.ind.br',
      'Cidade': 'Ribeirão Preto',
      'UF': 'SP'
    }
  ],
  payments: [
    {
      'Descrição da Despesa / Pagamento': 'Compra de tubos e válvulas PPR alta temperatura',
      'Valor (R$)': '890.50',
      'Categoria de Custo': 'ferramental',
      'Fornecedor / Beneficiário': 'Distribuidora Hidráulica SP',
      'Data de Vencimento': '2026-11-10',
      'Pago? (sim / nao)': 'sim'
    },
    {
      'Descrição da Despesa / Pagamento': 'Combustível veículo operacional Ford Ranger OS',
      'Valor (R$)': '350.00',
      'Categoria de Custo': 'gasolina',
      'Fornecedor / Beneficiário': 'Posto Estrela da Rodovia',
      'Data de Vencimento': '2026-11-05',
      'Pago? (sim / nao)': 'sim'
    },
    {
      'Descrição da Despesa / Pagamento': 'Mensalidade internet fibra óptica e telefonia',
      'Valor (R$)': '189.90',
      'Categoria de Custo': 'internet',
      'Fornecedor / Beneficiário': 'Telecom Brasil Fibra',
      'Data de Vencimento': '2026-11-15',
      'Pago? (sim / nao)': 'nao'
    }
  ],
  products: [
    {
      'Código SKU': 'PROD-600L',
      'Nome do Produto': 'Reservatório Boiler 600L Alta Pressão Inox 316',
      'Marca / Fabricante': 'TermoMax',
      'Categoria': 'Reservatórios Térmicos',
      'Subcategoria': 'Alta Pressão',
      'Preço de Custo (R$)': '2100.00',
      'Preço Varejo (R$)': '3200.00',
      'Estoque Atual': '6',
      'Unidade (UN, PC, MT)': 'UN'
    },
    {
      'Código SKU': 'BOMBA-1CV',
      'Nome do Produto': 'Bomba Autoaspirante 1.0 CV Monofásica 220V',
      'Marca / Fabricante': 'Dancor',
      'Categoria': 'Bombas & Motores',
      'Subcategoria': 'Autoaspirante',
      'Preço de Custo (R$)': '620.00',
      'Preço Varejo (R$)': '980.00',
      'Estoque Atual': '12',
      'Unidade (UN, PC, MT)': 'UN'
    },
    {
      'Código SKU': 'VALV-ALIV-34',
      'Nome do Produto': 'Válvula de Alívio e Segurança 3/4 6 Bar',
      'Marca / Fabricante': 'Emmeti',
      'Categoria': 'Hidráulica & Conexões',
      'Subcategoria': 'Válvulas',
      'Preço de Custo (R$)': '85.00',
      'Preço Varejo (R$)': '145.00',
      'Estoque Atual': '25',
      'Unidade (UN, PC, MT)': 'PC'
    }
  ]
};

export const getFieldRuleHint = (key: string): string => {
  switch (key) {
    case 'name':
      return 'Texto livre (Razão Social ou Nome Completo)';
    case 'document':
      return 'CPF (000.000.000-00) ou CNPJ (00.000.000/0001-00)';
    case 'phone':
    case 'clientPhone':
      return 'Telefone com DDD (ex: (11) 98765-4321)';
    case 'email':
      return 'E-mail válido de contato';
    case 'city':
      return 'Nome do município';
    case 'state':
      return 'Sigla UF com 2 letras (SP, RJ, MG...)';
    case 'standardPrice':
    case 'minPrice':
    case 'costPrice':
    case 'retailPrice':
    case 'totalAmount':
    case 'totalValue':
    case 'cost':
      return 'Valor monetário decimal com ponto ou vírgula (ex: 450.00)';
    case 'currentStock':
    case 'defaultHours':
      return 'Número numérico inteiro ou decimal (ex: 10 ou 1.5)';
    case 'openDate':
    case 'date':
    case 'dueDate':
      return 'Data no formato AAAA-MM-DD ou DD/MM/AAAA';
    case 'status':
      return 'Texto do status (ex: aberta, finalizada, aprovado)';
    case 'isPaid':
      return 'sim ou nao (true / false)';
    case 'category':
    case 'subcategory':
    case 'brand':
      return 'Texto identificador da categoria ou marca';
    default:
      return 'Texto padrão';
  }
};

export const generateCSVText = (entityDef: EntityDefinition): string => {
  const sampleRows = ENTITY_SAMPLES_MAP[entityDef.id] || [];
  const headers = entityDef.fields.map(f => `"${f.label}"`).join(';');
  const rows = sampleRows.map(row => 
    entityDef.fields.map(f => `"${(row[f.label] || f.sample).replace(/"/g, '""')}"`).join(';')
  ).join('\n');
  return `\uFEFF${headers}\n${rows}\n`;
};

export const generateTXTText = (entityDef: EntityDefinition): string => {
  const sampleRows = ENTITY_SAMPLES_MAP[entityDef.id] || [];
  const headers = entityDef.fields.map(f => f.label).join('\t');
  const rows = sampleRows.map(row => 
    entityDef.fields.map(f => row[f.label] || f.sample).join('\t')
  ).join('\n');
  return `${headers}\n${rows}\n`;
};

export const generateXMLText = (entityDef: EntityDefinition): string => {
  const sampleRows = ENTITY_SAMPLES_MAP[entityDef.id] || [];
  const recordsXml = sampleRows.map((row, idx) => {
    const fieldsXml = entityDef.fields.map(f => `    <${f.key}>${row[f.label] || f.sample}</${f.key}>`).join('\n');
    return `  <registro id="${idx + 1}">\n${fieldsXml}\n  </registro>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- ========================================================= -->
<!-- GESTAOPRO · MODELO OFICIAL DE IMPORTAÇÃO XML               -->
<!-- Entidade: ${entityDef.label} (${entityDef.singular})       -->
<!-- ========================================================= -->
<importacao_sistema entidade="${entityDef.id}" total="${sampleRows.length}">
  <instrucoes>
    Preencha os registros mantendo as tags de cada campo correspondente.
  </instrucoes>
${recordsXml}
</importacao_sistema>\n`;
};

export const generateSQLText = (entityDef: EntityDefinition): string => {
  const sampleRows = ENTITY_SAMPLES_MAP[entityDef.id] || [];
  const cols = entityDef.fields.map(f => `\`${f.key}\``).join(', ');
  const ddlCols = entityDef.fields.map(f => {
    let type = 'VARCHAR(255)';
    const k = f.key.toLowerCase();
    if (k.includes('cost') || k.includes('price') || k.includes('total') || k.includes('value')) {
      type = 'DECIMAL(10,2) DEFAULT 0.00';
    } else if (k.includes('date')) {
      type = 'DATE';
    } else if (k.includes('stock') || k.includes('qty') || k.includes('quantity')) {
      type = 'INT DEFAULT 0';
    } else if (k.includes('desc') || k.includes('notes') || k.includes('description')) {
      type = 'TEXT';
    }
    return `  \`${f.key}\` ${type}`;
  }).join(',\n');

  const valuesLines = sampleRows.map(row => {
    const rowVals = entityDef.fields.map(f => {
      const val = row[f.label] || f.sample;
      return `'${String(val).replace(/'/g, "\\'")}'`;
    }).join(', ');
    return `  (${rowVals})`;
  }).join(',\n');

  return `-- =========================================================
-- GESTAOPRO · SCRIPT & MODELO DE CARGA MYSQL (VERSÕES 5.7 / 8.0+)
-- Tabela de Destino: \`${entityDef.id}\` (${entityDef.label})
-- Formato Compatível com MySQL Workbench, phpMyAdmin e CLI MySQL
-- =========================================================

CREATE TABLE IF NOT EXISTS \`${entityDef.id}\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
${ddlCols},
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`${entityDef.id}\` (${cols}) VALUES
${valuesLines};
`;
};

export const generatePDFDocument = (entityDef: EntityDefinition) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const sampleRows = ENTITY_SAMPLES_MAP[entityDef.id] || [];

  // Header Banner
  doc.setFillColor(83, 56, 62);
  doc.rect(0, 0, 297, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`GESTAOPRO · MODELO OFICIAL DE IMPORTAÇÃO - ${entityDef.label.toUpperCase()}`, 14, 11);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Documento Guia com Especificação Técnica de Colunas, Regras de Preenchimento e Amostras para Migração`, 14, 18);

  // Section 1: Field Rules
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`1. Dicionário de Colunas e Regras de Preenchimento (${entityDef.fields.length} colunas mapeáveis):`, 14, 31);

  autoTable(doc, {
    startY: 34,
    head: [['Nome da Coluna', 'Chave Técnica', 'Obrigatório?', 'Tipo / Regra de Preenchimento', 'Exemplo Válido']],
    body: entityDef.fields.map(f => [
      f.label,
      f.key,
      f.required ? 'SIM (Obrigatório)' : 'Opcional',
      getFieldRuleHint(f.key),
      f.sample
    ]),
    headStyles: { fillColor: [83, 56, 62], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    theme: 'grid',
    margin: { left: 14, right: 14 }
  });

  // Section 2: 3 Sample Records
  const lastY = (doc as any).lastAutoTable?.finalY || 100;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(`2. Tabela de Amostra com Registros Válidos (${sampleRows.length} linhas de exemplo para seguir):`, 14, lastY + 9);

  const headCols = entityDef.fields.map(f => f.label);
  const bodyRows = sampleRows.map(row => entityDef.fields.map(f => row[f.label] || f.sample));

  autoTable(doc, {
    startY: lastY + 12,
    head: [headCols],
    body: bodyRows,
    headStyles: { fillColor: [24, 76, 120], textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [239, 246, 255] },
    theme: 'grid',
    margin: { left: 14, right: 14 }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text(`Dica de Importação: Você pode copiar o texto desta tabela e colar no assistente "Colar Texto / Tabela de PDF" do GestãoPro.`, 14, Math.min(finalY + 8, 200));

  doc.save(`modelo_importacao_${entityDef.id}.pdf`);
};

export const generateXLSXDocument = (entityDef: EntityDefinition) => {
  const sampleRows = ENTITY_SAMPLES_MAP[entityDef.id] || [];
  const ws = XLSX.utils.json_to_sheet(sampleRows);

  const colWidths = entityDef.fields.map(f => ({
    wch: Math.max(f.label.length, f.sample.length, 14) + 4
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, entityDef.label.slice(0, 31));
  XLSX.writeFile(wb, `modelo_importacao_${entityDef.id}.xlsx`);
};

export const UniversalDataImportView: React.FC = () => {
  const {
    batchImportClients,
    batchImportServices,
    batchImportServiceOrders,
    batchImportDirectSales,
    batchImportSuppliers,
    batchImportPayments,
    batchImportProducts,
    employees,
    vehicles
  } = useApp();

  const [selectedEntity, setSelectedEntity] = useState<ImportEntity>('clients');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [sourceFormat, setSourceFormat] = useState<string>('auto');

  // Parsing states
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [pasteText, setPasteText] = useState('');
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Duplicate Upload Alert Modal & File tracking
  const [duplicateUploadModalState, setDuplicateUploadModalState] = useState<{
    isOpen: boolean;
    record: UploadedFileRecord | null;
    fileName: string;
    fileSize?: number;
    onProceed: () => void;
  }>({
    isOpen: false,
    record: null,
    fileName: '',
    onProceed: () => {}
  });
  const [loadedFileChecksum, setLoadedFileChecksum] = useState<string | null>(null);
  const [loadedFileSize, setLoadedFileSize] = useState<number | null>(null);
  const [showUploadHistory, setShowUploadHistory] = useState(false);

  // Model & Template Hub states (7 Entidades x 6 Formatos)
  const [isModelHubOpen, setIsModelHubOpen] = useState(false);
  const [modelHubEntity, setModelHubEntity] = useState<ImportEntity>('clients');
  const [modelHubFormat, setModelHubFormat] = useState<SupportedFormat>('xlsx');
  const [copiedFormatKey, setCopiedFormatKey] = useState<string | null>(null);

  const currentEntityConfig = ENTITIES_CONFIG.find(e => e.id === selectedEntity)!;

  // Auto-detect and map columns
  const autoMapColumns = (headers: string[], entityDef: EntityDefinition) => {
    const mapping: Record<string, string> = {};
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

    entityDef.fields.forEach(field => {
      const fieldNorm = norm(field.key);
      const fieldLabelNorm = norm(field.label);

      // Try exact match or alias match
      const matchedHeader = headers.find(h => {
        const hNorm = norm(h);
        if (hNorm === fieldNorm || hNorm === fieldLabelNorm) return true;
        // Common aliases
        if (field.key === 'name' && (hNorm.includes('nome') || hNorm.includes('razao') || hNorm.includes('cliente') || hNorm.includes('descricao'))) return true;
        if (field.key === 'document' && (hNorm.includes('cpf') || hNorm.includes('cnpj') || hNorm.includes('documento') || hNorm.includes('doc'))) return true;
        if (field.key === 'phone' && (hNorm.includes('tel') || hNorm.includes('cel') || hNorm.includes('fone') || hNorm.includes('contato'))) return true;
        if (field.key === 'email' && (hNorm.includes('mail'))) return true;
        if (field.key === 'standardPrice' && (hNorm.includes('preco') || hNorm.includes('valor') || hNorm.includes('total'))) return true;
        if (field.key === 'costPrice' && (hNorm.includes('custo') || hNorm.includes('compra'))) return true;
        if (field.key === 'retailPrice' && (hNorm.includes('venda') || hNorm.includes('varejo') || hNorm.includes('preco'))) return true;
        if (field.key === 'currentStock' && (hNorm.includes('estoque') || hNorm.includes('qtd') || hNorm.includes('quantidade'))) return true;
        if (field.key === 'city' && (hNorm.includes('cidade') || hNorm.includes('municipio'))) return true;
        if (field.key === 'state' && (hNorm.includes('uf') || hNorm.includes('estado'))) return true;
        if (field.key === 'category' && (hNorm.includes('categoria') || hNorm.includes('grupo') || hNorm.includes('tipo'))) return true;
        return false;
      });

      if (matchedHeader) {
        mapping[field.key] = matchedHeader;
      }
    });

    setColumnMapping(mapping);
  };

  // CSV / TXT Delimiter Detector and Parser
  const parseDelimitedText = (text: string) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length === 0) return { headers: [], rows: [] };

    // Detect delimiter in first line (; , \t |)
    const firstLine = lines[0];
    const counts = {
      ';': (firstLine.match(/;/g) || []).length,
      ',': (firstLine.match(/,/g) || []).length,
      '\t': (firstLine.match(/\t/g) || []).length,
      '|': (firstLine.match(/\|/g) || []).length
    };
    let delim = ';';
    let max = -1;
    (Object.keys(counts) as (keyof typeof counts)[]).forEach(d => {
      if (counts[d] > max) {
        max = counts[d];
        delim = d;
      }
    });

    const splitLine = (l: string) => {
      if (delim === '|') {
        return l.split('|').map(s => s.trim()).filter((s, i, a) => !(i === 0 && s === '') && !(i === a.length - 1 && s === ''));
      }
      return l.split(delim).map(s => s.trim().replace(/^["']|["']$/g, ''));
    };

    const headers = splitLine(lines[0]);
    const rows: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = splitLine(lines[i]);
      if (cols.length === 0 || cols.every(c => c === '')) continue;
      const row: Record<string, any> = {};
      headers.forEach((h, idx) => {
        row[h] = cols[idx] || '';
      });
      rows.push(row);
    }

    return { headers, rows };
  };

  // SQL Dump Parser (INSERT INTO table VALUES (...))
  const parseSqlDump = (sql: string) => {
    const rows: Record<string, any>[] = [];
    let headers: string[] = [];

    // Match INSERT INTO table (col1, col2) VALUES (...)
    const insertRegex = /INSERT\s+INTO\s+[`"']?\w+[`"']?\s*(?:\(([^)]+)\))?\s*VALUES\s*([\s\S]+?);/gi;
    let match;

    while ((match = insertRegex.exec(sql)) !== null) {
      const explicitCols = match[1] 
        ? match[1].split(',').map(c => c.trim().replace(/[`"']/g, '')) 
        : null;
      
      const valuesBlock = match[2];
      const tupleRegex = /\(([^)]+)\)/g;
      let tupleMatch;

      while ((tupleMatch = tupleRegex.exec(valuesBlock)) !== null) {
        const rawValues = tupleMatch[1].split(',').map(v => {
          let val = v.trim();
          if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
            val = val.substring(1, val.length - 1);
          }
          if (val === 'NULL') return '';
          return val;
        });

        if (!headers.length) {
          headers = explicitCols || rawValues.map((_, i) => `Coluna_${i + 1}`);
        }

        const row: Record<string, any> = {};
        headers.forEach((h, idx) => {
          row[h] = rawValues[idx] || '';
        });
        rows.push(row);
      }
    }

    return { headers, rows };
  };

  // XML Parser (<cliente>...</cliente> or <row>...)
  const parseXmlString = (xmlString: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      const root = xmlDoc.documentElement;
      const childNodes = Array.from(root.children);

      if (childNodes.length === 0) return { headers: [], rows: [] };

      // Find common child nodes
      const headerSet = new Set<string>();
      const rows: Record<string, any>[] = [];

      childNodes.forEach(node => {
        const row: Record<string, any> = {};
        Array.from(node.children).forEach(child => {
          headerSet.add(child.tagName);
          row[child.tagName] = child.textContent?.trim() || '';
        });
        if (Object.keys(row).length > 0) {
          rows.push(row);
        }
      });

      const headers = Array.from(headerSet);
      return { headers, rows };
    } catch {
      return { headers: [], rows: [] };
    }
  };

  // PDF Text Extractor & Table Reader
  const parsePdfContent = async (fileOrText: File | string) => {
    if (typeof fileOrText === 'string') {
      return parseDelimitedText(fileOrText);
    }

    // Binary PDF stream text extraction
    const arrayBuffer = await fileOrText.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('latin1');
    const text = decoder.decode(bytes);

    // Look for readable text objects or stream contents
    const textBlocks: string[] = [];
    const streamRegex = /stream([\s\S]*?)endstream/gi;
    let streamMatch;

    while ((streamMatch = streamRegex.exec(text)) !== null) {
      const rawStream = streamMatch[1];
      // Search for TJ / Tj text operators
      const textMatches = rawStream.match(/\(([^)]+)\)\s*(?:Tj|TJ|'|")/g);
      if (textMatches) {
        const line = textMatches.map(m => m.replace(/^[(\s]+|[)\s\w]+$/g, '')).join(' ');
        if (line.trim().length > 3) {
          textBlocks.push(line);
        }
      }
    }

    // If stream search returned lines, parse them
    if (textBlocks.length > 2) {
      return parseDelimitedText(textBlocks.join('\n'));
    }

    // Fallback: extract all visible ASCII sequences
    const asciiRegex = /[A-Za-z0-9À-ÿ\s,;.@\-_/()]{4,}/g;
    const asciiMatches = text.match(asciiRegex) || [];
    const cleanLines = asciiMatches.filter(l => l.trim().length > 8);
    return parseDelimitedText(cleanLines.join('\n'));
  };

  // Internal File Content Processor
  const processFileContent = async (file: File, checksum?: string) => {
    setIsProcessing(true);
    setFileName(file.name);
    setLoadedFileSize(file.size);
    if (checksum) setLoadedFileChecksum(checksum);
    setFeedbackMessage(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'xlsx' || ext === 'xls') {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonRows.length > 0) {
          const headers = Object.keys(jsonRows[0]);
          setParsedHeaders(headers);
          setParsedRows(jsonRows);
          autoMapColumns(headers, currentEntityConfig);
          setFeedbackMessage({ type: 'success', text: `Arquivo Excel "${file.name}" carregado com sucesso (${jsonRows.length} linhas encontradas).` });
        } else {
          setFeedbackMessage({ type: 'error', text: 'A planilha do Excel está vazia.' });
        }
      } else if (ext === 'pdf') {
        const res = await parsePdfContent(file);
        if (res.rows.length > 0) {
          setParsedHeaders(res.headers);
          setParsedRows(res.rows);
          autoMapColumns(res.headers, currentEntityConfig);
          setFeedbackMessage({ type: 'success', text: `Documento PDF "${file.name}" lido com sucesso (${res.rows.length} registros extraídos).` });
        } else {
          // Open paste helper for PDF
          setIsPasteModalOpen(true);
          setFeedbackMessage({ type: 'error', text: 'O PDF não possui camadas de texto simples legíveis. Você pode copiar o texto da lista do PDF e colar na janela abaixo.' });
        }
      } else if (ext === 'xml') {
        const text = await file.text();
        const res = parseXmlString(text);
        if (res.rows.length > 0) {
          setParsedHeaders(res.headers);
          setParsedRows(res.rows);
          autoMapColumns(res.headers, currentEntityConfig);
          setFeedbackMessage({ type: 'success', text: `Arquivo XML "${file.name}" processado (${res.rows.length} registros encontrados).` });
        } else {
          setFeedbackMessage({ type: 'error', text: 'Nenhum registro compatível encontrado no XML.' });
        }
      } else if (ext === 'sql') {
        const text = await file.text();
        const res = parseSqlDump(text);
        if (res.rows.length > 0) {
          setParsedHeaders(res.headers);
          setParsedRows(res.rows);
          autoMapColumns(res.headers, currentEntityConfig);
          setFeedbackMessage({ type: 'success', text: `Script SQL "${file.name}" processado (${res.rows.length} comandos INSERT detectados).` });
        } else {
          setFeedbackMessage({ type: 'error', text: 'Nenhum comando INSERT encontrado no arquivo SQL.' });
        }
      } else {
        // CSV or TXT
        const text = await file.text();
        const res = parseDelimitedText(text);
        if (res.rows.length > 0) {
          setParsedHeaders(res.headers);
          setParsedRows(res.rows);
          autoMapColumns(res.headers, currentEntityConfig);
          setFeedbackMessage({ type: 'success', text: `Arquivo "${file.name}" carregado com sucesso (${res.rows.length} linhas encontradas).` });
        } else {
          setFeedbackMessage({ type: 'error', text: 'Arquivo de texto/CSV sem linhas legíveis.' });
        }
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: `Erro ao processar arquivo: ${err?.message || 'Formato inválido'}` });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Main File Upload Handler with Duplicate Check
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const checksum = await generateFileChecksum(file);
      setLoadedFileChecksum(checksum);
      setLoadedFileSize(file.size);

      // Check duplicate
      const dupCheck = checkDuplicateUpload({
        fileName: file.name,
        fileSize: file.size,
        checksum,
        category: 'cadastro_upload',
        entity: selectedEntity
      });

      if (dupCheck.isDuplicate && dupCheck.record) {
        setDuplicateUploadModalState({
          isOpen: true,
          record: dupCheck.record,
          fileName: file.name,
          fileSize: file.size,
          onProceed: () => {
            processFileContent(file, checksum);
          }
        });
        return;
      }

      await processFileContent(file, checksum);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: `Erro ao analisar arquivo: ${err?.message || 'Falha de leitura'}` });
    }
  };

  // Handle direct text paste from PDF or spreadsheet
  const handleProcessPastedText = () => {
    if (!pasteText.trim()) return;
    setIsProcessing(true);
    try {
      const res = parseDelimitedText(pasteText);
      if (res.rows.length > 0) {
        setParsedHeaders(res.headers);
        setParsedRows(res.rows);
        autoMapColumns(res.headers, currentEntityConfig);
        setFileName('Texto / Tabela Colada');
        setIsPasteModalOpen(false);
        setFeedbackMessage({ type: 'success', text: `${res.rows.length} registros extraídos do texto/PDF colado com sucesso!` });
      } else {
        alert('Não foi possível reconhecer colunas no texto colado. Verifique se há separadores como tabulação, vírgula ou ponto-e-vírgula.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Commit Import directly into ERP Database / AppContext
  const handleCommitImport = () => {
    if (parsedRows.length === 0) return;

    try {
      let importedCount = 0;

      if (selectedEntity === 'clients') {
        const mappedClients = parsedRows.map(row => ({
          name: String(row[columnMapping['name']] || '').trim() || 'Cliente Importado',
          tradeName: String(row[columnMapping['tradeName']] || '').trim() || undefined,
          document: String(row[columnMapping['document']] || '').trim(),
          phone: String(row[columnMapping['phone']] || '').trim() || '(11) 90000-0000',
          email: String(row[columnMapping['email']] || '').trim() || 'cliente@gestaopro.com',
          city: String(row[columnMapping['city']] || '').trim() || 'Cidade',
          state: String(row[columnMapping['state']] || '').trim() || 'SP',
          street: String(row[columnMapping['street']] || '').trim() || 'Rua Principal',
          number: String(row[columnMapping['number']] || '').trim() || 'S/N',
          neighborhood: String(row[columnMapping['neighborhood']] || '').trim() || 'Bairro',
          cep: String(row[columnMapping['cep']] || '').trim() || '00000-000'
        }));
        importedCount = batchImportClients(mappedClients, importMode);
      } else if (selectedEntity === 'services') {
        const mappedServices = parsedRows.map(row => ({
          code: String(row[columnMapping['code']] || '').trim() || `SRV-${Math.floor(100 + Math.random() * 900)}`,
          name: String(row[columnMapping['name']] || '').trim() || 'Serviço Importado',
          category: String(row[columnMapping['category']] || '').trim() || 'Serviços Gerais',
          defaultHours: parseFloat(String(row[columnMapping['defaultHours']] || '1')) || 1,
          standardPrice: parseFloat(String(row[columnMapping['standardPrice']] || '0').replace(/[R$\s.]/g, '').replace(',', '.')) || 0,
          minPrice: parseFloat(String(row[columnMapping['minPrice']] || '0').replace(/[R$\s.]/g, '').replace(',', '.')) || 0
        }));
        importedCount = batchImportServices(mappedServices, importMode);
      } else if (selectedEntity === 'serviceOrders') {
        const mappedOrders = parsedRows.map(row => ({
          code: String(row[columnMapping['code']] || '').trim() || `OS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          clientId: 'cli-import',
          clientName: String(row[columnMapping['clientName']] || '').trim() || 'Cliente OS',
          clientDocument: '000.000.000-00',
          clientPhone: String(row[columnMapping['clientPhone']] || '').trim() || '(11) 90000-0000',
          clientAddress: 'Endereço OS',
          employeeId: employees[0]?.id || 'emp-1',
          kmDriven: 0,
          status: 'orcamento_aberto' as any,
          openDate: String(row[columnMapping['openDate']] || '').trim() || new Date().toISOString().split('T')[0],
          forecastDate: new Date().toISOString().split('T')[0],
          warrantyPeriodDays: 90,
          description: String(row[columnMapping['description']] || '').trim() || 'Ordem de serviço importada via backup',
          visitFee: 0,
          services: [],
          parts: [],
          discountType: 'fixed' as const,
          discountValue: 0,
          calculatedDiscount: 0,
          paymentMethod: 'pix' as const,
          payments: [],
          paymentStatus: 'pendente' as const,
          checklists: [],
          entryPhotos: [],
          exitPhotos: []
        }));
        importedCount = batchImportServiceOrders(mappedOrders, importMode);
      } else if (selectedEntity === 'sales') {
        const mappedSales = parsedRows.map(row => {
          const totalVal = parseFloat(String(row[columnMapping['totalAmount']] || '0').replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
          return {
            code: String(row[columnMapping['code']] || '').trim() || `PED-${Date.now().toString().slice(-5)}`,
            clientName: String(row[columnMapping['clientName']] || '').trim() || 'Cliente Venda',
            employeeId: employees[0]?.id || 'emp-1',
            date: String(row[columnMapping['date']] || '').trim() || new Date().toISOString().split('T')[0],
            priceType: 'varejo' as const,
            items: [],
            discountType: 'fixed' as const,
            discountValue: 0,
            calculatedDiscount: 0,
            total: totalVal,
            paymentMethod: 'pix' as const,
            payments: [{
              id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              method: 'pix' as const,
              amount: totalVal,
              netAmount: totalVal
            }],
            paymentStatus: 'pago' as const
          };
        });
        importedCount = batchImportDirectSales(mappedSales, importMode);
      } else if (selectedEntity === 'suppliers') {
        const mappedSuppliers = parsedRows.map(row => ({
          name: String(row[columnMapping['name']] || '').trim() || 'Fornecedor Importado',
          tradeName: String(row[columnMapping['tradeName']] || '').trim() || undefined,
          cnpj: String(row[columnMapping['cnpj']] || '').trim() || '00.000.000/0001-00',
          phone: String(row[columnMapping['phone']] || '').trim() || '(11) 3000-0000',
          email: String(row[columnMapping['email']] || '').trim() || 'contato@fornecedor.com',
          city: String(row[columnMapping['city']] || '').trim() || 'São Paulo',
          state: String(row[columnMapping['state']] || '').trim() || 'SP',
          cep: '01000-000',
          street: 'Rua das Peças',
          number: '100'
        }));
        importedCount = batchImportSuppliers(mappedSuppliers, importMode);
      } else if (selectedEntity === 'payments') {
        const mappedPayments = parsedRows.map(row => ({
          category: (row[columnMapping['category']] || 'manutencao_veiculo') as any,
          description: String(row[columnMapping['description']] || '').trim() || 'Despesa Importada',
          cost: parseFloat(String(row[columnMapping['cost']] || '0').replace(/[R$\s.]/g, '').replace(',', '.')) || 0,
          supplier: String(row[columnMapping['supplier']] || '').trim() || 'Fornecedor',
          dueDate: String(row[columnMapping['dueDate']] || '').trim() || new Date().toISOString().split('T')[0],
          isPaid: String(row[columnMapping['isPaid']] || '').toLowerCase().includes('s') || String(row[columnMapping['isPaid']] || '').toLowerCase().includes('t'),
          isRecurring: false
        }));
        importedCount = batchImportPayments(mappedPayments, importMode);
      } else if (selectedEntity === 'products') {
        const mappedProducts = parsedRows.map(row => ({
          code: String(row[columnMapping['code']] || '').trim() || `PRD-${Math.floor(100 + Math.random() * 900)}`,
          name: String(row[columnMapping['name']] || '').trim() || 'Produto Importado',
          brand: String(row[columnMapping['brand']] || '').trim() || undefined,
          category: String(row[columnMapping['category']] || '').trim() || 'Peças Gerais',
          subcategory: String(row[columnMapping['subcategory']] || '').trim() || undefined,
          costPrice: parseFloat(String(row[columnMapping['costPrice']] || '0').replace(/[R$\s.]/g, '').replace(',', '.')) || 0,
          retailPrice: parseFloat(String(row[columnMapping['retailPrice']] || '0').replace(/[R$\s.]/g, '').replace(',', '.')) || 0,
          wholesalePrice: (parseFloat(String(row[columnMapping['retailPrice']] || '0')) || 0) * 0.85,
          currentStock: parseInt(String(row[columnMapping['currentStock']] || '0')) || 0,
          minStock: 2,
          unit: String(row[columnMapping['unit']] || 'UN').trim().toUpperCase(),
          ncm: '8419.19.10',
          icmsRate: 18,
          pisRate: 1.65,
          cofinsRate: 7.6
        }));
        importedCount = batchImportProducts(mappedProducts, importMode);
      }

      if (importedCount > 0) {
        registerUploadedFile({
          fileName: fileName || `importacao_${selectedEntity}.dat`,
          fileSize: loadedFileSize || 0,
          checksum: loadedFileChecksum || `${selectedEntity}_${Date.now()}`,
          category: 'cadastro_upload',
          entity: selectedEntity,
          recordCount: importedCount,
          metadata: {
            entityLabel: currentEntityConfig.label,
            importMode
          }
        });
      }

      setFeedbackMessage({
        type: 'success',
        text: `Sucesso! ${importedCount} registros de ${currentEntityConfig.label} foram importados e salvos no sistema!`
      });

      // Clear preview
      setParsedRows([]);
      setParsedHeaders([]);
      setFileName(null);
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: `Falha ao importar: ${err?.message || 'Dados inválidos'}`
      });
    }
  };

  // Universal Download Sample for any Entity & any Formats
  const handleDownloadSample = (format: SupportedFormat, entityId: ImportEntity = selectedEntity) => {
    const entityDef = ENTITIES_CONFIG.find(e => e.id === entityId)!;
    try {
      if (format === 'xlsx') {
        generateXLSXDocument(entityDef);
      } else if (format === 'pdf') {
        generatePDFDocument(entityDef);
      } else if (format === 'csv') {
        const csvContent = generateCSVText(entityDef);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `modelo_importacao_${entityDef.id}.csv`;
        a.click();
      } else if (format === 'txt') {
        const txtContent = generateTXTText(entityDef);
        const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `modelo_importacao_${entityDef.id}.txt`;
        a.click();
      } else if (format === 'xml') {
        const xmlContent = generateXMLText(entityDef);
        const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `modelo_importacao_${entityDef.id}.xml`;
        a.click();
      } else if (format === 'sql') {
        const sqlContent = generateSQLText(entityDef);
        const blob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `modelo_backup_${entityDef.id}.sql`;
        a.click();
      }

      setFeedbackMessage({
        type: 'success',
        text: `Arquivo modelo (${format.toUpperCase()}) para ${entityDef.label} baixado com sucesso!`
      });
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: `Erro ao gerar modelo (${format.toUpperCase()}): ${err?.message || 'Falha no download'}`
      });
    }
  };

  // Copy Sample Content to Clipboard
  const handleCopySampleText = (format: SupportedFormat, entityId: ImportEntity = selectedEntity) => {
    const entityDef = ENTITIES_CONFIG.find(e => e.id === entityId)!;
    let content = '';

    if (format === 'csv') {
      content = generateCSVText(entityDef);
    } else if (format === 'txt') {
      content = generateTXTText(entityDef);
    } else if (format === 'xml') {
      content = generateXMLText(entityDef);
    } else if (format === 'sql') {
      content = generateSQLText(entityDef);
    } else {
      content = generateTXTText(entityDef);
    }

    navigator.clipboard.writeText(content);
    setCopiedFormatKey(`${entityId}-${format}`);
    setTimeout(() => setCopiedFormatKey(null), 3000);

    setFeedbackMessage({
      type: 'success',
      text: `Modelo de exemplo (${format.toUpperCase()}) para ${entityDef.label} copiado para a área de transferência!`
    });
  };

  // Instant Test Load: Preload the 3 sample rows directly into the mapper
  const handleLoadSampleDirectly = (entityId: ImportEntity = selectedEntity, formatName: string = 'exemplo') => {
    const entityDef = ENTITIES_CONFIG.find(e => e.id === entityId)!;
    setSelectedEntity(entityId);

    const sampleRows = ENTITY_SAMPLES_MAP[entityId] || [];
    const headers = entityDef.fields.map(f => f.label);

    setParsedHeaders(headers);
    setParsedRows(sampleRows);
    autoMapColumns(headers, entityDef);
    setFileName(`modelo_oficial_${entityDef.id}.${formatName}`);
    setIsModelHubOpen(false);

    setFeedbackMessage({
      type: 'success',
      text: `Modelo oficial de ${entityDef.label} carregado com ${sampleRows.length} linhas de amostra! Confira o mapeamento abaixo.`
    });

    setTimeout(() => {
      const el = document.getElementById('step-3-mapping');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#53383e] to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-300" />
              Central de Importação Multi-Formato & Backup
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Importador Universal de Dados & Migração
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl">
            Traga seus backups e cadastros existentes nos formatos <strong>CSV, XLS / XLSX, TXT, PDF, XML e SQL</strong> para Clientes, Serviços, Ordens de Serviço, Vendas, Compras e Pagamentos.
          </p>
        </div>

        {/* Model Downloads Quick Dropdown */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 bg-white/10 p-2.5 rounded-xl border border-white/15">
          <button
            type="button"
            onClick={() => {
              setModelHubEntity(selectedEntity);
              setIsModelHubOpen(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-slate-950" />
            <span>Central de Modelos (7 Entidades × 6 Formatos)</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-950 text-amber-300 uppercase">
              Ver Todos
            </span>
          </button>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-200">Baixar {currentEntityConfig.singular}:</span>
            {FORMATS_CONFIG.map(fmt => (
              <button
                key={fmt.id}
                onClick={() => handleDownloadSample(fmt.id, selectedEntity)}
                className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title={`Baixar modelo ${fmt.label}`}
              >
                <Download className="w-2.5 h-2.5 text-amber-300" />
                {fmt.id.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step 1: Select Entity & Upload Mode */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#53383e]" />
              1. Selecione a Entidade do Sistema para Importar
            </h2>
            <p className="text-xs text-slate-500">Escolha o cadastro de destino correspondente ao arquivo de backup.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Ação de salvamento:</span>
            <select
              value={importMode}
              onChange={(e) => setImportMode(e.target.value as any)}
              className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800"
            >
              <option value="append">Acrescentar aos dados atuais (Recomendado)</option>
              <option value="replace">Substituir todos os dados existentes</option>
            </select>
          </div>
        </div>

        {/* Entity Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {ENTITIES_CONFIG.map(ent => {
            const Icon = ent.icon;
            const isSelected = selectedEntity === ent.id;
            return (
              <button
                key={ent.id}
                type="button"
                onClick={() => {
                  setSelectedEntity(ent.id);
                  setParsedRows([]);
                  setParsedHeaders([]);
                  setFileName(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-[#53383e] bg-[#f6eff1] text-[#53383e] shadow-xs ring-1 ring-[#53383e]'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-[#53383e]' : 'text-slate-500'}`} />
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#53383e]" />}
                </div>
                <div>
                  <div className="font-bold text-xs leading-tight">{ent.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{ent.singular}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Modelos e Exemplos Oficiais para Seguir - 6 Formatos */}
        <div className="mt-4 p-4.5 bg-gradient-to-br from-slate-50 via-white to-amber-50/40 rounded-xl border border-amber-200/80 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-800 flex items-center justify-center border border-amber-200">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Modelos de Exemplo Oficiais para Seguir —</span>
                  <span className="text-[#53383e] underline decoration-amber-400 font-extrabold">{currentEntityConfig.label}</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Baixe ou copie o modelo exato nos 6 formatos aceitos pelo sistema. Todos contêm as colunas obrigatórias e 3 linhas de amostras válidas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleLoadSampleDirectly(selectedEntity)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                title="Carregar as 3 linhas de amostra diretamente na tabela de mapeamento"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Testar este Modelo Agora</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setModelHubEntity(selectedEntity);
                  setIsModelHubOpen(true);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                <span>Ver Central de Modelos</span>
              </button>
            </div>
          </div>

          {/* Grid dos 6 formatos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
            {FORMATS_CONFIG.map(fmt => {
              const FmtIcon = fmt.icon;
              const isCopied = copiedFormatKey === `${selectedEntity}-${fmt.id}`;

              return (
                <div
                  key={fmt.id}
                  className="bg-white p-3 rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs flex flex-col justify-between space-y-2.5 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <FmtIcon className="w-4 h-4 text-slate-700" />
                        <span className="font-bold text-xs text-slate-900">{fmt.label}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${fmt.badge}`}>
                        {fmt.ext}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                      {fmt.description}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleDownloadSample(fmt.id, selectedEntity)}
                      className="w-full py-1.5 px-2 bg-slate-900 hover:bg-[#53383e] text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3 h-3 text-amber-300" />
                      <span>Baixar Modelo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopySampleText(fmt.id, selectedEntity)}
                      className={`w-full py-1 px-2 rounded-lg text-[10px] font-semibold border flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5 text-slate-500" />
                          <span>Copiar Modelo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step 2: Upload Area supporting CSV, XLS, XLSX, TXT, PDF, XML, SQL */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-blue-600" />
              2. Carregar Arquivo de Backup ou Relatório (CSV, XLS, XLSX, TXT, PDF, XML, SQL)
            </h2>
            <p className="text-xs text-slate-500">
              O sistema detecta automaticamente o delimitador, colunas e extrai as linhas para {currentEntityConfig.label}.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsPasteModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Table className="w-3.5 h-3.5 text-indigo-600" />
            <span>Colar Texto / Tabela de PDF</span>
          </button>
        </div>

        {/* Drag and Drop Zone */}
        <label className="border-2 border-dashed border-slate-300 hover:border-[#53383e] hover:bg-slate-50/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.txt,.pdf,.xml,.sql"
            className="hidden"
            onChange={handleFileUpload}
          />
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 mb-3 shadow-inner">
            <UploadCloud className="w-7 h-7 text-[#53383e]" />
          </div>
          <span className="text-sm font-bold text-slate-800">
            Clique para selecionar ou arraste o arquivo do seu computador
          </span>
          <span className="text-xs text-slate-500 mt-1 max-w-md">
            Formatos aceitos: <strong>.csv, .xlsx, .xls, .txt, .pdf, .xml, .sql</strong>.
          </span>
          <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">Excel / Planilhas</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Listas & Tabelas PDF</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">Dumps SQL</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">XML Export</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">CSV & TXT</span>
          </div>
        </label>

        {isProcessing && (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-blue-900 text-xs flex items-center gap-2 justify-center">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Processando arquivo e decodificando colunas...</span>
          </div>
        )}

        {feedbackMessage && (
          <div className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
            feedbackMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{feedbackMessage.text}</span>
          </div>
        )}

        {/* Anti-Duplicate Protection & Upload History Banner */}
        <div className="border border-slate-200 bg-slate-50/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-slate-700 font-semibold">
              Proteção Anti-Duplicidade Ativa
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              (identifica uploads duplicados via Hash SHA-256, nome e tamanho de arquivo)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowUploadHistory(!showUploadHistory)}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>{showUploadHistory ? 'Ocultar Histórico' : `Ver Histórico de Uploads (${getUploadedFilesHistory().length})`}</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showUploadHistory ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* Collapsible Uploads History Drawer */}
        {showUploadHistory && (
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 text-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800">Histórico de Arquivos Enviados & Processados</span>
              <span className="text-[11px] text-slate-400">Total: {getUploadedFilesHistory().length} arquivos</span>
            </div>

            {getUploadedFilesHistory().length === 0 ? (
              <p className="text-slate-400 text-[11px] py-3 text-center">Nenhum arquivo enviado até o momento.</p>
            ) : (
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {getUploadedFilesHistory().map(rec => (
                  <div key={rec.id} className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg">
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 truncate" title={rec.fileName}>{rec.fileName}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          rec.category === 'nfe_xml' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {rec.category === 'nfe_xml' ? 'XML NF-e' : (rec.entity || 'Cadastro')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(rec.uploadedAt).toLocaleString('pt-BR')} · {formatBytes(rec.fileSize)}
                        {rec.recordCount !== undefined ? ` · ${rec.recordCount} registros` : ''}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                      Registrado
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Column Mapping & Data Preview (if file loaded) */}
      {parsedRows.length > 0 && (
        <div id="step-3-mapping" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Table className="w-4 h-4 text-emerald-600" />
                3. Conferência e Mapeamento de Colunas ({parsedRows.length} registros prontos)
              </h2>
              <p className="text-xs text-slate-500">
                Arquivo ativo: <strong>{fileName || 'Lista Importada'}</strong>. Confira o mapeamento e visualize os dados antes de gravar.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setParsedRows([]);
                  setParsedHeaders([]);
                  setFileName(null);
                }}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={handleCommitImport}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Efetivar Importação de {parsedRows.length} {currentEntityConfig.label}</span>
              </button>
            </div>
          </div>

          {/* Mapping Grid */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Correspondência entre as Colunas do Arquivo e o Sistema
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {currentEntityConfig.fields.map(field => {
                const selectedCol = columnMapping[field.key] || '';
                return (
                  <div key={field.key} className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1 truncate">
                      {field.label} {field.required && <span className="text-rose-600">*</span>}
                    </label>
                    <select
                      value={selectedCol}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className={`w-full p-1.5 text-xs rounded border ${
                        selectedCol ? 'bg-emerald-50/50 border-emerald-300 font-medium text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <option value="">-- Não mapear --</option>
                      {parsedHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Preview Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Pré-visualização dos 10 Primeiros Registros Mapeados</span>
              <span className="font-mono text-slate-500">Total: {parsedRows.length} linhas</span>
            </div>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 text-center">#</th>
                    {currentEntityConfig.fields.map(f => (
                      <th key={f.key} className="py-2 px-3 whitespace-nowrap">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {parsedRows.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center font-mono text-slate-400 text-[10px]">
                        {idx + 1}
                      </td>
                      {currentEntityConfig.fields.map(f => {
                        const colKey = columnMapping[f.key];
                        const val = colKey ? row[colKey] : '';
                        return (
                          <td key={f.key} className="py-2 px-3 truncate max-w-xs text-slate-800">
                            {val ? String(val) : <span className="text-slate-300 italic">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Pasting PDF Text / Tabular List */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-r from-slate-900 to-[#53383e] text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Table className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-bold text-sm">Colar Lista / Texto Extraído de PDF ou Planilha</h3>
                  <p className="text-[11px] text-slate-300">Cole as linhas ou tabela com cabeçalho separada por tabs ou ponto-e-vírgula.</p>
                </div>
              </div>
              <button
                onClick={() => setIsPasteModalOpen(false)}
                className="text-slate-300 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <strong>Dica para importar PDF:</strong> Abra seu PDF no Adobe Reader, navegador ou leitor de PDF, selecione a tabela ou lista de dados (com ou sem cabeçalho), copie com <code>Ctrl+C</code> e cole no campo abaixo.
              </div>

              <textarea
                rows={10}
                placeholder={`Nome\tCPF\tTelefone\tCidade\nHotel Fazenda\t12.345.678/0001-90\t(11) 98765-4321\tCampinas\nClube Campestre\t98.765.432/0001-10\t(19) 99881-2233\tValinhos`}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleProcessPastedText}
                disabled={!pasteText.trim()}
                className="px-5 py-2 bg-[#53383e] hover:bg-[#432c32] disabled:opacity-50 text-white font-bold rounded-lg transition-colors cursor-pointer"
              >
                Processar e Mapear Colunas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Central de Modelos de Exemplo e Migração (7 Entidades x 6 Formatos) */}
      {isModelHubOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-5 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-[#53383e] to-slate-900 text-white p-4 sm:p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-300/30 shrink-0">
                  <BookOpen className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg">Central de Modelos de Importação & Backups</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                      7 Entidades × 6 Formatos
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Consulte as regras de preenchimento, copie exemplos válidos ou baixe arquivos pré-formatados para seguir na sua migração.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModelHubOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Entity Selector Bar */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 overflow-x-auto shrink-0 flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 shrink-0">Entidade:</span>
              {ENTITIES_CONFIG.map(ent => {
                const Icon = ent.icon;
                const isSelected = modelHubEntity === ent.id;
                return (
                  <button
                    key={ent.id}
                    type="button"
                    onClick={() => setModelHubEntity(ent.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#53383e] text-white shadow-xs'
                        : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{ent.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Format Selector Bar */}
            <div className="bg-white border-b border-slate-200 px-4 py-2 shrink-0 flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 shrink-0">Formato:</span>
              {FORMATS_CONFIG.map(fmt => {
                const FmtIcon = fmt.icon;
                const isSelected = modelHubFormat === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setModelHubFormat(fmt.id)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <FmtIcon className="w-3.5 h-3.5" />
                    <span>{fmt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            {(() => {
              const activeEntityDef = ENTITIES_CONFIG.find(e => e.id === modelHubEntity)!;
              const activeFormatDef = FORMATS_CONFIG.find(f => f.id === modelHubFormat)!;
              const sampleRows = ENTITY_SAMPLES_MAP[modelHubEntity] || [];
              const isCopied = copiedFormatKey === `${modelHubEntity}-${modelHubFormat}`;

              // Determine text content for preview
              let previewText = '';
              if (modelHubFormat === 'csv') {
                previewText = generateCSVText(activeEntityDef);
              } else if (modelHubFormat === 'txt') {
                previewText = generateTXTText(activeEntityDef);
              } else if (modelHubFormat === 'xml') {
                previewText = generateXMLText(activeEntityDef);
              } else if (modelHubFormat === 'sql') {
                previewText = generateSQLText(activeEntityDef);
              }

              return (
                <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
                  {/* Action Banner */}
                  <div className="p-4 bg-gradient-to-r from-slate-50 via-white to-amber-50/40 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${activeFormatDef.badge}`}>
                          {activeFormatDef.ext}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">
                          Modelo Oficial para {activeEntityDef.label} em {activeFormatDef.label}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {activeFormatDef.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownloadSample(modelHubFormat, modelHubEntity)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-[#53383e] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-300" />
                        <span>Baixar Arquivo {activeFormatDef.ext}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopySampleText(modelHubFormat, modelHubEntity)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copiar Modelo</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLoadSampleDirectly(modelHubEntity, modelHubFormat)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Testar no Importador</span>
                      </button>
                    </div>
                  </div>

                  {/* Visualizer / Code Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Code2 className="w-4 h-4 text-[#53383e]" />
                        <span>Pré-visualização do Arquivo Modelo:</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        modelo_importacao_{activeEntityDef.id}{activeFormatDef.ext}
                      </span>
                    </div>

                    {modelHubFormat === 'xlsx' || modelHubFormat === 'pdf' ? (
                      /* Table view for binary formats XLSX / PDF */
                      <div className="bg-slate-900 rounded-xl p-4 text-white space-y-3">
                        <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                          <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                            {modelHubFormat === 'xlsx' ? <FileSpreadsheet className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
                            {modelHubFormat === 'xlsx' 
                              ? 'Planilha Nativa Excel (.xlsx) pronta para download com células e colunas auto-ajustadas.' 
                              : 'Documento PDF (.pdf) oficial com Guia de Especificação e Tabela de Amostras para impressão.'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            3 linhas de dados reais
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-700 text-slate-300 text-[11px]">
                                {activeEntityDef.fields.map(f => (
                                  <th key={f.key} className="py-2 px-3 whitespace-nowrap bg-slate-800/80 font-bold">
                                    {f.label} {f.required && <span className="text-rose-400">*</span>}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 font-mono text-[11px] text-slate-200">
                              {sampleRows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-800/40">
                                  {activeEntityDef.fields.map(f => (
                                    <td key={f.key} className="py-2 px-3 whitespace-nowrap">
                                      {row[f.label] || f.sample}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      /* Syntax code view for CSV, TXT, XML, SQL */
                      <div className="relative group">
                        <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-64 leading-relaxed border border-slate-800 shadow-inner">
                          {previewText}
                        </pre>
                        <button
                          type="button"
                          onClick={() => handleCopySampleText(modelHubFormat, modelHubEntity)}
                          className="absolute top-3 right-3 px-2.5 py-1 bg-slate-800/90 hover:bg-slate-700 text-white rounded-md text-[11px] font-bold flex items-center gap-1 transition-all opacity-80 group-hover:opacity-100 cursor-pointer shadow-xs"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copiar</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Dicionário de Campos e Regras Técnicas */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Table className="w-4 h-4 text-blue-600" />
                        <span>Dicionário Oficial de Campos & Regras de Preenchimento ({activeEntityDef.label}):</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {activeEntityDef.fields.filter(f => f.required).length} obrigatórios / {activeEntityDef.fields.length} totais
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                            <th className="py-2.5 px-3">Nome da Coluna</th>
                            <th className="py-2.5 px-3">Chave Técnica</th>
                            <th className="py-2.5 px-3">Obrigatoriedade</th>
                            <th className="py-2.5 px-3">Tipo / Regra Esperada</th>
                            <th className="py-2.5 px-3">Valor de Exemplo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeEntityDef.fields.map(field => (
                            <tr key={field.key} className="hover:bg-slate-50/70">
                              <td className="py-2 px-3 font-semibold text-slate-900">
                                {field.label}
                              </td>
                              <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                                {field.key}
                              </td>
                              <td className="py-2 px-3">
                                {field.required ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                    Obrigatório *
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                    Opcional
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-slate-600 text-[11px]">
                                {getFieldRuleHint(field.key)}
                              </td>
                              <td className="py-2 px-3 font-mono text-[11px] text-[#53383e] font-semibold">
                                {field.sample}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs shrink-0">
              <span className="text-[11px] text-slate-500">
                Sistema GestãoPro · Compatível com backups de qualquer ERP ou software anterior.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModelHubOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSampleDirectly(modelHubEntity, modelHubFormat)}
                  className="px-5 py-2 bg-[#53383e] hover:bg-[#432c32] text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Carregar este Modelo no Importador</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alerta de Upload Duplicado (Planilhas & Cadastros) */}
      {duplicateUploadModalState.isOpen && duplicateUploadModalState.record && (
        <DuplicateUploadModal
          isOpen={duplicateUploadModalState.isOpen}
          onClose={() => setDuplicateUploadModalState(prev => ({ ...prev, isOpen: false }))}
          onProceedAnyway={() => {
            const proceedFn = duplicateUploadModalState.onProceed;
            setDuplicateUploadModalState(prev => ({ ...prev, isOpen: false }));
            proceedFn();
          }}
          duplicateRecord={duplicateUploadModalState.record}
          currentFileName={duplicateUploadModalState.fileName}
          currentFileSize={duplicateUploadModalState.fileSize}
        />
      )}
    </div>
  );
};
