import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { SystemDocumentationModal } from './components/SystemDocumentationModal';
import { SystemHelpModal } from './components/SystemHelpModal';
import { LogoutConfirmationModal } from './components/LogoutConfirmationModal';
import { PaymentReceiptModal } from './components/PaymentReceiptModal';
import { OsPaymentReceiptPromptModal } from './components/OsPaymentReceiptPromptModal';
import { LoginView } from './components/LoginView';
import { SystemFooter } from './components/SystemFooter';
import {
  DashboardView,
  GoogleCalendarView,
  PdvView,
  ServiceOrdersView,
  SalesView,
  CustomerPortalView,
  FinancialView,
  AnalyticsChartsView,
  EmployeeProfitabilityReportView,
  AccountingClosingView,
  OperationalCostsView,
  FleetCostsView,
  InitialCostSimulatorView,
  MasterRegistrationsView,
  CardOperatorsView,
  ProductsAndStockView,
  ClientsView,
  SuppliersView,
  EmployeesView,
  GoogleDriveView,
  SystemSettingsView,
  SystemManualView,
  getEstadoModulos,
  getModulosAtivosIds,
  getPrimeiroModuloAtivo,
  isModuloAtivo,
  MODULOS_CHANGED_EVENT
} from './modulos';

const getInitialTab = (): ActiveTab => {
  const ativos = getModulosAtivosIds();
  try {
    const hash = window.location.hash.replace(/^#/, '') as ActiveTab;
    if (hash && ativos.includes(hash)) {
      return hash;
    }
    const saved = localStorage.getItem('gestaopro_active_tab') as ActiveTab;
    if (saved && ativos.includes(saved)) {
      return saved;
    }
  } catch {}
  return getPrimeiroModuloAtivo();
};

const MainLayout: React.FC = () => {
  const {
    currentRole,
    activeReceiptModal,
    closeReceiptModal,
    pendingReceiptPrompt,
    confirmPendingReceiptPrompt,
    dismissPendingReceiptPrompt
  } = useApp();
  const [modulosEstado, setModulosEstado] = useState(() => getEstadoModulos());
  const [activeTab, setActiveTabState] = useState<ActiveTab>(getInitialTab);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewOSModalOpen, setIsNewOSModalOpen] = useState(false);
  const [ordersStatusFilterTrigger, setOrdersStatusFilterTrigger] = useState<{ status: string; seq: number } | undefined>(undefined);
  const [pdvSaleTrigger, setPdvSaleTrigger] = useState<{ saleId: string; seq: number } | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const handleSetActiveTab = React.useCallback((tab: ActiveTab) => {
    const destino = isModuloAtivo(tab) ? tab : getPrimeiroModuloAtivo();
    setActiveTabState(destino);
    try {
      localStorage.setItem('gestaopro_active_tab', destino);
      if (window.location.hash !== `#${destino}`) {
        window.history.replaceState(null, '', `#${destino}`);
      }
    } catch {}
  }, []);

  // Reage em tempo real quando módulos são ativados/desativados
  React.useEffect(() => {
    const syncModulos = () => {
      const novoEstado = getEstadoModulos();
      setModulosEstado(novoEstado);
      setActiveTabState((atual) => (novoEstado[atual] ? atual : getPrimeiroModuloAtivo()));
    };
    window.addEventListener(MODULOS_CHANGED_EVENT, syncModulos);
    window.addEventListener('storage', syncModulos);
    return () => {
      window.removeEventListener(MODULOS_CHANGED_EVENT, syncModulos);
      window.removeEventListener('storage', syncModulos);
    };
  }, []);

  // Sync with browser navigation & maintain same screen on reload
  React.useEffect(() => {
    try {
      if (!window.location.hash || window.location.hash === '#') {
        window.history.replaceState(null, '', `#${activeTab}`);
      }
      localStorage.setItem('gestaopro_active_tab', activeTab);
    } catch {}

    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '') as ActiveTab;
      if (hash && isModuloAtivo(hash)) {
        setActiveTabState(hash);
        try {
          localStorage.setItem('gestaopro_active_tab', hash);
        } catch {}
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  // If role switches, route to an active module permitted for that role
  React.useEffect(() => {
    if (currentRole === 'cliente' && modulosEstado.customerPortal) {
      handleSetActiveTab('customerPortal');
    } else if (currentRole === 'tecnico' && (activeTab === 'sales' || activeTab === 'customerPortal' || activeTab === 'configuracoes') && modulosEstado.orders) {
      handleSetActiveTab('orders');
    } else if (currentRole === 'contador' && (activeTab === 'orders' || activeTab === 'fleet' || activeTab === 'configuracoes') && modulosEstado.accounting) {
      handleSetActiveTab('accounting');
    }
  }, [currentRole, handleSetActiveTab, modulosEstado.customerPortal, modulosEstado.orders, modulosEstado.accounting]);

  const renderCurrentView = () => {
    const current: ActiveTab = modulosEstado[activeTab] ? activeTab : getPrimeiroModuloAtivo();

    if (!modulosEstado[current]) {
      return (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
          <h2 className="text-lg font-bold text-slate-900">Nenhum módulo ativo no momento</h2>
          <p className="text-sm text-slate-500">
            Ative pelo menos um módulo no arquivo <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">src/modulos/ativarModulos.ts</code>.
          </p>
        </div>
      );
    }

    switch (current) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={(tab) => handleSetActiveTab(tab)}
            onOpenNewOS={() => {
              if (modulosEstado.orders) {
                handleSetActiveTab('orders');
                setIsNewOSModalOpen(true);
              }
            }}
            onOpenOrdersByStatus={(status) => {
              if (modulosEstado.orders) {
                setOrdersStatusFilterTrigger(prev => ({ status, seq: (prev?.seq || 0) + 1 }));
                handleSetActiveTab('orders');
              }
            }}
          />
        );
      case 'agenda':
        return <GoogleCalendarView />;
      case 'pdv':
        return <PdvView externalSaleTrigger={pdvSaleTrigger} />;
      case 'orders':
        return (
          <ServiceOrdersView
            isNewModalOpen={isNewOSModalOpen}
            setIsNewModalOpen={setIsNewOSModalOpen}
            externalStatusFilter={ordersStatusFilterTrigger}
          />
        );
      case 'customerPortal':
        return <CustomerPortalView />;
      case 'cadastros':
        return <MasterRegistrationsView />;
      case 'cardOperators':
        return <CardOperatorsView />;
      case 'googleDrive':
        return <GoogleDriveView />;
      case 'configuracoes':
        return <SystemSettingsView />;
      case 'products':
        return <ProductsAndStockView />;
      case 'clients':
        return <ClientsView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'accounting':
        return <AccountingClosingView />;
      case 'sales':
        return (
          <SalesView
            onSendToPdvAndNavigate={(saleId) => {
              if (modulosEstado.pdv) {
                setPdvSaleTrigger(prev => ({ saleId, seq: (prev?.seq || 0) + 1 }));
                handleSetActiveTab('pdv');
              }
            }}
          />
        );
      case 'profitability':
        return <EmployeeProfitabilityReportView />;
      case 'fleet':
        return <FleetCostsView />;
      case 'operational':
        return <OperationalCostsView />;
      case 'initialCosts':
        return <InitialCostSimulatorView />;
      case 'financial':
        return <FinancialView />;
      case 'charts':
        return <AnalyticsChartsView />;
      case 'employees':
        return <EmployeesView />;
      case 'documentation':
        return <SystemManualView onNavigate={(tab) => handleSetActiveTab(tab)} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f6] text-[#363739] flex flex-col font-sans selection:bg-[#53383e] selection:text-white">
      {/* Top Bar Header */}
      <Header
        onOpenNewOS={() => {
          if (modulosEstado.orders) {
            handleSetActiveTab('orders');
            setIsNewOSModalOpen(true);
          }
        }}
        onOpenPdv={() => {
          if (modulosEstado.pdv) {
            handleSetActiveTab('pdv');
          }
        }}
        onOpenDoc={() => setIsDocModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            handleSetActiveTab(tab);
            setIsMobileMenuOpen(false);
          }}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0 overflow-y-auto flex flex-col justify-between">
          <div className="flex-1">
            {renderCurrentView()}
          </div>
          {/* Rodapé das telas do sistema com versionamento */}
          <SystemFooter onOpenDoc={() => setIsDocModalOpen(true)} />
        </main>
      </div>

      {/* System Help & Functions Modal */}
      <SystemHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onNavigate={(tab) => {
          handleSetActiveTab(tab);
          setIsHelpModalOpen(false);
        }}
      />

      {/* System Documentation Modal */}
      <SystemDocumentationModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal />

      {/* Conditional Prompt before opening OS Payment Receipt */}
      <OsPaymentReceiptPromptModal
        prompt={pendingReceiptPrompt}
        onConfirm={confirmPendingReceiptPrompt}
        onDismiss={dismissPendingReceiptPrompt}
      />

      {/* Global Auto Payment Receipt Modal */}
      <PaymentReceiptModal receipt={activeReceiptModal} onClose={closeReceiptModal} />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return <MainLayout />;
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
