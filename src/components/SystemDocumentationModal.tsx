import React from 'react';
import { 
  FileText, 
  CheckCircle2, 
  TrendingUp, 
  Truck, 
  Building2, 
  Calculator, 
  DollarSign, 
  Users,
  ShieldCheck,
  ChevronRight,
  Database,
  Smartphone,
  Server,
  FileCode,
  History
} from 'lucide-react';
import { SYSTEM_VERSION, SYSTEM_BUILD, SYSTEM_RELEASE_DATE } from '../constants/version';
import { SYSTEM_CHANGELOG } from '../constants/changelog';

interface SystemDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemDocumentationModal: React.FC<SystemDocumentationModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900">
                  Projeto de Arquitetura de Software & Especificação Funcional
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#53383e] text-white">
                  {SYSTEM_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Build {SYSTEM_BUILD} ({SYSTEM_RELEASE_DATE}) · Stack React 19 + TypeScript 7 + Firestore Sync + Exportação MySQL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* 1. Visão Geral */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              1. Visão Geral do FIRE GESTÃO & Arquitetura Modular
            </h3>
            <p>
              <strong>Objetivo:</strong> Centralizar no <strong>FIRE GESTÃO</strong> a operação de assistências técnicas, ordens de serviço (OS) com registro fotográfico de início e entrega, vendas, PDV multi-bandeiras, estoque com importação seletiva, folha integrada e DRE reconciliado a partir de uma base 100% limpa (<em>Zero Absoluto</em>).
            </p>
            <p>
              <strong>Arquitetura Modular & Identidade:</strong> Todos os 22 módulos ficam isolados em subpastas de <code>src/modulos/</code> controlados pelo arquivo central <code>ativarModulos.ts</code> (chaves <code>true</code>/<code>false</code>) e pela aba <em>Configurações → Módulos do Sistema</em>. Interface responsiva Web + PWA com cabeçalho limpo (sem seletor de data/mês), favicon mini chama amarela e laranja, login solar e 2 temas oficiais (<strong>Fire Gestão · Chama Alegre</strong> e <strong>Azul Cobalto</strong>), com sincronização Firestore e exportação relacional MySQL.
            </p>
          </div>

          {/* 2. Módulos Principais */}
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-blue-600" />
              2. Módulos Principais e Ciclo Operacional
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  Ordem de Serviço (OS): Cadastro Rápido de Cliente & Fotos (Início e Entrega)
                </div>
                <p className="text-slate-600 text-[11px]">
                  Atalho <strong>Cadastrar Cliente</strong> no topo e no formulário da OS (com CEP/CNPJ automáticos e seleção imediata), status padronizados em todas as telas, busca direta no Estoque, <strong>Registro Fotográfico</strong> dedicado para <em>Início (Antes dos Serviços)</em> e <em>Local de Entrega</em> (câmera ao vivo com troca de lente + galeria + botão rápido na listagem + impressão A4), checklists e assinatura digital.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Vendas, PDV Multi-Bandeiras & Recibos (A4 / 80mm / PDF)
                </div>
                <p className="text-slate-600 text-[11px]">
                  Busca inteligente de produtos/serviços, formulário limpo com remoção total de itens, cancelamento antes ou depois de salvar, envio direto para o PDV e divisão em múltiplas formas com bandeiras e parcelas distintas. Emissão automática de Recibo A4/80mm (parcial ou quitado), cancelamento com estorno de estoque e exclusão definitiva por senha mestra.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  Módulo Estoque, Kardex & Importação Seletiva (Sem Financeiro)
                </div>
                <p className="text-slate-600 text-[11px]">
                  Leitor de XML NF-e com trava anti-duplicidade SHA-256, painel de <strong>Importação Seletiva</strong> (<em>Somente Cadastrar Produtos sem Financeiro</em>, Financeiro desmarcado por padrão e seleção item a item), Importação Universal linha a linha isolada do Financeiro, fotos (até 3), EAN-13, duplicador e filtros em combobox.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  Zero Absoluto, DRE Reconciliado, Custos Integrados & BI
                </div>
                <p className="text-slate-600 text-[11px]">
                  Base 100% limpa sem dados fictícios. DRE reconciliado centavo por centavo (Serviços + Peças − Descontos rateados + Vendas, excluindo cancelados e orçamentos não aprovados), sincronização de folha por combobox, comissões e recorrentes sem duplicidade e Gráficos BI dinâmicos.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 md:col-span-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  Módulos Ativáveis, Cadastros, Portal do Cliente & Configurações Unificadas
                </div>
                <p className="text-slate-600 text-[11px]">
                  Ativação/desativação de qualquer módulo em <em>Configurações → Módulos do Sistema</em> ou via <code>ativarModulos.ts</code>; Central de Cadastros em Listagem/Grade com tooltips; Portal do Cliente com garantias por S/N e chamados; Configurações com 2 temas oficiais (<em>Fire Gestão · Chama Alegre</em> e <em>Azul Cobalto</em>), Senha Mestra PDV, Auditoria, Restauração Seletiva de Backup JSON (11 categorias) e Google Drive.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Matriz de Permissões por Perfil */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              3. Matriz de Permissões e Perfis de Acesso (RBAC)
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-semibold text-slate-700">
                  <tr>
                    <th className="p-2.5">Funcionalidade / Módulo</th>
                    <th className="p-2.5 text-center">Administrador</th>
                    <th className="p-2.5 text-center">Colaborador</th>
                    <th className="p-2.5 text-center">Técnico</th>
                    <th className="p-2.5 text-center">Contador</th>
                    <th className="p-2.5 text-center">Cliente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  <tr>
                    <td className="p-2.5 font-medium">Gestão de OS & Orçamentos</td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">Total</td>
                    <td className="p-2.5 text-center text-slate-700">Criar / Editar</td>
                    <td className="p-2.5 text-center text-blue-700">Status / Fotos / Check</td>
                    <td className="p-2.5 text-center text-slate-400">Visualizar</td>
                    <td className="p-2.5 text-center text-purple-700">Ver próprias</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Assinatura Digital & Fotos</td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">Sim</td>
                    <td className="p-2.5 text-center text-emerald-700">Sim</td>
                    <td className="p-2.5 text-center text-emerald-700">Sim (em campo)</td>
                    <td className="p-2.5 text-center text-slate-400">-</td>
                    <td className="p-2.5 text-center text-purple-700">Sim (nas suas OS)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Módulo Financeiro (Pagar/Receber)</td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">Total</td>
                    <td className="p-2.5 text-center text-slate-700">Parcial</td>
                    <td className="p-2.5 text-center text-slate-400">-</td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">Total</td>
                    <td className="p-2.5 text-center text-purple-700">Ver débitos</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">PDV: Cancelar vs Excluir Venda</td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">Cancelar &amp; Excluir (Senha)</td>
                    <td className="p-2.5 text-center text-slate-700">Cancelar / Excluir c/ Permissão+Senha</td>
                    <td className="p-2.5 text-center text-slate-400">-</td>
                    <td className="p-2.5 text-center text-slate-400">Auditar</td>
                    <td className="p-2.5 text-center text-slate-400">-</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Módulo Estoque &amp; Kardex</td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">Total</td>
                    <td className="p-2.5 text-center text-slate-700">Inserir / Propor</td>
                    <td className="p-2.5 text-center text-blue-700">Ver Peças</td>
                    <td className="p-2.5 text-center text-slate-400">-</td>
                    <td className="p-2.5 text-center text-slate-400">-</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Fechamento Contábil (PDFs)</td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">Total</td>
                    <td className="p-2.5 text-center text-slate-700">Parcial</td>
                    <td className="p-2.5 text-center text-slate-400">-</td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">Acesso Total</td>
                    <td className="p-2.5 text-center text-slate-400">-</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Abertura de Chamados / Garantia</td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">Total</td>
                    <td className="p-2.5 text-center text-slate-400">-</td>
                    <td className="p-2.5 text-center text-slate-400">-</td>
                    <td className="p-2.5 text-center text-slate-400">-</td>
                    <td className="p-2.5 text-center font-bold text-purple-700">Permitido</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Modelo de Dados Simplificado */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 font-mono text-[11px]">
            <h4 className="font-bold font-sans text-xs text-slate-900 mb-1">
              4. Modelo de Entidades, Importação Seletiva e Modularidade (MySQL / Firestore)
            </h4>
            <div>· <strong>Cliente</strong> 1:N Ordem de Serviço (com Cadastro Rápido na OS) / 1:N Venda / 1:N Portal do Cliente</div>
            <div>· <strong>Fornecedor</strong> 1:N Contas a Pagar (NF-e XML com trava SHA-256 e lançamento Financeiro opcional)</div>
            <div>· <strong>Estoque (Produto/Peça)</strong> 1:N Movimentações Kardex / Importação Seletiva (Somente Produtos sem Financeiro)</div>
            <div>· <strong>Ordem de Serviço</strong> 1:1 Checklist / 1:1 Assinatura Digital / 1:N Fotos (Início · Antes &amp; Local de Entrega) / 1:N Splits</div>
            <div>· <strong>Venda &amp; Caixa PDV (Sessão)</strong> 1:N Splits (Operadora, Bandeira, Parcelas) / 1:N Recibos (A4/80mm) / Cancelamento vs Exclusão Auditada</div>
            <div>· <strong>Equipe, Custos &amp; Módulos</strong> Folha (Salário, Hora, Comissão) + DRE Reconciliado + Mapa de Módulos Ativos (<code>ativarModulos.ts</code>)</div>
          </div>

          {/* 5. Histórico Resumido de Versões */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
            <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-[#53383e]" />
              5. Linha do Tempo de Versões ({SYSTEM_CHANGELOG[SYSTEM_CHANGELOG.length - 1]?.version} → {SYSTEM_VERSION})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {SYSTEM_CHANGELOG.map((entry) => (
                <div key={entry.version} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-[#53383e] text-white">
                        {entry.version}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">{entry.title}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">{entry.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">{entry.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
          >
            Fechar Especificação
          </button>
        </div>
      </div>
    </div>
  );
};
