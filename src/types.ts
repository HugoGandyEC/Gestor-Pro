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
    clientId?: string;
    clientSecret?: string;
    apiToken: string;
    publicKey?: string;
    webhookUrl: string;
    webhookSecret?: string;
    posTerminalSerials?: string[]; // Seriais das maquininhas POS associadas
    autoReconcile: boolean; // Baixa automática
    lastSyncAt?: string;
    status: 'connected' | 'error' | 'disconnected' | 'testing';
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

export type PaymentEntryType = 'vista' | 'entrada' | 'parcela';
export type PaymentSplitStatus = 'pendente' | 'pago';

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
  entryType?: PaymentEntryType; // 'vista' | 'entrada' | 'parcela'
  installmentNumber?: number;
  totalInstallments?: number;
  dueDate?: string; // YYYY-MM-DD (data de vencimento ou data prevista)
  paidAt?: string; // YYYY-MM-DD (data específica do pagamento)
  status?: PaymentSplitStatus; // 'pendente' | 'pago'
  notes?: string;
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
  | 'compra_materiais'
  | 'comissao'
  | 'impostos' 
  | 'funcionario_fichado'
  | 'combustivel'
  | 'seguro_veiculo'
  | 'impostos_carro'
  | 'aluguel_loja'
  | 'das_mei'
  | 'divida_empresa'
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

export type CustomerType = 'varejo' | 'atacado';

