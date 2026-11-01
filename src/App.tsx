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
import { SystemSettingsView } from './components/SystemSettingsView';
import { SystemDocumentationModal } from './components/SystemDocumentationModal';
import { AuditLogsModal } from './components/AuditLogsModal';
import { LoginView } from './components/LoginView';

const MainLayout: React.FC = () => {
  const { currentRole } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewOSModalOpen, setIsNewOSModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // If role switches to client, default tab to customerPortal
  React.useEffect(() => {
    if (currentRole === 'cliente') {
      setActiveTab('customerPortal');
    } else if (currentRole === 'tecnico' && (activeTab === 'sales' || activeTab === 'customerPortal' || activeTab === 'configuracoes')) {
      setActiveTab('orders');
    } else if (currentRole === 'contador' && (activeTab === 'orders' || activeTab === 'fleet' || activeTab === 'configuracoes')) {
      setActiveTab('accounting');
    }
  }, [currentRole]);

  const renderCurrentView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            onNavigate={(tab) => setActiveTab(tab)} 
            onOpenNewOS={() => setIsNewOSModalOpen(true)} 
          />
        );
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
      default:
        return (
          <DashboardView 
            onNavigate={(tab) => setActiveTab(tab)} 
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
          setActiveTab('orders');
          setIsNewOSModalOpen(true);
        }}
        onOpenDoc={() => setIsDocModalOpen(true)}
        onOpenAuditLogs={() => setIsAuditModalOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Sidebar Navigation */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
          }}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {renderCurrentView()}
        </main>
      </div>

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
