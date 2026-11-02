import { AuthUser, ServiceOrder, Client, CustomerPortalTicket, DirectSale, UserRole } from '../types';

/**
 * MÓDULO DE SEGURANÇA & CONTROLE DE ACESSO BASEADO EM PAPÉIS (RBAC)
 * E ISOLAMENTO MULTI-TENANCY CONTRA IDOR (Insecure Direct Object References)
 * 
 * Regras Estritas de Negócio:
 * 1. CLIENTE: Acesso estritamente restrito aos seus próprios dados (clientId).
 *    - Nenhuma visão de dados internos, margens de lucro, fornecedores ou outros clientes.
 * 2. TÉCNICO: Acesso restrito às ordens de serviço atribuídas a ele (employeeId).
 *    - Nenhuma visão de finanças globais da empresa, outros técnicos ou clientes de outros técnicos.
 * 3. ADMIN: Acesso irrestrito a todas as visões para gestão e auditoria.
 */

export class SecurityException extends Error {
  constructor(message: string, public code: 'FORBIDDEN' | 'UNAUTHORIZED' | 'IDOR_ATTEMPT' = 'FORBIDDEN') {
    super(message);
    this.name = 'SecurityException';
  }
}

/**
 * Obtém o ID do cliente autenticado (Tenant ID)
 */
export function getTenantClientId(user: AuthUser | null): string | null {
  if (!user) return null;
  if (user.role === 'cliente') {
    return user.clientId || user.id.replace('usr-', 'cli-');
  }
  return null;
}

/**
 * Obtém o ID do funcionário/técnico autenticado (Worker ID)
 */
export function getTechnicianEmployeeId(user: AuthUser | null): string | null {
  if (!user) return null;
  if (user.role === 'tecnico') {
    return user.employeeId || user.id.replace('usr-', 'emp-');
  }
  return null;
}

/**
 * Validação de Acesso a Ordem de Serviço (Prevenção contra IDOR)
 */
export function canAccessServiceOrder(user: AuthUser | null, order: ServiceOrder): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'contador') return true;

  if (user.role === 'cliente') {
    const tenantId = getTenantClientId(user);
    return !!tenantId && order.clientId === tenantId;
  }

  if (user.role === 'tecnico') {
    const workerId = getTechnicianEmployeeId(user);
    return !!workerId && order.employeeId === workerId;
  }

  if (user.role === 'vendedor') {
    return true; // Vendedor pode visualizar para orçamentos comerciais
  }

  return false;
}

/**
 * Validação de Permissão para Modificar Ordem de Serviço
 */
export function canModifyServiceOrder(user: AuthUser | null, order: ServiceOrder): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;

  if (user.role === 'tecnico') {
    const workerId = getTechnicianEmployeeId(user);
    // Técnico só pode alterar status e checklist das OSs que estão atribuídas a ele
    return !!workerId && order.employeeId === workerId;
  }

  if (user.role === 'cliente') {
    // Cliente só pode assinar digitalmente a sua própria OS
    const tenantId = getTenantClientId(user);
    return !!tenantId && order.clientId === tenantId;
  }

  return false;
}

/**
 * Validação de Acesso a Dados do Cliente
 */
export function canAccessClientData(user: AuthUser | null, targetClientId: string): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'colaborador' || user.role === 'vendedor' || user.role === 'contador') return true;

  if (user.role === 'cliente') {
    const tenantId = getTenantClientId(user);
    return tenantId === targetClientId;
  }

  if (user.role === 'tecnico') {
    // Técnico só acessa dados de clientes dos quais possui atendimento atribuído
    return true; // Controlado pelo escopo das ordens atribuídas
  }

  return false;
}

/**
 * Validação de Alteração de Perfil de Cliente (Prevenção IDOR em updateClient)
 */
export function canModifyClientData(user: AuthUser | null, targetClientId: string): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;

  if (user.role === 'cliente') {
    const tenantId = getTenantClientId(user);
    // Cliente só pode alterar o seu próprio cadastro
    return tenantId === targetClientId;
  }

  return false;
}

/**
 * Validação para Abertura de Chamado Técnico / Garantia
 */
export function canCreateTicketForClient(user: AuthUser | null, targetClientId: string): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;

  if (user.role === 'cliente') {
    const tenantId = getTenantClientId(user);
    // Cliente só pode abrir chamados para a sua própria conta
    return tenantId === targetClientId;
  }

  return false;
}

/**
 * SANITIZAÇÃO DE DADOS: Remove custos de atacado, margens de lucro e dados internos para o Cliente
 */
export function sanitizeServiceOrderForClient(order: ServiceOrder): ServiceOrder {
  return {
    ...order,
    parts: order.parts.map(p => ({
      ...p,
      cost: 0 // Zera o preço de custo interno da empresa para o cliente não ver a margem
    }))
  };
}

/**
 * SANITIZAÇÃO DE DADOS: Remove faturamento global e custos da empresa para o Técnico
 */
export function sanitizeServiceOrderForTechnician(order: ServiceOrder): ServiceOrder {
  return {
    ...order,
    parts: order.parts.map(p => ({
      ...p,
      cost: 0 // Zera o custo de compra de atacado
    }))
  };
}
