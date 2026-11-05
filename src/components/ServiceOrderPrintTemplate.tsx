import React from 'react';
import { ServiceOrder, Employee } from '../types';
import { formatBRL, formatDateBR, useApp } from '../context/AppContext';

interface ServiceOrderPrintTemplateProps {
  os: ServiceOrder;
  employee?: Employee;
}

export const ServiceOrderPrintTemplate: React.FC<ServiceOrderPrintTemplateProps> = ({ os, employee }) => {
  const { companySettings } = useApp();
  // Check whether we have parts and/or services
  const activeParts = (os.parts || []).filter(p => p.name && p.name.trim() !== '');
  const activeServices = (os.services || []).filter(s => s.name && s.name.trim() !== '');

  const hasParts = activeParts.length > 0;
  const hasServices = activeServices.length > 0;

  const partsTotal = activeParts.reduce((acc, p) => acc + (Number(p.price || 0) * Number(p.quantity || 1)), 0);
  const servicesTotal = activeServices.reduce((acc, s) => acc + Number(s.price || 0), 0);
  const visitFee = Number(os.visitFee || 0);
  const discount = Number(os.calculatedDiscount || 0);
  const grandTotal = Math.max(0, partsTotal + servicesTotal + visitFee - discount);

  const isPaid = os.paymentStatus === 'pago';
  const totalPaid = isPaid ? grandTotal : 0;
  const totalDue = Math.max(0, grandTotal - totalPaid);

  // Address parsing
  const addressParts = (os.clientAddress || '').split(' - ');
  const streetPart = addressParts[0] || os.clientAddress || '';
  const cityStatePart = addressParts[1] || 'Brasília / DF';

  // Checklists (defaulting to pool maintenance items if empty)
  const entryChecklist = os.checklists && os.checklists.length > 0
    ? os.checklists.slice(0, 4)
    : [
        { id: 'c1', label: 'Dreno fundo', status: 'ok' },
        { id: 'c2', label: 'Retorno', status: 'ok' },
        { id: 'c3', label: 'Tubulações de ida e volta p/ Aquec.', status: 'ok' },
        { id: 'c4', label: 'Cabos adequados', status: 'ok' }
      ];

  const exitChecklist = os.checklists && os.checklists.length > 4
    ? os.checklists.slice(4, 8)
    : [
        { id: 'e1', label: 'Teste de funcionamento do aquec', status: 'nao_aplicavel' },
        { id: 'e2', label: 'Controlador testado', status: 'nao_aplicavel' },
        { id: 'e3', label: 'Bomba funcionando', status: 'nao_aplicavel' }
      ];

  return (
    <div id="printable-document" className="w-full bg-white text-[#1f2937] text-[10.5px] leading-tight font-sans p-5 sm:p-7 max-w-[820px] mx-auto border border-slate-300 shadow-sm print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full">
      {/* Header: Logo & Company on Left, OS Number on Top Right */}
      <div className="flex items-start justify-between pb-3 border-b-2 border-slate-900 gap-4">
        {/* Left: Logo & Company Information */}
        <div className="flex items-center gap-3.5">
          {/* Logo Oficial ou Emblema Padronizado */}
          {companySettings.logoUrl ? (
            <img
              src={companySettings.logoUrl}
              alt={companySettings.tradeName || companySettings.companyName || 'Logomarca'}
              className="max-h-16 max-w-[160px] object-contain shrink-0 rounded"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex flex-col items-center justify-center text-white shrink-0 shadow-xs border border-blue-600">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12h20" />
                <path d="M20 12v8H4v-8" />
                <path d="m4 8 16-4" />
                <path d="m4 4 16 4" />
                <circle cx="12" cy="12" r="3" fill="#ffffff" stroke="none" />
              </svg>
              <span className="text-[7px] font-black tracking-widest uppercase mt-0.5">
                {(companySettings.tradeName || companySettings.companyName || 'EMPRESA').slice(0, 10)}
              </span>
            </div>
          )}

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
              {companySettings.tradeName || companySettings.companyName || 'EMPRESA'}
            </h1>
            {companySettings.companyName && companySettings.companyName !== companySettings.tradeName && (
              <p className="text-[9.5px] text-slate-700 font-bold uppercase tracking-wider mt-1">
                {companySettings.companyName}
              </p>
            )}
            <p className="text-[9px] text-slate-600 font-medium uppercase tracking-wide mt-0.5">
              {[
                [companySettings.street, companySettings.number].filter(Boolean).join(', '),
                companySettings.neighborhood,
                companySettings.city ? `${companySettings.city} / ${companySettings.state || ''}` : ''
              ].filter(Boolean).join(' - ') || 'Endereço Comercial Cadastrado'}
            </p>
            <p className="text-[9.5px] text-slate-800 font-semibold mt-0.5">
              {[
                companySettings.phone ? `Tel: ${companySettings.phone}` : '',
                companySettings.email ? `E-mail: ${companySettings.email}` : '',
                companySettings.cnpj ? `CNPJ: ${companySettings.cnpj}` : ''
              ].filter(Boolean).join(' | ')}
            </p>
          </div>
        </div>

        {/* Top Right: Prominent OS / Orçamento Number Box */}
        <div className="border-2 border-slate-900 rounded-lg overflow-hidden bg-white text-center min-w-[190px] shrink-0 shadow-2xs">
          <div className="bg-slate-900 text-white px-3 py-1 text-[9.5px] font-black uppercase tracking-widest">
            {os.status === 'orcamento_aberto' || os.status === 'aguardando_aprovacao'
              ? 'ORÇAMENTO & PROPOSTA'
              : 'ORDEM DE SERVIÇO'}
          </div>
          <div className="p-2 bg-slate-50">
            <div className="text-lg sm:text-xl font-black font-mono text-slate-900 tracking-wider">
              Nº {os.code}
            </div>
            <div className="text-[8.5px] text-slate-600 font-bold mt-0.5 uppercase tracking-wide">
              Emissão: {formatDateBR(os.openDate)}
            </div>
          </div>
        </div>
      </div>

      {/* Top 2 Columns: DADOS DO CLIENTE & PRAZOS E RESPONSÁVEL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {/* Dados do Cliente */}
        <div className="border border-slate-300 rounded-sm overflow-hidden">
          <div className="bg-[#eef3f8] px-2.5 py-1 border-b border-slate-300 font-bold text-[10px] text-slate-800 uppercase tracking-wide">
            DADOS DO CLIENTE
          </div>
          <div className="p-2.5 space-y-1 text-[11px]">
            <div>
              <span className="font-bold text-slate-700">NOME: </span>
              <span className="font-semibold text-slate-900 uppercase">{os.clientName}</span>
            </div>
            <div className="flex justify-between">
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
              <span className="font-bold text-slate-700">CIDADE.: </span>
              <span className="text-slate-800">{cityStatePart}</span>
            </div>
          </div>
        </div>

        {/* Prazos e Responsável */}
        <div className="border border-slate-300 rounded-sm overflow-hidden">
          <div className="bg-[#eef3f8] px-2.5 py-1 border-b border-slate-300 font-bold text-[10px] text-slate-800 uppercase tracking-wide">
            PRAZOS E RESPONSÁVEL
          </div>
          <div className="p-2.5 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <div>
                <span className="font-bold text-slate-700">ENTRADA: </span>
                <span className="text-slate-900">{formatDateBR(os.openDate)}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">PREVISÃO: </span>
                <span className="text-slate-900">{formatDateBR(os.forecastDate)}</span>
              </div>
            </div>
            <div>
              <span className="font-bold text-slate-700">GARANTIA: </span>
              <span className="text-slate-900 font-medium">
                {os.warrantyPeriodDays} Dias {os.warrantyExpiresAt ? `(até ${formatDateBR(os.warrantyExpiresAt)})` : ''}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-700">TÉCNICO: </span>
              <span className="font-semibold text-slate-900 uppercase">
                {employee?.name || 'Hugo Gandy'}
              </span>
            </div>
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
              {os.equipmentType || 'Multi estruturas Concreto Azul claro'}
              {os.equipmentModel ? ` · ${os.equipmentModel}` : ''}
              {os.equipmentSerial ? ` (S/N: ${os.equipmentSerial})` : ''}
            </span>
          </div>

          <div>
            <div className="bg-slate-100 px-2 py-0.5 border border-slate-200 text-[9px] font-bold text-slate-700 uppercase">
              DEFEITO RELATADO:
            </div>
            <div className="p-1.5 text-slate-800 text-[11px] font-medium min-h-[22px]">
              {os.description || 'Aquecimento da Piscina / Manutenção e Instalação'}
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
                <span className="w-3.5 h-3.5 rounded-xs bg-rose-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                  ✗
                </span>
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CONDITIONAL RENDERING: PEÇAS / PRODUTOS & MÃO DE OBRA     */}
      {/* "quando for uma venda só imprima os produtos da vendas     */}
      {/*  caso se venda e serviços imprima os dois campos,          */}
      {/*  se for só serviços imprima só os campos do serviços"      */}
      {/* ======================================================== */}

      {/* CASE 1: BOTH PARTS AND SERVICES (Side-by-Side 2 Columns) */}
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
                    <td className="p-1.5 text-center text-slate-700 font-mono">{Number(p.quantity).toFixed(2)}</td>
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
                    <td className="p-1.5 text-center text-slate-700 font-mono">{Number(s.hours || 1).toFixed(2)}</td>
                    <td className="p-1.5 text-right text-slate-900 font-mono font-medium">{formatBRL(Number(s.price || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CASE 2: ONLY PARTS / PRODUCTS (Single Full Width Column) */}
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
                    <td className="p-1.5 text-center text-slate-700 font-mono">{Number(p.quantity).toFixed(2)}</td>
                    <td className="p-1.5 text-right text-slate-700 font-mono">{formatBRL(Number(p.price || 0))}</td>
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

      {/* CASE 3: ONLY SERVICES / MÃO DE OBRA (Single Full Width Column) */}
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
                    <td className="p-1.5 text-center text-slate-700 font-mono">{Number(s.hours || 1).toFixed(2)}</td>
                    <td className="p-1.5 text-right text-slate-900 font-mono font-bold">{formatBRL(Number(s.price || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Section: RESUMO FINANCEIRO & PAGAMENTO VIA PIX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
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
              {/* Highlighted VALOR TOTAL */}
              <tr className="border-b border-slate-300 bg-[#e8f5e9] font-bold text-slate-900">
                <td className="p-1.5 font-sans font-black">VALOR TOTAL</td>
                <td className="p-1.5 text-right font-black text-slate-900">{formatBRL(grandTotal)}</td>
              </tr>
              {/* TOTAL PAGO */}
              <tr className="border-b border-slate-200">
                <td className="p-1.5 font-sans text-slate-700 font-bold">TOTAL PAGO</td>
                <td className="p-1.5 text-right font-bold text-slate-900">{formatBRL(totalPaid)}</td>
              </tr>
              {/* Highlighted VALOR DEVIDO */}
              <tr className={`font-bold ${totalDue > 0 ? 'bg-[#ffebee] text-rose-800' : 'bg-emerald-50 text-emerald-800'}`}>
                <td className="p-1.5 font-sans font-black">VALOR DEVIDO</td>
                <td className="p-1.5 text-right font-black">{formatBRL(totalDue)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagamento via Pix */}
        <div className="border border-slate-300 rounded-sm overflow-hidden flex flex-col">
          <div className="bg-[#eef3f8] px-2.5 py-1 border-b border-slate-300 font-bold text-[10px] text-slate-800 uppercase tracking-wide">
            PAGAMENTO VIA PIX
          </div>
          <div className="p-3 flex-1 flex flex-col items-center justify-center text-center">
            {/* Pix QR Code Vector */}
            <div className="w-24 h-24 border-2 border-slate-800 p-1.5 bg-white rounded-md mb-2 shadow-2xs">
              <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                {/* Simulated crisp QR pattern */}
                <rect width="30" height="30" x="5" y="5" fill="currentColor" />
                <rect width="20" height="20" x="10" y="10" fill="white" />
                <rect width="10" height="10" x="15" y="15" fill="currentColor" />

                <rect width="30" height="30" x="65" y="5" fill="currentColor" />
                <rect width="20" height="20" x="70" y="10" fill="white" />
                <rect width="10" height="10" x="75" y="15" fill="currentColor" />

                <rect width="30" height="30" x="5" y="65" fill="currentColor" />
                <rect width="20" height="20" x="10" y="70" fill="white" />
                <rect width="10" height="10" x="15" y="75" fill="currentColor" />

                <rect width="8" height="8" x="46" y="12" fill="currentColor" />
                <rect width="8" height="8" x="46" y="28" fill="currentColor" />
                <rect width="8" height="8" x="46" y="46" fill="currentColor" />
                <rect width="8" height="8" x="12" y="46" fill="currentColor" />
                <rect width="8" height="8" x="28" y="46" fill="currentColor" />
                <rect width="8" height="8" x="65" y="46" fill="currentColor" />
                <rect width="8" height="8" x="80" y="46" fill="currentColor" />
                <rect width="8" height="8" x="46" y="65" fill="currentColor" />
                <rect width="8" height="8" x="65" y="65" fill="currentColor" />
                <rect width="8" height="8" x="80" y="80" fill="currentColor" />
              </svg>
            </div>
            <div className="text-[10px] font-bold text-slate-900">Chave PIX: mppiscina2004@gmail.com</div>
            <div className="text-[9px] text-slate-600 font-medium">Titular: MP PISCINA</div>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="pt-3 border-t border-slate-300 page-break-inside-avoid">
        <div className="grid grid-cols-2 gap-6 text-center">
          {/* Client Signature */}
          <div className="flex flex-col items-center">
            {os.signature ? (
              <div className="mb-0.5">
                <img src={os.signature.signatureDataUrl} alt="Assinatura" className="h-7 max-w-[180px]" />
                <div className="text-[7.5px] text-emerald-700 font-semibold">Assinado Digitalmente na Tela Touch</div>
              </div>
            ) : (
              <div className="h-6"></div>
            )}
            <div className="w-52 border-t border-slate-800 pt-1">
              <div className="font-bold text-[10.5px] text-slate-900 uppercase">{os.clientName}</div>
            </div>
          </div>

          {/* Company / Professional Signature */}
          <div className="flex flex-col items-center">
            <div className="h-6 flex items-center justify-center font-serif italic text-blue-900 text-xs font-bold">
              MP Piscina
            </div>
            <div className="w-52 border-t border-slate-800 pt-1">
              <div className="font-bold text-[10.5px] text-slate-900 uppercase">MP PISCINA</div>
              <div className="text-[8.5px] text-slate-500 font-medium">Assinatura do Profissional</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Line with OS Number */}
      <div className="mt-2.5 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-500 font-mono">
        <span>MP PISCINA · AQUECIMENTO, FILTROS & ASSISTÊNCIA TÉCNICA</span>
        <span className="font-bold text-slate-800">ORDEM DE SERVIÇO Nº {os.code}</span>
        <span>VIA DO CLIENTE E CONTROLE INTERNO</span>
      </div>
    </div>
  );
};
