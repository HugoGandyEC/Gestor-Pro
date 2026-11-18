/**
 * ============================================================================
 * FIRE GESTÃO — ÍNDICE CENTRAL DE MÓDULOS
 * ============================================================================
 * Centraliza a exportação de todos os módulos do sistema e do controlador
 * de ativação/desativação (`./ativarModulos`).
 */

export {
  MODULOS_ATIVOS,
  MODULOS_CATALOGO,
  MODULOS_CHANGED_EVENT,
  getEstadoModulos,
  isModuloAtivo,
  getModulosAtivosIds,
  getPrimeiroModuloAtivo,
  setModuloAtivoRuntime,
  restaurarPadraoArquivoModulos
} from './ativarModulos';
export type { ModuloId, ModuloCategoria, ModuloDefinicao } from './ativarModulos';

// === MÓDULOS DE OPERAÇÕES ===
export { DashboardView } from './dashboard/DashboardView';
export { GoogleCalendarView } from './agenda/GoogleCalendarView';
export { PdvView } from './pdv/PdvView';
export { ServiceOrdersView } from './ordens-servico/ServiceOrdersView';
export { SalesView } from './vendas/SalesView';
export { CustomerPortalView } from './portal-cliente/CustomerPortalView';

// === MÓDULOS FINANCEIROS ===
export { FinancialView } from './financeiro/FinancialView';
export { AnalyticsChartsView } from './graficos-bi/AnalyticsChartsView';
export { EmployeeProfitabilityReportView } from './lucratividade/EmployeeProfitabilityReportView';
export { AccountingClosingView } from './fechamento-fiscal/AccountingClosingView';
export { OperationalCostsView } from './custos-fixos/OperationalCostsView';
export { FleetCostsView } from './frota/FleetCostsView';
export { InitialCostSimulatorView } from './custos-iniciais/InitialCostSimulatorView';

// === MÓDULOS DE CADASTROS ===
export { MasterRegistrationsView } from './cadastros/MasterRegistrationsView';
export { CardOperatorsView } from './operadoras-cartao/CardOperatorsView';
export { ProductsAndStockView } from './estoque/ProductsAndStockView';
export { ClientsView } from './clientes/ClientsView';
export { SuppliersView } from './fornecedores/SuppliersView';
export { EmployeesView } from './funcionarios/EmployeesView';

// === MÓDULOS DE SISTEMA ===
export { GoogleDriveView } from './google-drive/GoogleDriveView';
export { SystemSettingsView } from './configuracoes/SystemSettingsView';
export { SystemManualView } from './manual/SystemManualView';
