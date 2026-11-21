import React, { useState } from 'react';
import {
  UserPlus,
  X,
  Search,
  Loader2,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Building2,
  User
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Client, CustomerType } from '../../types';

interface QuickClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (client: Client) => void;
}

export const QuickClientModal: React.FC<QuickClientModalProps> = ({
  isOpen,
  onClose,
  onClientCreated
}) => {
  const { addClient, lookupCep, lookupCnpj } = useApp();

  const [personType, setPersonType] = useState<'PF' | 'PJ'>('PF');
  const [customerType, setCustomerType] = useState<CustomerType>('varejo');
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [stateUf, setStateUf] = useState('');
  const [notes, setNotes] = useState('');

  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setPersonType('PF');
    setCustomerType('varejo');
    setName('');
    setTradeName('');
    setDocument('');
    setPhone('');
    setEmail('');
    setCep('');
    setStreet('');
    setNumber('');
    setComplement('');
    setNeighborhood('');
    setCity('');
    setStateUf('');
    setNotes('');
    setErrorMsg(null);
  };

  const handleLookupCep = async () => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length < 8) {
      setErrorMsg('Informe um CEP válido com 8 dígitos para buscar o endereço.');
      return;
    }
    setErrorMsg(null);
    setIsSearchingCep(true);
    try {
      const res = await lookupCep(digits);
      if (res) {
        if (res.street) setStreet(res.street);
        if (res.neighborhood) setNeighborhood(res.neighborhood);
        if (res.city) setCity(res.city);
        if (res.state) setStateUf(res.state);
      } else {
        setErrorMsg('CEP não localizado. Preencha o endereço manualmente.');
      }
    } catch {
      setErrorMsg('Não foi possível consultar o CEP no momento.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleLookupCnpj = async () => {
    const digits = document.replace(/\D/g, '');
    if (digits.length !== 14) {
      setErrorMsg('Informe um CNPJ completo com 14 dígitos para consultar.');
      return;
    }
    setErrorMsg(null);
    setIsSearchingCnpj(true);
    try {
      const res = await lookupCnpj(digits);
      if (res) {
        setPersonType('PJ');
        if (res.name) setName(res.name);
        if (res.tradeName) setTradeName(res.tradeName);
        if (res.phone) setPhone(res.phone);
        if (res.email) setEmail(res.email);
        if (res.cep) setCep(res.cep);
        if (res.street) setStreet(res.street);
        if (res.number) setNumber(res.number);
        if (res.neighborhood) setNeighborhood(res.neighborhood);
        if (res.city) setCity(res.city);
        if (res.state) setStateUf(res.state);
      } else {
        setErrorMsg('CNPJ não localizado na consulta automática.');
      }
    } catch {
      setErrorMsg('Não foi possível consultar o CNPJ agora.');
    } finally {
      setIsSearchingCnpj(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Informe o nome do cliente (ou Razão Social).');
      return;
    }

    const created = addClient({
      personType,
      customerType,
      name: name.trim(),
      tradeName: tradeName.trim() || undefined,
      document: document.trim(),
      phone: phone.trim() || '',
      email: email.trim() || '',
      cep: cep.trim() || '',
      street: street.trim() || '',
      number: number.trim() || '',
      complement: complement.trim() || undefined,
      neighborhood: neighborhood.trim() || '',
      city: city.trim() || '',
      state: stateUf.trim().toUpperCase() || '',
      notes: notes.trim() || undefined,
      addresses: street.trim()
        ? [
            {
              id: `addr-${Date.now()}`,
              title: 'Endereço Principal',
              isDefault: true,
              cep: cep.trim(),
              street: street.trim(),
              number: number.trim() || 'S/N',
              complement: complement.trim() || undefined,
              neighborhood: neighborhood.trim(),
              city: city.trim(),
              state: stateUf.trim().toUpperCase()
            }
          ]
        : undefined
    });

    resetForm();
    onClientCreated(created);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#53383e] to-[#363739] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15">
              <UserPlus className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Cadastro Rápido de Cliente</h3>
              <p className="text-[11px] text-white/80">
                Cadastre o cliente sem sair da tela de Ordens de Serviço — ele já ficará disponível na hora.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar cadastro de cliente"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Tipo de Pessoa & Perfil */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tipo de Cadastro</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPersonType('PF')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-bold transition-colors cursor-pointer ${
                    personType === 'PF' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Pessoa Física
                </button>
                <button
                  type="button"
                  onClick={() => setPersonType('PJ')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-bold transition-colors cursor-pointer ${
                    personType === 'PJ' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Pessoa Jurídica
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Tabela / Perfil Comercial</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCustomerType('varejo')}
                  className={`py-1.5 rounded-md font-bold transition-colors cursor-pointer ${
                    customerType === 'varejo' ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Varejo (Padrão)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerType('atacado')}
                  className={`py-1.5 rounded-md font-bold transition-colors cursor-pointer ${
                    customerType === 'atacado' ? 'bg-white text-purple-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Atacado / Revenda
                </button>
              </div>
            </div>
          </div>

          {/* Nome + CPF/CNPJ */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-7">
              <label className="block text-slate-700 font-bold mb-1">
                {personType === 'PJ' ? 'Razão Social *' : 'Nome Completo *'}
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={personType === 'PJ' ? 'Ex: Condomínio Residencial Solar Ltda' : 'Ex: João Carlos da Silva'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-slate-700 font-bold mb-1">
                {personType === 'PJ' ? 'CNPJ (Opcional)' : 'CPF (Opcional)'}
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  placeholder={personType === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'}
                  className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-hidden"
                />
                {personType === 'PJ' && (
                  <button
                    type="button"
                    onClick={handleLookupCnpj}
                    disabled={isSearchingCnpj}
                    className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    title="Consultar CNPJ automaticamente"
                  >
                    {isSearchingCnpj ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {personType === 'PJ' && (
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nome Fantasia (Opcional)</label>
              <input
                type="text"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                placeholder="Ex: Clube Águas Claras"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
              />
            </div>
          )}

          {/* Contato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                E-mail (Opcional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@email.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Endereço de Atendimento */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold text-[11px] uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              Endereço / Local do Atendimento
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-4">
                <label className="block text-slate-600 font-semibold mb-1">CEP</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="00000-000"
                    className="flex-1 min-w-0 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleLookupCep}
                    disabled={isSearchingCep}
                    className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-bold shrink-0 cursor-pointer"
                    title="Buscar endereço pelo CEP"
                  >
                    {isSearchingCep ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-slate-600 font-semibold mb-1">Rua / Avenida</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Rua das Palmeiras"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Número</label>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="120"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-slate-600 font-semibold mb-1">Bairro</label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Centro"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-slate-600 font-semibold mb-1">Cidade</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Cidade"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">UF</label>
                <input
                  type="text"
                  maxLength={2}
                  value={stateUf}
                  onChange={(e) => setStateUf(e.target.value.toUpperCase())}
                  placeholder="SP"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 uppercase font-mono text-center"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Compl.</label>
                <input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Casa / Ap"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Observações / Ponto de Referência (Opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Portão azul, falar com zelador Marcos..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Cliente e Selecionar na OS</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
