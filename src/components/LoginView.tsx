import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginView: React.FC = () => {
  const { login, companySettings } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    setTimeout(() => {
      const res = login(username, password);
      if (!res.success) {
        setErrorMessage(res.message || 'Usuário ou senha incorretos.');
        setIsSubmitting(false);
      }
    }, 250);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-100/80 font-sans selection:bg-[#53383e] selection:text-white">
      {/* Top Spacer */}
      <div className="h-6 sm:h-10" />

      {/* Main Centered Login Card */}
      <div className="w-full max-w-md mx-auto px-4">
        <div className="bg-white rounded-3xl p-7 sm:p-9 shadow-xl border border-slate-200/80">
          
          {/* Logo da Empresa ou Emblema Padronizado */}
          <div className="flex flex-col items-center justify-center text-center mb-6">
            {companySettings.logoUrl ? (
              <img
                src={companySettings.logoUrl}
                alt={companySettings.tradeName || companySettings.companyName || 'Logo'}
                className="max-h-20 max-w-[220px] object-contain mb-3 drop-shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#53383e] flex items-center justify-center text-white font-black text-2xl shadow-md mb-3">
                {(companySettings.tradeName || companySettings.companyName || 'MP').substring(0, 2).toUpperCase()}
              </div>
            )}

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {companySettings.tradeName || companySettings.companyName || 'GestãoPro ERP'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Acesse sua conta para entrar no sistema
            </p>
          </div>

          {/* Mensagem de Erro */}
          {errorMessage && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Formulário de Autenticação */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Usuário ou E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário ou e-mail"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#53383e] focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Senha de Acesso
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha de acesso"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#53383e] focus:bg-white transition-all font-mono shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#53383e] focus:ring-[#53383e] cursor-pointer"
                />
                Lembrar meu acesso
              </label>

              <button
                type="button"
                onClick={() => alert('Para redefinição ou criação de senha, entre em contato com o administrador do sistema.')}
                className="text-[#53383e] hover:underline font-semibold cursor-pointer"
              >
                Esqueceu a senha?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-[#53383e] hover:bg-[#432c32] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {isSubmitting ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Rodapé Limpo com Informativo do Criador do Sistema "HUGO GANDY" */}
      <footer className="w-full py-5 text-center text-xs text-slate-500 space-y-1 px-4">
        <div className="font-semibold text-slate-700 text-xs">
          Sistema desenvolvido por <span className="font-extrabold text-slate-900 tracking-wider">HUGO GANDY</span>
        </div>
        <div className="text-[11px] text-slate-400">
          {companySettings.tradeName || companySettings.companyName || 'GestãoPro ERP'} · Todos os direitos reservados
        </div>
      </footer>
    </div>
  );
};
