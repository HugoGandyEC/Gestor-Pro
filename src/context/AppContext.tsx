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
  CompanyAppointment
} from '../types';
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
  initialAppointments,
  createSampleAppointments
} from '../mockData';
import { 
  canModifyClientData, 
  canModifyServiceOrder, 
  getTenantClientId, 
  getTechnicianEmployeeId 
} from '../security/rbac';

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
  restoreDatabaseJson: (jsonStr: string) => { success: boolean; message: string };

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

  // XML & Batch Import
  parseNFeXml: (xmlContent: string) => { success: boolean; message: string; parsedNFe?: ParsedXmlNFe };
  commitImportNFe: (confirmedNFe: ParsedXmlNFe) => { success: boolean; message: string; updatedProductsCount: number; newProductsCount: number; supplierName: string };
  importNFeXml: (xmlContent: string) => { success: boolean; message: string; importedCount?: number; totalValue?: number };
  importCsvClients: (csvContent: string) => { success: boolean; message: string; count?: number };

  // CRUD Operations
  addClient: (c: Omit<Client, 'id' | 'createdAt'>) => void;
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

  addDirectSale: (sale: Omit<DirectSale, 'id' | 'code'>) => void;
  deleteDirectSale: (id: string) => void;

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
  clearSampleAppointments: () => void;
  restoreSampleAppointments: () => void;
  clearAllSystemData: () => void;

  resetToDefaults: () => void;

  // Analytics Helpers
  getEmployeeById: (id: string) => Employee | undefined;
  getVehicleById: (id: string) => Vehicle | undefined;
  calculateEmployeeProfitability: (employeeId: string, monthYear: string) => EmployeeProfitabilityReport | null;
  getMonthlyProfitabilityAllEmployees: (monthYear: string) => EmployeeProfitabilityReport[];
  monthlyFinancialSummary: {
    totalRevenue: number;
    totalPartsCost: number;
    grossMargin: number;
    totalPersonnelCost: number;
    totalVehicleCost: number;
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
  APPOINTMENTS: 'gestaopro_appointments_v4'
};

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
    return (saved as AppTheme) || 'terracota_mineral';
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

  const login = (identifier: string, pass?: string) => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      return { success: false, message: 'Informe seu usuário ou e-mail cadastrado.' };
    }

    // 1. Usuário Admin Padrão
    const foundAuth = initialAuthUsers.find(
      u => u.username.toLowerCase() === cleanId || 
           u.email.toLowerCase() === cleanId
    );
    if (foundAuth) {
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
    return saved ? JSON.parse(saved) : initialCompanySettings;
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
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialSetupCosts;
    } catch {
      return initialSetupCosts;
    }
  });

  const [appointments, setAppointments] = useState<CompanyAppointment[]>(() => {
    const saved = localStorage.getItem(KEYS.APPOINTMENTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return initialAppointments;
  });

  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(() => {
    const saved = localStorage.getItem(KEYS.SELECTED_MONTH);
    return saved || '2026-10';
  });

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

  // Restore Database from JSON
  const restoreDatabaseJson = (jsonStr: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Arquivo JSON inválido ou vazio.' };
      }
      if (data.companySettings) setCompanySettings(data.companySettings);
      if (data.sequenceSettings) setSequenceSettings(data.sequenceSettings);
      if (data.warrantyPolicies) setWarrantyPolicies(data.warrantyPolicies);
      if (data.serviceCatalog) setServiceCatalog(data.serviceCatalog);
      if (data.checklistTemplates) setChecklistTemplates(data.checklistTemplates);
      if (data.clients) setClients(data.clients);
      if (data.suppliers) setSuppliers(data.suppliers);
      if (data.products) setProducts(data.products);
      if (data.productCategories) setProductCategories(data.productCategories);
      if (data.productSubcategories) setProductSubcategories(data.productSubcategories);
      if (data.productBrands) setProductBrands(data.productBrands);
      if (data.productTags) setProductTags(data.productTags);
      if (data.stockMovements) setStockMovements(data.stockMovements);
      if (data.cardRates) setCardRates(data.cardRates);
      if (data.cardOperators) setCardOperators(data.cardOperators);
      if (data.customerTickets) setCustomerTickets(data.customerTickets);
      if (data.auditLogs) setAuditLogs(data.auditLogs);
      if (data.employees) setEmployees(data.employees);
      if (data.vehicles) setVehicles(data.vehicles);
      if (data.vehicleExpenses) setVehicleExpenses(data.vehicleExpenses);
      if (data.generalExpenses) setGeneralExpenses(data.generalExpenses);
      if (data.serviceOrders) setServiceOrders(data.serviceOrders);
      if (data.directSales) setDirectSales(data.directSales);
      if (data.setupCosts) setSetupCosts(data.setupCosts);
      if (data.appointments) setAppointments(data.appointments);

      broadcastSync('FULL');
      addAuditLog('Restauração de Backup', 'Base de dados restaurada com sucesso a partir de arquivo de backup JSON.');
      return { success: true, message: 'Backup restaurado com sucesso! Todos os dados foram atualizados.' };
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
    setSelectedMonthYear('2026-10');
    broadcastSync('FULL');
    addAuditLog('Restauração de Sistema', 'Base de dados restaurada para o padrão inicial de fábrica.');
  };

  // Google Agenda & Company Appointments Operations
  const addAppointment = (item: Omit<CompanyAppointment, 'id' | 'createdAt'>) => {
    const newAppointment: CompanyAppointment = {
      ...item,
      id: `apt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };
    setAppointments(prev => [newAppointment, ...prev]);
    addAuditLog('Novo Agendamento', `Agendamento criado: ${item.title} (${item.type}) em ${item.startDate} às ${item.startTime}`);
  };

  const updateAppointment = (id: string, updates: Partial<CompanyAppointment>) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a));
    addAuditLog('Atualização de Agendamento', `Agendamento atualizado.`);
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    addAuditLog('Exclusão de Agendamento', `Agendamento excluído da agenda.`);
  };

  const clearSampleAppointments = () => {
    setAppointments(prev => prev.filter(a => !a.isSample));
    addAuditLog('Limpeza de Dados de Exemplo', 'Todos os agendamentos fictícios de exemplo foram removidos.');
  };

  const restoreSampleAppointments = () => {
    const freshSamples = createSampleAppointments();
    setAppointments(prev => {
      const nonSamples = prev.filter(a => !a.isSample);
      return [...freshSamples, ...nonSamples];
    });
    addAuditLog('Restauração de Dados de Exemplo', 'Dados fictícios de exemplo do Google Agenda foram recarregados.');
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
    setVehicleExpenses([]);
    setGeneralExpenses([]);
    setSetupCosts([]);
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
    broadcastSync('FULL');
    addAuditLog('Limpeza Geral do Sistema', 'Todos os dados transacionais e de exemplo foram zerados. O sistema está em branco para produção.');
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

  // Parser for NF-e XML that prepares staging data for user review & price/margin adjustment
  const parseNFeXml = (xmlContent: string): { success: boolean; message: string; parsedNFe?: ParsedXmlNFe } => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      const parseError = xmlDoc.getElementsByTagName('parsererror');
      if (parseError.length > 0) {
        return { success: false, message: 'Arquivo XML inválido ou formato incompatível.' };
      }

      // Read NF-e data
      const nNF = xmlDoc.getElementsByTagName('nNF')[0]?.textContent || `NFE-${Math.floor(10000 + Math.random() * 90000)}`;
      const serie = xmlDoc.getElementsByTagName('serie')[0]?.textContent || '1';
      let chNFe = xmlDoc.getElementsByTagName('chNFe')[0]?.textContent || '';
      if (!chNFe) {
        const infNFe = xmlDoc.getElementsByTagName('infNFe')[0];
        if (infNFe && infNFe.getAttribute('Id')) {
          chNFe = infNFe.getAttribute('Id')!.replace(/^NFe/i, '');
        }
      }
      const dhEmi = xmlDoc.getElementsByTagName('dhEmi')[0]?.textContent || xmlDoc.getElementsByTagName('dEmi')[0]?.textContent || new Date().toISOString().split('T')[0];
      const emitNome = xmlDoc.getElementsByTagName('xNome')[0]?.textContent || 'Fornecedor Identificado NF-e';
      const emitFant = xmlDoc.getElementsByTagName('xFant')[0]?.textContent || '';
      const emitCNPJ = xmlDoc.getElementsByTagName('CNPJ')[0]?.textContent || '61.423.789/0001-15';
      const vNF = parseFloat(xmlDoc.getElementsByTagName('vNF')[0]?.textContent || '0');

      // EnderEmit
      const enderEmit = xmlDoc.getElementsByTagName('enderEmit')[0];
      const xLgr = enderEmit?.getElementsByTagName('xLgr')[0]?.textContent || 'Rua do Fornecedor';
      const nro = enderEmit?.getElementsByTagName('nro')[0]?.textContent || '100';
      const xBairro = enderEmit?.getElementsByTagName('xBairro')[0]?.textContent || 'Distrito Industrial';
      const xMun = enderEmit?.getElementsByTagName('xMun')[0]?.textContent || 'São Paulo';
      const UF = enderEmit?.getElementsByTagName('UF')[0]?.textContent || 'SP';
      const CEP = enderEmit?.getElementsByTagName('CEP')[0]?.textContent || '01001-000';
      const fone = enderEmit?.getElementsByTagName('fone')[0]?.textContent || '(11) 3300-4000';

      // Check if supplier already exists by CNPJ
      const cleanCNPJ = emitCNPJ.replace(/\D/g, '');
      const existingSup = suppliers.find(s => s.cnpj.replace(/\D/g, '') === cleanCNPJ);

      const parsedSupplier: ParsedXmlSupplier = {
        cnpj: emitCNPJ,
        name: existingSup ? existingSup.name : emitNome,
        tradeName: existingSup?.tradeName || emitFant || '',
        phone: existingSup?.phone || fone,
        email: existingSup?.email || 'contato@fornecedorxml.com.br',
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

      // Read items
      const detElements = xmlDoc.getElementsByTagName('det');
      const parsedItems: ParsedXmlItem[] = [];

      let calculatedTotal = 0;

      if (detElements.length > 0) {
        for (let i = 0; i < detElements.length; i++) {
          const det = detElements[i];
          const cProd = det.getElementsByTagName('cProd')[0]?.textContent || `PROD-XML-${i + 1}`;
          const xProd = det.getElementsByTagName('xProd')[0]?.textContent || `Produto NF-e ${i + 1}`;
          const ncm = det.getElementsByTagName('NCM')[0]?.textContent || '8419.19.10';
          const qCom = parseFloat(det.getElementsByTagName('qCom')[0]?.textContent || '1');
          const vUnCom = parseFloat(det.getElementsByTagName('vUnCom')[0]?.textContent || '100.00');
          const vProd = parseFloat(det.getElementsByTagName('vProd')[0]?.textContent || (qCom * vUnCom).toFixed(2));
          const uCom = det.getElementsByTagName('uCom')[0]?.textContent || 'UN';

          calculatedTotal += vProd;

          // Check if product already exists
          const cleanCode = cProd.trim().toLowerCase();
          const cleanName = xProd.trim().toLowerCase();
          const existingProd = products.find(p => 
            p.code.toLowerCase() === cleanCode || 
            p.name.toLowerCase() === cleanName
          );

          // Category suggestion
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

          // Margins (Varejo 55% / Atacado 35%)
          const defaultRetailMargin = 55; // 55% margem varejo (solicitada)
          const defaultWholesaleMargin = 35; // 35% margem atacado (solicitada)

          const suggestedRetailPrice = Number((vUnCom * (1 + defaultRetailMargin / 100)).toFixed(2));
          const suggestedWholesalePrice = Number((vUnCom * (1 + defaultWholesaleMargin / 100)).toFixed(2));

          parsedItems.push({
            id: `xml-item-${Date.now()}-${i}`,
            code: cProd,
            name: xProd,
            ncm,
            quantity: qCom,
            unit: uCom,
            costPrice: vUnCom,
            totalCost: vProd,
            category: existingProd?.category || category,
            retailMarginPercent: defaultRetailMargin,
            retailPrice: suggestedRetailPrice,
            updateRetailPrice: true,
            wholesaleMarginPercent: defaultWholesaleMargin,
            wholesalePrice: suggestedWholesalePrice,
            updateWholesalePrice: true,
            updateStock: true,
            isNewProduct: !existingProd,
            existingProductId: existingProd?.id,
            existingCurrentStock: existingProd?.currentStock,
            existingRetailPrice: existingProd?.retailPrice,
            existingWholesalePrice: existingProd?.wholesalePrice
          });
        }
      }

      const finalTotal = vNF > 0 ? vNF : calculatedTotal;

      const parsedNFe: ParsedXmlNFe = {
        nNF,
        serie,
        chNFe: chNFe || undefined,
        emissionDate: dhEmi.slice(0, 10),
        totalValue: finalTotal,
        supplier: parsedSupplier,
        items: parsedItems,
        createAccountPayable: true
      };

      return {
        success: true,
        message: `NF-e ${nNF} lida com sucesso! ${parsedItems.length} produto(s) pronto(s) para conferência e precificação.`,
        parsedNFe
      };
    } catch (err: any) {
      return { success: false, message: 'Erro ao analisar arquivo XML: ' + (err.message || 'formato inválido') };
    }
  };

  // Commit and write parsed/confirmed NF-e into products, stock, supplier and accounts payable
  const commitImportNFe = (confirmedNFe: ParsedXmlNFe) => {
    try {
      let finalSupplierId = confirmedNFe.supplier.existingSupplierId;
      let finalSupplierName = confirmedNFe.supplier.name;

      // 1. Cadastra Fornecedor se não estiver cadastrado e se o usuário confirmou
      if (!confirmedNFe.supplier.isAlreadyRegistered && confirmedNFe.supplier.registerIfNew) {
        const newSup: Supplier = {
          id: `sup-${Date.now()}`,
          name: confirmedNFe.supplier.name.trim(),
          tradeName: confirmedNFe.supplier.tradeName?.trim() || undefined,
          cnpj: confirmedNFe.supplier.cnpj.trim(),
          email: confirmedNFe.supplier.email?.trim() || 'fornecedor@contato.com.br',
          phone: confirmedNFe.supplier.phone?.trim() || '(11) 3300-4000',
          contactPerson: 'Cadastro Automático NF-e',
          cep: confirmedNFe.supplier.cep?.trim() || '01001-000',
          street: confirmedNFe.supplier.street?.trim() || 'Avenida das Indústrias',
          number: confirmedNFe.supplier.number?.trim() || '100',
          city: confirmedNFe.supplier.city?.trim() || 'São Paulo',
          state: confirmedNFe.supplier.state?.trim().toUpperCase() || 'SP',
          notes: `Cadastrado automaticamente na conferência da NF-e ${confirmedNFe.nNF}`
        };
        setSuppliers(prev => [newSup, ...prev]);
        finalSupplierId = newSup.id;
        finalSupplierName = newSup.name;
        addAuditLog('Novo Fornecedor', `Fornecedor ${newSup.name} (CNPJ: ${newSup.cnpj}) cadastrado via importação de NF-e.`);
      }

      // 2. Atualiza ou insere os produtos com as margens e preços conferidos
      let updatedCount = 0;
      let newCount = 0;

      const newMovements: StockMovement[] = [];

      setProducts(prevProducts => {
        let currentList = [...prevProducts];

        confirmedNFe.items.forEach((item, idx) => {
          const existing = currentList.find(p => 
            p.id === item.existingProductId ||
            p.code.toLowerCase() === item.code.toLowerCase() ||
            p.name.toLowerCase() === item.name.toLowerCase()
          );

          if (existing) {
            // Atualiza produto existente
            currentList = currentList.map(p => {
              if (p.id === existing.id) {
                return {
                  ...p,
                  costPrice: item.costPrice,
                  retailPrice: item.updateRetailPrice ? item.retailPrice : p.retailPrice,
                  wholesalePrice: item.updateWholesalePrice ? item.wholesalePrice : p.wholesalePrice,
                  currentStock: item.updateStock ? (p.currentStock + item.quantity) : p.currentStock,
                  ncm: item.ncm || p.ncm
                };
              }
              return p;
            });
            updatedCount++;
          } else {
            // Insere novo produto
            const newProd: Product = {
              id: `prod-${Date.now()}-${idx}`,
              code: item.code,
              name: item.name,
              category: item.category,
              costPrice: item.costPrice,
              retailPrice: item.retailPrice,
              wholesalePrice: item.wholesalePrice,
              currentStock: item.updateStock ? item.quantity : 0,
              minStock: 2,
              unit: item.unit || 'UN',
              ncm: item.ncm,
              icmsRate: 12.0,
              pisRate: 1.65,
              cofinsRate: 7.6
            };
            currentList = [newProd, ...currentList];
            newCount++;
          }

          // Registra movimentação de estoque se houve entrada de quantidade
          if (item.updateStock) {
            newMovements.push({
              id: `sm-${Date.now()}-${idx}`,
              productId: item.code,
              productName: item.name,
              type: 'entrada_xml',
              quantity: item.quantity,
              unitCost: item.costPrice,
              date: new Date().toISOString().split('T')[0],
              referenceDoc: `NF-e ${confirmedNFe.nNF} (${finalSupplierName})`,
              notes: `Entrada conferida: Varejo R$ ${item.retailPrice.toFixed(2)} (${item.retailMarginPercent}%) | Atacado R$ ${item.wholesalePrice.toFixed(2)} (${item.wholesaleMarginPercent}%)`
            });
          }
        });

        return currentList;
      });

      if (newMovements.length > 0) {
        setStockMovements(prev => [...newMovements, ...prev]);
      }

      // 3. Gera Conta a Pagar se selecionado
      if (confirmedNFe.createAccountPayable && confirmedNFe.totalValue > 0) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 28);
        const newExpense: GeneralExpense = {
          id: `ge-${Date.now()}`,
          category: 'compra_produtos_xml',
          description: `Compra Mercadorias p/ Estoque - NF-e ${confirmedNFe.nNF} (${finalSupplierName})`,
          cost: confirmedNFe.totalValue,
          dueDate: dueDate.toISOString().split('T')[0],
          isPaid: false,
          supplierId: finalSupplierId,
          supplier: finalSupplierName,
          invoiceNumber: `NF-e ${confirmedNFe.nNF}`,
          isRecurring: false
        };
        setGeneralExpenses(prev => [newExpense, ...prev]);
      }

      addAuditLog(
        'Importação NF-e Conferida',
        `NF-e ${confirmedNFe.nNF}: ${newCount} produtos novos cadastrados, ${updatedCount} atualizados com ajuste de margens e preços.`
      );

      return {
        success: true,
        message: `Importação da NF-e ${confirmedNFe.nNF} finalizada com sucesso! ${newCount} novo(s) produto(s) e ${updatedCount} atualizado(s) no estoque com as margens de varejo e atacado aplicadas.`,
        updatedProductsCount: updatedCount,
        newProductsCount: newCount,
        supplierName: finalSupplierName
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Erro ao gravar produtos da NF-e: ' + (err.message || 'falha no processamento'),
        updatedProductsCount: 0,
        newProductsCount: 0,
        supplierName: confirmedNFe.supplier.name
      };
    }
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
          const newCli: Client = {
            id: `cli-csv-${Date.now()}-${idx}`,
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
  const addClient = (c: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...c,
      id: `cli-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setClients(prev => [newClient, ...prev]);
    addAuditLog('Novo Cliente', `Cliente ${c.name} cadastrado no sistema.`);
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
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    addAuditLog('Edição de Cliente', `Cliente ID ${id} atualizado.`);
  };

  const deleteClient = (id: string) => {
    if (currentUser?.role === 'cliente' || currentUser?.role === 'tecnico') {
      console.error(`[SEGURANÇA ERP - BLOQUEIO 403] Perfil ${currentUser?.role} não possui permissão para excluir clientes.`);
      addAuditLog('Bloqueio de Segurança', `Tentativa de exclusão de cliente pelo perfil ${currentUser?.role} bloqueada.`);
      return;
    }
    setClients(prev => prev.filter(c => c.id !== id));
    addAuditLog('Exclusão de Cliente', `Cliente ID ${id} removido.`);
  };

  // Supplier CRUD
  const addSupplier = (s: Omit<Supplier, 'id'>) => {
    const newSup: Supplier = {
      ...s,
      id: `sup-${Date.now()}`
    };
    setSuppliers(prev => [newSup, ...prev]);
    addAuditLog('Novo Fornecedor', `Fornecedor ${s.name} cadastrado.`);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
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
      id: `cli-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString()
    }));
    if (mode === 'replace') {
      setClients(createdClients);
    } else {
      setClients(prev => [...prev, ...createdClients]);
    }
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
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

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

    setServiceOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
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
        paymentStatus: 'pago'
      };
      setDirectSales(prev => [newSale, ...prev]);
      updateServiceOrder(orderId, { status: 'entregue_finalizada' });
      addAuditLog('Conversão para Venda', `Orçamento ${target.code} convertido na Venda Direta ${saleCode}.`);
    }
  };

  const addDirectSale = (sale: Omit<DirectSale, 'id' | 'code'>) => {
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
  };

  const deleteDirectSale = (id: string) => {
    setDirectSales(prev => prev.filter(s => s.id !== id));
  };

  const addGeneralExpense = (exp: Omit<GeneralExpense, 'id'>) => {
    const newExp: GeneralExpense = {
      ...exp,
      id: `ge-${Date.now()}`
    };
    setGeneralExpenses(prev => [newExp, ...prev]);
    addAuditLog('Nova Despesa', `Despesa de R$ ${exp.cost.toFixed(2)} lançada (${exp.description}).`);
  };

  const updateGeneralExpense = (id: string, updates: Partial<GeneralExpense>) => {
    setGeneralExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteGeneralExpense = (id: string) => {
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

  const syncSetupCostsToExpenses = () => {
    let syncedCount = 0;
    const mapCategory = (cat: string): ExpenseCategory => {
      switch (cat) {
        case 'aluguel_loja': return 'aluguel';
        case 'salario_clt': return 'salario';
        case 'das_mei': return 'das_mei';
        case 'combustivel': return 'gasolina';
        case 'internet': return 'internet';
        case 'alimentacao': return 'alimentacao';
        case 'seguro_veiculo': return 'seguro';
        case 'ipva': return 'ipva';
        case 'impostos_carro': return 'impostos_carro';
        case 'divida_empresa': return 'divida_empresa';
        case 'ferramental': return 'ferramental';
        default: return 'outros';
      }
    };

    setGeneralExpenses(prev => {
      const updated = [...prev];
      setupCosts.forEach(item => {
        if (item.syncWithGeneralExpenses === false) return;
        if (item.status === 'quitado') return;

        const isRecurrent = item.costType === 'recorrente' || item.isRecurring === true;
        const isInstallment = item.costType === 'parcelado';
        
        if (!isRecurrent && !isInstallment) return;

        const cost = isInstallment 
          ? (item.installmentValue || (item.installmentsCount ? item.actualCost / item.installmentsCount : item.actualCost)) 
          : (item.installmentValue || item.actualCost || 0);
        if (cost <= 0) return;

        let dueDate = item.dueDate || `${selectedMonthYear}-${String(item.dueDay || 10).padStart(2, '0')}`;
        if (!dueDate.startsWith(selectedMonthYear) && item.dueDay) {
          dueDate = `${selectedMonthYear}-${String(item.dueDay).padStart(2, '0')}`;
        }

        const expenseDescription = isInstallment 
          ? `${item.name} (Parc. ${(item.paidInstallments || 0) + 1}/${item.installmentsCount || 1})`
          : item.name;

        const existingIndex = updated.findIndex(e => 
          (e.description === expenseDescription || e.description.startsWith(item.name)) && 
          e.dueDate.startsWith(selectedMonthYear)
        );

        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            cost,
            dueDate,
            supplier: item.creditor || updated[existingIndex].supplier,
            isRecurring: isRecurrent
          };
          syncedCount++;
        } else {
          updated.push({
            id: `ge-sync-${item.id}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            category: mapCategory(item.category),
            description: expenseDescription,
            cost,
            dueDate,
            isPaid: false,
            supplier: item.creditor || 'Contas da Empresa',
            isRecurring: isRecurrent
          });
          syncedCount++;
        }
      });
      return updated;
    });

    return { count: syncedCount };
  };

  const getEmployeeById = (id: string) => employees.find(e => e.id === id);
  const getVehicleById = (id: string) => vehicles.find(v => v.id === id);

  // Profitability per Employee calculation
  const calculateEmployeeProfitability = (employeeId: string, monthYear: string): EmployeeProfitabilityReport | null => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return null;

    // Completed or Billed Orders in this month
    const monthOrders = serviceOrders.filter(o => {
      if (o.employeeId !== employeeId) return false;
      const dateToCheck = o.completionDate || o.openDate;
      const isFinished = o.status === 'concluida_aguardando_retirada' || o.status === 'entregue_finalizada';
      return dateToCheck.startsWith(monthYear) && isFinished;
    });

    let servicesRevenue = 0;
    let partsRevenue = 0;
    let partsCost = 0;
    let visitFeesRevenue = 0;

    monthOrders.forEach(o => {
      const srvTotal = o.services.reduce((acc, s) => acc + Number(s.price || 0), 0);
      const prtTotal = o.parts.reduce((acc, p) => acc + (Number(p.price || 0) * Number(p.quantity || 1)), 0);
      const prtCostTotal = o.parts.reduce((acc, p) => acc + (Number(p.cost || 0) * Number(p.quantity || 1)), 0);
      
      servicesRevenue += srvTotal - Number(o.calculatedDiscount || 0);
      partsRevenue += prtTotal;
      partsCost += prtCostTotal;
      visitFeesRevenue += Number(o.visitFee || 0);
    });

    const monthSales = directSales.filter(s => {
      return s.employeeId === employeeId && s.date.startsWith(monthYear) && s.paymentStatus === 'pago';
    });

    let directSalesRevenue = 0;
    monthSales.forEach(s => {
      directSalesRevenue += s.total;
      const saleCost = s.items.reduce((acc, it) => acc + (it.cost * it.quantity), 0);
      partsCost += saleCost;
    });

    const totalRevenue = servicesRevenue + partsRevenue + directSalesRevenue + visitFeesRevenue;
    const grossContribution = totalRevenue - partsCost;

    const baseSalary = employee.baseSalary;
    const benefitsCharges = employee.benefitsCharges;
    const commissionEarned = ((servicesRevenue + visitFeesRevenue) * (employee.commissionRate / 100)) + 
                             (directSalesRevenue * (employee.commissionRate / 100));
    const totalPersonnelCost = baseSalary + benefitsCharges + commissionEarned;

    const assignedVehicle = vehicles.find(v => v.id === employee.assignedVehicleId || v.assignedEmployeeId === employee.id);

    const fuelExpenses = vehicleExpenses.filter(ve => {
      if (!ve.date.startsWith(monthYear)) return false;
      if (ve.category !== 'combustivel') return false;
      if (ve.employeeId === employeeId) return true;
      if (assignedVehicle && ve.vehicleId === assignedVehicle.id) return true;
      return false;
    });
    const fuelCost = fuelExpenses.reduce((acc, fe) => acc + fe.cost, 0);

    const directVehicleExpenses = vehicleExpenses.filter(ve => {
      if (!ve.date.startsWith(monthYear)) return false;
      if (ve.category === 'combustivel') return false;
      if (ve.employeeId === employeeId) return true;
      if (assignedVehicle && ve.vehicleId === assignedVehicle.id) return true;
      return false;
    });
    const vehicleDirectMaintenanceCost = directVehicleExpenses.reduce((acc, ve) => acc + ve.cost, 0);

    let vehicleProratedFixedCost = 0;
    if (assignedVehicle) {
      vehicleProratedFixedCost = (assignedVehicle.annualIpvaValue + assignedVehicle.annualInsuranceValue) / 12;
    }

    const mealsExpenses = generalExpenses.filter(ge => {
      return ge.category === 'alimentacao' && ge.employeeId === employeeId && ge.dueDate.startsWith(monthYear);
    });
    const mealsCost = mealsExpenses.reduce((acc, me) => acc + me.cost, 0);

    const cellphoneExpenses = generalExpenses.filter(ge => {
      return ge.category === 'celular' && ge.employeeId === employeeId && ge.dueDate.startsWith(monthYear);
    });
    const cellphoneCost = cellphoneExpenses.reduce((acc, ce) => acc + ce.cost, 0);

    const totalDirectCosts = totalPersonnelCost + 
                             fuelCost + 
                             mealsCost + 
                             vehicleDirectMaintenanceCost + 
                             vehicleProratedFixedCost + 
                             cellphoneCost;

    const netProfit = grossContribution - totalDirectCosts;
    const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const roiMultiplier = totalDirectCosts > 0 ? totalRevenue / totalDirectCosts : 0;

    let performanceTier: 'Excelente' | 'Bom' | 'Atenção' | 'Prejuízo' = 'Bom';
    if (netProfit < 0) {
      performanceTier = 'Prejuízo';
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
      .filter((rep): rep is EmployeeProfitabilityReport => rep !== null)
      .sort((a, b) => b.netProfit - a.netProfit);
  };

  const toggleDirectSalePayment = (saleId: string) => {
    setDirectSales(prev => prev.map(s => {
      if (s.id === saleId) {
        const nextStatus = s.paymentStatus === 'pago' ? 'pendente' : 'pago';
        return { ...s, paymentStatus: nextStatus };
      }
      return s;
    }));
  };

  const toggleServiceOrderPayment = (orderId: string) => {
    setServiceOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const nextStatus = o.paymentStatus === 'pago' ? 'pendente' : 'pago';
        return { ...o, paymentStatus: nextStatus };
      }
      return o;
    }));
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

  // Company-wide monthly financial summary with full precision and zero data dropping
  const monthlyFinancialSummary = useMemo(() => {
    const allReports = getMonthlyProfitabilityAllEmployees(selectedMonthYear);
    
    // 1. Receitas de Ordens de Serviço faturadas/concluídas no mês
    const monthOrdersFinished = serviceOrders.filter(o => {
      const d = o.completionDate || o.openDate;
      const isFin = o.status === 'concluida_aguardando_retirada' || o.status === 'entregue_finalizada';
      return d.startsWith(selectedMonthYear) && isFin;
    });

    const ordersServicesRevenue = monthOrdersFinished.reduce((acc, o) => 
      acc + o.services.reduce((a, b) => a + Number(b.price || 0), 0) + Number(o.visitFee || 0) - Number(o.calculatedDiscount || 0), 0
    );
    const ordersPartsRevenue = monthOrdersFinished.reduce((acc, o) => 
      acc + o.parts.reduce((a, b) => a + (Number(b.price || 0) * Number(b.quantity || 1)), 0), 0
    );
    const ordersPartsCost = monthOrdersFinished.reduce((acc, o) => 
      acc + o.parts.reduce((a, b) => a + (Number(b.cost || 0) * Number(b.quantity || 1)), 0), 0
    );

    // 2. Receitas de Vendas Diretas no mês (incluindo vendas avulsas e de balcão)
    const monthSales = directSales.filter(s => s.date.startsWith(selectedMonthYear));
    const salesRevenue = monthSales.reduce((acc, s) => acc + Number(s.total || 0), 0);
    const salesCost = monthSales.reduce((acc, s) => 
      acc + s.items.reduce((a, b) => a + (Number(b.cost || 0) * Number(b.quantity || 1)), 0), 0
    );

    // Total de Faturamento e Custo de Mercadorias (CMV)
    const totalRevenue = ordersServicesRevenue + ordersPartsRevenue + salesRevenue;
    const totalPartsCost = ordersPartsCost + salesCost;
    const grossMargin = totalRevenue - totalPartsCost;

    // 3. Custos com Pessoal (Salários CLT, Benefícios e Comissões)
    const baseSalaries = employees.reduce((a, b) => a + b.baseSalary, 0);
    const benefitsCharges = employees.reduce((a, b) => a + b.benefitsCharges, 0);
    const commissions = allReports.reduce((acc, r) => acc + r.commissionEarned, 0);
    const totalPersonnelCost = baseSalaries + benefitsCharges + commissions;

    // 4. Custos com Frota & Veículos
    const monthVehicleExpenses = vehicleExpenses.filter(ve => ve.date.startsWith(selectedMonthYear));
    const totalVehicleDirect = monthVehicleExpenses.reduce((acc, ve) => acc + ve.cost, 0);
    const totalVehicleProrated = vehicles.reduce((acc, v) => acc + ((v.annualIpvaValue + v.annualInsuranceValue) / 12), 0);
    const totalVehicleCost = totalVehicleDirect + totalVehicleProrated;

    // 5. Custos Operacionais & Administrativos (Despesas Gerais + Dívidas/Parcelas do Mês)
    const monthGeneralExpenses = generalExpenses.filter(ge => ge.dueDate.startsWith(selectedMonthYear));
    const generalExpensesSum = monthGeneralExpenses.reduce((acc, ge) => acc + ge.cost, 0);
    
    // Soma de parcelas de dívidas ativas cadastradas em setupCosts (se não estiverem sincronizadas em generalExpenses)
    const unsyncedDebtInstallments = setupCosts
      .filter(s => s.costType === 'parcelado' && s.status !== 'quitado' && !s.syncWithGeneralExpenses)
      .reduce((acc, s) => acc + (s.installmentValue || 0), 0);

    const totalOperationalCost = generalExpensesSum + unsyncedDebtInstallments;

    // 6. Taxas de Operadoras de Cartão no mês
    let totalCardFees = 0;
    serviceOrders.forEach(o => {
      if ((o.completionDate || o.openDate).startsWith(selectedMonthYear)) {
        o.payments?.forEach(p => {
          if (p.rateAmount) totalCardFees += p.rateAmount;
        });
      }
    });
    directSales.forEach(s => {
      if (s.date.startsWith(selectedMonthYear)) {
        s.payments?.forEach(p => {
          if (p.rateAmount) totalCardFees += p.rateAmount;
        });
      }
    });

    const totalCosts = totalPartsCost + totalPersonnelCost + totalVehicleCost + totalOperationalCost + totalCardFees;
    const netProfit = totalRevenue - totalCosts;
    const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // 7. Contas a Receber Pendentes no Mês
    const pendingOrdersReceivables = serviceOrders
      .filter(o => (o.completionDate || o.openDate).startsWith(selectedMonthYear) && o.paymentStatus !== 'pago')
      .reduce((acc, o) => {
        const tot = o.services.reduce((a, b) => a + Number(b.price || 0), 0) + 
                    o.parts.reduce((a, b) => a + (Number(b.price || 0) * Number(b.quantity || 1)), 0) + 
                    Number(o.visitFee || 0) - Number(o.calculatedDiscount || 0);
        return acc + tot;
      }, 0);

    const pendingSalesReceivables = directSales
      .filter(s => s.date.startsWith(selectedMonthYear) && s.paymentStatus !== 'pago')
      .reduce((acc, s) => acc + Number(s.total || 0), 0);

    const totalPendingReceivables = pendingOrdersReceivables + pendingSalesReceivables;

    // 8. Contas a Pagar Pendentes no Mês
    const pendingGeneralPayables = monthGeneralExpenses
      .filter(e => !e.isPaid)
      .reduce((acc, e) => acc + e.cost, 0);

    const totalPendingPayables = pendingGeneralPayables + unsyncedDebtInstallments;

    const completedOrders = monthOrdersFinished.length;
    const activeOrders = serviceOrders.filter(o => {
      return o.status === 'orcamento_aberto' || o.status === 'aguardando_aprovacao' || o.status === 'aprovada_em_andamento' || o.status === 'aguardando_pecas';
    }).length;

    return {
      totalRevenue,
      totalPartsCost,
      grossMargin,
      totalPersonnelCost,
      totalVehicleCost,
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
  }, [selectedMonthYear, employees, vehicles, vehicleExpenses, generalExpenses, serviceOrders, directSales, setupCosts]);

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
        authUsers: initialAuthUsers,
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
        deleteDirectSale,
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
        clearSampleAppointments,
        restoreSampleAppointments,
        clearAllSystemData,
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
