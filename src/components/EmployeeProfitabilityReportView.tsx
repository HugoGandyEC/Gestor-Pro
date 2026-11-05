import React, { useState } from 'react';
import { 
  TrendingUp, 
  Download, 
  Printer, 
  User, 
  Car, 
  Fuel, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight,
  Info,
  Layers,
  Calendar
} from 'lucide-react';
import { useApp, formatBRL } from '../context/AppContext';
import { EmployeeProfitabilityReport } from '../types';

export const EmployeeProfitabilityReportView: React.FC = () => {
  const { 
    selectedMonthYear, 
    setSelectedMonthYear, 
    getMonthlyProfitabilityAllEmployees,
    serviceOrders,
    vehicleExpenses,
    generalExpenses,
    vehicles,
    companySettings
  } = useApp();

  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<EmployeeProfitabilityReport | null>(null);

  const reports = getMonthlyProfitabilityAllEmployees(selectedMonthYear);

  // Totals for the table footer
  const totalRevenueAll = reports.reduce((acc, r) => acc + r.totalRevenue, 0);
  const totalPartsCostAll = reports.reduce((acc, r) => acc + r.partsCost, 0);
  const totalGrossContributionAll = reports.reduce((acc, r) => acc + r.grossContribution, 0);
  const totalPersonnelCostAll = reports.reduce((acc, r) => acc + r.totalPersonnelCost, 0);
  const totalFuelCostAll = reports.reduce((acc, r) => acc + r.fuelCost, 0);
  const totalVehicleDirectCostAll = reports.reduce((acc, r) => acc + r.vehicleDirectMaintenanceCost, 0);
  const totalVehicleProratedCostAll = reports.reduce((acc, r) => acc + r.vehicleProratedFixedCost, 0);
  const totalMealsCellphoneCostAll = reports.reduce((acc, r) => acc + r.mealsCost + r.cellphoneCost, 0);
  const totalDirectCostsAll = reports.reduce((acc, r) => acc + r.totalDirectCosts, 0);
  const totalNetProfitAll = reports.reduce((acc, r) => acc + r.netProfit, 0);
  const overallMarginPercent = totalRevenueAll > 0 ? (totalNetProfitAll / totalRevenueAll) * 100 : 0;

  // Best performer
  const topPerformer = reports.length > 0 ? reports[0] : null;

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Funcionario',
      'Cargo',
      'Veiculo',
      'Qtd_OS',
      'Receita_Total_R$',
      'Custo_Pecas_R$',
      'Margem_Bruta_R$',
      'Salario_Base_R$',
      'Encargos_R$',
      'Comissao_R$',
      'Combustivel_Gasolina_R$',
      'Manutencao_Veiculo_R$',
      'IPVA_Seguro_Mensal_R$',
      'Alimentacao_R$',
      'Celular_R$',
      'Custo_Total_Funcionario_R$',
      'Lucro_Liquido_R$',
      'Margem_Liquida_Pct',
      'ROI_Multiplicador',
      'Classificacao'
    ];

    const rows = reports.map(r => {
      const veh = vehicles.find(v => v.id === r.employee.assignedVehicleId);
      return [
        `"${r.employee.name}"`,
        `"${r.employee.role}"`,
        `"${veh ? `${veh.model} (${veh.plate})` : 'Nenhum'}"`,
        r.ordersCount,
        r.totalRevenue.toFixed(2),
        r.partsCost.toFixed(2),
        r.grossContribution.toFixed(2),
        r.baseSalary.toFixed(2),
        r.benefitsCharges.toFixed(2),
        r.commissionEarned.toFixed(2),
        r.fuelCost.toFixed(2),
        r.vehicleDirectMaintenanceCost.toFixed(2),
        r.vehicleProratedFixedCost.toFixed(2),
        r.mealsCost.toFixed(2),
        r.cellphoneCost.toFixed(2),
        r.totalDirectCosts.toFixed(2),
        r.netProfit.toFixed(2),
        r.netMarginPercent.toFixed(1) + '%',
        r.roiMultiplier.toFixed(2) + 'x',
        `"${r.performanceTier}"`
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_lucratividade_funcionarios_${selectedMonthYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
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
                Relatório Mensal de Lucratividade por Funcionário
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Auditoria de Custos Reais
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {companySettings.tradeName || companySettings.companyName || 'GestãoPro'} · Apuração exata da receita faturada deduzindo peças, salários, comissões, combustível, manutenção da frota e despesas operacionais.
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
              <option value="2026-11">Novembro / 2026</option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* Highlights KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Receita Total da Equipe</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {formatBRL(totalRevenueAll)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {reports.reduce((acc, r) => acc + r.ordersCount, 0)} OS concluídas / faturadas
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Custos Diretos Alocados</div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
            {formatBRL(totalDirectCostsAll)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Folha, frota, combustível e diárias
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Lucro Líquido Real da Equipe</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {formatBRL(totalNetProfitAll)}
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">
            Margem Líquida Média: {overallMarginPercent.toFixed(1)}%
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Maior Gerador de Lucro Líquido</div>
          <div className="text-base font-bold text-slate-900 mt-1 truncate">
            {topPerformer ? topPerformer.employee.name : '-'}
          </div>
          <div className="text-xs text-emerald-600 font-mono font-semibold mt-1">
            {topPerformer ? `+${formatBRL(topPerformer.netProfit)} (${topPerformer.netMarginPercent.toFixed(1)}% margem)` : '-'}
          </div>
        </div>
      </div>

      {/* Main Analytical Profitability Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Demonstrativo Analítico Individual ({selectedMonthYear})
            </h2>
            <p className="text-xs text-slate-500">
              Clique em qualquer colaborador para ver o raio-x com todas as OS, notas de combustível e despesas de frota.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>*Valores em Reais (BRL)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Funcionário / Cargo</th>
                <th className="py-3 px-3 text-center">OS</th>
                <th className="py-3 px-3 text-right">Receita Total</th>
                <th className="py-3 px-3 text-right">Custo Peças</th>
                <th className="py-3 px-3 text-right">Salário + Encargos</th>
                <th className="py-3 px-3 text-right">Comissões</th>
                <th className="py-3 px-3 text-right">Gasolina</th>
                <th className="py-3 px-3 text-right">Veículo (Mnt + IPVA/Seg)</th>
                <th className="py-3 px-3 text-right">Alimentação & Cel</th>
                <th className="py-3 px-3 text-right font-bold text-slate-800">Custo Total</th>
                <th className="py-3 px-4 text-right font-bold text-emerald-700 bg-emerald-50/50">Lucro Líquido</th>
                <th className="py-3 px-3 text-center">Margem</th>
                <th className="py-3 px-3 text-center">ROI</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {reports.map((report) => {
                const veh = vehicles.find(v => v.id === report.employee.assignedVehicleId);
                const vehicleTotalCost = report.vehicleDirectMaintenanceCost + report.vehicleProratedFixedCost;
                const otherStaffCosts = report.mealsCost + report.cellphoneCost;

                return (
                  <tr 
                    key={report.employee.id} 
                    onClick={() => setSelectedEmployeeForDetail(report)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                    title="Clique para ver extrato detalhado do colaborador"
                  >
                    <td className="py-3 px-4 font-sans font-medium text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                          {report.employee.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                            {report.employee.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-normal flex items-center gap-1.5">
                            <span>{report.employee.role}</span>
                            {veh && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-slate-600 flex items-center gap-1">
                                  <Car className="w-3 h-3 text-slate-400" />
                                  {veh.plate}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center text-slate-700">
                      {report.ordersCount}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {formatBRL(report.totalRevenue)}
                    </td>

                    <td className="py-3 px-3 text-right text-slate-500">
                      {formatBRL(report.partsCost)}
                    </td>

                    <td className="py-3 px-3 text-right text-slate-600">
                      {formatBRL(report.baseSalary + report.benefitsCharges)}
                    </td>

                    <td className="py-3 px-3 text-right text-blue-600 font-medium">
                      {formatBRL(report.commissionEarned)}
                    </td>

                    <td className="py-3 px-3 text-right text-amber-700 font-medium">
                      {formatBRL(report.fuelCost)}
                    </td>

                    <td className="py-3 px-3 text-right text-slate-700">
                      <span title={`Manutenção Direta: ${formatBRL(report.vehicleDirectMaintenanceCost)} | Amortização IPVA/Seguro: ${formatBRL(report.vehicleProratedFixedCost)}`}>
                        {formatBRL(vehicleTotalCost)}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right text-slate-600">
                      <span title={`Alimentação: ${formatBRL(report.mealsCost)} | Celular: ${formatBRL(report.cellphoneCost)}`}>
                        {formatBRL(otherStaffCosts)}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-rose-700">
                      {formatBRL(report.totalDirectCosts)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-emerald-700 bg-emerald-50/50">
                      {formatBRL(report.netProfit)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        report.netMarginPercent > 35 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : report.netMarginPercent > 15 
                          ? 'bg-blue-100 text-blue-800' 
                          : report.netMarginPercent > 0 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {report.netMarginPercent.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-slate-700">
                      {report.roiMultiplier.toFixed(2)}x
                    </td>

                    <td className="py-3 px-3 text-center font-sans">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        report.performanceTier === 'Excelente'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : report.performanceTier === 'Bom'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : report.performanceTier === 'Atenção'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {report.performanceTier}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Total Row */}
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-mono font-bold text-slate-900">
                <td className="py-3 px-4 font-sans font-bold">
                  TOTAL CONSOLIDADO DA EQUIPE
                </td>
                <td className="py-3 px-3 text-center">
                  {reports.reduce((acc, r) => acc + r.ordersCount, 0)}
                </td>
                <td className="py-3 px-3 text-right">
                  {formatBRL(totalRevenueAll)}
                </td>
                <td className="py-3 px-3 text-right text-slate-600">
                  {formatBRL(totalPartsCostAll)}
                </td>
                <td className="py-3 px-3 text-right">
                  {formatBRL(totalPersonnelCostAll - reports.reduce((acc, r) => acc + r.commissionEarned, 0))}
                </td>
                <td className="py-3 px-3 text-right text-blue-700">
                  {formatBRL(reports.reduce((acc, r) => acc + r.commissionEarned, 0))}
                </td>
                <td className="py-3 px-3 text-right text-amber-800">
                  {formatBRL(totalFuelCostAll)}
                </td>
                <td className="py-3 px-3 text-right">
                  {formatBRL(totalVehicleDirectCostAll + totalVehicleProratedCostAll)}
                </td>
                <td className="py-3 px-3 text-right">
                  {formatBRL(totalMealsCellphoneCostAll)}
                </td>
                <td className="py-3 px-3 text-right text-rose-700">
                  {formatBRL(totalDirectCostsAll)}
                </td>
                <td className="py-3 px-4 text-right text-emerald-700 bg-emerald-100/60 font-bold">
                  {formatBRL(totalNetProfitAll)}
                </td>
                <td className="py-3 px-3 text-center">
                  {overallMarginPercent.toFixed(1)}%
                </td>
                <td className="py-3 px-3 text-center">
                  {(totalDirectCostsAll > 0 ? totalRevenueAll / totalDirectCostsAll : 0).toFixed(2)}x
                </td>
                <td className="py-3 px-3 text-center font-sans font-normal text-slate-500">
                  {reports.length} Colaboradores
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Explanatory Box on the Formulas */}
      <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-600 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Fórmula Gerencial da Lucratividade por Técnico:</span>
        </div>
        <p className="leading-relaxed">
          <strong className="text-slate-800">Lucro Líquido</strong> = Receita Total (Mão de Obra de OS + Vendas) − [ Custo de Peças + Salário Base + Encargos + Comissões + Combustível Gasto + Manutenção Veicular (Óleo, Pastilhas, Pneus) + Cota Mensal do IPVA & Seguro (1/12) + Diárias de Alimentação + Telefone Celular ].
        </p>
        <p className="text-slate-500">
          *A cota mensal de IPVA e Seguro distribui o custo anual dos veículos em 12 parcelas mensais proporcionais, garantindo que o técnico que utiliza a Saveiro ou Strada suporte a depreciação e manutenção preventiva real gerada pelo seu uso.
        </p>
      </div>

      {/* Granular Modal for the Selected Employee */}
      {selectedEmployeeForDetail && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-base">
                  {selectedEmployeeForDetail.employee.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Raio-X de Rentabilidade: {selectedEmployeeForDetail.employee.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedEmployeeForDetail.employee.role} · Competência {selectedMonthYear}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployeeForDetail(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Financial Snapshot */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">Faturamento Gerado</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {formatBRL(selectedEmployeeForDetail.totalRevenue)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Serviços: {formatBRL(selectedEmployeeForDetail.servicesRevenue)} | Peças: {formatBRL(selectedEmployeeForDetail.partsRevenue)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200">
                  <span className="text-xs text-rose-700 font-medium">Custos Totais Atribuídos</span>
                  <div className="text-xl font-bold font-mono text-rose-700 mt-1">
                    {formatBRL(selectedEmployeeForDetail.totalDirectCosts)}
                  </div>
                  <div className="text-[11px] text-rose-600 mt-0.5">
                    Folha: {formatBRL(selectedEmployeeForDetail.totalPersonnelCost)} | Frota: {formatBRL(selectedEmployeeForDetail.fuelCost + selectedEmployeeForDetail.vehicleDirectMaintenanceCost + selectedEmployeeForDetail.vehicleProratedFixedCost)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs text-emerald-800 font-medium">Lucro Líquido Real</span>
                  <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                    {formatBRL(selectedEmployeeForDetail.netProfit)}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                    Margem Líquida: {selectedEmployeeForDetail.netMarginPercent.toFixed(1)}% · Retorno: {selectedEmployeeForDetail.roiMultiplier.toFixed(2)}x
                  </div>
                </div>
              </div>

              {/* Cost Composition Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Detalhamento dos Custos do Colaborador ({selectedMonthYear})
                </h4>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Salário Fixo Base:</span>
                    <span className="font-mono font-medium text-slate-800">{formatBRL(selectedEmployeeForDetail.baseSalary)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Encargos Trabalhistas (INSS, FGTS, Benefícios):</span>
                    <span className="font-mono font-medium text-slate-800">{formatBRL(selectedEmployeeForDetail.benefitsCharges)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Comissões por Metas / Serviços ({selectedEmployeeForDetail.employee.commissionRate}%):</span>
                    <span className="font-mono font-bold text-blue-600">{formatBRL(selectedEmployeeForDetail.commissionEarned)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Combustível / Gasolina no Mês (Abastecimentos):</span>
                    <span className="font-mono font-medium text-amber-700">{formatBRL(selectedEmployeeForDetail.fuelCost)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Manutenção Mecânica do Veículo (Troca de óleo, pastilhas, etc.):</span>
                    <span className="font-mono font-medium text-slate-800">{formatBRL(selectedEmployeeForDetail.vehicleDirectMaintenanceCost)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Cota Mensal Amortizada do Veículo (IPVA e Seguro Anual ÷ 12):</span>
                    <span className="font-mono font-medium text-slate-800">{formatBRL(selectedEmployeeForDetail.vehicleProratedFixedCost)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Despesas com Alimentação / Almoço em Campo:</span>
                    <span className="font-mono font-medium text-slate-800">{formatBRL(selectedEmployeeForDetail.mealsCost)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Conta Telefonia Celular Corporativo:</span>
                    <span className="font-mono font-medium text-slate-800">{formatBRL(selectedEmployeeForDetail.cellphoneCost)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-slate-900 text-sm">
                    <span>CUSTO OPERACIONAL TOTAL DO FUNCIONÁRIO:</span>
                    <span className="font-mono text-rose-700">{formatBRL(selectedEmployeeForDetail.totalDirectCosts)}</span>
                  </div>
                </div>
              </div>

              {/* Orders Executed by this Employee */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Ordens de Serviço Executadas ({selectedEmployeeForDetail.ordersCount} OS)
                </h4>
                {serviceOrders.filter(o => o.employeeId === selectedEmployeeForDetail.employee.id && (o.completionDate || o.openDate).startsWith(selectedMonthYear)).length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                    Nenhuma Ordem de Serviço concluída neste mês para este colaborador.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="py-2.5 px-3">Código</th>
                          <th className="py-2.5 px-3">Cliente</th>
                          <th className="py-2.5 px-3">KM</th>
                          <th className="py-2.5 px-3 text-right">Serviços</th>
                          <th className="py-2.5 px-3 text-right">Peças</th>
                          <th className="py-2.5 px-3 text-right">Total OS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {serviceOrders
                          .filter(o => o.employeeId === selectedEmployeeForDetail.employee.id && (o.completionDate || o.openDate).startsWith(selectedMonthYear))
                          .map(os => {
                            const srv = os.services.reduce((a, b) => a + b.price, 0);
                            const prt = os.parts.reduce((a, b) => a + (b.price * b.quantity), 0);
                            const tot = srv + prt + Number(os.visitFee || 0) - Number(os.calculatedDiscount || 0);
                            return (
                              <tr key={os.id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-bold text-blue-600">{os.code}</td>
                                <td className="py-2 px-3 font-sans text-slate-800">{os.clientName}</td>
                                <td className="py-2 px-3 text-slate-500">{os.kmDriven} km</td>
                                <td className="py-2 px-3 text-right text-slate-700">{formatBRL(srv)}</td>
                                <td className="py-2 px-3 text-right text-slate-500">{formatBRL(prt)}</td>
                                <td className="py-2 px-3 text-right font-bold text-emerald-700">{formatBRL(tot)}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedEmployeeForDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
