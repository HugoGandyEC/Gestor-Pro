export type UserRole = 'admin' | 'colaborador' | 'tecnico' | 'contador' | 'cliente' | 'vendedor';

export type ServiceOrderStatus = 
  | 'orcamento_aberto'
  | 'aguardando_aprovacao'
  | 'aprovada_em_andamento'
  | 'aguardando_pecas'
  | 'concluida_aguardando_retirada'
  | 'entregue_finalizada'
  | 'cancelada';

export type PaymentMethod = 
  | 'pix' 
  | 'cartao_credito' 
  | 'cartao_debito' 
  | 'boleto' 
  | 'dinheiro' 
  | 'faturado_30d';

export type CardBrand = 'visa' | 'mastercard' | 'elo' | 'hipercard' | 'outra';

export type FeeAbsorptionMode = 'assumir' | 'repassar';

export interface OperatorInstallmentRate {
  installment: number; // 1 a 12
  rate: number; // taxa % (ex: 3.19, 3.79...)
  absorptionMode: FeeAbsorptionMode; // 'assumir' (empresa assume taxa) | 'repassar' (repassado ao cliente com juros)
}

export interface CardOperator {
  id: string;
  name: string; // Ex: 'PagBank (PagSeguro UOL)', 'Cielo', 'Stone', 'Rede', 'Mercado Pago'
  code: string; // 'pagbank', 'cielo', 'stone', 'rede', 'mercadopago', 'outro'
  cnpj?: string;
  type?: 'maquininha' | 'gateway_online' | 'link_pagamento' | 'tef';
  active: boolean;
  settlementTermDays: number; // Prazo de repasse (ex: 1 dia útil D+1, D+14, D+30)
  pixRate: number; // Taxa de Pix (%)
  debitRate: number; // Taxa de Débito (%)
  creditSightRate: number; // Crédito à Vista (1x) (%)
  creditInstallments2to6Rate: number; // Crédito Parcelado (2x a 6x) (%)
  creditInstallments7to12Rate: number; // Crédito Parcelado (7x a 12x) (%)
  anticipationRate?: number; // Taxa de antecipação opcional (%)
  acceptedBrands: string[]; // ['Visa', 'Mastercard', 'Elo', 'Hipercard', 'Amex']
  installmentRates?: OperatorInstallmentRate[]; // Lista customizada de 1x a 12x com taxas e assumir/repassar
  defaultAbsorptionMode?: FeeAbsorptionMode;
  integration?: {
    enabled: boolean;
    environment: 'sandbox' | 'production';
    apiToken: string;
    publicKey?: string;
    webhookUrl: string;
    webhookSecret?: string;
    autoReconcile: boolean; // Baixa automática
    lastSyncAt?: string;
    status: 'connected' | 'error' | 'disconnected';
    autoNotifyClientWhatsapp?: boolean;
  };
  notes?: string;
  createdAt: string;
}

export interface PagBankTransaction {
  id: string;
  transactionCode: string; // Ex: 'PAG-2025020327-01'
  operatorId: string;
  orderId?: string; // ID da OS
  orderCode?: string; // Ex: '2025020327'
  saleId?: string;
  clientName: string;
  paymentMethod: 'cartao_credito' | 'cartao_debito' | 'pix' | 'boleto';
  installments: number;
  brand?: string;
  grossAmount: number; // Valor Bruto
  feePercentage: number; // % Taxa retida pela operadora
  feeAmount: number; // R$ Taxa retida
  netAmount: number; // R$ Líquido Creditado na conta
  status: 'PAID' | 'WAITING' | 'CANCELLED';
  paidAt: string;
  reconciled: boolean; // Baixado automaticamente
  reconciledAt?: string;
  nsu?: string;
  authorizationCode?: string;
}

export interface CardMachineRate {
  brand: CardBrand;
  debitRate: number; // %
  creditSightRate: number; // % (1x)
  creditInstallmentsRate: number; // % (2x a 12x)
}

export interface PaymentSplit {
  id: string;
  method: PaymentMethod;
  cardBrand?: CardBrand;
  operatorId?: string;
  installments?: number;
  ratePercentage?: number;
  rateAmount?: number;
  absorptionMode?: FeeAbsorptionMode; // 'assumir' | 'repassar'
  amount: number; // Valor bruto pago pelo cliente (inclui acréscimo se for repassado)
  netAmount: number; // Valor líquido recebido pela empresa após taxa de cartão
}

