import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  TrendingUp, 
  Truck, 
  Building,
  Building2, 
  Calculator, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package, 
  UserSquare2, 
  UserCheck, 
  FileSpreadsheet, 
  Settings,
  FolderOpen,
  CreditCard,
  HardDrive,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Calendar
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SYSTEM_VERSION } from '../constants/version';

export type ActiveTab = 
  | 'dashboard' 
  | 'agenda'
  | 'orders' 
  | 'sales' 
  | 'products'
  | 'clients'
  | 'suppliers'
  | 'customerPortal'
  | 'accounting'
  | 'profitability' 
  | 'fleet' 
  | 'operational' 
  | 'initialCosts' 
  | 'financial' 
  | 'employees'
  | 'cadastros'
  | 'cardOperators'
  | 'googleDrive'
  | 'configuracoes'
  | 'documentation';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem('gestaopro_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('gestaopro_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const { 
    serviceOrders, 
    currentRole, 
    products, 
    customerTickets,
    clients,
    suppliers,
    employees,
    vehicles,
    serviceCatalog,
    checklistTemplates,
    currentUser,
    appointments,
    logout,
    openLogoutModal
  } = useApp();

  // Collapsible Submenu Categories state
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('gestaopro_sidebar_collapsed_cats');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev: Record<string, boolean>) => {
      const next = { ...prev, [cat]: !prev[cat] };
      try {
        localStorage.setItem('gestaopro_sidebar_collapsed_cats', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const openOrdersCount = serviceOrders.filter(
    o => o.status === 'orcamento_aberto' || o.status === 'aguardando_aprovacao' || o.status === 'aprovada_em_andamento' || o.status === 'aguardando_pecas'
  ).length;

  const lowStockCount = products.filter(p => p.currentStock <= p.minStock).length;
  const openTicketsCount = customerTickets.filter(t => t.status === 'aberto' || t.status === 'em_analise').length;
  const totalRegistrationsCount = clients.length + suppliers.length + products.length + employees.length + vehicles.length + serviceCatalog.length + checklistTemplates.length;

  // Simplified and Clean Categorized Navigation Structure
  const navigationCategories = [
    {
      category: 'OPERAÇÕES',
      items: [
        {
          id: 'dashboard' as ActiveTab,
          label: 'Visão Geral',
          icon: LayoutDashboard,
          badge: null,
          roles: ['admin', 'colaborador', 'tecnico', 'contador']
        },
        {
          id: 'agenda' as ActiveTab,
          label: 'Google Agenda',
          icon: Calendar,
          badge: appointments.length > 0 ? `${appointments.length}` : null,
          highlight: true,
          roles: ['admin', 'colaborador', 'tecnico']
        },
        {
          id: 'orders' as ActiveTab,
          label: 'Ordens de Serviço',
          icon: ClipboardList,
          badge: openOrdersCount > 0 ? `${openOrdersCount}` : null,
          roles: ['admin', 'colaborador', 'tecnico']
        },
        {
          id: 'sales' as ActiveTab,
          label: 'Vendas',
          icon: ShoppingBag,
          badge: null,
          roles: ['admin', 'colaborador']
        },
        {
          id: 'customerPortal' as ActiveTab,
          label: 'Portal do Cliente',
          icon: UserCheck,
          badge: openTicketsCount > 0 ? `${openTicketsCount}` : null,
          highlight: true,
          roles: ['admin', 'colaborador', 'cliente']
        }
      ]
    },
    {
      category: 'FINANCEIRO',
      items: [
        {
          id: 'financial' as ActiveTab,
          label: 'Financeiro & DRE',
          icon: DollarSign,
          badge: null,
          roles: ['admin', 'colaborador', 'contador']
        },
        {
          id: 'profitability' as ActiveTab,
          label: 'Lucratividade',
          icon: TrendingUp,
          badge: null,
          highlight: true,
          roles: ['admin', 'colaborador', 'contador']
        },
        {
          id: 'accounting' as ActiveTab,
          label: 'Fechamento Fiscal',
          icon: FileSpreadsheet,
          badge: 'PDF',
          roles: ['admin', 'contador']
        },
        {
          id: 'operational' as ActiveTab,
          label: 'Custos Fixos',
          icon: Building2,
          badge: null,
          roles: ['admin', 'contador', 'colaborador']
        },
        {
          id: 'fleet' as ActiveTab,
          label: 'Frota & Veículos',
          icon: Truck,
          badge: null,
          roles: ['admin', 'tecnico', 'colaborador']
        },
        {
          id: 'initialCosts' as ActiveTab,
          label: 'Custos Iniciais',
          icon: Calculator,
          badge: null,
          roles: ['admin', 'contador']
        }
      ]
    },
    {
      category: 'CADASTROS',
      items: [
        {
          id: 'cadastros' as ActiveTab,
          label: 'Central Cadastros',
          icon: FolderOpen,
          badge: `${totalRegistrationsCount}`,
          highlight: true,
          roles: ['admin', 'colaborador']
        },
        {
          id: 'cardOperators' as ActiveTab,
          label: 'Operadoras de Cartão',
          icon: CreditCard,
          badge: 'Taxas',
          roles: ['admin', 'colaborador', 'contador']
        },
        {
          id: 'products' as ActiveTab,
          label: 'Produtos & Estoque',
          icon: Package,
          badge: lowStockCount > 0 ? `${lowStockCount} baixo` : null,
          roles: ['admin', 'colaborador', 'tecnico']
        },
        {
          id: 'clients' as ActiveTab,
          label: 'Clientes',
          icon: UserSquare2,
          badge: `${clients.length}`,
          roles: ['admin', 'colaborador']
        },
        {
          id: 'suppliers' as ActiveTab,
          label: 'Fornecedores',
          icon: Building,
          badge: `${suppliers.length}`,
          roles: ['admin', 'colaborador']
        },
        {
          id: 'employees' as ActiveTab,
          label: 'Funcionários',
          icon: Users,
          badge: null,
          roles: ['admin', 'contador']
        }
      ]
    },
    {
      category: 'SISTEMA',
      items: [
        {
          id: 'googleDrive' as ActiveTab,
          label: 'Google Drive',
          icon: HardDrive,
          badge: 'Nuvem',
          highlight: true,
          roles: ['admin', 'colaborador', 'contador']
        },
        {
          id: 'configuracoes' as ActiveTab,
          label: 'Configurações',
          icon: Settings,
          badge: null,
          roles: ['admin']
        },
        {
          id: 'documentation' as ActiveTab,
          label: 'Ajuda & Manual',
          icon: BookOpen,
          badge: 'Guia',
          highlight: true,
          roles: ['admin', 'colaborador', 'tecnico', 'contador', 'cliente']
        }
      ]
    }
  ];

  const handleSelectTab = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  // On mobile drawer, always display the full expanded sidebar so user on mobile has complete labels and menus
  const isEffectiveCollapsed = isCollapsed && !isMobileOpen;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel (Collapsible drawer on mobile, docked & collapsible on desktop) */}
      <aside 
        className={`no-print fixed inset-y-0 left-0 z-50 bg-[#2b2c2e] text-[#d8d8d8] border-r border-[#3d3f42] flex flex-col transition-all duration-300 ease-in-out lg:static lg:translate-x-0 min-h-screen lg:min-h-[calc(100vh-4rem)] ${
          isMobileOpen 
            ? 'translate-x-0 shadow-2xl w-72 max-w-[85vw]' 
            : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-16 xl:w-20' : 'lg:w-60 xl:w-64'}`}
      >
        {/* Top Header of Sidebar */}
        <div className={`p-3 border-b border-[#3d3f42] flex items-center ${isEffectiveCollapsed ? 'lg:justify-center' : 'justify-between'}`}>
          {!isEffectiveCollapsed && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#c2bfb0] uppercase tracking-wider">
                Navegação
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase bg-[#383a3d] text-[#c2bfb0] border border-[#484a4e]">
                {currentRole}
              </span>
            </div>
          )}

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-[#c2bfb0] hover:text-white hover:bg-[#383a3d] transition-colors cursor-pointer"
            title={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
            aria-label={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Close button for mobile drawer */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-[#d8d8d8] hover:text-white hover:bg-[#383a3d] transition-colors cursor-pointer"
            title="Fechar menu"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Categories and Items */}
        <nav className={`p-2 space-y-3 flex-1 overflow-y-auto ${isEffectiveCollapsed ? 'px-1.5' : 'p-3'}`}>
          {navigationCategories.map((group) => {
            const visibleItems = group.items.filter(item => 
              item.roles.includes(currentRole) || 
              (currentRole === 'vendedor' && (item.roles.includes('colaborador') || item.id === 'sales' || item.id === 'products' || item.id === 'clients'))
            );
            if (visibleItems.length === 0) return null;

            const isCategoryCollapsed = Boolean(collapsedCategories[group.category]);
            const hasActiveItem = visibleItems.some(it => it.id === activeTab);

            return (
              <div key={group.category} className="space-y-1">
                {isEffectiveCollapsed ? (
                  <div className="my-1.5 border-t border-[#3d3f42]/70 mx-1" title={group.category} />
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleCategory(group.category)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-bold text-[#c2bfb0] hover:text-white uppercase tracking-wider rounded hover:bg-[#383a3d]/60 transition-colors cursor-pointer group select-none"
                    title={isCategoryCollapsed ? `Expandir submenus de ${group.category}` : `Ocultar submenus de ${group.category}`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{group.category}</span>
                      {isCategoryCollapsed && hasActiveItem && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f2e6d8]" title="Menu ativo nesta categoria" />
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#383a3d] text-[#a0a2a6] group-hover:text-white">
                        {visibleItems.length}
                      </span>
                      {isCategoryCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-[#a0a2a6] group-hover:text-white transition-transform" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-[#a0a2a6] group-hover:text-white transition-transform" />
                      )}
                    </div>
                  </button>
                )}

                {(!isCategoryCollapsed || isEffectiveCollapsed) && (
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      const itemTitle = `${item.label}${item.badge ? ` (${item.badge})` : ''}`;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectTab(item.id)}
                          title={isEffectiveCollapsed ? itemTitle : undefined}
                          className={`w-full flex items-center ${
                            isEffectiveCollapsed ? 'justify-center py-2.5 px-0' : 'justify-between px-3 py-2'
                          } rounded-lg text-xs font-medium transition-all cursor-pointer relative group ${
                            isActive
                              ? 'bg-[#53383e] text-white shadow-sm font-semibold'
                              : 'text-[#d8d8d8] hover:text-white hover:bg-[#383a3d]'
                          } ${item.highlight && !isActive ? 'text-[#c2bfb0]' : ''}`}
                        >
                          <div className={`flex items-center ${isEffectiveCollapsed ? 'justify-center' : 'gap-2.5 truncate'}`}>
                            <div className="relative">
                              <Icon className={`${isEffectiveCollapsed ? 'w-5 h-5' : 'w-4 h-4'} shrink-0 ${isActive ? 'text-white' : 'text-[#a0a2a6] group-hover:text-white'}`} />
                              {isEffectiveCollapsed && item.badge && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#53383e] border border-white" />
                              )}
                            </div>
                            {!isEffectiveCollapsed && (
                              <span className="truncate">{item.label}</span>
                            )}
                          </div>

                          {!isEffectiveCollapsed && item.badge && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap ml-1 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : item.highlight
                                ? 'bg-[#c2bfb0]/20 text-[#c2bfb0] border border-[#c2bfb0]/30'
                                : 'bg-[#383a3d] text-[#c2bfb0] border border-[#484a4e]'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer User Box & Logout */}
        {isEffectiveCollapsed ? (
          <div className="p-2 border-t border-[#3d3f42] flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={openLogoutModal}
              title="Sair do sistema (Logout)"
              className="p-2 text-rose-400 hover:text-white hover:bg-rose-900/60 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-3 border-t border-[#3d3f42] bg-[#222325]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                {currentUser?.avatar ? (
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    className="w-7 h-7 rounded-md object-cover border border-[#484a4e]"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-md bg-[#53383e] text-white font-bold text-xs flex items-center justify-center">
                    {(currentUser?.name || 'U').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 truncate">
                  <div className="text-xs font-bold text-white truncate">
                    {currentUser?.name || 'Usuário'}
                  </div>
                  <div className="text-[10px] text-[#a0a2a6] truncate">
                    {currentUser?.roleBadge || currentRole}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={openLogoutModal}
                title="Sair do sistema"
                className="px-2 py-1 text-xs text-rose-400 hover:text-white hover:bg-rose-900/50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-rose-900/40"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">Sair</span>
              </button>
            </div>
            <div className="text-[10px] text-[#8e9094] flex items-center justify-between">
              <span>MP PISCINA ERP · <strong className="text-slate-300 font-mono">{SYSTEM_VERSION}</strong></span>
              <span className="text-emerald-400 font-mono flex items-center gap-1">● Nuvem Sincronizada</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