export interface Client {
  id: string;
  personType?: 'PF' | 'PJ';
  customerType?: CustomerType; // Perfil comercial: Varejo (padrão) ou Atacado
  name: string;
  tradeName?: string;
  document: string; // CPF ou CNPJ (Opcional - pode ser vazio "")
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
  brand?: string; // Marca do produto
  slug?: string; // URL amigável (slug SEO)
  tags?: string[]; // Tags / palavras-chave
  metaTitle?: string; // Meta título para SEO
  metaDescription?: string; // Meta descrição para SEO
  metaKeywords?: string; // Meta tags / palavras-chave
  model?: string; // Modelo do produto
  date?: string; // Data de fabricação / aquisição / cadastro
  serialNumber?: string; // Número de série
  category: string; // Categoria do produto
  subcategory?: string; // Subcategoria do produto
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

export type ImportItemAction = 'link_existing' | 'create_new' | 'ignore';

export type ImportMatchSource =
  | 'barcode'
  | 'supplier_mapping'
  | 'code_exact'
  | 'similarity'
  | 'manual'
  | 'none';

export type ImportAllocationMode =
  | 'proportional_value'
  | 'proportional_qty'
  | 'financial_only';

export type ImportCostUpdateMode =
  | 'effective_unit'
  | 'weighted_average'
  | 'keep_current';

export type ImportFinancialMode = 'none' | 'create_new' | 'link_existing';

export interface ProductMatchSuggestion {
  productId: string;
  score: number; // 0..100
  reason: Exclude<ImportMatchSource, 'manual' | 'none'>;
}

export interface SupplierProductMapping {
  id: string;
  supplierKey: string; // Normalizado a partir de CNPJ ou Nome do Fornecedor
  supplierId?: string;
  supplierCnpj?: string;
  supplierName: string;
  supplierItemCode: string;
  supplierItemDescription: string;
  supplierItemKey: string; // Normalizado: supplierKey + code ou supplierKey + desc
  productId: string;
  conversionFactor: number; // Quantas unidades do estoque = 1 unidade do fornecedor
  supplierUnit: string;
  stockUnit: string;
  updatedAt: string;
}

export interface ImportFinancialInstallment {
  id: string;
  number: string; // Ex: '001', '1/3', 'À Vista'
  dueDate: string; // YYYY-MM-DD
  amount: number;
}

export interface StockImportRecord {
  id: string;
  source: 'nfe_xml' | 'universal_import';
  referenceCode: string; // Ex: 'NF-e 45231' ou nome do arquivo
  supplierId?: string;
  supplierName: string;
  supplierCnpj?: string;
  emissionDate: string;
  importedAt: string;
  itemsCount: number;
  linkedCount: number;
  createdCount: number;
  ignoredCount: number;
  productsTotal: number;
  freightTotal: number;
  insuranceTotal: number;
  otherExpensesTotal: number;
  discountTotal: number;
  grandTotal: number;
  allocationMode: ImportAllocationMode;
  costUpdateMode: ImportCostUpdateMode;
  financialMode: ImportFinancialMode;
  linkedExpenseIds: string[];
}

export interface ParsedXmlItem {
  id: string; // ID temporário para o staging
  selectedToImport?: boolean; // Mantido por retrocompatibilidade (sincronizado com action !== 'ignore')
  action: ImportItemAction; // 'link_existing' | 'create_new' | 'ignore'
  code: string;
  barcode?: string; // cEAN / cEANTrib extraído da NF-e ou planilha
  brand?: string;
  subcategory?: string;
  name: string; // Descrição do fornecedor (nunca sobrescreve o nome padrão ao vincular)
  ncm: string;
  quantity: number; // Quantidade na unidade do fornecedor (qCom)
  unit: string; // Unidade do fornecedor (uCom, ex: CX, FD, PCT, UN)
  stockUnit: string; // Unidade do estoque (ex: UN, M, KG)
  conversionFactor: number; // Qtd de unidades do estoque por 1 unidade do fornecedor (padrão 1, aceita decimais)
  costPrice: number; // vUnCom na nota (na unidade do fornecedor)
  totalCost: number; // vProd na nota (valor bruto do item)
  // Valores acessórios originais do item na NF-e (quando informados)
  itemFreight?: number;
  itemInsurance?: number;
  itemOtherExpenses?: number;
  itemDiscount?: number;
  // Valores calculados em tempo real (preenchidos pelo motor de rateio/conversão)
  allocatedFreight?: number;
  allocatedInsurance?: number;
  allocatedOtherExpenses?: number;
  allocatedDiscount?: number;
  effectiveTotal?: number; // Valor líquido/efetivo do item após rateio
  convertedQuantity?: number; // quantity * conversionFactor
  effectiveUnitCost?: number; // effectiveTotal / convertedQuantity (na unidade do estoque)
  category: string;
  // Margens e preços editáveis (baseados no custo efetivo convertido na unidade do estoque)
  retailMarginPercent: number; // Margem de lucro Varejo (%)
  retailPrice: number; // Preço Venda Varejo (R$)
  updateRetailPrice: boolean; // Confirmação se atualiza preço na tabela de varejo
  wholesaleMarginPercent: number; // Margem de lucro Atacadista (%)
  wholesalePrice: number; // Preço Venda Atacado (R$)
  updateWholesalePrice: boolean; // Confirmação se atualiza preço na tabela atacadista
  updateStock: boolean; // Confirmação se atualiza a quantidade em estoque
  // Comparação e De-Para com produto já existente
  isNewProduct: boolean;
  existingProductId?: string;
  existingCurrentStock?: number;
  existingCostPrice?: number;
  existingRetailPrice?: number;
  existingWholesalePrice?: number;
  matchSource?: ImportMatchSource;
  suggestedMatches?: ProductMatchSuggestion[];
  memorizedMappingId?: string;
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
  serie?: string;
  chNFe?: string;
  emissionDate: string;
  // Totais extraídos de <total>/<ICMSTot> e ajustáveis manualmente
  productsTotal: number; // vProd
  freightTotal: number; // vFrete
  insuranceTotal: number; // vSeg
  otherExpensesTotal: number; // vOutro
  discountTotal: number; // vDesc
  totalValue: number; // vNF / Valor Total da Compra
  xmlOriginalTotalValue?: number; // vNF original do XML para conferência
  // Regras globais da importação
  allocationMode: ImportAllocationMode;
  costUpdateMode: ImportCostUpdateMode;
  supplier: ParsedXmlSupplier;
  items: ParsedXmlItem[];
  importProducts?: boolean; // Se true, cadastra/atualiza produtos selecionados
  // Integração financeira seletiva (padrão 'none')
  createAccountPayable: boolean; // Retrocompatibilidade (true quando financialMode === 'create_new')
  financialMode: ImportFinancialMode;
  installments: ImportFinancialInstallment[];
  xmlHasDuplicates?: boolean;
  paymentMethod?: PaymentMethod;
  xmlPaymentCode?: string;
  expenseCategory?: ExpenseCategory;
  initialPaymentStatus?: 'pendente' | 'pago';
  linkedExpenseId?: string;
}

export interface SelectiveBackupImportOptions {
  products?: boolean;
  stockMovements?: boolean;
  clients?: boolean;
  suppliers?: boolean;
  employees?: boolean;
  serviceOrders?: boolean;
  directSales?: boolean;
  financial?: boolean; // Despesas / Contas a Pagar + Custos Iniciais
  fleet?: boolean;     // Veículos + Manutenções de Frota
  appointments?: boolean;
  settings?: boolean;  // Empresa, Numerações, Garantias, Taxas de Cartão, Serviços e Checklists
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
  importRecordId?: string;
  supplierUnit?: string;
  conversionFactor?: number;
  supplierQuantity?: number;
}

export type EmployeeRemunerationType =
  | 'salario'
  | 'hora_trabalhada'
  | 'comissao'
  | 'salario_comissao'
  | 'hora_comissao';

export interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  remunerationType?: EmployeeRemunerationType; // Forma de remuneração: salário, hora trabalhada, comissão ou combinados
  baseSalary: number; // Salário base mensal
  hourlyRate?: number; // Valor da hora trabalhada (R$/h)
  monthlyHoursWorked?: number; // Horas trabalhadas no mês
  benefitsCharges: number; // Encargos trabalhistas (INSS, FGTS, VR, VT)
  commissionRate: number; // % comissão sobre serviços/vendas (ex: 8%)
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
  paymentMethod?: PaymentMethod;
  emissionDate?: string;
  installmentLabel?: string;
  linkedStockImportId?: string;
  linkedStockImportRef?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  hours?: number;
  price: number;
  isCustom?: boolean; // true para serviços avulsos (não cadastrados no catálogo)
  serviceId?: string; // ID do serviço caso selecionado do catálogo
  category?: string;
  checklistTemplateId?: string;
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
  serviceName?: string; // Serviço vinculado
  serviceId?: string;
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
  clientDocument?: string;
  clientPhone: string;
  clientAddress: string;
  employeeId: string; // Técnico / Responsável
  vehicleId?: string; // Veículo utilizado
  kmDriven: number;
  status: ServiceOrderStatus;
  contractReference?: string; // Referência do contrato vinculado (opcional, caso exista)
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