export type ExpenseCategory = 
  | 'gasolina' 
  | 'aluguel' 
  | 'internet' 
  | 'celular' 
  | 'alimentacao' 
  | 'troca_oleo' 
  | 'pastilhas_freio' 
  | 'ipva' 
  | 'seguro' 
  | 'pneus' 
  | 'manutencao_veiculo' 
  | 'salario' 
  | 'energia_agua' 
  | 'ferramental' 
  | 'software_contabilidade' 
  | 'compra_produtos_xml' 
  | 'impostos' 
  | 'outros';

export interface ClientAddress {
  id: string;
  title: string; // Ex: 'Sede Principal', 'Filial 01', 'Obra Residencial Alphaville', 'Residência', 'Casa de Campo', 'Depósito / Entrega'
  isDefault?: boolean;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  referencePoint?: string;
}

export interface Client {
  id: string;
  personType?: 'PF' | 'PJ';
  name: string;
  tradeName?: string;
  document: string; // CPF ou CNPJ
  rg?: string; // Campo RG para Pessoa Física
  stateRegistration?: string; // Inscrição Estadual para Pessoa Jurídica
  contactPerson?: string; // Nome de contato / Responsável
  birthDate?: string; // Data de nascimento (Pessoa Física)
  email: string;
  phone: string;
  secondaryPhone?: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  addresses?: ClientAddress[]; // Múltiplos endereços com títulos de referência
  createdAt: string;
  notes?: string;
  portalUsername?: string; // Usuário de login do portal do cliente
  portalPassword?: string; // Senha de acesso ao portal do cliente
}

export interface Supplier {
  id: string;
  name: string;
  tradeName?: string;
  cnpj: string;
  email: string;
  phone: string;
  contactPerson?: string;
  cep: string;
  street: string;
  number: string;
  city: string;
  state: string;
  notes?: string;
}

export interface Product {
  id: string;
  code: string;
  sku?: string;
  barcode?: string; // Código de barras (EAN-13 / GTIN)
  name: string;
  model?: string; // Modelo do produto
  date?: string; // Data de fabricação / aquisição / cadastro
  serialNumber?: string; // Número de série
  category: string; // 'Reservatórios Térmicos', 'Bombas e Motores', 'Tubulações e Conexões', 'Insumos Elétricos', 'Peças Gerais'
  costPrice: number;
  profitMarginPercent?: number; // Margem de lucro em %
  retailPrice: number; // Venda Varejo
  wholesalePrice: number; // Venda Atacado
  currentStock: number;
  minStock: number;
  unit: string; // UN, PC, M, L, KG
  ncm: string;
  icmsRate: number; // %
  pisRate: number; // %
  cofinsRate: number; // %
  description?: string; // Descrição detalhada / Ficha técnica
  photos?: string[]; // Até 3 fotos do produto
}

export interface ParsedXmlItem {
  id: string; // ID temporário para o staging
  code: string;
  name: string;
  ncm: string;
  quantity: number;
  unit: string;
  costPrice: number; // vUnCom na nota
  totalCost: number; // vProd na nota
  category: string;
  // Margens e preços editáveis
  retailMarginPercent: number; // Margem de lucro Varejo (%)
  retailPrice: number; // Preço Venda Varejo (R$)
  updateRetailPrice: boolean; // Confirmação se atualiza preço na tabela de varejo
  wholesaleMarginPercent: number; // Margem de lucro Atacadista (%)
  wholesalePrice: number; // Preço Venda Atacado (R$)
  updateWholesalePrice: boolean; // Confirmação se atualiza preço na tabela atacadista
  updateStock: boolean; // Confirmação se atualiza a quantidade em estoque
  // Comparação com produto já existente
  isNewProduct: boolean;
  existingProductId?: string;
  existingCurrentStock?: number;
  existingRetailPrice?: number;
  existingWholesalePrice?: number;
}

export interface ParsedXmlSupplier {
  cnpj: string;
  name: string;
  tradeName?: string;
  phone?: string;
  email?: string;
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  isAlreadyRegistered: boolean;
  existingSupplierId?: string;
  registerIfNew: boolean;
}

export interface ParsedXmlNFe {
  nNF: string;
  emissionDate: string;
  totalValue: number;
  supplier: ParsedXmlSupplier;
  items: ParsedXmlItem[];
  createAccountPayable: boolean;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'entrada_xml' | 'entrada_manual' | 'saida_os' | 'saida_venda' | 'ajuste';
  quantity: number;
  unitCost: number;
  date: string;
  referenceDoc?: string; // Ex: NFe 18923 ou OS-2026-104
  notes?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  baseSalary: number; // Salário base mensal
  benefitsCharges: number; // Encargos trabalhistas (INSS, FGTS, VR, VT)
  commissionRate: number; // % comissão sobre serviços (ex: 8%)
  assignedVehicleId?: string; // Veículo fixo da empresa alocado
  status: 'Ativo' | 'Férias' | 'Inativo';
  admissionDate: string;
}

