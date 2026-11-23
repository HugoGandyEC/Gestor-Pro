import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  Employee, 
  Vehicle, 
  VehicleMaintenance, 
  GeneralExpense, 
  ExpenseCategory,
  ServiceOrder, 
  DirectSale,
  InitialSetupCostItem,
  EmployeeProfitabilityReport,
  UserRole,
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
  ParsedXmlItem,
  ParsedXmlSupplier,
  ParsedXmlNFe,
  CardOperator,
  PagBankTransaction,
  SequenceSettings,
  WarrantyPolicy,
  AppTheme,
  ThemeDefinition,
  AuthUser,
  CompanyAppointment,
  CashRegisterSession,
  CashRegisterMovement,
  PaymentMethod,
  PaymentSplit,
  PaymentReceipt,
  PaymentReceiptItem,
  PaymentReceiptKind,
  SelectiveBackupImportOptions,
  SupplierProductMapping,
  StockImportRecord,
  StockImportItemSnapshot,
  StockImportUndoAnalysis,
  ImportFinancialInstallment
} from '../types';
import {
  buildQuickInstallments,
  buildSupplierItemKey,
  buildSupplierKey,
  computeUpdatedProductCost,
  detectProductReconciliation,
  formatQuantityClean,
  mapNFePaymentCodeToMethod,
  recalculateImportItems,
  round2,
  round4,
  sanitizeBarcode
} from '../utils/stockImportHelpers';
import {
  computeEmployeeNominalPay,
  getEmployeeRemunerationType,
  hasEmployeeCommission,
  REMUNERATION_TYPE_LABELS
} from '../utils/employeeRemuneration';
import { 
  initialEmployees, 
  initialVehicles, 
  initialVehicleExpenses, 
  initialGeneralExpenses, 
  initialServiceOrders, 
  initialDirectSales, 
  initialSetupCosts,
  initialClients,
  initialSuppliers,
  initialProducts,
  initialStockMovements,
  initialCardRates,
  initialCardOperators,
  initialPagBankTransactions,
  initialCustomerTickets,
  initialAuditLogs,
  initialCompanySettings,
  initialServiceCatalog,
  initialChecklistTemplates,
  initialSequenceSettings,
  initialWarrantyPolicies,
  themeDefinitions,
  initialAuthUsers,
  initialProductCategories,
  initialProductSubcategories,
  initialProductBrands,
  initialProductTags,
  initialAppointments
} from '../mockData';
import { buildDemoServiceOrdersDataset } from '../data/demoServiceOrdersDataset';
import { 
  canModifyClientData, 
  canModifyServiceOrder, 
  getTenantClientId, 
} from '../security/rbac';
import {
  subscribeToCloudSync,
  syncProductToCloud,
  deleteProductFromCloud,
  syncClientToCloud,
  deleteClientFromCloud,
  syncSupplierToCloud,
  deleteSupplierFromCloud,
  syncOrderToCloud,
  deleteOrderFromCloud,
  syncDirectSaleToCloud,
  deleteDirectSaleFromCloud,
  syncAppointmentToCloud,
  deleteAppointmentFromCloud,
  syncCashSessionToCloud,
  syncCashMovementToCloud,
  deleteCashMovementFromCloud,
  syncPaymentReceiptToCloud,
  deletePaymentReceiptFromCloud,
  bootstrapCloudDatabase,
  testFirestoreConnection,
  clearAllCloudCollections
} from '../services/firestoreSyncService';
import {
  getCurrentMonthYear,
  isActiveEmployee,
  isServiceOrderFinishedForDRE,
  isServiceOrderReceivable,
  computeServiceOrderFinancials,
  computeAbsorbedCardFees,
  computeUnsyncedDebtInstallments,
  isAutoPayrollExpense
} from '../utils/financialHelpers';

interface AppContextType {
  // Auth & Session
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  login: (identifier: string, pass?: string) => { success: boolean; message?: string };
  logout: () => void;
  isLogoutModalOpen: boolean;
  openLogoutModal: () => void;
  closeLogoutModal: () => void;
  authUsers: AuthUser[];
  addAuthUser: (user: Omit<AuthUser, 'id'>) => void;
  updateAuthUser: (id: string, updates: Partial<AuthUser>) => void;
  deleteAuthUser: (id: string) => void;

  // Dynamic Themes
  currentTheme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  themeDefinitions: ThemeDefinition[];
  activeThemeDef: ThemeDefinition;

  // User Persona & RBAC
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;

  // Company Settings & Masters
  companySettings: CompanySettings;
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  sequenceSettings: SequenceSettings;
  updateSequenceSettings: (settings: Partial<SequenceSettings>) => void;
  getNextServiceOrderCode: () => string;
  getNextSaleCode: () => string;
  getNextBudgetCode: () => string;

  // Garantias Customizadas Atreladas aos Serviços
  warrantyPolicies: WarrantyPolicy[];
  addWarrantyPolicy: (policy: Omit<WarrantyPolicy, 'id' | 'createdAt'>) => void;
  updateWarrantyPolicy: (id: string, updates: Partial<WarrantyPolicy>) => void;
  deleteWarrantyPolicy: (id: string) => void;
  getWarrantyForServices: (serviceIds: string[]) => WarrantyPolicy | undefined;

  serviceCatalog: ServiceCatalogItem[];
  addServiceCatalogItem: (item: Omit<ServiceCatalogItem, 'id'>) => void;
  updateServiceCatalogItem: (id: string, updates: Partial<ServiceCatalogItem>) => void;
  deleteServiceCatalogItem: (id: string) => void;
  checklistTemplates: ChecklistTemplate[];
  addChecklistTemplate: (tmpl: Omit<ChecklistTemplate, 'id'>) => void;
  updateChecklistTemplate: (id: string, updates: Partial<ChecklistTemplate>) => void;
  deleteChecklistTemplate: (id: string) => void;

  // Database Backup / Restore
  exportDatabaseJson: () => string;
  restoreDatabaseJson: (jsonStr: string, options?: SelectiveBackupImportOptions) => { success: boolean; message: string };

  // Entities
  clients: Client[];
  suppliers: Supplier[];
  products: Product[];
  stockMovements: StockMovement[];
  cardRates: CardMachineRate[];
  cardOperators: CardOperator[];
  pagBankTransactions: PagBankTransaction[];
  customerTickets: CustomerPortalTicket[];
  auditLogs: AuditLog[];
  employees: Employee[];
  vehicles: Vehicle[];
  vehicleExpenses: VehicleMaintenance[];
  generalExpenses: GeneralExpense[];
  serviceOrders: ServiceOrder[];
  directSales: DirectSale[];
  setupCosts: InitialSetupCostItem[];

  selectedMonthYear: string;
  setSelectedMonthYear: (val: string) => void;

  // External APIs / Lookups
  lookupCep: (cep: string) => Promise<{ street: string; neighborhood: string; city: string; state: string } | null>;
  lookupCnpj: (cnpj: string) => Promise<{ name: string; tradeName?: string; phone?: string; email?: string; cep?: string; street?: string; number?: string; neighborhood?: string; city?: string; state?: string } | null>;

  // XML & Batch Import + Stage 2 Management (De-Para, Histórico & Desfazer)
  supplierProductMappings: SupplierProductMapping[];
  stockImportRecords: StockImportRecord[];
  addSupplierProductMapping: (
    mapping: Omit<SupplierProductMapping, 'id' | 'supplierKey' | 'supplierItemKey' | 'updatedAt'>
  ) => SupplierProductMapping;
  updateSupplierProductMapping: (
    id: string,
    updates: Partial<Omit<SupplierProductMapping, 'id'>>
  ) => void;
  deleteSupplierProductMapping: (id: string) => void;
  analyzeUndoStockImport: (importId: string) => StockImportUndoAnalysis;
  undoStockImport: (
    importId: string,
    options: {
      financialAction: 'delete_generated' | 'unlink_only';
      deleteUnusedCreatedProducts: boolean;
      restorePreviousCosts: boolean;
    }
  ) => { success: boolean; message: string };
  parseNFeXml: (xmlContent: string) => { success: boolean; message: string; parsedNFe?: ParsedXmlNFe };
  commitImportNFe: (
    confirmedNFe: ParsedXmlNFe,
    options?: { source?: 'nfe_xml' | 'universal_import'; referenceLabel?: string; skipCostOnNew?: boolean }
  ) => {
    success: boolean;
    message: string;
    updatedProductsCount: number;
    newProductsCount: number;
    ignoredProductsCount?: number;
    supplierName: string;
    importRecordId?: string;
  };
  importNFeXml: (xmlContent: string) => { success: boolean; message: string; importedCount?: number; totalValue?: number };
  importCsvClients: (csvContent: string) => { success: boolean; message: string; count?: number };

