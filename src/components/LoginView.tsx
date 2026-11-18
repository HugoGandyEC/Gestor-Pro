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
import { SYSTEM_VERSION, SYSTEM_BUILD, SYSTEM_AUTHOR, SYSTEM_NAME } from '../constants/version';
import { FireBrandIcon } from './FireBrandIcon';

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
    companySettings.tradeName || companySettings.companyName || SYSTEM_NAME;

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
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#FFFBF2] text-[#1C1917] font-sans relative overflow-x-hidden selection:bg-orange-500 selection:text-white">
      {/* Fundo Alegre e Luminoso nas Cores do Favicon (Amarelo Solar + Laranja Chama) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(250,204,21,0.34),_transparent_52%),radial-gradient(ellipse_at_bottom_right,_rgba(249,115,22,0.28),_transparent_54%),radial-gradient(ellipse_at_center_right,_rgba(251,146,60,0.16),_transparent_48%),linear-gradient(155deg,_#FFFBEB_0%,_#FFF7ED_50%,_#FFEDD5_100%)]"
      />

      <div className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-8 sm:py-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Lado Esquerdo: Chama Oficial FIRE GESTÃO / Logo da Empresa + Apresentação */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {companySettings.logoUrl ? (
                <div className="p-3.5 rounded-2xl bg-white border border-orange-200/80 shadow-lg shadow-orange-500/10 shrink-0">
                  <img
                    src={companySettings.logoUrl}
                    alt={companyDisplayName}
                    referrerPolicy="no-referrer"
                    className="h-16 sm:h-20 max-w-[200px] object-contain"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7] to-[#FFEDD5] border border-orange-300/70 flex items-center justify-center shadow-lg shadow-orange-500/15 shrink-0">
                  <FireBrandIcon className="w-14 h-14 drop-shadow-xs" />
                </div>
              )}

              <div>
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1C1917]">
                  {companyDisplayName}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-[#C2410C] mt-0.5">
                  Ordens de Serviço · PDV · Vendas · Financeiro
                </div>
              </div>
            </div>

            {/* Chamada Principal e Subtítulo */}
            <div className="space-y-3 max-w-xl">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#1C1917] tracking-tight leading-[1.14] [text-wrap:balance]">
                  Gestão completa.
                </h1>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-[#C2410C] via-[#EA580C] to-[#D97706] bg-clip-text text-transparent tracking-tight mt-1.5">
                  Controle em tempo real.
                </p>
              </div>
              <p className="text-base sm:text-lg text-[#57534E] leading-relaxed">
                Ordens de Serviço, Frente de Caixa (PDV), Vendas, Estoque e Financeiro integrados para sua equipe operar do balcão ao campo com energia e precisão.
              </p>
            </div>

            {/* Metadados da Empresa em Texto Limpo */}
            {companyMetaParts.length > 0 && (
              <div className="pt-3 border-t border-orange-200/80 w-full max-w-lg text-sm text-[#78716C] flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1">
                {companyMetaParts.map((part, index) => (
                  <React.Fragment key={part}>
                    {index > 0 && <span aria-hidden="true" className="text-orange-400">·</span>}
                    <span>{part}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Lado Direito: Cartão Luminoso de Login com Assinatura Amarelo + Laranja */}
          <div className="lg:col-span-6 w-full">
            <div className="w-full max-w-lg mx-auto lg:ml-auto bg-white/95 backdrop-blur-md rounded-3xl overflow-hidden shadow-[0_24px_60px_-18px_rgba(234,88,12,0.22)] border border-orange-200/80">
              {/* Faixa Superior nas Cores da Chama */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#FACC15] via-[#F97316] to-[#EA580C]" />

              <div className="p-7 sm:p-10">
                <div className="text-center mb-7">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FEF9C3] to-[#FFEDD5] border border-orange-200 mb-3 shadow-xs">
                    <FireBrandIcon className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl sm:text-[30px] font-extrabold text-[#1C1917] tracking-tight">
                    Entrar no {SYSTEM_NAME}
                  </h2>
                  <p className="text-sm sm:text-base text-[#78716C] mt-1.5">
                    Informe seu usuário e senha de acesso
                  </p>
                </div>

                {/* Mensagem de Erro */}
                {errorMessage && (
                  <div
                    role="alert"
                    className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm font-medium flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Mensagem Informativa (Esqueceu a senha) */}
                {infoMessage && (
                  <div
                    role="status"
                    className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm font-medium flex items-start gap-2.5"
                  >
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{infoMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="login-username"
                      className="block text-sm sm:text-base font-semibold text-[#292524] mb-2"
                    >
                      Usuário ou E-mail
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-orange-500/80">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        id="login-username"
                        type="text"
                        required
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="admin"
                        className="w-full pl-12 pr-4 py-3.5 bg-[#FFFDF9] border border-orange-200 rounded-xl text-base font-medium text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-hidden focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="login-password"
                      className="block text-sm sm:text-base font-semibold text-[#292524] mb-2"
                    >
                      Senha
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-orange-500/80">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Digite sua senha de acesso"
                        className="w-full pl-12 pr-12 py-3.5 bg-[#FFFDF9] border border-orange-200 rounded-xl text-base font-medium text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-hidden focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute inset-y-0 right-0 px-3.5 flex items-center text-[#78716C] hover:text-[#EA580C] cursor-pointer transition-colors"
                        aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-sm pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer text-[#57534E] font-medium select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-orange-300 bg-white accent-[#EA580C] focus:ring-orange-500 cursor-pointer"
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
                      className="text-[#C2410C] hover:text-[#9A3412] hover:underline font-semibold cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#C2410C] via-[#EA580C] to-[#F59E0B] hover:from-[#9A3412] hover:via-[#C2410C] hover:to-[#D97706] text-white font-bold text-base shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75"
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
      </div>

      {/* Rodapé com Créditos e Versionamento em Texto Limpo */}
      <footer className="relative z-10 w-full py-5 text-center text-sm text-[#78716C] space-y-1 px-4 border-t border-orange-200/70 bg-white/40 backdrop-blur-xs">
        <div className="flex items-center justify-center gap-2.5 flex-wrap">
          <span>
            Sistema desenvolvido por{' '}
            <strong className="font-bold text-[#1C1917] tracking-wide">{SYSTEM_AUTHOR}</strong>
          </span>
          <span aria-hidden="true" className="text-orange-400">·</span>
          <span className="font-mono text-[#9A3412] font-semibold">
            {SYSTEM_VERSION} (Build {SYSTEM_BUILD})
          </span>
        </div>
        <div className="text-xs sm:text-sm text-[#78716C]">
          {companyDisplayName} · Todos os direitos reservados
        </div>
      </footer>
    </div>
  );
};
