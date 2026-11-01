import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Layers,
  FileCheck
} from 'lucide-react';
import { useApp, formatBRL, formatDateBR } from '../context/AppContext';

export const FinancialView: React.FC = () => {
  const { 
    serviceOrders, 
    directSales, 
    generalExpenses, 
    vehicleExpenses, 
    vehicles, 
    employees, 
    selectedMonthYear, 
    monthlyFinancialSummary 
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'dre' | 'receber' | 'pagar'>('dre');

  // Month collections (Accounts Receivable)
  const monthOrders = serviceOrders.filter(o => {
    const d = o.completionDate || o.openDate;
    return d.startsWith(selectedMonthYear);
  });

  const monthSales = directSales.filter(s => s.date.startsWith(selectedMonthYear));

  // Accounts Payable in month
  const monthGeneralExpenses = generalExpenses.filter(e => e.dueDate.startsWith(selectedMonthYear));
  const monthVehicleExpenses = vehicleExpenses.filter(e => e.date.startsWith(selectedMonthYear));

  // DRE breakdown
  const revenueServices = monthOrders
    .filter(o => o.status === 'concluida_aguardando_retirada' || o.status === 'entregue_finalizada')
    .reduce((acc, o) => acc + o.services.reduce((a, b) => a + Number(b.price || 0), 0) + Number(o.visitFee || 0) - Number(o.calculatedDiscount || 0), 0);

  const revenuePartsOS = monthOrders
    .filter(o => o.status === 'concluida_aguardando_retirada' || o.status === 'entregue_finalizada')
    .reduce((acc, o) => acc + o.parts.reduce((a, b) => a + (Number(b.price || 0) * Number(b.quantity || 1)), 0), 0);

  const revenueDirectSales = monthSales.reduce((acc, s) => acc + s.total, 0);

  const totalGrossRevenue = revenueServices + revenuePartsOS + revenueDirectSales;

  // Direct cost of parts
  const costPartsOS = monthOrders
    .filter(o => o.status === 'concluida_aguardando_retirada' || o.status === 'entregue_finalizada')
    .reduce((acc, o) => acc + o.parts.reduce((a, b) => a + (Number(b.cost || 0) * Number(b.quantity || 1)), 0), 0);

  const costDirectSales = monthSales.reduce((acc, s) => acc + s.items.reduce((a, b) => a + (b.cost * b.quantity), 0), 0);

  const totalCostGoods = costPartsOS + costDirectSales;
  const grossContributionMargin = totalGrossRevenue - totalCostGoods;

  // Personnel expenses
  const salariesTotal = employees.reduce((a, b) => a + b.baseSalary, 0);
  const benefitsTotal = employees.reduce((a, b) => a + b.benefitsCharges, 0);
  const commissionsTotal = monthlyFinancialSummary.totalPersonnelCost - (salariesTotal + benefitsTotal);

  // Fleet expenses
  const fuelTotal = monthVehicleExpenses.filter(e => e.category === 'combustivel').reduce((a, b) => a + b.cost, 0);
  const vehicleMntTotal = monthVehicleExpenses.filter(e => e.category !== 'combustivel').reduce((a, b) => a + b.cost, 0);
  const vehicleFixedProrated = vehicles.reduce((a, v) => a + ((v.annualIpvaValue + v.annualInsuranceValue) / 12), 0);

  // Operational fixed
  const rentTotal = monthGeneralExpenses.filter(e => e.category === 'aluguel').reduce((a, b) => a + b.cost, 0);
  const internetTotal = monthGeneralExpenses.filter(e => e.category === 'internet').reduce((a, b) => a + b.cost, 0);
  const cellphonesTotal = monthGeneralExpenses.filter(e => e.category === 'celular').reduce((a, b) => a + b.cost, 0);
  const mealsTotal = monthGeneralExpenses.filter(e => e.category === 'alimentacao').reduce((a, b) => a + b.cost, 0);
  const utilitiesTotal = monthGeneralExpenses.filter(e => e.category === 'energia_agua').reduce((a, b) => a + b.cost, 0);
  const softwareAccountantTotal = monthGeneralExpenses.filter(e => e.category === 'software_contabilidade').reduce((a, b) => a + b.cost, 0);
  const otherExpensesTotal = monthGeneralExpenses.filter(e => e.category === 'outros' || e.category === 'ferramental').reduce((a, b) => a + b.cost, 0);

  const netOperatingProfit = grossContributionMargin - (
    salariesTotal + benefitsTotal + commissionsTotal +
    fuelTotal + vehicleMntTotal + vehicleFixedProrated +
    rentTotal + internetTotal + cellphonesTotal + mealsTotal + utilitiesTotal + softwareAccountantTotal + otherExpensesTotal
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Módulo Financeiro & DRE Gerencial
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Competência {selectedMonthYear}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Demonstrativo de Resultado do Exercício (DRE), contas a pagar com fornecedores e faturamento de clientes.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab('dre')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'dre' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            DRE Gerencial
          </button>
          <button
            onClick={() => setActiveSubTab('receber')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'receber' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Contas a Receber
          </button>
          <button
            onClick={() => setActiveSubTab('pagar')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'pagar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Contas a Pagar
          </button>
        </div>
      </div>

      {activeSubTab === 'dre' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Demonstrativo do Resultado do Exercício (DRE) - {selectedMonthYear}
              </h2>
              <p className="text-xs text-slate-500">
                Estrutura analítica padrão contábil/gerencial com receita, custos variáveis e despesas fixas.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Resultado Líquido Operacional</span>
              <div className="text-lg font-black font-mono text-emerald-600">
                {formatBRL(netOperatingProfit)}
              </div>
            </div>
          </div>

          <div className="p-6 font-mono text-xs space-y-4">
            {/* 1. Receita Bruta */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-slate-900 text-sm border-b pb-1">
                <span>(+) RECEITA BRUTA TOTAL</span>
                <span className="text-blue-700">{formatBRL(totalGrossRevenue)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Serviços Prestados em Ordens de Serviço (Mão de Obra):</span>
                <span>{formatBRL(revenueServices)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Peças & Insumos Aplicados em OS:</span>
                <span>{formatBRL(revenuePartsOS)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Vendas Diretas & Balcão de Peças:</span>
                <span>{formatBRL(revenueDirectSales)}</span>
              </div>
            </div>

            {/* 2. Custos Variáveis */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-rose-800 text-sm border-b pb-1">
                <span>(-) CUSTOS VARIÁVEIS DE PEÇAS & MERCADORIAS VENDIDAS</span>
                <span>{formatBRL(totalCostGoods)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Custo de Aquisição de Peças para OS:</span>
                <span>{formatBRL(costPartsOS)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Custo de Mercadorias em Vendas Diretas:</span>
                <span>{formatBRL(costDirectSales)}</span>
              </div>
            </div>

            {/* 3. Margem de Contribuição */}
            <div className="flex justify-between font-bold bg-slate-50 p-2.5 rounded-lg text-slate-900 text-sm">
              <span>(=) MARGEM DE CONTRIBUIÇÃO BRUTA</span>
              <span className="text-emerald-700">{formatBRL(grossContributionMargin)}</span>
            </div>

            {/* 4. Custos com Pessoal */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-rose-800 text-sm border-b pb-1">
                <span>(-) CUSTOS COM PESSOAL & FOLHA DE PAGAMENTO</span>
                <span>{formatBRL(salariesTotal + benefitsTotal + commissionsTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Salários Base da Equipe:</span>
                <span>{formatBRL(salariesTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Encargos Sociais & Benefícios (INSS, FGTS, etc.):</span>
                <span>{formatBRL(benefitsTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Comissões sobre Serviços e Vendas:</span>
                <span>{formatBRL(commissionsTotal)}</span>
              </div>
            </div>

            {/* 5. Custos com Frota e Veículos */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-rose-800 text-sm border-b pb-1">
                <span>(-) CUSTOS COM FROTA & MOBILIDADE</span>
                <span>{formatBRL(fuelTotal + vehicleMntTotal + vehicleFixedProrated)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Combustível / Gasolina no Mês:</span>
                <span>{formatBRL(fuelTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Manutenção Mecânica (Óleo, Pastilhas, Pneus):</span>
                <span>{formatBRL(vehicleMntTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Amortização Proporcional de IPVA & Seguros Anuais (1/12):</span>
                <span>{formatBRL(vehicleFixedProrated)}</span>
              </div>
            </div>

            {/* 6. Custos Operacionais Fixos */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-rose-800 text-sm border-b pb-1">
                <span>(-) CUSTOS OPERACIONAIS & ADMINISTRATIVOS</span>
                <span>{formatBRL(rentTotal + internetTotal + cellphonesTotal + mealsTotal + utilitiesTotal + softwareAccountantTotal + otherExpensesTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Aluguel do Ponto Comercial / Galpão:</span>
                <span>{formatBRL(rentTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Internet & Telefonia Fibra:</span>
                <span>{formatBRL(internetTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Contas de Celular Corporativo:</span>
                <span>{formatBRL(cellphonesTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Despesas com Alimentação & Almoço em Campo:</span>
                <span>{formatBRL(mealsTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Energia Elétrica e Água:</span>
                <span>{formatBRL(utilitiesTotal)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>· Contabilidade & Softwares:</span>
                <span>{formatBRL(softwareAccountantTotal)}</span>
              </div>
            </div>

            {/* 7. Lucro Líquido Final */}
            <div className="flex justify-between font-bold bg-emerald-50 border-2 border-emerald-300 p-3.5 rounded-xl text-slate-900 text-base">
              <span>(=) LUCRO LÍQUIDO DO EXERCÍCIO</span>
              <span className="text-emerald-700 font-black">{formatBRL(netOperatingProfit)}</span>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'receber' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Contas a Receber (Ordens de Serviço e Vendas Faturadas)
            </h2>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Código / Tipo</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-3">Data</th>
                <th className="py-3 px-3">Forma de Pagto</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {monthOrders.map(os => {
                const total = os.services.reduce((a, b) => a + b.price, 0) + 
                              os.parts.reduce((a, b) => a + (b.price * b.quantity), 0) +
                              Number(os.visitFee || 0) - Number(os.calculatedDiscount || 0);
                return (
                  <tr key={os.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{os.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{os.clientName}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono">{formatDateBR(os.openDate)}</td>
                    <td className="py-3 px-3 uppercase text-slate-600">{os.paymentMethod.replace('_', ' ')}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        os.paymentStatus === 'pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {os.paymentStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{formatBRL(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'pagar' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Contas a Pagar (Custos Operacionais, Veículos e Fornecedores)
            </h2>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-4">Descrição da Despesa</th>
                <th className="py-3 px-3">Fornecedor</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {monthGeneralExpenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono text-slate-600">{formatDateBR(exp.dueDate)}</td>
                  <td className="py-3 px-3 capitalize font-medium text-slate-700">{exp.category.replace('_', ' ')}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{exp.description}</td>
                  <td className="py-3 px-3 text-slate-500">{exp.supplier}</td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      exp.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {exp.isPaid ? 'PAGO' : 'A PAGAR'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">{formatBRL(exp.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
