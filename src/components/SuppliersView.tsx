import React, { useState, useMemo } from 'react';
import { 
  Building, 
  Plus, 
  Search, 
  Download, 
  Phone, 
  Mail, 
  MapPin, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  UserCheck, 
  Package, 
  DollarSign, 
  FileText,
  Building2,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { useApp, formatBRL } from '../context/AppContext';
import { Supplier, GeneralExpense } from '../types';
import { TablePagination } from './TablePagination';
import { LiveSearchInput } from './LiveSearchInput';
import { RowHoverDetail } from './RowHoverDetail';

export const SuppliersView: React.FC = () => {
  const { 
    suppliers, 
    generalExpenses,
    addSupplier, 
    updateSupplier, 
    deleteSupplier, 
    lookupCep, 
    lookupCnpj 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Supplier Modal State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupId, setEditingSupId] = useState<string | null>(null);
  const [sName, setSName] = useState('');
  const [sTradeName, setSTradeName] = useState('');
  const [sCnpj, setSCnpj] = useState('');
  const [sContactPerson, setSContactPerson] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sCep, setSCep] = useState('01001-000');
  const [sStreet, setSStreet] = useState('');
  const [sNumber, setSNumber] = useState('');
  const [sCity, setSCity] = useState('São Paulo');
  const [sState, setSState] = useState('SP');
  const [sNotes, setSNotes] = useState('');
  const [isLoadingLookup, setIsLoadingLookup] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);

  // Quick stats
  const totalSuppliers = suppliers.length;

  // Total payables associated with suppliers
  const totalPayablesAmount = useMemo(() => {
    return generalExpenses
      .filter((p: GeneralExpense) => !p.isPaid)
      .reduce((acc: number, curr: GeneralExpense) => acc + curr.cost, 0);
  }, [generalExpenses]);

  const suppliersWithPendingPayables = useMemo(() => {
    const supplierIds = new Set(
      generalExpenses
        .filter((p: GeneralExpense) => !p.isPaid && p.supplierId)
        .map((p: GeneralExpense) => p.supplierId)
    );
    return suppliers.filter(s => supplierIds.has(s.id)).length;
  }, [suppliers, generalExpenses]);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    if (!searchTerm.trim()) return suppliers;
    const term = searchTerm.toLowerCase();
    return suppliers.filter(sup => 
      sup.name.toLowerCase().includes(term) ||
      (sup.tradeName && sup.tradeName.toLowerCase().includes(term)) ||
      sup.cnpj.includes(term) ||
      (sup.contactPerson && sup.contactPerson.toLowerCase().includes(term)) ||
      sup.city.toLowerCase().includes(term) ||
      sup.phone.includes(term) ||
      sup.email.toLowerCase().includes(term) ||
      (sup.notes && sup.notes.toLowerCase().includes(term))
    );
  }, [suppliers, searchTerm]);

  // Reset page when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSuppliers.slice(start, start + itemsPerPage);
  }, [filteredSuppliers, currentPage, itemsPerPage]);

  // Auto lookup CEP
  const handleCepSearch = async () => {
    if (!sCep || sCep.replace(/\D/g, '').length < 8) {
      setLookupMessage('Informe um CEP válido com 8 dígitos.');
      return;
    }
    setIsLoadingLookup(true);
    setLookupMessage(null);
    try {
      const data = await lookupCep(sCep);
      if (data) {
        setSStreet(data.street || '');
        setSCity(data.city || '');
        setSState(data.state || 'SP');
        setLookupMessage(`Endereço localizado: ${data.street} - ${data.city}/${data.state}`);
      } else {
        setLookupMessage('CEP não localizado ou serviço indisponível.');
      }
    } catch {
      setLookupMessage('Erro ao consultar CEP.');
    } finally {
      setIsLoadingLookup(false);
    }
  };

  // Auto lookup CNPJ via BrasilAPI / Receita
  const handleCnpjSearch = async () => {
    const cleanDoc = sCnpj.replace(/\D/g, '');
    if (cleanDoc.length !== 14) {
      setLookupMessage('Para busca na Receita Federal, informe um CNPJ com 14 dígitos.');
      return;
    }
    setIsLoadingLookup(true);
    setLookupMessage(null);
    try {
      const data = await lookupCnpj(sCnpj);
      if (data) {
        setSName(data.name || '');
        setSTradeName(data.tradeName || '');
        if (data.phone) setSPhone(data.phone);
        if (data.email) setSEmail(data.email);
        if (data.cep) setSCep(data.cep);
        if (data.street) setSStreet(data.street);
        if (data.number) setSNumber(data.number);
        if (data.city) setSCity(data.city);
        if (data.state) setSState(data.state);
        setLookupMessage(`Fornecedor localizado na Receita: ${data.name}`);
      } else {
        setLookupMessage('CNPJ não encontrado na base pública.');
      }
    } catch {
      setLookupMessage('Erro ao consultar CNPJ.');
    } finally {
      setIsLoadingLookup(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingSupId(null);
    setSName('');
    setSTradeName('');
    setSCnpj('');
    setSContactPerson('');
    setSEmail('');
    setSPhone('');
    setSCep('01001-000');
    setSStreet('');
    setSNumber('');
    setSCity('São Paulo');
    setSState('SP');
    setSNotes('');
    setLookupMessage(null);
    setIsSupplierModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupId(sup.id);
    setSName(sup.name);
    setSTradeName(sup.tradeName || '');
    setSCnpj(sup.cnpj);
    setSContactPerson(sup.contactPerson || '');
    setSEmail(sup.email);
    setSPhone(sup.phone);
    setSCep(sup.cep || '01001-000');
    setSStreet(sup.street || '');
    setSNumber(sup.number || '');
    setSCity(sup.city);
    setSState(sup.state);
    setSNotes(sup.notes || '');
    setLookupMessage(null);
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName.trim() || !sCnpj.trim()) return;

    if (editingSupId) {
      updateSupplier(editingSupId, {
        name: sName.trim(),
        tradeName: sTradeName.trim() || undefined,
        cnpj: sCnpj.trim(),
        contactPerson: sContactPerson.trim() || undefined,
        email: sEmail.trim() || 'fornecedor@contato.com.br',
        phone: sPhone.trim() || '(11) 3300-4000',
        cep: sCep.trim() || '01001-000',
        street: sStreet.trim() || 'Avenida das Indústrias',
        number: sNumber.trim() || '500',
        city: sCity.trim() || 'São Paulo',
        state: sState.trim().toUpperCase() || 'SP',
        notes: sNotes.trim() || undefined
      });
    } else {
      addSupplier({
        name: sName.trim(),
        tradeName: sTradeName.trim() || undefined,
        cnpj: sCnpj.trim(),
        contactPerson: sContactPerson.trim() || undefined,
        email: sEmail.trim() || 'fornecedor@contato.com.br',
        phone: sPhone.trim() || '(11) 3300-4000',
        cep: sCep.trim() || '01001-000',
        street: sStreet.trim() || 'Avenida das Indústrias',
        number: sNumber.trim() || '500',
        city: sCity.trim() || 'São Paulo',
        state: sState.trim().toUpperCase() || 'SP',
        notes: sNotes.trim() || undefined
      });
    }

    setIsSupplierModalOpen(false);
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Razao_Social', 'Nome_Fantasia', 'CNPJ', 'Representante', 'Email', 'Telefone', 'CEP', 'Logradouro', 'Numero', 'Cidade', 'UF', 'Observacoes_Linha'];
    const rows = suppliers.map(s => [
      s.id,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${(s.tradeName || '').replace(/"/g, '""')}"`,
      s.cnpj,
      `"${(s.contactPerson || '').replace(/"/g, '""')}"`,
      s.email,
      s.phone,
      s.cep || '',
      `"${(s.street || '').replace(/"/g, '""')}"`,
      s.number || '',
      `"${s.city.replace(/"/g, '""')}"`,
      s.state,
      `"${(s.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvData = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fornecedores_sistema_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to get pending payables for a supplier
  const getSupplierPayables = (supplierId: string) => {
    return generalExpenses.filter((p: GeneralExpense) => p.supplierId === supplierId && !p.isPaid);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#d8d8d8]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#f6eff1] text-[#53383e] rounded-xl border border-[#d8d8d8]">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#363739] tracking-tight">
                Cadastro de Fornecedores
              </h1>
              <p className="text-xs text-[#707174] mt-0.5">
                Gestão e homologação de fabricantes de tanques térmicos, bombas, válvulas e insumos com consulta automática de CNPJ e CEP.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            Novo Fornecedor
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Fornecedores</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalSuppliers}</h3>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Empresas homologadas</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Com Contas a Pagar</p>
            <h3 className="text-2xl font-bold text-amber-700 mt-1">{suppliersWithPendingPayables}</h3>
            <span className="text-[11px] text-amber-600 font-medium mt-0.5 block">Títulos em aberto</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total em Aberto (Geral)</p>
            <h3 className="text-xl font-bold text-rose-700 mt-1">{formatBRL(totalPayablesAmount)}</h3>
            <span className="text-[11px] text-rose-600 font-medium mt-0.5 block">Contas a pagar empresa</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Linha Principal</p>
            <h3 className="text-lg font-bold text-slate-800 mt-1">Tanques & Peças</h3>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Aquecimento & Solar</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="w-full md:w-96">
          <LiveSearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por razão social, fantasia, CNPJ, contato ou cidade..."
            emptyLabel="Nenhum fornecedor"
            inputClassName="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            getOptions={(query) => {
              const q = query.toLowerCase();
              return suppliers
                .filter(
                  s =>
                    s.name.toLowerCase().includes(q) ||
                    (s.tradeName || '').toLowerCase().includes(q) ||
                    (s.cnpj || '').toLowerCase().includes(q) ||
                    (s.contactPerson || '').toLowerCase().includes(q) ||
                    (s.city || '').toLowerCase().includes(q)
                )
                .map(s => ({
                  id: s.id,
                  title: s.tradeName || s.name,
                  subtitle: `${s.cnpj || s.phone}${s.city ? ` · ${s.city}/${s.state}` : ''}`,
                  badgeText: s.state || 'Fornecedor',
                  data: s
                }));
            }}
            onSelect={(opt) => setSearchTerm(opt.data.name)}
          />
        </div>
      </div>

      {/* Suppliers Table: Compacta no Desktop + Hover Details & Cards no Mobile */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs">
        {filteredSuppliers.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400">
            <Building className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            Nenhum fornecedor encontrado para a busca realizada.
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="dense-table text-left text-xs">
                <thead>
                  <tr>
                    <th>Fornecedor</th>
                    <th>CNPJ</th>
                    <th>Telefone</th>
                    <th>Cidade / UF</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {paginatedSuppliers.map((supplier) => {
                    const payables = getSupplierPayables(supplier.id);
                    const cleanPhone = supplier.phone.replace(/\D/g, '');

                    return (
                      <tr key={supplier.id} className="dense-row">
                        <td>
                          <RowHoverDetail
                            title={supplier.name}
                            subtitle={supplier.tradeName ? `Fantasia: ${supplier.tradeName}` : undefined}
                            badge={payables.length > 0 ? `${payables.length} pend.` : undefined}
                            badgeClassName="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800"
                            fields={[
                              { label: 'CNPJ', value: supplier.cnpj },
                              ...(supplier.contactPerson ? [{ label: 'Representante', value: supplier.contactPerson }] : []),
                              { label: 'Telefone', value: supplier.phone },
                              ...(supplier.email ? [{ label: 'E-mail', value: supplier.email }] : []),
                              {
                                label: 'Endereço',
                                value: `${supplier.street || 'N/A'}, ${supplier.number || 'S/N'} · ${supplier.city}/${supplier.state}${supplier.cep ? ` · CEP ${supplier.cep}` : ''}`
                              }
                            ]}
                            footer={supplier.notes ? `Obs.: ${supplier.notes}` : undefined}
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate max-w-[260px]">
                                {supplier.name}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate max-w-[260px]">
                                {supplier.tradeName || supplier.contactPerson || 'Comercial'}
                                {payables.length > 0 ? ` · ${payables.length} conta(s)` : ''}
                              </div>
                            </div>
                          </RowHoverDetail>
                        </td>

                        <td className="font-mono text-[11px] font-semibold text-slate-700 whitespace-nowrap tabular-nums">
                          {supplier.cnpj}
                        </td>

                        <td className="whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-800">
                            <span>{supplier.phone}</span>
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/55${cleanPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50"
                                title="Abrir WhatsApp Comercial"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="text-slate-600 whitespace-nowrap">
                          {supplier.city} - {supplier.state}
                        </td>

                        <td className="text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(supplier)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                              title="Editar Cadastro"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja realmente remover o fornecedor "${supplier.name}"?`)) {
                                  deleteSupplier(supplier.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="Excluir Fornecedor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Stack */}
            <div className="md:hidden p-3 space-y-2.5">
              {paginatedSuppliers.map((supplier) => {
                const payables = getSupplierPayables(supplier.id);
                const cleanPhone = supplier.phone.replace(/\D/g, '');
                return (
                  <div key={supplier.id} className="p-3 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm">{supplier.name}</div>
                        <div className="font-mono text-[11px] text-slate-500">{supplier.cnpj}</div>
                      </div>
                      {payables.length > 0 && (
                        <span className="text-[11px] font-semibold text-amber-700 shrink-0">
                          {payables.length} pend.
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                      <span>{supplier.phone} · {supplier.city}/{supplier.state}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/55${cleanPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-emerald-600 bg-emerald-50 rounded-lg"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleOpenEdit(supplier)}
                          className="p-2 text-slate-700 bg-slate-100 rounded-lg"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Paginação da Tabela de Fornecedores */}
        <TablePagination
          currentPage={currentPage}
          totalItems={filteredSuppliers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemName="fornecedores cadastrados"
        />
      </div>

      {/* Modal Cadastro/Edição de Fornecedor */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Building className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingSupId ? 'Editar Cadastro de Fornecedor' : 'Novo Fornecedor Homologado'}
                </h3>
              </div>
              <button 
                onClick={() => setIsSupplierModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-4 text-xs mt-4">
              {/* Lookup alert banner */}
              {lookupMessage && (
                <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{lookupMessage}</span>
                </div>
              )}

              {/* CNPJ and Lookup */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                  Identificação Fiscal (Receita Federal)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 mb-1 font-medium">CNPJ do Fornecedor *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 61.423.789/0001-15"
                      value={sCnpj}
                      onChange={(e) => setSCnpj(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-semibold text-slate-900"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isLoadingLookup}
                    onClick={handleCnpjSearch}
                    className="w-full px-3 py-2 bg-[#53383e] hover:bg-[#432c32] text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs h-[36px] cursor-pointer"
                  >
                    {isLoadingLookup ? 'Buscando...' : 'Buscar CNPJ (Receita)'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Preenchimento automático direto da Receita Federal: Razão Social, Fantasia, Telefone e Endereço.
                </p>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Razão Social *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: TermoTech Indústria de Aquecedores Ltda"
                    value={sName}
                    onChange={(e) => setSName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Nome Fantasia</label>
                  <input
                    type="text"
                    placeholder="Ex: TermoTech Brasil"
                    value={sTradeName}
                    onChange={(e) => setSTradeName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              {/* Contact Person and Commercial */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Representante / Contato</label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos Mendes (Vendas)"
                    value={sContactPerson}
                    onChange={(e) => setSContactPerson(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Telefone Comercial</label>
                  <input
                    type="text"
                    placeholder="(11) 3300-4000"
                    value={sPhone}
                    onChange={(e) => setSPhone(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">E-mail Comercial / Pedidos</label>
                  <input
                    type="email"
                    placeholder="pedidos@termotech.com.br"
                    value={sEmail}
                    onChange={(e) => setSEmail(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              {/* Address with ViaCEP */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                  Endereço da Fábrica / Distribuidor (ViaCEP Integrado)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 mb-1 font-medium">CEP</label>
                    <input
                      type="text"
                      placeholder="01001-000"
                      value={sCep}
                      onChange={(e) => setSCep(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isLoadingLookup}
                    onClick={handleCepSearch}
                    className="w-full px-3 py-2 bg-[#53383e] hover:bg-[#432c32] text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs h-[36px] cursor-pointer"
                  >
                    Buscar CEP (ViaCEP)
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-slate-600 mb-1 font-medium">Logradouro / Avenida</label>
                    <input
                      type="text"
                      placeholder="Avenida das Indústrias"
                      value={sStreet}
                      onChange={(e) => setSStreet(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Número</label>
                    <input
                      type="text"
                      placeholder="500"
                      value={sNumber}
                      onChange={(e) => setSNumber(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Cidade</label>
                    <input
                      type="text"
                      placeholder="São Paulo"
                      value={sCity}
                      onChange={(e) => setSCity(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">UF</label>
                    <input
                      type="text"
                      placeholder="SP"
                      maxLength={2}
                      value={sState}
                      onChange={(e) => setSState(e.target.value.toUpperCase())}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg uppercase text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Notes / Products supplied */}
              <div>
                <label className="block text-slate-600 mb-1 font-medium">
                  Linha de Produtos Fornecidos / Condições de Compra
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Fornecedor de reservatórios térmicos de 200L a 1000L em inox 304/316, válvulas de alívio e resistências blindadas. Faturamento 30 dias..."
                  value={sNotes}
                  onChange={(e) => setSNotes(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-[#d8d8d8] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#363739] bg-[#f4f5f6] hover:bg-[#d8d8d8] rounded-lg transition-colors border border-[#d8d8d8]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {editingSupId ? 'Atualizar Fornecedor' : 'Salvar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
