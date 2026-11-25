import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, QrCode, ShieldCheck } from 'lucide-react';
import { ServiceOrder, Employee } from '../../types';
import { formatBRL, formatDateBR, useApp } from '../../context/AppContext';
import {
  buildCompanyCnpjPixBrCode,
  calculateServiceOrderFinancials,
  generatePixQrDataUrl,
  resolveServiceOrderWarrantyTerm
} from '../../utils/pixBrCode';

interface ServiceOrderPrintTemplateProps {
  os: ServiceOrder;
  employee?: Employee;
  includeWarrantyPage?: boolean;
}

export const ServiceOrderPrintTemplate: React.FC<ServiceOrderPrintTemplateProps> = ({
  os,
  employee,
  includeWarrantyPage = false
}) => {
  const { companySettings, warrantyPolicies, getPaidAmountForSource } = useApp();
  const [pixQrDataUrl, setPixQrDataUrl] = useState<string>('');
  const [copiedPix, setCopiedPix] = useState(false);

  const companyDisplayName = companySettings.tradeName || companySettings.companyName || 'FIRE GESTÃO';
  const companyAddressLine =
    [
      [companySettings.street, companySettings.number].filter(Boolean).join(', '),
      companySettings.neighborhood,
      companySettings.city ? `${companySettings.city} / ${companySettings.state || ''}` : ''
    ]
      .filter(Boolean)
      .join(' - ') || 'Endereço Comercial Cadastrado';

  const companyContactLine = [
    companySettings.phone ? `Tel: ${companySettings.phone}` : '',
    companySettings.email ? `E-mail: ${companySettings.email}` : '',
    companySettings.cnpj ? `CNPJ: ${companySettings.cnpj}` : ''
  ]
    .filter(Boolean)
    .join(' | ');

  // Check whether we have parts and/or services
  const activeParts = (os.parts || []).filter(p => p.name && p.name.trim() !== '');
  const activeServices = (os.services || []).filter(s => s.name && s.name.trim() !== '');

  const hasParts = activeParts.length > 0;
  const hasServices = activeServices.length > 0;

  const paidFromReceipts = getPaidAmountForSource('os', os.id);
  const financials = useMemo(
    () => calculateServiceOrderFinancials(os, paidFromReceipts),
    [os, paidFromReceipts]
  );

  const {
    partsTotal,
    servicesTotal,
    visitFee,
    discount,
    grandTotal,
    totalPaid,
    remainingBalance,
    hasDefinedValue,
    isFullyPaid
  } = financials;

  // BR Code PIX (Chave CNPJ + Saldo Restante ou Estático sem valor quando OS não tem valor definido)
  const pixData = useMemo(
    () =>
      buildCompanyCnpjPixBrCode({
        company: companySettings,
        amount: hasDefinedValue && !isFullyPaid ? remainingBalance : null,
        txidSource: os.code
      }),
    [companySettings, hasDefinedValue, isFullyPaid, remainingBalance, os.code]
  );

  useEffect(() => {
    let active = true;
    generatePixQrDataUrl(pixData.payload, 240).then(url => {
      if (active) setPixQrDataUrl(url);
    });
    return () => {
      active = false;
    };
  }, [pixData.payload]);

  const warrantyInfo = useMemo(
    () => resolveServiceOrderWarrantyTerm(os, warrantyPolicies, companySettings),
    [os, warrantyPolicies, companySettings]
  );

  const handleCopyPixPayload = () => {
    try {
      navigator.clipboard.writeText(pixData.payload);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    } catch {}
  };

  // Address parsing
  const addressParts = (os.clientAddress || '').split(' - ');
  const streetPart = addressParts[0] || os.clientAddress || '';
  const cityStatePart =
    addressParts[1] ||
    (companySettings.city ? `${companySettings.city} / ${companySettings.state || ''}` : '-');

  // Checklists
  const entryChecklist =
    os.checklists && os.checklists.length > 0
      ? os.checklists.slice(0, 4)
      : [
          { id: 'c1', label: 'Inspeção inicial realizada', status: 'ok' },
          { id: 'c2', label: 'Condições estruturais verificadas', status: 'ok' },
          { id: 'c3', label: 'Acessórios conferidos', status: 'ok' },
          { id: 'c4', label: 'Alimentação/conexões conferidas', status: 'ok' }
        ];

  const exitChecklist =
    os.checklists && os.checklists.length > 4
      ? os.checklists.slice(4, 8)
      : [
          { id: 'e1', label: 'Teste de funcionamento final', status: 'nao_aplicavel' },
          { id: 'e2', label: 'Conferência técnica concluída', status: 'nao_aplicavel' },
          { id: 'e3', label: 'Entrega validada pelo cliente', status: 'nao_aplicavel' }
        ];

  const renderStandardOsHeader = (headerBadge: string, subLabel?: string) => (
    <div className="flex items-start justify-between pb-3 mb-3 border-b-2 border-slate-900 gap-4">
      {/* Left: Logo & Company Information */}
      <div className="flex items-center gap-3.5">
        {companySettings.logoUrl ? (
          <img
            src={companySettings.logoUrl}
            alt={companyDisplayName}
            className="max-h-16 max-w-[160px] object-contain shrink-0 rounded"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex flex-col items-center justify-center text-white shrink-0 shadow-xs border border-orange-600">
            <span className="text-lg font-black leading-none">
              {companyDisplayName.slice(0, 2).toUpperCase()}
            </span>
            <span className="text-[7px] font-black tracking-widest uppercase mt-0.5 px-1 truncate max-w-full">
              {companyDisplayName.slice(0, 8)}
            </span>
          </div>
        )}

        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
            {companyDisplayName}
          </h1>
          {companySettings.companyName && companySettings.companyName !== companySettings.tradeName && (
            <p className="text-[9.5px] text-slate-700 font-bold uppercase tracking-wider mt-1">
              {companySettings.companyName}
            </p>
          )}
          <p className="text-[9px] text-slate-600 font-medium uppercase tracking-wide mt-0.5">
            {companyAddressLine}
          </p>
          {companyContactLine && (
            <p className="text-[9.5px] text-slate-800 font-semibold mt-0.5">{companyContactLine}</p>
          )}
        </div>
      </div>

      {/* Top Right: Prominent OS Number Box */}
      <div className="border-2 border-slate-900 rounded-lg overflow-hidden bg-white text-center min-w-[200px] shrink-0 shadow-2xs">
        <div className="bg-slate-900 text-white px-3 py-1 text-[9.5px] font-black uppercase tracking-widest">
          {headerBadge}
        </div>
        <div className="p-2 bg-slate-50">
          <div className="text-lg sm:text-xl font-black font-mono text-slate-900 tracking-wider">
            OS Nº {os.code}
          </div>
          <div className="text-[8.5px] text-slate-600 font-bold mt-0.5 uppercase tracking-wide">
            {subLabel || `Emissão: ${formatDateBR(os.openDate)}`}
          </div>
        </div>
      </div>
    </div>
  );

  const renderClientCard = () => (
    <div className="border border-slate-300 rounded-sm overflow-hidden">
      <div className="bg-[#eef3f8] px-2.5 py-1 border-b border-slate-300 font-bold text-[10px] text-slate-800 uppercase tracking-wide">
        DADOS DO CLIENTE
      </div>
      <div className="p-2.5 space-y-1 text-[11px]">
        <div>
          <span className="font-bold text-slate-700">NOME: </span>
          <span className="font-semibold text-slate-900 uppercase">{os.clientName}</span>
        </div>
        <div className="flex justify-between gap-2">
          <div>
            <span className="font-bold text-slate-700">CPF/CNPJ: </span>
            <span className="font-medium text-slate-800">{os.clientDocument || '-'}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">TEL: </span>
            <span className="font-medium text-slate-800">{os.clientPhone || '-'}</span>
          </div>
        </div>
        <div>
          <span className="font-bold text-slate-700">END.: </span>
          <span className="text-slate-800">{streetPart || '-'}</span>
        </div>
        <div>
          <span className="font-bold text-slate-700">CIDADE: </span>
          <span className="text-slate-800">{cityStatePart}</span>
        </div>
      </div>
    </div>
  );

  const mainHeaderBadge =
    os.status === 'orcamento_aberto' || os.status === 'aguardando_aprovacao'
      ? 'ORÇAMENTO & PROPOSTA'
      : 'ORDEM DE SERVIÇO';

  return (
    <div
      id="printable-document"
      className="w-full bg-white text-[#1f2937] text-[10.5px] leading-tight font-sans p-5 sm:p-7 max-w-[820px] mx-auto border border-slate-300 shadow-sm print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full"
    >
      {/* ===================== PÁGINA 1: ORDEM DE SERVIÇO ===================== */}
      <div>
        {/* Standard OS Header */}
        {renderStandardOsHeader(mainHeaderBadge)}

        {/* Top 2 Columns: DADOS DO CLIENTE & PRAZOS E RESPONSÁVEL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {renderClientCard()}

          {/* Prazos e Responsável */}
          <div className="border border-slate-300 rounded-sm overflow-hidden">
            <div className="bg-[#eef3f8] px-2.5 py-1 border-b border-slate-300 font-bold text-[10px] text-slate-800 uppercase tracking-wide">
              PRAZOS E RESPONSÁVEL
            </div>
            <div className="p-2.5 space-y-1 text-[11px]">
              <div className="flex justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-700">ENTRADA: </span>
                  <span className="text-slate-900">{formatDateBR(os.openDate)}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">PREVISÃO: </span>
                  <span className="text-slate-900">{formatDateBR(os.forecastDate)}</span>
                </div>
              </div>
              <div className="flex justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-700">ENTREGA SERVIÇOS: </span>
                  <span className="font-semibold text-slate-900">
                    {os.completionDate ? formatDateBR(os.completionDate) : 'Em andamento'}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">GARANTIA: </span>
                  <span className="text-slate-900 font-medium">
                    {os.warrantyPeriodDays} Dias{' '}
                    {os.warrantyExpiresAt ? `(até ${formatDateBR(os.warrantyExpiresAt)})` : ''}
                  </span>
                </div>
              </div>
              <div>
                <span className="font-bold text-slate-700">TÉCNICO: </span>
                <span className="font-semibold text-slate-900 uppercase">
                  {employee?.name || 'Equipe Técnica'}
                </span>
              </div>
              {os.contractReference && (
                <div>
                  <span className="font-bold text-slate-700">REF. CONTRATO: </span>
                  <span className="font-semibold text-slate-900">{os.contractReference}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Equipamento e Diagnóstico */}
        <div className="border border-slate-300 rounded-sm overflow-hidden mb-3">
          <div className="bg-[#eef3f8] px-2.5 py-1 border-b border-slate-300 font-bold text-[10px] text-slate-800 uppercase tracking-wide">
            EQUIPAMENTO E DIAGNÓSTICO
          </div>
          <div className="p-2.5 space-y-1.5">
            <div>
              <span className="font-bold text-slate-800">EQUIPAMENTO: </span>
              <span className="font-semibold text-slate-900">
                {os.equipmentType || 'Equipamento / Estrutura atendida'}
                {os.equipmentModel ? ` · ${os.equipmentModel}` : ''}
                {os.equipmentSerial ? ` (S/N: ${os.equipmentSerial})` : ''}
              </span>
            </div>

            <div>
              <div className="bg-slate-100 px-2 py-0.5 border border-slate-200 text-[9px] font-bold text-slate-700 uppercase">
                DEFEITO RELATADO / DESCRIÇÃO DOS SERVIÇOS:
              </div>
              <div className="p-1.5 text-slate-800 text-[11px] font-medium min-h-[22px]">
                {os.description || 'Manutenção / Serviço Técnico'}
              </div>
            </div>
          </div>
        </div>

        {/* Checklists: ENTRADA & SAÍDA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {/* Checklist Entrada */}
          <div className="border border-slate-300 rounded-sm overflow-hidden">
            <div className="bg-[#eef3f8] px-2.5 py-1 border-b border-slate-300 font-bold text-[10px] text-slate-800 uppercase tracking-wide">
              CHECKLIST ENTRADA
            </div>
            <div className="p-2 grid grid-cols-2 gap-1.5 text-[10px]">
              {entryChecklist.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1 text-slate-800">
                  <span className="w-3.5 h-3.5 rounded-xs bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                    ✓
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Checklist Saída */}
          <div className="border border-slate-300 rounded-sm overflow-hidden">
            <div className="bg-[#eef3f8] px-2.5 py-1 border-b border-slate-300 font-bold text-[10px] text-slate-800 uppercase tracking-wide">
              CHECKLIST SAÍDA
            </div>
            <div className="p-2 grid grid-cols-2 gap-1.5 text-[10px]">
              {exitChecklist.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1 text-slate-800">
                  <span
                    className={`w-3.5 h-3.5 rounded-xs text-white flex items-center justify-center text-[9px] font-bold shrink-0 ${
                      item.status === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  >
                    {item.status === 'ok' ? '✓' : '✗'}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PEÇAS / PRODUTOS & MÃO DE OBRA */}
        {hasParts && hasServices && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            {/* Peças / Produtos */}
            <div className="border border-slate-300 rounded-sm overflow-hidden">
              <div className="bg-[#eef3f8] px-2.5 py-1 border-b border-slate-300 font-bold text-[10px] text-slate-800 uppercase tracking-wide">
                PEÇAS / PRODUTOS
              </div>
              <table className="w-full text-left text-[10px]">
                <thead className="bg-slate-50 border-b border-slate-300 text-slate-800 font-bold">
                  <tr>
                    <th className="p-1.5">DESCRIÇÃO</th>
                    <th className="p-1.5 text-center w-12">QTD</th>
                    <th className="p-1.5 text-right w-20">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeParts.map((p, i) => (
                    <tr key={p.id || i}>
                      <td className="p-1.5 text-slate-900 leading-snug">{p.name}</td>
                      <td className="p-1.5 text-center text-slate-700 font-mono">
                        {Number(p.quantity).toFixed(2)}
                      </td>
                      <td className="p-1.5 text-right text-slate-900 font-mono font-medium">
                        {formatBRL(Number(p.price || 0) * Number(p.quantity || 1))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mão de Obra */}
            <div className="border border-slate-300 rounded-sm overflow-hidden">
              <div className="bg-[#eef3f8] px-2.5 py-1 border-b border-slate-300 font-bold text-[10px] text-slate-800 uppercase tracking-wide">
                MÃO DE OBRA
              </div>
              <table className="w-full text-left text-[10px]">
                <thead className="bg-slate-50 border-b border-slate-300 text-slate-800 font-bold">
                  <tr>
                    <th className="p-1.5">DESCRIÇÃO</th>
                    <th className="p-1.5 text-center w-12">QTD</th>
                    <th className="p-1.5 text-right w-20">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeServices.map((s, i) => (
                    <tr key={s.id || i}>
                      <td className="p-1.5 text-slate-900 leading-snug">{s.name}</td>
                      <td className="p-1.5 text-center text-slate-700 font-mono">
                        {Number(s.hours || 1).toFixed(2)}
                      </td>
                      <td className="p-1.5 text-right text-slate-900 font-mono font-medium">
                        {formatBRL(Number(s.price || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {hasParts && !hasServices && (
          <div className="mb-3">
            <div className="border border-slate-300 rounded-sm overflow-hidden">
              <div className="bg-[#eef3f8] px-2.5 py-1 border-b border-slate-300 font-bold text-[10px] text-slate-800 uppercase tracking-wide">
                PEÇAS / PRODUTOS (VENDA)
              </div>
              <table className="w-full text-left text-[10px]">
                <thead className="bg-slate-50 border-b border-slate-300 text-slate-800 font-bold">
                  <tr>
                    <th className="p-1.5">DESCRIÇÃO</th>
                    <th className="p-1.5 text-center w-16">QTD</th>
                    <th className="p-1.5 text-right w-24">UNITÁRIO</th>
                    <th className="p-1.5 text-right w-24">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeParts.map((p, i) => (
                    <tr key={p.id || i}>
                      <td className="p-1.5 text-slate-900 font-medium leading-snug">{p.name}</td>
                      <td className="p-1.5 text-center text-slate-700 font-mono">
                        {Number(p.quantity).toFixed(2)}
                      </td>
                      <td className="p-1.5 text-right text-slate-700 font-mono">
                        {formatBRL(Number(p.price || 0))}
                      </td>
                      <td className="p-1.5 text-right text-slate-900 font-mono font-bold">
                        {formatBRL(Number(p.price || 0) * Number(p.quantity || 1))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!hasParts && hasServices && (
          <div className="mb-3">
            <div className="border border-slate-300 rounded-sm overflow-hidden">
              <div className="bg-[#eef3f8] px-2.5 py-1 border-b border-slate-300 font-bold text-[10px] text-slate-800 uppercase tracking-wide">
                MÃO DE OBRA (SERVIÇOS)
              </div>
              <table className="w-full text-left text-[10px]">
                <thead className="bg-slate-50 border-b border-slate-300 text-slate-800 font-bold">
                  <tr>
                    <th className="p-1.5">DESCRIÇÃO DO SERVIÇO</th>
                    <th className="p-1.5 text-center w-16">HORAS/QTD</th>
                    <th className="p-1.5 text-right w-24">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeServices.map((s, i) => (
                    <tr key={s.id || i}>
                      <td className="p-1.5 text-slate-900 font-medium leading-snug">{s.name}</td>
                      <td className="p-1.5 text-center text-slate-700 font-mono">
                        {Number(s.hours || 1).toFixed(2)}
                      </td>
                      <td className="p-1.5 text-right text-slate-900 font-mono font-bold">
                        {formatBRL(Number(s.price || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bottom Section: RESUMO FINANCEIRO & QR CODE PIX INTELIGENTE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 page-break-inside-avoid">
          {/* Resumo Financeiro */}
          <div className="border border-slate-300 rounded-sm overflow-hidden">
            <div className="bg-[#eef3f8] px-2.5 py-1 border-b border-slate-300 font-bold text-[10px] text-slate-800 uppercase tracking-wide">
              RESUMO FINANCEIRO
            </div>
            <table className="w-full text-[11px] font-mono">
              <tbody>
                {hasParts && (
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 text-slate-700 font-sans">Total Produtos</td>
                    <td className="p-1.5 text-right text-slate-900">{formatBRL(partsTotal)}</td>
                  </tr>
                )}
                {hasServices && (
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 text-slate-700 font-sans">Total Serviços</td>
                    <td className="p-1.5 text-right text-slate-900">{formatBRL(servicesTotal)}</td>
                  </tr>
                )}
                {visitFee > 0 && (
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 text-slate-700 font-sans">Taxa de Visita Técnica</td>
                    <td className="p-1.5 text-right text-slate-900">{formatBRL(visitFee)}</td>
                  </tr>
                )}
                {discount > 0 && (
                  <tr className="border-b border-slate-200 text-rose-700">
                    <td className="p-1.5 font-sans">Desconto Concedido</td>
                    <td className="p-1.5 text-right">-{formatBRL(discount)}</td>
                  </tr>
                )}
                <tr className="border-b border-slate-300 bg-[#e8f5e9] font-bold text-slate-900">
                  <td className="p-1.5 font-sans font-black">VALOR TOTAL DA OS</td>
                  <td className="p-1.5 text-right font-black text-slate-900">
                    {formatBRL(grandTotal)}
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-1.5 font-sans text-slate-700 font-bold">
                    TOTAL PAGO (ENTRADAS / PARCIAIS)
                  </td>
                  <td className="p-1.5 text-right font-bold text-emerald-700">
                    {formatBRL(totalPaid)}
                  </td>
                </tr>
                <tr
                  className={`font-bold ${
                    remainingBalance > 0.01
                      ? 'bg-[#ffebee] text-rose-800'
                      : 'bg-emerald-50 text-emerald-800'
                  }`}
                >
                  <td className="p-1.5 font-sans font-black">SALDO RESTANTE A PAGAR</td>
                  <td className="p-1.5 text-right font-black">{formatBRL(remainingBalance)}</td>
                </tr>
              </tbody>
            </table>

            {os.payments && os.payments.length > 0 && (
              <div className="border-t border-slate-300 bg-slate-50 px-2 py-1.5">
                <div className="text-[8.5px] font-bold uppercase tracking-wide text-slate-700 mb-1">
                  LANÇAMENTOS E PARCELAS
                </div>
                <table className="w-full text-[9px]">
                  <tbody className="divide-y divide-slate-200">
                    {os.payments.map((p, idx) => {
                      const tipoLabel =
                        p.entryType === 'entrada'
                          ? 'Entrada'
                          : p.entryType === 'parcela'
                          ? `Parcela ${p.installmentNumber || idx + 1}${
                              p.totalInstallments ? `/${p.totalInstallments}` : ''
                            }`
                          : 'À Vista';
                      const methodLabel =
                        p.method === 'pix'
                          ? 'PIX'
                          : p.method === 'dinheiro'
                          ? 'Dinheiro'
                          : p.method === 'cartao_credito'
                          ? 'Crédito'
                          : p.method === 'cartao_debito'
                          ? 'Débito'
                          : p.method === 'boleto'
                          ? 'Boleto'
                          : 'Faturado 30d';
                      const statusText =
                        p.status === 'pago'
                          ? `Pago${p.paidAt ? ` em ${formatDateBR(p.paidAt)}` : ''}`
                          : `Venc. ${p.dueDate ? formatDateBR(p.dueDate) : '-'}`;

                      return (
                        <tr key={p.id || idx}>
                          <td className="py-0.5 text-slate-800">
                            <span className="font-bold">{tipoLabel}</span> · {methodLabel}
                          </td>
                          <td
                            className={`py-0.5 ${
                              p.status === 'pago'
                                ? 'text-emerald-700 font-semibold'
                                : 'text-slate-600'
                            }`}
                          >
                            {statusText}
                          </td>
                          <td className="py-0.5 text-right font-mono tabular-nums font-bold text-slate-900">
                            {formatBRL(Number(p.amount || 0))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* QR Code PIX Inteligente (Chave CNPJ + Saldo Restante) */}
          <div className="border-2 border-slate-800 rounded-sm overflow-hidden flex flex-col bg-white">
            <div className="bg-slate-900 text-white px-2.5 py-1.5 flex items-center justify-between">
              <span className="font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                Pague via PIX (Chave CNPJ)
              </span>
              <span className="text-[8.5px] font-mono font-bold text-emerald-300">BR Code</span>
            </div>

            <div className="p-3 flex-1 flex flex-col items-center justify-center text-center gap-1.5">
              {isFullyPaid ? (
                <div className="py-4 px-3 rounded-lg bg-emerald-50 border border-emerald-200 w-full">
                  <div className="text-xs font-black uppercase text-emerald-800">
                    OS 100% Quitada
                  </div>
                  <div className="text-lg font-black font-mono text-emerald-700 mt-0.5">
                    Saldo: {formatBRL(0)}
                  </div>
                  <div className="text-[9px] text-emerald-700 mt-1">
                    Chave PIX CNPJ: {pixData.pixKeyDisplay}
                  </div>
                </div>
              ) : (
                <>
                  {/* QR Code Escaneável BR Code */}
                  <div className="w-32 h-32 border-2 border-slate-900 p-1 bg-white rounded-md shadow-2xs flex items-center justify-center">
                    {pixQrDataUrl ? (
                      <img
                        src={pixQrDataUrl}
                        alt="QR Code PIX BR Code"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-[9px] text-slate-400">Gerando QR PIX...</div>
                    )}
                  </div>

                  {/* Legenda Obrigatória & Valor Correspondente */}
                  <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                    Pague via PIX (Chave CNPJ)
                  </div>

                  {hasDefinedValue ? (
                    <div className="px-3 py-1 rounded bg-emerald-50 border border-emerald-300">
                      <span className="text-[9px] font-bold uppercase text-emerald-800 mr-1">
                        Saldo a Pagar:
                      </span>
                      <span className="text-sm font-black font-mono text-emerald-900">
                        {formatBRL(remainingBalance)}
                      </span>
                    </div>
                  ) : (
                    <div className="px-2.5 py-1 rounded bg-amber-50 border border-amber-300 text-[9px] font-bold text-amber-900">
                      QR Code Estático · Valor em aberto (digite o valor no app do banco)
                    </div>
                  )}

                  <div className="text-[9.5px] font-bold text-slate-800">
                    Chave CNPJ: <span className="font-mono">{pixData.pixKeyDisplay}</span>
                  </div>
                  <div className="text-[8.5px] text-slate-600 font-medium">
                    Favorecido: {companyDisplayName}
                    {totalPaid > 0.01 && hasDefinedValue && (
                      <span> · (Abatido {formatBRL(totalPaid)} já pago)</span>
                    )}
                  </div>

                  {!pixData.hasValidCnpjKey && (
                    <div className="text-[8px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 print:hidden">
                      Cadastre o CNPJ completo da empresa em Configurações para chave PIX CNPJ válida.
                    </div>
                  )}

                  {/* Botão Copiar PIX Copia e Cola (não sai na impressão) */}
                  <button
                    type="button"
                    onClick={handleCopyPixPayload}
                    className="print:hidden mt-1 inline-flex items-center gap-1 px-2.5 py-1 text-[9.5px] font-bold rounded bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                  >
                    {copiedPix ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>PIX Copia e Cola Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar PIX Copia e Cola</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Registro Fotográfico (Início / Antes dos Serviços & Local de Entrega) */}
        {((os.entryPhotos && os.entryPhotos.length > 0) ||
          (os.exitPhotos && os.exitPhotos.length > 0)) && (
          <div className="mb-4 border border-slate-300 rounded-sm overflow-hidden page-break-inside-avoid">
            <div className="bg-[#eef3f8] px-2.5 py-1 border-b border-slate-300 font-bold text-[10px] text-slate-800 uppercase tracking-wide">
              REGISTRO FOTOGRÁFICO — INÍCIO (ANTES DOS SERVIÇOS) &amp; LOCAL DE ENTREGA
            </div>
            <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white">
              <div>
                <div className="text-[9px] font-bold uppercase text-amber-800 mb-1.5">
                  Início — Antes de Começar os Serviços ({os.entryPhotos?.length || 0})
                </div>
                {os.entryPhotos && os.entryPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {os.entryPhotos.map((src, idx) => (
                      <div
                        key={`p-entry-${idx}`}
                        className="border border-slate-200 rounded-xs overflow-hidden bg-slate-50 aspect-4/3"
                      >
                        <img
                          src={src}
                          alt={`Início ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[9px] text-slate-400 italic">
                    Sem fotos registradas nesta etapa.
                  </div>
                )}
              </div>

              <div>
                <div className="text-[9px] font-bold uppercase text-emerald-800 mb-1.5">
                  Local de Entrega dos Serviços ({os.exitPhotos?.length || 0})
                </div>
                {os.exitPhotos && os.exitPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {os.exitPhotos.map((src, idx) => (
                      <div
                        key={`p-exit-${idx}`}
                        className="border border-slate-200 rounded-xs overflow-hidden bg-slate-50 aspect-4/3"
                      >
                        <img
                          src={src}
                          alt={`Entrega ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[9px] text-slate-400 italic">
                    Sem fotos registradas nesta etapa.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Signatures Page 1 */}
        <div className="pt-3 border-t border-slate-300 page-break-inside-avoid">
          <div className="grid grid-cols-2 gap-6 text-center">
            <div className="flex flex-col items-center">
              {os.signature ? (
                <div className="mb-0.5">
                  <img
                    src={os.signature.signatureDataUrl}
                    alt="Assinatura"
                    className="h-7 max-w-[180px]"
                  />
                  <div className="text-[7.5px] text-emerald-700 font-semibold">
                    Assinado Digitalmente na Tela Touch
                  </div>
                </div>
              ) : (
                <div className="h-6"></div>
              )}
              <div className="w-52 border-t border-slate-800 pt-1">
                <div className="font-bold text-[10.5px] text-slate-900 uppercase">
                  {os.clientName}
                </div>
                <div className="text-[8.5px] text-slate-500 font-medium">Assinatura do Cliente</div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="h-6 flex items-center justify-center font-serif italic text-slate-800 text-xs font-bold">
                {companyDisplayName}
              </div>
              <div className="w-52 border-t border-slate-800 pt-1">
                <div className="font-bold text-[10.5px] text-slate-900 uppercase">
                  {companyDisplayName}
                </div>
                <div className="text-[8.5px] text-slate-500 font-medium">
                  Assinatura do Responsável Técnico
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Line Page 1 */}
        <div className="mt-2.5 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-500 font-mono">
          <span>{companyDisplayName.toUpperCase()}</span>
          <span className="font-bold text-slate-800">ORDEM DE SERVIÇO Nº {os.code}</span>
          <span>VIA DO CLIENTE E CONTROLE INTERNO</span>
        </div>
      </div>

      {/* ===================== PÁGINA 2 (OPCIONAL): TERMO DE GARANTIA ===================== */}
      {includeWarrantyPage && warrantyInfo.hasWarrantyTerm && (
        <div className="os-page-break mt-8 pt-6 border-t-4 border-dashed border-slate-300 print:mt-0 print:pt-0 print:border-none">
          {/* Repetição Obrigatória do Cabeçalho Padrão da OS com Número da OS em Destaque */}
          {renderStandardOsHeader('TERMO DE GARANTIA', `Vinculado à OS Nº ${os.code}`)}

          {/* Dados do Cliente + Resumo da Cobertura de Garantia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {renderClientCard()}

            <div className="border border-slate-300 rounded-sm overflow-hidden">
              <div className="bg-[#eef3f8] px-2.5 py-1 border-b border-slate-300 font-bold text-[10px] text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-800" />
                DETALHES DA GARANTIA
              </div>
              <div className="p-2.5 space-y-1 text-[11px]">
                <div>
                  <span className="font-bold text-slate-700">POLÍTICA / MODALIDADE: </span>
                  <span className="font-semibold text-slate-900">{warrantyInfo.policyName}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-700">PRAZO: </span>
                    <span className="font-black text-slate-900">
                      {warrantyInfo.days > 0 ? `${warrantyInfo.days} Dias` : 'Conforme Termo'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">VALIDADE: </span>
                    <span className="font-semibold text-slate-900">
                      {warrantyInfo.expiresAt
                        ? formatDateBR(warrantyInfo.expiresAt)
                        : 'A partir da entrega'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="font-bold text-slate-700">EQUIPAMENTO: </span>
                  <span className="text-slate-900">
                    {os.equipmentType || '-'}
                    {os.equipmentModel ? ` · ${os.equipmentModel}` : ''}
                    {os.equipmentSerial ? ` (S/N: ${os.equipmentSerial})` : ''}
                  </span>
                </div>
                {os.contractReference && (
                  <div>
                    <span className="font-bold text-slate-700">REF. CONTRATO: </span>
                    <span className="font-semibold text-slate-900">{os.contractReference}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Corpo Completo do Termo de Garantia */}
          <div className="border-2 border-slate-800 rounded-sm overflow-hidden mb-6">
            <div className="bg-slate-900 text-white px-3 py-1.5 font-black text-[10.5px] uppercase tracking-wider flex items-center justify-between">
              <span>CLÁUSULAS E CONDIÇÕES DO TERMO DE GARANTIA</span>
              <span className="font-mono text-amber-300">OS Nº {os.code}</span>
            </div>
            <div className="p-4 bg-white text-[11px] leading-relaxed text-slate-800 whitespace-pre-line min-h-[260px]">
              {warrantyInfo.termsText}
            </div>
          </div>

          {/* Declaração de Ciência & Assinaturas */}
          <div className="mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded text-[9.5px] text-slate-700">
            Declaro estar ciente e de acordo com todos os prazos, coberturas e exclusões descritas neste Termo de Garantia, referente aos serviços e/ou peças executados na{' '}
            <strong>Ordem de Serviço Nº {os.code}</strong>.
          </div>

          <div className="pt-4 border-t border-slate-300 page-break-inside-avoid">
            <div className="grid grid-cols-2 gap-6 text-center">
              <div className="flex flex-col items-center">
                {os.signature ? (
                  <div className="mb-0.5">
                    <img
                      src={os.signature.signatureDataUrl}
                      alt="Assinatura do Cliente"
                      className="h-7 max-w-[180px]"
                    />
                  </div>
                ) : (
                  <div className="h-7"></div>
                )}
                <div className="w-56 border-t border-slate-800 pt-1">
                  <div className="font-bold text-[10.5px] text-slate-900 uppercase">
                    {os.clientName}
                  </div>
                  <div className="text-[8.5px] text-slate-500 font-medium">
                    Ciência e Assinatura do Cliente
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="h-7 flex items-center justify-center font-serif italic text-slate-800 text-xs font-bold">
                  {companyDisplayName}
                </div>
                <div className="w-56 border-t border-slate-800 pt-1">
                  <div className="font-bold text-[10.5px] text-slate-900 uppercase">
                    {companyDisplayName}
                  </div>
                  <div className="text-[8.5px] text-slate-500 font-medium">
                    Responsável pela Garantia
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Page 2 */}
          <div className="mt-3 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-500 font-mono">
            <span>{companyDisplayName.toUpperCase()} · CERTIFICADO DE GARANTIA</span>
            <span className="font-bold text-slate-800">
              ORDEM DE SERVIÇO Nº {os.code} · TERMO DE GARANTIA
            </span>
            <span>PÁGINA ANEXA À OS</span>
          </div>
        </div>
      )}
    </div>
  );
};
