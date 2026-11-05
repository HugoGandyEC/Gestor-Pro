import React from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Calendar, 
  Building, 
  DollarSign, 
  Percent, 
  ShieldCheck, 
  Layers,
  FileCheck
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../context/AppContext';

export const AccountingClosingView: React.FC = () => {
  const { 
    selectedMonthYear, 
    setSelectedMonthYear, 
    serviceOrders, 
    directSales, 
    generalExpenses, 
    monthlyFinancialSummary,
    employees,
    companySettings 
  } = useApp();

  const monthOrders = serviceOrders.filter(o => {
    const d = o.completionDate || o.openDate;
    return d.startsWith(selectedMonthYear) && (o.status === 'concluida_aguardando_retirada' || o.status === 'entregue_finalizada');
  });

  const monthSales = directSales.filter(s => s.date.startsWith(selectedMonthYear) && s.paymentStatus === 'pago');

  // Revenue breakdown for taxes
  const grossServicesRevenue = monthOrders.reduce((acc, o) => {
    const srv = o.services.reduce((a, b) => a + Number(b.price || 0), 0) + Number(o.visitFee || 0);
    return acc + srv - Number(o.calculatedDiscount || 0);
  }, 0);

  const grossPartsRevenue = monthOrders.reduce((acc, o) => {
    return acc + o.parts.reduce((a, b) => a + (Number(b.price || 0) * Number(b.quantity || 1)), 0);
  }, 0);

  const grossDirectSalesRevenue = monthSales.reduce((acc, s) => acc + s.total, 0);
  const totalGoodsRevenue = grossPartsRevenue + grossDirectSalesRevenue;
  const totalGrossBilling = grossServicesRevenue + totalGoodsRevenue;

  // XML / Product purchases in month
  const purchasesXml = generalExpenses.filter(e => e.category === 'compra_produtos_xml' && e.dueDate.startsWith(selectedMonthYear));
  const totalPurchasesCost = purchasesXml.reduce((a, b) => a + b.cost, 0);

  // Card machine fees deducted
  let totalCardFees = 0;
  monthOrders.forEach(o => {
    o.payments?.forEach(p => {
      if (p.rateAmount) totalCardFees += p.rateAmount;
    });
  });
  monthSales.forEach(s => {
    s.payments?.forEach(p => {
      if (p.rateAmount) totalCardFees += p.rateAmount;
    });
  });

  // Estimated Simples Nacional Tax (Annex III for Services ~6.0%, Annex I for Commerce ~4.0%)
  const estimatedTaxServices = grossServicesRevenue * 0.06;
  const estimatedTaxGoods = totalGoodsRevenue * 0.04;
  const totalEstimatedTaxes = estimatedTaxServices + estimatedTaxGoods;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          {companySettings.logoUrl && (
            <img 
              src={companySettings.logoUrl} 
              alt={companySettings.tradeName || 'Logo'} 
              className="max-h-12 max-w-[130px] object-contain rounded shrink-0 border border-slate-200 p-0.5 bg-white" 
            />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Relatório de Fechamento Mensal para o Contador
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Espelho Fiscal & Contábil
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {companySettings.tradeName || companySettings.companyName || 'GestãoPro'} · Consolidação das notas fiscais, faturamento tributável (Serviços vs Comércio) e deduções fiscais.
            </p>
          </div>
        </div>

        <div className="no-print flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-3 py-1.5 shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={selectedMonthYear}
              onChange={(e) => setSelectedMonthYear(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent border-0 focus:ring-0 cursor-pointer"
            >
              <option value="2026-10">Outubro / 2026</option>
              <option value="2026-09">Setembro / 2026</option>
              <option value="2026-08">Agosto / 2026</option>
            </select>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / Exportar PDF Contábil</span>
          </button>
        </div>
      </div>

      {/* Main Printable Accounting Document */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs space-y-6 text-xs text-slate-800">
        {/* Header Letterhead */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
          <div>
            <div className="text-lg font-black tracking-tight text-slate-900">
              GESTAOPRO SERVIÇOS & EQUIPAMENTOS LTDA
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              CNPJ: 45.123.890/0001-77 · Inscrição Municipal (ISS): 8.921.340-0 · Inscrição Estadual (ICMS): 110.234.567.890
            </div>
            <div className="text-[11px] text-slate-500">
              Enquadramento: Simples Nacional · Atividade: Manutenção Industrial & Comércio Varejista/Atacadista
            </div>
          </div>

          <div className="text-right">
            <div className="text-base font-bold font-mono text-blue-700">
              FECHAMENTO CONTÁBIL
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-0.5">
              Competência: {selectedMonthYear}
            </div>
            <div className="text-[10px] text-slate-400">
              Emissão: {new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>

        {/* 1. Resumo do Faturamento Bruto por Segregação Tributária */}
        <div className="space-y-2">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b pb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            1. Segregação do Faturamento Bruto (Base de Cálculo Tributária)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500">Prestação de Serviços (NFS-e / ISS)</span>
              <div className="text-lg font-bold font-mono text-slate-900 mt-1">{formatBRL(grossServicesRevenue)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Mão de obra e taxas de visita em OS</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500">Comércio / Venda de Peças (NF-e / ICMS)</span>
              <div className="text-lg font-bold font-mono text-slate-900 mt-1">{formatBRL(totalGoodsRevenue)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Peças aplicadas em OS + Vendas de Balcão</div>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
              <span className="text-[11px] text-blue-800 font-semibold">Faturamento Bruto Total do Mês</span>
              <div className="text-lg font-black font-mono text-blue-900 mt-1">{formatBRL(totalGrossBilling)}</div>
              <div className="text-[10px] text-blue-700 mt-0.5">{monthOrders.length} OS + {monthSales.length} Vendas Faturadas</div>
            </div>
          </div>
        </div>

        {/* 2. Provisão de Impostos do Simples Nacional */}
        <div className="space-y-2">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b pb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            2. Estimativa de Tributos a Recolher (DAS - Simples Nacional)
          </h2>

          <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="p-2">Anexo / Fator Tributário</th>
                <th className="p-2 text-right">Base de Cálculo</th>
                <th className="p-2 text-center">Alíquota Efetiva Est.</th>
                <th className="p-2 text-right">Valor do Tributo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="p-2 font-sans">Anexo III - Serviços de Manutenção e Assistência Técnica</td>
                <td className="p-2 text-right">{formatBRL(grossServicesRevenue)}</td>
                <td className="p-2 text-center">6,00%</td>
                <td className="p-2 text-right text-slate-900 font-bold">{formatBRL(estimatedTaxServices)}</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">Anexo I - Comércio de Reservatórios Térmicos e Peças</td>
                <td className="p-2 text-right">{formatBRL(totalGoodsRevenue)}</td>
                <td className="p-2 text-center">4,00%</td>
                <td className="p-2 text-right text-slate-900 font-bold">{formatBRL(estimatedTaxGoods)}</td>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <td className="p-2 font-sans">TOTAL DAS / IMPOSTOS ESTIMADOS DO MÊS</td>
                <td className="p-2 text-right">{formatBRL(totalGrossBilling)}</td>
                <td className="p-2 text-center">~5,1% Médio</td>
                <td className="p-2 text-right text-rose-700">{formatBRL(totalEstimatedTaxes)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. Deduções de Taxas de Cartão de Crédito e Débito */}
        <div className="space-y-2">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b pb-1">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            3. Taxas de Intermediação Financeira (Maquininhas de Cartão)
          </h2>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between font-mono">
            <div>
              <span className="font-sans font-medium text-slate-700">Total de Taxas Retidas pelas Credenciadoras (Visa/Master/Elo):</span>
              <div className="text-[11px] text-slate-400 font-sans mt-0.5">Dedução financeira não estornável para conciliação contábil</div>
            </div>
            <div className="text-base font-bold text-rose-700">{formatBRL(totalCardFees)}</div>
          </div>
        </div>

        {/* 4. Compras de Fornecedores / XMLs de Entrada */}
        <div className="space-y-2">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b pb-1">
            <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            4. Resumo de Compras de Mercadorias para Revenda (NF-e Importadas)
          </h2>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between font-mono">
            <div>
              <span className="font-sans font-medium text-slate-700">Total de Entradas Fiscais no Mês:</span>
              <div className="text-[11px] text-slate-400 font-sans mt-0.5">{purchasesXml.length} notas fiscais importadas via arquivo XML</div>
            </div>
            <div className="text-base font-bold text-slate-900">{formatBRL(totalPurchasesCost)}</div>
          </div>
        </div>

        {/* 5. Folha de Pagamento & Encargos */}
        <div className="space-y-2">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b pb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            5. Despesas com Pessoal & Provisões Trabalhistas
          </h2>

          <div className="grid grid-cols-3 gap-3 font-mono">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-sans">Salários Nominais:</span>
              <div className="font-bold text-slate-900">{formatBRL(employees.reduce((a, b) => a + b.baseSalary, 0))}</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-sans">Encargos Sociais:</span>
              <div className="font-bold text-slate-900">{formatBRL(employees.reduce((a, b) => a + b.benefitsCharges, 0))}</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-sans">Comissões Pagas:</span>
              <div className="font-bold text-blue-700">{formatBRL(monthlyFinancialSummary.totalPersonnelCost - employees.reduce((a, b) => a + b.baseSalary + b.benefitsCharges, 0))}</div>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-10 grid grid-cols-2 gap-10 border-t border-slate-200 text-center text-xs">
          <div>
            <div className="border-t border-slate-400 pt-2 font-bold text-slate-900">
              GestãoPro Serviços & Equipamentos Ltda
            </div>
            <div className="text-[10px] text-slate-400">Responsável pela Administração</div>
          </div>

          <div>
            <div className="border-t border-slate-400 pt-2 font-bold text-slate-900">
              Escritório Contábil Progresso
            </div>
            <div className="text-[10px] text-slate-400">Contador Responsável / CRC Ativo</div>
          </div>
        </div>
      </div>
    </div>
  );
};
