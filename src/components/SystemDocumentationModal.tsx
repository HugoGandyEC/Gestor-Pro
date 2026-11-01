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
  FileCode
} from 'lucide-react';

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
              <h2 className="text-base font-bold text-slate-900">
                Projeto de Arquitetura de Software & Especificação Funcional
              </h2>
              <p className="text-xs text-slate-500">
                Padrão Analista de Sistemas Sênior / Arquiteto de Software · Stack Web + PWA Mobile VPS
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
              1. Visão Geral do Sistema & Stack Recomendada
            </h3>
            <p>
              <strong>Objetivo:</strong> Centralizar a gestão de assistências técnicas, controle de ordens de serviço (OS), vendas de peças/equipamentos (como tanques e reservatórios térmicos, bombas e aquecedores), controle de estoque, checklist inteligente com fotos e fluxo financeiro completo.
            </p>
            <p>
              <strong>Stack Recomendada:</strong> Node.js / TypeScript ou PHP / Laravel com banco de dados relacional MySQL otimizado para transações ACID. Interface responsiva Web + PWA (Mobile-First para uso dos técnicos em campo e clientes no smartphone), hospedada em VPS Linux própria com suporte a tokens JWT e certificado SSL.
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
                  Ordem de Serviço (OS) & Orçamentos
                </div>
                <p className="text-slate-600 text-[11px]">
                  Ciclo de vida completo: <em>Orçamento Aberto, Aguardando Aprovação, Aprovada/Em Andamento, Aguardando Peças, Concluída e Entregue/Finalizada</em>. Checklist de entrada e saída com fotos, alocação de peças do estoque, taxa de visita técnica, assinatura digital na tela touch e termo de garantia (90 dias a 3 anos).
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Vendas & Orçamentos Multiformas
                </div>
                <p className="text-slate-600 text-[11px]">
                  Conversão instantânea de orçamento em venda ou OS aprovada em 1 clique. Controle de preços diferenciados (Varejo vs Atacado) e divisão do pagamento em múltiplas formas (Pix + Cartão + Dinheiro) com cálculo automático das taxas por bandeira.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  Estoque & Entrada via XML de NF-e
                </div>
                <p className="text-slate-600 text-[11px]">
                  Leitor de XML de Nota Fiscal Eletrônica de compra. Cadastra ou atualiza produtos, recalcula custo médio, dá entrada no estoque (Kardex) e gera automaticamente a Conta a Pagar vinculada ao fornecedor.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  Portal Exclusivo do Cliente
                </div>
                <p className="text-slate-600 text-[11px]">
                  Área do cliente para consulta de Ordens de Serviço, termos de garantia com número de série do reservatório térmico/bomba, débitos em aberto, assinatura digital de documentos e abertura de chamados técnicos ou em garantia.
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
                    <td className="p-2.5 font-medium">Gestão de Produtos & Estoque</td>
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
              4. Modelo de Entidades e Relacionamentos (MySQL)
            </h4>
            <div>· <strong>Cliente</strong> 1:N Ordem de Serviço / 1:N Venda / 1:N Portal do Cliente (Chamados)</div>
            <div>· <strong>Fornecedor</strong> 1:N Contas a Pagar (Compras de Produtos/XML)</div>
            <div>· <strong>Produto/Peça</strong> 1:N Movimentações de Estoque (Kardex) / N:N Ordem de Serviço</div>
            <div>· <strong>Ordem de Serviço</strong> 1:1 Checklist / 1:1 Assinatura Digital / 1:N Imagens / 1:N Formas de Pagamento</div>
            <div>· <strong>Contas a Receber / Contas a Pagar</strong> vinculadas a Taxas de Cartão por Bandeira e DRE</div>
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
