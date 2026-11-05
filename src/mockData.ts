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
  AuthUser
} from './types';

// ============================================================================
// DADOS INICIAIS LIMPOS PARA AMBIENTE DE PRODUÇÃO E SERVIDOR WEB
// Todas as listas de exemplo foram removidas para uso real do sistema.
// ============================================================================

export const initialClients: Client[] = [];

export const initialSuppliers: Supplier[] = [];

export const initialProducts: Product[] = [];

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

export const initialSetupCosts: InitialSetupCostItem[] = [];

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
  sequenceSettings: initialSequenceSettings
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