export interface Vehicle {
  id: string;
  model: string;
  brand?: string;
  plate: string;
  year: number;
  currentKm: number;
  assignedEmployeeId?: string;
  status: 'Operacional' | 'Em Manutenção' | 'Reserva';
  nextOilChangeKm: number;
  annualIpvaValue: number;
  annualInsuranceValue: number;
}

export interface VehicleMaintenance {
  id: string;
  vehicleId: string;
  employeeId?: string;
  category: 'troca_oleo' | 'pastilhas_freio' | 'ipva' | 'seguro' | 'combustivel' | 'pneus' | 'manutencao_veiculo';
  description: string;
  cost: number;
  date: string;
  kmAtService?: number;
  litersFuel?: number;
  workshopOrSupplier: string;
  paymentMethod: PaymentMethod;
}

export interface GeneralExpense {
  id: string;
  category: ExpenseCategory;
  description: string;
  cost: number;
  dueDate: string;
  paymentDate?: string;
  isPaid: boolean;
  employeeId?: string;
  vehicleId?: string;
  supplierId?: string;
  supplier: string;
  invoiceNumber?: string;
  isRecurring: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  hours?: number;
  price: number;
}

export interface PartItem {
  id: string;
  productId?: string;
  name: string;
  cost: number; // Preço de custo
  price: number; // Preço de venda
  quantity: number;
  unit?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  category: 'Estrutura e Tanque' | 'Elétrica e Comando' | 'Hidráulica e Pressão' | 'Acessórios e Segurança';
  status: 'ok' | 'defeito' | 'nao_aplicavel';
  notes?: string;
  photos?: string[];
  suggestedPartName?: string;
  suggestedPartPrice?: number;
}

export interface DigitalSignature {
  signatureDataUrl: string;
  signedByName: string;
  signedByDocument: string;
  signedAt: string;
}

export interface ServiceOrder {
  id: string;
  code: string; // Ex: OS-2026-104
  clientId: string;
  clientName: string;
  clientDocument: string;
  clientPhone: string;
  clientAddress: string;
  employeeId: string; // Técnico / Responsável
  vehicleId?: string; // Veículo utilizado
  kmDriven: number;
  status: ServiceOrderStatus;
  openDate: string;
  forecastDate: string;
  completionDate?: string;
  
  // Equipamento & Garantia
  equipmentType?: string; // ex: 'Reservatório Térmico Solar 600L', 'Bomba Centrífuga Trifásica'
  equipmentModel?: string;
  equipmentSerial?: string;
  equipmentYear?: string;
  warrantyPeriodDays: number; // ex: 90 dias, 365 dias
  warrantyExpiresAt?: string;
  // Tipo de Ordem
  type?: 'servico' | 'venda' | 'servico_e_venda' | 'orcamento';
  warranty?: string;
  warrantyTerms?: string;

  description: string;
  visitFee: number; // Taxa de visita técnica (R$)
  services: ServiceItem[];
  parts: PartItem[];
  
  // Descontos flexíveis
  discountType: 'fixed' | 'percent';
  discountValue: number; // R$ ou %
  calculatedDiscount: number; // R$
  
  // Múltiplas formas de pagamento
  paymentMethod: PaymentMethod; // Padrão principal
  payments: PaymentSplit[];
  paymentStatus: 'pendente' | 'pago';

  // Checklist inteligente com fotos de entrada e saída
  checklists: ChecklistItem[];
  entryPhotos: string[];
  exitPhotos: string[];

  // Assinatura digital em tela touch
  signature?: DigitalSignature;

  notes?: string;
}

export interface SaleItem {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  cost: number;
  price: number;
  unit?: string;
}

export interface DirectSale {
  id: string;
  code: string;
  clientId?: string;
  clientName: string;
  employeeId: string;
  date: string;
  priceType: 'varejo' | 'atacado';
  items: SaleItem[];
  discountType: 'fixed' | 'percent';
  discountValue: number;
  calculatedDiscount: number;
  total: number;
  paymentMethod: PaymentMethod;
  payments: PaymentSplit[];
  paymentStatus: 'pendente' | 'pago';
}

