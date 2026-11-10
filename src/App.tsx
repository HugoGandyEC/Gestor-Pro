import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ServiceOrdersView } from './components/ServiceOrdersView';
import { EmployeeProfitabilityReportView } from './components/EmployeeProfitabilityReportView';
import { FleetCostsView } from './components/FleetCostsView';
import { OperationalCostsView } from './components/OperationalCostsView';
import { InitialCostSimulatorView } from './components/InitialCostSimulatorView';
import { FinancialView } from './components/FinancialView';
import { SalesView } from './components/SalesView';
import { EmployeesView } from './components/EmployeesView';
import { CustomerPortalView } from './components/CustomerPortalView';
import { ProductsAndStockView } from './components/ProductsAndStockView';
import { ClientsView } from './components/ClientsView';
import { SuppliersView } from './components/SuppliersView';
import { AccountingClosingView } from './components/AccountingClosingView';
import { MasterRegistrationsView } from './components/MasterRegistrationsView';
import { CardOperatorsView } from './components/CardOperatorsView';
import { GoogleDriveView } from './components/GoogleDriveView';
import { GoogleCalendarView } from './components/GoogleCalendarView';
import { SystemSettingsView } from './components/SystemSettingsView';
import { SystemDocumentationModal } from './components/SystemDocumentationModal';
import { AuditLogsModal } from './components/AuditLogsModal';
import { SystemHelpModal } from './components/SystemHelpModal';
import { SystemManualView } from './components/SystemManualView';
import { LogoutConfirmationModal } from './components/LogoutConfirmationModal';
import { LoginView } from './components/LoginView';
import { SystemFooter } from './components/SystemFooter';

const VALID_TABS: ActiveTab[] = [
  'dashboard',
  'agenda',
  'orders',
  'sales',
  'products',
  'clients',
  'suppliers',
  'customerPortal',
  'accounting',
  'profitability',
  'fleet',
  'operational',
  'initialCosts',
  'financial',
  'employees',
  'cadastros',
  'cardOperators',
  'googleDrive',
  'configuracoes',
  'documentation'
];

const getInitialTab = (): ActiveTab => {
  try {
    const hash = window.location.hash.replace(/^#/, '') as ActiveTab;
    if (hash && VALID_TABS.includes(hash)) {
      return hash;
    }
    const saved = localStorage.getItem('gestaopro_active_tab') as ActiveTab;
    if (saved && VALID_TABS.includes(saved)) {
      return saved;
    }
  } catch {}
  return 'dashboard';
};

const MainLayout: React.FC = () => {
  const { currentRole } = useApp();
  const [activeTab, setActiveTabState] = useState<ActiveTab>(getInitialTab);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewOSModalOpen, setIsNewOSModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const handleSetActiveTab = React.useCallback((tab: ActiveTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('gestaopro_active_tab', tab);
      if (window.location.hash !== `#${tab}`) {
        window.history.replaceState(null, '', `#${tab}`);
      }
    } catch {}
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
      if (hash && VALID_TABS.includes(hash)) {
        setActiveTabState(hash);
        try {
          localStorage.setItem('gestaopro_active_tab', hash);
        } catch {}
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  // If role switches to client, default tab to customerPortal
  React.useEffect(() => {
    if (currentRole === 'cliente') {
      handleSetActiveTab('customerPortal');
    } else if (currentRole === 'tecnico' && (activeTab === 'sales' || activeTab === 'customerPortal' || activeTab === 'configuracoes')) {
      handleSetActiveTab('orders');
    } else if (currentRole === 'contador' && (activeTab === 'orders' || activeTab === 'fleet' || activeTab === 'configuracoes')) {
      handleSetActiveTab('accounting');
    }
  }, [currentRole, handleSetActiveTab]);

  const renderCurrentView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            onNavigate={(tab) => handleSetActiveTab(tab)} 
            onOpenNewOS={() => setIsNewOSModalOpen(true)} 
          />
        );
      case 'agenda':
        return <GoogleCalendarView />;
      case 'orders':
        return (
          <ServiceOrdersView 
            isNewModalOpen={isNewOSModalOpen}
            setIsNewModalOpen={setIsNewOSModalOpen}
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
        return <SalesView />;
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
      case 'employees':
        return <EmployeesView />;
      case 'documentation':
        return <SystemManualView onNavigate={(tab) => handleSetActiveTab(tab)} />;
      default:
        return (
          <DashboardView 
            onNavigate={(tab) => handleSetActiveTab(tab)} 
            onOpenNewOS={() => setIsNewOSModalOpen(true)} 
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f6] text-[#363739] flex flex-col font-sans selection:bg-[#53383e] selection:text-white">
      {/* Top Bar Header */}
      <Header 
        onOpenNewOS={() => {
          handleSetActiveTab('orders');
          setIsNewOSModalOpen(true);
        }}
        onOpenDoc={() => setIsDocModalOpen(true)}
        onOpenAuditLogs={() => setIsAuditModalOpen(true)}
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

      {/* Audit Logs Modal */}
      <AuditLogsModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal />
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