  // Rastreamento PDV / Caixa
  pdvTerminal?: string;
  sentToPdvAt?: string;
  settledInPdvAt?: string;
  pdvSessionId?: string;

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
  status?: 'ativa' | 'cancelada';
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  pdvTerminal?: string;
  sentToPdvAt?: string;
  settledInPdvAt?: string;
  pdvSessionId?: string;
}

// ============================================================================
// PDV / FRENTE DE CAIXA
// ============================================================================

export type CashRegisterStatus = 'aberto' | 'fechado';

export type CashMovementType =
  | 'abertura'
  | 'recebimento_venda'
  | 'recebimento_os'
  | 'suprimento'
  | 'sangria'
  | 'fechamento';

export interface CashRegisterSession {
  id: string;
  code: string; // Ex: CX-2026-001
  terminalName: string;
  operatorId: string;
  operatorName: string;
  openedAt: string;
  closedAt?: string;
  openingBalance: number;
  expectedCashBalance?: number;
  closingBalance?: number;
  differenceAmount?: number;
  status: CashRegisterStatus;
  notes?: string;
}

export interface CashRegisterMovement {
  id: string;
  sessionId: string;
  type: CashMovementType;
  sourceType?: 'venda' | 'os' | 'manual';
  sourceId?: string;
  sourceCode?: string;
  clientId?: string;
  clientName?: string;
  description: string;
  paymentMethod: PaymentMethod;
  payments?: PaymentSplit[];
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  amountReceived?: number;
  changeAmount?: number;
  nsu?: string;
  terminalName?: string;
  operatorName: string;
  createdAt: string;
  cancelled?: boolean;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
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

export type CostRecurrenceType = 'recorrente' | 'parcelado' | 'investimento_unico';

export interface InitialSetupCostItem {
  id: string;
  category: string;
  name: string;
  estimatedCost: number;
  actualCost: number;
  status: 'planejado' | 'adquirido' | 'em_andamento' | 'quitado';
  date: string;
  notes?: string;
  // Recorrência & Dívidas
  costType?: CostRecurrenceType; // 'recorrente' (mensal), 'parcelado' (X parcelas), 'investimento_unico'
  isRecurring?: boolean;
  installmentsCount?: number; // total de parcelas (ex: 12)
  paidInstallments?: number; // parcelas já pagas (ex: 3)
  installmentValue?: number; // valor de cada parcela
  dueDate?: string; // data de vencimento da próxima parcela
  dueDay?: number; // dia fixo do mês (ex: dia 10)
  creditor?: string; // credor / banco / beneficiário / fornecedor
  syncWithGeneralExpenses?: boolean; // sincronizado com contas a pagar
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
  remunerationType?: EmployeeRemunerationType;
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
  logoUrl?: string;
  pdvDeletePassword?: string;
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
  serviceIds?: string[]; // IDs dos múltiplos serviços do catálogo anexados a este modelo
  items: { id: string; label: string; category: ChecklistItem['category']; required: boolean }[];
}

export type AppTheme = 'fire_gestao' | 'solar_vivido';

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
  password?: string;
  active?: boolean;
  role: UserRole;
  roleBadge: string;
  avatar?: string;
  clientId?: string; // ID do cliente vinculado para isolamento de dados no Portal do Cliente (Multi-Tenancy)
  employeeId?: string; // ID do técnico/funcionário vinculado para isolamento de atendimentos (RBAC)
  canDeletePdvSales?: boolean; // Permissão concedida pelo Administrador para autorizar exclusão de vendas no PDV com sua senha
}

