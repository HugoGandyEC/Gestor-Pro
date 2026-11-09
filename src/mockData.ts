import { 
  Employee, 
  Vehicle, 
  VehicleMaintenance, 
  GeneralExpense, 
  ServiceOrder, 
  DirectSale,
  InitialSetupCostItem,
  Client,
  Supplier,
  Product,
  StockMovement,
  CardMachineRate,
  CustomerPortalTicket,
  AuditLog,
  CompanySettings,
  ServiceCatalogItem,
  ChecklistTemplate,
  CardOperator,
  PagBankTransaction,
  SequenceSettings,
  WarrantyPolicy,
  ThemeDefinition,
  AuthUser,
  CompanyAppointment
} from './types';

// ============================================================================
// DADOS INICIAIS LIMPOS PARA AMBIENTE DE PRODUÇÃO E SERVIDOR WEB
// Todas as listas de exemplo foram removidas para uso real do sistema.
// ============================================================================

export const initialClients: Client[] = [];

export const initialSuppliers: Supplier[] = [];

export const initialProducts: Product[] = [];

export const initialProductCategories: string[] = [
  'Reservatórios Térmicos',
  'Bombas e Motores',
  'Tubulações e Conexões',
  'Insumos Elétricos',
  'Peças Gerais',
  'Aquecedores Solares',
  'Filtros e Acessórios',
  'Iluminação & Automação'
];

export const initialProductSubcategories: string[] = [
  'Alta Pressão',
  'Baixa Pressão',
  'Inox 304',
  'Inox 316',
  'Bombas Centrífugas',
  'Bombas Autoescorvantes',
  'Bombas de Calor',
  'Conexões PVC',
  'Tubos CPVC',
  'Resistências Elétricas',
  'Termostatos',
  'Válvulas e Registros',
  'Química e Tratamento'
];

export const initialProductBrands: string[] = [
  'TermoMax',
  'Sollarium',
  'Komeco',
  'Dancor',
  'Jacuzzi',
  'Tigre',
  'Schneider',
  'Amanco',
  'Tholz',
  'Nautilus',
  'Inbramaq',
  'Genco'
];

export const initialProductTags: string[] = [
  'aquecedor',
  'solar',
  'boiler',
  'piscina',
  'bomba',
  'inox',
  'resistencia',
  'valvula',
  'filtro',
  'alta-pressao',
  'termostato',
  'comando-eletrico'
];

export const initialStockMovements: StockMovement[] = [];

export const initialCardRates: CardMachineRate[] = [
  { brand: 'visa', debitRate: 1.49, creditSightRate: 3.19, creditInstallmentsRate: 4.89 },
  { brand: 'mastercard', debitRate: 1.49, creditSightRate: 3.19, creditInstallmentsRate: 4.89 },
  { brand: 'elo', debitRate: 1.60, creditSightRate: 3.40, creditInstallmentsRate: 5.20 },
  { brand: 'hipercard', debitRate: 1.70, creditSightRate: 3.50, creditInstallmentsRate: 5.40 },
  { brand: 'outra', debitRate: 1.80, creditSightRate: 3.60, creditInstallmentsRate: 5.50 }
];

