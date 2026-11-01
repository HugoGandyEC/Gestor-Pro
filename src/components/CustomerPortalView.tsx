import React, { useState } from 'react';
import { 
  UserCheck, 
  ShieldCheck, 
  AlertCircle, 
  ClipboardList, 
  FileText, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Car, 
  DollarSign, 
  Printer, 
  Calendar,
  PenTool
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../context/AppContext';
import { CustomerPortalTicket, ServiceOrder } from '../types';

export const CustomerPortalView: React.FC = () => {
  const { 
    clients, 
    serviceOrders, 
    customerTickets, 
    addCustomerTicket, 
    updateCustomerTicketStatus,
    updateServiceOrder 
  } = useApp();

  // Current client selection (defaults to first client: Condomínio Bella Vista)
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || 'cli-1');
  const [activeTab, setActiveTab] = useState<'orders' | 'tickets' | 'debts'>('orders');

  // Modal New Ticket / Warranty Claim
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [ticketType, setTicketType] = useState<'chamado_tecnico' | 'acionamento_garantia'>('acionamento_garantia');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [linkedOrderId, setLinkedOrderId] = useState('');
  const [equipmentSerial, setEquipmentSerial] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'baixa' | 'normal' | 'alta' | 'urgente'>('alta');

  // Digital Signature Modal
  const [signModalOrder, setSignModalOrder] = useState<ServiceOrder | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerDocument, setSignerDocument] = useState('');

  const currentClient = clients.find(c => c.id === selectedClientId) || clients[0];

  // Client's orders
  const clientOrders = serviceOrders.filter(o => o.clientId === selectedClientId || o.clientName.toLowerCase().includes(currentClient?.name.toLowerCase() || ''));

  // Client's tickets
  const clientTickets = customerTickets.filter(t => t.clientId === selectedClientId || t.clientName.toLowerCase().includes(currentClient?.name.toLowerCase() || ''));

  // Pending debts
  const pendingOrders = clientOrders.filter(o => o.paymentStatus === 'pendente');
  const totalPendingAmount = pendingOrders.reduce((acc, o) => {
    const srv = o.services.reduce((a, b) => a + Number(b.price || 0), 0);
    const prt = o.parts.reduce((a, b) => a + (Number(b.price || 0) * Number(b.quantity || 1)), 0);
    return acc + (srv + prt + Number(o.visitFee || 0) - Number(o.calculatedDiscount || 0));
  }, 0);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) {
      alert('Preencha o assunto e a descrição da solicitação.');
      return;
    }

    addCustomerTicket({
      clientId: currentClient.id,
      clientName: currentClient.name,
      serviceOrderId: linkedOrderId || undefined,
      equipmentSerial: equipmentSerial || undefined,
      type: ticketType,
      subject: ticketSubject,
      description: ticketDescription,
      priority: ticketPriority
    });

    setIsNewTicketOpen(false);
    setTicketSubject('');
    setTicketDescription('');
    setEquipmentSerial('');
  };

  const handleSaveSignature = (order: ServiceOrder) => {
    if (!signerName.trim()) {
      alert('Informe o nome do responsável pelo recebimento do serviço.');
      return;
    }

    // Generate a sleek digital signature stamp
    const now = new Date();
    const formatted = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR');
    const svgStamp = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="260" height="70"><path d="M15 45 C 50 15, 80 55, 130 30 S 210 50, 245 35" stroke="%231d4ed8" fill="none" stroke-width="2.5"/><text x="15" y="65" font-family="sans-serif" font-size="10" fill="%2364748b">Assinado Digitalmente · Autenticação em Tela Touch</text></svg>`;

    updateServiceOrder(order.id, {
      signature: {
        signatureDataUrl: svgStamp,
        signedByName: signerName,
        signedByDocument: signerDocument || 'Documento Validado',
        signedAt: formatted
      }
    });

    setSignModalOrder(null);
    setSignerName('');
    setSignerDocument('');
    alert('Assinatura digital registrada com sucesso na Ordem de Serviço!');
  };

  return (
    <div className="space-y-6">
      {/* Portal Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Área Restrita do Cliente
            </span>
            <span className="text-xs text-slate-300">Autoatendimento & Pós-Venda</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-2">
            Portal do Cliente & Central de Garantias
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Acompanhe o andamento das suas Ordens de Serviço, consulte termos de garantia com número de série de equipamentos (como reservatórios térmicos e bombas), assine digitalmente e abra chamados técnicos.
          </p>
        </div>

        {/* Client Switcher (for demo & testing) */}
        <div className="bg-white/10 p-3 rounded-xl border border-white/20 shrink-0 space-y-1.5">
          <label className="block text-[11px] font-semibold text-slate-200">
            Visualizando como Cliente:
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full text-xs font-bold text-slate-900 bg-white rounded-lg p-2 cursor-pointer shadow-xs"
          >
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.document})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Ordens de Serviço do Cliente</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {clientOrders.length} OS
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {clientOrders.filter(o => o.status === 'entregue_finalizada').length} concluídas / finalizadas
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Débitos / Faturas em Aberto</span>
          <div className={`text-2xl font-bold font-mono mt-1 ${totalPendingAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {formatBRL(totalPendingAmount)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {pendingOrders.length === 0 ? 'Nenhum débito em aberto (em dia)' : `${pendingOrders.length} faturamento(s) pendente(s)`}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Chamados & Garantias</span>
          <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">
            {clientTickets.length} Solicitações
          </div>
          <div className="text-xs text-indigo-700 font-semibold mt-1">
            {clientTickets.filter(t => t.status === 'visita_agendada').length} com visita técnica agendada
          </div>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'orders' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Minhas Ordens de Serviço & Garantias ({clientOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'tickets' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Chamados Técnicos & Garantia ({clientTickets.length})
          </button>
          <button
            onClick={() => setActiveTab('debts')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'debts' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Débitos & Pagamentos ({pendingOrders.length})
          </button>
        </div>

        <button
          onClick={() => setIsNewTicketOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Abrir Chamado / Acionar Garantia</span>
        </button>
      </div>

      {/* Tab: Orders & Warranties */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {clientOrders.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-400 text-xs">
              Nenhuma Ordem de Serviço vinculada a este cliente.
            </div>
          ) : (
            clientOrders.map(order => {
              const srv = order.services.reduce((a, b) => a + Number(b.price || 0), 0);
              const prt = order.parts.reduce((a, b) => a + (Number(b.price || 0) * Number(b.quantity || 1)), 0);
              const grandTotal = srv + prt + Number(order.visitFee || 0) - Number(order.calculatedDiscount || 0);

              return (
                <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-blue-600">
                        {order.code}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                        {order.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      {order.equipmentType && (
                        <span className="text-xs text-slate-600 font-medium hidden md:inline">
                          · {order.equipmentType} {order.equipmentSerial ? `(S/N: ${order.equipmentSerial})` : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono">
                        Abertura: {formatDateBR(order.openDate)}
                      </span>
                      {order.signature ? (
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Assinado Digitalmente
                        </span>
                      ) : (
                        <button
                          onClick={() => setSignModalOrder(order)}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 flex items-center gap-1"
                        >
                          <PenTool className="w-3 h-3" />
                          Assinar em Tela
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Equipment & Warranty Block */}
                  {order.equipmentSerial && (
                    <div className="p-3 bg-slate-50 rounded-lg text-xs grid grid-cols-1 sm:grid-cols-3 gap-2 border border-slate-100">
                      <div>
                        <span className="text-slate-500">Equipamento:</span>
                        <div className="font-bold text-slate-800">{order.equipmentType} ({order.equipmentModel || 'Padrão'})</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Número de Série (S/N):</span>
                        <div className="font-mono font-bold text-slate-900">{order.equipmentSerial}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Termo de Garantia:</span>
                        <div className="font-semibold text-emerald-700 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {order.warrantyPeriodDays} dias (Até {order.warrantyExpiresAt ? formatDateBR(order.warrantyExpiresAt) : 'Válida'})
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Services & Parts List */}
                  <div className="text-xs space-y-1">
                    <div className="text-slate-600 font-medium">Serviços executados:</div>
                    <ul className="list-disc pl-5 text-slate-700 space-y-0.5">
                      {order.services.map(s => (
                        <li key={s.id}>{s.name} ({s.hours || 1}h) - <span className="font-mono font-semibold">{formatBRL(s.price)}</span></li>
                      ))}
                    </ul>
                    {order.parts.length > 0 && (
                      <div className="pt-1">
                        <span className="text-slate-600 font-medium">Peças aplicadas: </span>
                        <span className="text-slate-700">{order.parts.map(p => `${p.quantity}x ${p.name}`).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Total */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="text-slate-500">
                      Forma de Pagto: <span className="font-semibold text-slate-700 uppercase">{order.paymentMethod.replace('_', ' ')}</span>
                      {order.calculatedDiscount > 0 && ` (Desconto: ${formatBRL(order.calculatedDiscount)})`}
                    </div>
                    <div className="text-sm font-bold font-mono text-slate-900">
                      Total da OS: <span className="text-emerald-700 font-black">{formatBRL(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab: Tickets & Warranties */}
      {activeTab === 'tickets' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Chamados de Assistência Técnica & Solicitações de Garantia
            </h2>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {clientTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                Você ainda não possui nenhum chamado técnico aberto.
              </div>
            ) : (
              clientTickets.map(tkt => (
                <div key={tkt.id} className="p-4 space-y-2 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        tkt.type === 'acionamento_garantia' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {tkt.type.replace('_', ' ')}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900">{tkt.subject}</h3>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      tkt.status === 'visita_agendada' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {tkt.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <p className="text-slate-600 leading-relaxed">{tkt.description}</p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
                    <span>Aberto em: {tkt.createdAt}</span>
                    {tkt.equipmentSerial && <span>S/N Equipamento: {tkt.equipmentSerial}</span>}
                    {tkt.scheduledDate && <span className="text-emerald-700 font-semibold font-sans">· Visita Agendada: {formatDateBR(tkt.scheduledDate)}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Debts & Payments */}
      {activeTab === 'debts' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Débitos em Aberto e Faturas a Pagar
            </h2>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {pendingOrders.length === 0 ? (
              <div className="p-8 text-center text-emerald-600 font-semibold">
                Parabéns! Sua conta está 100% em dia. Nenhum débito pendente.
              </div>
            ) : (
              pendingOrders.map(ord => {
                const srv = ord.services.reduce((a, b) => a + Number(b.price || 0), 0);
                const prt = ord.parts.reduce((a, b) => a + (Number(b.price || 0) * Number(b.quantity || 1)), 0);
                const grandTotal = srv + prt + Number(ord.visitFee || 0) - Number(ord.calculatedDiscount || 0);

                return (
                  <div key={ord.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-mono font-bold text-blue-600">{ord.code}</div>
                      <div className="font-semibold text-slate-900">{ord.description}</div>
                      <div className="text-[11px] text-slate-500">Vencimento: {formatDateBR(ord.forecastDate)}</div>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <div className="text-right">
                        <div className="text-sm font-black text-rose-600">{formatBRL(grandTotal)}</div>
                        <div className="text-[10px] text-amber-700 uppercase font-semibold">Pendente</div>
                      </div>

                      <button
                        onClick={() => {
                          updateServiceOrder(ord.id, { paymentStatus: 'pago' });
                          alert('Pagamento registrado com sucesso!');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                      >
                        Pagar via Pix / Boleto
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal Novo Chamado / Garantia */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Abrir Solicitação no Portal</h3>
              <button
                onClick={() => setIsNewTicketOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Tipo de Solicitação *</label>
                  <select
                    value={ticketType}
                    onChange={(e) => setTicketType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="acionamento_garantia">Acionamento de Garantia</option>
                    <option value="chamado_tecnico">Novo Chamado Técnico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Prioridade</label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente (Sem água/vazamento)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Vincular a Ordem de Serviço Anterior</label>
                <select
                  value={linkedOrderId}
                  onChange={(e) => {
                    setLinkedOrderId(e.target.value);
                    const chosen = clientOrders.find(o => o.id === e.target.value);
                    if (chosen?.equipmentSerial) {
                      setEquipmentSerial(chosen.equipmentSerial);
                    }
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="">Não vincular a OS específica</option>
                  {clientOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.code} - {o.equipmentType || o.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Número de Série do Equipamento (se houver)</label>
                <input
                  type="text"
                  placeholder="Ex: TMX-2024-8841 ou SCH-88310"
                  value={equipmentSerial}
                  onChange={(e) => setEquipmentSerial(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Assunto Resumido *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vazamento na tubulação de entrada do reservatório solar"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Descrição Detalhada do Problema *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva quando o problema começou, ruídos, códigos no painel, etc..."
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Enviar Chamado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Assinatura Digital Touch */}
      {signModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Coleta de Assinatura Digital</h3>
              </div>
              <button
                onClick={() => setSignModalOrder(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs mt-4">
              <p className="text-slate-600 leading-relaxed">
                Você está confirmando e aprovando a conclusão da Ordem de Serviço <strong className="text-slate-900">{signModalOrder.code}</strong>.
              </p>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Nome Completo do Responsável *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Síndico Antônio Prado"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">CPF ou Documento de Identidade</label>
                <input
                  type="text"
                  placeholder="12.345.678-9"
                  value={signerDocument}
                  onChange={(e) => setSignerDocument(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* Touch Canvas Box */}
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Assine com o dedo ou mouse abaixo:</label>
                <div className="h-32 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 select-none cursor-crosshair">
                  <span className="text-center text-[11px] px-4">
                    [ Área de Captura de Assinatura Digital Touch / Caneta Stylus ]
                    <br />
                    <span className="text-[10px] text-blue-600 font-semibold">Toque ou desenhe sua assinatura na tela</span>
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSignModalOrder(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSignature(signModalOrder)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
                >
                  Confirmar e Assinar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
