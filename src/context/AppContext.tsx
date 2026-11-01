import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  Employee, 
  Vehicle, 
  VehicleMaintenance, 
  GeneralExpense, 
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
  AuthUser
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
  initialAuthUsers
} from '../mockData';

interface AppContextType {
  // Auth & Session
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  login: (identifier: string, pass?: string) => { success: boolean; message?: string };
  logout: () => void;
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
  lookupCnpj: (cnpj: string) => Promise<{ name: string; tradeName?: string; phone?: string; email?: string; cep?: string; street?: string; number?: string; city?: string; state?: string } | null>;

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

  // Operadoras de Cartão & Integração PagBank
  addCardOperator: (op: Omit<CardOperator, 'id' | 'createdAt'>) => void;
  updateCardOperator: (id: string, updates: Partial<CardOperator>) => void;
  deleteCardOperator: (id: string) => void;
  processPagBankWebhook: (payload: {
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
  deleteSetupCost: (id: string) => void;

  addAuditLog: (action: string, details: string) => void;

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
    ordersCompletedCount: number;
    ordersActiveCount: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const KEYS = {
  ROLE: 'gestaopro_current_role_v2',
  CLIENTS: 'gestaopro_clients_v2',
  SUPPLIERS: 'gestaopro_suppliers_v2',
  PRODUCTS: 'gestaopro_products_v2',
  STOCK: 'gestaopro_stock_v2',
  CARD_RATES: 'gestaopro_card_rates_v2',
  TICKETS: 'gestaopro_tickets_v2',
  LOGS: 'gestaopro_logs_v2',
  EMPLOYEES: 'gestaopro_employees_v2',
  VEHICLES: 'gestaopro_vehicles_v2',
  VEHICLE_EXPENSES: 'gestaopro_vehicle_expenses_v2',
  GENERAL_EXPENSES: 'gestaopro_general_expenses_v2',
  SERVICE_ORDERS: 'gestaopro_service_orders_v2',
  DIRECT_SALES: 'gestaopro_direct_sales_v2',
  SETUP_COSTS: 'gestaopro_setup_costs_v2',
  SELECTED_MONTH: 'gestaopro_selected_month_v2',
  COMPANY_SETTINGS: 'gestaopro_company_settings_v2',
  SERVICE_CATALOG: 'gestaopro_service_catalog_v2',
  CHECKLIST_TEMPLATES: 'gestaopro_checklist_templates_v2',
  CARD_OPERATORS: 'gestaopro_card_operators_v2',
  PAGBANK_TRANSACTIONS: 'gestaopro_pagbank_transactions_v2',
  SEQUENCE_SETTINGS: 'gestaopro_sequence_settings_v2',
  WARRANTY_POLICIES: 'gestaopro_warranty_policies_v2',
  AUTH_USER: 'gestaopro_auth_user_v2',
  THEME: 'gestaopro_current_theme_v2'
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
    return initialAuthUsers[0];
  });

  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem(KEYS.THEME);
    return (saved as AppTheme) || 'classico';
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
    const found = initialAuthUsers.find(
      u => u.username.toLowerCase() === cleanId || 
           u.email.toLowerCase() === cleanId ||
           u.role.toLowerCase() === cleanId
    );
    if (found) {
      setCurrentUser(found);
      setCurrentRole(found.role);
      return { success: true };
    }
    // Fallback: create ad-hoc session if username is provided
    if (cleanId.length >= 2) {
      const fallbackUser: AuthUser = {
        id: `usr-custom-${Date.now()}`,
        username: cleanId,
        name: identifier,
        email: `${cleanId}@mppiscina.com.br`,
        role: 'admin',
        roleBadge: 'Usuário Conectado'
      };
      setCurrentUser(fallbackUser);
      setCurrentRole('admin');
      return { success: true };
    }
    return { 
      success: false, 
      message: 'Por favor, informe seu usuário ou e-mail cadastrado.' 
    };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(KEYS.AUTH_USER);
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
    return saved ? JSON.parse(saved) : initialCardOperators;
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
    return saved ? JSON.parse(saved) : initialSetupCosts;
  });

  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(() => {
    const saved = localStorage.getItem(KEYS.SELECTED_MONTH);
    return saved || '2026-10';
  });

  // LocalStorage sync
  useEffect(() => { localStorage.setItem(KEYS.ROLE, currentRole); }, [currentRole]);
  useEffect(() => { localStorage.setItem(KEYS.COMPANY_SETTINGS, JSON.stringify(companySettings)); }, [companySettings]);
  useEffect(() => { localStorage.setItem(KEYS.SERVICE_CATALOG, JSON.stringify(serviceCatalog)); }, [serviceCatalog]);
  useEffect(() => { localStorage.setItem(KEYS.CHECKLIST_TEMPLATES, JSON.stringify(checklistTemplates)); }, [checklistTemplates]);
  useEffect(() => { localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem(KEYS.STOCK, JSON.stringify(stockMovements)); }, [stockMovements]);
  useEffect(() => { localStorage.setItem(KEYS.CARD_RATES, JSON.stringify(cardRates)); }, [cardRates]);
  useEffect(() => { localStorage.setItem(KEYS.CARD_OPERATORS, JSON.stringify(cardOperators)); }, [cardOperators]);
  useEffect(() => { localStorage.setItem(KEYS.PAGBANK_TRANSACTIONS, JSON.stringify(pagBankTransactions)); }, [pagBankTransactions]);
  useEffect(() => { localStorage.setItem(KEYS.TICKETS, JSON.stringify(customerTickets)); }, [customerTickets]);
  useEffect(() => { localStorage.setItem(KEYS.LOGS, JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem(KEYS.VEHICLES, JSON.stringify(vehicles)); }, [vehicles]);
  useEffect(() => { localStorage.setItem(KEYS.VEHICLE_EXPENSES, JSON.stringify(vehicleExpenses)); }, [vehicleExpenses]);
  useEffect(() => { localStorage.setItem(KEYS.GENERAL_EXPENSES, JSON.stringify(generalExpenses)); }, [generalExpenses]);
  useEffect(() => { localStorage.setItem(KEYS.SERVICE_ORDERS, JSON.stringify(serviceOrders)); }, [serviceOrders]);
  useEffect(() => { localStorage.setItem(KEYS.DIRECT_SALES, JSON.stringify(directSales)); }, [directSales]);
  useEffect(() => { localStorage.setItem(KEYS.SETUP_COSTS, JSON.stringify(setupCosts)); }, [setupCosts]);
  useEffect(() => { localStorage.setItem(KEYS.SELECTED_MONTH, selectedMonthYear); }, [selectedMonthYear]);
  useEffect(() => { localStorage.setItem(KEYS.SEQUENCE_SETTINGS, JSON.stringify(sequenceSettings)); }, [sequenceSettings]);
  useEffect(() => { localStorage.setItem(KEYS.WARRANTY_POLICIES, JSON.stringify(warrantyPolicies)); }, [warrantyPolicies]);

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
      stockMovements,
      cardRates,
      customerTickets,
      auditLogs,
      employees,
      vehicles,
      vehicleExpenses,
      generalExpenses,
      serviceOrders,
      directSales,
      setupCosts
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
      if (data.stockMovements) setStockMovements(data.stockMovements);
      if (data.cardRates) setCardRates(data.cardRates);
      if (data.customerTickets) setCustomerTickets(data.customerTickets);
      if (data.auditLogs) setAuditLogs(data.auditLogs);
      if (data.employees) setEmployees(data.employees);
      if (data.vehicles) setVehicles(data.vehicles);
      if (data.vehicleExpenses) setVehicleExpenses(data.vehicleExpenses);
      if (data.generalExpenses) setGeneralExpenses(data.generalExpenses);
      if (data.serviceOrders) setServiceOrders(data.serviceOrders);
      if (data.directSales) setDirectSales(data.directSales);
      if (data.setupCosts) setSetupCosts(data.setupCosts);

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
    setSelectedMonthYear('2026-10');
    addAuditLog('Restauração de Sistema', 'Base de dados restaurada para o padrão inicial de fábrica.');
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

  // Live Lookups: CNPJ via BrasilAPI / Receita
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
          phone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.slice(0,2)}) ${data.ddd_telefone_1.slice(2)}` : '',
          email: data.email || '',
          cep: data.cep || '',
          street: data.logradouro || '',
          number: data.numero || '',
          city: data.municipio || '',
          state: data.uf || ''
        };
      }
    } catch {
      // Fallback
    }
    return {
      name: 'Empresa Industrial & Serviços do Brasil Ltda',
      tradeName: 'Brasil Serviços & Equipamentos',
      phone: '(11) 3200-4000',
      email: 'contato@brasilservicos.com.br',
      cep: '01310-100',
      street: 'Avenida Paulista',
      number: '1000',
      city: 'São Paulo',
      state: 'SP'
    };
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

          // Margins
          const defaultRetailMargin = 50; // 50% margem varejo
          const defaultWholesaleMargin = 35; // 35% margem atacado

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
            document: parts[1]?.replace(/"/g, '').trim() || '00.000.000/0001-00',
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
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    addAuditLog('Edição de Cliente', `Cliente ID ${id} atualizado.`);
  };

  const deleteClient = (id: string) => {
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

  // Product CRUD
  const addProduct = (p: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...p,
      id: `prod-${Date.now()}`
    };
    setProducts(prev => [newProd, ...prev]);
    addAuditLog('Novo Produto', `Produto ${p.name} cadastrado com estoque inicial de ${p.currentStock}.`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
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

  // Process PagBank Webhook / Realtime Automatic Reconciliation
  const processPagBankWebhook = (payload: {
    orderCode?: string;
    saleCode?: string;
    clientName?: string;
    amount: number;
    method: 'cartao_credito' | 'cartao_debito' | 'pix' | 'boleto';
    installments?: number;
    brand?: string;
    nsu?: string;
  }) => {
    const pagbank = cardOperators.find(o => o.code === 'pagbank') || cardOperators[0];
    const installments = payload.installments || 1;
    let feePct = 0;

    if (payload.method === 'pix') {
      feePct = pagbank ? pagbank.pixRate : 0.00;
    } else if (payload.method === 'cartao_debito') {
      feePct = pagbank ? pagbank.debitRate : 1.99;
    } else if (payload.method === 'cartao_credito') {
      if (installments === 1) {
        feePct = pagbank ? pagbank.creditSightRate : 3.19;
      } else if (installments <= 6) {
        feePct = pagbank ? pagbank.creditInstallments2to6Rate : 3.79;
      } else {
        feePct = pagbank ? pagbank.creditInstallments7to12Rate : 4.99;
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
      operatorId: pagbank?.id || 'op-pagbank',
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
    if (pagbank) {
      setCardOperators(prev => prev.map(op => {
        if (op.code === 'pagbank' && op.integration) {
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

    addAuditLog('Baixa Automática PagBank', `Transação ${trxCode} (NSU ${nsu}) aprovada. Valor bruto R$ ${payload.amount.toFixed(2)}, taxa retida R$ ${feeAmount.toFixed(2)}, crédito líquido de R$ ${netAmount.toFixed(2)} baixado para ${payload.orderCode || payload.saleCode || 'Venda'}.`);

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
    const now = new Date();
    const newTicket: CustomerPortalTicket = {
      ...t,
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
    setServiceOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    addAuditLog('Atualização de OS', `OS ID ${id} atualizada com status ${updates.status || 'modificado'}.`);
  };

  const deleteServiceOrder = (id: string) => {
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

  const deleteSetupCost = (id: string) => {
    setSetupCosts(prev => prev.filter(s => s.id !== id));
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

  // Company-wide monthly financial summary
  const monthlyFinancialSummary = useMemo(() => {
    const allReports = getMonthlyProfitabilityAllEmployees(selectedMonthYear);
    
    const totalRevenue = allReports.reduce((acc, r) => acc + r.totalRevenue, 0);
    const totalPartsCost = allReports.reduce((acc, r) => acc + r.partsCost, 0);
    const grossMargin = totalRevenue - totalPartsCost;

    const totalPersonnelCost = allReports.reduce((acc, r) => acc + r.totalPersonnelCost, 0);

    const monthVehicleExpenses = vehicleExpenses.filter(ve => ve.date.startsWith(selectedMonthYear));
    const totalVehicleDirect = monthVehicleExpenses.reduce((acc, ve) => acc + ve.cost, 0);
    const totalVehicleProrated = vehicles.reduce((acc, v) => acc + ((v.annualIpvaValue + v.annualInsuranceValue) / 12), 0);
    const totalVehicleCost = totalVehicleDirect + totalVehicleProrated;

    const monthGeneralExpenses = generalExpenses.filter(ge => ge.dueDate.startsWith(selectedMonthYear));
    const totalOperationalCost = monthGeneralExpenses.reduce((acc, ge) => acc + ge.cost, 0);

    // Calculate card machine fees deducted in month
    let totalCardFees = 0;
    serviceOrders.forEach(o => {
      o.payments?.forEach(p => {
        if (p.rateAmount) totalCardFees += p.rateAmount;
      });
    });
    directSales.forEach(s => {
      s.payments?.forEach(p => {
        if (p.rateAmount) totalCardFees += p.rateAmount;
      });
    });

    const totalCosts = totalPartsCost + totalPersonnelCost + totalVehicleCost + totalOperationalCost + totalCardFees;
    const netProfit = totalRevenue - totalCosts;
    const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const completedOrders = serviceOrders.filter(o => {
      const d = o.completionDate || o.openDate;
      const isFin = o.status === 'concluida_aguardando_retirada' || o.status === 'entregue_finalizada';
      return d.startsWith(selectedMonthYear) && isFin;
    }).length;

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
      ordersCompletedCount: completedOrders,
      ordersActiveCount: activeOrders
    };
  }, [selectedMonthYear, employees, vehicles, vehicleExpenses, generalExpenses, serviceOrders, directSales]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        logout,
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
        deleteSetupCost,
        addAuditLog,
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