export interface CustomerPortalTicket {
  id: string;
  clientId: string;
  clientName: string;
  serviceOrderId?: string;
  equipmentSerial?: string;
  type: 'chamado_tecnico' | 'acionamento_garantia';
  subject: string;
  description: string;
  status: 'aberto' | 'em_analise' | 'visita_agendada' | 'concluido';
  createdAt: string;
  priority: 'baixa' | 'normal' | 'alta' | 'urgente';
  scheduledDate?: string;
}

export interface InitialSetupCostItem {
  id: string;
  category: string;
  name: string;
  estimatedCost: number;
  actualCost: number;
  status: 'planejado' | 'adquirido';
  date: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
}

export interface EmployeeProfitabilityReport {
  employee: Employee;
  monthYear: string;
  ordersCount: number;
  servicesRevenue: number;
  partsRevenue: number;
  directSalesRevenue: number;
  visitFeesRevenue: number;
  totalRevenue: number;
  partsCost: number;
  grossContribution: number;
  baseSalary: number;
  benefitsCharges: number;
  commissionEarned: number;
  totalPersonnelCost: number;
  fuelCost: number;
  mealsCost: number;
  vehicleDirectMaintenanceCost: number;
  vehicleProratedFixedCost: number;
  cellphoneCost: number;
  totalDirectCosts: number;
  netProfit: number;
  netMarginPercent: number;
  roiMultiplier: number;
  performanceTier: 'Excelente' | 'Bom' | 'Atenção' | 'Prejuízo';
}

export interface SequenceSettings {
  serviceOrderNextNumber: number; // Próximo número sequencial de OS (ex: 2025020328 ou 105)
  serviceOrderPrefix: string; // Prefixo (ex: 'OS-' ou '')
  serviceOrderDigits: number; // Quantidade de dígitos com zeros à esquerda (ex: 0 ou 4)
  saleNextNumber: number; // Próximo número de Venda Direta (ex: 1001)
  salePrefix: string; // Prefixo (ex: 'VD-')
  saleDigits?: number; // Quantidade de dígitos com zeros à esquerda
  budgetNextNumber: number; // Próximo número de Orçamento (ex: 501)
  budgetPrefix: string; // Prefixo (ex: 'ORC-')
  budgetDigits?: number; // Quantidade de dígitos com zeros à esquerda
}

export interface WarrantyPolicy {
  id: string;
  name: string; // Ex: 'Garantia Padrão Serviços 90 Dias', 'Garantia Especial Boiler Solar 365 Dias'
  days: number; // Prazo em dias (ex: 90, 180, 365, 730)
  category: string; // 'Manutenção e Peças', 'Instalação Solar & Boilers', 'Bombas e Filtros', 'Estrutura Hidráulica'
  isDefault?: boolean;
  terms: string; // Texto legal completo dos termos e regras de garantia
  linkedServiceIds: string[]; // IDs dos serviços do catálogo atrelados a esta garantia
  createdAt: string;
}

export interface CompanySettings {
  companyName: string;
  tradeName: string;
  cnpj: string;
  ie: string;
  im: string;
  phone: string;
  email: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  taxRegime: 'simples_nacional' | 'lucro_presumido' | 'lucro_real' | 'mei';
  defaultWarrantyTerms: string;
  fiscalEnvironment: 'homologacao' | 'producao';
  standardVisitFee: number;
  sequenceSettings?: SequenceSettings;
}

export interface ServiceCatalogItem {
  id: string;
  code: string;
  name: string;
  category: string;
  defaultHours: number;
  standardPrice: number;
  minPrice: number;
}

export interface ChecklistTemplate {
  id: string;
  title: string;
  equipmentType: string;
  items: { id: string; label: string; category: ChecklistItem['category']; required: boolean }[];
}

export type AppTheme = 'classico' | 'terra_oliva' | 'claro_ouro';

export interface ThemeDefinition {
  id: AppTheme;
  name: string;
  subtitle: string;
  description: string;
  swatches: string[];
  colors: {
    primary: string;
    primaryHover: string;
    secondary: string;
    accent: string;
    canvas: string;
    surface: string;
    sidebarBg: string;
    sidebarText: string;
    headerBg: string;
    headerText: string;
    badgeBg: string;
    badgeText: string;
    border: string;
  };
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  roleBadge: string;
  avatar?: string;
  clientId?: string; // ID do cliente vinculado para isolamento de dados no Portal do Cliente (Multi-Tenancy)
  employeeId?: string; // ID do técnico/funcionário vinculado para isolamento de atendimentos (RBAC)
}
