/**
 * ============================================================================
 * FIRE GESTÃO — CONTROLE CENTRAL DE ATIVAÇÃO E DESATIVAÇÃO DE MÓDULOS
 * ============================================================================
 *
 * Como usar este arquivo:
 *   • Defina `true`  para ATIVAR o módulo no sistema.
 *   • Defina `false` para DESATIVAR o módulo (ele desaparece do menu lateral,
 *     dos atalhos do topo e tem sua rota bloqueada automaticamente).
 *
 * Após alterar este arquivo na VPS/servidor, rode `npm run build` para aplicar.
 * Você também pode ativar/desativar módulos em tempo real pela tela
 * Configurações → Módulos do Sistema (com prioridade automática para alterações
 * feitas diretamente neste arquivo).
 */

export type ModuloId =
  | 'dashboard'
  | 'agenda'
  | 'pdv'
  | 'orders'
  | 'sales'
  | 'customerPortal'
  | 'financial'
  | 'charts'
  | 'profitability'
  | 'accounting'
  | 'operational'
  | 'fleet'
  | 'initialCosts'
  | 'cadastros'
  | 'cardOperators'
  | 'products'
  | 'clients'
  | 'suppliers'
  | 'employees'
  | 'googleDrive'
  | 'configuracoes'
  | 'documentation';

export type ModuloCategoria = 'OPERAÇÕES' | 'FINANCEIRO' | 'CADASTROS' | 'SISTEMA';

/**
 * CHAVE MESTRA DOS MÓDULOS
 * Altere para `true` (ativado) ou `false` (desativado):
 */
export const MODULOS_ATIVOS: Record<ModuloId, boolean> = {
  // === OPERAÇÕES ===
  dashboard: true,       // Visão Geral (Painel Principal)
  agenda: true,          // Google Agenda & Compromissos
  pdv: true,             // PDV / Frente de Caixa
  orders: true,          // Ordens de Serviço (O.S.)
  sales: true,           // Vendas Diretas
  customerPortal: true,  // Portal do Cliente

  // === FINANCEIRO ===
  financial: true,       // Financeiro & DRE
  charts: true,          // Gráficos & BI
  profitability: true,   // Lucratividade por Funcionário
  accounting: true,      // Fechamento Fiscal / Contábil
  operational: true,     // Custos Fixos & Operacionais
  fleet: true,           // Frota & Veículos
  initialCosts: true,    // Simulador de Custos Iniciais

  // === CADASTROS ===
  cadastros: true,       // Central de Cadastros & Importador
  cardOperators: true,   // Operadoras de Cartão & Taxas
  products: true,        // Estoque & Produtos
  clients: true,         // Clientes
  suppliers: true,       // Fornecedores
  employees: true,       // Funcionários & Folha

  // === SISTEMA ===
  googleDrive: true,     // Google Drive (Nuvem)
  configuracoes: true,   // Configurações do Sistema
  documentation: true,   // Ajuda & Manual do Sistema
};

export interface ModuloDefinicao {
  id: ModuloId;
  nome: string;
  categoria: ModuloCategoria;
  pasta: string;
  descricao: string;
  essencial?: boolean;
}

