import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SYSTEM_VERSION, SYSTEM_BUILD, SYSTEM_AUTHOR } from '../constants/version';

export const LoginView: React.FC = () => {
  const { login, companySettings } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const companyDisplayName =
    companySettings.tradeName || companySettings.companyName || 'GestãoPro ERP';

  const formattedStreet = [companySettings.street, companySettings.number]
    .filter(Boolean)
    .join(', ');
  const formattedDistrictCity = [
    companySettings.neighborhood,
    companySettings.city
      ? `${companySettings.city}${companySettings.state ? `/${companySettings.state}` : ''}`
      : ''
  ]
    .filter(Boolean)
    .join(' - ');
  const formattedAddress = [
    formattedStreet,
    formattedDistrictCity,
    companySettings.cep ? `CEP ${companySettings.cep}` : ''
  ]
    .filter(Boolean)
    .join(' · ');

  const companyMetaParts = [
    formattedAddress,
    companySettings.phone || ''
  ].filter(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');
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
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#06142b] text-white font-sans relative overflow-x-hidden selection:bg-blue-500 selection:text-white">
      {/* Fundo Azul Escuro com Profundidade Atmosférica */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(37,99,235,0.34),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(14,165,233,0.20),_transparent_55%),linear-gradient(160deg,_#0a2147_0%,_#06142b_52%,_#030a18_100%)]"
      />

      <div className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-8 sm:py-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Lado Esquerdo: Logo Cadastrada da Empresa + Identidade & Apresentação */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            {/* Bloco da Logo da Empresa Cadastrada no Sistema */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {companySettings.logoUrl ? (
                <div className="p-3.5 rounded-2xl bg-white/95 border border-blue-200/30 shadow-xl shrink-0">
                  <img
                    src={companySettings.logoUrl}
                    alt={companyDisplayName}
                    className="h-16 sm:h-20 max-w-[200px] object-contain"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-[#0d254f] border border-blue-400/35 flex items-center justify-center text-white font-black text-3xl shadow-xl shrink-0">
                  {companyDisplayName.substring(0, 2).toUpperCase()}
                </div>
              )}

              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {companyDisplayName}
                </div>
              </div>
            </div>

            {/* Chamada Principal e Subtítulo */}
            <div className="space-y-3 max-w-xl">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-white tracking-tight leading-[1.15]">
                  Gestão completa.
                </h1>
                <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-blue-200 tracking-tight mt-1.5">
                  Controle em tempo real.
                </p>
              </div>
              <p className="text-base sm:text-lg text-blue-100/85 leading-relaxed">
                Ordens de Serviço, Frente de Caixa (PDV), Vendas, Estoque e Financeiro integrados para sua equipe operar do balcão ao campo.
              </p>
            </div>

            {/* Metadados da Empresa em Texto Limpo */}
            {companyMetaParts.length > 0 && (
              <div className="pt-2 border-t border-blue-300/15 w-full max-w-lg text-sm text-blue-200/75 flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1">
                {companyMetaParts.map((part, index) => (
                  <React.Fragment key={part}>
                    {index > 0 && <span aria-hidden="true" className="text-blue-400/50">·</span>}
                    <span>{part}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Lado Direito: Cartão Escuro Translúcido de Login (Modelo da Imagem de Referência) */}
          <div className="lg:col-span-6 w-full">
            <div className="w-full max-w-lg mx-auto lg:ml-auto bg-[#0a1933]/88 backdrop-blur-md rounded-3xl p-7 sm:p-10 shadow-2xl border border-blue-300/20">
              <div className="text-center mb-7">
                <h2 className="text-2xl sm:text-[30px] font-bold text-white tracking-tight">
                  Entrar no Sistema
                </h2>
                <p className="text-sm sm:text-base text-blue-200/80 mt-1.5">
                  Informe seu usuário e senha de acesso
                </p>
              </div>

              {/* Mensagem de Erro */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-5 p-4 bg-rose-950/75 border border-rose-500/45 rounded-xl text-rose-100 text-sm font-medium flex items-start gap-2.5"
                >
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Mensagem Informativa (Esqueceu a senha) */}
              {infoMessage && (
                <div
                  role="status"
                  className="mb-5 p-4 bg-blue-950/80 border border-blue-400/40 rounded-xl text-blue-100 text-sm font-medium flex items-start gap-2.5"
                >
                  <Info className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                  <span>{infoMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="login-username"
                    className="block text-sm sm:text-base font-semibold text-blue-100 mb-2"
                  >
                    Usuário ou E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-300/70">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      id="login-username"
                      type="text"
                      required
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="seuusuario@empresa.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-[#050e1f]/90 border border-blue-300/25 rounded-xl text-base font-medium text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-sm sm:text-base font-semibold text-blue-100 mb-2"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-300/70">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha de acesso"
                      className="w-full pl-12 pr-12 py-3.5 bg-[#050e1f]/90 border border-blue-300/25 rounded-xl text-base font-medium text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute inset-y-0 right-0 px-3.5 flex items-center text-blue-300/80 hover:text-white cursor-pointer"
                      aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-sm pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer text-blue-100/90 font-medium select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-blue-300/40 bg-[#050e1f] text-blue-500 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Lembrar meu acesso</span>
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setInfoMessage(
                        'Para redefinição ou criação de senha, solicite ao administrador do sistema em Configurações.'
                      )
                    }
                    className="text-blue-300 hover:text-white hover:underline font-semibold cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <span>Autenticando...</span>
                  ) : (
                    <>
                      <span>Entrar no Sistema</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé com Créditos e Versionamento em Texto Limpo */}
      <footer className="relative z-10 w-full py-5 text-center text-sm text-blue-200/75 space-y-1 px-4 border-t border-blue-300/10">
        <div className="flex items-center justify-center gap-2.5 flex-wrap">
          <span>
            Sistema desenvolvido por{' '}
            <strong className="font-bold text-white tracking-wide">{SYSTEM_AUTHOR}</strong>
          </span>
          <span aria-hidden="true" className="text-blue-400/50">·</span>
          <span className="font-mono text-blue-100">
            {SYSTEM_VERSION} (Build {SYSTEM_BUILD})
          </span>
        </div>
        <div className="text-xs sm:text-sm text-blue-200/60">
          {companyDisplayName} · Todos os direitos reservados
        </div>
      </footer>
    </div>
  );
};
