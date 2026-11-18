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

export const initialEmployees: Employee[] = [];

export const initialVehicles: Vehicle[] = [];

export const initialVehicleExpenses: VehicleMaintenance[] = [];

export const initialGeneralExpenses: GeneralExpense[] = [];

export const initialServiceOrders: ServiceOrder[] = [];

export const initialDirectSales: DirectSale[] = [];

export const initialSetupCosts: InitialSetupCostItem[] = [];

export const initialCustomerTickets: CustomerPortalTicket[] = [];

export const initialAuditLogs: AuditLog[] = [];

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
  companyName: 'FIRE GESTÃO - Assistência Técnica & Vendas',
  tradeName: 'FIRE GESTÃO',
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
  logoUrl: '',
  pdvDeletePassword: ''
};

export const initialServiceCatalog: ServiceCatalogItem[] = [];

export const initialChecklistTemplates: ChecklistTemplate[] = [];

export const themeDefinitions: ThemeDefinition[] = [
  {
    id: 'fire_gestao',
    name: 'Fire Gestão · Chama Alegre',
    subtitle: 'Laranja Chama, Amarelo Solar, Verde Petróleo & Menta',
    description:
      'Paleta oficial inspirada no favicon do FIRE GESTÃO: combina laranja vibrante (#EA580C) e amarelo solar alegre (#FACC15 / #F59E0B) com tons harmoniosos de verde petróleo (#0D9488), esmeralda (#059669), grafite quente (#231914) e fundo marfim suave (#FAF7F2) para conforto visual durante todo o expediente.',
    swatches: ['#EA580C', '#F59E0B', '#FACC15', '#0D9488', '#059669', '#231914', '#FAF7F2'],
    colors: {
      primary: '#EA580C',
      primaryHover: '#C2410C',
      secondary: '#F59E0B',
      accent: '#0D9488',
      canvas: '#FAF7F2',
      surface: '#ffffff',
      sidebarBg: '#231914',
      sidebarText: '#FEF3C7',
      headerBg: '#ffffff',
      headerText: '#1C1917',
      badgeBg: '#FFF3E0',
      badgeText: '#C2410C',
      border: '#EDE4D8'
    }
  },
  {
    id: 'solar_vivido',
    name: 'Azul Cobalto',
    subtitle: 'Azul Profissional, Celeste, Esmeralda & Canvas Limpo',
    description:
      'Tema azul clássico e agradável para uso diário: azul cobalto dinâmico (#1D4ED8), menu lateral azul-marinho profundo (#0F172A), detalhes em azul celeste (#0EA5E9), verde esmeralda (#10B981) e fundo neutro claro (#F8FAFC).',
    swatches: ['#1D4ED8', '#0EA5E9', '#0F172A', '#10B981', '#F59E0B', '#F8FAFC'],
    colors: {
      primary: '#1D4ED8',
      primaryHover: '#1E40AF',
      secondary: '#0EA5E9',
      accent: '#10B981',
      canvas: '#F8FAFC',
      surface: '#ffffff',
      sidebarBg: '#0F172A',
      sidebarText: '#F8FAFC',
      headerBg: '#ffffff',
      headerText: '#0F172A',
      badgeBg: '#EFF6FF',
      badgeText: '#1D4ED8',
      border: '#E2E8F0'
    }
  }
];

export const initialAuthUsers: AuthUser[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    name: 'Administrador',
    email: 'admin@firegestao.com.br',
    active: true,
    role: 'admin',
    roleBadge: 'Administrador Geral'
  }
];

// ============================================================================
// GOOGLE AGENDA & COMPROMISSOS DA EMPRESA (BASE LIMPA PARA USO REAL)
// ============================================================================

export const initialAppointments: CompanyAppointment[] = [];