export const MODULOS_CATALOGO: ModuloDefinicao[] = [
  // OPERAÇÕES
  {
    id: 'dashboard',
    nome: 'Visão Geral (Dashboard)',
    categoria: 'OPERAÇÕES',
    pasta: 'src/modulos/dashboard',
    descricao: 'Painel executivo com resumo de receitas, gráficos, metas e alertas operacionais.'
  },
  {
    id: 'agenda',
    nome: 'Google Agenda',
    categoria: 'OPERAÇÕES',
    pasta: 'src/modulos/agenda',
    descricao: 'Agenda de visitas técnicas, compromissos da equipe e integração com Google Calendar.'
  },
  {
    id: 'pdv',
    nome: 'PDV / Frente de Caixa',
    categoria: 'OPERAÇÕES',
    pasta: 'src/modulos/pdv',
    descricao: 'Caixa rápido com abertura/fechamento, múltiplas formas de pagamento, bandeiras e recibos.'
  },
  {
    id: 'orders',
    nome: 'Ordens de Serviço',
    categoria: 'OPERAÇÕES',
    pasta: 'src/modulos/ordens-servico',
    descricao: 'Gestão completa de orçamentos, execução técnica, peças, checklists, garantias e impressão A4.'
  },
  {
    id: 'sales',
    nome: 'Vendas',
    categoria: 'OPERAÇÕES',
    pasta: 'src/modulos/vendas',
    descricao: 'Lançamento de vendas de produtos e serviços com envio direto para finalização no PDV.'
  },
  {
    id: 'customerPortal',
    nome: 'Portal do Cliente',
    categoria: 'OPERAÇÕES',
    pasta: 'src/modulos/portal-cliente',
    descricao: 'Área de autoatendimento para acompanhamento de O.S., garantias e chamados.'
  },

  // FINANCEIRO
  {
    id: 'financial',
    nome: 'Financeiro & DRE',
    categoria: 'FINANCEIRO',
    pasta: 'src/modulos/financeiro',
    descricao: 'DRE gerencial reconciliado, Contas a Receber, Contas a Pagar e fluxo de caixa.'
  },
  {
    id: 'charts',
    nome: 'Gráficos & BI',
    categoria: 'FINANCEIRO',
    pasta: 'src/modulos/graficos-bi',
    descricao: 'Painel de Business Intelligence com filtros por período, cliente, produto e múltiplos gráficos.'
  },
  {
    id: 'profitability',
    nome: 'Lucratividade por Funcionário',
    categoria: 'FINANCEIRO',
    pasta: 'src/modulos/lucratividade',
    descricao: 'Apuração individual de receita, custo de peças, folha, comissões e margem por colaborador.'
  },
  {
    id: 'accounting',
    nome: 'Fechamento Fiscal',
    categoria: 'FINANCEIRO',
    pasta: 'src/modulos/fechamento-fiscal',
    descricao: 'Consolidação mensal para contabilidade com base de serviços, comércio, folha e exportação PDF.'
  },
  {
    id: 'operational',
    nome: 'Custos Fixos',
    categoria: 'FINANCEIRO',
    pasta: 'src/modulos/custos-fixos',
    descricao: 'Controle de despesas fixas, aluguel, energia, assinaturas, impostos e despesas recorrentes.'
  },
  {
    id: 'fleet',
    nome: 'Frota & Veículos',
    categoria: 'FINANCEIRO',
    pasta: 'src/modulos/frota',
    descricao: 'Cadastro de veículos, abastecimentos, manutenções preventivas e custo por quilômetro.'
  },
  {
    id: 'initialCosts',
    nome: 'Custos Iniciais',
    categoria: 'FINANCEIRO',
    pasta: 'src/modulos/custos-iniciais',
    descricao: 'Simulador de investimentos iniciais, financiamentos, dívidas e ponto de equilíbrio.'
  },

  // CADASTROS
  {
    id: 'cadastros',
    nome: 'Central de Cadastros',
    categoria: 'CADASTROS',
    pasta: 'src/modulos/cadastros',
    descricao: 'Hub unificado de cadastros, serviços, checklists, usuários e importação universal (CSV/PDF).'
  },
  {
    id: 'cardOperators',
    nome: 'Operadoras de Cartão',
    categoria: 'CADASTROS',
    pasta: 'src/modulos/operadoras-cartao',
    descricao: 'Configuração de maquininhas, taxas por bandeira/parcela e regra de absorção ou repasse.'
  },
  {
    id: 'products',
    nome: 'Estoque',
    categoria: 'CADASTROS',
    pasta: 'src/modulos/estoque',
    descricao: 'Cadastro de produtos/peças, Kardex de movimentações, importação XML NF-e e busca no Gmail.'
  },
  {
    id: 'clients',
    nome: 'Clientes',
    categoria: 'CADASTROS',
    pasta: 'src/modulos/clientes',
    descricao: 'Base de clientes PF/PJ com histórico de compras, O.S., endereços e dados de contato.'
  },
  {
    id: 'suppliers',
    nome: 'Fornecedores',
    categoria: 'CADASTROS',
    pasta: 'src/modulos/fornecedores',
    descricao: 'Cadastro de fornecedores, CNPJ, produtos fornecidos e histórico de compras.'
  },
  {
    id: 'employees',
    nome: 'Funcionários',
    categoria: 'CADASTROS',
    pasta: 'src/modulos/funcionarios',
    descricao: 'Equipe, cargos, salários, horas trabalhadas, comissões e encargos trabalhistas.'
  },

  // SISTEMA
  {
    id: 'googleDrive',
    nome: 'Google Drive',
    categoria: 'SISTEMA',
    pasta: 'src/modulos/google-drive',
    descricao: 'Backup automático, envio de relatórios fiscais e armazenamento de documentos na nuvem.'
  },
  {
    id: 'configuracoes',
    nome: 'Configurações',
    categoria: 'SISTEMA',
    pasta: 'src/modulos/configuracoes',
    descricao: 'Dados da empresa, temas, usuários, auditoria, ativação de módulos e backups do sistema.',
    essencial: true
  },
  {
    id: 'documentation',
    nome: 'Ajuda & Manual',
    categoria: 'SISTEMA',
    pasta: 'src/modulos/manual',
    descricao: 'Manual completo de operação, documentação técnica e histórico de versões.'
  }
];

