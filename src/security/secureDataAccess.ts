import { 
  AuthUser, 
  ServiceOrder, 
  Client, 
  CustomerPortalTicket, 
  DirectSale 
} from '../types';
import { 
  getTenantClientId, 
  getTechnicianEmployeeId, 
  sanitizeServiceOrderForClient, 
  sanitizeServiceOrderForTechnician 
} from './rbac';

/**
 * CAMADA DE ACESSO A DADOS SEGURO COM ESCOPO MULTI-TENANCY E RBAC
 * 
 * Garante que nenhuma tela ou componente renderize ou tenha acesso
 * a dados de outros clientes ou informações confidenciais não autorizadas.
 */

/**
 * Consulta Segura de Ordens de Serviço por Perfil Autenticado
 */
export function getScopedServiceOrders(
  orders: ServiceOrder[], 
  user: AuthUser | null
): ServiceOrder[] {
  if (!user) return [];

  // 1. Administrador e Contador: Acesso total
  if (user.role === 'admin' || user.role === 'contador') {
    return orders;
  }

  // 2. Visão do Cliente: Estritamente suas próprias ordens (Multi-Tenancy)
  if (user.role === 'cliente') {
    const tenantId = getTenantClientId(user);
    if (!tenantId) return [];
    return orders
      .filter(o => o.clientId === tenantId)
      .map(sanitizeServiceOrderForClient);
  }

  // 3. Visão do Técnico: Estritamente ordens atribuídas a ele
  if (user.role === 'tecnico') {
    const workerId = getTechnicianEmployeeId(user);
    if (!workerId) return [];
    return orders
      .filter(o => o.employeeId === workerId)
      .map(sanitizeServiceOrderForTechnician);
  }

  // 4. Vendedor: Acesso comercial a orçamentos e pedidos
  if (user.role === 'vendedor') {
    return orders.map(sanitizeServiceOrderForTechnician);
  }

  return [];
}

/**
 * Consulta Segura de Clientes por Perfil Autenticado
 */
export function getScopedClients(
  clients: Client[], 
  orders: ServiceOrder[], 
  user: AuthUser | null
): Client[] {
  if (!user) return [];

  if (user.role === 'admin' || user.role === 'colaborador' || user.role === 'vendedor' || user.role === 'contador') {
    return clients;
  }

  // Cliente só vê a si mesmo
  if (user.role === 'cliente') {
    const tenantId = getTenantClientId(user);
    return clients.filter(c => c.id === tenantId);
  }

  // Técnico só vê clientes para os quais ele tem OS atribuída (sem dados fiscais confidenciais)
  if (user.role === 'tecnico') {
    const workerId = getTechnicianEmployeeId(user);
    const assignedClientIds = new Set(
      orders.filter(o => o.employeeId === workerId).map(o => o.clientId)
    );
    return clients.filter(c => assignedClientIds.has(c.id));
  }

  return [];
}

/**
 * Consulta Segura de Compras & Vendas Diretas (Histórico de Compras do Cliente)
 */
export function getScopedDirectSales(
  sales: DirectSale[], 
  user: AuthUser | null
): DirectSale[] {
  if (!user) return [];

  if (user.role === 'admin' || user.role === 'colaborador' || user.role === 'vendedor' || user.role === 'contador') {
    return sales;
  }

  // Cliente só vê compras vinculadas ao seu próprio tenant
  if (user.role === 'cliente') {
    const tenantId = getTenantClientId(user);
    if (!tenantId) return [];
    return sales.filter(s => s.clientId === tenantId);
  }

  // Técnico não tem acesso ao faturamento de vendas de terceiros
  if (user.role === 'tecnico') {
    return [];
  }

  return [];
}

/**
 * Consulta Segura de Chamados Técnicos & Garantias
 */
export function getScopedCustomerTickets(
  tickets: CustomerPortalTicket[], 
  orders: ServiceOrder[],
  user: AuthUser | null
): CustomerPortalTicket[] {
  if (!user) return [];

  if (user.role === 'admin' || user.role === 'colaborador') {
    return tickets;
  }

  // Cliente só vê seus próprios chamados
  if (user.role === 'cliente') {
    const tenantId = getTenantClientId(user);
    if (!tenantId) return [];
    return tickets.filter(t => t.clientId === tenantId);
  }

  // Técnico vê chamados vinculados às OS atribuídas a ele
  if (user.role === 'tecnico') {
    const workerId = getTechnicianEmployeeId(user);
    const assignedOrderIds = new Set(
      orders.filter(o => o.employeeId === workerId).map(o => o.id)
    );
    return tickets.filter(t => t.serviceOrderId && assignedOrderIds.has(t.serviceOrderId));
  }

  return [];
}