  // CRUD Operations
  addClient: (c: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  addSupplier: (s: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  addProduct: (p: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addStockMovement: (m: Omit<StockMovement, 'id' | 'date'>) => void;
  updateCardRate: (brand: CardMachineRate['brand'], updates: Partial<CardMachineRate>) => void;

  // Product Taxonomies (Categorias, Subcategorias, Marcas e Tags Editáveis)
  productCategories: string[];
  productSubcategories: string[];
  productBrands: string[];
  productTags: string[];
  addProductCategory: (category: string) => void;
  updateProductCategory: (oldCategory: string, newCategory: string) => void;
  deleteProductCategory: (category: string) => void;
  addProductSubcategory: (subcategory: string) => void;
  updateProductSubcategory: (oldSubcategory: string, newSubcategory: string) => void;
  deleteProductSubcategory: (subcategory: string) => void;
  addProductBrand: (brand: string) => void;
  updateProductBrand: (oldBrand: string, newBrand: string) => void;
  deleteProductBrand: (brand: string) => void;
  addProductTag: (tag: string) => void;
  updateProductTag: (oldTag: string, newTag: string) => void;
  deleteProductTag: (tag: string) => void;

  // Universal Batch Import for Backups (Clientes, Serviços, OS, Vendas, Compras, Pagamentos, Estoque)
  batchImportClients: (newClients: Omit<Client, 'id' | 'createdAt'>[], mode: 'append' | 'replace') => number;
  batchImportServices: (newServices: Omit<ServiceCatalogItem, 'id'>[], mode: 'append' | 'replace') => number;
  batchImportServiceOrders: (newOrders: Omit<ServiceOrder, 'id'>[], mode: 'append' | 'replace') => number;
  batchImportDirectSales: (newSales: Omit<DirectSale, 'id'>[], mode: 'append' | 'replace') => number;
  batchImportSuppliers: (newSuppliers: Omit<Supplier, 'id'>[], mode: 'append' | 'replace') => number;
  batchImportPayments: (newPayments: Omit<GeneralExpense, 'id'>[], mode: 'append' | 'replace') => number;
  batchImportProducts: (newProducts: Omit<Product, 'id'>[], mode: 'append' | 'replace') => number;

  // Operadoras de Cartão & Integração PagBank / InfinitePay / Stone / Cielo
  addCardOperator: (op: Omit<CardOperator, 'id' | 'createdAt'>) => void;
  updateCardOperator: (id: string, updates: Partial<CardOperator>) => void;
  deleteCardOperator: (id: string) => void;
  processPagBankWebhook: (payload: {
    operatorId?: string;
    operatorCode?: string;
    orderCode?: string;
    saleCode?: string;
    clientName?: string;
    amount: number;
    method: 'cartao_credito' | 'cartao_debito' | 'pix' | 'boleto';
    installments?: number;
    brand?: string;
    nsu?: string;
  }) => { success: boolean; message: string; transaction: PagBankTransaction };
  syncPagBankPendingOrders: () => { syncedCount: number; message: string };

  addCustomerTicket: (t: Omit<CustomerPortalTicket, 'id' | 'createdAt' | 'status'>) => void;
  updateCustomerTicketStatus: (id: string, status: CustomerPortalTicket['status']) => void;

  addServiceOrder: (so: Omit<ServiceOrder, 'id' | 'code'>) => void;
  updateServiceOrder: (id: string, updates: Partial<ServiceOrder>) => void;
  deleteServiceOrder: (id: string) => void;

  convertBudgetToOrderOrSale: (orderId: string, targetType: 'os_aprovada' | 'venda_direta') => void;

  addDirectSale: (sale: Omit<DirectSale, 'id' | 'code'>) => DirectSale;
  updateDirectSale: (id: string, updates: Partial<DirectSale>) => void;
  cancelDirectSale: (id: string, reason?: string) => void;
  deleteDirectSale: (id: string, authorizedByName?: string) => void;
  authorizePdvSaleDelete: (password: string) => {
    authorized: boolean;
    authorizerName?: string;
    authorizerRole?: UserRole;
    hasAnyPasswordConfigured: boolean;
  };

  // PDV / Frente de Caixa & Recibos de Pagamento
  cashSessions: CashRegisterSession[];
  cashMovements: CashRegisterMovement[];
  activeCashSession: CashRegisterSession | null;
  paymentReceipts: PaymentReceipt[];
  activeReceiptModal: PaymentReceipt | null;
  openReceiptModal: (receipt: PaymentReceipt) => void;
  closeReceiptModal: () => void;
  getReceiptsForSource: (sourceType: 'os' | 'venda', sourceId: string) => PaymentReceipt[];
  getPaidAmountForSource: (sourceType: 'os' | 'venda', sourceId: string) => number;
  openCashSession: (terminalName: string, openingBalance: number, notes?: string) => CashRegisterSession;
  closeCashSession: (sessionId: string, closingBalance: number, notes?: string) => void;
  addCashManualMovement: (type: 'suprimento' | 'sangria', amount: number, description: string, paymentMethod?: PaymentMethod) => void;
  sendSaleToPdv: (saleId: string, terminalName: string) => void;
  sendOrderToPdv: (orderId: string, terminalName: string) => void;
  settleSaleInPdv: (
    saleId: string,
    params: {
      payments: PaymentSplit[];
      paymentMethod: PaymentMethod;
      amountReceived?: number;
      changeAmount?: number;
      nsu?: string;
      terminalName?: string;
      saleOverride?: DirectSale;
      paidAmount?: number;
      splitId?: string;
      paymentKind?: PaymentReceiptKind;
      notes?: string;
      suppressAutoModal?: boolean;
    }
  ) => CashRegisterMovement | null;
  settleServiceOrderInPdv: (
    orderId: string,
    params: {
      payments: PaymentSplit[];
      paymentMethod: PaymentMethod;
      amountReceived?: number;
      changeAmount?: number;
      nsu?: string;
      terminalName?: string;
      orderOverride?: ServiceOrder;
      paidAmount?: number;
      splitId?: string;
      paymentKind?: PaymentReceiptKind;
      notes?: string;
      suppressAutoModal?: boolean;
    }
  ) => CashRegisterMovement | null;

  addGeneralExpense: (exp: Omit<GeneralExpense, 'id'>) => void;
  updateGeneralExpense: (id: string, updates: Partial<GeneralExpense>) => void;
  deleteGeneralExpense: (id: string) => void;

  addVehicleExpense: (vexp: Omit<VehicleMaintenance, 'id'>) => void;
  deleteVehicleExpense: (id: string) => void;

  addVehicle: (veh: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;

  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  addSetupCost: (item: Omit<InitialSetupCostItem, 'id'>) => void;
  updateSetupCost: (id: string, updates: Partial<InitialSetupCostItem>) => void;
  deleteSetupCost: (id: string) => void;
  syncSetupCostsToExpenses: () => { count: number };

  toggleDirectSalePayment: (saleId: string) => void;
  toggleServiceOrderPayment: (orderId: string) => void;
  toggleGeneralExpensePayment: (id: string) => void;
  applyBulkMarginsToAllProducts: (retailMargin?: number, wholesaleMargin?: number) => { count: number };

  addAuditLog: (action: string, details: string) => void;

  // Google Agenda & Agendamentos da Empresa
  appointments: CompanyAppointment[];
  addAppointment: (item: Omit<CompanyAppointment, 'id' | 'createdAt'>) => void;
  updateAppointment: (id: string, updates: Partial<CompanyAppointment>) => void;
  deleteAppointment: (id: string) => void;
  clearAllSystemData: () => void;
  loadDemoServiceOrdersData: () => { ordersAdded: number; receiptsAdded: number };

  resetToDefaults: () => void;

  // Analytics Helpers
  getEmployeeById: (id: string) => Employee | undefined;
  getVehicleById: (id: string) => Vehicle | undefined;
  calculateEmployeeProfitability: (employeeId: string, monthYear: string) => EmployeeProfitabilityReport | null;
  getMonthlyProfitabilityAllEmployees: (monthYear: string) => EmployeeProfitabilityReport[];
  monthlyFinancialSummary: {
    ordersGrossServices: number;
    ordersGrossParts: number;
    ordersDiscounts: number;
    ordersServicesRevenue: number;
    ordersPartsRevenue: number;
    salesRevenue: number;
    totalRevenue: number;
    ordersPartsCost: number;
    salesCost: number;
    totalPartsCost: number;
    grossMargin: number;
    baseSalaries: number;
    benefitsCharges: number;
    commissions: number;
    totalPersonnelCost: number;
    totalVehicleDirect: number;
    totalVehicleProrated: number;
    totalVehicleCost: number;
    generalExpensesSum: number;
    unsyncedDebtInstallments: number;
    totalOperationalCost: number;
    totalCardFees: number;
    totalCosts: number;
    netProfit: number;
    netMarginPercent: number;
    totalPendingReceivables: number;
    totalPendingPayables: number;
    ordersCompletedCount: number;
    ordersActiveCount: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const KEYS = {
  ROLE: 'gestaopro_current_role_v4',
  CLIENTS: 'gestaopro_clients_v4',
  SUPPLIERS: 'gestaopro_suppliers_v4',
  PRODUCTS: 'gestaopro_products_v4',
  STOCK: 'gestaopro_stock_v4',
  CARD_RATES: 'gestaopro_card_rates_v4',
  TICKETS: 'gestaopro_tickets_v4',
  LOGS: 'gestaopro_logs_v4',
  EMPLOYEES: 'gestaopro_employees_v4',
  VEHICLES: 'gestaopro_vehicles_v4',
  VEHICLE_EXPENSES: 'gestaopro_vehicle_expenses_v4',
  GENERAL_EXPENSES: 'gestaopro_general_expenses_v4',
  SERVICE_ORDERS: 'gestaopro_service_orders_v4',
  DIRECT_SALES: 'gestaopro_direct_sales_v4',
  SETUP_COSTS: 'gestaopro_setup_costs_v4',
  SELECTED_MONTH: 'gestaopro_selected_month_v4',
  COMPANY_SETTINGS: 'gestaopro_company_settings_v4',
  SERVICE_CATALOG: 'gestaopro_service_catalog_v4',
  CHECKLIST_TEMPLATES: 'gestaopro_checklist_templates_v4',
  CARD_OPERATORS: 'gestaopro_card_operators_v4',
  PAGBANK_TRANSACTIONS: 'gestaopro_pagbank_transactions_v4',
  SEQUENCE_SETTINGS: 'gestaopro_sequence_settings_v4',
  WARRANTY_POLICIES: 'gestaopro_warranty_policies_v4',
  AUTH_USER: 'gestaopro_auth_user_v4',
  THEME: 'gestaopro_current_theme_v4',
  PRODUCT_CATEGORIES: 'gestaopro_product_categories_v4',
  PRODUCT_SUBCATEGORIES: 'gestaopro_product_subcategories_v4',
  PRODUCT_BRANDS: 'gestaopro_product_brands_v4',
  PRODUCT_TAGS: 'gestaopro_product_tags_v4',
  APPOINTMENTS: 'gestaopro_appointments_v4',
  CASH_SESSIONS: 'gestaopro_cash_sessions_v4',
  CASH_MOVEMENTS: 'gestaopro_cash_movements_v4',
  PAYMENT_RECEIPTS: 'gestaopro_payment_receipts_v4',
  AUTH_USERS: 'gestaopro_auth_users_v4',
  SUPPLIER_PRODUCT_MAPPINGS: 'gestaopro_supplier_product_mappings_v1',
  STOCK_IMPORT_RECORDS: 'gestaopro_stock_import_records_v1'
};

const ZERO_ABSOLUTO_MIGRATION_KEY = 'gestaopro_zero_absoluto_v2715';

let pendingCloudZeroPurge = false;

function runZeroAbsolutoMigrationOnce() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (localStorage.getItem(ZERO_ABSOLUTO_MIGRATION_KEY) === 'done') return;

    const transactionalKeysToWipe = [
      KEYS.CLIENTS,
      KEYS.SUPPLIERS,
      KEYS.PRODUCTS,
      KEYS.STOCK,
      KEYS.PAGBANK_TRANSACTIONS,
      KEYS.TICKETS,
      KEYS.LOGS,
      KEYS.EMPLOYEES,
      KEYS.VEHICLES,
      KEYS.VEHICLE_EXPENSES,
      KEYS.GENERAL_EXPENSES,
      KEYS.SERVICE_ORDERS,
      KEYS.DIRECT_SALES,
      KEYS.SETUP_COSTS,
      KEYS.APPOINTMENTS,
      KEYS.CASH_SESSIONS,
      KEYS.CASH_MOVEMENTS,
      KEYS.PAYMENT_RECEIPTS,
      KEYS.SERVICE_CATALOG,
      KEYS.CHECKLIST_TEMPLATES,
      KEYS.SEQUENCE_SETTINGS,
      KEYS.SELECTED_MONTH,
      KEYS.AUTH_USERS
    ];

    transactionalKeysToWipe.forEach(k => localStorage.removeItem(k));

    // Se o usuário logado anteriormente era um usuário fictício de demonstração, volta para login limpo
    const savedUser = localStorage.getItem(KEYS.AUTH_USER);
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.id && parsed.id !== 'usr-admin') {
          localStorage.removeItem(KEYS.AUTH_USER);
        }
      } catch {
        localStorage.removeItem(KEYS.AUTH_USER);
      }
    }

    pendingCloudZeroPurge = true;
    localStorage.setItem(ZERO_ABSOLUTO_MIGRATION_KEY, 'done');
  } catch {}
}

runZeroAbsolutoMigrationOnce();

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(KEYS.AUTH_USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      } catch {}
    }
    return null; // Inicia deslogado para o usuário acessar pela tela de login no servidor web
  });

  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem(KEYS.THEME);
    if (saved === 'fire_gestao' || saved === 'solar_vivido') {
      return saved;
    }
    return 'fire_gestao';
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(KEYS.ROLE);
    return (saved as UserRole) || (currentUser?.role || 'admin');
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem(KEYS.THEME, currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(KEYS.AUTH_USER, JSON.stringify(currentUser));
      setCurrentRole(currentUser.role);
    } else {
      localStorage.removeItem(KEYS.AUTH_USER);
    }
  }, [currentUser]);

  const activeThemeDef = useMemo(() => {
    return themeDefinitions.find(t => t.id === currentTheme) || themeDefinitions[0];
  }, [currentTheme]);

  const [authUsers, setAuthUsers] = useState<AuthUser[]>(() => {
    const saved = localStorage.getItem(KEYS.AUTH_USERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return initialAuthUsers;
  });

  const login = (identifier: string, pass?: string) => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      return { success: false, message: 'Informe seu usuário ou e-mail cadastrado.' };
    }

    // 1. Usuários Cadastrados do Sistema
    const foundAuth = authUsers.find(
      u => u.username.toLowerCase() === cleanId || 
           u.email.toLowerCase() === cleanId
    );
    if (foundAuth) {
      if (foundAuth.active === false) {
        return { success: false, message: 'Este usuário está inativo. Contate o administrador.' };
      }
      if (foundAuth.password && pass && foundAuth.password !== pass) {
        return { success: false, message: 'Senha incorreta para este usuário.' };
      }
      setCurrentUser(foundAuth);
      setCurrentRole(foundAuth.role);
      return { success: true };
    }

    // 2. Cliente com acesso ao portal
    const matchedClient = clients.find(c => 
      (c.portalUsername && c.portalUsername.toLowerCase() === cleanId) ||
      (c.email && c.email.toLowerCase() === cleanId) ||
      (c.document && c.document.replace(/\D/g, '') === cleanId.replace(/\D/g, ''))
    );
    if (matchedClient) {
      if (matchedClient.portalPassword && pass && matchedClient.portalPassword !== pass) {
        return { success: false, message: 'Senha incorreta para a conta do cliente.' };
      }
      const clientUser: AuthUser = {
        id: `usr-${matchedClient.id}`,
        username: matchedClient.portalUsername || cleanId,
        name: matchedClient.name,
        email: matchedClient.email || '',
        role: 'cliente',
        roleBadge: 'Cliente Autenticado',
        clientId: matchedClient.id
      };
      setCurrentUser(clientUser);
      setCurrentRole('cliente');
      return { success: true };
    }

    // 3. Funcionário ou Técnico cadastrado
    const matchedEmp = employees.find(e => 
      (e.email && e.email.toLowerCase() === cleanId) || 
      e.name.toLowerCase() === cleanId
    );
    if (matchedEmp) {
      const isTech = matchedEmp.role.toLowerCase().includes('técnico') || matchedEmp.role.toLowerCase().includes('tecnico');
      const empUser: AuthUser = {
        id: `usr-${matchedEmp.id}`,
        username: cleanId,
        name: matchedEmp.name,
        email: matchedEmp.email || '',
        role: isTech ? 'tecnico' : 'colaborador',
        roleBadge: matchedEmp.role,
        employeeId: matchedEmp.id
      };
      setCurrentUser(empUser);
      setCurrentRole(empUser.role);
      return { success: true };
    }

    // 4. Suporte a login administrativo web ("admin")
    if (cleanId === 'admin' || cleanId === 'administrador') {
      const adminUser: AuthUser = {
        id: 'usr-admin',
        username: 'admin',
        name: 'Administrador do Sistema',
        email: 'admin@gestaopro.com.br',
        role: 'admin',
        roleBadge: 'Administrador Geral',
        employeeId: 'emp-admin'
      };
      setCurrentUser(adminUser);
      setCurrentRole('admin');
      return { success: true };
    }

    // 5. Suporte a novo acesso corporativo
    if (cleanId.length >= 3) {
      const fallbackUser: AuthUser = {
        id: `usr-custom-${Date.now()}`,
        username: cleanId,
        name: identifier,
        email: `${cleanId}@gestaopro.com.br`,
        role: 'admin',
        roleBadge: 'Administrador Web'
      };
      setCurrentUser(fallbackUser);
      setCurrentRole('admin');
      return { success: true };
    }

    return { 
      success: false, 
      message: 'Credenciais inválidas. Verifique o usuário ou entre em contato com o suporte.' 
    };
  };

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const openLogoutModal = () => setIsLogoutModalOpen(true);
  const closeLogoutModal = () => setIsLogoutModalOpen(false);

  const logout = () => {
    setIsLogoutModalOpen(false);
    try {
      localStorage.removeItem(KEYS.AUTH_USER);
      sessionStorage.clear();
    } catch (err) {
      console.warn('Erro ao limpar auth do storage:', err);
    }
    setCurrentUser(null);
  };

  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem(KEYS.COMPANY_SETTINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CompanySettings;
        const isLegacyTrade = !parsed.tradeName || parsed.tradeName === 'GestãoPro ERP' || parsed.tradeName === 'GestãoPro';
        const isLegacyCompany = !parsed.companyName || parsed.companyName === 'GestãoPro - Assistência Técnica & Vendas';
        return {
          ...initialCompanySettings,
          ...parsed,
          tradeName: isLegacyTrade ? initialCompanySettings.tradeName : parsed.tradeName,
          companyName: isLegacyCompany ? initialCompanySettings.companyName : parsed.companyName
        };
      } catch {}
    }
    return initialCompanySettings;
  });

  const [sequenceSettings, setSequenceSettings] = useState<SequenceSettings>(() => {
    const saved = localStorage.getItem(KEYS.SEQUENCE_SETTINGS);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return initialCompanySettings.sequenceSettings || initialSequenceSettings;
  });

  const [warrantyPolicies, setWarrantyPolicies] = useState<WarrantyPolicy[]>(() => {
    const saved = localStorage.getItem(KEYS.WARRANTY_POLICIES);
    return saved ? JSON.parse(saved) : initialWarrantyPolicies;
  });

  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalogItem[]>(() => {
    const saved = localStorage.getItem(KEYS.SERVICE_CATALOG);
    return saved ? JSON.parse(saved) : initialServiceCatalog;
  });

  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>(() => {
    const saved = localStorage.getItem(KEYS.CHECKLIST_TEMPLATES);
    return saved ? JSON.parse(saved) : initialChecklistTemplates;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(KEYS.CLIENTS);
    return saved ? JSON.parse(saved) : initialClients;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(KEYS.SUPPLIERS);
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  // Helper to keep taxonomies alphabetically sorted
  const sortAlpha = (list: string[]) => {
    return [...list].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  };

  const [productCategories, setProductCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(KEYS.PRODUCT_CATEGORIES);
    return sortAlpha(saved ? JSON.parse(saved) : initialProductCategories);
  });

  const [productSubcategories, setProductSubcategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(KEYS.PRODUCT_SUBCATEGORIES);
    return sortAlpha(saved ? JSON.parse(saved) : initialProductSubcategories);
  });

  const [productBrands, setProductBrands] = useState<string[]>(() => {
    const saved = localStorage.getItem(KEYS.PRODUCT_BRANDS);
    return sortAlpha(saved ? JSON.parse(saved) : initialProductBrands);
  });

  const [productTags, setProductTags] = useState<string[]>(() => {
    const saved = localStorage.getItem(KEYS.PRODUCT_TAGS);
    return sortAlpha(saved ? JSON.parse(saved) : initialProductTags);
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(KEYS.STOCK);
    return saved ? JSON.parse(saved) : initialStockMovements;
  });

  const [cardRates, setCardRates] = useState<CardMachineRate[]>(() => {
    const saved = localStorage.getItem(KEYS.CARD_RATES);
    return saved ? JSON.parse(saved) : initialCardRates;
  });

  const [cardOperators, setCardOperators] = useState<CardOperator[]>(() => {
    const saved = localStorage.getItem(KEYS.CARD_OPERATORS);
    if (!saved) return initialCardOperators;
    try {
      const parsed: CardOperator[] = JSON.parse(saved);
      const hasInfinitePay = parsed.some(op => op.code === 'infinitepay');
      if (!hasInfinitePay) {
        const inf = initialCardOperators.find(op => op.code === 'infinitepay');
        if (inf) return [...parsed, inf];
      }
      return parsed;
    } catch {
      return initialCardOperators;
    }
  });

  const [pagBankTransactions, setPagBankTransactions] = useState<PagBankTransaction[]>(() => {
    const saved = localStorage.getItem(KEYS.PAGBANK_TRANSACTIONS);
    return saved ? JSON.parse(saved) : initialPagBankTransactions;
  });

  const [customerTickets, setCustomerTickets] = useState<CustomerPortalTicket[]>(() => {
    const saved = localStorage.getItem(KEYS.TICKETS);
    return saved ? JSON.parse(saved) : initialCustomerTickets;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(KEYS.LOGS);
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(KEYS.EMPLOYEES);
    return saved ? JSON.parse(saved) : initialEmployees;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem(KEYS.VEHICLES);
    return saved ? JSON.parse(saved) : initialVehicles;
  });

  const [vehicleExpenses, setVehicleExpenses] = useState<VehicleMaintenance[]>(() => {
    const saved = localStorage.getItem(KEYS.VEHICLE_EXPENSES);
    return saved ? JSON.parse(saved) : initialVehicleExpenses;
  });

  const [generalExpenses, setGeneralExpenses] = useState<GeneralExpense[]>(() => {
    const saved = localStorage.getItem(KEYS.GENERAL_EXPENSES);
    return saved ? JSON.parse(saved) : initialGeneralExpenses;
  });

  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(() => {
    const saved = localStorage.getItem(KEYS.SERVICE_ORDERS);
    return saved ? JSON.parse(saved) : initialServiceOrders;
  });

  const [directSales, setDirectSales] = useState<DirectSale[]>(() => {
    const saved = localStorage.getItem(KEYS.DIRECT_SALES);
    return saved ? JSON.parse(saved) : initialDirectSales;
  });

  const [setupCosts, setSetupCosts] = useState<InitialSetupCostItem[]>(() => {
    const saved = localStorage.getItem(KEYS.SETUP_COSTS);
    if (!saved) return initialSetupCosts;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : initialSetupCosts;
    } catch {
      return initialSetupCosts;
    }
  });

  const [appointments, setAppointments] = useState<CompanyAppointment[]>(() => {
    const saved = localStorage.getItem(KEYS.APPOINTMENTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (a: CompanyAppointment) => !a?.isSample && !String(a?.id || '').startsWith('apt-sample-')
          );
        }
      } catch {}
    }
    return initialAppointments;
  });

  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(() => {
    const saved = localStorage.getItem(KEYS.SELECTED_MONTH);
    return saved || getCurrentMonthYear();
  });

  const [cashSessions, setCashSessions] = useState<CashRegisterSession[]>(() => {
    const saved = localStorage.getItem(KEYS.CASH_SESSIONS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const [cashMovements, setCashMovements] = useState<CashRegisterMovement[]>(() => {
    const saved = localStorage.getItem(KEYS.CASH_MOVEMENTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const [paymentReceipts, setPaymentReceipts] = useState<PaymentReceipt[]>(() => {
    const saved = localStorage.getItem(KEYS.PAYMENT_RECEIPTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const [activeReceiptModal, setActiveReceiptModal] = useState<PaymentReceipt | null>(null);

  const [supplierProductMappings, setSupplierProductMappings] = useState<SupplierProductMapping[]>(() => {
    const saved = localStorage.getItem(KEYS.SUPPLIER_PRODUCT_MAPPINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const [stockImportRecords, setStockImportRecords] = useState<StockImportRecord[]>(() => {
    const saved = localStorage.getItem(KEYS.STOCK_IMPORT_RECORDS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((rec: any) => ({
            ...rec,
            status: rec?.status === 'desfeita' ? 'desfeita' : 'concluida',
            itemsSnapshot: Array.isArray(rec?.itemsSnapshot) ? rec.itemsSnapshot : [],
            createdProductIds: Array.isArray(rec?.createdProductIds) ? rec.createdProductIds : [],
            generatedExpenseIds: Array.isArray(rec?.generatedExpenseIds)
              ? rec.generatedExpenseIds
              : rec?.financialMode === 'create_new' && Array.isArray(rec?.linkedExpenseIds)
              ? rec.linkedExpenseIds
              : [],
          }));
        }
      } catch {}
    }
    return [];
  });

  const activeCashSession = useMemo(() => {
    return cashSessions.find(s => s.status === 'aberto') || null;
  }, [cashSessions]);

const SYNC_CHANNEL_NAME = 'gestaopro_sync_channel_v4';

const broadcastSync = (type: 'KEY' | 'FULL', key?: string) => {
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channel.postMessage({ type, key, timestamp: Date.now() });
      channel.close();
    }
  } catch {}
};

  // LocalStorage sync
  useEffect(() => { localStorage.setItem(KEYS.ROLE, currentRole); broadcastSync('KEY', KEYS.ROLE); }, [currentRole]);
  useEffect(() => { localStorage.setItem(KEYS.COMPANY_SETTINGS, JSON.stringify(companySettings)); broadcastSync('KEY', KEYS.COMPANY_SETTINGS); }, [companySettings]);
  useEffect(() => { localStorage.setItem(KEYS.SERVICE_CATALOG, JSON.stringify(serviceCatalog)); broadcastSync('KEY', KEYS.SERVICE_CATALOG); }, [serviceCatalog]);
  useEffect(() => { localStorage.setItem(KEYS.CHECKLIST_TEMPLATES, JSON.stringify(checklistTemplates)); broadcastSync('KEY', KEYS.CHECKLIST_TEMPLATES); }, [checklistTemplates]);
  useEffect(() => { localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients)); broadcastSync('KEY', KEYS.CLIENTS); }, [clients]);
  useEffect(() => { localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(suppliers)); broadcastSync('KEY', KEYS.SUPPLIERS); }, [suppliers]);
  useEffect(() => { localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products)); broadcastSync('KEY', KEYS.PRODUCTS); }, [products]);
  useEffect(() => { localStorage.setItem(KEYS.PRODUCT_CATEGORIES, JSON.stringify(productCategories)); broadcastSync('KEY', KEYS.PRODUCT_CATEGORIES); }, [productCategories]);
  useEffect(() => { localStorage.setItem(KEYS.PRODUCT_SUBCATEGORIES, JSON.stringify(productSubcategories)); broadcastSync('KEY', KEYS.PRODUCT_SUBCATEGORIES); }, [productSubcategories]);
  useEffect(() => { localStorage.setItem(KEYS.PRODUCT_BRANDS, JSON.stringify(productBrands)); broadcastSync('KEY', KEYS.PRODUCT_BRANDS); }, [productBrands]);
  useEffect(() => { localStorage.setItem(KEYS.PRODUCT_TAGS, JSON.stringify(productTags)); broadcastSync('KEY', KEYS.PRODUCT_TAGS); }, [productTags]);
  useEffect(() => { localStorage.setItem(KEYS.STOCK, JSON.stringify(stockMovements)); broadcastSync('KEY', KEYS.STOCK); }, [stockMovements]);
  useEffect(() => { localStorage.setItem(KEYS.CARD_RATES, JSON.stringify(cardRates)); broadcastSync('KEY', KEYS.CARD_RATES); }, [cardRates]);
  useEffect(() => { localStorage.setItem(KEYS.CARD_OPERATORS, JSON.stringify(cardOperators)); broadcastSync('KEY', KEYS.CARD_OPERATORS); }, [cardOperators]);
  useEffect(() => { localStorage.setItem(KEYS.PAGBANK_TRANSACTIONS, JSON.stringify(pagBankTransactions)); broadcastSync('KEY', KEYS.PAGBANK_TRANSACTIONS); }, [pagBankTransactions]);
  useEffect(() => { localStorage.setItem(KEYS.TICKETS, JSON.stringify(customerTickets)); broadcastSync('KEY', KEYS.TICKETS); }, [customerTickets]);
  useEffect(() => { localStorage.setItem(KEYS.LOGS, JSON.stringify(auditLogs)); broadcastSync('KEY', KEYS.LOGS); }, [auditLogs]);
  useEffect(() => { localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees)); broadcastSync('KEY', KEYS.EMPLOYEES); }, [employees]);
  useEffect(() => { localStorage.setItem(KEYS.VEHICLES, JSON.stringify(vehicles)); broadcastSync('KEY', KEYS.VEHICLES); }, [vehicles]);
  useEffect(() => { localStorage.setItem(KEYS.VEHICLE_EXPENSES, JSON.stringify(vehicleExpenses)); broadcastSync('KEY', KEYS.VEHICLE_EXPENSES); }, [vehicleExpenses]);
  useEffect(() => { localStorage.setItem(KEYS.GENERAL_EXPENSES, JSON.stringify(generalExpenses)); broadcastSync('KEY', KEYS.GENERAL_EXPENSES); }, [generalExpenses]);
  useEffect(() => { localStorage.setItem(KEYS.SERVICE_ORDERS, JSON.stringify(serviceOrders)); broadcastSync('KEY', KEYS.SERVICE_ORDERS); }, [serviceOrders]);
  useEffect(() => { localStorage.setItem(KEYS.DIRECT_SALES, JSON.stringify(directSales)); broadcastSync('KEY', KEYS.DIRECT_SALES); }, [directSales]);
  useEffect(() => { localStorage.setItem(KEYS.SETUP_COSTS, JSON.stringify(setupCosts)); broadcastSync('KEY', KEYS.SETUP_COSTS); }, [setupCosts]);
  useEffect(() => { localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments)); broadcastSync('KEY', KEYS.APPOINTMENTS); }, [appointments]);
  useEffect(() => { localStorage.setItem(KEYS.SELECTED_MONTH, selectedMonthYear); broadcastSync('KEY', KEYS.SELECTED_MONTH); }, [selectedMonthYear]);
  useEffect(() => { localStorage.setItem(KEYS.SEQUENCE_SETTINGS, JSON.stringify(sequenceSettings)); broadcastSync('KEY', KEYS.SEQUENCE_SETTINGS); }, [sequenceSettings]);
  useEffect(() => { localStorage.setItem(KEYS.WARRANTY_POLICIES, JSON.stringify(warrantyPolicies)); broadcastSync('KEY', KEYS.WARRANTY_POLICIES); }, [warrantyPolicies]);
  useEffect(() => { localStorage.setItem(KEYS.CASH_SESSIONS, JSON.stringify(cashSessions)); broadcastSync('KEY', KEYS.CASH_SESSIONS); }, [cashSessions]);
  useEffect(() => { localStorage.setItem(KEYS.CASH_MOVEMENTS, JSON.stringify(cashMovements)); broadcastSync('KEY', KEYS.CASH_MOVEMENTS); }, [cashMovements]);
  useEffect(() => { localStorage.setItem(KEYS.PAYMENT_RECEIPTS, JSON.stringify(paymentReceipts)); broadcastSync('KEY', KEYS.PAYMENT_RECEIPTS); }, [paymentReceipts]);
  useEffect(() => { localStorage.setItem(KEYS.AUTH_USERS, JSON.stringify(authUsers)); broadcastSync('KEY', KEYS.AUTH_USERS); }, [authUsers]);
  useEffect(() => { localStorage.setItem(KEYS.SUPPLIER_PRODUCT_MAPPINGS, JSON.stringify(supplierProductMappings)); broadcastSync('KEY', KEYS.SUPPLIER_PRODUCT_MAPPINGS); }, [supplierProductMappings]);
  useEffect(() => { localStorage.setItem(KEYS.STOCK_IMPORT_RECORDS, JSON.stringify(stockImportRecords)); broadcastSync('KEY', KEYS.STOCK_IMPORT_RECORDS); }, [stockImportRecords]);

  // Real-time synchronization across browser tabs and devices (desktop & mobile)
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      }
    } catch {}

    const handleSync = (key: string | null, rawValue?: string | null) => {
      if (!key) return;
      try {
        const val = rawValue !== undefined ? rawValue : localStorage.getItem(key);
        if (val === null) return;
        const parsed = JSON.parse(val);

        switch (key) {
          case KEYS.CLIENTS:
            if (Array.isArray(parsed)) setClients(parsed);
            break;
          case KEYS.SUPPLIERS:
            if (Array.isArray(parsed)) setSuppliers(parsed);
            break;
          case KEYS.PRODUCTS:
            if (Array.isArray(parsed)) setProducts(parsed);
            break;
          case KEYS.STOCK:
            if (Array.isArray(parsed)) setStockMovements(parsed);
            break;
          case KEYS.SUPPLIER_PRODUCT_MAPPINGS:
            if (Array.isArray(parsed)) setSupplierProductMappings(parsed);
            break;
          case KEYS.STOCK_IMPORT_RECORDS:
            if (Array.isArray(parsed)) setStockImportRecords(parsed);
            break;
          case KEYS.CARD_RATES:
            if (Array.isArray(parsed)) setCardRates(parsed);
            break;
          case KEYS.CARD_OPERATORS:
            if (Array.isArray(parsed)) setCardOperators(parsed);
            break;
          case KEYS.PAGBANK_TRANSACTIONS:
            if (Array.isArray(parsed)) setPagBankTransactions(parsed);
            break;
          case KEYS.TICKETS:
            if (Array.isArray(parsed)) setCustomerTickets(parsed);
            break;
          case KEYS.LOGS:
            if (Array.isArray(parsed)) setAuditLogs(parsed);
            break;
          case KEYS.EMPLOYEES:
            if (Array.isArray(parsed)) setEmployees(parsed);
            break;
          case KEYS.VEHICLES:
            if (Array.isArray(parsed)) setVehicles(parsed);
            break;
          case KEYS.VEHICLE_EXPENSES:
            if (Array.isArray(parsed)) setVehicleExpenses(parsed);
            break;
          case KEYS.GENERAL_EXPENSES:
            if (Array.isArray(parsed)) setGeneralExpenses(parsed);
            break;
          case KEYS.SERVICE_ORDERS:
            if (Array.isArray(parsed)) setServiceOrders(parsed);
            break;
          case KEYS.DIRECT_SALES:
            if (Array.isArray(parsed)) setDirectSales(parsed);
            break;
          case KEYS.SETUP_COSTS:
            if (Array.isArray(parsed)) setSetupCosts(parsed);
            break;
          case KEYS.APPOINTMENTS:
            if (Array.isArray(parsed)) setAppointments(parsed);
            break;
          case KEYS.COMPANY_SETTINGS:
            if (parsed && typeof parsed === 'object') setCompanySettings(parsed);
            break;
          case KEYS.SERVICE_CATALOG:
            if (Array.isArray(parsed)) setServiceCatalog(parsed);
            break;
          case KEYS.CHECKLIST_TEMPLATES:
            if (Array.isArray(parsed)) setChecklistTemplates(parsed);
            break;
          case KEYS.SEQUENCE_SETTINGS:
            if (parsed && typeof parsed === 'object') setSequenceSettings(parsed);
            break;
          case KEYS.WARRANTY_POLICIES:
            if (Array.isArray(parsed)) setWarrantyPolicies(parsed);
            break;
          case KEYS.PRODUCT_CATEGORIES:
            if (Array.isArray(parsed)) setProductCategories(parsed);
            break;
          case KEYS.PRODUCT_SUBCATEGORIES:
            if (Array.isArray(parsed)) setProductSubcategories(parsed);
            break;
          case KEYS.PRODUCT_BRANDS:
            if (Array.isArray(parsed)) setProductBrands(parsed);
            break;
          case KEYS.PRODUCT_TAGS:
            if (Array.isArray(parsed)) setProductTags(parsed);
            break;
          case KEYS.CASH_SESSIONS:
            if (Array.isArray(parsed)) setCashSessions(parsed);
            break;
          case KEYS.CASH_MOVEMENTS:
            if (Array.isArray(parsed)) setCashMovements(parsed);
            break;
          case KEYS.PAYMENT_RECEIPTS:
            if (Array.isArray(parsed)) setPaymentReceipts(parsed);
            break;
          default:
            break;
        }
      } catch {}
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key) {
        handleSync(e.key, e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    if (channel) {
      channel.onmessage = (event) => {
        if (event.data?.type === 'KEY' && event.data.key) {
          handleSync(event.data.key);
        } else if (event.data?.type === 'FULL') {
          Object.values(KEYS).forEach(k => handleSync(k));
        }
      };
    }

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      if (channel) {
        channel.close();
      }
    };
  }, []);

  // Real-time Cloud Synchronization between physical devices (PC <-> Celular) via Firestore
  useEffect(() => {
    let unsubscribeCloud: (() => void) | null = null;
    let cancelled = false;

    const startCloudSync = async () => {
      testFirestoreConnection();

      // Se esta sessão executou a migração Zero Absoluto pela 1ª vez, limpa também a nuvem antes de assinar
      if (pendingCloudZeroPurge) {
        pendingCloudZeroPurge = false;
        await clearAllCloudCollections();
      } else {
        bootstrapCloudDatabase({
          products,
          clients,
          suppliers,
          serviceOrders,
          directSales,
          appointments
        });
      }

      if (cancelled) return;

      unsubscribeCloud = subscribeToCloudSync({
        onProductsSync: (cloudProducts) => {
          setProducts(cloudProducts);
        },
        onClientsSync: (cloudClients) => {
          setClients(cloudClients);
        },
        onSuppliersSync: (cloudSuppliers) => {
          setSuppliers(cloudSuppliers);
        },
        onOrdersSync: (cloudOrders) => {
          setServiceOrders(cloudOrders);
        },
        onDirectSalesSync: (cloudSales) => {
          setDirectSales(cloudSales);
        },
        onAppointmentsSync: (cloudAppointments) => {
          const samplesToPurge = cloudAppointments.filter(
            a => a.isSample || String(a.id || '').startsWith('apt-sample-')
          );
          if (samplesToPurge.length > 0) {
            samplesToPurge.forEach(a => deleteAppointmentFromCloud(a.id));
          }
          setAppointments(
            cloudAppointments.filter(a => !a.isSample && !String(a.id || '').startsWith('apt-sample-'))
          );
        },
        onCashSessionsSync: (cloudSessions) => {
          setCashSessions(cloudSessions);
        },
        onCashMovementsSync: (cloudMovements) => {
          setCashMovements(cloudMovements);
        },
        onPaymentReceiptsSync: (cloudReceipts) => {
          setPaymentReceipts(cloudReceipts);
        }
      });
    };

    startCloudSync();

    return () => {
      cancelled = true;
      if (unsubscribeCloud) {
        unsubscribeCloud();
      }
    };
  }, []);

  const addAuditLog = (action: string, details: string) => {
    const now = new Date();
    const timestamp = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp,
      userName: currentRole === 'admin' ? 'Administrador' : currentRole === 'tecnico' ? 'Técnico em Campo' : currentRole === 'colaborador' ? 'Colaborador' : currentRole === 'contador' ? 'Contador' : 'Cliente (Portal)',
      userRole: currentRole,
      action,
      details
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 99)]);
  };

  const updateCompanySettings = (settings: Partial<CompanySettings>) => {
    setCompanySettings(prev => ({ ...prev, ...settings }));
    addAuditLog('Configuração da Empresa', 'Dados cadastrais e fiscais da empresa foram atualizados.');
  };

  const addServiceCatalogItem = (item: Omit<ServiceCatalogItem, 'id'>) => {
    const newItem: ServiceCatalogItem = {
      ...item,
      id: `srv-${Date.now()}`
    };
    setServiceCatalog(prev => [...prev, newItem]);
    addAuditLog('Novo Serviço Tabelado', `Serviço ${newItem.name} adicionado com sucesso.`);
  };

  const updateServiceCatalogItem = (id: string, updates: Partial<ServiceCatalogItem>) => {
    setServiceCatalog(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteServiceCatalogItem = (id: string) => {
    setServiceCatalog(prev => prev.filter(s => s.id !== id));
  };

  const addChecklistTemplate = (tmpl: Omit<ChecklistTemplate, 'id'>) => {
    const newTmpl: ChecklistTemplate = {
      ...tmpl,
      id: `chk-tmpl-${Date.now()}`
    };
    setChecklistTemplates(prev => [...prev, newTmpl]);
    addAuditLog('Novo Modelo de Checklist', `Modelo ${newTmpl.title} cadastrado.`);
  };

  const updateChecklistTemplate = (id: string, updates: Partial<ChecklistTemplate>) => {
    setChecklistTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteChecklistTemplate = (id: string) => {
    setChecklistTemplates(prev => prev.filter(t => t.id !== id));
  };

  // Custom Sequence & Numbering Settings
  const updateSequenceSettings = (settings: Partial<SequenceSettings>) => {
    setSequenceSettings(prev => {
      const updated = { ...prev, ...settings };
      setCompanySettings(c => ({ ...c, sequenceSettings: updated }));
      return updated;
    });
    addAuditLog('Configuração de Numerações', 'Sequenciais de OS, Vendas e Orçamentos atualizados.');
  };

  const getNextServiceOrderCode = (): string => {
    const prefix = sequenceSettings.serviceOrderPrefix ?? '';
    const nextNum = sequenceSettings.serviceOrderNextNumber ?? 2025020328;
    const digits = sequenceSettings.serviceOrderDigits ?? 0;
    const formattedNum = digits > 0 ? String(nextNum).padStart(digits, '0') : String(nextNum);
    return `${prefix}${formattedNum}`;
  };

  const getNextSaleCode = (): string => {
    const prefix = sequenceSettings.salePrefix ?? 'VD-';
    const nextNum = sequenceSettings.saleNextNumber ?? 1001;
    const digits = sequenceSettings.saleDigits ?? 0;
    const formattedNum = digits > 0 ? String(nextNum).padStart(digits, '0') : String(nextNum);
    return `${prefix}${formattedNum}`;
  };

  const getNextBudgetCode = (): string => {
    const prefix = sequenceSettings.budgetPrefix ?? 'ORC-';
    const nextNum = sequenceSettings.budgetNextNumber ?? 501;
    const digits = sequenceSettings.budgetDigits ?? 0;
    const formattedNum = digits > 0 ? String(nextNum).padStart(digits, '0') : String(nextNum);
    return `${prefix}${formattedNum}`;
  };

  // Warranties & Services Linking
  const getWarrantyForServices = (serviceIds: string[]): WarrantyPolicy | undefined => {
    if (!serviceIds || serviceIds.length === 0) {
      return warrantyPolicies.find(wp => wp.isDefault) || warrantyPolicies[0];
    }
    const matched = warrantyPolicies.find(wp => 
      wp.linkedServiceIds && wp.linkedServiceIds.some(id => serviceIds.includes(id))
    );
    return matched || warrantyPolicies.find(wp => wp.isDefault) || warrantyPolicies[0];
  };

  const addWarrantyPolicy = (policy: Omit<WarrantyPolicy, 'id' | 'createdAt'>) => {
    const newPolicy: WarrantyPolicy = {
      ...policy,
      id: `wp-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    if (newPolicy.isDefault) {
      setWarrantyPolicies(prev => [...prev.map(p => ({ ...p, isDefault: false })), newPolicy]);
    } else {
      setWarrantyPolicies(prev => [...prev, newPolicy]);
    }
    addAuditLog('Nova Garantia', `Garantia "${newPolicy.name}" (${newPolicy.days} dias) cadastrada.`);
  };

  const updateWarrantyPolicy = (id: string, updates: Partial<WarrantyPolicy>) => {
    setWarrantyPolicies(prev => {
      if (updates.isDefault) {
        return prev.map(p => p.id === id ? { ...p, ...updates } : { ...p, isDefault: false });
      }
      return prev.map(p => p.id === id ? { ...p, ...updates } : p);
    });
    addAuditLog('Edição de Garantia', `Garantia ID ${id} atualizada.`);
  };

  const deleteWarrantyPolicy = (id: string) => {
    setWarrantyPolicies(prev => prev.filter(p => p.id !== id));
    addAuditLog('Exclusão de Garantia', `Garantia ID ${id} removida.`);
  };

  // Full Database JSON Export / Backup
  const exportDatabaseJson = (): string => {
    const backupData = {
      version: '2.0-brasil-erp',
      exportedAt: new Date().toISOString(),
      companySettings,
      sequenceSettings,
      warrantyPolicies,
      serviceCatalog,
      checklistTemplates,
      clients,
      suppliers,
      products,
      productCategories,
      productSubcategories,
      productBrands,
      productTags,
      stockMovements,
      cardRates,
      cardOperators,
      customerTickets,
      auditLogs,
      employees,
      vehicles,
      vehicleExpenses,
      generalExpenses,
      serviceOrders,
      directSales,
      setupCosts,
      appointments
    };
    return JSON.stringify(backupData, null, 2);
  };

  // Restore Database from JSON (with optional selective category filters)
  const restoreDatabaseJson = (
    jsonStr: string,
    options?: SelectiveBackupImportOptions
  ): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Arquivo JSON inválido ou vazio.' };
      }

      const sel: Required<SelectiveBackupImportOptions> = {
        products: options ? Boolean(options.products) : true,
        stockMovements: options ? Boolean(options.stockMovements) : true,
        clients: options ? Boolean(options.clients) : true,
        suppliers: options ? Boolean(options.suppliers) : true,
        employees: options ? Boolean(options.employees) : true,
        serviceOrders: options ? Boolean(options.serviceOrders) : true,
        directSales: options ? Boolean(options.directSales) : true,
        financial: options ? Boolean(options.financial) : true,
        fleet: options ? Boolean(options.fleet) : true,
        appointments: options ? Boolean(options.appointments) : true,
        settings: options ? Boolean(options.settings) : true
      };

      const importedSections: string[] = [];

      if (sel.settings) {
        let anySetting = false;
        if (data.companySettings) { setCompanySettings(data.companySettings); anySetting = true; }
        if (data.sequenceSettings) { setSequenceSettings(data.sequenceSettings); anySetting = true; }
        if (data.warrantyPolicies) { setWarrantyPolicies(data.warrantyPolicies); anySetting = true; }
        if (data.serviceCatalog) { setServiceCatalog(data.serviceCatalog); anySetting = true; }
        if (data.checklistTemplates) { setChecklistTemplates(data.checklistTemplates); anySetting = true; }
        if (data.cardRates) { setCardRates(data.cardRates); anySetting = true; }
        if (data.cardOperators) { setCardOperators(data.cardOperators); anySetting = true; }
        if (anySetting) importedSections.push('Configurações');
      }

      if (sel.clients && Array.isArray(data.clients)) {
        setClients(data.clients);
        importedSections.push(`Clientes (${data.clients.length})`);
      }
      if (sel.suppliers && Array.isArray(data.suppliers)) {
        setSuppliers(data.suppliers);
        importedSections.push(`Fornecedores (${data.suppliers.length})`);
      }
      if (sel.products && Array.isArray(data.products)) {
        setProducts(data.products);
        if (Array.isArray(data.productCategories)) setProductCategories(data.productCategories);
        if (Array.isArray(data.productSubcategories)) setProductSubcategories(data.productSubcategories);
        if (Array.isArray(data.productBrands)) setProductBrands(data.productBrands);
        if (Array.isArray(data.productTags)) setProductTags(data.productTags);
        importedSections.push(`Produtos (${data.products.length})`);
      }
      if (sel.stockMovements && Array.isArray(data.stockMovements)) {
        setStockMovements(data.stockMovements);
        importedSections.push(`Mov. Estoque (${data.stockMovements.length})`);
      }
      if (sel.employees && Array.isArray(data.employees)) {
        setEmployees(data.employees);
        importedSections.push(`Funcionários (${data.employees.length})`);
      }
      if (sel.serviceOrders && Array.isArray(data.serviceOrders)) {
        setServiceOrders(data.serviceOrders);
        if (Array.isArray(data.customerTickets)) setCustomerTickets(data.customerTickets);
        importedSections.push(`Ordens de Serviço (${data.serviceOrders.length})`);
      }
      if (sel.directSales && Array.isArray(data.directSales)) {
        setDirectSales(data.directSales);
        importedSections.push(`Vendas (${data.directSales.length})`);
      }
      if (sel.financial) {
        let finCount = 0;
        if (Array.isArray(data.generalExpenses)) {
          setGeneralExpenses(data.generalExpenses);
          finCount += data.generalExpenses.length;
        }
        if (Array.isArray(data.setupCosts)) {
          setSetupCosts(data.setupCosts);
          finCount += data.setupCosts.length;
        }
        if (finCount > 0 || data.generalExpenses || data.setupCosts) {
          importedSections.push(`Financeiro (${finCount})`);
        }
      }
      if (sel.fleet) {
        let fleetCount = 0;
        if (Array.isArray(data.vehicles)) {
          setVehicles(data.vehicles);
          fleetCount += data.vehicles.length;
        }
        if (Array.isArray(data.vehicleExpenses)) {
          setVehicleExpenses(data.vehicleExpenses);
          fleetCount += data.vehicleExpenses.length;
        }
        if (fleetCount > 0) importedSections.push(`Frota (${fleetCount})`);
      }
      if (sel.appointments && Array.isArray(data.appointments)) {
        setAppointments(data.appointments);
        importedSections.push(`Agenda (${data.appointments.length})`);
      }
      if (!options && Array.isArray(data.auditLogs)) {
        setAuditLogs(data.auditLogs);
      }

      if (importedSections.length === 0) {
        return {
          success: false,
          message: 'Nenhum dado correspondente às opções selecionadas foi encontrado neste arquivo JSON.'
        };
      }

      broadcastSync('FULL');
      const finNote = sel.financial ? '' : ' Nenhum dado foi enviado para o Financeiro.';
      addAuditLog('Importação Seletiva de Backup', `Importados: ${importedSections.join(', ')}.${finNote}`);
      return {
        success: true,
        message: `Importação concluída: ${importedSections.join(', ')}.${finNote}`
      };
    } catch {
      return { success: false, message: 'Erro ao interpretar o arquivo JSON de backup.' };
    }
  };

  const resetToDefaults = () => {
    setCurrentRole('admin');
    setCompanySettings(initialCompanySettings);
    setSequenceSettings(initialSequenceSettings);
    setWarrantyPolicies(initialWarrantyPolicies);
    setServiceCatalog(initialServiceCatalog);
    setChecklistTemplates(initialChecklistTemplates);
    setClients(initialClients);
    setSuppliers(initialSuppliers);
    setProducts(initialProducts);
    setStockMovements(initialStockMovements);
    setCardRates(initialCardRates);
    setCardOperators(initialCardOperators);
    setPagBankTransactions(initialPagBankTransactions);
    setCustomerTickets(initialCustomerTickets);
    setAuditLogs(initialAuditLogs);
    setEmployees(initialEmployees);
    setVehicles(initialVehicles);
    setVehicleExpenses(initialVehicleExpenses);
    setGeneralExpenses(initialGeneralExpenses);
    setServiceOrders(initialServiceOrders);
    setDirectSales(initialDirectSales);
    setSetupCosts(initialSetupCosts);
    setAppointments(initialAppointments);
    setCashSessions([]);
    setCashMovements([]);
    setPaymentReceipts([]);
    setAuthUsers(initialAuthUsers);
    setSelectedMonthYear(getCurrentMonthYear());
    dismissedAutoExpenseIdsRef.current.clear();
    clearAllCloudCollections();
    broadcastSync('FULL');
  };

  const loadDemoServiceOrdersData = (): { ordersAdded: number; receiptsAdded: number } => {
    const demo = buildDemoServiceOrdersDataset();

    const mergeById = <T extends { id: string }>(prev: T[], incoming: T[]): T[] => {
      const existingIds = new Set(prev.map(item => item.id));
      const newItems = incoming.filter(item => !existingIds.has(item.id));
      return [...newItems, ...prev];
    };

    const existingOrderIds = new Set(serviceOrders.map(o => o.id));
    const ordersAdded = demo.serviceOrders.filter(o => !existingOrderIds.has(o.id)).length;
    const existingReceiptIds = new Set(paymentReceipts.map(r => r.id));
    const receiptsAdded = demo.paymentReceipts.filter(r => !existingReceiptIds.has(r.id)).length;

    setClients(prev => mergeById(prev, demo.clients));
    setSuppliers(prev => mergeById(prev, demo.suppliers));
    setEmployees(prev => mergeById(prev, demo.employees));
    setVehicles(prev => mergeById(prev, demo.vehicles));
    setProducts(prev => mergeById(prev, demo.products));
    setStockMovements(prev => mergeById(prev, demo.stockMovements));
    setServiceOrders(prev => mergeById(prev, demo.serviceOrders));
    setVehicleExpenses(prev => mergeById(prev, demo.vehicleExpenses));
    setGeneralExpenses(prev => mergeById(prev, demo.generalExpenses));
    setCashSessions(prev => mergeById(prev, demo.cashSessions));
    setCashMovements(prev => mergeById(prev, demo.cashMovements));
    setPaymentReceipts(prev => mergeById(prev, demo.paymentReceipts));
    setServiceCatalog(prev => mergeById(prev, demo.serviceCatalog));
    setAppointments(prev => mergeById(prev, demo.appointments));
    setSelectedMonthYear('2026-11');

    demo.clients.forEach(c => syncClientToCloud(c));
    demo.suppliers.forEach(s => syncSupplierToCloud(s));
    demo.products.forEach(p => syncProductToCloud(p));
    demo.serviceOrders.forEach(o => syncOrderToCloud(o));
    demo.appointments.forEach(a => syncAppointmentToCloud(a));
    demo.cashSessions.forEach(cs => syncCashSessionToCloud(cs));
    demo.cashMovements.forEach(cm => syncCashMovementToCloud(cm));
    demo.paymentReceipts.forEach(pr => syncPaymentReceiptToCloud(pr));

    broadcastSync('FULL');
    addAuditLog(
      'Carga de Exemplos de O.S.',
      `Carregadas ${demo.serviceOrders.length} Ordens de Serviço de demonstração com custos, movimentações de estoque (entradas/saídas), despesas de viagem, caixa e recibos.`
    );
    return { ordersAdded, receiptsAdded };
  };

  // Google Agenda & Company Appointments Operations
  const addAppointment = (item: Omit<CompanyAppointment, 'id' | 'createdAt'>) => {
    const newAppointment: CompanyAppointment = {
      ...item,
      id: `apt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };
    setAppointments(prev => [newAppointment, ...prev]);
    syncAppointmentToCloud(newAppointment);
    addAuditLog('Novo Agendamento', `Agendamento criado: ${item.title} (${item.type}) em ${item.startDate} às ${item.startTime}`);
  };

  const updateAppointment = (id: string, updates: Partial<CompanyAppointment>) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        const updated = { ...a, ...updates, updatedAt: new Date().toISOString() };
        syncAppointmentToCloud(updated);
        return updated;
      }
      return a;
    }));
    addAuditLog('Atualização de Agendamento', `Agendamento atualizado.`);
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    deleteAppointmentFromCloud(id);
    addAuditLog('Exclusão de Agendamento', `Agendamento excluído da agenda.`);
  };

  const clearAllSystemData = () => {
    setClients([]);
    setSuppliers([]);
    setProducts([]);
    setStockMovements([]);
    setServiceOrders([]);
    setDirectSales([]);
    setAppointments([]);
    setCustomerTickets([]);
    setEmployees([]);
    setVehicles([]);
    setVehicleExpenses([]);
    setGeneralExpenses([]);
    setSetupCosts([]);
    setServiceCatalog([]);
    setChecklistTemplates([]);
    setPagBankTransactions([]);
    setCashSessions([]);
    setCashMovements([]);
    setPaymentReceipts([]);
    setAuditLogs([]);
    setActiveReceiptModal(null);
    dismissedAutoExpenseIdsRef.current.clear();
    setSelectedMonthYear(getCurrentMonthYear());
    setSequenceSettings({
      serviceOrderNextNumber: 1,
      serviceOrderPrefix: '',
      serviceOrderDigits: 0,
      saleNextNumber: 1,
      salePrefix: 'VD-',
      saleDigits: 0,
      budgetNextNumber: 1,
      budgetPrefix: 'ORC-',
      budgetDigits: 0
    });
    clearAllCloudCollections();
    broadcastSync('FULL');
  };

  // Live Lookups: ViaCEP
  const lookupCep = async (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return null;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (data.erro) return null;
      return {
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || ''
      };
    } catch {
      // Fallback standard response for offline/mock
      return {
        street: 'Avenida Principal dos Serviços',
        neighborhood: 'Bairro Industrial',
        city: 'São Paulo',
        state: 'SP'
      };
    }
  };

  // Live Lookups: CNPJ via BrasilAPI / Receita Federal
  const lookupCnpj = async (cnpj: string) => {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return null;
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
      if (res.ok) {
        const data = await res.json();
        return {
          name: data.razao_social || data.nome_fantasia || '',
          tradeName: data.nome_fantasia || '',
          phone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.slice(0, 2)}) ${data.ddd_telefone_1.slice(2)}` : '',
          email: data.email || '',
          cep: data.cep || '',
          street: data.logradouro || '',
          number: data.numero || '',
          neighborhood: data.bairro || '',
          city: data.municipio || '',
          state: data.uf || ''
        };
      }
    } catch (err) {
      console.warn('Erro ao consultar BrasilAPI para CNPJ:', err);
    }
    return null;
  };

  // Parser for NF-e XML that prepares staging data with De-Para, conversion, ICMSTot charges, and duplicatas
  const parseNFeXml = (xmlContent: string): { success: boolean; message: string; parsedNFe?: ParsedXmlNFe } => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

      const parseError = xmlDoc.getElementsByTagName('parsererror');
      if (parseError.length > 0) {
        return { success: false, message: 'Arquivo XML inválido ou formato incompatível.' };
      }

      const getTagText = (parent: Document | Element | undefined, tag: string): string => {
        if (!parent) return '';
        return parent.getElementsByTagName(tag)[0]?.textContent?.trim() || '';
      };

      const getTagNumber = (parent: Document | Element | undefined, tag: string, fallback = 0): number => {
        const raw = getTagText(parent, tag).replace(',', '.');
        const parsed = parseFloat(raw);
        return Number.isFinite(parsed) ? parsed : fallback;
      };

      // Identificação NF-e
      const ideEl = xmlDoc.getElementsByTagName('ide')[0] || xmlDoc;
      const nNF = getTagText(ideEl, 'nNF') || `NFE-${Math.floor(10000 + Math.random() * 90000)}`;
      const serie = getTagText(ideEl, 'serie') || '1';
      let chNFe = getTagText(xmlDoc, 'chNFe');
      if (!chNFe) {
        const infNFe = xmlDoc.getElementsByTagName('infNFe')[0];
        if (infNFe && infNFe.getAttribute('Id')) {
          chNFe = infNFe.getAttribute('Id')!.replace(/^NFe/i, '');
        }
      }
      const rawEmission =
        getTagText(ideEl, 'dhEmi') ||
        getTagText(ideEl, 'dEmi') ||
        new Date().toISOString().split('T')[0];
      const emissionDate = rawEmission.slice(0, 10);

      // Emitente / Fornecedor
      const emitEl = xmlDoc.getElementsByTagName('emit')[0];
      const emitNome = getTagText(emitEl || xmlDoc, 'xNome') || 'Fornecedor Identificado NF-e';
      const emitFant = getTagText(emitEl || xmlDoc, 'xFant') || '';
      const emitCNPJ =
        getTagText(emitEl || xmlDoc, 'CNPJ') ||
        getTagText(emitEl || xmlDoc, 'CPF') ||
        '';

      const enderEmit = emitEl?.getElementsByTagName('enderEmit')[0] || xmlDoc.getElementsByTagName('enderEmit')[0];
      const xLgr = getTagText(enderEmit, 'xLgr') || 'Rua do Fornecedor';
      const nro = getTagText(enderEmit, 'nro') || 'S/N';
      const xBairro = getTagText(enderEmit, 'xBairro') || '';
      const xMun = getTagText(enderEmit, 'xMun') || '';
      const UF = getTagText(enderEmit, 'UF') || '';
      const CEP = getTagText(enderEmit, 'CEP') || '';
      const fone = getTagText(enderEmit, 'fone') || '';

      const cleanCNPJ = emitCNPJ.replace(/\D/g, '');
      const existingSup = cleanCNPJ
        ? suppliers.find(s => s.cnpj.replace(/\D/g, '') === cleanCNPJ)
        : suppliers.find(s => s.name.trim().toLowerCase() === emitNome.trim().toLowerCase());

      const parsedSupplier: ParsedXmlSupplier = {
        cnpj: emitCNPJ,
        name: existingSup ? existingSup.name : emitNome,
        tradeName: existingSup?.tradeName || emitFant || '',
        phone: existingSup?.phone || fone,
        email: existingSup?.email || '',
        cep: existingSup?.cep || CEP,
        street: existingSup?.street || xLgr,
        number: existingSup?.number || nro,
        neighborhood: existingSup ? '' : xBairro,
        city: existingSup?.city || xMun,
        state: existingSup?.state || UF,
        isAlreadyRegistered: Boolean(existingSup),
        existingSupplierId: existingSup?.id,
        registerIfNew: !existingSup
      };

      // Totais de <total>/<ICMSTot>
      const totalEl = xmlDoc.getElementsByTagName('total')[0];
      const icmsTotEl = totalEl?.getElementsByTagName('ICMSTot')[0] || xmlDoc.getElementsByTagName('ICMSTot')[0];
      const xmlVProd = getTagNumber(icmsTotEl, 'vProd', 0);
      const xmlVFrete = getTagNumber(icmsTotEl, 'vFrete', 0);
      const xmlVSeg = getTagNumber(icmsTotEl, 'vSeg', 0);
      const xmlVOutro = getTagNumber(icmsTotEl, 'vOutro', 0);
      const xmlVDesc = getTagNumber(icmsTotEl, 'vDesc', 0);
      const xmlVNF = getTagNumber(icmsTotEl, 'vNF', 0);

      // Leitura dos itens (<det>/<prod>)
      const detElements = xmlDoc.getElementsByTagName('det');
      const rawItems: ParsedXmlItem[] = [];
      let sumItemsVProd = 0;
      let sumItemsVFrete = 0;
      let sumItemsVSeg = 0;
      let sumItemsVOutro = 0;
      let sumItemsVDesc = 0;

      for (let i = 0; i < detElements.length; i++) {
        const det = detElements[i];
        const prodEl = det.getElementsByTagName('prod')[0] || det;
        const cProd = getTagText(prodEl, 'cProd') || `PROD-XML-${i + 1}`;
        const rawEan = getTagText(prodEl, 'cEAN') || getTagText(prodEl, 'cEANTrib');
        const barcode = sanitizeBarcode(rawEan);
        const xProd = getTagText(prodEl, 'xProd') || `Produto NF-e ${i + 1}`;
        const ncm = getTagText(prodEl, 'NCM') || '8419.19.10';
        const qCom = Math.max(0.0001, getTagNumber(prodEl, 'qCom', 1));
        const vUnCom = getTagNumber(prodEl, 'vUnCom', 0);
        const vProd = getTagNumber(prodEl, 'vProd', round2(qCom * vUnCom));
        const uCom = (getTagText(prodEl, 'uCom') || 'UN').toUpperCase();

        const itemFreight = getTagNumber(prodEl, 'vFrete', 0);
        const itemInsurance = getTagNumber(prodEl, 'vSeg', 0);
        const itemOtherExpenses = getTagNumber(prodEl, 'vOutro', 0);
        const itemDiscount = getTagNumber(prodEl, 'vDesc', 0);

        sumItemsVProd = round2(sumItemsVProd + vProd);
        sumItemsVFrete = round2(sumItemsVFrete + itemFreight);
        sumItemsVSeg = round2(sumItemsVSeg + itemInsurance);
        sumItemsVOutro = round2(sumItemsVOutro + itemOtherExpenses);
        sumItemsVDesc = round2(sumItemsVDesc + itemDiscount);

        // Detecção automática ("De-Para") + Sugestões Inteligentes
        const reconciliation = detectProductReconciliation(
          { code: cProd, barcode, name: xProd },
          products,
          supplierProductMappings,
          { cnpj: emitCNPJ, name: parsedSupplier.name }
        );

        const matchedProd = reconciliation.matchedProduct;
        const memorized = reconciliation.memorizedMapping;

        // Sugestão de categoria para produtos novos
        const cleanName = xProd.toLowerCase();
        let category = 'Peças Gerais';
        if (cleanName.includes('boiler') || cleanName.includes('reservat') || cleanName.includes('solar')) {
          category = 'Reservatórios Térmicos';
        } else if (cleanName.includes('bomba') || cleanName.includes('motor') || cleanName.includes('pressuriz')) {
          category = 'Bombas e Motores';
        } else if (cleanName.includes('tubo') || cleanName.includes('válv') || cleanName.includes('valv') || cleanName.includes('conex')) {
          category = 'Tubulações e Conexões';
        } else if (cleanName.includes('relé') || cleanName.includes('resistên') || cleanName.includes('termost')) {
          category = 'Insumos Elétricos';
        }

        const defaultRetailMargin = 55;
        const defaultWholesaleMargin = 35;
        const initialFactor =
          memorized && memorized.conversionFactor > 0 ? memorized.conversionFactor : 1;
        const initialStockUnit =
          matchedProd?.unit || memorized?.stockUnit || uCom || 'UN';

        rawItems.push({
          id: `xml-item-${Date.now()}-${i}`,
          selectedToImport: true,
          action: matchedProd ? 'link_existing' : 'create_new',
          code: cProd,
          barcode: barcode || undefined,
          name: xProd,
          ncm,
          quantity: qCom,
          unit: uCom,
          stockUnit: initialStockUnit,
          conversionFactor: initialFactor,
          costPrice: vUnCom,
          totalCost: vProd,
          itemFreight,
          itemInsurance,
          itemOtherExpenses,
          itemDiscount,
          category: matchedProd?.category || category,
          retailMarginPercent: defaultRetailMargin,
          retailPrice: 0,
          updateRetailPrice: !matchedProd,
          wholesaleMarginPercent: defaultWholesaleMargin,
          wholesalePrice: 0,
          updateWholesalePrice: !matchedProd,
          updateStock: true,
          isNewProduct: !matchedProd,
          existingProductId: matchedProd?.id,
          existingCurrentStock: matchedProd?.currentStock,
          existingCostPrice: matchedProd?.costPrice,
          existingRetailPrice: matchedProd?.retailPrice,
          existingWholesalePrice: matchedProd?.wholesalePrice,
          matchSource:
            reconciliation.matchSource !== 'none'
              ? reconciliation.matchSource
              : reconciliation.suggestedMatches.length > 0
              ? 'similarity'
              : 'none',
          suggestedMatches: reconciliation.suggestedMatches,
          memorizedMappingId: memorized?.id,
        });
      }

      const freightTotal = xmlVFrete > 0 ? xmlVFrete : sumItemsVFrete;
      const insuranceTotal = xmlVSeg > 0 ? xmlVSeg : sumItemsVSeg;
      const otherExpensesTotal = xmlVOutro > 0 ? xmlVOutro : sumItemsVOutro;
      const discountTotal = xmlVDesc > 0 ? xmlVDesc : sumItemsVDesc;
      const productsTotal = xmlVProd > 0 ? xmlVProd : sumItemsVProd;

      // Calcula rateio inicial e preços sugeridos com base no custo efetivo convertido
      const alloc = recalculateImportItems(
        rawItems,
        { freightTotal, insuranceTotal, otherExpensesTotal, discountTotal },
        'proportional_value'
      );

      const finalizedItems = alloc.items.map((item) => {
        const baseCost = item.effectiveUnitCost ?? item.costPrice;
        return {
          ...item,
          retailPrice: round2(baseCost * (1 + item.retailMarginPercent / 100)),
          wholesalePrice: round2(baseCost * (1 + item.wholesaleMarginPercent / 100)),
        };
      });

      const finalTotal = xmlVNF > 0 ? xmlVNF : alloc.grandTotal;

      // Leitura de pagamento (<pag>/<detPag>) e cobrança/duplicatas (<cobr>/<fat>/<dup>)
      const detPagEl = xmlDoc.getElementsByTagName('detPag')[0];
      const xmlPaymentCode = getTagText(detPagEl || xmlDoc, 'tPag');
      const paymentMethod = mapNFePaymentCodeToMethod(xmlPaymentCode);

      const dupElements = xmlDoc.getElementsByTagName('dup');
      const xmlInstallments: ImportFinancialInstallment[] = [];
      for (let i = 0; i < dupElements.length; i++) {
        const dup = dupElements[i];
        const nDup = getTagText(dup, 'nDup') || String(i + 1).padStart(3, '0');
        const dVenc = getTagText(dup, 'dVenc') || emissionDate;
        const vDup = getTagNumber(dup, 'vDup', 0);
        if (vDup > 0) {
          xmlInstallments.push({
            id: `dup-${Date.now()}-${i}`,
            number: nDup,
            dueDate: dVenc.slice(0, 10),
            amount: round2(vDup),
          });
        }
      }

      const xmlHasDuplicates = xmlInstallments.length > 0;
      const isCashLike = ['01', '04', '17', '20'].includes(xmlPaymentCode);
      const initialInstallments = xmlHasDuplicates
        ? xmlInstallments
        : buildQuickInstallments(finalTotal, emissionDate, isCashLike ? 'vista_hoje' : '30d');

      const parsedNFe: ParsedXmlNFe = {
        nNF,
        serie,
        chNFe: chNFe || undefined,
        emissionDate,
        productsTotal,
        freightTotal,
        insuranceTotal,
        otherExpensesTotal,
        discountTotal,
        totalValue: finalTotal,
        xmlOriginalTotalValue: xmlVNF > 0 ? xmlVNF : undefined,
        allocationMode: 'proportional_value',
        costUpdateMode: 'effective_unit',
        supplier: parsedSupplier,
        items: finalizedItems,
        importProducts: true,
        createAccountPayable: false,
        financialMode: 'none',
        installments: initialInstallments,
        xmlHasDuplicates,
        paymentMethod,
        xmlPaymentCode: xmlPaymentCode || undefined,
        expenseCategory: 'compra_produtos_xml',
        initialPaymentStatus: isCashLike ? 'pago' : 'pendente',
        linkedExpenseId: undefined,
      };

      const linkedAutoCount = finalizedItems.filter((it) => it.action === 'link_existing').length;

      return {
        success: true,
        message: `NF-e ${nNF} lida com sucesso! ${finalizedItems.length} item(ns) (${linkedAutoCount} conciliado(s) automaticamente via De-Para).`,
        parsedNFe,
      };
    } catch (err: any) {
      return { success: false, message: 'Erro ao analisar arquivo XML: ' + (err.message || 'formato inválido') };
    }
  };

  // Commit unificado para NF-e XML e Importação Universal de Estoque
  const commitImportNFe = (
    confirmedNFe: ParsedXmlNFe,
    options?: {
      source?: 'nfe_xml' | 'universal_import';
      referenceLabel?: string;
      skipCostOnNew?: boolean;
    }
  ) => {
    try {
      const importSource = options?.source || 'nfe_xml';
      const importRecordId = `imp-${Date.now()}`;
      const referenceCode =
        options?.referenceLabel ||
        (importSource === 'nfe_xml' ? `NF-e ${confirmedNFe.nNF}` : confirmedNFe.nNF || 'Importação Universal');

      let finalSupplierId = confirmedNFe.supplier.existingSupplierId;
      let finalSupplierName = confirmedNFe.supplier.name?.trim() || 'Fornecedor não informado';
      let supplierRegisteredNow = false;

      // 1. Cadastra Fornecedor apenas se não estiver cadastrado e o usuário marcou esta opção
      if (
        !confirmedNFe.supplier.isAlreadyRegistered &&
        confirmedNFe.supplier.registerIfNew &&
        confirmedNFe.supplier.name?.trim()
      ) {
        const newSup: Supplier = {
          id: `sup-${Date.now()}`,
          name: confirmedNFe.supplier.name.trim(),
          tradeName: confirmedNFe.supplier.tradeName?.trim() || undefined,
          cnpj: confirmedNFe.supplier.cnpj?.trim() || '',
          email: confirmedNFe.supplier.email?.trim() || 'fornecedor@contato.com.br',
          phone: confirmedNFe.supplier.phone?.trim() || '',
          contactPerson: 'Cadastro Automático Importação',
          cep: confirmedNFe.supplier.cep?.trim() || '',
          street: confirmedNFe.supplier.street?.trim() || '',
          number: confirmedNFe.supplier.number?.trim() || '',
          city: confirmedNFe.supplier.city?.trim() || '',
          state: confirmedNFe.supplier.state?.trim().toUpperCase() || '',
          notes: `Cadastrado automaticamente na importação ${referenceCode}`
        };
        setSuppliers(prev => [newSup, ...prev]);
        syncSupplierToCloud(newSup);
        finalSupplierId = newSup.id;
        finalSupplierName = newSup.name;
        supplierRegisteredNow = true;
        addAuditLog('Novo Fornecedor', `Fornecedor ${newSup.name} cadastrado via ${referenceCode}.`);
      }

      // 2. Recalcula rateio/conversão final para garantir consistência absoluta
      const allocationMode = confirmedNFe.allocationMode || 'proportional_value';
      const costUpdateMode = confirmedNFe.costUpdateMode || 'effective_unit';
      const recalculated = recalculateImportItems(
        confirmedNFe.items,
        {
          freightTotal: confirmedNFe.freightTotal || 0,
          insuranceTotal: confirmedNFe.insuranceTotal || 0,
          otherExpensesTotal: confirmedNFe.otherExpensesTotal || 0,
          discountTotal: confirmedNFe.discountTotal || 0,
        },
        allocationMode
      );

      const shouldImportProducts = confirmedNFe.importProducts !== false;
      const activeItems = shouldImportProducts
        ? recalculated.items.filter(it => it.action !== 'ignore' && it.selectedToImport !== false)
        : [];
      const ignoredCount = confirmedNFe.items.length - activeItems.length;

      let updatedCount = 0;
      let newCount = 0;
      let stockEntriesCount = 0;
      const newMovements: StockMovement[] = [];
      const changedProductsForCloud: Product[] = [];
      const mappingsToUpsert: SupplierProductMapping[] = [];
      const createdProductIds: string[] = [];
      const itemsSnapshot: StockImportItemSnapshot[] = [];
      const supplierKey = buildSupplierKey(confirmedNFe.supplier.cnpj, finalSupplierName);
      const nowIso = new Date().toISOString();
      const todayIso = nowIso.split('T')[0];

      // Registra itens ignorados no snapshot para auditoria completa
      recalculated.items.forEach((item) => {
        const isIgnored = !shouldImportProducts || item.action === 'ignore' || item.selectedToImport === false;
        if (isIgnored) {
          const factor = Number(item.conversionFactor) > 0 ? Number(item.conversionFactor) : 1;
          itemsSnapshot.push({
            itemId: item.id,
            action: 'ignore',
            productId: item.existingProductId,
            productCode: item.code || '',
            productName: item.name,
            supplierItemCode: item.code || '',
            supplierItemDescription: item.name,
            barcode: item.barcode,
            supplierUnit: item.unit || 'UN',
            stockUnit: item.stockUnit || item.unit || 'UN',
            importedQuantity: Number(item.quantity) || 0,
            conversionFactor: factor,
            convertedQuantity: round4((Number(item.quantity) || 0) * factor),
            unitCostSupplier: Number(item.costPrice) || 0,
            grossTotal: Number(item.totalCost) || 0,
            allocatedFreight: 0,
            allocatedInsurance: 0,
            allocatedOtherExpenses: 0,
            allocatedDiscount: 0,
            effectiveTotal: 0,
            effectiveUnitCost: 0,
            previousCost: item.existingCostPrice ?? 0,
            newCost: item.existingCostPrice ?? 0,
            previousStock: item.existingCurrentStock ?? 0,
            newStock: item.existingCurrentStock ?? 0,
            stockAdded: false,
            wasCreatedInImport: false,
            matchSource: item.matchSource,
          });
        }
      });

      if (activeItems.length > 0) {
        let workingProducts = [...products];

        activeItems.forEach((item, idx) => {
          const factor = Number(item.conversionFactor) > 0 ? Number(item.conversionFactor) : 1;
          const convertedQty = round4((Number(item.quantity) || 0) * factor);
          const effectiveUnitCost =
            item.effectiveUnitCost !== undefined && Number.isFinite(item.effectiveUnitCost)
              ? item.effectiveUnitCost
              : round4((item.costPrice || 0) / factor);

          const effectiveAction = item.action || (item.existingProductId ? 'link_existing' : 'create_new');

          let targetExisting: Product | undefined;
          if (effectiveAction === 'link_existing') {
            if (item.existingProductId) {
              targetExisting = workingProducts.find(p => p.id === item.existingProductId);
            }
            if (!targetExisting && item.barcode) {
              const cleanBc = sanitizeBarcode(item.barcode);
              if (cleanBc) {
                targetExisting = workingProducts.find(p => sanitizeBarcode(p.barcode) === cleanBc);
              }
            }
          }

          let finalProductId = '';
          let finalProductCode = item.code || '';
          let finalProductName = item.name;
          let finalStockUnit = item.stockUnit || item.unit || 'UN';
          let previousCost = 0;
          let newCostFinal = 0;
          let previousStock = 0;
          let newStockFinal = 0;
          let wasCreatedInImport = false;

          if (effectiveAction === 'link_existing' && targetExisting) {
            previousCost = Number(targetExisting.costPrice) || 0;
            previousStock = Number(targetExisting.currentStock) || 0;
            const newCostPrice = computeUpdatedProductCost(
              targetExisting,
              convertedQty,
              effectiveUnitCost,
              costUpdateMode
            );
            const newStock = item.updateStock
              ? round4(previousStock + convertedQty)
              : previousStock;

            // NUNCA sobrescreve targetExisting.name com a descrição do fornecedor!
            const updatedProd: Product = {
              ...targetExisting,
              barcode: targetExisting.barcode || item.barcode || undefined,
              costPrice: newCostPrice,
              retailPrice: item.updateRetailPrice ? round2(item.retailPrice) : targetExisting.retailPrice,
              wholesalePrice: item.updateWholesalePrice ? round2(item.wholesalePrice) : targetExisting.wholesalePrice,
              currentStock: newStock,
              ncm: targetExisting.ncm || item.ncm || '',
            };

            workingProducts = workingProducts.map(p => (p.id === targetExisting!.id ? updatedProd : p));
            changedProductsForCloud.push(updatedProd);
            finalProductId = updatedProd.id;
            finalProductCode = updatedProd.code;
            finalProductName = updatedProd.name;
            finalStockUnit = updatedProd.unit || finalStockUnit;
            newCostFinal = newCostPrice;
            newStockFinal = newStock;
            updatedCount++;
          } else {
            const newCost = options?.skipCostOnNew ? 0 : round2(effectiveUnitCost);
            const newStock = item.updateStock ? convertedQty : 0;
            const newProd: Product = {
              id: `prod-${Date.now()}-${idx}`,
              code: item.code || `IMP-${Date.now().toString().slice(-4)}-${idx + 1}`,
              barcode: item.barcode || undefined,
              name: item.name,
              brand: item.brand || undefined,
              category: item.category || 'Peças Gerais',
              subcategory: item.subcategory || undefined,
              costPrice: newCost,
              profitMarginPercent: item.retailMarginPercent,
              retailPrice: item.updateRetailPrice ? round2(item.retailPrice) : 0,
              wholesalePrice: item.updateWholesalePrice ? round2(item.wholesalePrice) : 0,
              currentStock: newStock,
              minStock: 2,
              unit: item.stockUnit || item.unit || 'UN',
              ncm: item.ncm || '',
              icmsRate: 12.0,
              pisRate: 1.65,
              cofinsRate: 7.6,
            };
            workingProducts = [newProd, ...workingProducts];
            changedProductsForCloud.push(newProd);
            createdProductIds.push(newProd.id);
            finalProductId = newProd.id;
            finalProductCode = newProd.code;
            finalProductName = newProd.name;
            finalStockUnit = newProd.unit;
            previousCost = 0;
            newCostFinal = newCost;
            previousStock = 0;
            newStockFinal = newStock;
            wasCreatedInImport = true;
            newCount++;
          }

          itemsSnapshot.push({
            itemId: item.id,
            action: wasCreatedInImport ? 'create_new' : 'link_existing',
            productId: finalProductId,
            productCode: finalProductCode,
            productName: finalProductName,
            supplierItemCode: item.code || '',
            supplierItemDescription: item.name,
            barcode: item.barcode,
            supplierUnit: item.unit || 'UN',
            stockUnit: finalStockUnit,
            importedQuantity: Number(item.quantity) || 0,
            conversionFactor: factor,
            convertedQuantity: convertedQty,
            unitCostSupplier: Number(item.costPrice) || 0,
            grossTotal: Number(item.totalCost) || 0,
            allocatedFreight: item.allocatedFreight || 0,
            allocatedInsurance: item.allocatedInsurance || 0,
            allocatedOtherExpenses: item.allocatedOtherExpenses || 0,
            allocatedDiscount: item.allocatedDiscount || 0,
            effectiveTotal: item.effectiveTotal ?? item.totalCost,
            effectiveUnitCost: round4(effectiveUnitCost),
            previousCost: round2(previousCost),
            newCost: round2(newCostFinal),
            previousStock: round4(previousStock),
            newStock: round4(newStockFinal),
            stockAdded: Boolean(item.updateStock && convertedQty > 0),
            wasCreatedInImport,
            matchSource: item.matchSource,
          });

          // Memoriza vínculo [Fornecedor + Código/Descrição do Item] -> { productId, conversionFactor, supplierUnit }
          if (finalProductId && (item.code || item.name)) {
            const supplierItemKey = buildSupplierItemKey(supplierKey, item.code, item.name);
            mappingsToUpsert.push({
              id: `map-${Date.now()}-${idx}`,
              supplierKey,
              supplierId: finalSupplierId,
              supplierCnpj: confirmedNFe.supplier.cnpj || undefined,
              supplierName: finalSupplierName,
              supplierItemCode: item.code || '',
              supplierItemDescription: item.name,
              supplierItemKey,
              productId: finalProductId,
              conversionFactor: factor,
              supplierUnit: item.unit || 'UN',
              stockUnit: finalStockUnit,
              updatedAt: nowIso,
            });
          }

          // Registra Kardex com quantidade convertida e custo efetivo na unidade do estoque
          if (item.updateStock && convertedQty > 0) {
            stockEntriesCount++;
            const convNote =
              factor !== 1 || (item.unit && item.unit !== finalStockUnit)
                ? `Conv: ${formatQuantityClean(item.quantity)} ${item.unit || 'UN'} × ${factor} = +${formatQuantityClean(convertedQty)} ${finalStockUnit}`
                : `Entrada: +${formatQuantityClean(convertedQty)} ${finalStockUnit}`;
            newMovements.push({
              id: `sm-${Date.now()}-${idx}`,
              productId: finalProductId,
              productName: finalProductName,
              type: importSource === 'nfe_xml' ? 'entrada_xml' : 'entrada_manual',
              quantity: convertedQty,
              unitCost: round2(effectiveUnitCost),
              date: todayIso,
              referenceDoc: `${referenceCode} (${finalSupplierName})`,
              notes: `${convNote} | Custo efetivo: ${formatBRL(effectiveUnitCost)}/${finalStockUnit}`,
              importRecordId,
              supplierUnit: item.unit || 'UN',
              conversionFactor: factor,
              supplierQuantity: item.quantity,
            });
          }
        });

        setProducts(workingProducts);
        changedProductsForCloud.forEach(p => {
          syncProductToCloud(p);
          if (p.category) addProductCategory(p.category);
          if (p.subcategory) addProductSubcategory(p.subcategory);
          if (p.brand) addProductBrand(p.brand);
        });
      }

      if (newMovements.length > 0) {
        setStockMovements(prev => [...newMovements, ...prev]);
      }

      // Persiste vínculos De-Para memorizados (substituindo por supplierItemKey quando já existir)
      if (mappingsToUpsert.length > 0) {
        setSupplierProductMappings(prev => {
          const mapByKey = new Map<string, SupplierProductMapping>();
          prev.forEach(m => mapByKey.set(m.supplierItemKey, m));
          mappingsToUpsert.forEach(m => {
            const existingMap = mapByKey.get(m.supplierItemKey);
            mapByKey.set(m.supplierItemKey, existingMap ? { ...m, id: existingMap.id } : m);
          });
          return Array.from(mapByKey.values());
        });
      }

      // 3. Integração Financeira Seletiva ('none' | 'create_new' | 'link_existing')
      const financialMode =
        confirmedNFe.financialMode || (confirmedNFe.createAccountPayable ? 'create_new' : 'none');

      const grandTotal = recalculated.grandTotal > 0 ? recalculated.grandTotal : confirmedNFe.totalValue;
      const linkedExpenseIds: string[] = [];
      const generatedExpenseIds: string[] = [];
      let financialActionSummary = 'Sem financeiro';

      if (financialMode === 'create_new') {
        const rawInstallments =
          confirmedNFe.installments && confirmedNFe.installments.length > 0
            ? confirmedNFe.installments.filter(inst => Number(inst.amount) > 0)
            : grandTotal > 0
            ? [
                {
                  id: `inst-${Date.now()}-1`,
                  number: '001',
                  dueDate: confirmedNFe.emissionDate || todayIso,
                  amount: grandTotal,
                },
              ]
            : [];

        if (rawInstallments.length > 0) {
          const isPaidInitially = confirmedNFe.initialPaymentStatus === 'pago';
          const createdExpenses: GeneralExpense[] = rawInstallments.map((inst, idx) => {
            const expId = `ge-${Date.now()}-${idx}`;
            linkedExpenseIds.push(expId);
            generatedExpenseIds.push(expId);
            const parcelTag =
              rawInstallments.length > 1
                ? ` - Dup. ${inst.number || idx + 1} (${idx + 1}/${rawInstallments.length})`
                : '';
            return {
              id: expId,
              category: confirmedNFe.expenseCategory || 'compra_produtos_xml',
              description: `Compra Estoque ${referenceCode}${parcelTag} (${finalSupplierName})`,
              cost: round2(inst.amount),
              dueDate: inst.dueDate || todayIso,
              paymentDate: isPaidInitially ? (confirmedNFe.emissionDate || todayIso) : undefined,
              isPaid: isPaidInitially,
              supplierId: finalSupplierId,
              supplier: finalSupplierName,
              invoiceNumber: referenceCode,
              isRecurring: false,
              paymentMethod: confirmedNFe.paymentMethod || 'boleto',
              emissionDate: confirmedNFe.emissionDate || todayIso,
              installmentLabel: inst.number || `${idx + 1}/${rawInstallments.length}`,
              linkedStockImportId: importRecordId,
              linkedStockImportRef: referenceCode,
            };
          });

          setGeneralExpenses(prev => [...createdExpenses, ...prev]);
          const sumExp = round2(createdExpenses.reduce((acc, e) => acc + e.cost, 0));
          financialActionSummary = `${createdExpenses.length} título(s) gerado(s) (${formatBRL(sumExp)})`;
        }
      } else if (financialMode === 'link_existing' && confirmedNFe.linkedExpenseId) {
        const targetExp = generalExpenses.find(e => e.id === confirmedNFe.linkedExpenseId);
        if (targetExp) {
          setGeneralExpenses(prev =>
            prev.map(e =>
              e.id === targetExp.id
                ? {
                    ...e,
                    linkedStockImportId: importRecordId,
                    linkedStockImportRef: referenceCode,
                  }
                : e
            )
          );
          linkedExpenseIds.push(targetExp.id);
          financialActionSummary = `Vinculado à despesa existente (${formatBRL(targetExp.cost)})`;
        }
      }

      if (
        !supplierRegisteredNow &&
        newCount === 0 &&
        updatedCount === 0 &&
        linkedExpenseIds.length === 0
      ) {
        return {
          success: false,
          message: 'Nenhuma opção ou produto ativo foi selecionado para importação.',
          updatedProductsCount: 0,
          newProductsCount: 0,
          ignoredProductsCount: ignoredCount,
          supplierName: finalSupplierName,
        };
      }

      // 4. Salva registro estruturado completo da importação (com snapshot de auditoria e reversão)
      const importRecord: StockImportRecord = {
        id: importRecordId,
        source: importSource,
        status: 'concluida',
        referenceCode,
        supplierId: finalSupplierId,
        supplierName: finalSupplierName,
        supplierCnpj: confirmedNFe.supplier.cnpj || undefined,
        emissionDate: confirmedNFe.emissionDate || todayIso,
        importedAt: nowIso,
        itemsCount: confirmedNFe.items.length,
        linkedCount: updatedCount,
        createdCount: newCount,
        ignoredCount,
        productsTotal: recalculated.activeProductsTotal,
        freightTotal: confirmedNFe.freightTotal || 0,
        insuranceTotal: confirmedNFe.insuranceTotal || 0,
        otherExpensesTotal: confirmedNFe.otherExpensesTotal || 0,
        discountTotal: confirmedNFe.discountTotal || 0,
        grandTotal,
        allocationMode,
        costUpdateMode,
        financialMode,
        financialStatusSummary: financialActionSummary,
        linkedExpenseIds,
        generatedExpenseIds,
        createdProductIds,
        itemsSnapshot,
      };
      setStockImportRecords(prev => [importRecord, ...prev]);

      const partsSummary: string[] = [];
      if (newCount > 0 || updatedCount > 0) {
        partsSummary.push(`${newCount} novo(s) e ${updatedCount} conciliado(s) via De-Para`);
      }
      if (ignoredCount > 0) {
        partsSummary.push(`${ignoredCount} ignorado(s)`);
      }
      if (stockEntriesCount > 0) {
        partsSummary.push(`estoque somado em ${stockEntriesCount} item(ns)`);
      } else if (newCount > 0 || updatedCount > 0) {
        partsSummary.push('sem alteração de saldo');
      }
      if (supplierRegisteredNow) {
        partsSummary.push('fornecedor cadastrado');
      }
      partsSummary.push(financialActionSummary);

      addAuditLog(
        importSource === 'nfe_xml' ? 'Importação NF-e (De-Para)' : 'Importação Universal Estoque',
        `${referenceCode}: ${partsSummary.join(' · ')}.`
      );

      return {
        success: true,
        message: `Importação ${referenceCode} concluída! (${partsSummary.join(' · ')}).`,
        updatedProductsCount: updatedCount,
        newProductsCount: newCount,
        ignoredProductsCount: ignoredCount,
        supplierName: finalSupplierName,
        importRecordId,
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Erro ao gravar importação de estoque: ' + (err.message || 'falha no processamento'),
        updatedProductsCount: 0,
        newProductsCount: 0,
        supplierName: confirmedNFe.supplier.name,
      };
    }
  };

  // CRUD de Vínculos de Fornecedores (De-Para) — reflete imediatamente no motor de importação
  const addSupplierProductMapping = (
    mapping: Omit<SupplierProductMapping, 'id' | 'supplierKey' | 'supplierItemKey' | 'updatedAt'>
  ): SupplierProductMapping => {
    const supplierKey = buildSupplierKey(mapping.supplierCnpj, mapping.supplierName);
    const supplierItemKey = buildSupplierItemKey(
      supplierKey,
      mapping.supplierItemCode,
      mapping.supplierItemDescription
    );
    const nowIso = new Date().toISOString();
    const targetProd = products.find(p => p.id === mapping.productId);
    const created: SupplierProductMapping = {
      ...mapping,
      id: `map-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      supplierKey,
      supplierItemKey,
      conversionFactor: Number(mapping.conversionFactor) > 0 ? Number(mapping.conversionFactor) : 1,
      supplierUnit: (mapping.supplierUnit || 'UN').trim().toUpperCase(),
      stockUnit: (mapping.stockUnit || targetProd?.unit || 'UN').trim().toUpperCase(),
      updatedAt: nowIso,
    };

    setSupplierProductMappings(prev => {
      const existingByKey = prev.find(m => m.supplierItemKey === supplierItemKey);
      if (existingByKey) {
        return prev.map(m =>
          m.id === existingByKey.id ? { ...created, id: existingByKey.id } : m
        );
      }
      return [created, ...prev];
    });

    addAuditLog(
      'Vínculo De-Para Criado',
      `Vínculo ${mapping.supplierName} (${mapping.supplierItemCode || mapping.supplierItemDescription}) → ${targetProd?.name || mapping.productId} (fator ${created.conversionFactor}).`
    );
    return created;
  };

  const updateSupplierProductMapping = (
    id: string,
    updates: Partial<Omit<SupplierProductMapping, 'id'>>
  ) => {
    setSupplierProductMappings(prev =>
      prev.map(m => {
        if (m.id !== id) return m;
        const nextSupplierName = updates.supplierName ?? m.supplierName;
        const nextSupplierCnpj = updates.supplierCnpj ?? m.supplierCnpj;
        const nextItemCode = updates.supplierItemCode ?? m.supplierItemCode;
        const nextItemDesc = updates.supplierItemDescription ?? m.supplierItemDescription;
        const nextProductId = updates.productId ?? m.productId;
        const prod = products.find(p => p.id === nextProductId);
        const supplierKey = buildSupplierKey(nextSupplierCnpj, nextSupplierName);
        const supplierItemKey = buildSupplierItemKey(supplierKey, nextItemCode, nextItemDesc);
        return {
          ...m,
          ...updates,
          supplierKey,
          supplierItemKey,
          conversionFactor:
            updates.conversionFactor !== undefined && Number(updates.conversionFactor) > 0
              ? Number(updates.conversionFactor)
              : m.conversionFactor,
          supplierUnit: (updates.supplierUnit ?? m.supplierUnit ?? 'UN').trim().toUpperCase(),
          stockUnit: (updates.stockUnit ?? prod?.unit ?? m.stockUnit ?? 'UN').trim().toUpperCase(),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const deleteSupplierProductMapping = (id: string) => {
    const target = supplierProductMappings.find(m => m.id === id);
    setSupplierProductMappings(prev => prev.filter(m => m.id !== id));
    if (target) {
      addAuditLog(
        'Vínculo De-Para Removido',
        `Removido vínculo de ${target.supplierName} (${target.supplierItemCode || target.supplierItemDescription}).`
      );
    }
  };

  // Análise de segurança e impacto antes de Desfazer uma Importação
  const analyzeUndoStockImport = (importId: string): StockImportUndoAnalysis => {
    const record = stockImportRecords.find(r => r.id === importId);
    if (!record) {
      return {
        canUndo: false,
        reason: 'Registro de importação não encontrado.',
        stockReversals: [],
        createdProductsStatus: [],
        generatedExpenses: [],
        linkedExistingExpenses: [],
        paidGeneratedCount: 0,
      };
    }
    if (record.status === 'desfeita') {
      return {
        canUndo: false,
        reason: 'Esta importação já foi desfeita anteriormente.',
        record,
        stockReversals: [],
        createdProductsStatus: [],
        generatedExpenses: [],
        linkedExistingExpenses: [],
        paidGeneratedCount: 0,
      };
    }

    const snapshots = record.itemsSnapshot || [];
    const reversalByProduct = new Map<string, number>();

    snapshots.forEach(snap => {
      if (snap.action !== 'ignore' && snap.stockAdded && snap.productId && snap.convertedQuantity > 0) {
        reversalByProduct.set(
          snap.productId,
          round4((reversalByProduct.get(snap.productId) || 0) + snap.convertedQuantity)
        );
      }
    });

    const stockReversals: StockImportUndoAnalysis['stockReversals'] = [];
    reversalByProduct.forEach((qtyToReverse, productId) => {
      const prod = products.find(p => p.id === productId);
      const snap = snapshots.find(s => s.productId === productId);
      const currentStock = prod ? Number(prod.currentStock) || 0 : 0;
      const rawProjected = round4(currentStock - qtyToReverse);
      stockReversals.push({
        productId,
        productCode: prod?.code || snap?.productCode || '—',
        productName: prod?.name || snap?.productName || 'Produto removido',
        stockUnit: prod?.unit || snap?.stockUnit || 'UN',
        qtyToReverse,
        currentStock,
        projectedStock: Math.max(0, rawProjected),
        willClampAtZero: rawProjected < 0,
      });
    });

    const createdIds = Array.from(
      new Set([
        ...(record.createdProductIds || []),
        ...snapshots.filter(s => s.wasCreatedInImport && s.productId).map(s => s.productId!),
      ])
    );

    const createdProductsStatus: StockImportUndoAnalysis['createdProductsStatus'] = createdIds.map(
      productId => {
        const prod = products.find(p => p.id === productId);
        const snap = snapshots.find(s => s.productId === productId);
        const usageReasons: string[] = [];

        const externalMovements = stockMovements.filter(
          m => m.productId === productId && m.importRecordId !== record.id
        );
        if (externalMovements.length > 0) {
          usageReasons.push(`${externalMovements.length} movimentação(ões) externa(s) no Kardex`);
        }

        const usedInOrders = serviceOrders.filter(os =>
          (os.parts || []).some(pt => pt.productId === productId)
        );
        if (usedInOrders.length > 0) {
          usageReasons.push(`utilizado em ${usedInOrders.length} Ordem(ns) de Serviço`);
        }

        const usedInSales = directSales.filter(sale =>
          (sale.items || []).some(it => it.productId === productId)
        );
        if (usedInSales.length > 0) {
          usageReasons.push(`utilizado em ${usedInSales.length} Venda(s) Direta(s)`);
        }

        const usedInOtherImports = stockImportRecords.filter(
          other =>
            other.id !== record.id &&
            other.status === 'concluida' &&
            (other.itemsSnapshot || []).some(s => s.productId === productId && s.action !== 'ignore')
        );
        if (usedInOtherImports.length > 0) {
          usageReasons.push(`referenciado em ${usedInOtherImports.length} outra(s) importação(ões)`);
        }

        return {
          productId,
          productCode: prod?.code || snap?.productCode || '—',
          productName: prod?.name || snap?.productName || 'Produto',
          hasExternalUsage: usageReasons.length > 0,
          usageReasons,
        };
      }
    );

    const generatedIdSet = new Set(
      record.generatedExpenseIds && record.generatedExpenseIds.length > 0
        ? record.generatedExpenseIds
        : record.financialMode === 'create_new'
        ? record.linkedExpenseIds || []
        : []
    );

    const allLinkedIds = Array.from(
      new Set([...(record.linkedExpenseIds || []), ...Array.from(generatedIdSet)])
    );

    const generatedExpenses: StockImportUndoAnalysis['generatedExpenses'] = [];
    const linkedExistingExpenses: StockImportUndoAnalysis['linkedExistingExpenses'] = [];

    allLinkedIds.forEach(expId => {
      const exp = generalExpenses.find(e => e.id === expId);
      if (!exp) return;
      const entry = {
        id: exp.id,
        description: exp.description,
        cost: exp.cost,
        dueDate: exp.dueDate,
        isPaid: exp.isPaid,
      };
      if (generatedIdSet.has(expId)) {
        generatedExpenses.push(entry);
      } else {
        linkedExistingExpenses.push(entry);
      }
    });

    const paidGeneratedCount = generatedExpenses.filter(e => e.isPaid).length;

    return {
      canUndo: true,
      record,
      stockReversals,
      createdProductsStatus,
      generatedExpenses,
      linkedExistingExpenses,
      paidGeneratedCount,
    };
  };

  // Executa o Estorno / Desfazer Importação com segurança total
  const undoStockImport = (
    importId: string,
    options: {
      financialAction: 'delete_generated' | 'unlink_only';
      deleteUnusedCreatedProducts: boolean;
      restorePreviousCosts: boolean;
    }
  ): { success: boolean; message: string } => {
    const analysis = analyzeUndoStockImport(importId);
    if (!analysis.canUndo || !analysis.record) {
      return { success: false, message: analysis.reason || 'Não foi possível desfazer esta importação.' };
    }

    const record = analysis.record;
    const snapshots = record.itemsSnapshot || [];
    const nowIso = new Date().toISOString();
    const todayIso = nowIso.split('T')[0];

    const removableCreatedIds = new Set(
      options.deleteUnusedCreatedProducts
        ? analysis.createdProductsStatus
            .filter(cp => !cp.hasExternalUsage)
            .map(cp => cp.productId)
        : []
    );

    const blockedCreatedCount = options.deleteUnusedCreatedProducts
      ? analysis.createdProductsStatus.filter(cp => cp.hasExternalUsage).length
      : 0;

    // 1. Estorna saldos convertidos, restaura custos (se marcado) e remove produtos inéditos sem uso externo
    const reversalQtyMap = new Map<string, number>();
    const prevCostMap = new Map<string, number>();
    snapshots.forEach(snap => {
      if (snap.action === 'ignore' || !snap.productId) return;
      if (snap.stockAdded && snap.convertedQuantity > 0) {
        reversalQtyMap.set(
          snap.productId,
          round4((reversalQtyMap.get(snap.productId) || 0) + snap.convertedQuantity)
        );
      }
      if (!snap.wasCreatedInImport && !prevCostMap.has(snap.productId)) {
        prevCostMap.set(snap.productId, snap.previousCost);
      }
    });

    const undoMovements: StockMovement[] = [];
    const updatedForCloud: Product[] = [];
    const deletedForCloud: string[] = [];

    const nextProducts: Product[] = [];
    products.forEach((p, idx) => {
      if (removableCreatedIds.has(p.id)) {
        deletedForCloud.push(p.id);
        return; // exclui produto inédito sem movimentação externa
      }

      const qtyToSub = reversalQtyMap.get(p.id) || 0;
      const shouldRestoreCost = options.restorePreviousCosts && prevCostMap.has(p.id);

      if (qtyToSub > 0 || shouldRestoreCost) {
        const nextStock = Math.max(0, round4((p.currentStock || 0) - qtyToSub));
        const nextCost = shouldRestoreCost ? prevCostMap.get(p.id)! : p.costPrice;
        const updatedProd: Product = {
          ...p,
          currentStock: nextStock,
          costPrice: nextCost,
        };
        nextProducts.push(updatedProd);
        updatedForCloud.push(updatedProd);

        if (qtyToSub > 0) {
          undoMovements.push({
            id: `sm-undo-${Date.now()}-${idx}`,
            productId: p.id,
            productName: p.name,
            type: 'ajuste',
            quantity: -qtyToSub,
            unitCost: p.costPrice,
            date: todayIso,
            referenceDoc: `Estorno ${record.referenceCode}`,
            notes: `Estorno automático ao desfazer importação ${record.referenceCode} (-${formatQuantityClean(qtyToSub)} ${p.unit || 'UN'})`,
            importRecordId: record.id,
          });
        }
      } else {
        nextProducts.push(p);
      }
    });

    setProducts(nextProducts);
    updatedForCloud.forEach(p => syncProductToCloud(p));
    deletedForCloud.forEach(id => deleteProductFromCloud(id));

    if (undoMovements.length > 0) {
      setStockMovements(prev => [...undoMovements, ...prev]);
    }

    // Remove vínculos De-Para que apontavam para produtos excluídos no estorno
    if (deletedForCloud.length > 0) {
      const deletedSet = new Set(deletedForCloud);
      setSupplierProductMappings(prev => prev.filter(m => !deletedSet.has(m.productId)));
    }

    // 2. Trata lançamentos financeiros
    const generatedIdSet = new Set(analysis.generatedExpenses.map(e => e.id));
    const linkedExistingIdSet = new Set(analysis.linkedExistingExpenses.map(e => e.id));
    let financialSummary = 'nenhum lançamento financeiro afetado';

    if (generatedIdSet.size > 0 || linkedExistingIdSet.size > 0) {
      if (options.financialAction === 'delete_generated') {
        setGeneralExpenses(prev =>
          prev
            .filter(e => !generatedIdSet.has(e.id))
            .map(e =>
              linkedExistingIdSet.has(e.id)
                ? { ...e, linkedStockImportId: undefined, linkedStockImportRef: undefined }
                : e
            )
        );
        financialSummary =
          generatedIdSet.size > 0
            ? `${generatedIdSet.size} lançamento(s) gerado(s) excluído(s)${
                linkedExistingIdSet.size > 0 ? ` e ${linkedExistingIdSet.size} existente(s) desvinculado(s)` : ''
              }`
            : `${linkedExistingIdSet.size} lançamento(s) existente(s) desvinculado(s)`;
      } else {
        setGeneralExpenses(prev =>
          prev.map(e =>
            generatedIdSet.has(e.id) || linkedExistingIdSet.has(e.id)
              ? { ...e, linkedStockImportId: undefined, linkedStockImportRef: undefined }
              : e
          )
        );
        financialSummary = `${generatedIdSet.size + linkedExistingIdSet.size} lançamento(s) mantido(s) e desvinculado(s)`;
      }
    }

    // 3. Atualiza status da importação para 'desfeita'
    const undoNotesParts = [
      `Estoque estornado em ${undoMovements.length} produto(s)`,
      deletedForCloud.length > 0 ? `${deletedForCloud.length} produto(s) inédito(s) removido(s)` : '',
      blockedCreatedCount > 0 ? `${blockedCreatedCount} produto(s) novo(s) preservado(s) por já possuírem movimentação` : '',
      financialSummary,
    ].filter(Boolean);

    const undoNotes = undoNotesParts.join(' · ');

    setStockImportRecords(prev =>
      prev.map(r =>
        r.id === record.id
          ? {
              ...r,
              status: 'desfeita',
              undoneAt: nowIso,
              undoneBy: currentUser?.name || currentRole,
              undoFinancialAction:
                generatedIdSet.size === 0 && linkedExistingIdSet.size === 0
                  ? 'none'
                  : options.financialAction,
              undoNotes,
            }
          : r
      )
    );

    addAuditLog('Importação Desfeita', `${record.referenceCode} (${record.supplierName}): ${undoNotes}.`);

    return {
      success: true,
      message: `Importação ${record.referenceCode} marcada como Desfeita! (${undoNotes}).`,
    };
  };

  // Legacy direct helper
  const importNFeXml = (xmlContent: string) => {
    const parsed = parseNFeXml(xmlContent);
    if (!parsed.success || !parsed.parsedNFe) {
      return { success: false, message: parsed.message };
    }
    const res = commitImportNFe(parsed.parsedNFe);
    return {
      success: res.success,
      message: res.message,
      importedCount: res.newProductsCount + res.updatedProductsCount,
      totalValue: parsed.parsedNFe.totalValue
    };
  };

  // CSV Bulk Client Import
  const importCsvClients = (csvContent: string) => {
    try {
      const lines = csvContent.split('\n').filter(l => l.trim().length > 0);
      let count = 0;
      lines.slice(1).forEach((line, idx) => {
        const parts = line.split(/[;,]/);
        if (parts.length >= 3 && parts[0].trim()) {
          const rawCustomerType = (parts[7]?.replace(/"/g, '').trim() || '').toLowerCase();
          const normalizedCustomerType = rawCustomerType.includes('atacad') ? 'atacado' : 'varejo';
          const newCli: Client = {
            id: `cli-csv-${Date.now()}-${idx}`,
            customerType: normalizedCustomerType,
            name: parts[0].replace(/"/g, '').trim(),
            document: parts[1]?.replace(/"/g, '').trim() || '',
            phone: parts[2]?.replace(/"/g, '').trim() || '(11) 99999-9999',
            email: parts[3]?.replace(/"/g, '').trim() || 'contato@cliente.com.br',
            cep: parts[4]?.replace(/"/g, '').trim() || '01001-000',
            street: parts[5]?.replace(/"/g, '').trim() || 'Rua das Indústrias',
            number: parts[6]?.replace(/"/g, '').trim() || '100',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            createdAt: new Date().toISOString().split('T')[0]
          };
          setClients(prev => [newCli, ...prev]);
          syncClientToCloud(newCli);
          count++;
        }
      });
      addAuditLog('Importação CSV', `${count} clientes importados via arquivo CSV/Excel.`);
      return { success: true, message: `${count} clientes importados com sucesso!`, count };
    } catch {
      return { success: false, message: 'Erro ao processar o arquivo CSV.' };
    }
  };

  // Client CRUD
  const addClient = (c: Omit<Client, 'id' | 'createdAt'>): Client => {
    const newClient: Client = {
      ...c,
      customerType: c.customerType || 'varejo',
      id: `cli-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setClients(prev => [newClient, ...prev]);
    syncClientToCloud(newClient);
    addAuditLog('Novo Cliente', `Cliente ${c.name} (${newClient.customerType === 'atacado' ? 'Atacadista' : 'Varejista'}) cadastrado no sistema.`);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    // Validação de Segurança RBAC e Prevenção contra IDOR
    if (currentUser?.role === 'cliente') {
      const tenantId = getTenantClientId(currentUser);
      if (tenantId && id !== tenantId) {
        console.error(`[SEGURANÇA ERP - BLOQUEIO IDOR] Usuário ${currentUser.name} tentou alterar dados do cliente ${id}`);
        addAuditLog('Bloqueio de Segurança (IDOR)', `Tentativa não autorizada de alteração cadastral no cliente ${id} bloqueada.`);
        return;
      }
    }
    setClients(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, ...updates };
        syncClientToCloud(updated);
        return updated;
      }
      return c;
    }));
    addAuditLog('Edição de Cliente', `Cliente ID ${id} atualizado.`);
  };

  const deleteClient = (id: string) => {
    if (currentUser?.role === 'cliente' || currentUser?.role === 'tecnico') {
      console.error(`[SEGURANÇA ERP - BLOQUEIO 403] Perfil ${currentUser?.role} não possui permissão para excluir clientes.`);
      addAuditLog('Bloqueio de Segurança', `Tentativa de exclusão de cliente pelo perfil ${currentUser?.role} bloqueada.`);
      return;
    }
    setClients(prev => prev.filter(c => c.id !== id));
    deleteClientFromCloud(id);
    addAuditLog('Exclusão de Cliente', `Cliente ID ${id} removido.`);
  };

  // Supplier CRUD
  const addSupplier = (s: Omit<Supplier, 'id'>) => {
    const newSup: Supplier = {
      ...s,
      id: `sup-${Date.now()}`
    };
    setSuppliers(prev => [newSup, ...prev]);
    syncSupplierToCloud(newSup);
    addAuditLog('Novo Fornecedor', `Fornecedor ${s.name} cadastrado.`);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, ...updates };
        syncSupplierToCloud(updated);
        return updated;
      }
      return s;
    }));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    deleteSupplierFromCloud(id);
  };

  // Product Taxonomies CRUD & Management (Categorias, Subcategorias, Marcas, Tags)
  const addProductCategory = (category: string) => {
    const clean = category.trim();
    if (!clean) return;
    setProductCategories(prev => sortAlpha(prev.includes(clean) ? prev : [...prev, clean]));
    addAuditLog('Nova Categoria de Produto', `Categoria "${clean}" adicionada.`);
  };

  const updateProductCategory = (oldCategory: string, newCategory: string) => {
    const clean = newCategory.trim();
    if (!clean || clean === oldCategory) return;
    setProductCategories(prev => sortAlpha(prev.map(c => c === oldCategory ? clean : c)));
    setProducts(prev => prev.map(p => p.category === oldCategory ? { ...p, category: clean } : p));
    addAuditLog('Atualização de Categoria', `Categoria renomeada de "${oldCategory}" para "${clean}".`);
  };

  const deleteProductCategory = (category: string) => {
    setProductCategories(prev => sortAlpha(prev.filter(c => c !== category)));
    addAuditLog('Exclusão de Categoria', `Categoria "${category}" removida da lista.`);
  };

  const addProductSubcategory = (subcategory: string) => {
    const clean = subcategory.trim();
    if (!clean) return;
    setProductSubcategories(prev => sortAlpha(prev.includes(clean) ? prev : [...prev, clean]));
    addAuditLog('Nova Subcategoria', `Subcategoria "${clean}" adicionada.`);
  };

  const updateProductSubcategory = (oldSubcategory: string, newSubcategory: string) => {
    const clean = newSubcategory.trim();
    if (!clean || clean === oldSubcategory) return;
    setProductSubcategories(prev => sortAlpha(prev.map(s => s === oldSubcategory ? clean : s)));
    setProducts(prev => prev.map(p => p.subcategory === oldSubcategory ? { ...p, subcategory: clean } : p));
    addAuditLog('Atualização de Subcategoria', `Subcategoria renomeada de "${oldSubcategory}" para "${clean}".`);
  };

  const deleteProductSubcategory = (subcategory: string) => {
    setProductSubcategories(prev => sortAlpha(prev.filter(s => s !== subcategory)));
    addAuditLog('Exclusão de Subcategoria', `Subcategoria "${subcategory}" removida da lista.`);
  };

  const addProductBrand = (brand: string) => {
    const clean = brand.trim();
    if (!clean) return;
    setProductBrands(prev => sortAlpha(prev.includes(clean) ? prev : [...prev, clean]));
    addAuditLog('Nova Marca de Produto', `Marca "${clean}" adicionada.`);
  };

  const updateProductBrand = (oldBrand: string, newBrand: string) => {
    const clean = newBrand.trim();
    if (!clean || clean === oldBrand) return;
    setProductBrands(prev => sortAlpha(prev.map(b => b === oldBrand ? clean : b)));
    setProducts(prev => prev.map(p => p.brand === oldBrand ? { ...p, brand: clean } : p));
    addAuditLog('Atualização de Marca', `Marca renomeada de "${oldBrand}" para "${clean}".`);
  };

  const deleteProductBrand = (brand: string) => {
    setProductBrands(prev => sortAlpha(prev.filter(b => b !== brand)));
    addAuditLog('Exclusão de Marca', `Marca "${brand}" removida da lista.`);
  };

  const addProductTag = (tag: string) => {
    const clean = tag.replace(/^#/, '').trim().toLowerCase();
    if (!clean) return;
    setProductTags(prev => sortAlpha(prev.includes(clean) ? prev : [...prev, clean]));
    addAuditLog('Nova Tag', `Tag "#${clean}" adicionada.`);
  };

  const updateProductTag = (oldTag: string, newTag: string) => {
    const clean = newTag.replace(/^#/, '').trim().toLowerCase();
    const oldClean = oldTag.replace(/^#/, '').trim().toLowerCase();
    if (!clean || clean === oldClean) return;
    setProductTags(prev => sortAlpha(prev.map(t => t.replace(/^#/, '').trim().toLowerCase() === oldClean ? clean : t)));
    setProducts(prev => prev.map(p => {
      if (!p.tags) return p;
      return {
        ...p,
        tags: p.tags.map(t => t.replace(/^#/, '').trim().toLowerCase() === oldClean ? clean : t)
      };
    }));
    addAuditLog('Atualização de Tag', `Tag renomeada de "#${oldClean}" para "#${clean}".`);
  };

  const deleteProductTag = (tag: string) => {
    const clean = tag.replace(/^#/, '').trim().toLowerCase();
    setProductTags(prev => sortAlpha(prev.filter(t => t.replace(/^#/, '').trim().toLowerCase() !== clean)));
    setProducts(prev => prev.map(p => ({
      ...p,
      tags: p.tags?.filter(t => t.replace(/^#/, '').trim().toLowerCase() !== clean)
    })));
    addAuditLog('Exclusão de Tag', `Tag "#${clean}" removida.`);
  };

  // Universal Batch Import for Backups (Clientes, Serviços, OS, Vendas, Compras, Pagamentos, Estoque)
  const batchImportClients = (newClients: Omit<Client, 'id' | 'createdAt'>[], mode: 'append' | 'replace'): number => {
    const createdClients: Client[] = newClients.map((c, idx) => ({
      ...c,
      customerType: c.customerType || 'varejo',
      id: `cli-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString()
    }));
    if (mode === 'replace') {
      setClients(createdClients);
    } else {
      setClients(prev => [...prev, ...createdClients]);
    }
    createdClients.forEach(c => syncClientToCloud(c));
    addAuditLog('Importação de Clientes', `${createdClients.length} clientes importados via backup (${mode === 'replace' ? 'substituição' : 'acréscimo'}).`);
    return createdClients.length;
  };

  const batchImportServices = (newServices: Omit<ServiceCatalogItem, 'id'>[], mode: 'append' | 'replace'): number => {
    const createdServices: ServiceCatalogItem[] = newServices.map((s, idx) => ({
      ...s,
      id: `srv-${Date.now()}-${idx}`
    }));
    if (mode === 'replace') {
      setServiceCatalog(createdServices);
    } else {
      setServiceCatalog(prev => [...prev, ...createdServices]);
    }
    addAuditLog('Importação de Serviços', `${createdServices.length} serviços do catálogo importados via backup.`);
    return createdServices.length;
  };

  const batchImportServiceOrders = (newOrders: Omit<ServiceOrder, 'id'>[], mode: 'append' | 'replace'): number => {
    const createdOrders: ServiceOrder[] = newOrders.map((o, idx) => ({
      ...o,
      id: `os-${Date.now()}-${idx}`,
      code: o.code || `OS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
    }));
    if (mode === 'replace') {
      setServiceOrders(createdOrders);
    } else {
      setServiceOrders(prev => [...prev, ...createdOrders]);
    }
    addAuditLog('Importação de Ordens de Serviço', `${createdOrders.length} ordens de serviço importadas via backup.`);
    return createdOrders.length;
  };

  const batchImportDirectSales = (newSales: Omit<DirectSale, 'id'>[], mode: 'append' | 'replace'): number => {
    const createdSales: DirectSale[] = newSales.map((s, idx) => ({
      ...s,
      id: `sale-${Date.now()}-${idx}`,
      code: s.code || `PED-${Date.now().toString().slice(-6)}`
    }));
    if (mode === 'replace') {
      setDirectSales(createdSales);
    } else {
      setDirectSales(prev => [...prev, ...createdSales]);
    }
    addAuditLog('Importação de Vendas', `${createdSales.length} pedidos de venda importados via backup.`);
    return createdSales.length;
  };

  const batchImportSuppliers = (newSuppliers: Omit<Supplier, 'id'>[], mode: 'append' | 'replace'): number => {
    const createdSuppliers: Supplier[] = newSuppliers.map((s, idx) => ({
      ...s,
      id: `sup-${Date.now()}-${idx}`
    }));
    if (mode === 'replace') {
      setSuppliers(createdSuppliers);
    } else {
      setSuppliers(prev => [...prev, ...createdSuppliers]);
    }
    addAuditLog('Importação de Fornecedores/Compras', `${createdSuppliers.length} fornecedores importados via backup.`);
    return createdSuppliers.length;
  };

  const batchImportPayments = (newPayments: Omit<GeneralExpense, 'id'>[], mode: 'append' | 'replace'): number => {
    const createdPayments: GeneralExpense[] = newPayments.map((p, idx) => ({
      ...p,
      id: `exp-${Date.now()}-${idx}`
    }));
    if (mode === 'replace') {
      setGeneralExpenses(createdPayments);
    } else {
      setGeneralExpenses(prev => [...prev, ...createdPayments]);
    }
    addAuditLog('Importação Financeira/Pagamentos', `${createdPayments.length} pagamentos/despesas importados via backup.`);
    return createdPayments.length;
  };

  const batchImportProducts = (newProducts: Omit<Product, 'id'>[], mode: 'append' | 'replace'): number => {
    const createdProducts: Product[] = newProducts.map((p, idx) => ({
      ...p,
      id: `prod-${Date.now()}-${idx}`
    }));
    if (mode === 'replace') {
      setProducts(createdProducts);
    } else {
      setProducts(prev => [...prev, ...createdProducts]);
    }
    // Auto-adiciona na lista de taxonomias em ordem alfabética
    newProducts.forEach(p => {
      if (p.category) addProductCategory(p.category);
      if (p.subcategory) addProductSubcategory(p.subcategory);
      if (p.brand) addProductBrand(p.brand);
      if (p.tags) p.tags.forEach(t => addProductTag(t));
    });
    addAuditLog('Importação de Produtos/Estoque', `${createdProducts.length} produtos importados via backup.`);
    return createdProducts.length;
  };

  // Product CRUD
  const addProduct = (p: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...p,
      id: `prod-${Date.now()}`
    };
    setProducts(prev => [newProd, ...prev]);
    syncProductToCloud(newProd);

    // Auto-adiciona na lista de taxonomias salvas se forem novas
    if (p.category && !productCategories.includes(p.category)) {
      setProductCategories(prev => [...prev, p.category]);
    }
    if (p.subcategory && !productSubcategories.includes(p.subcategory)) {
      const subcat = p.subcategory;
      setProductSubcategories(prev => [...prev, subcat]);
    }
    if (p.brand && !productBrands.includes(p.brand)) {
      const b = p.brand;
      setProductBrands(prev => [...prev, b]);
    }
    if (p.tags && p.tags.length > 0) {
      setProductTags(prev => Array.from(new Set([...prev, ...p.tags!.map(t => t.trim().toLowerCase())])));
    }

    addAuditLog('Novo Produto', `Produto ${p.name} cadastrado com estoque inicial de ${p.currentStock}.`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        syncProductToCloud(updated);
        return updated;
      }
      return p;
    }));

    // Auto-adiciona na lista de taxonomias salvas
    if (updates.category && !productCategories.includes(updates.category)) {
      setProductCategories(prev => [...prev, updates.category!]);
    }
    if (updates.subcategory && !productSubcategories.includes(updates.subcategory)) {
      setProductSubcategories(prev => [...prev, updates.subcategory!]);
    }
    if (updates.brand && !productBrands.includes(updates.brand)) {
      setProductBrands(prev => [...prev, updates.brand!]);
    }
    if (updates.tags && updates.tags.length > 0) {
      setProductTags(prev => Array.from(new Set([...prev, ...updates.tags!.map(t => t.trim().toLowerCase())])));
    }
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    deleteProductFromCloud(id);
  };

  const addStockMovement = (m: Omit<StockMovement, 'id' | 'date'>) => {
    const newMove: StockMovement = {
      ...m,
      id: `sm-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    setStockMovements(prev => [newMove, ...prev]);

    // Adjust current stock
    setProducts(prev => prev.map(p => {
      if (p.id === m.productId || p.name === m.productName) {
        const delta = (m.type.startsWith('entrada') || m.type === 'ajuste') ? m.quantity : -m.quantity;
        return { ...p, currentStock: Math.max(0, p.currentStock + delta) };
      }
      return p;
    }));
  };

  const updateCardRate = (brand: CardMachineRate['brand'], updates: Partial<CardMachineRate>) => {
    setCardRates(prev => prev.map(r => r.brand === brand ? { ...r, ...updates } : r));
    addAuditLog('Taxas de Cartão', `Taxas da bandeira ${brand.toUpperCase()} atualizadas.`);
  };

  // Card Operators CRUD
  const addCardOperator = (op: Omit<CardOperator, 'id' | 'createdAt'>) => {
    const newOp: CardOperator = {
      ...op,
      id: `op-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setCardOperators(prev => [newOp, ...prev]);
    addAuditLog('Nova Operadora de Cartão', `Operadora ${newOp.name} cadastrada com taxas configuradas.`);
  };

  const updateCardOperator = (id: string, updates: Partial<CardOperator>) => {
    setCardOperators(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    addAuditLog('Atualização de Operadora', `Operadora ID ${id} e suas taxas foram atualizadas.`);
  };

  const deleteCardOperator = (id: string) => {
    setCardOperators(prev => prev.filter(o => o.id !== id));
    addAuditLog('Exclusão de Operadora', `Operadora ID ${id} excluída do cadastro.`);
  };

  // Process Card Operator Webhook / Realtime Automatic Reconciliation
  const processPagBankWebhook = (payload: {
    operatorId?: string;
    operatorCode?: string;
    orderCode?: string;
    saleCode?: string;
    clientName?: string;
    amount: number;
    method: 'cartao_credito' | 'cartao_debito' | 'pix' | 'boleto';
    installments?: number;
    brand?: string;
    nsu?: string;
  }) => {
    // Localiza a operadora especificada ou PagBank como padrão
    const operator = (payload.operatorId && cardOperators.find(o => o.id === payload.operatorId)) ||
      (payload.operatorCode && cardOperators.find(o => o.code === payload.operatorCode)) ||
      cardOperators.find(o => o.code === 'pagbank') ||
      cardOperators[0];

    const installments = payload.installments || 1;
    let feePct = 0;

    if (payload.method === 'pix') {
      feePct = operator ? operator.pixRate : 0.00;
    } else if (payload.method === 'cartao_debito') {
      feePct = operator ? operator.debitRate : 1.99;
    } else if (payload.method === 'cartao_credito') {
      // Verifica se a operadora possui taxa configurada exatamente para esse número de parcelas
      const customInstallment = operator?.installmentRates?.find(ir => ir.installment === installments);
      if (customInstallment) {
        feePct = customInstallment.rate;
      } else if (installments === 1) {
        feePct = operator ? operator.creditSightRate : 3.19;
      } else if (installments <= 6) {
        feePct = operator ? operator.creditInstallments2to6Rate : 3.79;
      } else {
        feePct = operator ? operator.creditInstallments7to12Rate : 4.99;
      }
    } else {
      feePct = 1.99;
    }

    const feeAmount = Number((payload.amount * (feePct / 100)).toFixed(2));
    const netAmount = Number((payload.amount - feeAmount).toFixed(2));
    const now = new Date();
    const timestamp = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
    const trxCode = `PAG-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const nsu = payload.nsu || String(Math.floor(100000000 + Math.random() * 900000000));
    const authCode = `AU${Math.floor(1000 + Math.random() * 9000)}`;

    let matchedClient = payload.clientName || 'Cliente PagBank';

    // Se informou código de OS, efetua a baixa automática na Ordem de Serviço
    if (payload.orderCode) {
      const os = serviceOrders.find(o => o.code.toLowerCase() === payload.orderCode?.toLowerCase());
      if (os) {
        matchedClient = os.clientName;
        setServiceOrders(prev => prev.map(item => {
          if (item.id === os.id) {
            return {
              ...item,
              paymentStatus: 'pago',
              paymentMethod: payload.method,
              status: (item.status === 'orcamento_aberto' || item.status === 'aguardando_aprovacao' || item.status === 'aprovada_em_andamento') 
                ? 'concluida_aguardando_retirada' 
                : item.status,
              payments: [
                {
                  id: `pay-pb-${Date.now()}`,
                  method: payload.method,
                  cardBrand: (payload.brand?.toLowerCase() as any) || 'mastercard',
                  installments,
                  ratePercentage: feePct,
                  rateAmount: feeAmount,
                  amount: payload.amount,
                  netAmount: netAmount
                }
              ]
            };
          }
          return item;
        }));
      }
    }

    // Se informou código de Venda Direta, efetua a baixa automática
    if (payload.saleCode) {
      const sale = directSales.find(s => s.code.toLowerCase() === payload.saleCode?.toLowerCase());
      if (sale) {
        matchedClient = sale.clientName;
        setDirectSales(prev => prev.map(s => {
          if (s.id === sale.id) {
            return {
              ...s,
              paymentStatus: 'pago',
              paymentMethod: payload.method,
              payments: [
                {
                  id: `pay-pb-${Date.now()}`,
                  method: payload.method,
                  cardBrand: (payload.brand?.toLowerCase() as any) || 'mastercard',
                  installments,
                  ratePercentage: feePct,
                  rateAmount: feeAmount,
                  amount: payload.amount,
                  netAmount: netAmount
                }
              ]
            };
          }
          return s;
        }));
      }
    }

    const newTrx: PagBankTransaction = {
      id: `pbtx-${Date.now()}`,
      transactionCode: trxCode,
      operatorId: operator?.id || 'op-pagbank',
      orderCode: payload.orderCode,
      saleId: payload.saleCode,
      clientName: matchedClient,
      paymentMethod: payload.method,
      installments,
      brand: payload.brand || 'Mastercard',
      grossAmount: payload.amount,
      feePercentage: feePct,
      feeAmount,
      netAmount,
      status: 'PAID',
      paidAt: timestamp,
      reconciled: true,
      reconciledAt: timestamp,
      nsu,
      authorizationCode: authCode
    };

    setPagBankTransactions(prev => [newTrx, ...prev]);
    
    // Atualiza data do último sync na operadora
    if (operator) {
      setCardOperators(prev => prev.map(op => {
        if (op.id === operator.id && op.integration) {
          return {
            ...op,
            integration: {
              ...op.integration,
              lastSyncAt: timestamp,
              status: 'connected'
            }
          };
        }
        return op;
      }));
    }

    addAuditLog('Baixa Automática TEF/Gateway', `Transação ${trxCode} (${operator?.name || 'Operadora'}, NSU ${nsu}) aprovada. Valor bruto R$ ${payload.amount.toFixed(2)}, taxa retida R$ ${feeAmount.toFixed(2)}, crédito líquido de R$ ${netAmount.toFixed(2)} baixado para ${payload.orderCode || payload.saleCode || 'Venda'}.`);

    return {
      success: true,
      message: `Pagamento de R$ ${payload.amount.toFixed(2)} conciliado via PagBank! Baixa automática realizada no sistema (Valor Líquido: R$ ${netAmount.toFixed(2)}).`,
      transaction: newTrx
    };
  };

  const syncPagBankPendingOrders = () => {
    // Localiza OS que estão pendentes de pagamento e concilia via simulação de webhook de retorno
    const pendingOrders = serviceOrders.filter(o => o.paymentStatus === 'pendente');
    let count = 0;
    if (pendingOrders.length > 0) {
      const target = pendingOrders[0];
      const totalAmount = target.services.reduce((a, b) => a + b.price, 0) + 
                          target.parts.reduce((a, b) => a + (b.price * b.quantity), 0) + 
                          (target.visitFee || 0) - (target.calculatedDiscount || 0);

      processPagBankWebhook({
        orderCode: target.code,
        clientName: target.clientName,
        amount: Math.max(50, totalAmount),
        method: 'cartao_credito',
        installments: 3,
        brand: 'Mastercard'
      });
      count = 1;
    }
    return {
      syncedCount: count,
      message: count > 0 
        ? `Sincronização concluída! 1 transação recebida da PagBank com baixa automática imediata no ERP.`
        : `Nenhuma transação pendente aguardando baixa na API PagBank neste momento.`
    };
  };

  const addCustomerTicket = (t: Omit<CustomerPortalTicket, 'id' | 'createdAt' | 'status'>) => {
    // Forçar clientId do usuário logado se for cliente (Anti-Spoofing / Anti-IDOR)
    const effectiveClientId = currentUser?.role === 'cliente'
      ? (getTenantClientId(currentUser) || t.clientId)
      : t.clientId;

    const now = new Date();
    const newTicket: CustomerPortalTicket = {
      ...t,
      clientId: effectiveClientId,
      id: `tkt-${Date.now()}`,
      status: 'aberto',
      createdAt: now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR')
    };
    setCustomerTickets(prev => [newTicket, ...prev]);
    addAuditLog('Chamado Portal Cliente', `Chamado "${t.subject}" aberto pelo cliente ${t.clientName}.`);
  };

  const updateCustomerTicketStatus = (id: string, status: CustomerPortalTicket['status']) => {
    setCustomerTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    addAuditLog('Status de Chamado', `Chamado ${id} alterado para ${status}.`);
  };

  // Service Order CRUD
  const addServiceOrder = (so: Omit<ServiceOrder, 'id' | 'code'>) => {
    const isBudget = so.type === 'orcamento';
    const code = isBudget ? getNextBudgetCode() : getNextServiceOrderCode();

    // Auto-link warranty if not manually specified
    let resolvedWarranty = so.warranty;
    let resolvedWarrantyTerms = so.warrantyTerms;
    if (!resolvedWarranty || resolvedWarranty.trim() === '') {
      const srvIds = (so.services || []).map(s => s.id);
      const matchedWp = getWarrantyForServices(srvIds);
      if (matchedWp) {
        resolvedWarranty = `${matchedWp.days} dias (${matchedWp.name})`;
        if (!resolvedWarrantyTerms) {
          resolvedWarrantyTerms = matchedWp.terms;
        }
      }
    }

    const newOrder: ServiceOrder = {
      ...so,
      warranty: resolvedWarranty,
      warrantyTerms: resolvedWarrantyTerms,
      id: `os-${Date.now()}`,
      code
    };
    setServiceOrders(prev => [newOrder, ...prev]);
    syncOrderToCloud(newOrder);

    // Advance sequence number
    if (isBudget) {
      setSequenceSettings(prev => ({
        ...prev,
        budgetNextNumber: (prev.budgetNextNumber ?? 501) + 1
      }));
    } else {
      setSequenceSettings(prev => ({
        ...prev,
        serviceOrderNextNumber: (prev.serviceOrderNextNumber ?? 2025020328) + 1
      }));
    }

    // If order has parts, deduce from stock automatically!
    so.parts.forEach(prt => {
      if (prt.productId || prt.name) {
        addStockMovement({
          productId: prt.productId || 'avulso',
          productName: prt.name,
          type: 'saida_os',
          quantity: prt.quantity,
          unitCost: prt.cost,
          referenceDoc: code,
          notes: `Baixa automática de estoque por atendimento da OS ${code}`
        });
      }
    });

    addAuditLog(isBudget ? 'Novo Orçamento' : 'Abertura de OS', `${isBudget ? 'Orçamento' : 'Ordem de Serviço'} ${code} criada para ${so.clientName}.`);
  };

  const updateServiceOrder = (id: string, updates: Partial<ServiceOrder>) => {
    // Validação de Permissão RBAC (Anti-IDOR)
    const targetOrder = serviceOrders.find(o => o.id === id);
    if (targetOrder) {
      if (!canModifyServiceOrder(currentUser, targetOrder)) {
        console.error(`[SEGURANÇA ERP - BLOQUEIO IDOR] Usuário ${currentUser?.name} (${currentUser?.role}) tentou alterar OS ${targetOrder.code} sem permissão.`);
        addAuditLog('Bloqueio de Segurança (IDOR)', `Tentativa não autorizada de alteração na OS ${targetOrder.code} bloqueada.`);
        return;
      }
    }

    setServiceOrders(prev => prev.map(o => {
      if (o.id === id) {
        const updated = { ...o, ...updates };
        syncOrderToCloud(updated);
        return updated;
      }
      return o;
    }));
    addAuditLog('Atualização de OS', `OS ID ${id} atualizada com status ${updates.status || 'modificado'}.`);
  };

  const deleteServiceOrder = (id: string) => {
    // Apenas Administradores podem excluir Ordens de Serviço
    if (currentUser?.role === 'cliente' || currentUser?.role === 'tecnico') {
      console.error(`[SEGURANÇA ERP - BLOQUEIO 403] Perfil ${currentUser?.role} não possui permissão para excluir ordens de serviço.`);
      addAuditLog('Bloqueio de Segurança', `Tentativa de exclusão de OS pelo perfil ${currentUser?.role} bloqueada.`);
      return;
    }
    setServiceOrders(prev => prev.filter(o => o.id !== id));
    deleteOrderFromCloud(id);
    addAuditLog('Exclusão de OS', `OS ID ${id} removida.`);
  };

  // Convert budget to approved order or direct sale
  const convertBudgetToOrderOrSale = (orderId: string, targetType: 'os_aprovada' | 'venda_direta') => {
    const target = serviceOrders.find(o => o.id === orderId);
    if (!target) return;

    if (targetType === 'os_aprovada') {
      const newOsCode = getNextServiceOrderCode();
      setSequenceSettings(prev => ({
        ...prev,
        serviceOrderNextNumber: (prev.serviceOrderNextNumber ?? 2025020328) + 1
      }));

      updateServiceOrder(orderId, {
        code: newOsCode,
        status: 'aprovada_em_andamento',
        type: 'servico_e_venda'
      });
      addAuditLog('Conversão de Orçamento', `Orçamento ${target.code} convertido em Ordem de Serviço Aprovada #${newOsCode}.`);
    } else {
      // Convert to Direct Sale
      const saleCode = getNextSaleCode();
      setSequenceSettings(prev => ({
        ...prev,
        saleNextNumber: (prev.saleNextNumber ?? 1001) + 1
      }));

      const saleItems = target.parts.map(p => ({
        id: p.id,
        productId: p.productId,
        name: p.name,
        quantity: p.quantity,
        cost: p.cost,
        price: p.price,
        unit: p.unit
      }));
      const partsTotal = saleItems.reduce((a, b) => a + (b.price * b.quantity), 0);
      const newSale: DirectSale = {
        id: `sale-${Date.now()}`,
        code: saleCode,
        clientId: target.clientId,
        clientName: target.clientName,
        employeeId: target.employeeId,
        date: new Date().toISOString().split('T')[0],
        priceType: 'varejo',
        items: saleItems,
        discountType: target.discountType,
        discountValue: target.discountValue,
        calculatedDiscount: target.calculatedDiscount,
        total: partsTotal - target.calculatedDiscount,
        paymentMethod: target.paymentMethod,
        payments: target.payments,
        paymentStatus: target.paymentStatus || 'pendente'
      };
      setDirectSales(prev => [newSale, ...prev]);
      syncDirectSaleToCloud(newSale);
      updateServiceOrder(orderId, { status: 'entregue_finalizada' });
      addAuditLog('Conversão para Venda', `Orçamento ${target.code} convertido na Venda Direta ${saleCode}.`);
    }
  };

  const addDirectSale = (sale: Omit<DirectSale, 'id' | 'code'>): DirectSale => {
    const code = getNextSaleCode();
    setSequenceSettings(prev => ({
      ...prev,
      saleNextNumber: (prev.saleNextNumber ?? 1001) + 1
    }));

    const newSale: DirectSale = {
      ...sale,
      id: `sale-${Date.now()}`,
      code
    };
    setDirectSales(prev => [newSale, ...prev]);
    syncDirectSaleToCloud(newSale);

    // Deduce stock
    sale.items.forEach(it => {
      addStockMovement({
        productId: it.productId || 'avulso',
        productName: it.name,
        type: 'saida_venda',
        quantity: it.quantity,
        unitCost: it.cost,
        referenceDoc: code,
        notes: `Venda Direta / Balcão ${code}`
      });
    });

    addAuditLog('Nova Venda', `Venda ${code} realizada no valor de R$ ${sale.total.toFixed(2)}.`);
    return newSale;
  };

  const updateDirectSale = (id: string, updates: Partial<DirectSale>) => {
    setDirectSales(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, ...updates };
        syncDirectSaleToCloud(updated);
        return updated;
      }
      return s;
    }));
  };

  const authorizePdvSaleDelete = (password: string) => {
    const cleanPass = (password || '').trim();
    const masterPass = (companySettings.pdvDeletePassword || '').trim();
    const authorizedUsers = authUsers.filter(
      u => u.active !== false && (u.role === 'admin' || u.canDeletePdvSales === true) && Boolean(u.password?.trim())
    );
    const hasAnyPasswordConfigured = Boolean(masterPass) || authorizedUsers.length > 0;

    if (!cleanPass) {
      return { authorized: false, hasAnyPasswordConfigured };
    }

    if (masterPass && cleanPass === masterPass) {
      return {
        authorized: true,
        authorizerName: 'Administrador (Senha Mestra PDV)',
        authorizerRole: 'admin' as UserRole,
        hasAnyPasswordConfigured: true
      };
    }

    const matchedUser = authorizedUsers.find(u => u.password?.trim() === cleanPass);
    if (matchedUser) {
      return {
        authorized: true,
        authorizerName: `${matchedUser.name} (@${matchedUser.username})`,
        authorizerRole: matchedUser.role,
        hasAnyPasswordConfigured: true
      };
    }

    return { authorized: false, hasAnyPasswordConfigured };
  };

  const cancelDirectSale = (id: string, reason?: string) => {
    const sale = directSales.find(s => s.id === id);
    if (!sale || sale.status === 'cancelada') return;

    const nowIso = new Date().toISOString();
    const operatorName = currentUser?.name || 'Operador PDV';
    const cleanReason = reason?.trim() || 'Cancelamento realizado no PDV';

    const cancelledSale: DirectSale = {
      ...sale,
      status: 'cancelada',
      cancelledAt: nowIso,
      cancelledBy: operatorName,
      cancelReason: cleanReason
    };

    setDirectSales(prev => prev.map(s => (s.id === id ? cancelledSale : s)));
    syncDirectSaleToCloud(cancelledSale);

    // Estornar estoque dos itens vendidos
    (sale.items || []).forEach(it => {
      if (it.quantity > 0) {
        addStockMovement({
          productId: it.productId || 'avulso',
          productName: it.name,
          type: 'ajuste',
          quantity: it.quantity,
          unitCost: it.cost,
          referenceDoc: `CANC-${sale.code}`,
          notes: `Estorno automático por cancelamento da venda ${sale.code} (${operatorName})`
        });
      }
    });

    // Marcar movimentações e recibos vinculados como cancelados para preservar histórico sem somar no caixa
    setCashMovements(prev =>
      prev.map(m => {
        if (m.sourceType === 'venda' && m.sourceId === id && !m.cancelled) {
          const updatedMove: CashRegisterMovement = {
            ...m,
            cancelled: true,
            cancelledAt: nowIso,
            cancelledBy: operatorName,
            cancelReason: cleanReason
          };
          syncCashMovementToCloud(updatedMove);
          return updatedMove;
        }
        return m;
      })
    );

    setPaymentReceipts(prev =>
      prev.map(r => {
        if (r.sourceType === 'venda' && r.sourceId === id && !r.cancelled) {
          const updatedReceipt: PaymentReceipt = {
            ...r,
            cancelled: true,
            cancelledAt: nowIso,
            cancelledBy: operatorName,
            cancelReason: cleanReason
          };
          syncPaymentReceiptToCloud(updatedReceipt);
          return updatedReceipt;
        }
        return r;
      })
    );

    addAuditLog(
      'Cancelamento de Venda PDV',
      `Venda ${sale.code} (${sale.clientName}, ${sale.total.toFixed(2)}) cancelada por ${operatorName}. Motivo: ${cleanReason}.`
    );
  };

  const deleteDirectSale = (id: string, authorizedByName?: string) => {
    const sale = directSales.find(s => s.id === id);
    if (sale && sale.status !== 'cancelada') {
      (sale.items || []).forEach(it => {
        if (it.quantity > 0) {
          addStockMovement({
            productId: it.productId || 'avulso',
            productName: it.name,
            type: 'ajuste',
            quantity: it.quantity,
            unitCost: it.cost,
            referenceDoc: `DEL-${sale.code}`,
            notes: `Estorno de estoque por exclusão da venda ${sale.code}`
          });
        }
      });
    }

    const linkedMovements = cashMovements.filter(m => m.sourceType === 'venda' && m.sourceId === id);
    const linkedReceipts = paymentReceipts.filter(r => r.sourceType === 'venda' && r.sourceId === id);

    setDirectSales(prev => prev.filter(s => s.id !== id));
    deleteDirectSaleFromCloud(id);

    if (linkedMovements.length > 0) {
      setCashMovements(prev => prev.filter(m => !(m.sourceType === 'venda' && m.sourceId === id)));
      linkedMovements.forEach(m => deleteCashMovementFromCloud(m.id));
    }

    if (linkedReceipts.length > 0) {
      setPaymentReceipts(prev => prev.filter(r => !(r.sourceType === 'venda' && r.sourceId === id)));
      linkedReceipts.forEach(r => deletePaymentReceiptFromCloud(r.id));
    }

    if (sale) {
      const executor = currentUser?.name || 'Operador PDV';
      const authNote = authorizedByName ? ` · Autorizado por: ${authorizedByName}` : '';
      addAuditLog(
        'Exclusão de Venda PDV',
        `Venda ${sale.code} (${sale.clientName}, R$ ${Number(sale.total || 0).toFixed(2)}) excluída por ${executor}${authNote}.`
      );
    }
  };

  // =========================================================================
  // PDV / FRENTE DE CAIXA OPERATIONS
  // =========================================================================

  const openCashSession = (terminalName: string, openingBalance: number, notes?: string): CashRegisterSession => {
    const nowIso = new Date().toISOString();
    const sessionCode = `CX-${new Date().getFullYear()}-${String(cashSessions.length + 1).padStart(3, '0')}`;
    const newSession: CashRegisterSession = {
      id: `cx-${Date.now()}`,
      code: sessionCode,
      terminalName: terminalName || 'Caixa 01 - Balcão Principal',
      operatorId: currentUser?.id || 'usr-admin',
      operatorName: currentUser?.name || 'Administrador',
      openedAt: nowIso,
      openingBalance: Number(openingBalance) || 0,
      status: 'aberto',
      notes
    };

    const openingMovement: CashRegisterMovement = {
      id: `cm-${Date.now()}`,
      sessionId: newSession.id,
      type: 'abertura',
      sourceType: 'manual',
      description: `Abertura de Caixa (${newSession.terminalName}) - Fundo de Troco`,
      paymentMethod: 'dinheiro',
      grossAmount: newSession.openingBalance,
      feeAmount: 0,
      netAmount: newSession.openingBalance,
      terminalName: newSession.terminalName,
      operatorName: newSession.operatorName,
      createdAt: nowIso
    };

    setCashSessions(prev => [newSession, ...prev]);
    setCashMovements(prev => [openingMovement, ...prev]);
    syncCashSessionToCloud(newSession);
    syncCashMovementToCloud(openingMovement);
    addAuditLog('Abertura de Caixa PDV', `Caixa ${sessionCode} (${newSession.terminalName}) aberto com fundo de ${newSession.openingBalance.toFixed(2)}.`);
    return newSession;
  };

  const closeCashSession = (sessionId: string, closingBalance: number, notes?: string) => {
    const targetSession = cashSessions.find(s => s.id === sessionId);
    if (!targetSession || targetSession.status === 'fechado') return;

    const sessionMoves = cashMovements.filter(m => m.sessionId === sessionId);
    let expectedCash = targetSession.openingBalance;
    sessionMoves.forEach(m => {
      if (m.cancelled) return;
      if (m.type === 'suprimento' && m.paymentMethod === 'dinheiro') {
        expectedCash += m.grossAmount;
      } else if (m.type === 'sangria' && m.paymentMethod === 'dinheiro') {
        expectedCash -= m.grossAmount;
      } else if (m.type === 'recebimento_venda' || m.type === 'recebimento_os') {
        if (m.payments && m.payments.length > 0) {
          m.payments.forEach(p => {
            if (p.method === 'dinheiro') expectedCash += p.amount;
          });
        } else if (m.paymentMethod === 'dinheiro') {
          expectedCash += m.grossAmount;
        }
      }
    });

    const closedAt = new Date().toISOString();
    const counted = Number(closingBalance) || 0;
    const diff = counted - expectedCash;

    const updatedSession: CashRegisterSession = {
      ...targetSession,
      status: 'fechado',
      closedAt,
      expectedCashBalance: expectedCash,
      closingBalance: counted,
      differenceAmount: diff,
      notes: notes || targetSession.notes
    };

    const closingMove: CashRegisterMovement = {
      id: `cm-close-${Date.now()}`,
      sessionId: targetSession.id,
      type: 'fechamento',
      sourceType: 'manual',
      description: `Fechamento de Caixa (${targetSession.code}) - Conferido: R$ ${counted.toFixed(2)}`,
      paymentMethod: 'dinheiro',
      grossAmount: counted,
      feeAmount: 0,
      netAmount: counted,
      terminalName: targetSession.terminalName,
      operatorName: currentUser?.name || 'Administrador',
      createdAt: closedAt
    };

    setCashSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
    setCashMovements(prev => [closingMove, ...prev]);
    syncCashSessionToCloud(updatedSession);
    syncCashMovementToCloud(closingMove);
    addAuditLog('Fechamento de Caixa PDV', `Caixa ${targetSession.code} fechado. Esperado em dinheiro: R$ ${expectedCash.toFixed(2)} | Contado: R$ ${counted.toFixed(2)}.`);
  };

  const addCashManualMovement = (
    type: 'suprimento' | 'sangria',
    amount: number,
    description: string,
    paymentMethod: PaymentMethod = 'dinheiro'
  ) => {
    let session = activeCashSession;
    if (!session) {
      session = openCashSession('Caixa 01 - Balcão Principal', 0, 'Abertura automática via movimentação');
    }
    const cleanAmount = Math.max(0, Number(amount) || 0);
    const movement: CashRegisterMovement = {
      id: `cm-${Date.now()}`,
      sessionId: session.id,
      type,
      sourceType: 'manual',
      description: description || (type === 'suprimento' ? 'Suprimento / Reforço de Caixa' : 'Sangria / Retirada de Caixa'),
      paymentMethod,
      grossAmount: cleanAmount,
      feeAmount: 0,
      netAmount: cleanAmount,
      terminalName: session.terminalName,
      operatorName: currentUser?.name || 'Administrador',
      createdAt: new Date().toISOString()
    };
    setCashMovements(prev => [movement, ...prev]);
    syncCashMovementToCloud(movement);
    addAuditLog(
      type === 'suprimento' ? 'Suprimento de Caixa' : 'Sangria de Caixa',
      `${movement.description} - Valor: R$ ${cleanAmount.toFixed(2)}`
    );
  };

  const sendSaleToPdv = (saleId: string, terminalName: string) => {
    const nowIso = new Date().toISOString();
    updateDirectSale(saleId, {
      pdvTerminal: terminalName,
      sentToPdvAt: nowIso
    });
    addAuditLog('Envio ao Caixa PDV', `Venda ${saleId} encaminhada para fila do terminal ${terminalName}.`);
  };

  const sendOrderToPdv = (orderId: string, terminalName: string) => {
    const nowIso = new Date().toISOString();
    updateServiceOrder(orderId, {
      pdvTerminal: terminalName,
      sentToPdvAt: nowIso
    });
    addAuditLog('Envio ao Caixa PDV', `OS ${orderId} encaminhada para fila do terminal ${terminalName}.`);
  };

  const openReceiptModal = (receipt: PaymentReceipt) => {
    setActiveReceiptModal(receipt);
  };

  const closeReceiptModal = () => {
    setActiveReceiptModal(null);
  };

  const getReceiptsForSource = (sourceType: 'os' | 'venda', sourceId: string): PaymentReceipt[] => {
    return paymentReceipts
      .filter(r => r.sourceType === sourceType && r.sourceId === sourceId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getPaidAmountForSource = (sourceType: 'os' | 'venda', sourceId: string): number => {
    const receiptsTotal = paymentReceipts
      .filter(r => r.sourceType === sourceType && r.sourceId === sourceId && !r.cancelled)
      .reduce((acc, r) => acc + Number(r.amountPaidNow || 0), 0);
    if (receiptsTotal > 0) return Number(receiptsTotal.toFixed(2));

    if (sourceType === 'venda') {
      const s = directSales.find(item => item.id === sourceId);
      if (!s || s.status === 'cancelada') return 0;
      if (s.paymentStatus === 'pago') return Number(s.total || 0);
      return (s.payments || [])
        .filter(p => p.status === 'pago')
        .reduce((acc, p) => acc + Number(p.amount || 0), 0);
    } else {
      const o = serviceOrders.find(item => item.id === sourceId);
      if (!o) return 0;
      const srvTotal = (o.services || []).reduce((a, x) => a + Number(x.price || 0), 0);
      const prtTotal = (o.parts || []).reduce((a, p) => a + Number(p.price || 0) * Number(p.quantity || 1), 0);
      const orderTotal = Math.max(0, srvTotal + prtTotal + Number(o.visitFee || 0) - Number(o.calculatedDiscount || 0));
      if (o.paymentStatus === 'pago') return orderTotal;
      return (o.payments || [])
        .filter(p => p.status === 'pago')
        .reduce((acc, p) => acc + Number(p.amount || 0), 0);
    }
  };

  const generateNextReceiptNumber = (): string => {
    const year = new Date().getFullYear();
    const prefix = `REC-${year}-`;
    let maxSeq = 0;
    paymentReceipts.forEach(r => {
      if (r.receiptNumber.startsWith(prefix)) {
        const num = parseInt(r.receiptNumber.replace(prefix, ''), 10);
        if (!Number.isNaN(num) && num > maxSeq) maxSeq = num;
      }
    });
    const nextNum = Math.max(maxSeq + 1, paymentReceipts.length + 1);
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  };

  const resolveClientSnapshot = (
    clientId?: string,
    clientName?: string,
    fallbackDoc?: string,
    fallbackPhone?: string,
    fallbackAddress?: string
  ) => {
    const matchedClient =
      (clientId ? clients.find(c => c.id === clientId) : undefined) ||
      (clientName
        ? clients.find(c => c.name.trim().toLowerCase() === clientName.trim().toLowerCase())
        : undefined);

    let formattedAddress = fallbackAddress || '';
    if (matchedClient) {
      const addrObj =
        matchedClient.addresses?.find(a => a.isDefault) || matchedClient.addresses?.[0];
      if (addrObj && (addrObj.street || addrObj.city)) {
        formattedAddress = [
          [addrObj.street, addrObj.number].filter(Boolean).join(', '),
          addrObj.complement ? `(${addrObj.complement})` : '',
          addrObj.neighborhood,
          addrObj.city && addrObj.state ? `${addrObj.city}/${addrObj.state}` : addrObj.city || '',
          addrObj.cep ? `CEP ${addrObj.cep}` : ''
        ]
          .filter(Boolean)
          .join(' - ');
      } else if (matchedClient.street || matchedClient.city) {
        formattedAddress = [
          [matchedClient.street, matchedClient.number].filter(Boolean).join(', '),
          matchedClient.complement ? `(${matchedClient.complement})` : '',
          matchedClient.neighborhood,
          matchedClient.city && matchedClient.state
            ? `${matchedClient.city}/${matchedClient.state}`
            : matchedClient.city || '',
          matchedClient.cep ? `CEP ${matchedClient.cep}` : ''
        ]
          .filter(Boolean)
          .join(' - ');
      }
    }

    return {
      clientId: matchedClient?.id || clientId,
      clientName: matchedClient?.name || clientName || 'Consumidor Balcão PDV',
      clientDocument: matchedClient?.document || fallbackDoc || '',
      clientPhone: matchedClient?.phone || fallbackPhone || '',
      clientAddress: formattedAddress
    };
  };

  const settleSaleInPdv = (
    saleId: string,
    params: {
      payments: PaymentSplit[];
      paymentMethod: PaymentMethod;
      amountReceived?: number;
      changeAmount?: number;
      nsu?: string;
      terminalName?: string;
      saleOverride?: DirectSale;
      paidAmount?: number;
      splitId?: string;
      paymentKind?: PaymentReceiptKind;
      notes?: string;
      suppressAutoModal?: boolean;
    }
  ): CashRegisterMovement | null => {
    const sale = params.saleOverride || directSales.find(s => s.id === saleId);
    if (!sale) return null;

    let session = activeCashSession;
    if (!session) {
      session = openCashSession(params.terminalName || 'Caixa 01 - Balcão Principal', 0, 'Abertura automática ao receber venda');
    }

    const orderTotal = Math.max(0, Number(sale.total || 0));
    const previouslyPaid = getPaidAmountForSource('venda', sale.id);
    const remainingBefore = Math.max(0, Number((orderTotal - previouslyPaid).toFixed(2)));

    const splitsSum = params.payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const grossAmount = Number(
      (params.paidAmount !== undefined
        ? params.paidAmount
        : splitsSum > 0
        ? splitsSum
        : remainingBefore > 0
        ? remainingBefore
        : orderTotal
      ).toFixed(2)
    );

    const feeAmount = Number(params.payments.reduce((acc, p) => acc + Number(p.rateAmount || 0), 0).toFixed(2));
    const netAmount = Number(
      (params.payments.reduce((acc, p) => acc + Number(p.netAmount ?? p.amount ?? 0), 0) || grossAmount - feeAmount).toFixed(2)
    );

    const totalPaidAccumulated = Number(Math.min(orderTotal, previouslyPaid + grossAmount).toFixed(2));
    const remainingBalance = Math.max(0, Number((orderTotal - totalPaidAccumulated).toFixed(2)));
    const isFullyPaid = remainingBalance <= 0.01;

    const paymentKind: PaymentReceiptKind =
      params.paymentKind ||
      (previouslyPaid <= 0.01 && isFullyPaid
        ? 'vista'
        : previouslyPaid > 0.01 && isFullyPaid
        ? 'quitacao'
        : params.splitId
        ? 'parcela'
        : previouslyPaid <= 0.01 && !isFullyPaid
        ? 'entrada'
        : 'parcial');

    const settledAt = new Date().toISOString();
    const settledDateOnly = settledAt.split('T')[0];
    const generatedNsu = params.nsu || `PDV-${Math.floor(100000 + Math.random() * 900000)}`;
    const terminalName = params.terminalName || session.terminalName;
    const operatorName = currentUser?.name || 'Operador PDV';

    // Update PaymentSplit history on sale without losing prior paid entries
    const stampedNewSplits: PaymentSplit[] = params.payments.map(p => ({
      ...p,
      status: 'pago',
      paidAt: settledDateOnly,
      entryType: p.entryType || (paymentKind === 'entrada' ? 'entrada' : 'parcela')
    }));

    let updatedPayments: PaymentSplit[] = [];
    if (params.splitId && sale.payments && sale.payments.length > 0) {
      updatedPayments = sale.payments.map(p =>
        p.id === params.splitId
          ? {
              ...p,
              method: params.paymentMethod,
              status: 'pago' as const,
              paidAt: settledDateOnly
            }
          : p
      );
    } else {
      const priorPaidSplits = (sale.payments || []).filter(p => p.status === 'pago');
      const unpaidPlannedSplits = (sale.payments || []).filter(p => p.status !== 'pago');
      if (isFullyPaid) {
        updatedPayments = [...priorPaidSplits, ...stampedNewSplits];
      } else {
        updatedPayments = [...priorPaidSplits, ...stampedNewSplits, ...(unpaidPlannedSplits.length > 0 && priorPaidSplits.length > 0 ? unpaidPlannedSplits : [])];
      }
    }

    updateDirectSale(sale.id, {
      paymentStatus: isFullyPaid ? 'pago' : 'pendente',
      paymentMethod: params.paymentMethod,
      payments: updatedPayments,
      settledInPdvAt: isFullyPaid ? settledAt : sale.settledInPdvAt,
      pdvSessionId: session.id,
      pdvTerminal: terminalName
    });

    const clientSnap = resolveClientSnapshot(sale.clientId, sale.clientName);

    const movement: CashRegisterMovement = {
      id: `cm-vd-${Date.now()}`,
      sessionId: session.id,
      type: 'recebimento_venda',
      sourceType: 'venda',
      sourceId: sale.id,
      sourceCode: sale.code,
      clientId: clientSnap.clientId,
      clientName: clientSnap.clientName,
      description: `Baixa ${isFullyPaid ? 'Total' : 'Parcial'} Venda ${sale.code} - ${clientSnap.clientName}`,
      paymentMethod: params.paymentMethod,
      payments: stampedNewSplits,
      grossAmount,
      feeAmount,
      netAmount,
      amountReceived: params.amountReceived,
      changeAmount: params.changeAmount,
      nsu: generatedNsu,
      terminalName,
      operatorName,
      createdAt: settledAt
    };

    const receiptItems: PaymentReceiptItem[] = (sale.items || []).map(it => ({
      name: it.name,
      quantity: Number(it.quantity || 1),
      unitPrice: Number(it.price || 0),
      totalPrice: Number(it.price || 0) * Number(it.quantity || 1),
      kind: 'produto' as const
    }));
    if (Number(sale.calculatedDiscount || 0) > 0) {
      receiptItems.push({
        name: 'Desconto Aplicado',
        quantity: 1,
        unitPrice: -Number(sale.calculatedDiscount || 0),
        totalPrice: -Number(sale.calculatedDiscount || 0),
        kind: 'desconto'
      });
    }

    const receipt: PaymentReceipt = {
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      receiptNumber: generateNextReceiptNumber(),
      sourceType: 'venda',
      sourceId: sale.id,
      sourceCode: sale.code,
      cashSessionId: session.id,
      cashSessionCode: session.code,
      cashMovementId: movement.id,
      terminalName,
      operatorName,
      clientId: clientSnap.clientId,
      clientName: clientSnap.clientName,
      clientDocument: clientSnap.clientDocument,
      clientPhone: clientSnap.clientPhone,
      clientAddress: clientSnap.clientAddress,
      items: receiptItems,
      paymentMethod: params.paymentMethod,
      payments: stampedNewSplits,
      paymentKind,
      orderTotal,
      previouslyPaid,
      amountPaidNow: grossAmount,
      totalPaidAccumulated,
      remainingBalance,
      isFullyPaid,
      amountReceived: params.amountReceived,
      changeAmount: params.changeAmount,
      nsu: generatedNsu,
      notes: params.notes,
      createdAt: settledAt
    };

    setCashMovements(prev => [movement, ...prev]);
    syncCashMovementToCloud(movement);
    setPaymentReceipts(prev => [receipt, ...prev]);
    syncPaymentReceiptToCloud(receipt);

    if (!params.suppressAutoModal) {
      setActiveReceiptModal(receipt);
    }

    addAuditLog(
      'Baixa de Venda & Emissão de Recibo',
      `Venda ${sale.code} — Recibo ${receipt.receiptNumber} (${isFullyPaid ? 'Quitado' : `Parcial, falta R$ ${remainingBalance.toFixed(2)}`}). Recebido: R$ ${grossAmount.toFixed(2)}.`
    );
    return movement;
  };

  const settleServiceOrderInPdv = (
    orderId: string,
    params: {
      payments: PaymentSplit[];
      paymentMethod: PaymentMethod;
      amountReceived?: number;
      changeAmount?: number;
      nsu?: string;
      terminalName?: string;
      orderOverride?: ServiceOrder;
      paidAmount?: number;
      splitId?: string;
      paymentKind?: PaymentReceiptKind;
      notes?: string;
      suppressAutoModal?: boolean;
    }
  ): CashRegisterMovement | null => {
    const order = params.orderOverride || serviceOrders.find(o => o.id === orderId);
    if (!order) return null;

    let session = activeCashSession;
    if (!session) {
      session = openCashSession(params.terminalName || 'Caixa 01 - Balcão Principal', 0, 'Abertura automática ao receber OS');
    }

    const srvTotal = (order.services || []).reduce((a, s) => a + Number(s.price || 0), 0);
    const prtTotal = (order.parts || []).reduce((a, p) => a + (Number(p.price || 0) * Number(p.quantity || 1)), 0);
    const orderTotal = Math.max(0, srvTotal + prtTotal + Number(order.visitFee || 0) - Number(order.calculatedDiscount || 0));

    const previouslyPaid = getPaidAmountForSource('os', order.id);
    const remainingBefore = Math.max(0, Number((orderTotal - previouslyPaid).toFixed(2)));

    const splitsSum = params.payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const grossAmount = Number(
      (params.paidAmount !== undefined
        ? params.paidAmount
        : splitsSum > 0
        ? splitsSum
        : remainingBefore > 0
        ? remainingBefore
        : orderTotal
      ).toFixed(2)
    );

    const feeAmount = Number(params.payments.reduce((acc, p) => acc + Number(p.rateAmount || 0), 0).toFixed(2));
    const netAmount = Number(
      (params.payments.reduce((acc, p) => acc + Number(p.netAmount ?? p.amount ?? 0), 0) || grossAmount - feeAmount).toFixed(2)
    );

    const totalPaidAccumulated = Number(Math.min(orderTotal, previouslyPaid + grossAmount).toFixed(2));
    const remainingBalance = Math.max(0, Number((orderTotal - totalPaidAccumulated).toFixed(2)));
    const isFullyPaid = remainingBalance <= 0.01;

    const paymentKind: PaymentReceiptKind =
      params.paymentKind ||
      (previouslyPaid <= 0.01 && isFullyPaid
        ? 'vista'
        : previouslyPaid > 0.01 && isFullyPaid
        ? 'quitacao'
        : params.splitId
        ? 'parcela'
        : previouslyPaid <= 0.01 && !isFullyPaid
        ? 'entrada'
        : 'parcial');

    const settledAt = new Date().toISOString();
    const settledDateOnly = settledAt.split('T')[0];
    const generatedNsu = params.nsu || `OSPDV-${Math.floor(100000 + Math.random() * 900000)}`;
    const terminalName = params.terminalName || session.terminalName;
    const operatorName = currentUser?.name || 'Operador PDV';

    const nextStatus =
      order.status === 'orcamento_aberto' || order.status === 'aguardando_aprovacao'
        ? 'aprovada_em_andamento'
        : order.status;

    const stampedNewSplits: PaymentSplit[] = params.payments.map(p => ({
      ...p,
      status: 'pago',
      paidAt: settledDateOnly,
      entryType: p.entryType || (paymentKind === 'entrada' ? 'entrada' : 'parcela')
    }));

    let updatedPayments: PaymentSplit[] = [];
    if (params.splitId && order.payments && order.payments.length > 0) {
      updatedPayments = order.payments.map(p =>
        p.id === params.splitId
          ? {
              ...p,
              method: params.paymentMethod,
              status: 'pago' as const,
              paidAt: settledDateOnly
            }
          : p
      );
    } else {
      const priorPaidSplits = (order.payments || []).filter(p => p.status === 'pago');
      const unpaidPlannedSplits = (order.payments || []).filter(p => p.status !== 'pago');
      if (isFullyPaid) {
        updatedPayments = [...priorPaidSplits, ...stampedNewSplits];
      } else {
        updatedPayments = [...priorPaidSplits, ...stampedNewSplits, ...(unpaidPlannedSplits.length > 0 && priorPaidSplits.length > 0 ? unpaidPlannedSplits : [])];
      }
    }

    updateServiceOrder(order.id, {
      paymentStatus: isFullyPaid ? 'pago' : 'pendente',
      paymentMethod: params.paymentMethod,
      payments: updatedPayments,
      status: nextStatus,
      settledInPdvAt: isFullyPaid ? settledAt : order.settledInPdvAt,
      pdvSessionId: session.id,
      pdvTerminal: terminalName
    });

    const clientSnap = resolveClientSnapshot(
      order.clientId,
      order.clientName,
      order.clientDocument,
      order.clientPhone,
      order.clientAddress
    );

    const movement: CashRegisterMovement = {
      id: `cm-os-${Date.now()}`,
      sessionId: session.id,
      type: 'recebimento_os',
      sourceType: 'os',
      sourceId: order.id,
      sourceCode: order.code,
      clientId: clientSnap.clientId,
      clientName: clientSnap.clientName,
      description: `Baixa ${isFullyPaid ? 'Total' : 'Parcial'} OS ${order.code} - ${clientSnap.clientName}`,
      paymentMethod: params.paymentMethod,
      payments: stampedNewSplits,
      grossAmount,
      feeAmount,
      netAmount,
      amountReceived: params.amountReceived,
      changeAmount: params.changeAmount,
      nsu: generatedNsu,
      terminalName,
      operatorName,
      createdAt: settledAt
    };

    const receiptItems: PaymentReceiptItem[] = [
      ...(order.services || []).map(s => ({
        name: `Serviço: ${s.name}`,
        quantity: 1,
        unitPrice: Number(s.price || 0),
        totalPrice: Number(s.price || 0),
        kind: 'servico' as const
      })),
      ...(order.parts || []).map(p => ({
        name: p.name,
        quantity: Number(p.quantity || 1),
        unitPrice: Number(p.price || 0),
        totalPrice: Number(p.price || 0) * Number(p.quantity || 1),
        kind: 'peca' as const
      }))
    ];
    if (Number(order.visitFee || 0) > 0) {
      receiptItems.push({
        name: 'Taxa de Visita Técnica',
        quantity: 1,
        unitPrice: Number(order.visitFee || 0),
        totalPrice: Number(order.visitFee || 0),
        kind: 'taxa'
      });
    }
    if (Number(order.calculatedDiscount || 0) > 0) {
      receiptItems.push({
        name: 'Desconto Aplicado',
        quantity: 1,
        unitPrice: -Number(order.calculatedDiscount || 0),
        totalPrice: -Number(order.calculatedDiscount || 0),
        kind: 'desconto'
      });
    }

    const receipt: PaymentReceipt = {
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      receiptNumber: generateNextReceiptNumber(),
      sourceType: 'os',
      sourceId: order.id,
      sourceCode: order.code,
      cashSessionId: session.id,
      cashSessionCode: session.code,
      cashMovementId: movement.id,
      terminalName,
      operatorName,
      clientId: clientSnap.clientId,
      clientName: clientSnap.clientName,
      clientDocument: clientSnap.clientDocument,
      clientPhone: clientSnap.clientPhone,
      clientAddress: clientSnap.clientAddress,
      items: receiptItems,
      paymentMethod: params.paymentMethod,
      payments: stampedNewSplits,
      paymentKind,
      orderTotal,
      previouslyPaid,
      amountPaidNow: grossAmount,
      totalPaidAccumulated,
      remainingBalance,
      isFullyPaid,
      amountReceived: params.amountReceived,
      changeAmount: params.changeAmount,
      nsu: generatedNsu,
      notes: params.notes,
      createdAt: settledAt
    };

    setCashMovements(prev => [movement, ...prev]);
    syncCashMovementToCloud(movement);
    setPaymentReceipts(prev => [receipt, ...prev]);
    syncPaymentReceiptToCloud(receipt);

    if (!params.suppressAutoModal) {
      setActiveReceiptModal(receipt);
    }

    addAuditLog(
      'Baixa de OS & Emissão de Recibo',
      `OS ${order.code} — Recibo ${receipt.receiptNumber} (${isFullyPaid ? 'Quitado' : `Parcial, falta R$ ${remainingBalance.toFixed(2)}`}). Recebido: R$ ${grossAmount.toFixed(2)}.`
    );
    return movement;
  };

  const addGeneralExpense = (exp: Omit<GeneralExpense, 'id'>) => {
    const newExp: GeneralExpense = {
      ...exp,
      id: `ge-${Date.now()}`
    };
    setGeneralExpenses(prev => [newExp, ...prev]);
    addAuditLog('Nova Despesa', `Despesa de R$ ${exp.cost.toFixed(2)} lançada (${exp.description}).`);
  };

  const dismissedAutoExpenseIdsRef = React.useRef<Set<string>>(new Set());

  const updateGeneralExpense = (id: string, updates: Partial<GeneralExpense>) => {
    setGeneralExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteGeneralExpense = (id: string) => {
    if (id.startsWith('auto-')) {
      dismissedAutoExpenseIdsRef.current.add(id);
    }
    setGeneralExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addVehicleExpense = (vexp: Omit<VehicleMaintenance, 'id'>) => {
    const newVexp: VehicleMaintenance = {
      ...vexp,
      id: `vm-${Date.now()}`
    };
    setVehicleExpenses(prev => [newVexp, ...prev]);

    if (vexp.kmAtService) {
      setVehicles(prev => prev.map(v => {
        if (v.id === vexp.vehicleId && vexp.kmAtService! > v.currentKm) {
          return { ...v, currentKm: vexp.kmAtService! };
        }
        return v;
      }));
    }
  };

  const deleteVehicleExpense = (id: string) => {
    setVehicleExpenses(prev => prev.filter(v => v.id !== id));
  };

  const addVehicle = (veh: Omit<Vehicle, 'id'>) => {
    const newVeh: Vehicle = {
      ...veh,
      id: `veh-${Date.now()}`
    };
    setVehicles(prev => [...prev, newVeh]);
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const deleteVehicle = (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  const addEmployee = (emp: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...emp,
      id: `emp-${Date.now()}`
    };
    setEmployees(prev => [...prev, newEmp]);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const addAuthUser = (user: Omit<AuthUser, 'id'>) => {
    const newUser: AuthUser = {
      ...user,
      active: user.active !== false,
      id: `usr-${Date.now()}`
    };
    setAuthUsers(prev => [...prev, newUser]);
    addAuditLog('Cadastro de Usuário', `Novo usuário criado: ${newUser.name} (${newUser.username}) · Perfil ${newUser.role}`);
  };

  const updateAuthUser = (id: string, updates: Partial<AuthUser>) => {
    setAuthUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    addAuditLog('Atualização de Usuário', `Dados/permissões do usuário ${updates.name || id} atualizados.`);
  };

  const deleteAuthUser = (id: string) => {
    setAuthUsers(prev => prev.filter(u => u.id !== id));
    addAuditLog('Exclusão de Usuário', `Usuário ${id} removido do sistema.`);
  };

  const addSetupCost = (item: Omit<InitialSetupCostItem, 'id'>) => {
    const newItem: InitialSetupCostItem = {
      ...item,
      id: `sc-${Date.now()}`
    };
    setSetupCosts(prev => [...prev, newItem]);
  };

  const updateSetupCost = (id: string, updates: Partial<InitialSetupCostItem>) => {
    setSetupCosts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSetupCost = (id: string) => {
    setSetupCosts(prev => prev.filter(s => s.id !== id));
  };

  const mapSetupCategoryToExpenseCategory = (cat: string): ExpenseCategory => {
    switch (cat) {
      case 'aluguel_loja':
      case 'aluguel':
        return 'aluguel';
      case 'salario_clt':
      case 'salario':
        return 'salario';
      case 'comissao':
        return 'comissao';
      case 'compra_materiais':
        return 'compra_materiais';
      case 'das_mei':
        return 'das_mei';
      case 'combustivel':
        return 'gasolina';
      case 'internet':
        return 'internet';
      case 'celular':
      case 'telefone':
        return 'celular';
      case 'alimentacao':
        return 'alimentacao';
      case 'seguro_veiculo':
        return 'seguro';
      case 'ipva':
        return 'ipva';
      case 'impostos_carro':
        return 'impostos_carro';
      case 'divida_empresa':
        return 'divida_empresa';
      case 'ferramental':
        return 'ferramental';
      default:
        return 'outros';
    }
  };

  const buildReconciledGeneralExpenses = (
    currentExpenses: GeneralExpense[],
    monthYear: string
  ): { nextExpenses: GeneralExpense[]; syncedCount: number } => {
    const existingById = new Map<string, GeneralExpense>();
    currentExpenses.forEach(e => existingById.set(e.id, e));

    const autoEntries: GeneralExpense[] = [];

    // 1. Contas Recorrentes, Parceladas, Pontuais & Custos Cadastrados (Aluguel, Telefone, Internet, Materiais, etc.)
    setupCosts.forEach(item => {
      if (item.syncWithGeneralExpenses === false) return;
      if (item.status === 'planejado') return;

      const isRecurrent = item.costType === 'recorrente' || item.isRecurring === true;
      const isInstallment = item.costType === 'parcelado';
      const isOneTime = !isRecurrent && !isInstallment;

      if ((isRecurrent || isInstallment) && item.status === 'quitado') return;

      let dueDate = item.dueDate || item.date || `${monthYear}-${String(item.dueDay || 10).padStart(2, '0')}`;
      if ((isRecurrent || isInstallment) && !dueDate.startsWith(monthYear) && item.dueDay) {
        dueDate = `${monthYear}-${String(item.dueDay).padStart(2, '0')}`;
      }
      if (isOneTime && !dueDate.startsWith(monthYear)) return;

      const cost = isInstallment
        ? (item.installmentValue || (item.installmentsCount ? item.actualCost / item.installmentsCount : item.actualCost))
        : (item.installmentValue || item.actualCost || 0);
      if (cost <= 0) return;

      const expenseDescription = isInstallment
        ? `${item.name} (Parc. ${(item.paidInstallments || 0) + 1}/${item.installmentsCount || 1})`
        : item.name;

      const autoId = `auto-setup-${item.id}-${monthYear}`;
      if (dismissedAutoExpenseIdsRef.current.has(autoId)) return;

      // Avoid duplicating legacy manually-synced entries created before deterministic IDs
      const legacyManualMatch = currentExpenses.find(
        e => !e.id.startsWith('auto-') &&
             (e.description === expenseDescription || e.description.startsWith(item.name)) &&
             e.dueDate.startsWith(monthYear)
      );
      if (legacyManualMatch) return;

      const prevEntry = existingById.get(autoId);
      autoEntries.push({
        id: autoId,
        category: mapSetupCategoryToExpenseCategory(item.category),
        description: expenseDescription,
        cost: Number(cost.toFixed(2)),
        dueDate,
        isPaid: prevEntry?.isPaid ?? (isOneTime && item.status === 'quitado'),
        paymentDate: prevEntry?.paymentDate,
        supplier: item.creditor || 'Contas da Empresa',
        isRecurring: isRecurrent
      });
    });

    // 2. Folha de Funcionários (Salários Fixos, Horas Trabalhadas & Encargos)
    employees.forEach(emp => {
      if (emp.status === 'Inativo') return;
      const nominalPay = computeEmployeeNominalPay(emp);
      const totalPayroll = Number((nominalPay + Number(emp.benefitsCharges || 0)).toFixed(2));
      if (totalPayroll > 0) {
        const autoPayId = `auto-emp-pay-${emp.id}-${monthYear}`;
        if (!dismissedAutoExpenseIdsRef.current.has(autoPayId)) {
          const prevEntry = existingById.get(autoPayId);
          const remLabel = REMUNERATION_TYPE_LABELS[getEmployeeRemunerationType(emp)];
          autoEntries.push({
            id: autoPayId,
            category: 'salario',
            description: `Folha (${remLabel}): ${emp.name}`,
            cost: totalPayroll,
            dueDate: `${monthYear}-05`,
            isPaid: prevEntry?.isPaid ?? false,
            paymentDate: prevEntry?.paymentDate,
            employeeId: emp.id,
            supplier: emp.name,
            isRecurring: true
          });
        }
      }

      // 3. Comissões conquistadas em O.S. concluídas e Vendas pagas no mês
      if (hasEmployeeCommission(emp) && Number(emp.commissionRate || 0) > 0) {
        const monthOrders = serviceOrders.filter(o => {
          if (o.employeeId !== emp.id) return false;
          const dateToCheck = o.completionDate || o.openDate;
          const isFinished = o.status === 'concluida_aguardando_retirada' || o.status === 'entregue_finalizada';
          return dateToCheck.startsWith(monthYear) && isFinished;
        });
        let commBase = 0;
        monthOrders.forEach(o => {
          const fin = computeServiceOrderFinancials(o);
          commBase += fin.netServicesAndVisit;
        });
        const monthSales = directSales.filter(
          s => s.employeeId === emp.id && s.date.startsWith(monthYear) && s.paymentStatus === 'pago' && s.status !== 'cancelada'
        );
        monthSales.forEach(s => {
          commBase += Number(s.total || 0);
        });

        const commissionEarned = Number((Math.max(0, commBase) * (Number(emp.commissionRate) / 100)).toFixed(2));
        if (commissionEarned > 0) {
          const autoCommId = `auto-emp-comm-${emp.id}-${monthYear}`;
          if (!dismissedAutoExpenseIdsRef.current.has(autoCommId)) {
            const prevEntry = existingById.get(autoCommId);
            autoEntries.push({
              id: autoCommId,
              category: 'comissao',
              description: `Comissão (${emp.commissionRate}%): ${emp.name}`,
              cost: commissionEarned,
              dueDate: `${monthYear}-10`,
              isPaid: prevEntry?.isPaid ?? false,
              paymentDate: prevEntry?.paymentDate,
              employeeId: emp.id,
              supplier: emp.name,
              isRecurring: false
            });
          }
        }
      }
    });

    // 4. Compras de Materiais (Entradas manuais ou XML sem conta a pagar prévia no mês)
    stockMovements.forEach(move => {
      if (move.type !== 'entrada_manual' && move.type !== 'entrada_xml') return;
      if (!move.date.startsWith(monthYear)) return;
      const totalCost = Number((Number(move.unitCost || 0) * Number(move.quantity || 0)).toFixed(2));
      if (totalCost <= 0) return;

      if (move.type === 'entrada_xml' && move.referenceDoc) {
        const refPrefix = move.referenceDoc.split(' (')[0];
        const hasExistingNFePayable = currentExpenses.some(
          e => !e.id.startsWith('auto-') &&
               (e.invoiceNumber === refPrefix || e.description.includes(refPrefix))
        );
        if (hasExistingNFePayable) return;
      }

      const autoMatId = `auto-mat-${move.id}`;
      if (dismissedAutoExpenseIdsRef.current.has(autoMatId)) return;

      const prevEntry = existingById.get(autoMatId);
      autoEntries.push({
        id: autoMatId,
        category: 'compra_materiais',
        description: `Compra de Material: ${move.productName} (${move.quantity}x)`,
        cost: totalCost,
        dueDate: move.date,
        isPaid: prevEntry?.isPaid ?? false,
        paymentDate: prevEntry?.paymentDate,
        supplier: move.referenceDoc || 'Compra de Materiais / Estoque',
        invoiceNumber: move.referenceDoc,
        isRecurring: false
      });
    });

    // Keep manual expenses + auto expenses from other months, then append reconciled auto expenses for this month
    const retainedExpenses = currentExpenses.filter(e => {
      if (!e.id.startsWith('auto-')) return true;
      if (e.id.startsWith('auto-mat-')) {
        return !e.dueDate.startsWith(monthYear);
      }
      return !e.id.endsWith(`-${monthYear}`);
    });

    const nextExpenses = [...retainedExpenses, ...autoEntries];
    return { nextExpenses, syncedCount: autoEntries.length };
  };

  // Automatic real-time reconciliation of Costs, Payroll, Commissions and Material Purchases
  useEffect(() => {
    setGeneralExpenses(prev => {
      const { nextExpenses } = buildReconciledGeneralExpenses(prev, selectedMonthYear);
      if (JSON.stringify(prev) === JSON.stringify(nextExpenses)) {
        return prev;
      }
      return nextExpenses;
    });
  }, [setupCosts, employees, stockMovements, serviceOrders, directSales, selectedMonthYear]);

  const syncSetupCostsToExpenses = () => {
    let syncedCount = 0;
    setGeneralExpenses(prev => {
      const result = buildReconciledGeneralExpenses(prev, selectedMonthYear);
      syncedCount = result.syncedCount;
      if (JSON.stringify(prev) === JSON.stringify(result.nextExpenses)) {
        return prev;
      }
      return result.nextExpenses;
    });
    return { count: syncedCount };
  };

  const getEmployeeById = (id: string) => employees.find(e => e.id === id);
  const getVehicleById = (id: string) => vehicles.find(v => v.id === id);

  // Profitability per Employee calculation (alinhado 100% com o DRE)
  const calculateEmployeeProfitability = (employeeId: string, monthYear: string): EmployeeProfitabilityReport | null => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return null;

    // Completed or Billed Orders in this month
    const monthOrders = serviceOrders.filter(o => {
      if (o.employeeId !== employeeId) return false;
      const dateToCheck = o.completionDate || o.openDate;
      return dateToCheck.startsWith(monthYear) && isServiceOrderFinishedForDRE(o);
    });

    let servicesRevenue = 0;
    let partsRevenue = 0;
    let partsCost = 0;
    let visitFeesRevenue = 0;

    monthOrders.forEach(o => {
      const fin = computeServiceOrderFinancials(o);
      // Separa visitFee proporcionalmente sem nunca ficar negativo
      const netVisit = Math.min(fin.visitFee, fin.netServicesAndVisit);
      const netServicesOnly = Math.max(0, Number((fin.netServicesAndVisit - netVisit).toFixed(2)));
      servicesRevenue += netServicesOnly;
      visitFeesRevenue += netVisit;
      partsRevenue += fin.netParts;
      partsCost += fin.partsCost;
    });

    const monthSales = directSales.filter(s => {
      return s.employeeId === employeeId && s.date.startsWith(monthYear) && s.paymentStatus === 'pago' && s.status !== 'cancelada';
    });

    let directSalesRevenue = 0;
    monthSales.forEach(s => {
      directSalesRevenue += Number(s.total || 0);
      const saleCost = s.items.reduce((acc, it) => acc + (Number(it.cost || 0) * Number(it.quantity || 1)), 0);
      partsCost += saleCost;
    });

    const totalRevenue = Number((servicesRevenue + partsRevenue + directSalesRevenue + visitFeesRevenue).toFixed(2));
    const grossContribution = Number((totalRevenue - partsCost).toFixed(2));

    const isActive = isActiveEmployee(employee);
    const remunerationType = getEmployeeRemunerationType(employee);
    const baseSalary = isActive ? computeEmployeeNominalPay(employee) : 0;
    const benefitsCharges = isActive ? Number(employee.benefitsCharges || 0) : 0;
    const commissionEarned = hasEmployeeCommission(employee)
      ? Number(
          (
            ((servicesRevenue + visitFeesRevenue) * (Number(employee.commissionRate || 0) / 100)) +
            (directSalesRevenue * (Number(employee.commissionRate || 0) / 100))
          ).toFixed(2)
        )
      : 0;
    const totalPersonnelCost = Number((baseSalary + benefitsCharges + commissionEarned).toFixed(2));

    const assignedVehicle = vehicles.find(v => v.id === employee.assignedVehicleId || v.assignedEmployeeId === employee.id);

    const fuelExpenses = vehicleExpenses.filter(ve => {
      if (!ve.date.startsWith(monthYear)) return false;
      if (ve.category !== 'combustivel') return false;
      if (ve.employeeId === employeeId) return true;
      if (assignedVehicle && ve.vehicleId === assignedVehicle.id) return true;
      return false;
    });
    const fuelCost = fuelExpenses.reduce((acc, fe) => acc + Number(fe.cost || 0), 0);

    const directVehicleExpenses = vehicleExpenses.filter(ve => {
      if (!ve.date.startsWith(monthYear)) return false;
      if (ve.category === 'combustivel') return false;
      if (ve.employeeId === employeeId) return true;
      if (assignedVehicle && ve.vehicleId === assignedVehicle.id) return true;
      return false;
    });
    const vehicleDirectMaintenanceCost = directVehicleExpenses.reduce((acc, ve) => acc + Number(ve.cost || 0), 0);

    let vehicleProratedFixedCost = 0;
    if (assignedVehicle && isActive) {
      vehicleProratedFixedCost = (Number(assignedVehicle.annualIpvaValue || 0) + Number(assignedVehicle.annualInsuranceValue || 0)) / 12;
    }

    const mealsExpenses = generalExpenses.filter(ge => {
      return ge.category === 'alimentacao' && ge.employeeId === employeeId && ge.dueDate.startsWith(monthYear);
    });
    const mealsCost = mealsExpenses.reduce((acc, me) => acc + Number(me.cost || 0), 0);

    const cellphoneExpenses = generalExpenses.filter(ge => {
      return ge.category === 'celular' && ge.employeeId === employeeId && ge.dueDate.startsWith(monthYear);
    });
    const cellphoneCost = cellphoneExpenses.reduce((acc, ce) => acc + Number(ce.cost || 0), 0);

    const totalDirectCosts = Number((
      totalPersonnelCost +
      fuelCost +
      mealsCost +
      vehicleDirectMaintenanceCost +
      vehicleProratedFixedCost +
      cellphoneCost
    ).toFixed(2));

    const netProfit = Number((grossContribution - totalDirectCosts).toFixed(2));
    const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const roiMultiplier = totalDirectCosts > 0 ? totalRevenue / totalDirectCosts : 0;

    let performanceTier: 'Excelente' | 'Bom' | 'Atenção' | 'Prejuízo' = 'Atenção';
    if (netProfit < 0) {
      performanceTier = 'Prejuízo';
    } else if (totalRevenue === 0 && totalDirectCosts === 0) {
      performanceTier = 'Atenção';
    } else if (netMarginPercent > 35) {
      performanceTier = 'Excelente';
    } else if (netMarginPercent >= 15) {
      performanceTier = 'Bom';
    } else {
      performanceTier = 'Atenção';
    }

    return {
      employee,
      monthYear,
      remunerationType,
      ordersCount: monthOrders.length,
      servicesRevenue,
      partsRevenue,
      directSalesRevenue,
      visitFeesRevenue,
      totalRevenue,
      partsCost,
      grossContribution,
      baseSalary,
      benefitsCharges,
      commissionEarned,
      totalPersonnelCost,
      fuelCost,
      mealsCost,
      vehicleDirectMaintenanceCost,
      vehicleProratedFixedCost,
      cellphoneCost,
      totalDirectCosts,
      netProfit,
      netMarginPercent,
      roiMultiplier,
      performanceTier
    };
  };

  const getMonthlyProfitabilityAllEmployees = (monthYear: string): EmployeeProfitabilityReport[] => {
    return employees
      .map(emp => calculateEmployeeProfitability(emp.id, monthYear))
      .filter((rep): rep is EmployeeProfitabilityReport => {
        if (!rep) return false;
        // Oculta inativos que não tiveram nenhuma movimentação no período
        if (!isActiveEmployee(rep.employee) && rep.ordersCount === 0 && rep.directSalesRevenue === 0) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.netProfit - a.netProfit);
  };

  const toggleDirectSalePayment = (saleId: string) => {
    const target = directSales.find(s => s.id === saleId);
    if (!target) return;

    if (target.paymentStatus === 'pago') {
      updateDirectSale(saleId, { paymentStatus: 'pendente' });
      return;
    }

    const paidSoFar = getPaidAmountForSource('venda', target.id);
    const remaining = Math.max(0, Number((target.total - paidSoFar).toFixed(2))) || target.total;
    const method = target.paymentMethod || 'pix';
    settleSaleInPdv(target.id, {
      payments: [{ id: `fin-${Date.now()}`, method, amount: remaining, netAmount: remaining }],
      paymentMethod: method,
      paidAmount: remaining,
      terminalName: target.pdvTerminal || 'Financeiro / Caixa 01',
      saleOverride: target
    });
  };

  const toggleServiceOrderPayment = (orderId: string) => {
    const target = serviceOrders.find(o => o.id === orderId);
    if (!target) return;

    if (target.paymentStatus === 'pago') {
      updateServiceOrder(orderId, { paymentStatus: 'pendente' });
      return;
    }

    const srvTotal = (target.services || []).reduce((a, s) => a + Number(s.price || 0), 0);
    const prtTotal = (target.parts || []).reduce((a, p) => a + Number(p.price || 0) * Number(p.quantity || 1), 0);
    const orderTotal = Math.max(0, srvTotal + prtTotal + Number(target.visitFee || 0) - Number(target.calculatedDiscount || 0));
    const paidSoFar = getPaidAmountForSource('os', target.id);
    const remaining = Math.max(0, Number((orderTotal - paidSoFar).toFixed(2))) || orderTotal;
    const method = target.paymentMethod || 'pix';

    settleServiceOrderInPdv(target.id, {
      payments: [{ id: `fin-os-${Date.now()}`, method, amount: remaining, netAmount: remaining }],
      paymentMethod: method,
      paidAmount: remaining,
      terminalName: target.pdvTerminal || 'Financeiro / Caixa 01',
      orderOverride: target
    });
  };

  const toggleGeneralExpensePayment = (id: string) => {
    setGeneralExpenses(prev => prev.map(e => {
      if (e.id === id) {
        const nextPaid = !e.isPaid;
        return { 
          ...e, 
          isPaid: nextPaid, 
          paymentDate: nextPaid ? new Date().toISOString().split('T')[0] : undefined 
        };
      }
      return e;
    }));
  };

  const applyBulkMarginsToAllProducts = (retailMargin = 55, wholesaleMargin = 35) => {
    let count = 0;
    setProducts(prev => prev.map(p => {
      const cost = p.costPrice || 0;
      if (cost > 0) {
        count++;
        return {
          ...p,
          retailMarginPercent: retailMargin,
          retailPrice: Number((cost * (1 + retailMargin / 100)).toFixed(2)),
          wholesaleMarginPercent: wholesaleMargin,
          wholesalePrice: Number((cost * (1 + wholesaleMargin / 100)).toFixed(2))
        };
      }
      return p;
    }));
    addAuditLog('Reajuste de Margens em Massa', `Margens de ${retailMargin}% (Varejo) e ${wholesaleMargin}% (Atacado) aplicadas a ${count} produtos.`);
    return { count };
  };

  // Company-wide monthly financial summary (DRE Oficial) com precisão centavo a centavo
  const monthlyFinancialSummary = useMemo(() => {
    const allReports = getMonthlyProfitabilityAllEmployees(selectedMonthYear);

    // 1. Receitas de Ordens de Serviço faturadas/concluídas no mês (desconto rateado sem jamais negativar serviços)
    const monthOrdersFinished = serviceOrders.filter(o => {
      const d = o.completionDate || o.openDate;
      return d.startsWith(selectedMonthYear) && isServiceOrderFinishedForDRE(o);
    });

    let ordersGrossServices = 0;
    let ordersGrossParts = 0;
    let ordersDiscounts = 0;
    let ordersServicesRevenue = 0;
    let ordersPartsRevenue = 0;
    let ordersPartsCost = 0;
    let orderCardFees = 0;

    monthOrdersFinished.forEach(o => {
      const fin = computeServiceOrderFinancials(o);
      ordersGrossServices += fin.grossServices + fin.visitFee;
      ordersGrossParts += fin.grossParts;
      ordersDiscounts += fin.discount;
      ordersServicesRevenue += fin.netServicesAndVisit;
      ordersPartsRevenue += fin.netParts;
      ordersPartsCost += fin.partsCost;
      orderCardFees += fin.absorbedCardFees;
    });

    // 2. Receitas de Vendas Diretas ativas no mês
    const monthSales = directSales.filter(s => s.date.startsWith(selectedMonthYear) && s.status !== 'cancelada');
    const salesRevenue = monthSales.reduce((acc, s) => acc + Math.max(0, Number(s.total || 0)), 0);
    const salesCost = monthSales.reduce(
      (acc, s) => acc + s.items.reduce((a, b) => a + (Number(b.cost || 0) * Number(b.quantity || 1)), 0),
      0
    );
    const salesCardFees = monthSales.reduce((acc, s) => acc + computeAbsorbedCardFees(s.payments), 0);

    // Total de Faturamento Líquido e CMV
    const totalRevenue = Number((ordersServicesRevenue + ordersPartsRevenue + salesRevenue).toFixed(2));
    const totalPartsCost = Number((ordersPartsCost + salesCost).toFixed(2));
    const grossMargin = Number((totalRevenue - totalPartsCost).toFixed(2));

    // 3. Custos com Pessoal (Apenas colaboradores ativos + comissões apuradas no período)
    const activeEmployees = employees.filter(isActiveEmployee);
    const baseSalaries = Number(activeEmployees.reduce((a, b) => a + computeEmployeeNominalPay(b), 0).toFixed(2));
    const benefitsCharges = Number(activeEmployees.reduce((a, b) => a + Number(b.benefitsCharges || 0), 0).toFixed(2));
    const commissions = Number(allReports.reduce((acc, r) => acc + r.commissionEarned, 0).toFixed(2));
    const totalPersonnelCost = Number((baseSalaries + benefitsCharges + commissions).toFixed(2));

    // 4. Custos com Frota & Veículos
    const monthVehicleExpenses = vehicleExpenses.filter(ve => ve.date.startsWith(selectedMonthYear));
    const totalVehicleDirect = Number(monthVehicleExpenses.reduce((acc, ve) => acc + Number(ve.cost || 0), 0).toFixed(2));
    const totalVehicleProrated = Number(
      vehicles.reduce((acc, v) => acc + ((Number(v.annualIpvaValue || 0) + Number(v.annualInsuranceValue || 0)) / 12), 0).toFixed(2)
    );
    const totalVehicleCost = Number((totalVehicleDirect + totalVehicleProrated).toFixed(2));

    // 5. Custos Operacionais & Administrativos (exclui auto-emp-* já somado em totalPersonnelCost)
    const monthGeneralExpenses = generalExpenses.filter(ge => ge.dueDate.startsWith(selectedMonthYear));
    const generalExpensesSum = Number(
      monthGeneralExpenses
        .filter(ge => !isAutoPayrollExpense(ge))
        .reduce((acc, ge) => acc + Number(ge.cost || 0), 0)
        .toFixed(2)
    );

    // Parcelas de dívidas ativas ainda não quitadas e não sincronizadas em generalExpenses
    const unsyncedDebtInstallments = computeUnsyncedDebtInstallments(setupCosts);
    const totalOperationalCost = Number((generalExpensesSum + unsyncedDebtInstallments).toFixed(2));

    // 6. Taxas de Operadoras de Cartão absorvidas pela empresa no mês (exclui canceladas, orçamentos e juros repassados ao cliente)
    const totalCardFees = Number((orderCardFees + salesCardFees).toFixed(2));

    const totalCosts = Number((
      totalPartsCost +
      totalPersonnelCost +
      totalVehicleCost +
      totalOperationalCost +
      totalCardFees
    ).toFixed(2));
    const netProfit = Number((totalRevenue - totalCosts).toFixed(2));
    const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // 7. Contas a Receber Pendentes no Mês (exclui canceladas e orçamentos abertos; deduz pagamentos parciais já recebidos)
    const pendingOrdersReceivables = serviceOrders
      .filter(o => (o.completionDate || o.openDate).startsWith(selectedMonthYear) && isServiceOrderReceivable(o) && o.paymentStatus !== 'pago')
      .reduce((acc, o) => {
        const fin = computeServiceOrderFinancials(o);
        const alreadyPaid = getPaidAmountForSource('os', o.id);
        return acc + Math.max(0, Number((fin.netTotal - alreadyPaid).toFixed(2)));
      }, 0);

    const pendingSalesReceivables = directSales
      .filter(s => s.date.startsWith(selectedMonthYear) && s.paymentStatus !== 'pago' && s.status !== 'cancelada')
      .reduce((acc, s) => {
        const alreadyPaid = getPaidAmountForSource('venda', s.id);
        return acc + Math.max(0, Number((Number(s.total || 0) - alreadyPaid).toFixed(2)));
      }, 0);

    const totalPendingReceivables = Number((pendingOrdersReceivables + pendingSalesReceivables).toFixed(2));

    // 8. Contas a Pagar Pendentes no Mês
    const pendingGeneralPayables = monthGeneralExpenses
      .filter(e => !e.isPaid)
      .reduce((acc, e) => acc + Number(e.cost || 0), 0);

    const totalPendingPayables = Number((pendingGeneralPayables + unsyncedDebtInstallments).toFixed(2));

    const completedOrders = monthOrdersFinished.length;
    const activeOrders = serviceOrders.filter(o => {
      return (
        o.status === 'orcamento_aberto' ||
        o.status === 'aguardando_aprovacao' ||
        o.status === 'aprovada_em_andamento' ||
        o.status === 'aguardando_pecas'
      );
    }).length;

    return {
      ordersGrossServices: Number(ordersGrossServices.toFixed(2)),
      ordersGrossParts: Number(ordersGrossParts.toFixed(2)),
      ordersDiscounts: Number(ordersDiscounts.toFixed(2)),
      ordersServicesRevenue: Number(ordersServicesRevenue.toFixed(2)),
      ordersPartsRevenue: Number(ordersPartsRevenue.toFixed(2)),
      salesRevenue: Number(salesRevenue.toFixed(2)),
      totalRevenue,
      ordersPartsCost: Number(ordersPartsCost.toFixed(2)),
      salesCost: Number(salesCost.toFixed(2)),
      totalPartsCost,
      grossMargin,
      baseSalaries,
      benefitsCharges,
      commissions,
      totalPersonnelCost,
      totalVehicleDirect,
      totalVehicleProrated,
      totalVehicleCost,
      generalExpensesSum,
      unsyncedDebtInstallments,
      totalOperationalCost,
      totalCardFees,
      totalCosts,
      netProfit,
      netMarginPercent,
      totalPendingReceivables,
      totalPendingPayables,
      ordersCompletedCount: completedOrders,
      ordersActiveCount: activeOrders
    };
  }, [selectedMonthYear, employees, vehicles, vehicleExpenses, generalExpenses, serviceOrders, directSales, setupCosts, paymentReceipts]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        logout,
        isLogoutModalOpen,
        openLogoutModal,
        closeLogoutModal,
        authUsers,
        addAuthUser,
        updateAuthUser,
        deleteAuthUser,
        currentTheme,
        setTheme: setCurrentTheme,
        themeDefinitions,
        activeThemeDef,
        currentRole,
        setCurrentRole,
        companySettings,
        updateCompanySettings,
        sequenceSettings,
        updateSequenceSettings,
        getNextServiceOrderCode,
        getNextSaleCode,
        getNextBudgetCode,
        warrantyPolicies,
        addWarrantyPolicy,
        updateWarrantyPolicy,
        deleteWarrantyPolicy,
        getWarrantyForServices,
        serviceCatalog,
        addServiceCatalogItem,
        updateServiceCatalogItem,
        deleteServiceCatalogItem,
        checklistTemplates,
        addChecklistTemplate,
        updateChecklistTemplate,
        deleteChecklistTemplate,
        exportDatabaseJson,
        restoreDatabaseJson,
        clients,
        suppliers,
        products,
        stockMovements,
        cardRates,
        cardOperators,
        pagBankTransactions,
        customerTickets,
        auditLogs,
        employees,
        vehicles,
        vehicleExpenses,
        generalExpenses,
        serviceOrders,
        directSales,
        setupCosts,
        selectedMonthYear,
        setSelectedMonthYear,
        lookupCep,
        lookupCnpj,
        supplierProductMappings,
        stockImportRecords,
        addSupplierProductMapping,
        updateSupplierProductMapping,
        deleteSupplierProductMapping,
        analyzeUndoStockImport,
        undoStockImport,
        parseNFeXml,
        commitImportNFe,
        importNFeXml,
        importCsvClients,
        addClient,
        updateClient,
        deleteClient,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addProduct,
        updateProduct,
        deleteProduct,
        productCategories,
        productSubcategories,
        productBrands,
        productTags,
        addProductCategory,
        updateProductCategory,
        deleteProductCategory,
        addProductSubcategory,
        updateProductSubcategory,
        deleteProductSubcategory,
        addProductBrand,
        updateProductBrand,
        deleteProductBrand,
        addProductTag,
        updateProductTag,
        deleteProductTag,
        batchImportClients,
        batchImportServices,
        batchImportServiceOrders,
        batchImportDirectSales,
        batchImportSuppliers,
        batchImportPayments,
        batchImportProducts,
        addStockMovement,
        updateCardRate,
        addCardOperator,
        updateCardOperator,
        deleteCardOperator,
        processPagBankWebhook,
        syncPagBankPendingOrders,
        addCustomerTicket,
        updateCustomerTicketStatus,
        addServiceOrder,
        updateServiceOrder,
        deleteServiceOrder,
        convertBudgetToOrderOrSale,
        addDirectSale,
        updateDirectSale,
        cancelDirectSale,
        deleteDirectSale,
        authorizePdvSaleDelete,
        cashSessions,
        cashMovements,
        activeCashSession,
        paymentReceipts,
        activeReceiptModal,
        openReceiptModal,
        closeReceiptModal,
        getReceiptsForSource,
        getPaidAmountForSource,
        openCashSession,
        closeCashSession,
        addCashManualMovement,
        sendSaleToPdv,
        sendOrderToPdv,
        settleSaleInPdv,
        settleServiceOrderInPdv,
        addGeneralExpense,
        updateGeneralExpense,
        deleteGeneralExpense,
        addVehicleExpense,
        deleteVehicleExpense,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addSetupCost,
        updateSetupCost,
        deleteSetupCost,
        syncSetupCostsToExpenses,
        toggleDirectSalePayment,
        toggleServiceOrderPayment,
        toggleGeneralExpensePayment,
        applyBulkMarginsToAllProducts,
        addAuditLog,
        appointments,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        clearAllSystemData,
        loadDemoServiceOrdersData,
        resetToDefaults,
        getEmployeeById,
        getVehicleById,
        calculateEmployeeProfitability,
        getMonthlyProfitabilityAllEmployees,
        monthlyFinancialSummary
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const formatBRL = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value || 0);
};

export const formatDateBR = (dateStr: string): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};
