import React, { useEffect } from 'react';
import { LogOut, X, AlertCircle, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LogoutConfirmationModal: React.FC = () => {
  const { isLogoutModalOpen, closeLogoutModal, logout, currentUser, currentRole } = useApp();

  // Fecha com a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLogoutModalOpen) {
        closeLogoutModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLogoutModalOpen, closeLogoutModal]);

  if (!isLogoutModalOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={closeLogoutModal}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
      >
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 id="logout-title" className="font-bold text-slate-900 text-base">
                Sair do Sistema
              </h3>
              <p className="text-xs text-slate-500">
                Confirmação de encerramento de sessão
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeLogoutModal}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Deseja realmente sair da sua conta e retornar para a tela de autenticação?
          </p>

          {currentUser && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-lg object-cover border border-slate-300"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[#53383e] text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {currentUser.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-slate-900 truncate">
                  {currentUser.name}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span className="font-mono">{currentUser.username}</span>
                  <span>·</span>
                  <span className="font-semibold text-blue-700 uppercase text-[10px]">
                    {currentUser.roleBadge || currentRole}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-slate-500 flex items-center gap-2 bg-amber-50 text-amber-800 p-2.5 rounded-lg border border-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Suas alterações salvas não serão perdidas. Para acessar novamente, basta fazer o login.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={closeLogoutModal}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sim, Sair do Sistema</span>
          </button>
        </div>
      </div>
    </div>
  );
};