export const initialCardOperators: CardOperator[] = [
  {
    id: 'op-pagbank',
    name: 'PagBank (PagSeguro UOL)',
    code: 'pagbank',
    cnpj: '08.561.701/0001-01',
    type: 'maquininha',
    active: true,
    settlementTermDays: 1,
    pixRate: 0.00,
    debitRate: 1.99,
    creditSightRate: 3.19,
    creditInstallments2to6Rate: 3.79,
    creditInstallments7to12Rate: 4.99,
    anticipationRate: 1.20,
    acceptedBrands: ['Visa', 'Mastercard', 'Elo', 'Hipercard', 'American Express', 'Alelo'],
    defaultAbsorptionMode: 'repassar',
    installmentRates: [
      { installment: 1, rate: 3.19, absorptionMode: 'assumir' },
      { installment: 2, rate: 3.79, absorptionMode: 'repassar' },
      { installment: 3, rate: 4.19, absorptionMode: 'repassar' },
      { installment: 4, rate: 4.59, absorptionMode: 'repassar' },
      { installment: 5, rate: 4.99, absorptionMode: 'repassar' },
      { installment: 6, rate: 5.39, absorptionMode: 'repassar' },
      { installment: 7, rate: 5.89, absorptionMode: 'repassar' },
      { installment: 8, rate: 6.29, absorptionMode: 'repassar' },
      { installment: 9, rate: 6.69, absorptionMode: 'repassar' },
      { installment: 10, rate: 7.09, absorptionMode: 'repassar' },
      { installment: 11, rate: 7.49, absorptionMode: 'repassar' },
      { installment: 12, rate: 7.99, absorptionMode: 'repassar' }
    ],
    integration: {
      enabled: false,
      environment: 'production',
      apiToken: '',
      webhookUrl: 'https://seuservidor.com/api/webhooks/pagbank',
      autoReconcile: true,
      status: 'disconnected',
      autoNotifyClientWhatsapp: true
    },
    notes: 'Configuração padrão de operadora de pagamentos com baixa automática para maquininhas e link de pagamento.',
    createdAt: new Date().toISOString().split('T')[0]
  },
  {
    id: 'op-infinitepay',
    name: 'InfinitePay (CloudWalk)',
    code: 'infinitepay',
    cnpj: '32.748.242/0001-04',
    type: 'maquininha',
    active: true,
    settlementTermDays: 1,
    pixRate: 0.00,
    debitRate: 1.38,
    creditSightRate: 3.16,
    creditInstallments2to6Rate: 5.40,
    creditInstallments7to12Rate: 9.31,
    anticipationRate: 0.00,
    acceptedBrands: ['Visa', 'Mastercard', 'Elo', 'Hipercard'],
    defaultAbsorptionMode: 'repassar',
    installmentRates: [
      { installment: 1, rate: 3.16, absorptionMode: 'assumir' },
      { installment: 2, rate: 5.40, absorptionMode: 'repassar' },
      { installment: 3, rate: 6.19, absorptionMode: 'repassar' },
      { installment: 4, rate: 6.98, absorptionMode: 'repassar' },
      { installment: 5, rate: 7.76, absorptionMode: 'repassar' },
      { installment: 6, rate: 8.54, absorptionMode: 'repassar' },
      { installment: 7, rate: 9.31, absorptionMode: 'repassar' },
      { installment: 8, rate: 10.08, absorptionMode: 'repassar' },
      { installment: 9, rate: 10.84, absorptionMode: 'repassar' },
      { installment: 10, rate: 11.59, absorptionMode: 'repassar' },
      { installment: 11, rate: 12.34, absorptionMode: 'repassar' },
      { installment: 12, rate: 13.08, absorptionMode: 'repassar' }
    ],
    integration: {
      enabled: false,
      environment: 'production',
      apiToken: '',
      webhookUrl: 'https://seuservidor.com/api/webhooks/infinitepay',
      autoReconcile: true,
      status: 'disconnected',
      autoNotifyClientWhatsapp: true
    },
    notes: 'Operadora InfinitePay (CloudWalk) com taxas competitivas e liquidação em 1 dia útil, configurada com todas as 12 parcelas.',
    createdAt: new Date().toISOString().split('T')[0]
  }
];

export const initialPagBankTransactions: PagBankTransaction[] = [];

export const initialEmployees: Employee[] = [
  {
    id: 'emp-admin',
    name: 'Administrador do Sistema',
    role: 'Administrador Geral',
    email: 'admin@gestaopro.com.br',
    phone: '',
    baseSalary: 0,
    benefitsCharges: 0,
    commissionRate: 0,
    status: 'Ativo',
    admissionDate: new Date().toISOString().split('T')[0]
  }
];

export const initialVehicles: Vehicle[] = [];

export const initialVehicleExpenses: VehicleMaintenance[] = [];

export const initialGeneralExpenses: GeneralExpense[] = [];

export const initialServiceOrders: ServiceOrder[] = [];

export const initialDirectSales: DirectSale[] = [];

