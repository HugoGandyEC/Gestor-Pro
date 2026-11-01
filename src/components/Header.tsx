import React from 'react';
import { 
  Wrench, 
  Plus, 
  Calendar, 
  FileText, 
  RotateCcw,
  UserCheck,
  Shield,
  Briefcase,
  HardHat,
  Calculator,
  User,
  Menu,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

interface HeaderProps {
  onOpenNewOS: () => void;
  onOpenDoc: () => void;
  onOpenAuditLogs: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenNewOS, 
  onOpenDoc,
  onOpenAuditLogs,
  isMobileMenuOpen = false,
  onToggleMobileMenu
}) => {
  const { 
    selectedMonthYear, 
    setSelectedMonthYear, 
    resetToDefaults, 
    currentRole, 
    setCurrentRole 
  } = useApp();

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Shield className="w-3.5 h-3.5 text-[#53383e]" />;
      case 'colaborador': return <Briefcase className="w-3.5 h-3.5 text-[#704d55]" />;
      case 'tecnico': return <HardHat className="w-3.5 h-3.5 text-[#363739]" />;
      case 'contador': return <Calculator className="w-3.5 h-3.5 text-emerald-700" />;
      case 'cliente': return <User className="w-3.5 h-3.5 text-[#53383e]" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Administrador (Total)';
      case 'colaborador': return 'Colaborador';
      case 'tecnico': return 'Técnico em Campo';
      case 'contador': return 'Contador / Fiscal';
      case 'cliente': return 'Portal do Cliente';
    }
  };

  return (
    <header className="no-print bg-white border-b border-[#d8d8d8] sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Hamburger button on mobile */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-[#363739] hover:bg-[#f4f5f6] border border-[#d8d8d8] transition-colors cursor-pointer"
            aria-label={isMobileMenuOpen ? "Fechar menu lateral" : "Abrir menu lateral"}
            title={isMobileMenuOpen ? "Fechar menu lateral" : "Abrir menu lateral"}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-[#53383e]" />
            ) : (
              <Menu className="w-5 h-5 text-[#363739]" />
            )}
          </button>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#53383e] flex items-center justify-center text-white shadow-sm ring-2 ring-[#c2bfb0]/40 shrink-0">
            <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-lg font-bold text-[#363739] tracking-tight whitespace-nowrap">
                GestãoPro
              </span>
              <span className="hidden xs:inline-block text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-md bg-[#f6eff1] text-[#53383e] border border-[#d8d8d8]">
                ERP · OS
              </span>
            </div>
            <p className="text-[11px] text-[#5a5b5e] hidden md:block">
              Assistência Técnica · Vendas de Equipamentos · Estoque & XML · Portal do Cliente
            </p>
          </div>
        </div>

        {/* Controls Zone: Role Switcher, Month, Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Persona / Role Switcher */}
          <div className="flex items-center gap-1.5 bg-[#f4f5f6] rounded-lg px-2.5 py-1.5 border border-[#d8d8d8] shadow-xs">
            {getRoleIcon(currentRole)}
            <span className="text-[11px] font-medium text-[#707174] hidden md:inline">Perfil:</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as UserRole)}
              className="text-xs font-bold text-[#363739] bg-transparent border-0 focus:ring-0 cursor-pointer pr-1"
              title="Trocar perfil de usuário para testar a matriz de permissões"
            >
              <option value="admin">Administrador (Total)</option>
              <option value="colaborador">Colaborador</option>
              <option value="tecnico">Técnico em Campo</option>
              <option value="contador">Contador / Fiscal</option>
              <option value="cliente">Cliente (Portal Exclusivo)</option>
            </select>
          </div>

          {/* Seletor de Mês (oculto no portal do cliente) */}
          {currentRole !== 'cliente' && (
            <div className="hidden sm:flex items-center gap-1.5 bg-[#f4f5f6] rounded-lg px-2.5 py-1.5 border border-[#d8d8d8]">
              <Calendar className="w-4 h-4 text-[#707174] shrink-0" />
              <select
                value={selectedMonthYear}
                onChange={(e) => setSelectedMonthYear(e.target.value)}
                className="text-xs font-semibold text-[#363739] bg-transparent border-0 focus:ring-0 cursor-pointer pr-2"
              >
                <option value="2026-10">Outubro / 2026</option>
                <option value="2026-09">Setembro / 2026</option>
                <option value="2026-08">Agosto / 2026</option>
                <option value="2026-11">Novembro / 2026</option>
              </select>
            </div>
          )}

          {/* Audit Logs button (para admin/contador) */}
          {(currentRole === 'admin' || currentRole === 'contador') && (
            <button
              onClick={onOpenAuditLogs}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#363739] bg-white border border-[#d8d8d8] rounded-lg hover:bg-[#f4f5f6] transition-colors"
              title="Ver logs de auditoria e segurança"
            >
              <span>Logs / Auditoria</span>
            </button>
          )}

          {/* Botão de Documentação do Sistema */}
          <button
            onClick={onOpenDoc}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#363739] bg-white border border-[#d8d8d8] rounded-lg hover:bg-[#f4f5f6] transition-colors shadow-xs"
            title="Ver arquitetura do sistema e briefing profissional"
          >
            <FileText className="w-3.5 h-3.5 text-[#53383e]" />
            <span>Arquitetura</span>
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={() => {
              if (confirm('Deseja restaurar os dados de exemplo originais do sistema?')) {
                resetToDefaults();
              }
            }}
            className="p-1.5 text-[#707174] hover:text-[#363739] rounded-lg hover:bg-[#f4f5f6] transition-colors border border-transparent hover:border-[#d8d8d8]"
            title="Restaurar dados de teste padrão"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Primary Action Button (se não for cliente) */}
          {currentRole !== 'cliente' && (
            <button
              onClick={onOpenNewOS}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Ordem de Serviço</span>
              <span className="sm:hidden">Nova OS</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
