import React, { useState, useMemo } from 'react';
import { 
  UserSquare2, 
  Plus, 
  Search, 
  Upload, 
  Download, 
  Phone, 
  Mail, 
  MapPin, 
  Edit3, 
  Trash2, 
  FileSpreadsheet, 
  CheckCircle2, 
  Building2,
  User,
  MessageSquare,
  Wrench,
  Navigation,
  FileText,
  BadgeCheck,
  Star,
  Copy,
  Info,
  Calendar,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Client, ClientAddress } from '../types';

export const ClientsView: React.FC = () => {
  const { 
    clients, 
    serviceOrders,
    addClient, 
    updateClient, 
    deleteClient, 
    lookupCep, 
    lookupCnpj, 
    importCsvClients 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pj' | 'pf'>('all');

  // Client Modal State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  // Dynamic Type Choice: 'PJ' vs 'PF'
  const [personType, setPersonType] = useState<'PJ' | 'PF'>('PJ');

  // Common Fields
  const [cName, setCName] = useState('');
  const [cTradeName, setCTradeName] = useState('');
  const [cDocument, setCDocument] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cSecondaryPhone, setCSecondaryPhone] = useState('');
  const [cNotes, setCNotes] = useState('');

  // PF Specific
  const [cRg, setCRg] = useState('');
  const [cBirthDate, setCBirthDate] = useState('');

  // PJ Specific
  const [cStateRegistration, setCStateRegistration] = useState('');
  const [cContactPerson, setCContactPerson] = useState('');

  // Multi-Address State
  const [addresses, setAddresses] = useState<ClientAddress[]>([
    {
      id: 'addr-init',
      title: 'Sede Principal',
      isDefault: true,
      cep: '01001-000',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: 'São Paulo',
      state: 'SP',
      referencePoint: ''
    }
  ]);

  const [isLoadingLookup, setIsLoadingLookup] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);

  // Modal to inspect multiple addresses for a client
  const [viewAddressesClient, setViewAddressesClient] = useState<Client | null>(null);

  // CSV Import Modal State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [csvResult, setCsvResult] = useState<string | null>(null);

  // Quick stats
  const totalClients = clients.length;
  const pjCount = clients.filter(c => (c.personType === 'PJ') || (c.document.replace(/\D/g, '').length === 14)).length;
  const pfCount = clients.filter(c => (c.personType === 'PF') || (c.document.replace(/\D/g, '').length !== 14)).length;
  
  // Clients with active service orders
  const clientsWithActiveOSCount = useMemo(() => {
    const activeClientIds = new Set(
      serviceOrders
        .filter(os => !['entregue_finalizada', 'cancelada'].includes(os.status))
        .map(os => os.clientId)
    );
    return clients.filter(c => activeClientIds.has(c.id)).length;
  }, [clients, serviceOrders]);

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const isPJ = client.personType === 'PJ' || client.document.replace(/\D/g, '').length === 14;
      if (typeFilter === 'pj' && !isPJ) return false;
      if (typeFilter === 'pf' && isPJ) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();

      // Search in addresses titles and streets too
      const matchesAddress = client.addresses?.some(a => 
        a.title.toLowerCase().includes(term) ||
        a.street.toLowerCase().includes(term) ||
        a.city.toLowerCase().includes(term) ||
        (a.referencePoint && a.referencePoint.toLowerCase().includes(term))
      );

      return (
        client.name.toLowerCase().includes(term) ||
        (client.tradeName && client.tradeName.toLowerCase().includes(term)) ||
        client.document.includes(term) ||
        (client.rg && client.rg.toLowerCase().includes(term)) ||
        (client.contactPerson && client.contactPerson.toLowerCase().includes(term)) ||
        client.city.toLowerCase().includes(term) ||
        client.phone.includes(term) ||
        client.email.toLowerCase().includes(term) ||
        Boolean(matchesAddress)
      );
    });
  }, [clients, searchTerm, typeFilter]);

  // Address Handlers
  const handleAddAddress = () => {
    const nextNumber = addresses.length + 1;
    const defaultTitle = personType === 'PJ' 
      ? `Filial / Obra 0${nextNumber}` 
      : `Endereço 0${nextNumber}`;
      
    const newAddr: ClientAddress = {
      id: `addr-${Date.now()}-${nextNumber}`,
      title: defaultTitle,
      isDefault: addresses.length === 0,
      cep: '01001-000',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: 'São Paulo',
      state: 'SP',
      referencePoint: ''
    };
    setAddresses(prev => [...prev, newAddr]);
  };

  const handleRemoveAddress = (index: number) => {
    if (addresses.length <= 1) return;
    const wasDefault = addresses[index].isDefault;
    const updated = addresses.filter((_, i) => i !== index);
    if (wasDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }
    setAddresses(updated);
  };

  const handleSetDefaultAddress = (index: number) => {
    setAddresses(prev => prev.map((addr, i) => ({
      ...addr,
      isDefault: i === index
    })));
  };

  const handleUpdateAddressField = (index: number, field: keyof ClientAddress, value: any) => {
    setAddresses(prev => prev.map((addr, i) => {
      if (i === index) {
        return { ...addr, [field]: value };
      }
      return addr;
    }));
  };

  // Lookup CEP for a specific address
  const handleCepSearchForAddress = async (index: number) => {
    const targetAddr = addresses[index];
    if (!targetAddr.cep || targetAddr.cep.replace(/\D/g, '').length < 8) {
      setLookupMessage(`Informe um CEP válido para o endereço "${targetAddr.title}".`);
      return;
    }
    setIsLoadingLookup(true);
    setLookupMessage(null);
    try {
      const data = await lookupCep(targetAddr.cep);
      if (data) {
        setAddresses(prev => prev.map((addr, i) => {
          if (i === index) {
            return {
              ...addr,
              street: data.street || addr.street,
              neighborhood: data.neighborhood || addr.neighborhood,
              city: data.city || addr.city,
              state: data.state || addr.state
            };
          }
          return addr;
        }));
        setLookupMessage(`Endereço "${targetAddr.title}" atualizado via ViaCEP: ${data.street}, ${data.neighborhood} - ${data.city}/${data.state}`);
      } else {
        setLookupMessage('CEP não localizado no ViaCEP.');
      }
    } catch {
      setLookupMessage('Erro ao consultar CEP.');
    } finally {
      setIsLoadingLookup(false);
    }
  };

  // Lookup CNPJ via BrasilAPI / Receita
  const handleCnpjSearch = async () => {
    const cleanDoc = cDocument.replace(/\D/g, '');
    if (cleanDoc.length !== 14) {
      setLookupMessage('Para consulta na Receita Federal, digite um CNPJ com 14 dígitos.');
      return;
    }
    setIsLoadingLookup(true);
    setLookupMessage(null);
    try {
      const data = await lookupCnpj(cDocument);
      if (data) {
        setCName(data.name || '');
        setCTradeName(data.tradeName || '');
        if (data.phone) setCPhone(data.phone);
        if (data.email) setCEmail(data.email);

        // Update first address with Receita Federal data
        setAddresses(prev => {
          if (prev.length === 0) return prev;
          const [first, ...rest] = prev;
          return [
            {
              ...first,
              title: first.title || 'Sede Principal (Receita)',
              cep: data.cep || first.cep,
              street: data.street || first.street,
              number: data.number || first.number,
              neighborhood: (data as any).neighborhood || first.neighborhood,
              city: data.city || first.city,
              state: data.state || first.state,
              isDefault: true
            },
            ...rest
          ];
        });

        setLookupMessage(`Dados da Receita obtidos: ${data.name}. Endereço principal preenchido.`);
      } else {
        setLookupMessage('CNPJ não encontrado ou serviço da Receita indisponível.');
      }
    } catch {
      setLookupMessage('Erro ao consultar CNPJ.');
    } finally {
      setIsLoadingLookup(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingClientId(null);
    setPersonType('PJ');
    setCName('');
    setCTradeName('');
    setCDocument('');
    setCRg('');
    setCBirthDate('');
    setCStateRegistration('');
    setCContactPerson('');
    setCEmail('');
    setCPhone('');
    setCSecondaryPhone('');
    setCNotes('');
    setLookupMessage(null);

    // Initial default address
    setAddresses([
      {
        id: `addr-${Date.now()}`,
        title: 'Sede Principal',
        isDefault: true,
        cep: '01001-000',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: 'São Paulo',
        state: 'SP',
        referencePoint: ''
      }
    ]);

    setIsClientModalOpen(true);
  };

  const handleOpenEdit = (c: Client) => {
    setEditingClientId(c.id);
    const isPj = c.personType ? c.personType === 'PJ' : c.document.replace(/\D/g, '').length === 14;
    setPersonType(isPj ? 'PJ' : 'PF');
    setCName(c.name);
    setCTradeName(c.tradeName || '');
    setCDocument(c.document);
    setCRg(c.rg || '');
    setCBirthDate(c.birthDate || '');
    setCStateRegistration(c.stateRegistration || '');
    setCContactPerson(c.contactPerson || '');
    setCEmail(c.email);
    setCPhone(c.phone);
    setCSecondaryPhone(c.secondaryPhone || '');
    setCNotes(c.notes || '');
    setLookupMessage(null);

    // If client has stored multiple addresses, use them; otherwise, build from legacy fields
    if (c.addresses && c.addresses.length > 0) {
      setAddresses(c.addresses);
    } else {
      setAddresses([
        {
          id: `addr-${c.id}-1`,
          title: isPj ? 'Sede Principal' : 'Residência Principal',
          isDefault: true,
          cep: c.cep || '01001-000',
          street: c.street || '',
          number: c.number || '',
          complement: c.complement || '',
          neighborhood: c.neighborhood || '',
          city: c.city || 'São Paulo',
          state: c.state || 'SP',
          referencePoint: ''
        }
      ]);
    }

    setIsClientModalOpen(true);
  };

  // Change Person Type handler
  const handleSwitchPersonType = (newType: 'PJ' | 'PF') => {
    if (newType === personType) return;
    setPersonType(newType);

    // If address title was still the default one, adjust title suggestion
    setAddresses(prev => prev.map((addr, idx) => {
      if (idx === 0) {
        if (newType === 'PJ' && addr.title === 'Residência Principal') {
          return { ...addr, title: 'Sede Principal' };
        }
        if (newType === 'PF' && addr.title === 'Sede Principal') {
          return { ...addr, title: 'Residência Principal' };
        }
      }
      return addr;
    }));
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) return;

    // Pick default address or first address
    const defaultAddr = addresses.find(a => a.isDefault) || addresses[0] || {
      id: `addr-${Date.now()}`,
      title: personType === 'PJ' ? 'Sede' : 'Residência',
      isDefault: true,
      cep: '01001-000',
      street: 'Rua Principal',
      number: '100',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP'
    };

    const clientPayload: Omit<Client, 'id' | 'createdAt'> = {
      personType,
      name: cName.trim(),
      tradeName: cTradeName.trim() || undefined,
      document: cDocument.trim(),
      rg: personType === 'PF' ? (cRg.trim() || undefined) : undefined,
      birthDate: personType === 'PF' ? (cBirthDate.trim() || undefined) : undefined,
      stateRegistration: personType === 'PJ' ? (cStateRegistration.trim() || undefined) : undefined,
      contactPerson: personType === 'PJ' ? (cContactPerson.trim() || undefined) : undefined,
      email: cEmail.trim() || 'cliente@contato.com.br',
      phone: cPhone.trim() || '(11) 98765-4321',
      secondaryPhone: cSecondaryPhone.trim() || undefined,
      // Keep root address in sync with primary/default address
      cep: defaultAddr.cep || '01001-000',
      street: defaultAddr.street || 'Rua Principal',
      number: defaultAddr.number || '100',
      complement: defaultAddr.complement || undefined,
      neighborhood: defaultAddr.neighborhood || 'Centro',
      city: defaultAddr.city || 'São Paulo',
      state: defaultAddr.state || 'SP',
      addresses: addresses.map(a => ({
        ...a,
        title: a.title.trim() || 'Endereço',
        street: a.street.trim() || 'Rua',
        number: a.number.trim() || 'S/N',
        neighborhood: a.neighborhood.trim() || 'Bairro',
        city: a.city.trim() || 'São Paulo',
        state: a.state.trim().toUpperCase() || 'SP'
      })),
      notes: cNotes.trim() || undefined
    };

    if (editingClientId) {
      updateClient(editingClientId, clientPayload);
    } else {
      addClient(clientPayload);
    }

    setIsClientModalOpen(false);
  };

  const handleExportCsv = () => {
    const headers = [
      'ID', 
      'Tipo_Pessoa', 
      'Razao_Social_Nome', 
      'Nome_Fantasia', 
      'CPF_CNPJ', 
      'RG',
      'Inscricao_Estadual',
      'Contato_Responsavel',
      'Email', 
      'Telefone', 
      'Telefone_Secundario',
      'Qtd_Enderecos',
      'Endereco_Principal_Titulo',
      'Endereco_Principal_Logradouro', 
      'Endereco_Principal_Numero', 
      'Endereco_Principal_Bairro', 
      'Endereco_Principal_Cidade', 
      'Endereco_Principal_UF', 
      'Data_Cadastro'
    ];

    const rows = clients.map(c => {
      const isPj = c.personType === 'PJ' || c.document.replace(/\D/g, '').length === 14;
      const primaryAddr = c.addresses?.find(a => a.isDefault) || c.addresses?.[0] || {
        title: 'Principal',
        street: c.street,
        number: c.number,
        neighborhood: c.neighborhood,
        city: c.city,
        state: c.state
      };

      return [
        c.id,
        isPj ? 'PJ' : 'PF',
        `"${c.name.replace(/"/g, '""')}"`,
        `"${(c.tradeName || '').replace(/"/g, '""')}"`,
        c.document,
        `"${(c.rg || '').replace(/"/g, '""')}"`,
        `"${(c.stateRegistration || '').replace(/"/g, '""')}"`,
        `"${(c.contactPerson || '').replace(/"/g, '""')}"`,
        c.email,
        c.phone,
        c.secondaryPhone || '',
        c.addresses ? c.addresses.length : 1,
        `"${primaryAddr.title.replace(/"/g, '""')}"`,
        `"${primaryAddr.street.replace(/"/g, '""')}"`,
        primaryAddr.number,
        `"${primaryAddr.neighborhood.replace(/"/g, '""')}"`,
        `"${primaryAddr.city.replace(/"/g, '""')}"`,
        primaryAddr.state,
        c.createdAt
      ];
    });

    const csvData = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes_enderecos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessCsv = () => {
    if (!csvContent.trim()) return;
    const res = importCsvClients(csvContent);
    setCsvResult(res.message);
  };

  // Helper to get client orders
  const getClientOrdersCount = (clientId: string) => {
    return serviceOrders.filter(os => os.clientId === clientId).length;
  };

  // Suggestions for address titles based on type
  const addressTitleSuggestions = personType === 'PJ'
    ? ['Sede Principal', 'Filial 01', 'Obra / Instalação', 'Galpão / Depósito', 'Fábrica', 'Portaria de Serviços']
    : ['Residência', 'Obra / Construção', 'Casa de Campo / Chácara', 'Casa de Praia', 'Consultório / Escritório', 'Local de Entrega'];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#d8d8d8]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#f6eff1] text-[#53383e] rounded-xl border border-[#d8d8d8]">
              <UserSquare2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#363739] tracking-tight">
                Cadastro de Clientes
              </h1>
              <p className="text-xs text-[#707174] mt-0.5">
                Escolha dinâmica entre Pessoa Jurídica (CNPJ) e Pessoa Física (CPF/RG) com suporte a múltiplos endereços identificados por título de referência.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCsvContent(`Nome;Documento;Telefone;Email;CEP;Rua;Numero
Condomínio Solar das Águas;33.444.555/0001-88;(11) 94444-5555;contato@solardasaguas.com;04538-132;Rua Tabapuã;145
Indústria Química Alpha Ltda;55.666.777/0001-99;(11) 3211-9900;compras@alphasa.com.br;09015-000;Av das Indústrias;800
Dr. Eduardo Prado;123.456.789-00;(11) 98888-7777;eduardo@prado.com;01452-002;Av Faria Lima;2200`);
              setCsvResult(null);
              setIsCsvModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#363739] bg-white border border-[#d8d8d8] rounded-lg hover:bg-[#f4f5f6] transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#707174]" />
            Importar CSV
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#363739] bg-white border border-[#d8d8d8] rounded-lg hover:bg-[#f4f5f6] transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#707174]" />
            Exportar CSV
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Clientes</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalClients}</h3>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Base ativa cadastrada</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <UserSquare2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pessoa Jurídica (PJ)</p>
            <h3 className="text-2xl font-bold text-indigo-900 mt-1">{pjCount}</h3>
            <span className="text-[11px] text-indigo-600 font-medium mt-0.5 block">CNPJ / Múltiplas sedes e filiais</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pessoa Física (PF)</p>
            <h3 className="text-2xl font-bold text-emerald-800 mt-1">{pfCount}</h3>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">CPF & RG / Residências e chácaras</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Com OS em Aberto</p>
            <h3 className="text-2xl font-bold text-amber-700 mt-1">{clientsWithActiveOSCount}</h3>
            <span className="text-[11px] text-amber-600 font-medium mt-0.5 block">Em atendimento técnico</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nome, fantasia, CPF/CNPJ, RG, contato ou título de endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-[#707174]">Filtrar por:</span>
            <div className="inline-flex rounded-lg border border-[#d8d8d8] p-0.5 bg-[#f4f5f6] text-xs">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${typeFilter === 'all' ? 'bg-[#53383e] text-white shadow-2xs' : 'text-[#363739] hover:bg-[#d8d8d8]/50'}`}
              >
                Todos ({clients.length})
              </button>
              <button
                onClick={() => setTypeFilter('pj')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${typeFilter === 'pj' ? 'bg-[#53383e] text-white font-semibold shadow-2xs' : 'text-[#363739] hover:bg-[#d8d8d8]/50'}`}
              >
                Pessoa Jurídica ({pjCount})
              </button>
              <button
                onClick={() => setTypeFilter('pf')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${typeFilter === 'pf' ? 'bg-[#363739] text-white font-semibold shadow-2xs' : 'text-[#363739] hover:bg-[#d8d8d8]/50'}`}
              >
                Pessoa Física ({pfCount})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Tipo & Documentos</th>
                <th className="px-4 py-3">Cliente / Razão Social</th>
                <th className="px-4 py-3">Contato & Responsável</th>
                <th className="px-4 py-3">Endereços & Locais de Referência</th>
                <th className="px-4 py-3 text-center">Ordens de Serviço</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <UserSquare2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Nenhum cliente encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const isPJ = client.personType === 'PJ' || client.document.replace(/\D/g, '').length === 14;
                  const ordersCount = getClientOrdersCount(client.id);
                  const cleanPhone = client.phone.replace(/\D/g, '');
                  const clientAddresses = client.addresses && client.addresses.length > 0 
                    ? client.addresses 
                    : [{
                        id: 'default',
                        title: 'Principal',
                        isDefault: true,
                        cep: client.cep,
                        street: client.street,
                        number: client.number,
                        complement: client.complement,
                        neighborhood: client.neighborhood,
                        city: client.city,
                        state: client.state,
                        referencePoint: ''
                      }];

                  const primaryAddress = clientAddresses.find(a => a.isDefault) || clientAddresses[0];

                  return (
                    <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Tipo & Documentos */}
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                            isPJ 
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {isPJ ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                            {isPJ ? 'Pessoa Jurídica' : 'Pessoa Física'}
                          </span>

                          <div className="font-mono text-slate-900 font-semibold text-[11px] mt-0.5">
                            {client.document || <span className="text-slate-400 font-sans italic text-[10px]">Sem documento</span>}
                          </div>

                          {/* RG para Pessoa Física */}
                          {!isPJ && client.rg && (
                            <div className="text-[10px] text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 w-fit">
                              <span className="font-bold text-slate-500">RG:</span> {client.rg}
                            </div>
                          )}

                          {/* Inscrição Estadual para PJ */}
                          {isPJ && client.stateRegistration && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              <span className="font-semibold">IE:</span> {client.stateRegistration}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Nome / Razão Social */}
                      <td className="px-4 py-3 align-top">
                        <div className="font-bold text-slate-900 text-sm">{client.name}</div>
                        {client.tradeName && (
                          <div className="text-[11px] text-slate-500 font-medium">
                            {isPJ ? 'Nome Fantasia:' : 'Apelido / Ref:'} {client.tradeName}
                          </div>
                        )}
                        {client.notes && (
                          <div className="text-[10px] text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 mt-1.5 inline-block border border-amber-200">
                            Obs: {client.notes}
                          </div>
                        )}
                      </td>

                      {/* Contato & Responsável */}
                      <td className="px-4 py-3 align-top">
                        {client.contactPerson && (
                          <div className="text-[11px] font-semibold text-slate-800 flex items-center gap-1 mb-1">
                            <BadgeCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span>{client.contactPerson}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="font-medium">{client.phone}</span>
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/55${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 ml-1 p-0.5 rounded hover:bg-emerald-50"
                              title="Abrir WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        {client.secondaryPhone && (
                          <div className="text-[10px] text-slate-500 mt-0.5 pl-4">
                            Sec: {client.secondaryPhone}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <a href={`mailto:${client.email}`} className="hover:underline text-[11px]">
                            {client.email}
                          </a>
                        </div>
                      </td>

                      {/* Endereços & Locais de Referência */}
                      <td className="px-4 py-3 align-top max-w-xs">
                        <div className="space-y-1.5">
                          {/* Endereço Principal */}
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-blue-600" />
                                {primaryAddress.title}
                              </span>
                              <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded">
                                Principal
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600">
                              {primaryAddress.street}, {primaryAddress.number} {primaryAddress.complement ? `(${primaryAddress.complement})` : ''}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {primaryAddress.neighborhood} - {primaryAddress.city}/{primaryAddress.state} • CEP {primaryAddress.cep}
                            </div>
                            {primaryAddress.referencePoint && (
                              <div className="text-[9px] text-amber-700 mt-1 italic">
                                Ref: {primaryAddress.referencePoint}
                              </div>
                            )}
                          </div>

                          {/* Se houver outros endereços */}
                          {clientAddresses.length > 1 && (
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] font-semibold text-slate-500">
                                + {clientAddresses.length - 1} outro(s) endereço(s)
                              </span>
                              <button
                                type="button"
                                onClick={() => setViewAddressesClient(client)}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-0.5"
                              >
                                Ver todos ({clientAddresses.length})
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Ordens de Serviço */}
                      <td className="px-4 py-3 align-top text-center">
                        <span className={`inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-full text-[11px] ${ordersCount > 0 ? 'bg-blue-100 text-blue-800 font-semibold' : 'bg-slate-100 text-slate-500'}`}>
                          {ordersCount} {ordersCount === 1 ? 'OS' : 'OS'}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {clientAddresses.length > 1 && (
                            <button
                              onClick={() => setViewAddressesClient(client)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                              title="Ver Todos os Endereços"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(client)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Editar Cadastro"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja realmente remover o cliente "${client.name}"?`)) {
                                deleteClient(client.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Excluir Cliente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CADASTRO / EDIÇÃO DE CLIENTE (COM SELETOR PJ / PF E MÚLTIPLOS ENDEREÇOS) */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${personType === 'PJ' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {personType === 'PJ' ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingClientId ? 'Editar Cadastro de Cliente' : 'Novo Cliente'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Preencha os dados e gerencie múltiplos endereços com títulos de referência.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsClientModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-5 text-xs mt-4">
              {/* ALERTA DE LOOKUP */}
              {lookupMessage && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{lookupMessage}</span>
                </div>
              )}

              {/* SELETOR DINÂMICO DE TIPO: PESSOA JURÍDICA VS PESSOA FÍSICA */}
              <div className="bg-[#f4f5f6] p-1.5 rounded-xl border border-[#d8d8d8]">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSwitchPersonType('PJ')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      personType === 'PJ'
                        ? 'bg-[#53383e] text-white shadow-sm'
                        : 'text-[#363739] hover:text-[#53383e] hover:bg-[#d8d8d8]/40'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Pessoa Jurídica (PJ)</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${personType === 'PJ' ? 'bg-white/20 text-white' : 'bg-[#d8d8d8] text-[#363739]'}`}>
                      CNPJ
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchPersonType('PF')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      personType === 'PF'
                        ? 'bg-[#363739] text-white shadow-sm'
                        : 'text-[#363739] hover:text-[#53383e] hover:bg-[#d8d8d8]/40'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Pessoa Física (PF)</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${personType === 'PF' ? 'bg-white/20 text-white' : 'bg-[#d8d8d8] text-[#363739]'}`}>
                      CPF + RG
                    </span>
                  </button>
                </div>
              </div>

              {/* CAMPOS ESPECÍFICOS DE ACORDO COM A ESCOLHA */}
              {personType === 'PJ' ? (
                /* ===================== PESSOA JURÍDICA ===================== */
                <div className="space-y-4">
                  {/* CNPJ com Consulta na Receita */}
                  <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2">
                    <span className="font-bold text-indigo-900 uppercase tracking-wider text-[11px] block">
                      Dados Fiscais da Empresa (Receita Federal)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-slate-700 mb-1 font-semibold">CNPJ da Empresa (Opcional)</label>
                        <input
                          type="text"
                          placeholder="Ex: 12.345.678/0001-90 (Opcional)"
                          value={cDocument}
                          onChange={(e) => setCDocument(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={isLoadingLookup}
                        onClick={handleCnpjSearch}
                        className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs h-[36px]"
                      >
                        {isLoadingLookup ? 'Consultando...' : 'Buscar na Receita Federal'}
                      </button>
                    </div>
                    <p className="text-[10px] text-indigo-700">
                      A busca preenche automaticamente Razão Social, Nome Fantasia, Contato e o Endereço Principal.
                    </p>
                  </div>

                  {/* Razão Social e Nome Fantasia */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Razão Social *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Metalúrgica Precision do Brasil Ltda"
                        value={cName}
                        onChange={(e) => setCName(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Nome Fantasia</label>
                      <input
                        type="text"
                        placeholder="Ex: Precision Usinagem & Caldeiraria"
                        value={cTradeName}
                        onChange={(e) => setCTradeName(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Inscrição Estadual e Pessoa de Contato / Síndico */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Inscrição Estadual (IE)</label>
                      <input
                        type="text"
                        placeholder="Ex: 635.882.110.114 ou Isento"
                        value={cStateRegistration}
                        onChange={(e) => setCStateRegistration(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Pessoa de Contato / Responsável / Síndico</label>
                      <input
                        type="text"
                        placeholder="Ex: Engº Carlos Eduardo ou Síndico Marcos"
                        value={cContactPerson}
                        onChange={(e) => setCContactPerson(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* ===================== PESSOA FÍSICA ===================== */
                <div className="space-y-4">
                  {/* CPF e RG (CAMPO DE RG REQUISITADO PELO USUÁRIO) */}
                  <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2">
                    <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] block">
                      Documentação Pessoal (CPF & RG)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 mb-1 font-semibold">CPF do Cliente (Opcional)</label>
                        <input
                          type="text"
                          placeholder="Ex: 123.456.789-00 (Opcional)"
                          value={cDocument}
                          onChange={(e) => setCDocument(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 mb-1 font-semibold">
                          RG (Registro Geral - Opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 28.910.345-X SSP/SP (Opcional)"
                          value={cRg}
                          onChange={(e) => setCRg(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Nome Completo e Apelido/Tratamento */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 mb-1 font-semibold">Nome Completo do Cliente *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Dr. Roberto Camargo de Oliveira"
                        value={cName}
                        onChange={(e) => setCName(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Data de Nascimento</label>
                      <input
                        type="date"
                        value={cBirthDate}
                        onChange={(e) => setCBirthDate(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Como prefere ser chamado / Referência (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: Dr. Roberto (Clínica) ou Seu Camargo"
                      value={cTradeName}
                      onChange={(e) => setCTradeName(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* CONTATOS & TELEFONES (COMUM PARA AMBOS) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Telefone Principal / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98765-4321"
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Telefone Secundário / Fixo</label>
                  <input
                    type="text"
                    placeholder="(11) 3300-2211"
                    value={cSecondaryPhone}
                    onChange={(e) => setCSecondaryPhone(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">E-mail de Contato / Notificações</label>
                  <input
                    type="email"
                    placeholder={personType === 'PJ' ? 'financeiro@empresa.com.br' : 'cliente@gmail.com'}
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              {/* =========================================================================
                  SEÇÃO DE MÚLTIPLOS ENDEREÇOS COM TÍTULOS DE REFERÊNCIA DIFERENTES
                  ========================================================================= */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                        Endereços Cadastrados & Locais de Atendimento ({addresses.length})
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {personType === 'PJ'
                        ? 'Cadastre múltiplos endereços para esta Pessoa Jurídica (Sede, Filiais, Depósitos, Obras, Galpões) com títulos de referência diferentes.'
                        : 'Cadastre múltiplos endereços para esta Pessoa Física (Residência, Chácara, Obra, Consultório, Casa de Praia) com títulos de referência diferentes.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddAddress}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Adicionar Outro Endereço
                  </button>
                </div>

                {/* Lista de Endereços */}
                <div className="space-y-4">
                  {addresses.map((addr, index) => (
                    <div 
                      key={addr.id || index}
                      className={`p-3.5 rounded-xl border transition-all ${
                        addr.isDefault 
                          ? 'bg-white border-blue-300 ring-2 ring-blue-100 shadow-xs' 
                          : 'bg-white/80 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Top bar of address card */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">
                            {addr.title || `Endereço ${index + 1}`}
                          </span>
                          {addr.isDefault && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200">
                              <Star className="w-3 h-3 fill-blue-600" />
                              Endereço Principal
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {!addr.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(index)}
                              className="text-[11px] font-medium text-slate-600 hover:text-blue-700 px-2 py-0.5 rounded hover:bg-blue-50 transition-colors"
                            >
                              Tornar Principal
                            </button>
                          )}
                          {addresses.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAddress(index)}
                              className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remover
                            </button>
                          )}
                        </div>
                      </div>

                      {/* TÍTULO DE REFERÊNCIA DO ENDEREÇO */}
                      <div className="space-y-2 mb-3">
                        <label className="block text-slate-700 font-semibold text-[11px]">
                          Título de Referência do Endereço *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            placeholder={personType === 'PJ' ? 'Ex: Sede Principal, Filial Zona Sul, Obra Alphaville' : 'Ex: Residência Principal, Chácara de Lazer, Consultório'}
                            value={addr.title}
                            onChange={(e) => handleUpdateAddressField(index, 'title', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
                          />

                          {/* Sugestões rápidas de títulos */}
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[10px] text-slate-400 mr-1">Sugestões:</span>
                            {addressTitleSuggestions.slice(0, 3).map((sug) => (
                              <button
                                key={sug}
                                type="button"
                                onClick={() => handleUpdateAddressField(index, 'title', sug)}
                                className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 transition-colors"
                              >
                                {sug}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* CEP com botão de busca ViaCEP individual */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end mb-3">
                        <div className="sm:col-span-2">
                          <label className="block text-slate-600 mb-1 font-medium text-[11px]">CEP</label>
                          <input
                            type="text"
                            placeholder="01001-000"
                            value={addr.cep}
                            onChange={(e) => handleUpdateAddressField(index, 'cep', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:bg-white"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={isLoadingLookup}
                          onClick={() => handleCepSearchForAddress(index)}
                          className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs h-[36px]"
                        >
                          Buscar CEP
                        </button>
                      </div>

                      {/* Logradouro e Número */}
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="col-span-2">
                          <label className="block text-slate-600 mb-1 font-medium text-[11px]">Logradouro / Rua *</label>
                          <input
                            type="text"
                            required
                            placeholder="Avenida Paulista"
                            value={addr.street}
                            onChange={(e) => handleUpdateAddressField(index, 'street', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1 font-medium text-[11px]">Número *</label>
                          <input
                            type="text"
                            required
                            placeholder="1000"
                            value={addr.number}
                            onChange={(e) => handleUpdateAddressField(index, 'number', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                          />
                        </div>
                      </div>

                      {/* Complemento, Bairro, Cidade, UF */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2">
                        <div>
                          <label className="block text-slate-600 mb-1 font-medium text-[11px]">Complemento</label>
                          <input
                            type="text"
                            placeholder="Apto 101 / Galpão 3"
                            value={addr.complement || ''}
                            onChange={(e) => handleUpdateAddressField(index, 'complement', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1 font-medium text-[11px]">Bairro *</label>
                          <input
                            type="text"
                            required
                            placeholder="Bela Vista"
                            value={addr.neighborhood}
                            onChange={(e) => handleUpdateAddressField(index, 'neighborhood', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1 font-medium text-[11px]">Cidade *</label>
                          <input
                            type="text"
                            required
                            placeholder="São Paulo"
                            value={addr.city}
                            onChange={(e) => handleUpdateAddressField(index, 'city', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1 font-medium text-[11px]">UF *</label>
                          <input
                            type="text"
                            required
                            placeholder="SP"
                            maxLength={2}
                            value={addr.state}
                            onChange={(e) => handleUpdateAddressField(index, 'state', e.target.value.toUpperCase())}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg uppercase text-slate-900 focus:bg-white"
                          />
                        </div>
                      </div>

                      {/* Ponto de Referência / Instruções Técnicas */}
                      <div>
                        <label className="block text-slate-600 mb-1 font-medium text-[11px]">
                          Ponto de Referência / Instruções de Acesso para Equipe Técnica
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Portaria lateral 2, aquecedor solar no telhado do fundo, chave na guarita..."
                          value={addr.referencePoint || ''}
                          onChange={(e) => handleUpdateAddressField(index, 'referencePoint', e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* OBSERVAÇÕES GERAIS DO CLIENTE */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Observações Gerais do Cliente</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Cliente prefere atendimento no período da manhã; contrato de manutenção preventiva..."
                  value={cNotes}
                  onChange={(e) => setCNotes(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-3 border-t border-[#d8d8d8] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#363739] bg-[#f4f5f6] hover:bg-[#d8d8d8] rounded-lg transition-colors border border-[#d8d8d8]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {editingClientId ? 'Atualizar Cliente' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA VISUALIZAR TODOS OS ENDEREÇOS DE UM CLIENTE */}
      {viewAddressesClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Endereços de {viewAddressesClient.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Locais e referências registradas para este cliente ({viewAddressesClient.personType || 'PJ/PF'}).
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setViewAddressesClient(null)} 
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {(viewAddressesClient.addresses || [
                {
                  id: 'def',
                  title: 'Endereço Principal',
                  isDefault: true,
                  cep: viewAddressesClient.cep,
                  street: viewAddressesClient.street,
                  number: viewAddressesClient.number,
                  complement: viewAddressesClient.complement,
                  neighborhood: viewAddressesClient.neighborhood,
                  city: viewAddressesClient.city,
                  state: viewAddressesClient.state,
                  referencePoint: ''
                }
              ]).map((addr, idx) => (
                <div 
                  key={addr.id || idx}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      {addr.title}
                    </span>
                    {addr.isDefault && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                        Principal
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-700 font-medium">
                    {addr.street}, {addr.number} {addr.complement ? `(${addr.complement})` : ''}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {addr.neighborhood} - {addr.city}/{addr.state} • CEP {addr.cep}
                  </div>
                  {addr.referencePoint && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200 mt-2">
                      <span className="font-semibold">Ponto de Referência:</span> {addr.referencePoint}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 mt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  const target = viewAddressesClient;
                  setViewAddressesClient(null);
                  handleOpenEdit(target);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Editar / Adicionar Endereços
              </button>

              <button
                type="button"
                onClick={() => setViewAddressesClient(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Importação CSV */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Importação em Lote via CSV/Excel</h3>
              </div>
              <button 
                onClick={() => setIsCsvModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs mt-4">
              <p className="text-slate-600">
                Cole o conteúdo no formato CSV separado por ponto e vírgula (;):
                <br />
                <code className="text-[11px] text-blue-700 font-mono bg-blue-50 p-1 rounded block mt-1">
                  Nome;Documento;Telefone;Email;CEP;Rua;Numero
                </code>
              </p>

              <textarea
                rows={6}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="Nome;Documento;Telefone;Email;CEP;Rua;Numero..."
                className="w-full p-2.5 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
              />

              {csvResult && (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{csvResult}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleProcessCsv}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  Importar Linhas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
