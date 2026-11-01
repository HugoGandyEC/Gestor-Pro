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
  X
} from 'lucide-react';
import { useApp, formatBRL } from '../context/AppContext';
import { 
  Client, 
  Supplier, 
  Product, 
  Employee, 
  Vehicle, 
  ServiceCatalogItem, 
  ChecklistTemplate,
  ChecklistItem
} from '../types';

type RegistrationTab = 
  | 'clients' 
  | 'suppliers' 
  | 'products' 
  | 'employees' 
  | 'fleet' 
  | 'services' 
  | 'checklists';

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
    lookupCep, 
    lookupCnpj 
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<RegistrationTab>('clients');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Client form state
  const [clientForm, setClientForm] = useState({
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
    unit: 'UN'
  });

  // Employee form state
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    role: 'Técnico Hidráulico Sênior',
    baseSalary: 3800,
    benefitsAndCharges: 1900,
    commissionRate: 5,
    assignedVehicleId: '',
    phone: '',
    email: '',
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
    items: { id: string; label: string; category: ChecklistItem['category']; required: boolean }[];
  }>({
    title: '',
    equipmentType: '',
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
    { id: 'products', label: 'Produtos & Peças', icon: Package, count: products.length },
    { id: 'employees', label: 'Equipe & Técnicos', icon: UserCheck, count: employees.length },
    { id: 'fleet', label: 'Frota de Veículos', icon: Truck, count: vehicles.length },
    { id: 'services', label: 'Serviços Tabelados', icon: Wrench, count: serviceCatalog.length },
    { id: 'checklists', label: 'Modelos de Checklist', icon: CheckSquare, count: checklistTemplates.length }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Central Unificada de Cadastros
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Cadastro Geral do Sistema</h1>
          <p className="text-sm text-slate-300 mt-1">
            Gerencie todas as entidades essenciais do ERP em uma interface centralizada e integrada.
          </p>
        </div>

        {/* Quick Action Button */}
        <div>
          {activeSubTab === 'clients' && (
            <button
              onClick={() => {
                setEditingClient(null);
                setClientForm({
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
                  ncm: '8419.19.10', costPrice: 0, retailPrice: 0, wholesalePrice: 0, currentStock: 10, minStock: 2, unit: 'UN'
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
                  name: '', role: 'Técnico Especialista', baseSalary: 3800, benefitsAndCharges: 1900,
                  commissionRate: 5, assignedVehicleId: '', phone: '', email: '', admissionDate: new Date().toISOString().split('T')[0]
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
                  title: '', equipmentType: 'Aquecedor / Boiler',
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

      {/* Navigation Sub-Tabs Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex flex-wrap gap-1 shadow-xs">
        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as RegistrationTab);
                setSearchTerm('');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={`Filtrar ${tabsConfig.find(t => t.id === activeSubTab)?.label.toLowerCase()} por nome, código ou documento...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500 hidden sm:block">
          Mostrando registros atualizados do banco de dados
        </div>
      </div>

      {/* SUB-TAB 1: CLIENTES */}
      {activeSubTab === 'clients' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Nome / Razão Social</th>
                  <th className="p-3">CPF / CNPJ</th>
                  <th className="p-3">Contato</th>
                  <th className="p-3">Localização</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients
                  .filter(c => 
                    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    c.document.includes(searchTerm) ||
                    (c.tradeName && c.tradeName.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map(client => (
                    <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{client.name}</div>
                        {client.tradeName && (
                          <div className="text-[11px] text-slate-500">{client.tradeName}</div>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-700">{client.document}</td>
                      <td className="p-3 text-slate-600">
                        <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> {client.phone}</div>
                        {client.email && (
                          <div className="flex items-center gap-1.5 text-slate-500 mt-0.5"><Mail className="w-3 h-3 text-slate-400" /> {client.email}</div>
                        )}
                      </td>
                      <td className="p-3 text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{client.city} - {client.state}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{client.street}, {client.number}</div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingClient(client);
                              setClientForm({
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
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja remover o cliente "${client.name}"?`)) {
                                deleteClient(client.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
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
      )}

      {/* SUB-TAB 2: FORNECEDORES */}
      {activeSubTab === 'suppliers' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Razão Social / Nome Fantasia</th>
                  <th className="p-3">CNPJ</th>
                  <th className="p-3">Contato / Responsável</th>
                  <th className="p-3">Cidade / UF</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers
                  .filter(s => 
                    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    s.cnpj.includes(searchTerm) ||
                    (s.tradeName && s.tradeName.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map(supplier => (
                    <tr key={supplier.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{supplier.name}</div>
                        {supplier.tradeName && (
                          <div className="text-[11px] text-slate-500">{supplier.tradeName}</div>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-700">{supplier.cnpj}</td>
                      <td className="p-3 text-slate-600">
                        {supplier.contactPerson && (
                          <div className="font-medium text-slate-800">{supplier.contactPerson}</div>
                        )}
                        <div className="text-[11px] text-slate-500">{supplier.phone} · {supplier.email}</div>
                      </td>
                      <td className="p-3 text-slate-600">{supplier.city} - {supplier.state}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
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
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja remover o fornecedor "${supplier.name}"?`)) {
                                deleteSupplier(supplier.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
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
      )}

      {/* SUB-TAB 3: PRODUTOS & PEÇAS */}
      {activeSubTab === 'products' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Código / Produto</th>
                  <th className="p-3">Categoria & NCM</th>
                  <th className="p-3 text-right">Custo Médio</th>
                  <th className="p-3 text-right">Preço Varejo</th>
                  <th className="p-3 text-right">Preço Atacado</th>
                  <th className="p-3 text-center">Estoque Atual</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products
                  .filter(p => 
                    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map(product => {
                    const isLow = product.currentStock <= product.minStock;
                    return (
                      <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{product.name}</div>
                          <div className="text-[11px] font-mono text-slate-500">{product.code || product.sku}</div>
                        </td>
                        <td className="p-3 text-slate-600">
                          <div>{product.category}</div>
                          <div className="text-[10px] text-slate-400 font-mono">NCM: {product.ncm || 'N/A'}</div>
                        </td>
                        <td className="p-3 text-right font-mono text-slate-600">{formatBRL(product.costPrice)}</td>
                        <td className="p-3 text-right font-mono font-semibold text-emerald-700">{formatBRL(product.retailPrice)}</td>
                        <td className="p-3 text-right font-mono text-blue-700">{formatBRL(product.wholesalePrice)}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                            isLow ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {product.currentStock} {product.unit}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingProduct(null); // Cria como novo item clonado
                                setProductForm({
                                  name: `${product.name} (Cópia)`,
                                  sku: `${product.sku || product.code}-COP`,
                                  category: product.category,
                                  ncm: product.ncm || '',
                                  costPrice: product.costPrice,
                                  retailPrice: product.retailPrice,
                                  wholesalePrice: product.wholesalePrice,
                                  currentStock: 0,
                                  minStock: product.minStock,
                                  unit: product.unit
                                });
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                              title="Duplicar Produto"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
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
                                  unit: product.unit
                                });
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="Editar Produto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja remover o produto "${product.name}"?`)) {
                                  deleteProduct(product.id);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
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
      )}

      {/* SUB-TAB 4: EQUIPE & TÉCNICOS */}
      {activeSubTab === 'employees' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Colaborador / Cargo</th>
                  <th className="p-3">Contato</th>
                  <th className="p-3 text-right">Salário Base</th>
                  <th className="p-3 text-right">Encargos Sociais</th>
                  <th className="p-3 text-center">Comissão</th>
                  <th className="p-3">Veículo Vinculado</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees
                  .filter(e => 
                    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    e.role.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(employee => {
                    const assignedVeh = vehicles.find(v => v.id === employee.assignedVehicleId);
                    return (
                      <tr key={employee.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{employee.name}</div>
                          <div className="text-[11px] text-blue-600 font-medium">{employee.role}</div>
                        </td>
                        <td className="p-3 text-slate-600">
                          <div>{employee.phone}</div>
                          <div className="text-[11px] text-slate-400">{employee.email}</div>
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-slate-700">{formatBRL(employee.baseSalary)}</td>
                        <td className="p-3 text-right font-mono text-slate-500">{formatBRL(employee.benefitsCharges)}</td>
                        <td className="p-3 text-center font-mono font-semibold text-emerald-700">{employee.commissionRate}%</td>
                        <td className="p-3 text-slate-600">
                          {assignedVeh ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                              <Truck className="w-3 h-3 text-slate-500" /> {assignedVeh.plate} ({assignedVeh.model})
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Nenhum</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingEmployee(employee);
                                setEmployeeForm({
                                  name: employee.name,
                                  role: employee.role,
                                  baseSalary: employee.baseSalary,
                                  benefitsAndCharges: employee.benefitsCharges,
                                  commissionRate: employee.commissionRate,
                                  assignedVehicleId: employee.assignedVehicleId || '',
                                  phone: employee.phone,
                                  email: employee.email,
                                  admissionDate: employee.admissionDate
                                });
                                setIsEmployeeModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja remover o funcionário "${employee.name}"?`)) {
                                  deleteEmployee(employee.id);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
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
      )}

      {/* SUB-TAB 5: FROTA DE VEÍCULOS */}
      {activeSubTab === 'fleet' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Placa & Modelo</th>
                  <th className="p-3">Ano / Marca</th>
                  <th className="p-3 text-center">KM Atual</th>
                  <th className="p-3 text-right">IPVA Anual</th>
                  <th className="p-3 text-right">Seguro Anual</th>
                  <th className="p-3">Motorista Vinculado</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles
                  .filter(v => 
                    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    v.model.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(vehicle => {
                    const assignedEmp = employees.find(e => e.id === vehicle.assignedEmployeeId);
                    return (
                      <tr key={vehicle.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900 font-mono tracking-wide">{vehicle.plate}</div>
                          <div className="text-[11px] text-slate-600">{vehicle.model}</div>
                        </td>
                        <td className="p-3 text-slate-600">{vehicle.brand} ({vehicle.year})</td>
                        <td className="p-3 text-center font-mono font-semibold text-slate-700">{vehicle.currentKm.toLocaleString()} km</td>
                        <td className="p-3 text-right font-mono text-slate-600">{formatBRL(vehicle.annualIpvaValue)}</td>
                        <td className="p-3 text-right font-mono text-slate-600">{formatBRL(vehicle.annualInsuranceValue)}</td>
                        <td className="p-3 text-slate-600">
                          {assignedEmp ? (
                            <span className="font-medium text-slate-800">{assignedEmp.name}</span>
                          ) : (
                            <span className="text-slate-400 italic">Disponível no pátio</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
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
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja remover o veículo "${vehicle.plate}"?`)) {
                                  deleteVehicle(vehicle.id);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
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
      )}

      {/* SUB-TAB 6: SERVIÇOS TABELADOS */}
      {activeSubTab === 'services' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Código & Descrição do Serviço</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3 text-center">Tempo Estimado</th>
                  <th className="p-3 text-right">Preço Padrão</th>
                  <th className="p-3 text-right">Preço Mínimo</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serviceCatalog
                  .filter(s => 
                    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    s.code.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(service => (
                    <tr key={service.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{service.name}</div>
                        <div className="text-[10px] font-mono text-slate-500">{service.code}</div>
                      </td>
                      <td className="p-3 text-slate-600">{service.category}</td>
                      <td className="p-3 text-center font-mono text-slate-700">{service.defaultHours} h</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700">{formatBRL(service.standardPrice)}</td>
                      <td className="p-3 text-right font-mono text-slate-500">{formatBRL(service.minPrice)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
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
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja remover o serviço "${service.name}"?`)) {
                                deleteServiceCatalogItem(service.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
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
      )}

      {/* SUB-TAB 7: MODELOS DE CHECKLIST */}
      {activeSubTab === 'checklists' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checklistTemplates
            .filter(t => 
              t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
              t.equipmentType.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map(template => (
              <div key={template.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {template.equipmentType}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingChecklist(template);
                          setChecklistForm({
                            title: template.title,
                            equipmentType: template.equipmentType,
                            items: [...template.items]
                          });
                          setIsChecklistModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja remover o modelo "${template.title}"?`)) {
                            deleteChecklistTemplate(template.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
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
                    <label className="text-xs font-medium text-slate-700">CPF / CNPJ *</label>
                    <span className="text-[10px] text-blue-600">Busca auto na Receita</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0000-00"
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
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
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
                  baseSalary: employeeForm.baseSalary,
                  benefitsCharges: employeeForm.benefitsAndCharges,
                  commissionRate: employeeForm.commissionRate,
                  assignedVehicleId: employeeForm.assignedVehicleId || undefined,
                  phone: employeeForm.phone,
                  email: employeeForm.email,
                  status: 'Ativo' as const,
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
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Salário Base (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={employeeForm.baseSalary}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, baseSalary: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Encargos (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={employeeForm.benefitsAndCharges}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, benefitsAndCharges: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">% Comissão</label>
                  <input
                    type="number"
                    step="0.5"
                    value={employeeForm.commissionRate}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, commissionRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-emerald-700 font-bold"
                  />
                </div>
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
      )}

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
    </div>
  );
};