export const initialSetupCosts: InitialSetupCostItem[] = [
  {
    id: 'sc-aluguel',
    name: 'Aluguel da Loja & Galpão Operacional',
    category: 'aluguel_loja',
    costType: 'recorrente',
    isRecurring: true,
    installmentsCount: 1,
    paidInstallments: 0,
    installmentValue: 3850.00,
    estimatedCost: 3850.00,
    actualCost: 3850.00,
    date: '2026-01-05',
    dueDate: '2026-11-10',
    dueDay: 10,
    creditor: 'Imobiliária Central do Sol',
    status: 'em_andamento',
    syncWithGeneralExpenses: true,
    notes: 'Ponto comercial com oficina e showroom.'
  },
  {
    id: 'sc-salarios',
    name: 'Salários & Folha de Pagamento Funcionários Fichados (CLT)',
    category: 'salario_clt',
    costType: 'recorrente',
    isRecurring: true,
    installmentsCount: 1,
    paidInstallments: 0,
    installmentValue: 7200.00,
    estimatedCost: 7200.00,
    actualCost: 7200.00,
    date: '2026-01-01',
    dueDate: '2026-11-05',
    dueDay: 5,
    creditor: 'Folha de Pagamento / Equipe Operacional',
    status: 'em_andamento',
    syncWithGeneralExpenses: true,
    notes: 'Salário base + encargos trabalhistas, INSS e FGTS da equipe.'
  },
  {
    id: 'sc-das-mei',
    name: 'DAS do MEI / Tributos Mensais Simples Nacional',
    category: 'das_mei',
    costType: 'recorrente',
    isRecurring: true,
    installmentsCount: 1,
    paidInstallments: 0,
    installmentValue: 75.90,
    estimatedCost: 75.90,
    actualCost: 75.90,
    date: '2026-01-15',
    dueDate: '2026-11-20',
    dueDay: 20,
    creditor: 'Receita Federal do Brasil (PGMEI)',
    status: 'em_andamento',
    syncWithGeneralExpenses: true,
    notes: 'Guia mensal de arrecadação do Documento de Arrecadação do Simples Nacional.'
  },
  {
    id: 'sc-combustivel',
    name: 'Combustíveis da Frota Operacional (Gasolina / Etanol)',
    category: 'combustivel',
    costType: 'recorrente',
    isRecurring: true,
    installmentsCount: 1,
    paidInstallments: 0,
    installmentValue: 1800.00,
    estimatedCost: 1800.00,
    actualCost: 1800.00,
    date: '2026-01-10',
    dueDate: '2026-11-28',
    dueDay: 28,
    creditor: 'Posto Petrobras Matriz',
    status: 'em_andamento',
    syncWithGeneralExpenses: true,
    notes: 'Abastecimento semanal dos utilitários de campo.'
  },
  {
    id: 'sc-internet',
    name: 'Internet Fibra 600MB & Telefonia da Loja',
    category: 'internet',
    costType: 'recorrente',
    isRecurring: true,
    installmentsCount: 1,
    paidInstallments: 0,
    installmentValue: 219.90,
    estimatedCost: 219.90,
    actualCost: 219.90,
    date: '2026-01-12',
    dueDate: '2026-11-15',
    dueDay: 15,
    creditor: 'Vivo Fibra Empresas',
    status: 'em_andamento',
    syncWithGeneralExpenses: true,
    notes: 'Link dedicado e ramais VoIP da recepção.'
  },
  {
    id: 'sc-alimentacao',
    name: 'Alimentação da Equipe & Vale Refeição',
    category: 'alimentacao',
    costType: 'recorrente',
    isRecurring: true,
    installmentsCount: 1,
    paidInstallments: 0,
    installmentValue: 1200.00,
    estimatedCost: 1200.00,
    actualCost: 1200.00,
    date: '2026-01-05',
    dueDate: '2026-11-05',
    dueDay: 5,
    creditor: 'Sodexo / VR Benefícios',
    status: 'em_andamento',
    syncWithGeneralExpenses: true,
    notes: 'Recarga mensal do cartão alimentação para os técnicos.'
  },
  {
    id: 'sc-seguro-veiculo',
    name: 'Seguro da Frota de Veículos e Utilitários',
    category: 'seguro_veiculo',
    costType: 'parcelado',
    isRecurring: false,
    installmentsCount: 12,
    paidInstallments: 4,
    installmentValue: 380.00,
    estimatedCost: 4560.00,
    actualCost: 4560.00,
    date: '2026-06-01',
    dueDate: '2026-11-10',
    dueDay: 10,
    creditor: 'Porto Seguro Cia de Seguros',
    status: 'em_andamento',
    syncWithGeneralExpenses: true,
    notes: 'Apólice coletiva contra colisão, terceiros e guincho 24h.'
  },
  {
    id: 'sc-ipva',
    name: 'IPVA dos Veículos da Empresa',
    category: 'ipva',
    costType: 'parcelado',
    isRecurring: false,
    installmentsCount: 5,
    paidInstallments: 2,
    installmentValue: 450.00,
    estimatedCost: 2250.00,
    actualCost: 2250.00,
    date: '2026-01-10',
    dueDate: '2026-11-20',
    dueDay: 20,
    creditor: 'Secretaria da Fazenda Estadual (SEFAZ)',
    status: 'em_andamento',
    syncWithGeneralExpenses: true,
    notes: 'Parcelamento anual do IPVA das Fiorinos de atendimento.'
  },
  {
    id: 'sc-impostos-carro',
    name: 'Impostos e Taxas sobre Carro (Licenciamento & DPVAT)',
    category: 'impostos_carro',
    costType: 'parcelado',
    isRecurring: false,
    installmentsCount: 3,
    paidInstallments: 1,
    installmentValue: 185.00,
    estimatedCost: 555.00,
    actualCost: 555.00,
    date: '2026-04-15',
    dueDate: '2026-11-18',
    dueDay: 18,
    creditor: 'DETRAN Estadual',
    status: 'em_andamento',
    syncWithGeneralExpenses: true,
    notes: 'Taxas anuais de regularização e emissão do CRLV digital.'
  },
  {
    id: 'sc-divida-banco',
    name: 'Empréstimo Bancário Capital de Giro & Expansão',
    category: 'divida_empresa',
    costType: 'parcelado',
    isRecurring: false,
    installmentsCount: 24,
    paidInstallments: 7,
    installmentValue: 850.00,
    estimatedCost: 20400.00,
    actualCost: 20400.00,
    date: '2026-03-01',
    dueDate: '2026-11-15',
    dueDay: 15,
    creditor: 'Banco Santander / Pronampe',
    status: 'em_andamento',
    syncWithGeneralExpenses: true,
    notes: 'Financiamento a taxa subsidiada para capital de giro e estoque.'
  },
  {
    id: 'sc-ferramentas',
    name: 'Bancada, Manômetros, Maçaricos e Ferramentas Técnicas',
    category: 'ferramental',
    costType: 'investimento_unico',
    isRecurring: false,
    installmentsCount: 1,
    paidInstallments: 1,
    installmentValue: 9800.00,
    estimatedCost: 10000.00,
    actualCost: 9800.00,
    date: '2026-01-02',
    dueDate: '2026-01-02',
    dueDay: 2,
    creditor: 'Casa do Mecânico & Hidráulica',
    status: 'adquirido',
    syncWithGeneralExpenses: false,
    notes: 'Investimento inicial em equipamentos e ferramental para técnicos.'
  }
];

