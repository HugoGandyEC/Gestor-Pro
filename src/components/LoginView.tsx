import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Palette, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  Phone,
  HelpCircle,
  KeyRound,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppTheme } from '../types';

export const LoginView: React.FC = () => {
  const { 
    login, 
    authUsers, 
    currentTheme, 
    setTheme, 
    themeDefinitions, 
    companySettings 
  } = useApp();

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
    <div className="min-h-screen w-full flex flex-col justify-between bg-[var(--color-canvas)] transition-colors duration-300">
      {/* Top Bar with Brand & Palette Indicator */}
      <div className="w-full border-b border-[#d8d8d8] bg-white/80 backdrop-blur-sm px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#53383e] flex items-center justify-center text-white font-black text-lg shadow-sm">
            MP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#363739] text-base tracking-tight">
                {companySettings.companyName || 'MP PISCINA'}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#f6eff1] text-[#53383e] border border-[#d8d8d8]">
                Sistema Operacional
              </span>
            </div>
            <p className="text-[11px] text-[#707174]">
              Assistência Técnica · Aquecimento & Filtros · Vendas & PDV
            </p>
          </div>
        </div>

        {/* Live Theme Quick Toggle in Bar */}
        <div className="hidden md:flex items-center gap-2 bg-[#f4f5f6] px-3 py-1.5 rounded-xl border border-[#d8d8d8]">
          <Palette className="w-4 h-4 text-[#707174]" />
          <span className="text-xs font-semibold text-[#363739]">Tema Visual:</span>
          <div className="flex items-center gap-1.5 ml-1">
            {themeDefinitions.map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => setTheme(th.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentTheme === th.id
                    ? 'bg-white shadow-xs text-[#363739] border border-[#d8d8d8]'
                    : 'text-[#707174] hover:text-[#363739]'
                }`}
                title={th.subtitle}
              >
                <div className="flex -space-x-1">
                  {th.swatches.slice(0, 3).map((sw, i) => (
                    <span 
                      key={i} 
                      className="w-2.5 h-2.5 rounded-full border border-white"
                      style={{ backgroundColor: sw }} 
                    />
                  ))}
                </div>
                <span>{th.name.split(' ')[0]}</span>
                {currentTheme === th.id && (
                  <Check className="w-3 h-3 text-emerald-600 ml-0.5" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Form & Login */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-9 shadow-md border border-[#d8d8d8] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#707174] mb-2 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Acesso Autenticado · GestãoPro
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#363739] tracking-tight">
                Entrar no Sistema
              </h1>
              <p className="text-sm text-[#707174] mt-1">
                Digite suas credenciais corporativas para gerenciar ordens de serviço, clientes e finanças.
              </p>

              {errorMessage && (
                <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#363739] uppercase tracking-wider mb-1.5">
                    Usuário ou E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#707174]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Digite seu usuário ou e-mail corporativo"
                      className="w-full pl-10 pr-3 py-2.5 bg-[#f8fafc] border border-[#d8d8d8] rounded-xl text-sm font-semibold text-[#363739] focus:outline-none focus:ring-2 focus:ring-[#53383e] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#363739] uppercase tracking-wider">
                      Senha de Acesso
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#707174]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha de acesso"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#f8fafc] border border-[#d8d8d8] rounded-xl text-sm font-semibold text-[#363739] focus:outline-none focus:ring-2 focus:ring-[#53383e] focus:bg-white transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#707174] hover:text-[#363739] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-[#363739] font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#d8d8d8] text-[#53383e] focus:ring-[#53383e]"
                    />
                    Lembrar meu acesso neste dispositivo
                  </label>

                  <button
                    type="button"
                    onClick={() => alert('Para redefinição ou criação de senha, entre em contato com o administrador do sistema.')}
                    className="text-[#53383e] hover:underline font-semibold"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-[#53383e] hover:bg-[#432c32] text-white font-bold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <span>Autenticando...</span>
                  ) : (
                    <>
                      <span>Entrar no GestãoPro</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Status de Conexão com Servidor Web & Segurança */}
            <div className="mt-8 pt-6 border-t border-[#d8d8d8] space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span className="flex items-center gap-2 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Servidor Web Pronto para Produção
                </span>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  HTTPS · Porta 3000
                </span>
              </div>
              <p className="text-[11px] text-[#707174] leading-relaxed">
                Acesso seguro com autenticação criptografada, proteção contra IDOR e isolamento estrito de dados por perfil (RBAC).
              </p>
            </div>
          </div>

          {/* Right Column: Dynamic Theme Selection & Showcase */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            
            {/* Theme Selector Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-md border border-[#d8d8d8]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#363739] uppercase tracking-wider mb-1">
                <Palette className="w-4 h-4 text-[#53383e]" />
                Personalização Visual · 3 Temas
              </div>
              <p className="text-xs text-[#707174] mb-4">
                Selecione a paleta visual desejada. O sistema aplicará as cores imediatamente na tela e em todo o ERP.
              </p>

              <div className="space-y-3">
                {themeDefinitions.map((th) => {
                  const isSelected = currentTheme === th.id;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setTheme(th.id)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        isSelected 
                          ? 'border-[#53383e] bg-[#f6eff1]/40 ring-2 ring-[#53383e]/20' 
                          : 'border-[#d8d8d8] bg-white hover:border-[#b8b8b8] hover:bg-[#fafafa]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-extrabold text-sm text-[#363739] flex items-center gap-2">
                          {th.name}
                          {isSelected && (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#53383e] text-white">
                              Ativo
                            </span>
                          )}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#53383e]" />}
                      </div>

                      <p className="text-[11px] text-[#707174] mb-2.5">
                        {th.subtitle}
                      </p>

                      {/* Color Swatches */}
                      <div className="flex items-center gap-1.5">
                        {th.swatches.map((color, idx) => (
                          <div
                            key={idx}
                            className="flex-1 h-6 rounded-md shadow-xs border border-black/10 relative group"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* System Info & Security Card */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 border border-[#d8d8d8] text-xs text-[#707174] space-y-3">
              <div className="flex items-center gap-2 text-[#363739] font-bold">
                <KeyRound className="w-4 h-4 text-[#53383e]" />
                Segurança Corporativa & Integrações
              </div>
              <ul className="space-y-1.5 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Assinaturas Digitais e Ordens de Serviço em Folha A4 oficial</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Integração de Baixa Automática com PagBank & Operadoras</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Código de Barras EAN-13, Séries e Galeria de Fotos no Estoque</span>
                </li>
              </ul>
              <div className="pt-2 border-t border-[#d8d8d8] flex items-center justify-between text-[10px] text-[#707174]">
                <span>Suporte Técnico: {companySettings.phone || '(61) 99860-1113'}</span>
                <span>v2.8 · 2026</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-[#d8d8d8] bg-white px-4 sm:px-8 py-3 text-center text-xs text-[#707174] flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          <span className="font-bold text-[#363739]">
            {companySettings.tradeName || 'MP PISCINA Assistência Técnica Especializada'}
          </span>
          <span className="mx-2">·</span>
          <span>CNPJ: {companySettings.cnpj || '12.345.678/0001-90'}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span>{companySettings.city || 'Brasília'} - {companySettings.state || 'DF'}</span>
          <span>·</span>
          <span>Todos os direitos reservados</span>
        </div>
      </footer>
    </div>
  );
};
