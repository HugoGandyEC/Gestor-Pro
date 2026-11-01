import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  Sliders, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  Edit2, 
  DollarSign, 
  Layers, 
  Clock, 
  Building2, 
  ArrowRight,
  TrendingDown,
  Info,
  Send,
  Eye,
  EyeOff,
  Receipt
} from 'lucide-react';
import { useApp, formatBRL } from '../context/AppContext';
import { CardOperator, PagBankTransaction } from '../types';

export const CardOperatorsView: React.FC = () => {
  const { 
    cardOperators, 
    addCardOperator, 
    updateCardOperator, 
    deleteCardOperator, 
    pagBankTransactions, 
    processPagBankWebhook, 
    syncPagBankPendingOrders,
    serviceOrders,
    directSales,
    currentRole
  } = useApp();

  const [activeTab, setActiveTab] = useState<'operadoras' | 'pagbank' | 'calculadora'>('operadoras');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);

  // Modal de Operadora
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<CardOperator | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('pagbank');
  const [cnpj, setCnpj] = useState('');
  const [type, setType] = useState<CardOperator['type']>('maquininha');
  const [active, setActive] = useState(true);
  const [settlementTermDays, setSettlementTermDays] = useState(1);
  const [pixRate, setPixRate] = useState(0.00);
  const [debitRate, setDebitRate] = useState(1.99);
  const [creditSightRate, setCreditSightRate] = useState(3.19);
  const [creditInstallments2to6Rate, setCreditInstallments2to6Rate] = useState(3.79);
  const [creditInstallments7to12Rate, setCreditInstallments7to12Rate] = useState(4.99);
  const [anticipationRate, setAnticipationRate] = useState(1.20);
  const [acceptedBrands, setAcceptedBrands] = useState<string[]>(['Visa', 'Mastercard', 'Elo', 'Hipercard']);
  const [apiToken, setApiToken] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [autoReconcile, setAutoReconcile] = useState(true);
  const [notes, setNotes] = useState('');

  // Simulador de Webhook PagBank
  const [simOrderCode, setSimOrderCode] = useState<string>(() => {
    const pending = serviceOrders.find(o => o.paymentStatus === 'pendente');
    return pending ? pending.code : (serviceOrders[0]?.code || '2025020327');
  });
  const [simAmount, setSimAmount] = useState<number>(() => {
    const pending = serviceOrders.find(o => o.paymentStatus === 'pendente');
    if (pending) {
      const tot = pending.services.reduce((a, b) => a + b.price, 0) + 
                  pending.parts.reduce((a, b) => a + (b.price * b.quantity), 0) + 
                  (pending.visitFee || 0) - (pending.calculatedDiscount || 0);
      return Math.max(50, tot);
    }
    return 5990.00;
  });
  const [simMethod, setSimMethod] = useState<'cartao_credito' | 'cartao_debito' | 'pix' | 'boleto'>('cartao_credito');
  const [simInstallments, setSimInstallments] = useState(3);
  const [simBrand, setSimBrand] = useState('Mastercard');
  const [simFeedback, setSimFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Calculadora de Taxas
  const [calcAmount, setCalcAmount] = useState<number>(1000);
  const [calcInstallments, setCalcInstallments] = useState<number>(3);
  const [calcMethod, setCalcMethod] = useState<'pix' | 'debito' | 'credito_vista' | 'credito_parcelado'>('credito_parcelado');

  const pagbankOp = cardOperators.find(o => o.code === 'pagbank') || cardOperators[0];

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleOpenAdd = () => {
    setEditingOperator(null);
    setName('');
    setCode('cielo');
    setCnpj('');
    setType('maquininha');
    setActive(true);
    setSettlementTermDays(30);
    setPixRate(0.99);
    setDebitRate(1.49);
    setCreditSightRate(2.85);
    setCreditInstallments2to6Rate(3.89);
    setCreditInstallments7to12Rate(5.20);
    setAnticipationRate(1.99);
    setAcceptedBrands(['Visa', 'Mastercard', 'Elo', 'Hipercard']);
    setApiToken('');
    setWebhookUrl('');
    setAutoReconcile(false);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (op: CardOperator) => {
    setEditingOperator(op);
    setName(op.name);
    setCode(op.code);
    setCnpj(op.cnpj || '');
    setType(op.type || 'maquininha');
    setActive(op.active);
    setSettlementTermDays(op.settlementTermDays);
    setPixRate(op.pixRate);
    setDebitRate(op.debitRate);
    setCreditSightRate(op.creditSightRate);
    setCreditInstallments2to6Rate(op.creditInstallments2to6Rate);
    setCreditInstallments7to12Rate(op.creditInstallments7to12Rate);
    setAnticipationRate(op.anticipationRate || 0);
    setAcceptedBrands(op.acceptedBrands || ['Visa', 'Mastercard']);
    setApiToken(op.integration?.apiToken || '');
    setWebhookUrl(op.integration?.webhookUrl || '');
    setAutoReconcile(op.integration?.autoReconcile ?? true);
    setNotes(op.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const opData = {
      name,
      code,
      cnpj,
      type,
      active,
      settlementTermDays: Number(settlementTermDays),
      pixRate: Number(pixRate),
      debitRate: Number(debitRate),
      creditSightRate: Number(creditSightRate),
      creditInstallments2to6Rate: Number(creditInstallments2to6Rate),
      creditInstallments7to12Rate: Number(creditInstallments7to12Rate),
      anticipationRate: Number(anticipationRate),
      acceptedBrands,
      integration: {
        enabled: Boolean(apiToken || autoReconcile),
        environment: 'production' as const,
        apiToken: apiToken.trim(),
        publicKey: editingOperator?.integration?.publicKey || 'PUB_KEY_DEFAULT_RSA_2048',
        webhookUrl: webhookUrl.trim() || `https://api.mppiscina.com.br/webhooks/${code}/callback`,
        webhookSecret: editingOperator?.integration?.webhookSecret || 'whsec_secret_key',
        autoReconcile,
        lastSyncAt: editingOperator?.integration?.lastSyncAt || new Date().toISOString().split('T')[0],
        status: (apiToken || code === 'pagbank') ? 'connected' as const : 'disconnected' as const,
        autoNotifyClientWhatsapp: true
      },
      notes
    };

    if (editingOperator) {
      updateCardOperator(editingOperator.id, opData);
    } else {
      addCardOperator(opData);
    }

    setIsModalOpen(false);
  };

  const handleSimulateWebhook = () => {
    const res = processPagBankWebhook({
      orderCode: simOrderCode,
      amount: Number(simAmount),
      method: simMethod,
      installments: simMethod === 'cartao_credito' ? Number(simInstallments) : 1,
      brand: simBrand
    });

    setSimFeedback(res);
    setTimeout(() => {
      setSimFeedback(null);
    }, 6000);
  };

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const res = syncPagBankPendingOrders();
      setSimFeedback({
        success: true,
        message: res.message
      });
      setIsSyncing(false);
      setTimeout(() => setSimFeedback(null), 5000);
    }, 900);
  };

  // Cálculo da simulação de taxas
  const calculateRateAndNet = (op: CardOperator) => {
    let rate = 0;
    if (calcMethod === 'pix') rate = op.pixRate;
    else if (calcMethod === 'debito') rate = op.debitRate;
    else if (calcMethod === 'credito_vista') rate = op.creditSightRate;
    else {
      rate = calcInstallments <= 6 ? op.creditInstallments2to6Rate : op.creditInstallments7to12Rate;
    }
    const fee = calcAmount * (rate / 100);
    const net = calcAmount - fee;
    return { rate, fee, net };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#363739] via-[#3d3f42] to-[#53383e] text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-white/20 text-[#c2bfb0] border border-white/20">
              Módulo Financeiro & Adquirentes
            </span>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              PagBank Integrado
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Operadoras de Cartão & Baixa Automática PagBank
          </h1>
          <p className="text-xs sm:text-sm text-[#d8d8d8] mt-1 max-w-2xl">
            Cadastro de taxas por adquirente (débito, crédito à vista e parcelado), controle de repasse D+1 e conciliação instantânea com baixa automática no ERP via Webhooks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar PagBank'}</span>
          </button>

          {currentRole !== 'tecnico' && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg transition-colors cursor-pointer shadow-xs border border-white/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Operadora</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#d8d8d8] pb-2">
        <button
          onClick={() => setActiveTab('operadoras')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'operadoras'
              ? 'bg-[#53383e] text-white shadow-xs'
              : 'text-[#363739] hover:bg-[#d8d8d8]/50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Operadoras Cadastradas & Taxas ({cardOperators.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pagbank')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'pagbank'
              ? 'bg-[#53383e] text-white shadow-xs'
              : 'text-[#363739] hover:bg-[#d8d8d8]/50'
          }`}
        >
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>Integração PagBank & Baixas Automáticas</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
            Ativo
          </span>
        </button>

        <button
          onClick={() => setActiveTab('calculadora')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'calculadora'
              ? 'bg-[#53383e] text-white shadow-xs'
              : 'text-[#363739] hover:bg-[#d8d8d8]/50'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Simulador Comparativo de Líquido</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {simFeedback && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm transition-all ${
          simFeedback.success 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          {simFeedback.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <div className="font-bold text-sm">
              {simFeedback.success ? 'Operação Concluída com Sucesso!' : 'Atenção na Operação'}
            </div>
            <p className="mt-0.5 text-xs">{simFeedback.message}</p>
          </div>
          <button
            onClick={() => setSimFeedback(null)}
            className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: OPERADORAS CADASTRADAS & TABELA DE TAXAS */}
      {activeTab === 'operadoras' && (
        <div className="space-y-6">
          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cardOperators.map((op) => {
              const isPagBank = op.code === 'pagbank';
              return (
                <div 
                  key={op.id} 
                  className={`bg-white rounded-xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                    isPagBank ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-[#d8d8d8]'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#f4f5f6]">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                          isPagBank ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-[#53383e]'
                        }`}>
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-[#363739] flex items-center gap-1.5">
                            {op.name}
                            {isPagBank && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                                Oficial
                              </span>
                            )}
                          </h3>
                          <div className="text-[11px] text-[#707174]">
                            Repasse: <strong className="text-[#363739]">D+{op.settlementTermDays} {op.settlementTermDays === 1 ? 'dia útil' : 'dias'}</strong>
                          </div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        op.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {op.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>

                    {/* Taxas Breakdown */}
                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#f4f5f6]">
                        <span className="text-[#707174]">Pix</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {op.pixRate.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#f4f5f6]">
                        <span className="text-[#707174]">Débito</span>
                        <span className="font-mono font-bold text-[#363739]">
                          {op.debitRate.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#f4f5f6]">
                        <span className="text-[#707174]">Crédito à Vista (1x)</span>
                        <span className="font-mono font-bold text-[#363739]">
                          {op.creditSightRate.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#f4f5f6]">
                        <span className="text-[#707174]">Crédito Parcelado (2x a 6x)</span>
                        <span className="font-mono font-bold text-[#53383e]">
                          {op.creditInstallments2to6Rate.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#f4f5f6]">
                        <span className="text-[#707174]">Crédito Parcelado (7x a 12x)</span>
                        <span className="font-mono font-bold text-[#53383e]">
                          {op.creditInstallments7to12Rate.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* Bandeiras */}
                    <div className="mt-3 pt-3 border-t border-[#f4f5f6]">
                      <div className="text-[10px] text-[#707174] uppercase font-bold tracking-wider mb-1.5">
                        Bandeiras Homologadas
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {op.acceptedBrands.map(b => (
                          <span key={b} className="text-[10px] px-2 py-0.5 rounded bg-white border border-[#d8d8d8] text-[#363739] font-medium">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Integration Status */}
                    {op.integration && (
                      <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Zap className={`w-3.5 h-3.5 ${op.integration.autoReconcile ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className="font-medium text-slate-700">Baixa Automática:</span>
                        </div>
                        <span className={`font-bold ${op.integration.autoReconcile ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {op.integration.autoReconcile ? 'Ligada (Webhook)' : 'Manual'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Footer */}
                  <div className="mt-4 pt-3 border-t border-[#f4f5f6] flex items-center justify-between">
                    <span className="text-[10px] text-[#707174] font-mono">
                      CNPJ: {op.cnpj || 'Não informado'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(op)}
                        className="p-1.5 text-[#707174] hover:text-[#53383e] hover:bg-[#f4f5f6] rounded-md transition-colors cursor-pointer"
                        title="Editar taxas da operadora"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {cardOperators.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`Excluir cadastro da operadora ${op.name}?`)) {
                              deleteCardOperator(op.id);
                            }
                          }}
                          className="p-1.5 text-[#707174] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Remover operadora"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparativo de Taxas em Tabela */}
          <div className="bg-white border border-[#d8d8d8] rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#d8d8d8] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#363739]">
                  Quadro Comparativo de Taxas por Modalidade
                </h3>
                <p className="text-xs text-[#707174]">
                  Visualização rápida de todas as taxas descontadas por cada operadora cadastrada.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f4f5f6] border-b border-[#d8d8d8] text-[#707174] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Operadora</th>
                    <th className="py-3 px-3 text-center">Prazo Repasse</th>
                    <th className="py-3 px-3 text-right">Pix</th>
                    <th className="py-3 px-3 text-right">Débito</th>
                    <th className="py-3 px-3 text-right">Crédito 1x</th>
                    <th className="py-3 px-3 text-right">Crédito 2x-6x</th>
                    <th className="py-3 px-3 text-right">Crédito 7x-12x</th>
                    <th className="py-3 px-3 text-right">Antecipação</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f5f6] font-sans">
                  {cardOperators.map(op => (
                    <tr key={op.id} className="hover:bg-[#f4f5f6]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#363739] flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-[#53383e]" />
                        {op.name}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        D+{op.settlementTermDays}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">
                        {op.pixRate.toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-[#363739]">
                        {op.debitRate.toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-[#363739]">
                        {op.creditSightRate.toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#53383e]">
                        {op.creditInstallments2to6Rate.toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#53383e]">
                        {op.creditInstallments7to12Rate.toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#707174]">
                        {op.anticipationRate ? `${op.anticipationRate.toFixed(2)}%` : '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          op.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {op.active ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTEGRAÇÃO PAGBANK & BAIXAS AUTOMÁTICAS */}
      {activeTab === 'pagbank' && (
        <div className="space-y-6">
          {/* Status & Credenciais Card */}
          <div className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#363739]">
                      API PagBank & Webhook de Baixa Automática
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Ambiente Produção
                    </span>
                  </div>
                  <p className="text-xs text-[#707174]">
                    Recebimentos via Maquininhas Smart Pro, Links de Pagamento, Débito, Crédito e Pix PagBank com liquidação e baixa imediata no ERP.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-emerald-900">Webhook Ativo & Escutando</span>
              </div>
            </div>

            {/* Configurações de API & Webhook */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  URL do Webhook (Endpoint de Notificação Instantânea)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pagbankOp?.integration?.webhookUrl || 'https://api.mppiscina.com.br/webhooks/pagbank/ipn'}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
                  />
                  <button
                    onClick={() => handleCopy(pagbankOp?.integration?.webhookUrl || 'https://api.mppiscina.com.br/webhooks/pagbank/ipn', 'webhook')}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 cursor-pointer"
                    title="Copiar URL"
                  >
                    {copiedKey === 'webhook' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Cadastre esta URL na central do desenvolvedor PagBank para receber notificações de pagamentos aprovados.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Token de Autenticação PagBank (Bearer Token)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type={showToken ? 'text' : 'password'}
                    readOnly
                    value={pagbankOp?.integration?.apiToken || 'pagbank_sec_live_9981a8c049d214ee8812c3b889a'}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
                  />
                  <button
                    onClick={() => setShowToken(!showToken)}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 cursor-pointer"
                    title="Exibir/Ocultar"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleCopy(pagbankOp?.integration?.apiToken || 'pagbank_sec_live_9981a8c049d214ee8812c3b889a', 'token')}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 cursor-pointer"
                    title="Copiar Token"
                  >
                    {copiedKey === 'token' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Chave de segurança com escopo de leitura de transações e baixa de pedidos.
                </p>
              </div>
            </div>
          </div>

          {/* SIMULADOR INTERATIVO DE WEBHOOK / TESTE DE BAIXA AUTOMÁTICA */}
          <div className="bg-white border border-[#d8d8d8] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f4f5f6]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#363739]">
                    Simulador de Recebimento de Webhook PagBank
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#f6eff1] text-[#53383e] border border-[#d8d8d8]">
                    Teste em Tempo Real
                  </span>
                </div>
                <p className="text-xs text-[#707174]">
                  Simule o disparo de um evento de pagamento da máquina ou link PagBank para efetuar a baixa imediata de uma OS ou venda.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Vincular a Ordem de Serviço (OS)
                </label>
                <select
                  value={simOrderCode}
                  onChange={(e) => {
                    setSimOrderCode(e.target.value);
                    const selected = serviceOrders.find(o => o.code === e.target.value);
                    if (selected) {
                      const tot = selected.services.reduce((a, b) => a + b.price, 0) + 
                                  selected.parts.reduce((a, b) => a + (b.price * b.quantity), 0) + 
                                  (selected.visitFee || 0) - (selected.calculatedDiscount || 0);
                      setSimAmount(tot);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  {serviceOrders.map(o => (
                    <option key={o.id} value={o.code}>
                      {o.code} - {o.clientName} ({o.paymentStatus === 'pago' ? 'PAGO' : 'PENDENTE'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Valor Bruto do Pagamento (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Forma de Pagamento PagBank
                </label>
                <select
                  value={simMethod}
                  onChange={(e) => setSimMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="pix">Pix (Taxa Zero PagBank)</option>
                  <option value="boleto">Boleto PagBank</option>
                </select>
              </div>

              {simMethod === 'cartao_credito' ? (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Número de Parcelas
                  </label>
                  <select
                    value={simInstallments}
                    onChange={(e) => setSimInstallments(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value={1}>1x à Vista ({pagbankOp.creditSightRate.toFixed(2)}%)</option>
                    <option value={2}>2x Parcelado ({pagbankOp.creditInstallments2to6Rate.toFixed(2)}%)</option>
                    <option value={3}>3x Parcelado ({pagbankOp.creditInstallments2to6Rate.toFixed(2)}%)</option>
                    <option value={6}>6x Parcelado ({pagbankOp.creditInstallments2to6Rate.toFixed(2)}%)</option>
                    <option value={10}>10x Parcelado ({pagbankOp.creditInstallments7to12Rate.toFixed(2)}%)</option>
                    <option value={12}>12x Parcelado ({pagbankOp.creditInstallments7to12Rate.toFixed(2)}%)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Bandeira
                  </label>
                  <select
                    value={simBrand}
                    onChange={(e) => setSimBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Mastercard">Mastercard</option>
                    <option value="Visa">Visa</option>
                    <option value="Elo">Elo</option>
                    <option value="Hipercard">Hipercard</option>
                  </select>
                </div>
              )}
            </div>

            {/* Cálculo Prévio do Webhook */}
            {(() => {
              let feeRate = 0;
              if (simMethod === 'pix') feeRate = pagbankOp.pixRate;
              else if (simMethod === 'cartao_debito') feeRate = pagbankOp.debitRate;
              else if (simMethod === 'cartao_credito') {
                feeRate = simInstallments === 1 
                  ? pagbankOp.creditSightRate 
                  : simInstallments <= 6 
                  ? pagbankOp.creditInstallments2to6Rate 
                  : pagbankOp.creditInstallments7to12Rate;
              }
              const feeVal = simAmount * (feeRate / 100);
              const netVal = simAmount - feeVal;

              return (
                <div className="bg-[#f4f5f6] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#d8d8d8]">
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div>
                      <span className="text-[#707174]">Bruto: </span>
                      <strong className="font-mono text-sm text-[#363739]">{formatBRL(simAmount)}</strong>
                    </div>
                    <div>
                      <span className="text-[#707174]">Taxa PagBank ({feeRate.toFixed(2)}%): </span>
                      <strong className="font-mono text-sm text-rose-600">-{formatBRL(feeVal)}</strong>
                    </div>
                    <div>
                      <span className="text-[#707174]">Crédito Líquido na Conta: </span>
                      <strong className="font-mono text-sm text-emerald-700 font-bold">{formatBRL(netVal)}</strong>
                    </div>
                  </div>

                  <button
                    onClick={handleSimulateWebhook}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Disparar Webhook & Efetuar Baixa no ERP</span>
                  </button>
                </div>
              );
            })()}
          </div>

          {/* HISTÓRICO DE TRANSAÇÕES RECEBIDAS E CONCILIADAS */}
          <div className="bg-white border border-[#d8d8d8] rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#d8d8d8] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#363739]">
                  Histórico de Baixas Automáticas PagBank
                </h3>
                <p className="text-xs text-[#707174]">
                  Transações recebidas via API PagBank com baixa imediata registrada no livro financeiro.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#f4f5f6] text-[#363739] border border-[#d8d8d8]">
                {pagBankTransactions.length} transações
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f4f5f6] border-b border-[#d8d8d8] text-[#707174] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Código / NSU</th>
                    <th className="py-3 px-4">Data / Hora</th>
                    <th className="py-3 px-4">Referência / Cliente</th>
                    <th className="py-3 px-3">Forma & Parcelas</th>
                    <th className="py-3 px-3 text-right">Valor Bruto</th>
                    <th className="py-3 px-3 text-right">Taxa PagBank</th>
                    <th className="py-3 px-3 text-right">Valor Líquido</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f5f6] font-sans">
                  {pagBankTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-[#f4f5f6]/50 transition-colors">
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-[#53383e]">{tx.transactionCode}</div>
                        <div className="text-[10px] text-[#707174]">NSU: {tx.nsu}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#707174] whitespace-nowrap">
                        {tx.paidAt}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#363739]">{tx.clientName}</div>
                        <div className="text-[10px] font-mono text-emerald-700">
                          {tx.orderCode ? `OS: ${tx.orderCode}` : 'Venda Direta'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-[#363739] capitalize">
                          {tx.paymentMethod.replace('_', ' ')}
                        </div>
                        <div className="text-[10px] text-[#707174]">
                          {tx.installments > 1 ? `${tx.installments}x de ${formatBRL(tx.grossAmount / tx.installments)}` : 'À vista'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#363739]">
                        {formatBRL(tx.grossAmount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-rose-600">
                        -{formatBRL(tx.feeAmount)} ({tx.feePercentage.toFixed(2)}%)
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        {formatBRL(tx.netAmount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          Baixado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CALCULADORA COMPARATIVA DE TAXAS */}
      {activeTab === 'calculadora' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#d8d8d8] rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#363739]">
                Simulador Comparativo de Taxas & Recebimento Líquido
              </h2>
              <p className="text-xs text-[#707174]">
                Veja quanto sua empresa recebe líquido em cada operadora cadastrada para um determinado valor de venda.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-[#f4f5f6] p-4 rounded-xl border border-[#d8d8d8]">
              <div>
                <label className="block text-[#363739] font-semibold mb-1">
                  Valor da Venda / Serviço (R$)
                </label>
                <input
                  type="number"
                  step="10"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-[#d8d8d8] rounded-lg text-xs font-mono font-bold text-[#363739]"
                />
              </div>

              <div>
                <label className="block text-[#363739] font-semibold mb-1">
                  Modalidade de Pagamento
                </label>
                <select
                  value={calcMethod}
                  onChange={(e) => setCalcMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-[#d8d8d8] rounded-lg text-xs font-semibold text-[#363739]"
                >
                  <option value="pix">Pix</option>
                  <option value="debito">Cartão de Débito</option>
                  <option value="credito_vista">Crédito à Vista (1x)</option>
                  <option value="credito_parcelado">Crédito Parcelado</option>
                </select>
              </div>

              {calcMethod === 'credito_parcelado' && (
                <div>
                  <label className="block text-[#363739] font-semibold mb-1">
                    Número de Parcelas
                  </label>
                  <select
                    value={calcInstallments}
                    onChange={(e) => setCalcInstallments(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#d8d8d8] rounded-lg text-xs font-semibold text-[#363739]"
                  >
                    <option value={2}>2x</option>
                    <option value={3}>3x</option>
                    <option value={4}>4x</option>
                    <option value={5}>5x</option>
                    <option value={6}>6x</option>
                    <option value={10}>10x</option>
                    <option value={12}>12x</option>
                  </select>
                </div>
              )}
            </div>

            {/* Resultado do Comparativo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cardOperators.map((op) => {
                const { rate, fee, net } = calculateRateAndNet(op);
                const isPagBank = op.code === 'pagbank';

                return (
                  <div
                    key={op.id}
                    className={`rounded-xl border p-5 transition-all ${
                      isPagBank 
                        ? 'bg-gradient-to-br from-emerald-50 to-teal-50/30 border-emerald-300 ring-1 ring-emerald-200' 
                        : 'bg-white border-[#d8d8d8]'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="font-bold text-sm text-[#363739] flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-[#53383e]" />
                        {op.name}
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                        D+{op.settlementTermDays}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between text-[#707174]">
                        <span>Alíquota Aplicada:</span>
                        <strong className="font-mono text-[#363739]">{rate.toFixed(2)}%</strong>
                      </div>
                      <div className="flex justify-between text-[#707174]">
                        <span>Desconto Operadora:</span>
                        <strong className="font-mono text-rose-600">-{formatBRL(fee)}</strong>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                        <span className="font-semibold text-slate-800">Líquido Creditado:</span>
                        <span className="font-mono text-base font-bold text-emerald-700">
                          {formatBRL(net)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CADASTRO / EDIÇÃO DE OPERADORA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#53383e]" />
                {editingOperator ? 'Editar Operadora & Taxas' : 'Cadastrar Nova Operadora de Cartão'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOperator} className="space-y-4 text-xs mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nome da Operadora *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PagBank, Cielo, Stone, Rede"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Identificador de Código</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: pagbank, cielo, stone"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">CNPJ da Adquirente</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Prazo Repasse (Dias)</label>
                  <input
                    type="number"
                    min={0}
                    value={settlementTermDays}
                    onChange={(e) => setSettlementTermDays(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Status</label>
                  <select
                    value={active ? 'true' : 'false'}
                    onChange={(e) => setActive(e.target.value === 'true')}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="true">Ativa</option>
                    <option value="false">Inativa</option>
                  </select>
                </div>
              </div>

              {/* Bloco de Taxas */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Alíquotas de Taxas (%)
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-0.5">Taxa Pix (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pixRate}
                      onChange={(e) => setPixRate(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Taxa Débito (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={debitRate}
                      onChange={(e) => setDebitRate(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Crédito à Vista 1x (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={creditSightRate}
                      onChange={(e) => setCreditSightRate(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Crédito 2x a 6x (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={creditInstallments2to6Rate}
                      onChange={(e) => setCreditInstallments2to6Rate(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Crédito 7x a 12x (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={creditInstallments7to12Rate}
                      onChange={(e) => setCreditInstallments7to12Rate(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Antecipação (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={anticipationRate}
                      onChange={(e) => setAnticipationRate(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Integração API & Baixa Automática */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    Integração Automática & Webhooks
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={autoReconcile}
                      onChange={(e) => setAutoReconcile(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span>Ativar Baixa Automática</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-slate-600 mb-0.5">Token de API / Chave Privada</label>
                    <input
                      type="text"
                      placeholder="pagbank_sec_..."
                      value={apiToken}
                      onChange={(e) => setApiToken(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Webhook de Retorno</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Observações Operacionais</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Utilizada para links de pagamento via WhatsApp e maquininha móvel."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  {editingOperator ? 'Salvar Alterações' : 'Cadastrar Operadora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