export const initialCustomerTickets: CustomerPortalTicket[] = [];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-init',
    timestamp: new Date().toLocaleString('pt-BR'),
    userName: 'Sistema',
    userRole: 'admin',
    action: 'Inicialização do Sistema',
    details: 'Base de dados inicializada para ambiente de produção web.'
  }
];

export const initialSequenceSettings: SequenceSettings = {
  serviceOrderNextNumber: 1,
  serviceOrderPrefix: '',
  serviceOrderDigits: 0,
  saleNextNumber: 1,
  salePrefix: 'VD-',
  budgetNextNumber: 1,
  budgetPrefix: 'ORC-'
};

export const initialWarrantyPolicies: WarrantyPolicy[] = [
  {
    id: 'wp-padrao',
    name: 'Garantia Padrão Legal de Mão de Obra (90 Dias)',
    days: 90,
    category: 'Garantia Legal CDC',
    isDefault: true,
    terms: 'Garantia legal de 90 (noventa) dias para serviços e mão de obra técnica em conformidade com o Artigo 26, inciso II, do Código de Defesa do Consumidor (Lei 8.078/1990).',
    linkedServiceIds: [],
    createdAt: new Date().toISOString().split('T')[0]
  }
];

export const initialCompanySettings: CompanySettings = {
  companyName: 'GestãoPro - Assistência Técnica & Vendas',
  tradeName: 'GestãoPro ERP',
  cnpj: '',
  ie: '',
  im: '',
  phone: '',
  email: '',
  cep: '',
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: '',
  taxRegime: 'simples_nacional',
  defaultWarrantyTerms: 'Garantia legal de 90 dias para mão de obra conforme Código de Defesa do Consumidor (Art. 26, II). Equipamentos e peças possuem garantia do fabricante conforme certificado de garantia fornecido com o produto.',
  fiscalEnvironment: 'homologacao',
  standardVisitFee: 0,
  sequenceSettings: initialSequenceSettings,
  logoUrl: ''
};