const STORAGE_KEY_OVERRIDES = 'firegestao_modulos_overrides_v1';
const STORAGE_KEY_FILE_SIG = 'firegestao_modulos_file_sig_v1';
export const MODULOS_CHANGED_EVENT = 'firegestao:modulos-changed';

const getFileConfigSignature = (): string => JSON.stringify(MODULOS_ATIVOS);

/**
 * Lê sobrescritas salvas em tempo real pela tela de Configurações.
 * Caso o arquivo `ativarModulos.ts` tenha sido editado no código, as sobrescritas
 * antigas são descartadas automaticamente para respeitar o arquivo-fonte.
 */
const readRuntimeOverrides = (): Partial<Record<ModuloId, boolean>> => {
  try {
    const currentSig = getFileConfigSignature();
    const savedSig = localStorage.getItem(STORAGE_KEY_FILE_SIG);
    if (savedSig !== currentSig) {
      localStorage.removeItem(STORAGE_KEY_OVERRIDES);
      localStorage.setItem(STORAGE_KEY_FILE_SIG, currentSig);
      return {};
    }
    const raw = localStorage.getItem(STORAGE_KEY_OVERRIDES);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

/**
 * Retorna o mapa final de módulos ativos combinando `MODULOS_ATIVOS`
 * (definido neste arquivo) com eventuais ajustes feitos em Configurações.
 */
export const getEstadoModulos = (): Record<ModuloId, boolean> => {
  const overrides = readRuntimeOverrides();
  const resultado = { ...MODULOS_ATIVOS };
  (Object.keys(MODULOS_ATIVOS) as ModuloId[]).forEach((id) => {
    if (typeof overrides[id] === 'boolean') {
      resultado[id] = overrides[id] as boolean;
    }
  });
  return resultado;
};

/**
 * Verifica se um módulo específico está ativo.
 */
export const isModuloAtivo = (id: ModuloId): boolean => {
  return Boolean(getEstadoModulos()[id]);
};

/**
 * Lista todos os IDs de módulos ativos no momento.
 */
export const getModulosAtivosIds = (): ModuloId[] => {
  const estado = getEstadoModulos();
  return (Object.keys(estado) as ModuloId[]).filter((id) => estado[id]);
};

/**
 * Retorna o primeiro módulo ativo disponível para redirecionamento seguro.
 */
export const getPrimeiroModuloAtivo = (): ModuloId => {
  const ativos = getModulosAtivosIds();
  if (ativos.includes('dashboard')) return 'dashboard';
  return ativos[0] || 'configuracoes';
};

/**
 * Ativa ou desativa um módulo em tempo real (usado pela aba Módulos em Configurações).
 */
export const setModuloAtivoRuntime = (id: ModuloId, ativo: boolean): Record<ModuloId, boolean> => {
  const overrides = readRuntimeOverrides();
  overrides[id] = ativo;
  try {
    localStorage.setItem(STORAGE_KEY_FILE_SIG, getFileConfigSignature());
    localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(overrides));
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MODULOS_CHANGED_EVENT));
  }
  return getEstadoModulos();
};

/**
 * Restaura o estado de todos os módulos exatamente conforme definido neste arquivo (`MODULOS_ATIVOS`).
 */
export const restaurarPadraoArquivoModulos = (): Record<ModuloId, boolean> => {
  try {
    localStorage.removeItem(STORAGE_KEY_OVERRIDES);
    localStorage.setItem(STORAGE_KEY_FILE_SIG, getFileConfigSignature());
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MODULOS_CHANGED_EVENT));
  }
  return getEstadoModulos();
};
