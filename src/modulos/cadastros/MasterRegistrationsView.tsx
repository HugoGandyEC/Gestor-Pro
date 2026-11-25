import React, { useState } from 'react';
import { 
  Users, 
  Building, 
  Package, 
  UserCheck, 
  Truck, 
  Wrench, 
  CheckSquare, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  AlertTriangle,
  FileCheck,
  Briefcase,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Database,
  UserCog,
  X
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../../context/AppContext';
import { UniversalDataImportView } from './UniversalDataImportView';
import { UsersManagementPanel } from '../../components/UsersManagementPanel';
import { LiveSearchInput, LiveSearchOption } from '../../components/LiveSearchInput';
import { RecordDetailModal } from '../../components/RecordDetailModal';
import { ViewModeToggle, ViewMode } from '../../components/ViewModeToggle';
import { useRowHoverTooltip } from '../../components/RowHoverTooltip';
import { ProductPhotoThumb } from '../../components/ProductPhotoThumb';
import { 
  Client, 
  Supplier, 
  Product, 
  Employee, 
  EmployeeRemunerationType,
  Vehicle, 
  ServiceCatalogItem, 
  ChecklistTemplate,
  ChecklistItem
} from '../../types';
import {
  REMUNERATION_TYPE_OPTIONS,
  REMUNERATION_TYPE_LABELS,
  getEmployeeRemunerationType,
  getRemunerationConfig,
  computeEmployeeNominalPay,
  computeEmployeeMonthlyFixedCost,
  formatEmployeeRemunerationSummary
} from '../../utils/employeeRemuneration';

type RegistrationTab = 
  | 'clients' 
  | 'suppliers' 
  | 'products' 
  | 'employees' 
  | 'fleet' 
  | 'services' 
  | 'checklists'
  | 'users'
  | 'import';

export const MasterRegistrationsView: React.FC = () => {
  const { 
    clients, 
    addClient, 
    updateClient, 
    deleteClient, 
    suppliers, 
    addSupplier, 
    updateSupplier, 
    deleteSupplier,
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    employees, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee,
    vehicles, 
    addVehicle, 
    updateVehicle, 
    deleteVehicle,
    serviceCatalog, 
    addServiceCatalogItem, 
    updateServiceCatalogItem, 
    deleteServiceCatalogItem,
    checklistTemplates, 
    addChecklistTemplate, 
    updateChecklistTemplate, 
    deleteChecklistTemplate,
    authUsers,
    lookupCep, 
    lookupCnpj 
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<RegistrationTab>('clients');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [clientTypeFilter, setClientTypeFilter] = useState<'todos' | 'varejo' | 'atacado'>('todos');
  const [supplierCityFilter, setSupplierCityFilter] = useState<string>('todas');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('todas');
  const [productStockFilter, setProductStockFilter] = useState<'todos' | 'normal' | 'baixo'>('todos');
  const [employeeRemFilter, setEmployeeRemFilter] = useState<'todas' | EmployeeRemunerationType>('todas');
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<'todos' | Vehicle['status']>('todos');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string>('todas');
  const [checklistEquipFilter, setChecklistEquipFilter] = useState<string>('todos');
  const { showTooltip, hideTooltip, tooltipElement } = useRowHoverTooltip();

  // Modal states
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);

  // Edit target states
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingService, setEditingService] = useState<ServiceCatalogItem | null>(null);
  const [editingChecklist, setEditingChecklist] = useState<ChecklistTemplate | null>(null);

  type MasterDetailTarget =
    | { kind: 'client'; data: Client }
    | { kind: 'supplier'; data: Supplier }
    | { kind: 'product'; data: Product }
    | { kind: 'employee'; data: Employee }
    | { kind: 'vehicle'; data: Vehicle }
    | { kind: 'service'; data: ServiceCatalogItem }
    | { kind: 'checklist'; data: ChecklistTemplate };
  const [detailTarget, setDetailTarget] = useState<MasterDetailTarget | null>(null);

  // Client form state
  const [clientForm, setClientForm] = useState({
    customerType: 'varejo' as 'varejo' | 'atacado',
    name: '',
    tradeName: '',
    document: '',
    email: '',
    phone: '',
    cep: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    notes: ''
  });

  // Supplier form state
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    tradeName: '',
    cnpj: '',
    email: '',
    phone: '',
    contactPerson: '',
    cep: '01001-000',
    street: 'Rua Principal',
    number: '100',
    city: 'São Paulo',
    state: 'SP'
  });

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: 'Reservatórios Térmicos',
    ncm: '8419.19.10',
    costPrice: 0,
    retailPrice: 0,
    wholesalePrice: 0,
    currentStock: 10,
    minStock: 2,
    unit: 'UN',
    photos: [] as string[]
  });

  // Employee form state
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    role: 'Técnico Hidráulico Sênior',
    remunerationType: 'salario' as EmployeeRemunerationType,
    baseSalary: 3800,
    hourlyRate: 35,
    monthlyHoursWorked: 160,
    benefitsAndCharges: 1900,
    commissionRate: 5,
    assignedVehicleId: '',
    phone: '',
    email: '',
    status: 'Ativo' as Employee['status'],
    admissionDate: new Date().toISOString().split('T')[0]
  });

  // Vehicle form state
  const [vehicleForm, setVehicleForm] = useState({
    plate: '',
    model: '',
    brand: '',
    year: 2023,
    currentKm: 45000,
    annualIpvaValue: 1800,
    annualInsuranceValue: 2400,
    assignedEmployeeId: ''
  });

  // Service form state
  const [serviceForm, setServiceForm] = useState({
    code: '',
    name: '',
    category: 'Manutenção Preventiva',
    defaultHours: 2,
    standardPrice: 350,
    minPrice: 280
  });

  // Checklist form state
  const [checklistForm, setChecklistForm] = useState<{
    title: string;
    equipmentType: string;
    serviceIds: string[];
    items: { id: string; label: string; category: ChecklistItem['category']; required: boolean }[];
  }>({
    title: '',
    equipmentType: '',
    serviceIds: [],
    items: [
      { id: '1', label: '', category: 'Estrutura e Tanque', required: true }
    ]
  });

  // Auto-fill CNPJ handler
  const handleCnpjSearch = async (cnpj: string, target: 'client' | 'supplier') => {
    if (cnpj.replace(/\D/g, '').length === 14) {
      const data = await lookupCnpj(cnpj);
      if (data) {
        if (target === 'client') {
          setClientForm(prev => ({
            ...prev,
            name: data.name || prev.name,
            tradeName: data.tradeName || prev.tradeName,
            phone: data.phone || prev.phone,
            email: data.email || prev.email,
            cep: data.cep || prev.cep,
            street: data.street || prev.street,
            number: data.number || prev.number,
            city: data.city || prev.city,
            state: data.state || prev.state
          }));
        } else {
          setSupplierForm(prev => ({
            ...prev,
            name: data.name || prev.name,
            tradeName: data.tradeName || prev.tradeName,
            phone: data.phone || prev.phone,
            email: data.email || prev.email,
            city: data.city || prev.city,
            state: data.state || prev.state
          }));
        }
      }
    }
  };

  // Auto-fill CEP handler
  const handleCepSearch = async (cep: string) => {
    if (cep.replace(/\D/g, '').length === 8) {
      const data = await lookupCep(cep);
      if (data) {
        setClientForm(prev => ({
          ...prev,
          street: data.street,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state
        }));
      }
    }
  };

  const tabsConfig = [
    { id: 'clients', label: 'Clientes', icon: Users, count: clients.length },
    { id: 'suppliers', label: 'Fornecedores', icon: Building, count: suppliers.length },
    { id: 'products', label: 'Estoque', icon: Package, count: products.length },
    { id: 'employees', label: 'Equipe & Técnicos', icon: UserCheck, count: employees.length },
    { id: 'fleet', label: 'Frota de Veículos', icon: Truck, count: vehicles.length },
    { id: 'services', label: 'Serviços Tabelados', icon: Wrench, count: serviceCatalog.length },
    { id: 'checklists', label: 'Modelos de Checklist', icon: CheckSquare, count: checklistTemplates.length },
    { id: 'users', label: 'Usuários', icon: UserCog, count: authUsers.length },
    { id: 'import', label: 'Importação Geral & Backups', icon: Database, count: '6 Formatos' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 whitespace-nowrap">
              Central Unificada de Cadastros
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:whitespace-nowrap">Central Cadastros</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl line-clamp-2 leading-relaxed">
            Gerencie clientes, fornecedores, produtos, serviços e cadastros essenciais do ERP em um só lugar.
          </p>
        </div>

        {/* Quick Action Button */}
        <div className="shrink-0">
          {activeSubTab === 'clients' && (
            <button
              onClick={() => {
                setEditingClient(null);
                setClientForm({
                  customerType: 'varejo',
                  name: '', tradeName: '', document: '', email: '', phone: '',
                  cep: '', street: '', number: '', neighborhood: '', city: '', state: '', notes: ''
                });
                setIsClientModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" /> Novo Cliente
            </button>
          )}
          {activeSubTab === 'suppliers' && (
            <button
              onClick={() => {
                setEditingSupplier(null);
                setSupplierForm({
                  name: '', tradeName: '', cnpj: '', email: '', phone: '', contactPerson: '',
                  cep: '01001-000', street: 'Rua Principal', number: '100', city: '', state: ''
                });
                setIsSupplierModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" /> Novo Fornecedor
            </button>
          )}
          {activeSubTab === 'products' && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  name: '', sku: `PRD-${Date.now().toString().slice(-4)}`, category: 'Tanques & Reservatórios',
                  ncm: '8419.19.10', costPrice: 0, retailPrice: 0, wholesalePrice: 0, currentStock: 10, minStock: 2, unit: 'UN',
                  photos: []
                });
                setIsProductModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" /> Novo Produto
            </button>
          )}
          {activeSubTab === 'employees' && (
            <button
              onClick={() => {
                setEditingEmployee(null);
                setEmployeeForm({
                  name: '', role: 'Técnico Especialista', remunerationType: 'salario',
                  baseSalary: 3800, hourlyRate: 35, monthlyHoursWorked: 160, benefitsAndCharges: 1900,
                  commissionRate: 5, assignedVehicleId: '', phone: '', email: '', status: 'Ativo',
                  admissionDate: new Date().toISOString().split('T')[0]
                });
                setIsEmployeeModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" /> Novo Funcionário
            </button>
          )}
          {activeSubTab === 'fleet' && (
            <button
              onClick={() => {
                setEditingVehicle(null);
                setVehicleForm({
                  plate: '', model: '', brand: '', year: 2024, currentKm: 10000,
                  annualIpvaValue: 1800, annualInsuranceValue: 2400, assignedEmployeeId: ''
                });
                setIsVehicleModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" /> Novo Veículo
            </button>
          )}
          {activeSubTab === 'services' && (
            <button
              onClick={() => {
                setEditingService(null);
                setServiceForm({
                  code: `SRV-${String(serviceCatalog.length + 1).padStart(2, '0')}`,
                  name: '', category: 'Mão de Obra Técnica', defaultHours: 2, standardPrice: 300, minPrice: 250
                });
                setIsServiceModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" /> Novo Serviço
            </button>
          )}
          {activeSubTab === 'checklists' && (
            <button
              onClick={() => {
                setEditingChecklist(null);
                setChecklistForm({
                  title: '', 
                  equipmentType: 'Aquecedor / Boiler',
                  serviceIds: [],
                  items: [
                    { id: '1', label: 'Vistoria visual do equipamento', category: 'Estrutura e Tanque', required: true },
                    { id: '2', label: 'Teste de pressão e estanqueidade', category: 'Hidráulica e Pressão', required: true },
                    { id: '3', label: 'Checagem final e limpeza da área', category: 'Acessórios e Segurança', required: true }
                  ]
                });
                setIsChecklistModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" /> Novo Modelo
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs Combobox */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 flex-1">
          <SlidersHorizontal className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="flex-1 max-w-md">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Módulo / Seção de Cadastro
            </label>
            <select
              value={activeSubTab}
              onChange={(e) => {
                setActiveSubTab(e.target.value as RegistrationTab);
                setSearchTerm('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              {tabsConfig.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label} ({tab.count})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span className="font-semibold text-slate-700">
            {tabsConfig.find(t => t.id === activeSubTab)?.label}:
          </span>
          <span className="font-mono font-bold text-blue-700">
            {tabsConfig.find(t => t.id === activeSubTab)?.count}
          </span>
        </div>
      </div>

      {/* Search and Combobox Filters Bar */}
      {activeSubTab !== 'import' && activeSubTab !== 'users' && (
        <div className="bg-white p-3.5 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex-1 min-w-[220px] md:max-w-md">
            <LiveSearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={`Filtrar ${tabsConfig.find(t => t.id === activeSubTab)?.label.toLowerCase()} por nome, código ou documento...`}
              emptyLabel="Nenhum registro"
              inputClassName="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
              getOptions={(query): LiveSearchOption<string>[] => {
                const q = query.toLowerCase();
                if (activeSubTab === 'clients') {
                  return clients
                    .filter(c => c.name.toLowerCase().includes(q) || (c.document || '').toLowerCase().includes(q))
                    .map(c => ({ id: c.id, title: c.name, subtitle: c.document || c.phone, badgeText: c.customerType === 'atacado' ? 'Atacadista' : 'Varejista', data: c.name }));
                }
                if (activeSubTab === 'suppliers') {
                  return suppliers
                    .filter(s => s.name.toLowerCase().includes(q) || (s.cnpj || '').toLowerCase().includes(q))
                    .map(s => ({ id: s.id, title: s.name, subtitle: s.cnpj || s.phone, data: s.name }));
                }
                if (activeSubTab === 'products') {
                  return products
                    .filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
                    .map(p => ({ id: p.id, title: p.name, subtitle: `${p.code} · Estoque: ${p.currentStock}`, priceText: formatBRL(p.retailPrice), thumbnailUrl: p.photos?.[0], data: p.code }));
                }
                if (activeSubTab === 'employees') {
                  return employees
                    .filter(e => e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q))
                    .map(e => ({ id: e.id, title: e.name, subtitle: e.role, data: e.name }));
                }
                if (activeSubTab === 'fleet') {
                  return vehicles
                    .filter(v => v.model.toLowerCase().includes(q) || v.plate.toLowerCase().includes(q))
                    .map(v => ({ id: v.id, title: v.model, subtitle: v.plate, data: v.plate }));
                }
                if (activeSubTab === 'services') {
                  return serviceCatalog
                    .filter(sv => sv.name.toLowerCase().includes(q) || sv.code.toLowerCase().includes(q))
                    .map(sv => ({ id: sv.id, title: sv.name, subtitle: sv.code, priceText: formatBRL(sv.standardPrice), data: sv.name }));
                }
                return checklistTemplates
                  .filter(t => t.title.toLowerCase().includes(q))
                  .map(t => ({ id: t.id, title: t.title, subtitle: t.equipmentType, data: t.title }));
              }}
              onSelect={(opt) => setSearchTerm(opt.data)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {activeSubTab === 'clients' && (
              <select
                value={clientTypeFilter}
                onChange={(e) => setClientTypeFilter(e.target.value as 'todos' | 'varejo' | 'atacado')}
                aria-label="Filtrar perfil do cliente"
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
              >
                <option value="todos">Perfil: Todos</option>
                <option value="varejo">Varejo</option>
                <option value="atacado">Atacado</option>
              </select>
            )}

            {activeSubTab === 'suppliers' && (
              <select
                value={supplierCityFilter}
                onChange={(e) => setSupplierCityFilter(e.target.value)}
                aria-label="Filtrar cidade do fornecedor"
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
              >
                <option value="todas">Cidade/UF: Todas</option>
                {Array.from(new Set(suppliers.map(s => [s.city, s.state].filter(Boolean).join('/')).filter(Boolean)))
                  .sort()
                  .map(cityUf => (
                    <option key={cityUf} value={cityUf}>{cityUf}</option>
                  ))}
              </select>
            )}

            {activeSubTab === 'products' && (
              <>
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  aria-label="Filtrar categoria do estoque"
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
                >
                  <option value="todas">Categoria: Todas</option>
                  {Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort().map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={productStockFilter}
                  onChange={(e) => setProductStockFilter(e.target.value as 'todos' | 'normal' | 'baixo')}
                  aria-label="Filtrar situação do estoque"
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
                >
                  <option value="todos">Estoque: Todos</option>
                  <option value="normal">Estoque Normal</option>
                  <option value="baixo">Estoque Baixo / Mínimo</option>
                </select>
              </>
            )}

            {activeSubTab === 'employees' && (
              <select
                value={employeeRemFilter}
                onChange={(e) => setEmployeeRemFilter(e.target.value as 'todas' | EmployeeRemunerationType)}
                aria-label="Filtrar remuneração do colaborador"
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
              >
                <option value="todas">Remuneração: Todas</option>
                {REMUNERATION_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}

            {activeSubTab === 'fleet' && (
              <select
                value={vehicleStatusFilter}
                onChange={(e) => setVehicleStatusFilter(e.target.value as 'todos' | Vehicle['status'])}
                aria-label="Filtrar situação do veículo"
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
              >
                <option value="todos">Status: Todos</option>
                <option value="Disponível">Disponível</option>
                <option value="Em Rota">Em Rota</option>
                <option value="Em Manutenção">Em Manutenção</option>
              </select>
            )}

            {activeSubTab === 'services' && (
              <select
                value={serviceCategoryFilter}
                onChange={(e) => setServiceCategoryFilter(e.target.value)}
                aria-label="Filtrar categoria do serviço"
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
              >
                <option value="todas">Categoria: Todas</option>
                {Array.from(new Set(serviceCatalog.map(s => s.category).filter(Boolean))).sort().map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}

            {activeSubTab === 'checklists' && (
              <select
                value={checklistEquipFilter}
                onChange={(e) => setChecklistEquipFilter(e.target.value)}
                aria-label="Filtrar equipamento do checklist"
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
              >
                <option value="todos">Equipamento: Todos</option>
                {Array.from(new Set(checklistTemplates.map(t => t.equipmentType).filter(Boolean))).sort().map(eq => (
                  <option key={eq} value={eq}>{eq}</option>
                ))}
              </select>
            )}

            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          </div>
        </div>
      )}

      {/* SUB-TAB 1: CLIENTES */}
      {activeSubTab === 'clients' && (() => {
        const filteredClients = clients.filter(c => {
          const matchesSearch =
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.document.includes(searchTerm) ||
            (c.tradeName && c.tradeName.toLowerCase().includes(searchTerm.toLowerCase()));
          const matchesType = clientTypeFilter === 'todos' || (c.customerType || 'varejo') === clientTypeFilter;
          return matchesSearch && matchesType;
        });
        return viewMode === 'list' ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="dense-table text-left text-xs">
                <thead>
                  <tr>
                    <th>Perfil</th>
                    <th>Cliente</th>
                    <th>CPF / CNPJ</th>
                    <th>Telefone</th>
                    <th>Cidade / UF</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map(client => {
                    const addressSummary = [client.street, client.number, client.neighborhood, client.city && client.state ? `${client.city}/${client.state}` : client.city].filter(Boolean).join(', ');
                    return (
                      <tr
                        key={client.id}
                        className="dense-row"
                        onMouseEnter={(e) =>
                          showTooltip(e, {
                            title: client.name,
                            subtitle: `${client.customerType === 'atacado' ? 'Atacadista (Atacado Liberado)' : 'Varejista (Varejo)'}${client.tradeName ? ` · Fantasia: ${client.tradeName}` : ''}`,
                            description: client.notes || 'Cliente cadastrado no banco de dados geral do sistema.',
                            fields: [
                              { label: 'CPF / CNPJ', value: client.document || 'Não informado' },
                              { label: 'Telefone', value: client.phone || '—' },
                              { label: 'E-mail', value: client.email || '—' },
                              { label: 'Endereço', value: addressSummary || '—', fullWidth: true }
                            ]
                          })
                        }
                        onMouseLeave={hideTooltip}
                      >
                        <td className={`font-semibold text-[11px] ${client.customerType === 'atacado' ? 'text-purple-700' : 'text-slate-600'}`}>
                          {client.customerType === 'atacado' ? 'Atac.' : 'Var.'}
                        </td>
                        <td className="font-semibold text-slate-900">{client.name}</td>
                        <td className="font-mono text-slate-700 tabular-nums">{client.document || '—'}</td>
                        <td className="font-mono text-slate-600 tabular-nums">{client.phone || '—'}</td>
                        <td className="text-slate-600">{client.city}/{client.state}</td>
                        <td className="text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailTarget({ kind: 'client', data: client })}
                              className="list-plus-btn"
                              title="Abrir todos os dados do cliente"
                              aria-label={`Ver detalhes de ${client.name}`}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingClient(client);
                                setClientForm({
                                  customerType: client.customerType || 'varejo',
                                  name: client.name,
                                  tradeName: client.tradeName || '',
                                  document: client.document,
                                  email: client.email || '',
                                  phone: client.phone,
                                  cep: client.cep || '',
                                  street: client.street || '',
                                  number: client.number || '',
                                  neighborhood: client.neighborhood || '',
                                  city: client.city || '',
                                  state: client.state || '',
                                  notes: client.notes || ''
                                });
                                setIsClientModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Deseja remover o cliente "${client.name}"?`)) {
                                  deleteClient(client.id);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map(client => (
              <div key={client.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[11px] font-bold uppercase ${client.customerType === 'atacado' ? 'text-purple-700' : 'text-slate-600'}`}>
                      {client.customerType === 'atacado' ? 'Atacadista' : 'Varejista'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDetailTarget({ kind: 'client', data: client })}
                      className="list-plus-btn"
                      title="Abrir todos os dados do cliente"
                      aria-label={`Ver detalhes de ${client.name}`}
                    >
                      +
                    </button>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{client.name}</h3>
                  {client.tradeName && <p className="text-xs text-slate-500 truncate">{client.tradeName}</p>}
                  <div className="text-xs text-slate-600 space-y-1 pt-1">
                    <div className="font-mono tabular-nums">{client.document || 'Sem documento'} · {client.phone || 'Sem telefone'}</div>
                    <div className="truncate text-slate-500">{[client.city, client.state].filter(Boolean).join(' / ') || 'Endereço não informado'}</div>
                  </div>
                </div>
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingClient(client);
                      setClientForm({
                        customerType: client.customerType || 'varejo',
                        name: client.name,
                        tradeName: client.tradeName || '',
                        document: client.document,
                        email: client.email || '',
                        phone: client.phone,
                        cep: client.cep || '',
                        street: client.street || '',
                        number: client.number || '',
                        neighborhood: client.neighborhood || '',
                        city: client.city || '',
                        state: client.state || '',
                        notes: client.notes || ''
                      });
                      setIsClientModalOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Deseja remover o cliente "${client.name}"?`)) {
                        deleteClient(client.id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* SUB-TAB 2: FORNECEDORES */}
      {activeSubTab === 'suppliers' && (() => {
        const filteredSuppliers = suppliers.filter(s => {
          const matchesSearch =
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.cnpj.includes(searchTerm) ||
            (s.tradeName && s.tradeName.toLowerCase().includes(searchTerm.toLowerCase()));
          const cityUf = [s.city, s.state].filter(Boolean).join('/');
          const matchesCity = supplierCityFilter === 'todas' || cityUf === supplierCityFilter;
          return matchesSearch && matchesCity;
        });
        return viewMode === 'list' ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="dense-table text-left text-xs">
                <thead>
                  <tr>
                    <th>Razão Social</th>
                    <th>CNPJ</th>
                    <th>Telefone</th>
                    <th>Cidade / UF</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map(supplier => (
                    <tr
                      key={supplier.id}
                      className="dense-row"
                      onMouseEnter={(e) =>
                        showTooltip(e, {
                          title: supplier.name,
                          subtitle: supplier.tradeName ? `Fantasia: ${supplier.tradeName}` : `CNPJ: ${supplier.cnpj || 'Não informado'}`,
                          description: supplier.notes || 'Fornecedor homologado no cadastro geral.',
                          fields: [
                            { label: 'CNPJ', value: supplier.cnpj || '—' },
                            { label: 'Contato', value: supplier.contactPerson || '—' },
                            { label: 'Telefone', value: supplier.phone || '—' },
                            { label: 'E-mail', value: supplier.email || '—' },
                            { label: 'Localização', value: `${supplier.street || ''} ${supplier.number || ''}, ${supplier.city || ''}/${supplier.state || ''}`.trim() || '—', fullWidth: true }
                          ]
                        })
                      }
                      onMouseLeave={hideTooltip}
                    >
                      <td className="font-semibold text-slate-900">{supplier.name}</td>
                      <td className="font-mono text-slate-700 tabular-nums">{supplier.cnpj || '—'}</td>
                      <td className="font-mono text-slate-600 tabular-nums">{supplier.phone || '—'}</td>
                      <td className="text-slate-600">{supplier.city}/{supplier.state}</td>
                      <td className="text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailTarget({ kind: 'supplier', data: supplier })}
                            className="list-plus-btn"
                            title="Abrir todos os dados do fornecedor"
                            aria-label={`Ver detalhes de ${supplier.name}`}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSupplier(supplier);
                              setSupplierForm({
                                name: supplier.name,
                                tradeName: supplier.tradeName || '',
                                cnpj: supplier.cnpj,
                                email: supplier.email || '',
                                phone: supplier.phone || '',
                                contactPerson: supplier.contactPerson || '',
                                cep: supplier.cep || '01001-000',
                                street: supplier.street || 'Rua Principal',
                                number: supplier.number || '100',
                                city: supplier.city || '',
                                state: supplier.state || ''
                              });
                              setIsSupplierModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Deseja remover o fornecedor "${supplier.name}"?`)) {
                                deleteSupplier(supplier.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map(supplier => (
              <div key={supplier.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-slate-500 tabular-nums">{supplier.cnpj || 'Sem CNPJ'}</span>
                    <button
                      type="button"
                      onClick={() => setDetailTarget({ kind: 'supplier', data: supplier })}
                      className="list-plus-btn"
                      title="Abrir todos os dados do fornecedor"
                      aria-label={`Ver detalhes de ${supplier.name}`}
                    >
                      +
                    </button>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{supplier.name}</h3>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Contato: {supplier.contactPerson || 'Comercial'} · {supplier.phone || '—'}</div>
                    <div className="text-slate-500 truncate">{[supplier.city, supplier.state].filter(Boolean).join(' / ') || '—'}</div>
                  </div>
                </div>
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSupplier(supplier);
                      setSupplierForm({
                        name: supplier.name,
                        tradeName: supplier.tradeName || '',
                        cnpj: supplier.cnpj,
                        email: supplier.email || '',
                        phone: supplier.phone || '',
                        contactPerson: supplier.contactPerson || '',
                        cep: supplier.cep || '01001-000',
                        street: supplier.street || 'Rua Principal',
                        number: supplier.number || '100',
                        city: supplier.city || '',
                        state: supplier.state || ''
                      });
                      setIsSupplierModalOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Deseja remover o fornecedor "${supplier.name}"?`)) {
                        deleteSupplier(supplier.id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* SUB-TAB 3: ESTOQUE */}
      {activeSubTab === 'products' && (() => {
        const filteredProducts = products.filter(p => {
          const matchesSearch =
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
          const matchesCat = productCategoryFilter === 'todas' || p.category === productCategoryFilter;
          const isLow = p.currentStock <= p.minStock;
          const matchesStock = productStockFilter === 'todos' || (productStockFilter === 'baixo' ? isLow : !isLow);
          return matchesSearch && matchesCat && matchesStock;
        });
        return viewMode === 'list' ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="dense-table text-left text-xs">
                <thead>
                  <tr>
                    <th className="w-14 text-center">Foto</th>
                    <th>Código</th>
                    <th>Produto</th>
                    <th className="text-right">Varejo</th>
                    <th className="text-right">Atacado</th>
                    <th className="text-center">Estoque</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => {
                    const isLow = product.currentStock <= product.minStock;
                    const thumb = product.photos?.[0];
                    return (
                      <tr
                        key={product.id}
                        className="dense-row"
                        onMouseEnter={(e) =>
                          showTooltip(e, {
                            title: product.name,
                            subtitle: `${product.category}${product.brand ? ` · Marca: ${product.brand}` : ''}`,
                            description: product.description || 'Produto cadastrado no catálogo mestre de peças e itens.',
                            imageUrl: thumb,
                            imageAlt: product.name,
                            showImageSlot: true,
                            fields: [
                              { label: 'Código / SKU', value: `${product.code}${product.sku ? ` · ${product.sku}` : ''}` },
                              { label: 'NCM', value: product.ncm || '—' },
                              { label: 'Custo / Varejo', value: `${formatBRL(product.costPrice)} · ${formatBRL(product.retailPrice)}` },
                              { label: 'Atacado / Estoque', value: `${formatBRL(product.wholesalePrice)} · ${product.currentStock} ${product.unit}` }
                            ]
                          })
                        }
                        onMouseLeave={hideTooltip}
                      >
                        <td className="text-center">
                          <ProductPhotoThumb
                            src={thumb}
                            alt={product.name}
                            className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center mx-auto overflow-hidden"
                            iconClassName="w-4 h-4 text-slate-400"
                          />
                        </td>
                        <td className="font-mono text-slate-600 tabular-nums">{product.code || product.sku}</td>
                        <td className="font-semibold text-slate-900">{product.name}</td>
                        <td className="text-right font-mono font-semibold text-emerald-700 tabular-nums">{formatBRL(product.retailPrice)}</td>
                        <td className="text-right font-mono text-blue-700 tabular-nums">{formatBRL(product.wholesalePrice)}</td>
                        <td className={`text-center font-mono font-semibold tabular-nums ${isLow ? 'text-amber-700' : 'text-slate-700'}`}>
                          {product.currentStock} {product.unit}
                        </td>
                        <td className="text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailTarget({ kind: 'product', data: product })}
                              className="list-plus-btn"
                              title="Abrir todos os dados do produto"
                              aria-label={`Ver detalhes de ${product.name}`}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct(product);
                                setProductForm({
                                  name: product.name,
                                  sku: product.sku || product.code,
                                  category: product.category,
                                  ncm: product.ncm || '',
                                  costPrice: product.costPrice,
                                  retailPrice: product.retailPrice,
                                  wholesalePrice: product.wholesalePrice,
                                  currentStock: product.currentStock,
                                  minStock: product.minStock,
                                  unit: product.unit,
                                  photos: product.photos ? [...product.photos] : []
                                });
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="Editar Produto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Deseja remover o produto "${product.name}"?`)) {
                                  deleteProduct(product.id);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Excluir Produto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => {
              const isLow = product.currentStock <= product.minStock;
              const thumb = product.photos?.[0];
              return (
                <div
                  key={product.id}
                  onMouseEnter={(e) =>
                    showTooltip(e, {
                      title: product.name,
                      subtitle: `${product.category}${product.brand ? ` · Marca: ${product.brand}` : ''}`,
                      description: product.description || 'Produto cadastrado no catálogo mestre de peças e itens.',
                      imageUrl: thumb,
                      imageAlt: product.name,
                      showImageSlot: true,
                      fields: [
                        { label: 'Código / SKU', value: `${product.code}${product.sku ? ` · ${product.sku}` : ''}` },
                        { label: 'NCM', value: product.ncm || '—' },
                        { label: 'Custo / Varejo', value: `${formatBRL(product.costPrice)} · ${formatBRL(product.retailPrice)}` },
                        { label: 'Atacado / Estoque', value: `${formatBRL(product.wholesalePrice)} · ${product.currentStock} ${product.unit}` }
                      ]
                    })
                  }
                  onMouseLeave={hideTooltip}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-2.5">
                    <ProductPhotoThumb
                      src={thumb}
                      alt={product.name}
                      className="w-full h-36 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden"
                      iconClassName="w-8 h-8 text-slate-400"
                      emptyLabel="Sem foto"
                    />
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[11px] tabular-nums">
                        <span className="font-mono text-blue-600 font-bold truncate">{product.code || product.sku}</span>
                        <span className={`font-mono font-bold shrink-0 ${isLow ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {product.currentStock} {product.unit}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug mt-0.5">{product.name}</h3>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{product.category}</p>
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="text-xs font-mono tabular-nums">
                      <span className="font-bold text-emerald-700">{formatBRL(product.retailPrice)}</span>
                      <span className="text-slate-400 mx-1">·</span>
                      <span className="text-blue-700">{formatBRL(product.wholesalePrice)}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDetailTarget({ kind: 'product', data: product })}
                        className="list-plus-btn"
                        title="Abrir todos os dados do produto"
                        aria-label={`Ver detalhes de ${product.name}`}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(product);
                          setProductForm({
                            name: product.name,
                            sku: product.sku || product.code,
                            category: product.category,
                            ncm: product.ncm || '',
                            costPrice: product.costPrice,
                            retailPrice: product.retailPrice,
                            wholesalePrice: product.wholesalePrice,
                            currentStock: product.currentStock,
                            minStock: product.minStock,
                            unit: product.unit,
                            photos: product.photos ? [...product.photos] : []
                          });
                          setIsProductModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                        title="Editar Produto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Deseja remover o produto "${product.name}"?`)) {
                            deleteProduct(product.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                        title="Excluir Produto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* SUB-TAB 4: EQUIPE & TÉCNICOS */}
      {activeSubTab === 'employees' && (() => {
        const filteredEmployees = employees.filter(e => {
          const matchesSearch =
            e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.role.toLowerCase().includes(searchTerm.toLowerCase());
          const remType = getEmployeeRemunerationType(e);
          const matchesRem = employeeRemFilter === 'todas' || remType === employeeRemFilter;
          return matchesSearch && matchesRem;
        });
        return viewMode === 'list' ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="dense-table text-left text-xs">
                <thead>
                  <tr>
                    <th>Colaborador</th>
                    <th>Cargo</th>
                    <th>Remuneração</th>
                    <th>Telefone</th>
                    <th className="text-right">Remun. Nominal</th>
                    <th className="text-center">Comissão</th>
                    <th>Veículo</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(employee => {
                    const assignedVeh = vehicles.find(v => v.id === employee.assignedVehicleId);
                    const remType = getEmployeeRemunerationType(employee);
                    const nominalPay = computeEmployeeNominalPay(employee);
                    const totalMonthlyCost = computeEmployeeMonthlyFixedCost(employee);
                    return (
                      <tr
                        key={employee.id}
                        className="dense-row"
                        onMouseEnter={(e) =>
                          showTooltip(e, {
                            title: employee.name,
                            subtitle: `${employee.role} · ${REMUNERATION_TYPE_LABELS[remType]} · ${employee.status}`,
                            description: `Admissão: ${formatDateBR(employee.admissionDate)} · Custo mensal total de ${formatBRL(totalMonthlyCost)}.`,
                            fields: [
                              { label: 'Telefone', value: employee.phone || '—' },
                              { label: 'E-mail', value: employee.email || '—' },
                              { label: 'Remuneração / Encargos', value: `${formatEmployeeRemunerationSummary(employee, formatBRL)} + ${formatBRL(employee.benefitsCharges)}` },
                              { label: 'Comissão / Veículo', value: `${employee.commissionRate}% · ${assignedVeh ? `${assignedVeh.model} (${assignedVeh.plate})` : 'Nenhum'}` }
                            ]
                          })
                        }
                        onMouseLeave={hideTooltip}
                      >
                        <td className="font-semibold text-slate-900">{employee.name}</td>
                        <td className="text-blue-700 font-medium">{employee.role}</td>
                        <td className="text-slate-600 text-[11px] font-medium">{REMUNERATION_TYPE_LABELS[remType]}</td>
                        <td className="font-mono text-slate-600 tabular-nums">{employee.phone || '—'}</td>
                        <td className="text-right font-mono font-medium text-slate-700 tabular-nums">
                          {formatBRL(nominalPay)}
                        </td>
                        <td className="text-center font-mono font-semibold text-emerald-700 tabular-nums">
                          {employee.commissionRate}%
                        </td>
                        <td className="font-mono text-slate-600">
                          {assignedVeh ? assignedVeh.plate : '—'}
                        </td>
                        <td className="text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailTarget({ kind: 'employee', data: employee })}
                              className="list-plus-btn"
                              title="Abrir todos os dados do colaborador"
                              aria-label={`Ver detalhes de ${employee.name}`}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEmployee(employee);
                                setEmployeeForm({
                                  name: employee.name,
                                  role: employee.role,
                                  remunerationType: getEmployeeRemunerationType(employee),
                                  baseSalary: employee.baseSalary,
                                  hourlyRate: employee.hourlyRate || 35,
                                  monthlyHoursWorked: employee.monthlyHoursWorked || 160,
                                  benefitsAndCharges: employee.benefitsCharges,
                                  commissionRate: employee.commissionRate,
                                  assignedVehicleId: employee.assignedVehicleId || '',
                                  phone: employee.phone,
                                  email: employee.email,
                                  status: employee.status,
                                  admissionDate: employee.admissionDate
                                });
                                setIsEmployeeModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Deseja remover o funcionário "${employee.name}"?`)) {
                                  deleteEmployee(employee.id);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map(employee => {
              const assignedVeh = vehicles.find(v => v.id === employee.assignedVehicleId);
              const remType = getEmployeeRemunerationType(employee);
              return (
                <div key={employee.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-semibold text-blue-700">{employee.role} · {REMUNERATION_TYPE_LABELS[remType]}</span>
                      <button
                        type="button"
                        onClick={() => setDetailTarget({ kind: 'employee', data: employee })}
                        className="list-plus-btn"
                        title="Abrir todos os dados do colaborador"
                        aria-label={`Ver detalhes de ${employee.name}`}
                      >
                        +
                      </button>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900">{employee.name}</h3>
                    <div className="text-xs text-slate-600 space-y-1 font-mono tabular-nums">
                      <div>{formatEmployeeRemunerationSummary(employee, formatBRL)}</div>
                      <div className="text-slate-500">{employee.phone || '—'} · Veículo: {assignedVeh ? assignedVeh.plate : 'Nenhum'}</div>
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEmployee(employee);
                        setEmployeeForm({
                          name: employee.name,
                          role: employee.role,
                          remunerationType: getEmployeeRemunerationType(employee),
                          baseSalary: employee.baseSalary,
                          hourlyRate: employee.hourlyRate || 35,
                          monthlyHoursWorked: employee.monthlyHoursWorked || 160,
                          benefitsAndCharges: employee.benefitsCharges,
                          commissionRate: employee.commissionRate,
                          assignedVehicleId: employee.assignedVehicleId || '',
                          phone: employee.phone,
                          email: employee.email,
                          status: employee.status,
                          admissionDate: employee.admissionDate
                        });
                        setIsEmployeeModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Deseja remover o funcionário "${employee.name}"?`)) {
                          deleteEmployee(employee.id);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* SUB-TAB 5: FROTA DE VEÍCULOS */}
      {activeSubTab === 'fleet' && (() => {
        const filteredVehicles = vehicles.filter(v => {
          const matchesSearch =
            v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.model.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesStatus = vehicleStatusFilter === 'todos' || v.status === vehicleStatusFilter;
          return matchesSearch && matchesStatus;
        });
        return viewMode === 'list' ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="dense-table text-left text-xs">
                <thead>
                  <tr>
                    <th>Placa</th>
                    <th>Modelo</th>
                    <th className="text-center">KM Atual</th>
                    <th>Motorista</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map(vehicle => {
                    const assignedEmp = employees.find(e => e.id === vehicle.assignedEmployeeId);
                    return (
                      <tr
                        key={vehicle.id}
                        className="dense-row"
                        onMouseEnter={(e) =>
                          showTooltip(e, {
                            title: `${vehicle.plate} — ${vehicle.model}`,
                            subtitle: `${vehicle.brand || 'Frota Própria'} · Ano ${vehicle.year} · ${vehicle.status}`,
                            description: `Motorista vinculado: ${assignedEmp ? assignedEmp.name : 'Disponível no pátio'}.`,
                            fields: [
                              { label: 'Odômetro', value: `${vehicle.currentKm.toLocaleString()} km` },
                              { label: 'Próx. Troca de Óleo', value: vehicle.nextOilChangeKm ? `${vehicle.nextOilChangeKm.toLocaleString()} km` : '—' },
                              { label: 'IPVA Anual', value: formatBRL(vehicle.annualIpvaValue) },
                              { label: 'Seguro Anual', value: formatBRL(vehicle.annualInsuranceValue) }
                            ]
                          })
                        }
                        onMouseLeave={hideTooltip}
                      >
                        <td className="font-bold text-slate-900 font-mono tracking-wide">{vehicle.plate}</td>
                        <td className="text-slate-700 font-medium">{vehicle.model}</td>
                        <td className="text-center font-mono font-semibold text-slate-700 tabular-nums">{vehicle.currentKm.toLocaleString()} km</td>
                        <td className="text-slate-600">
                          {assignedEmp ? (
                            <span className="font-medium text-slate-800">{assignedEmp.name}</span>
                          ) : (
                            <span className="text-slate-400">Disponível</span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailTarget({ kind: 'vehicle', data: vehicle })}
                              className="list-plus-btn"
                              title="Abrir todos os dados do veículo"
                              aria-label={`Ver detalhes de ${vehicle.plate}`}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingVehicle(vehicle);
                                setVehicleForm({
                                  plate: vehicle.plate,
                                  model: vehicle.model,
                                  brand: vehicle.brand || '',
                                  year: vehicle.year,
                                  currentKm: vehicle.currentKm,
                                  annualIpvaValue: vehicle.annualIpvaValue,
                                  annualInsuranceValue: vehicle.annualInsuranceValue,
                                  assignedEmployeeId: vehicle.assignedEmployeeId || ''
                                });
                                setIsVehicleModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Deseja remover o veículo "${vehicle.plate}"?`)) {
                                  deleteVehicle(vehicle.id);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.map(vehicle => {
              const assignedEmp = employees.find(e => e.id === vehicle.assignedEmployeeId);
              return (
                <div key={vehicle.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">{vehicle.plate}</span>
                      <button
                        type="button"
                        onClick={() => setDetailTarget({ kind: 'vehicle', data: vehicle })}
                        className="list-plus-btn"
                        title="Abrir todos os dados do veículo"
                        aria-label={`Ver detalhes de ${vehicle.plate}`}
                      >
                        +
                      </button>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900">{vehicle.model}</h3>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="font-mono tabular-nums">Ano {vehicle.year} · {vehicle.currentKm.toLocaleString()} km</div>
                      <div>Motorista: {assignedEmp ? assignedEmp.name : 'Disponível no pátio'}</div>
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingVehicle(vehicle);
                        setVehicleForm({
                          plate: vehicle.plate,
                          model: vehicle.model,
                          brand: vehicle.brand || '',
                          year: vehicle.year,
                          currentKm: vehicle.currentKm,
                          annualIpvaValue: vehicle.annualIpvaValue,
                          annualInsuranceValue: vehicle.annualInsuranceValue,
                          assignedEmployeeId: vehicle.assignedEmployeeId || ''
                        });
                        setIsVehicleModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Deseja remover o veículo "${vehicle.plate}"?`)) {
                          deleteVehicle(vehicle.id);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* SUB-TAB 6: SERVIÇOS TABELADOS */}
      {activeSubTab === 'services' && (() => {
        const filteredServices = serviceCatalog.filter(s => {
          const matchesSearch =
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.code.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesCat = serviceCategoryFilter === 'todas' || s.category === serviceCategoryFilter;
          return matchesSearch && matchesCat;
        });
        return viewMode === 'list' ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="dense-table text-left text-xs">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Serviço</th>
                    <th className="text-center">Tempo</th>
                    <th className="text-right">Preço Padrão</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map(service => (
                    <tr
                      key={service.id}
                      className="dense-row"
                      onMouseEnter={(e) =>
                        showTooltip(e, {
                          title: service.name,
                          subtitle: `Código ${service.code} · Categoria: ${service.category}`,
                          description: 'Serviço tabelado disponível para seleção rápida em Ordens de Serviço e orçamentos.',
                          fields: [
                            { label: 'Tempo Padrão', value: `${service.defaultHours} h` },
                            { label: 'Preço Padrão', value: formatBRL(service.standardPrice) },
                            { label: 'Preço Mínimo', value: formatBRL(service.minPrice) }
                          ]
                        })
                      }
                      onMouseLeave={hideTooltip}
                    >
                      <td className="font-mono text-slate-600 tabular-nums">{service.code}</td>
                      <td className="font-semibold text-slate-900">{service.name}</td>
                      <td className="text-center font-mono text-slate-700 tabular-nums">{service.defaultHours} h</td>
                      <td className="text-right font-mono font-bold text-blue-700 tabular-nums">{formatBRL(service.standardPrice)}</td>
                      <td className="text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailTarget({ kind: 'service', data: service })}
                            className="list-plus-btn"
                            title="Abrir todos os dados do serviço"
                            aria-label={`Ver detalhes de ${service.name}`}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingService(service);
                              setServiceForm({
                                code: service.code,
                                name: service.name,
                                category: service.category,
                                defaultHours: service.defaultHours,
                                standardPrice: service.standardPrice,
                                minPrice: service.minPrice
                              });
                              setIsServiceModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Deseja remover o serviço "${service.name}"?`)) {
                                deleteServiceCatalogItem(service.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map(service => (
              <div key={service.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-500">{service.code} · {service.category}</span>
                    <button
                      type="button"
                      onClick={() => setDetailTarget({ kind: 'service', data: service })}
                      className="list-plus-btn"
                      title="Abrir todos os dados do serviço"
                      aria-label={`Ver detalhes de ${service.name}`}
                    >
                      +
                    </button>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">{service.name}</h3>
                  <div className="text-xs text-slate-600 font-mono tabular-nums">
                    Tempo: {service.defaultHours}h · Padrão: <strong className="text-blue-700">{formatBRL(service.standardPrice)}</strong> · Mín.: {formatBRL(service.minPrice)}
                  </div>
                </div>
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingService(service);
                      setServiceForm({
                        code: service.code,
                        name: service.name,
                        category: service.category,
                        defaultHours: service.defaultHours,
                        standardPrice: service.standardPrice,
                        minPrice: service.minPrice
                      });
                      setIsServiceModalOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Deseja remover o serviço "${service.name}"?`)) {
                        deleteServiceCatalogItem(service.id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* SUB-TAB 7: MODELOS DE CHECKLIST */}
      {activeSubTab === 'checklists' && (() => {
        const filteredChecklists = checklistTemplates.filter(t => {
          const matchesSearch =
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.equipmentType.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesEquip = checklistEquipFilter === 'todos' || t.equipmentType === checklistEquipFilter;
          return matchesSearch && matchesEquip;
        });
        return viewMode === 'list' ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="dense-table text-left text-xs">
                <thead>
                  <tr>
                    <th>Equipamento</th>
                    <th>Modelo de Checklist</th>
                    <th className="text-center">Itens</th>
                    <th className="text-center">Serviços</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChecklists.map(template => {
                    const linkedSrvNames = (template.serviceIds || [])
                      .map(id => serviceCatalog.find(s => s.id === id)?.name)
                      .filter(Boolean);
                    return (
                      <tr
                        key={template.id}
                        className="dense-row"
                        onMouseEnter={(e) =>
                          showTooltip(e, {
                            title: template.title,
                            subtitle: `Equipamento: ${template.equipmentType} · ${template.items.length} itens de inspeção`,
                            description: template.items.map(it => it.label).slice(0, 4).join(' · ') + (template.items.length > 4 ? '...' : ''),
                            fields: [
                              { label: 'Total de Itens', value: `${template.items.length} etapas` },
                              { label: 'Serviços Vinculados', value: linkedSrvNames.length > 0 ? linkedSrvNames.join(', ') : 'Nenhum' }
                            ]
                          })
                        }
                        onMouseLeave={hideTooltip}
                      >
                        <td className="text-blue-700 font-semibold">{template.equipmentType}</td>
                        <td className="font-semibold text-slate-900">{template.title}</td>
                        <td className="text-center font-mono text-slate-700 tabular-nums">{template.items.length}</td>
                        <td className="text-center font-mono text-slate-600 tabular-nums">{template.serviceIds?.length || 0}</td>
                        <td className="text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailTarget({ kind: 'checklist', data: template })}
                              className="list-plus-btn"
                              title="Abrir todos os itens do checklist"
                              aria-label={`Ver detalhes de ${template.title}`}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingChecklist(template);
                                setChecklistForm({
                                  title: template.title,
                                  equipmentType: template.equipmentType,
                                  serviceIds: template.serviceIds || [],
                                  items: [...template.items]
                                });
                                setIsChecklistModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Deseja remover o modelo "${template.title}"?`)) {
                                  deleteChecklistTemplate(template.id);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredChecklists.map(template => (
              <div key={template.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {template.equipmentType}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDetailTarget({ kind: 'checklist', data: template })}
                        className="list-plus-btn"
                        title="Abrir todos os itens do checklist"
                        aria-label={`Ver detalhes de ${template.title}`}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingChecklist(template);
                          setChecklistForm({
                            title: template.title,
                            equipmentType: template.equipmentType,
                            serviceIds: template.serviceIds || [],
                            items: [...template.items]
                          });
                          setIsChecklistModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Deseja remover o modelo "${template.title}"?`)) {
                            deleteChecklistTemplate(template.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm">{template.title}</h3>

                  <div className="mt-3 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Itens de Inspeção ({template.items.length}):</div>
                    {template.items.map((it, idx) => (
                      <div key={it.id || idx} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="flex-1">{it.label}</span>
                        <span className="text-[10px] uppercase font-mono px-1 rounded bg-slate-200 text-slate-600">
                          {it.category}
                        </span>
                        {it.required && (
                          <span className="text-[10px] text-rose-500 font-bold">*</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Attached Services Badges */}
                  {template.serviceIds && template.serviceIds.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Serviços Vinculados ({template.serviceIds.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {template.serviceIds.map(srvId => {
                          const srv = serviceCatalog.find(s => s.id === srvId);
                          return srv ? (
                            <span key={srvId} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                              {srv.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Pronto para uso na abertura de OS</span>
                  <span className="font-medium text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Ativo
                  </span>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* SUB-TAB 8: USUÁRIOS DO SISTEMA */}
      {activeSubTab === 'users' && (
        <UsersManagementPanel />
      )}

      {/* SUB-TAB 9: IMPORTAÇÃO GERAL & BACKUPS MULTI-FORMATO */}
      {activeSubTab === 'import' && (
        <UniversalDataImportView />
      )}

      {/* CLIENT MODAL */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h3>
              <button onClick={() => setIsClientModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingClient) {
                  updateClient(editingClient.id, clientForm);
                } else {
                  addClient(clientForm);
                }
                setIsClientModalOpen(false);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Tipo de Cliente (Liberação de Tabela de Preços) *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setClientForm({ ...clientForm, customerType: 'varejo' })}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        clientForm.customerType === 'varejo'
                          ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Varejista (Varejo)
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientForm({ ...clientForm, customerType: 'atacado' })}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        clientForm.customerType === 'atacado'
                          ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                          : 'bg-white text-purple-800 border-slate-200 hover:bg-purple-50'
                      }`}
                    >
                      Atacadista (Libera Atacado)
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Razão Social / Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    value={clientForm.tradeName}
                    onChange={(e) => setClientForm({ ...clientForm, tradeName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700">CPF / CNPJ (Opcional)</label>
                    <span className="text-[10px] text-blue-600">Busca auto se informado</span>
                  </div>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00 (Opcional)"
                    value={clientForm.document}
                    onChange={(e) => {
                      const val = e.target.value;
                      setClientForm({ ...clientForm, document: val });
                      handleCnpjSearch(val, 'client');
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">E-mail Principal</label>
                  <input
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700">CEP</label>
                    <span className="text-[10px] text-blue-600">Busca auto ViaCEP</span>
                  </div>
                  <input
                    type="text"
                    placeholder="00000-000"
                    value={clientForm.cep}
                    onChange={(e) => {
                      const val = e.target.value;
                      setClientForm({ ...clientForm, cep: val });
                      handleCepSearch(val);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Logradouro / Rua</label>
                  <input
                    type="text"
                    value={clientForm.street}
                    onChange={(e) => setClientForm({ ...clientForm, street: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Número</label>
                  <input
                    type="text"
                    value={clientForm.number}
                    onChange={(e) => setClientForm({ ...clientForm, number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={clientForm.neighborhood}
                    onChange={(e) => setClientForm({ ...clientForm, neighborhood: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={clientForm.city}
                    onChange={(e) => setClientForm({ ...clientForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={clientForm.state}
                    onChange={(e) => setClientForm({ ...clientForm, state: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPPLIER MODAL */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingSupplier ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}
              </h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingSupplier) {
                  updateSupplier(editingSupplier.id, supplierForm);
                } else {
                  addSupplier(supplierForm);
                }
                setIsSupplierModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Razão Social *</label>
                <input
                  type="text"
                  required
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    value={supplierForm.tradeName}
                    onChange={(e) => setSupplierForm({ ...supplierForm, tradeName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">CNPJ *</label>
                  <input
                    type="text"
                    required
                    value={supplierForm.cnpj}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSupplierForm({ ...supplierForm, cnpj: val });
                      handleCnpjSearch(val, 'supplier');
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Pessoa de Contato</label>
                  <input
                    type="text"
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Telefone *</label>
                  <input
                    type="text"
                    required
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">E-mail Comercial</label>
                <input
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={supplierForm.city}
                    onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={supplierForm.state}
                    onChange={(e) => setSupplierForm({ ...supplierForm, state: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'Editar Produto / Peça' : 'Cadastrar Produto'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const productPayload = {
                  code: productForm.sku,
                  name: productForm.name,
                  category: productForm.category,
                  ncm: productForm.ncm,
                  costPrice: productForm.costPrice,
                  retailPrice: productForm.retailPrice,
                  wholesalePrice: productForm.wholesalePrice,
                  currentStock: productForm.currentStock,
                  minStock: productForm.minStock,
                  unit: productForm.unit,
                  photos: productForm.photos.filter(Boolean),
                  icmsRate: 18,
                  pisRate: 1.65,
                  cofinsRate: 7.6
                };
                if (editingProduct) {
                  updateProduct(editingProduct.id, productPayload);
                } else {
                  addProduct(productPayload);
                }
                setIsProductModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nome do Produto / Equipamento *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Código / SKU *</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">NCM Fiscal</label>
                  <input
                    type="text"
                    value={productForm.ncm}
                    onChange={(e) => setProductForm({ ...productForm, ncm: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Custo Compra (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.costPrice}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Varejo (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.retailPrice}
                    onChange={(e) => setProductForm({ ...productForm, retailPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Atacado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.wholesalePrice}
                    onChange={(e) => setProductForm({ ...productForm, wholesalePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-blue-700"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Estoque Inicial</label>
                  <input
                    type="number"
                    value={productForm.currentStock}
                    onChange={(e) => setProductForm({ ...productForm, currentStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    value={productForm.minStock}
                    onChange={(e) => setProductForm({ ...productForm, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Unidade</label>
                  <input
                    type="text"
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Foto Principal do Produto</label>
                <div className="flex items-center gap-3">
                  <ProductPhotoThumb
                    src={productForm.photos[0]}
                    alt={productForm.name || 'Produto'}
                    className="w-14 h-14 rounded-lg border border-slate-200 bg-white flex items-center justify-center shrink-0 overflow-hidden"
                    iconClassName="w-5 h-5 text-slate-400"
                    emptyLabel="Sem foto"
                  />
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="url"
                      placeholder="Cole a URL da imagem (https://...)"
                      value={productForm.photos[0] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProductForm(prev => ({
                          ...prev,
                          photos: val ? [val, ...prev.photos.slice(1)] : prev.photos.slice(1)
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 cursor-pointer">
                        <span>Carregar arquivo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const base64 = ev.target?.result as string;
                              if (base64) {
                                setProductForm(prev => ({
                                  ...prev,
                                  photos: [base64, ...prev.photos.slice(1)]
                                }));
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      {productForm.photos[0] && (
                        <button
                          type="button"
                          onClick={() => setProductForm(prev => ({ ...prev, photos: prev.photos.slice(1) }))}
                          className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                        >
                          Remover foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMPLOYEE MODAL */}
      {isEmployeeModalOpen && (() => {
        const remCfg = getRemunerationConfig(employeeForm.remunerationType);
        const estimatedPay = remCfg.usesSalary
          ? employeeForm.baseSalary
          : remCfg.usesHourly
            ? employeeForm.hourlyRate * employeeForm.monthlyHoursWorked
            : 0;
        return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingEmployee ? 'Editar Colaborador' : 'Cadastrar Colaborador / Técnico'}
              </h3>
              <button onClick={() => setIsEmployeeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const employeePayload = {
                  name: employeeForm.name,
                  role: employeeForm.role,
                  remunerationType: employeeForm.remunerationType,
                  baseSalary: remCfg.usesSalary ? employeeForm.baseSalary : 0,
                  hourlyRate: remCfg.usesHourly ? employeeForm.hourlyRate : 0,
                  monthlyHoursWorked: remCfg.usesHourly ? employeeForm.monthlyHoursWorked : 0,
                  benefitsCharges: employeeForm.benefitsAndCharges,
                  commissionRate: remCfg.usesCommission ? employeeForm.commissionRate : 0,
                  assignedVehicleId: employeeForm.assignedVehicleId || undefined,
                  phone: employeeForm.phone,
                  email: employeeForm.email,
                  status: employeeForm.status,
                  admissionDate: employeeForm.admissionDate
                };
                if (editingEmployee) {
                  updateEmployee(editingEmployee.id, employeePayload);
                } else {
                  addEmployee(employeePayload);
                }
                setIsEmployeeModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Função / Cargo *</label>
                  <input
                    type="text"
                    required
                    value={employeeForm.role}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Situação</label>
                  <select
                    value={employeeForm.status}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, status: e.target.value as Employee['status'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Em Férias">Em Férias</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Forma de Remuneração *</label>
                  <select
                    value={employeeForm.remunerationType}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, remunerationType: e.target.value as EmployeeRemunerationType })}
                    className="w-full px-3 py-2 border border-blue-200 bg-blue-50/40 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    {REMUNERATION_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Veículo de Campo</label>
                  <select
                    value={employeeForm.assignedVehicleId}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, assignedVehicleId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">Sem veículo atribuído</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {remCfg.usesSalary && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Salário Base (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={employeeForm.baseSalary}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, baseSalary: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                )}
                {remCfg.usesHourly && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Valor Hora (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={employeeForm.hourlyRate}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, hourlyRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Horas / Mês *</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        required
                        value={employeeForm.monthlyHoursWorked}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, monthlyHoursWorked: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Encargos (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={employeeForm.benefitsAndCharges}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, benefitsAndCharges: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                {remCfg.usesCommission && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">% Comissão</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={employeeForm.commissionRate}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, commissionRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-emerald-700 font-bold"
                    />
                  </div>
                )}
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                <span className="text-slate-600">Prévia Custo Fixo Mensal (Folha + Encargos):</span>
                <span className="font-mono font-bold text-slate-900">{formatBRL(estimatedPay + employeeForm.benefitsAndCharges)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Telefone Celular</label>
                  <input
                    type="text"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500"
                >
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
        );
      })()}

      {/* VEHICLE MODAL */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingVehicle ? 'Editar Veículo da Frota' : 'Cadastrar Novo Veículo'}
              </h3>
              <button onClick={() => setIsVehicleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const vehiclePayload = {
                  plate: vehicleForm.plate,
                  model: vehicleForm.model,
                  brand: vehicleForm.brand,
                  year: vehicleForm.year,
                  currentKm: vehicleForm.currentKm,
                  annualIpvaValue: vehicleForm.annualIpvaValue,
                  annualInsuranceValue: vehicleForm.annualInsuranceValue,
                  assignedEmployeeId: vehicleForm.assignedEmployeeId || undefined,
                  status: 'Operacional' as const,
                  nextOilChangeKm: vehicleForm.currentKm + 10000
                };
                if (editingVehicle) {
                  updateVehicle(editingVehicle.id, vehiclePayload);
                } else {
                  addVehicle(vehiclePayload);
                }
                setIsVehicleModalOpen(false);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Placa do Veículo *</label>
                  <input
                    type="text"
                    required
                    placeholder="ABC-1234 ou ABC1D23"
                    value={vehicleForm.plate}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">KM Atual *</label>
                  <input
                    type="number"
                    required
                    value={vehicleForm.currentKm}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, currentKm: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Marca</label>
                  <input
                    type="text"
                    value={vehicleForm.brand}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Ano</label>
                  <input
                    type="number"
                    value={vehicleForm.year}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, year: parseInt(e.target.value) || 2024 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">IPVA Anual (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={vehicleForm.annualIpvaValue}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, annualIpvaValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Seguro Anual (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={vehicleForm.annualInsuranceValue}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, annualInsuranceValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500"
                >
                  Salvar Veículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SERVICE MODAL */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingService ? 'Editar Serviço Tabelado' : 'Cadastrar Serviço'}
              </h3>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingService) {
                  updateServiceCatalogItem(editingService.id, serviceForm);
                } else {
                  addServiceCatalogItem(serviceForm);
                }
                setIsServiceModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Descrição do Serviço / Mão de Obra *</label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Código Interno *</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.code}
                    onChange={(e) => setServiceForm({ ...serviceForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Horas Padrão</label>
                  <input
                    type="number"
                    step="0.5"
                    value={serviceForm.defaultHours}
                    onChange={(e) => setServiceForm({ ...serviceForm, defaultHours: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Preço Padrão (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={serviceForm.standardPrice}
                    onChange={(e) => setServiceForm({ ...serviceForm, standardPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Preço Mínimo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={serviceForm.minPrice}
                    onChange={(e) => setServiceForm({ ...serviceForm, minPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500"
                >
                  Salvar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECKLIST TEMPLATE MODAL */}
      {isChecklistModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingChecklist ? 'Editar Modelo de Checklist' : 'Cadastrar Modelo de Checklist'}
              </h3>
              <button onClick={() => setIsChecklistModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingChecklist) {
                  updateChecklistTemplate(editingChecklist.id, checklistForm);
                } else {
                  addChecklistTemplate(checklistForm);
                }
                setIsChecklistModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Título do Checklist *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Checklist de Inspeção de Reservatório Solar"
                  value={checklistForm.title}
                  onChange={(e) => setChecklistForm({ ...checklistForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tipo de Equipamento / Aplicação *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Boiler, Bomba ou Pressurizador"
                  value={checklistForm.equipmentType}
                  onChange={(e) => setChecklistForm({ ...checklistForm, equipmentType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* Multiple Services Attachment */}
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <span>Anexar aos Serviços do Catálogo (Múltiplos Serviços)</span>
                  </label>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    {checklistForm.serviceIds.length} selecionado(s)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Marque os serviços que utilizam este modelo de checklist. Ao selecionar estes serviços na Ordem de Serviço, o checklist poderá ser anexado automaticamente.
                </p>
                
                {serviceCatalog.length === 0 ? (
                  <div className="text-xs text-slate-500 italic p-2 bg-white rounded border border-slate-200">
                    Nenhum serviço cadastrado no catálogo ainda. Cadastre serviços na aba anterior para vinculá-los.
                  </div>
                ) : (
                  <div className="max-h-36 overflow-y-auto border border-indigo-200/60 rounded-lg p-2 bg-white space-y-1.5">
                    {serviceCatalog.map((service) => {
                      const isSelected = checklistForm.serviceIds.includes(service.id);
                      return (
                        <label
                          key={service.id}
                          className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors text-xs ${
                            isSelected 
                              ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold' 
                              : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setChecklistForm(prev => ({
                                ...prev,
                                serviceIds: isSelected 
                                  ? prev.serviceIds.filter(id => id !== service.id)
                                  : [...prev.serviceIds, service.id]
                              }));
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="flex-1 truncate">{service.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {service.category}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-800">Itens do Checklist de Inspeção</label>
                  <button
                    type="button"
                    onClick={() => {
                      setChecklistForm(prev => ({
                        ...prev,
                        items: [
                          ...prev.items,
                          { id: String(Date.now()), label: '', category: 'Estrutura e Tanque', required: true }
                        ]
                      }));
                    }}
                    className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Item
                  </button>
                </div>

                <div className="space-y-2">
                  {checklistForm.items.map((it, idx) => (
                    <div key={it.id || idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <input
                        type="text"
                        required
                        placeholder="Ex: Teste de vedação nas flanges..."
                        value={it.label}
                        onChange={(e) => {
                          const updated = [...checklistForm.items];
                          updated[idx].label = e.target.value;
                          setChecklistForm({ ...checklistForm, items: updated });
                        }}
                        className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs"
                      />
                      <select
                        value={it.category}
                        onChange={(e) => {
                          const updated = [...checklistForm.items];
                          updated[idx].category = e.target.value as ChecklistItem['category'];
                          setChecklistForm({ ...checklistForm, items: updated });
                        }}
                        className="px-2 py-1.5 border border-slate-200 rounded bg-white text-xs"
                      >
                        <option value="Estrutura e Tanque">Estrutura e Tanque</option>
                        <option value="Elétrica e Comando">Elétrica e Comando</option>
                        <option value="Hidráulica e Pressão">Hidráulica e Pressão</option>
                        <option value="Acessórios e Segurança">Acessórios e Segurança</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          if (checklistForm.items.length > 1) {
                            setChecklistForm(prev => ({
                              ...prev,
                              items: prev.items.filter((_, i) => i !== idx)
                            }));
                          }
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsChecklistModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500"
                >
                  Salvar Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL COMPLETA DE DETALHES DO CADASTRO GERAL (ABERTA PELO BOTÃO +) */}
      {(() => {
        if (!detailTarget) return null;

        if (detailTarget.kind === 'client') {
          const c = detailTarget.data;
          return (
            <RecordDetailModal
              isOpen={true}
              onClose={() => setDetailTarget(null)}
              title={c.name}
              subtitle={c.tradeName ? `Fantasia: ${c.tradeName}` : 'Cliente Cadastrado'}
              statusText={c.customerType === 'atacado' ? 'Atacadista' : 'Varejista'}
              statusClassName={c.customerType === 'atacado' ? 'text-purple-700' : 'text-slate-600'}
              sections={[
                {
                  heading: 'Identificação & Contato',
                  fields: [
                    { label: 'CPF / CNPJ', value: c.document || 'Não informado' },
                    { label: 'Telefone / WhatsApp', value: c.phone || '—' },
                    { label: 'E-mail', value: c.email || '—' },
                    { label: 'Perfil Comercial', value: c.customerType === 'atacado' ? 'Atacado (Libera Preço Atacado)' : 'Varejo' }
                  ]
                },
                {
                  heading: 'Endereço Principal',
                  fields: [
                    { label: 'CEP', value: c.cep || '—' },
                    { label: 'Logradouro', value: `${c.street || ''}${c.number ? `, ${c.number}` : ''}` || '—' },
                    { label: 'Bairro', value: c.neighborhood || '—' },
                    { label: 'Cidade / UF', value: `${c.city || ''}${c.state ? ` / ${c.state}` : ''}` || '—' },
                    ...(c.notes ? [{ label: 'Observações', value: c.notes, fullWidth: true }] : [])
                  ]
                }
              ]}
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingClient(c);
                      setClientForm({
                        customerType: c.customerType || 'varejo',
                        name: c.name,
                        tradeName: c.tradeName || '',
                        document: c.document,
                        email: c.email || '',
                        phone: c.phone,
                        cep: c.cep || '',
                        street: c.street || '',
                        number: c.number || '',
                        neighborhood: c.neighborhood || '',
                        city: c.city || '',
                        state: c.state || '',
                        notes: c.notes || ''
                      });
                      setDetailTarget(null);
                      setIsClientModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Deseja remover o cliente "${c.name}"?`)) {
                        deleteClient(c.id);
                        setDetailTarget(null);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                </>
              }
            />
          );
        }

        if (detailTarget.kind === 'supplier') {
          const s = detailTarget.data;
          return (
            <RecordDetailModal
              isOpen={true}
              onClose={() => setDetailTarget(null)}
              title={s.name}
              subtitle={s.tradeName ? `Fantasia: ${s.tradeName}` : 'Fornecedor Cadastrado'}
              sections={[
                {
                  heading: 'Dados Fiscais & Contato',
                  fields: [
                    { label: 'CNPJ', value: s.cnpj || '—' },
                    { label: 'Pessoa de Contato', value: s.contactPerson || '—' },
                    { label: 'Telefone', value: s.phone || '—' },
                    { label: 'E-mail Comercial', value: s.email || '—' }
                  ]
                },
                {
                  heading: 'Endereço',
                  fields: [
                    { label: 'CEP', value: s.cep || '—' },
                    { label: 'Logradouro', value: `${s.street || ''}${s.number ? `, ${s.number}` : ''}` || '—' },
                    { label: 'Cidade / UF', value: `${s.city || ''}${s.state ? ` / ${s.state}` : ''}` || '—' }
                  ]
                }
              ]}
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSupplier(s);
                      setSupplierForm({
                        name: s.name,
                        tradeName: s.tradeName || '',
                        cnpj: s.cnpj,
                        email: s.email || '',
                        phone: s.phone || '',
                        contactPerson: s.contactPerson || '',
                        cep: s.cep || '01001-000',
                        street: s.street || 'Rua Principal',
                        number: s.number || '100',
                        city: s.city || '',
                        state: s.state || ''
                      });
                      setDetailTarget(null);
                      setIsSupplierModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar Fornecedor
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Deseja remover o fornecedor "${s.name}"?`)) {
                        deleteSupplier(s.id);
                        setDetailTarget(null);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                </>
              }
            />
          );
        }

        if (detailTarget.kind === 'product') {
          const p = detailTarget.data;
          return (
            <RecordDetailModal
              isOpen={true}
              onClose={() => setDetailTarget(null)}
              title={p.name}
              subtitle={`Categoria: ${p.category} · Código ${p.code || p.sku}`}
              statusText={p.currentStock <= p.minStock ? 'Estoque Baixo' : 'Em Estoque'}
              statusClassName={p.currentStock <= p.minStock ? 'text-amber-700' : 'text-emerald-700'}
              sections={[
                {
                  heading: 'Codificação & Fiscal',
                  fields: [
                    { label: 'Código / SKU', value: p.code || p.sku || '—' },
                    { label: 'NCM', value: p.ncm || 'N/A' },
                    { label: 'Unidade', value: p.unit },
                    { label: 'Categoria', value: p.category }
                  ]
                },
                {
                  heading: 'Preços, Margens & Estoque',
                  fields: [
                    { label: 'Custo Compra', value: formatBRL(p.costPrice) },
                    { label: 'Preço Varejo', value: formatBRL(p.retailPrice) },
                    { label: 'Preço Atacado', value: formatBRL(p.wholesalePrice) },
                    { label: 'Estoque Atual / Mínimo', value: `${p.currentStock} ${p.unit} (mín. ${p.minStock})` }
                  ]
                }
              ]}
              customContent={
                p.photos && p.photos.length > 0 ? (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Fotos do Produto
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {p.photos.map((photo, idx) => (
                        <ProductPhotoThumb
                          key={idx}
                          src={photo}
                          alt={`${p.name} ${idx + 1}`}
                          className="w-20 h-20 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden"
                        />
                      ))}
                    </div>
                  </div>
                ) : undefined
              }
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({
                        name: `${p.name} (Cópia)`,
                        sku: `${p.sku || p.code}-COP`,
                        category: p.category,
                        ncm: p.ncm || '',
                        costPrice: p.costPrice,
                        retailPrice: p.retailPrice,
                        wholesalePrice: p.wholesalePrice,
                        currentStock: 0,
                        minStock: p.minStock,
                        unit: p.unit,
                        photos: p.photos ? [...p.photos] : []
                      });
                      setDetailTarget(null);
                      setIsProductModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Duplicar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(p);
                      setProductForm({
                        name: p.name,
                        sku: p.sku || p.code,
                        category: p.category,
                        ncm: p.ncm || '',
                        costPrice: p.costPrice,
                        retailPrice: p.retailPrice,
                        wholesalePrice: p.wholesalePrice,
                        currentStock: p.currentStock,
                        minStock: p.minStock,
                        unit: p.unit,
                        photos: p.photos ? [...p.photos] : []
                      });
                      setDetailTarget(null);
                      setIsProductModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar Produto
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Deseja remover o produto "${p.name}"?`)) {
                        deleteProduct(p.id);
                        setDetailTarget(null);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                </>
              }
            />
          );
        }

        if (detailTarget.kind === 'employee') {
          const e = detailTarget.data;
          const assignedVeh = vehicles.find(v => v.id === e.assignedVehicleId);
          const remType = getEmployeeRemunerationType(e);
          const nominalPay = computeEmployeeNominalPay(e);
          const totalMonthlyCost = computeEmployeeMonthlyFixedCost(e);
          return (
            <RecordDetailModal
              isOpen={true}
              onClose={() => setDetailTarget(null)}
              title={e.name}
              subtitle={`${e.role} · ${REMUNERATION_TYPE_LABELS[remType]}`}
              statusText={e.status}
              statusClassName={e.status === 'Ativo' ? 'text-emerald-700' : 'text-slate-600'}
              sections={[
                {
                  heading: 'Contato & Admissão',
                  fields: [
                    { label: 'Cargo / Função', value: e.role },
                    { label: 'Telefone', value: e.phone || '—' },
                    { label: 'E-mail', value: e.email || '—' },
                    { label: 'Data de Admissão', value: e.admissionDate ? formatDateBR(e.admissionDate) : 'N/A' },
                    { label: 'Veículo Vinculado', value: assignedVeh ? `${assignedVeh.model} (${assignedVeh.plate})` : 'Nenhum' }
                  ]
                },
                {
                  heading: 'Remuneração & Custos',
                  fields: [
                    { label: 'Forma de Remuneração', value: REMUNERATION_TYPE_LABELS[remType] },
                    { label: 'Resumo Base / Hora', value: formatEmployeeRemunerationSummary(e, formatBRL) },
                    { label: 'Remuneração Nominal Mensal', value: formatBRL(nominalPay) },
                    { label: 'Encargos & Benefícios', value: formatBRL(e.benefitsCharges) },
                    { label: 'Custo Total Mensal', value: formatBRL(totalMonthlyCost) },
                    { label: 'Taxa de Comissão', value: `${e.commissionRate}%` }
                  ]
                }
              ]}
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEmployee(e);
                      setEmployeeForm({
                        name: e.name,
                        role: e.role,
                        remunerationType: getEmployeeRemunerationType(e),
                        baseSalary: e.baseSalary,
                        hourlyRate: e.hourlyRate || 35,
                        monthlyHoursWorked: e.monthlyHoursWorked || 160,
                        benefitsAndCharges: e.benefitsCharges,
                        commissionRate: e.commissionRate,
                        assignedVehicleId: e.assignedVehicleId || '',
                        phone: e.phone,
                        email: e.email,
                        status: e.status,
                        admissionDate: e.admissionDate
                      });
                      setDetailTarget(null);
                      setIsEmployeeModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar Colaborador
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Deseja remover o funcionário "${e.name}"?`)) {
                        deleteEmployee(e.id);
                        setDetailTarget(null);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                </>
              }
            />
          );
        }

        if (detailTarget.kind === 'vehicle') {
          const v = detailTarget.data;
          const assignedEmp = employees.find(emp => emp.id === v.assignedEmployeeId);
          return (
            <RecordDetailModal
              isOpen={true}
              onClose={() => setDetailTarget(null)}
              title={`${v.plate} — ${v.model}`}
              subtitle={`${v.brand || 'Veículo da Frota'} (${v.year})`}
              statusText={v.status}
              statusClassName="text-emerald-700"
              sections={[
                {
                  heading: 'Especificações & Rodagem',
                  fields: [
                    { label: 'Placa', value: v.plate },
                    { label: 'Modelo / Marca', value: `${v.model} ${v.brand ? `· ${v.brand}` : ''}` },
                    { label: 'Ano', value: String(v.year) },
                    { label: 'KM Atual', value: `${v.currentKm.toLocaleString()} km` },
                    { label: 'Próxima Troca de Óleo', value: v.nextOilChangeKm ? `${v.nextOilChangeKm.toLocaleString()} km` : '—' },
                    { label: 'Motorista Vinculado', value: assignedEmp ? assignedEmp.name : 'Disponível no pátio' }
                  ]
                },
                {
                  heading: 'Custos Fixos Anuais',
                  fields: [
                    { label: 'IPVA Anual', value: formatBRL(v.annualIpvaValue) },
                    { label: 'Seguro Anual', value: formatBRL(v.annualInsuranceValue) }
                  ]
                }
              ]}
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingVehicle(v);
                      setVehicleForm({
                        plate: v.plate,
                        model: v.model,
                        brand: v.brand || '',
                        year: v.year,
                        currentKm: v.currentKm,
                        annualIpvaValue: v.annualIpvaValue,
                        annualInsuranceValue: v.annualInsuranceValue,
                        assignedEmployeeId: v.assignedEmployeeId || ''
                      });
                      setDetailTarget(null);
                      setIsVehicleModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar Veículo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Deseja remover o veículo "${v.plate}"?`)) {
                        deleteVehicle(v.id);
                        setDetailTarget(null);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                </>
              }
            />
          );
        }

        if (detailTarget.kind === 'checklist') {
          const tpl = detailTarget.data;
          const linkedServices = (tpl.serviceIds || [])
            .map(id => serviceCatalog.find(s => s.id === id)?.name)
            .filter(Boolean) as string[];
          return (
            <RecordDetailModal
              isOpen={true}
              onClose={() => setDetailTarget(null)}
              title={tpl.title}
              subtitle={`Equipamento: ${tpl.equipmentType} · ${tpl.items.length} itens de inspeção`}
              statusText="Ativo"
              statusClassName="text-emerald-700"
              sections={[
                {
                  heading: 'Configuração do Checklist',
                  fields: [
                    { label: 'Tipo de Equipamento', value: tpl.equipmentType },
                    { label: 'Total de Etapas', value: `${tpl.items.length} itens` },
                    ...(linkedServices.length > 0
                      ? [{ label: 'Serviços Vinculados', value: linkedServices.join(', '), fullWidth: true }]
                      : [])
                  ]
                },
                {
                  heading: 'Itens de Inspeção',
                  fields: tpl.items.map((it, idx) => ({
                    label: `${idx + 1}. ${it.category}${it.required ? ' (Obrigatório)' : ''}`,
                    value: it.label,
                    fullWidth: true
                  }))
                }
              ]}
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingChecklist(tpl);
                      setChecklistForm({
                        title: tpl.title,
                        equipmentType: tpl.equipmentType,
                        serviceIds: tpl.serviceIds || [],
                        items: [...tpl.items]
                      });
                      setDetailTarget(null);
                      setIsChecklistModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar Checklist
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Deseja remover o modelo "${tpl.title}"?`)) {
                        deleteChecklistTemplate(tpl.id);
                        setDetailTarget(null);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                </>
              }
            />
          );
        }

        const sv = detailTarget.data;
        return (
          <RecordDetailModal
            isOpen={true}
            onClose={() => setDetailTarget(null)}
            title={sv.name}
            subtitle={`Código ${sv.code} · ${sv.category}`}
            sections={[
              {
                heading: 'Detalhes do Serviço Tabelado',
                fields: [
                  { label: 'Código Interno', value: sv.code },
                  { label: 'Categoria', value: sv.category },
                  { label: 'Tempo Padrão Estimado', value: `${sv.defaultHours} h` },
                  { label: 'Preço Padrão', value: formatBRL(sv.standardPrice) },
                  { label: 'Preço Mínimo Permitido', value: formatBRL(sv.minPrice) }
                ]
              }
            ]}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditingService(sv);
                    setServiceForm({
                      code: sv.code,
                      name: sv.name,
                      category: sv.category,
                      defaultHours: sv.defaultHours,
                      standardPrice: sv.standardPrice,
                      minPrice: sv.minPrice
                    });
                    setDetailTarget(null);
                    setIsServiceModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar Serviço
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Deseja remover o serviço "${sv.name}"?`)) {
                      deleteServiceCatalogItem(sv.id);
                      setDetailTarget(null);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </>
            }
          />
        );
      })()}

      {tooltipElement}
    </div>
  );
};