// ============================================================================
// GOOGLE AGENDA & AGENDAMENTOS DA EMPRESA
// ============================================================================

export type AppointmentType = 'servico' | 'visita_tecnica' | 'compromisso' | 'entrega';
export type AppointmentStatus = 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';

export interface CompanyAppointment {
  id: string;
  title: string;
  type: AppointmentType;
  description?: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:mm
  clientId?: string;
  clientName?: string;
  serviceOrderId?: string;
  serviceOrderCode?: string;
  employeeId?: string; // Técnico / Responsável
  employeeName?: string;
  location?: string;
  status: AppointmentStatus;
  googleCalendarEventId?: string;
  googleCalendarHtmlLink?: string;
  isSyncedWithGoogle?: boolean;
  isSample?: boolean; // Flag para dados fictícios de exemplo
  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// RECIBOS DE PAGAMENTO AUTOMÁTICOS (PDV / CAIXA / OS / VENDAS)
// ============================================================================

export type PaymentReceiptKind = 'vista' | 'entrada' | 'parcela' | 'parcial' | 'quitacao';

export interface PaymentReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  kind?: 'servico' | 'peca' | 'produto' | 'taxa' | 'desconto';
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string; // Ex: REC-2026-0001
  sourceType: 'os' | 'venda';
  sourceId: string;
  sourceCode: string;
  cashSessionId: string;
  cashSessionCode?: string;
  cashMovementId: string;
  terminalName: string;
  operatorName: string;
  clientId?: string;
  clientName: string;
  clientDocument?: string;
  clientPhone?: string;
  clientAddress?: string;
  items: PaymentReceiptItem[];
  paymentMethod: PaymentMethod;
  payments: PaymentSplit[];
  paymentKind: PaymentReceiptKind;
  orderTotal: number;
  previouslyPaid: number;
  amountPaidNow: number;
  totalPaidAccumulated: number;
  remainingBalance: number;
  isFullyPaid: boolean;
  amountReceived?: number;
  changeAmount?: number;
  nsu?: string;
  notes?: string;
  createdAt: string;
  cancelled?: boolean;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
}