export const initialServiceCatalog: ServiceCatalogItem[] = [];

export const initialChecklistTemplates: ChecklistTemplate[] = [];

export const themeDefinitions: ThemeDefinition[] = [
  {
    id: 'classico',
    name: 'MP Piscina Clássico',
    subtitle: 'Vinho Nobre & Grafite Urbano',
    description: 'Identidade visual original com tons nobres de vinho, grafite, sálvia e canvas clean.',
    swatches: ['#53383e', '#363739', '#c2bfb0', '#d8d8d8', '#f4f5f6'],
    colors: {
      primary: '#53383e',
      primaryHover: '#422c31',
      secondary: '#363739',
      accent: '#2563eb',
      canvas: '#f4f5f6',
      surface: '#ffffff',
      sidebarBg: '#53383e',
      sidebarText: '#ffffff',
      headerBg: '#53383e',
      headerText: '#ffffff',
      badgeBg: '#e8e5dc',
      badgeText: '#53383e',
      border: '#e2e8f0'
    }
  },
  {
    id: 'terracota_mineral',
    name: 'Terracota & Ardósia Mineral',
    subtitle: 'Paleta Anexada (#615F6D / #A67153 / #594A3C / #26241E / #F2E6D8)',
    description: 'Tema calibrado com todas as cores da paleta fornecida: estrutura em grafite ônix e café bronze (#26241E / #594A3C), terracota nobre vibrante (#A67153), ardósia violeta (#615F6D) e canvas em linho areia claro (#F2E6D8).',
    swatches: ['#26241E', '#594A3C', '#A67153', '#615F6D', '#F2E6D8'],
    colors: {
      primary: '#A67153',
      primaryHover: '#8d5b3f',
      secondary: '#594A3C',
      accent: '#615F6D',
      canvas: '#F8F3ED',
      surface: '#ffffff',
      sidebarBg: '#26241E',
      sidebarText: '#F2E6D8',
      headerBg: '#ffffff',
      headerText: '#26241E',
      badgeBg: '#F2E6D8',
      badgeText: '#A67153',
      border: '#dfd3c3'
    }
  },
  {
    id: 'solar_vivido',
    name: 'Solar & Cobalto Alegre',
    subtitle: 'Cores Vívidas, Convencional & Agradável',
    description: 'Layout vibrante, altamente convencional e agradável para uso diário. Estrutura em azul cobalto dinâmico (#1D4ED8), toques quentes em âmbar solar (#F59E0B) e coral (#EA580C), verde esmeralda (#10B981) e canvas limpo (#F8FAFC).',
    swatches: ['#1D4ED8', '#F59E0B', '#EA580C', '#10B981', '#0EA5E9', '#F8FAFC'],
    colors: {
      primary: '#1D4ED8',
      primaryHover: '#1e40af',
      secondary: '#F59E0B',
      accent: '#EA580C',
      canvas: '#F8FAFC',
      surface: '#ffffff',
      sidebarBg: '#0F172A',
      sidebarText: '#F8FAFC',
      headerBg: '#ffffff',
      headerText: '#0F172A',
      badgeBg: '#FEF3C7',
      badgeText: '#B45309',
      border: '#E2E8F0'
    }
  },
  {
    id: 'terra_oliva',
    name: 'Terra & Oliva Vibrante',
    subtitle: 'Paleta Terrosa (#50231D / #76321A / #9C5C26 / #6C6643 / #E8D1A7)',
    description: 'Cores quentes e terrosas vibrantes combinadas com oliva floresta e marfim suave.',
    swatches: ['#50231D', '#76321A', '#9C5C26', '#633C2C', '#6C6643', '#9C9167', '#E8D1A7'],
    colors: {
      primary: '#50231D',
      primaryHover: '#3c1a15',
      secondary: '#76321A',
      accent: '#9C5C26',
      canvas: '#FBF8F3',
      surface: '#ffffff',
      sidebarBg: '#50231D',
      sidebarText: '#FBF8F3',
      headerBg: '#50231D',
      headerText: '#ffffff',
      badgeBg: '#E8D1A7',
      badgeText: '#50231D',
      border: '#ebdcc5'
    }
  },
  {
    id: 'claro_ouro',
    name: 'Claro & Suave com Cores Vibrantes',
    subtitle: 'Paleta Solar (#3F3F3D / #985B4A / #DBA159 / #778489 / #F2E8DF)',
    description: 'Visual claro, suave e contemporâneo com destaque para ouro vibrante solar, ardósia mineral e linho claro.',
    swatches: ['#3F3F3D', '#985B4A', '#9C7A4E', '#DBA159', '#778489', '#9AA8A4', '#F2E8DF'],
    colors: {
      primary: '#3F3F3D',
      primaryHover: '#2a2a29',
      secondary: '#985B4A',
      accent: '#DBA159',
      canvas: '#F9F6F0',
      surface: '#ffffff',
      sidebarBg: '#3F3F3D',
      sidebarText: '#F2E8DF',
      headerBg: '#3F3F3D',
      headerText: '#ffffff',
      badgeBg: '#faebd7',
      badgeText: '#985B4A',
      border: '#e4dcd3'
    }
  }
];

