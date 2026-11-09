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
  X,
  Palette,
  LogOut,
  ChevronDown,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole, AppTheme } from '../types';

interface HeaderProps {
  onOpenNewOS: () => void;
  onOpenDoc: () => void;
  onOpenAuditLogs: () => void;
  onOpenHelp?: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenNewOS, 
  onOpenDoc, 
  onOpenAuditLogs,
  onOpenHelp,
  isMobileMenuOpen = false,
  onToggleMobileMenu
}) => {
  const { 
    selectedMonthYear, 
    setSelectedMonthYear, 
    resetToDefaults, 
    currentRole, 
    setCurrentRole,
    currentUser,
    logout,
    openLogoutModal,
    companySettings,
    currentTheme,
    setTheme,
    themeDefinitions
  } = useApp();

  const [isThemeMenuOpen, setIsThemeMenuOpen] = React.useState(false);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Shield className="w-3.5 h-3.5 text-[#53383e]" />;
      case 'colaborador': return <Briefcase className="w-3.5 h-3.5 text-[#704d55]" />;
      case 'tecnico': return <HardHat className="w-3.5 h-3.5 text-[#363739]" />;
      case 'contador': return <Calculator className="w-3.5 h-3.5 text-emerald-700" />;
      case 'cliente': return <User className="w-3.5 h-3.5 text-[#53383e]" />;
      case 'vendedor': return <Briefcase className="w-3.5 h-3.5 text-amber-700" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Administrador (Total)';
      case 'colaborador': return 'Colaborador';
      case 'tecnico': return 'Técnico em Campo';
      case 'contador': return 'Contador / Fiscal';
      case 'cliente': return 'Portal do Cliente';
      case 'vendedor': return 'Vendedor / Comercial';
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

          {companySettings.logoUrl ? (
            <img 
              src={companySettings.logoUrl} 
              alt={companySettings.tradeName || 'Logo'} 
              className="max-h-9 max-w-[120px] object-contain shrink-0 rounded"
            />
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#53383e] flex items-center justify-center text-white shadow-sm ring-2 ring-[#c2bfb0]/40 shrink-0">
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-lg font-bold text-[#363739] tracking-tight whitespace-nowrap">
                {companySettings.tradeName || 'GestãoPro'}
              </span>
              <span className="hidden xs:inline-block text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-md bg-[#f6eff1] text-[#53383e] border border-[#d8d8d8]">
                ERP · OS
              </span>
            </div>
            <p className="text-[11px] text-[#5a5b5e] hidden sm:block truncate max-w-[180px]">
              {companySettings.companyName || 'Assistência Técnica & Vendas'}
            </p>
          </div>
        </div>

        {/* Controls Zone: Role Switcher, Month, Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Persona / Role Switcher - Protegido contra Escalada de Privilégios */}
          {currentUser && (currentUser.role === 'cliente' || currentUser.role === 'tecnico') ? (
            <div 
              className="flex items-center gap-1.5 bg-[#f4f5f6] rounded-lg px-2.5 py-1.5 border border-[#d8d8d8] shadow-xs"
              title="Perfil com acesso estritamente isolado por RBAC e sessão criptografada"
            >
              {getRoleIcon(currentRole)}
              <span className="text-xs font-bold text-[#363739]">
                {getRoleLabel(currentRole)}
              </span>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 ml-1 border border-emerald-200">
                Sessão Segura
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-[#f4f5f6] rounded-lg px-2.5 py-1.5 border border-[#d8d8d8] shadow-xs">
              {getRoleIcon(currentRole)}
              <span className="text-[11px] font-medium text-[#707174] hidden md:inline">Perfil:</span>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                className="text-xs font-bold text-[#363739] bg-transparent border-0 focus:ring-0 cursor-pointer pr-1"
                title="Trocar perfil (Disponível apenas para Administrador testar permissões)"
              >
                <option value="admin">Administrador (Total)</option>
                <option value="colaborador">Colaborador</option>
                <option value="vendedor">Vendedor / Comercial</option>
                <option value="tecnico">Técnico em Campo</option>
                <option value="contador">Contador / Fiscal</option>
                <option value="cliente">Cliente (Portal Exclusivo)</option>
              </select>
            </div>
          )}

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


          {/* Theme Switcher in Header */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsThemeMenuOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#d8d8d8] bg-white hover:bg-[#f4f5f6] text-xs font-semibold text-[#363739] shadow-xs cursor-pointer transition-colors"
              title="Trocar tema de cores do sistema"
            >
              <Palette className="w-3.5 h-3.5 text-[#53383e]" />
              <div className="flex -space-x-1 items-center">
                {themeDefinitions.find(t => t.id === currentTheme)?.swatches.slice(0, 3).map((sw, i) => (
                  <span
                    key={i}
                    className="w-2.5 h-2.5 rounded-full border border-white"
                    style={{ backgroundColor: sw }}
                  />
                ))}
              </div>
              <span className="hidden xl:inline text-[11px]">Tema</span>
              <ChevronDown className="w-3 h-3 text-[#707174]" />
            </button>

            {isThemeMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-80 max-h-[82vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-[#d8d8d8] p-3 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#d8d8d8]">
                  <span className="text-xs font-extrabold text-[#363739] flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#53383e]" />
                    Paletas do Sistema
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsThemeMenuOpen(false)}
                    className="text-[11px] text-[#707174] hover:text-[#363739] font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-1.5">
                  {themeDefinitions.map((th) => {
                    const isSelected = currentTheme === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => {
                          setTheme(th.id);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#53383e] bg-[#f6eff1] ring-1 ring-[#53383e]/20'
                            : 'border-transparent hover:border-[#d8d8d8] hover:bg-[#f4f5f6]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#363739]">
                            {th.name}
                          </span>
                          {isSelected && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#53383e] text-white">
                              Ativo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {th.swatches.map((color, idx) => (
                            <div
                              key={idx}
                              className="flex-1 h-3.5 rounded-xs border border-black/10"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-1.5 pl-1 sm:pl-2 border-l border-[#d8d8d8]">
            <div className="flex items-center gap-2">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-[#d8d8d8]"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#53383e] text-white font-bold text-xs flex items-center justify-center">
                  {(currentUser?.name || 'U').substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-[#363739] leading-tight">
                  {currentUser?.name || 'Usuário'}
                </div>
                <div className="text-[10px] text-[#707174] leading-tight">
                  {currentUser?.roleBadge || 'Operador'}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={openLogoutModal}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ml-1 shadow-2xs"
              title="Sair do sistema (Logout)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>

          {/* Primary Action Button (se não for cliente) */}
          {currentRole !== 'cliente' && (
            <button
              onClick={onOpenNewOS}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova OS</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