export const initialAuthUsers: AuthUser[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    name: 'Administrador',
    email: 'admin@gestaopro.com.br',
    role: 'admin',
    roleBadge: 'Administrador Geral',
    employeeId: 'emp-admin'
  }
];

// ============================================================================
// DADOS FICTÍCIOS DE EXEMPLO - GOOGLE AGENDA & COMPROMISSOS DA EMPRESA
// ============================================================================

const formatOffsetDate = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const createSampleAppointments = (): CompanyAppointment[] => [
  {
    id: 'apt-sample-1',
    title: 'Visita Técnica: Diagnóstico Aquecedor Solar e Medição de Telhado',
    type: 'visita_tecnica',
    description: 'Vistoria técnica de diagnóstico no condomínio Quinta da Baroneza. Cliente relatou queda de temperatura nos coletores de vidro a vácuo e barulho no pressurizador pós-boiler.',
    startDate: formatOffsetDate(0), // Hoje
    startTime: '09:00',
    endDate: formatOffsetDate(0),
    endTime: '11:30',
    clientId: 'cli-sample-roberto',
    clientName: 'Roberto Carlos de Lima',
    serviceOrderId: 'os-sample-101',
    serviceOrderCode: 'OS-2026-101',
    employeeId: 'emp-ricardo',
    employeeName: 'Ricardo Silveira (Técnico Solar)',
    location: 'Alameda dos Jacarandás, 450 - Cond. Quinta da Baroneza, Bragança Paulista - SP',
    status: 'confirmado',
    isSyncedWithGoogle: false,
    isSample: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'apt-sample-2',
    title: 'Serviço: Troca de Areia Especial do Filtro Dancor 75kg e Selo Mecânico',
    type: 'servico',
    description: 'Substituição completa do leito filtrante de areia especial, desobstrução das crepinas e troca do selo mecânico da bomba autoescorvante.',
    startDate: formatOffsetDate(1), // Amanhã
    startTime: '13:30',
    endDate: formatOffsetDate(1),
    endTime: '16:30',
    clientId: 'cli-sample-mariana',
    clientName: 'Mariana Souza',
    serviceOrderId: 'os-sample-102',
    serviceOrderCode: 'OS-2026-102',
    employeeId: 'emp-marcos',
    employeeName: 'Marcos Pereira (Técnico Piscinas)',
    location: 'Rua das Palmeiras, 112 - Residencial Alphaville 2, Campinas - SP',
    status: 'agendado',
    isSyncedWithGoogle: false,
    isSample: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'apt-sample-3',
    title: 'Compromisso da Empresa: Reunião Mensal com Fornecedores TermoMax & Henrimar',
    type: 'compromisso',
    description: 'Reunião de alinhamento estratégico para negociação de descontos na tabela de atacado para bombas de calor e boilers solares em inox 316.',
    startDate: formatOffsetDate(2), // Em 2 dias
    startTime: '10:00',
    endDate: formatOffsetDate(2),
    endTime: '11:45',
    employeeId: 'usr-admin',
    employeeName: 'Administrador Geral / Diretoria',
    location: 'Sala de Reuniões MP Piscinas & Aquecedores - Unidade Central',
    status: 'confirmado',
    isSyncedWithGoogle: false,
    isSample: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'apt-sample-4',
    title: 'Visita Técnica: Teste Hidrostático e Detecção de Infiltração em Piscina',
    type: 'visita_tecnica',
    description: 'Teste com corante fluorescente e detecção acústica em tubulação de retorno e ralo de fundo. Avaliação de perda d\'água de 60m³.',
    startDate: formatOffsetDate(3),
    startTime: '14:00',
    endDate: formatOffsetDate(3),
    endTime: '16:30',
    clientId: 'cli-sample-marcelo',
    clientName: 'Dr. Marcelo Prado',
    employeeId: 'emp-ricardo',
    employeeName: 'Ricardo Silveira (Técnico Solar)',
    location: 'Rodovia das Colinas, Km 14 - Chácara Santa Maria, Atibaia - SP',
    status: 'agendado',
    isSyncedWithGoogle: false,
    isSample: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'apt-sample-5',
    title: 'Serviço: Instalação de Painel de Automação Wi-Fi Tholz & Iluminação LED',
    type: 'servico',
    description: 'Instalação de quadro elétrico de comando com módulo Wi-Fi Tholz para acionamento remoto de cascata, hidro e troca de cores dos refletores LED RGB.',
    startDate: formatOffsetDate(-1), // Ontem
    startTime: '08:30',
    endDate: formatOffsetDate(-1),
    endTime: '12:00',
    clientId: 'cli-sample-amanda',
    clientName: 'Amanda Ribeiro',
    serviceOrderId: 'os-sample-105',
    serviceOrderCode: 'OS-2026-105',
    employeeId: 'emp-marcos',
    employeeName: 'Marcos Pereira (Técnico Piscinas)',
    location: 'Av. dos Ipês, 88 - Cond. Granja Viana, Cotia - SP',
    status: 'concluido',
    isSyncedWithGoogle: false,
    isSample: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'apt-sample-6',
    title: 'Compromisso da Empresa: Conferência de Estoque Químico & Entrada NF-e',
    type: 'compromisso',
    description: 'Recebimento de carregamento de hipoclorito de cálcio, barrilha leve, sulfato de alumínio e pastilhas de tricloro. Bipagem de códigos e conferência física.',
    startDate: formatOffsetDate(4),
    startTime: '16:00',
    endDate: formatOffsetDate(4),
    endTime: '17:30',
    employeeId: 'usr-admin',
    employeeName: 'Equipe de Almoxarifado / Estoque',
    location: 'Depósito & Galpão Logístico MP Piscinas',
    status: 'agendado',
    isSyncedWithGoogle: false,
    isSample: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'apt-sample-7',
    title: 'Entrega Técnica: Robô Aspirador Automático & Treinamento Operacional',
    type: 'entrega',
    description: 'Entrega do robô limpador de piscina Nautilus, montagem do carrinho de transporte, teste na água e instrução do operador/caseiro para programação de ciclos.',
    startDate: formatOffsetDate(5),
    startTime: '10:30',
    endDate: formatOffsetDate(5),
    endTime: '12:00',
    clientId: 'cli-sample-carlos',
    clientName: 'Carlos Eduardo Mendes',
    employeeId: 'emp-ricardo',
    employeeName: 'Ricardo Silveira (Técnico Solar)',
    location: 'Estrada dos Eucaliptos, 330 - Sítio Bela Vista, Jundiaí - SP',
    status: 'agendado',
    isSyncedWithGoogle: false,
    isSample: true,
    createdAt: new Date().toISOString()
  }
];

export const initialAppointments: CompanyAppointment[] = createSampleAppointments();

