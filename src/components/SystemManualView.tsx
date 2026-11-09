import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Printer, 
  ClipboardList, 
  ShoppingBag, 
  DollarSign, 
  Calculator, 
  Package, 
  Users, 
  CreditCard, 
  UploadCloud, 
  HardDrive, 
  CheckCircle2, 
  ChevronRight, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface SystemManualViewProps {
  onNavigate?: (tab: ActiveTab) => void;
}

interface ManualSection {
  id: string;
  title: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  targetTab?: ActiveTab;
  summary: string;
  steps: string[];
  tips: string[];
  rules: string[];
}

export const SystemManualView: React.FC<SystemManualViewProps> = ({ onNavigate }) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>('fluxo_geral');
  const [searchTerm, setSearchTerm] = useState('');

  const sections: ManualSection[] = [
    {
      id: 'fluxo_geral',
      title: '1. Visão Geral & Vínculos Integrados do Sistema',
      badge: 'Arquitetura',
      icon: TrendingUp,
      targetTab: 'dashboard',
      summary: 'Entenda como o sistema interliga Vendas, Ordens de Serviço, Estoque, Contas a Pagar, Contas a Receber e DRE com precisão matemática.',
      steps: [
        'Abertura de Ordem de Serviço ou Venda: O cliente e os itens são selecionados; se houver peças aplicadas, o estoque é reservado ou baixado.',
        'Faturamento e Formas de Pagamento: Ao definir a forma de pagamento (Dinheiro, PIX, Cartão Débito ou Crédito com parcelas), as taxas da operadora são calculadas automaticamente.',
        'Contas a Receber: Todas as OSs e Vendas Faturadas entram imediatamente no Contas a Receber (Financeiro) para controle de status PENDENTE ou PAGO.',
        'Custos Iniciais e Despesas: Contas recorrentes (salários, aluguel, internet, DAS MEI) e parcelamentos de dívidas alimentam as Contas a Pagar e o Simulador de Break-Even.',
        'DRE e Lucratividade: O sistema calcula a Receita Bruta, subtrai o Custo das Mercadorias (CMV) e todas as despesas fixas para gerar o Lucro Líquido Real.'
      ],
      tips: [
        'Acesse a tela "Visão Geral" (Dashboard) para ter um panorama instantâneo de faturamento, margens, OSs em andamento e contas pendentes do mês.',
        'Sempre selecione a competência (Mês/Ano) no topo da tela para visualizar os relatórios e DRE do período desejado.'
      ],
      rules: [
        'Vendas Diretas e Ordens de Serviço faturadas no mesmo mês são consolidadas na Receita Bruta.',
        'Nenhum dado financeiro é descartado: vendas avulsas de balcão entram 100% no faturamento do DRE.'
      ]
    },
    {
      id: 'ordens_servico',
      title: '2. Módulo de Ordens de Serviço (OS) & Campo',
      badge: 'Operações',
      icon: ClipboardList,
      targetTab: 'orders',
      summary: 'Guia completo para abertura de OS, laudo técnico, checklists inteligentes, serviços avulsos ou do catálogo, fotos e assinatura digital.',
      steps: [
        'Clique em "+ Nova Ordem de Serviço" no canto superior da tela.',
        'Selecione o Cliente (ou cadastre um novo cliente rapidamente sem obrigatoriedade de CPF).',
        'Selecione Serviços do Catálogo ou adicione Serviços Avulsos personalizados.',
        'Selecione o Checklist Inteligente: os checklists anexados ao serviço são carregados automaticamente para conferência estrutural e elétrica.',
        'Adicione Peças e Insumos necessários: o sistema buscará o preço de venda e o custo do estoque.',
        'Anexe Fotos de Entrada e Fotos de Saída para comprovação técnica antes e depois do serviço.',
        'Colete a Assinatura Digital Touch do cliente direto na tela do celular, tablet ou computador.',
        'Finalize a OS: o sistema gera o documento oficial padrão A4 para impressão ou envio em PDF.'
      ],
      tips: [
        'Serviços criados em campo podem ser salvos imediatamente no catálogo com checklist vinculado.',
        'O número da OS segue a numeração automática configurada em Configurações do Sistema.'
      ],
      rules: [
        'Ao marcar a OS como concluída/entregue, as peças aplicadas são movimentadas no estoque.',
        'Se o pagamento não foi quitado na entrega, o saldo restante fica registrado como A RECEBER no Financeiro.'
      ]
    },
    {
      id: 'vendas_diretas',
      title: '3. Módulo de Vendas Diretas & Balcão de Peças',
      badge: 'Vendas',
      icon: ShoppingBag,
      targetTab: 'sales',
      summary: 'Registro ágil de vendas de balcão, cálculo de margens de varejo e atacado, desconto e baixa automática de estoque.',
      steps: [
        'Clique em "Nova Venda Direta" na tela de Vendas.',
        'Informe o Cliente (opcional para vendas rápidas de balcão) e o Vendedor.',
        'Adicione os produtos ao carrinho escolhendo entre Preço de Varejo ou Preço de Atacado.',
        'Aplique desconto em valor (R$) ou percentual (%), caso necessário.',
        'Escolha a forma de pagamento (Dinheiro, PIX, Cartão Débito ou Cartão Crédito em até 12x).',
        'Confirme a venda: o estoque é baixado instantaneamente e a receita é lançada no Financeiro.'
      ],
      tips: [
        'Vendas a prazo entram automaticamente na aba "Contas a Receber" no Financeiro.',
        'Você pode emitir o comprovante de venda e cupom não fiscal para o cliente.'
      ],
      rules: [
        'O custo das mercadorias vendidas (CMV) é contabilizado no DRE para apuração da Margem de Contribuição.'
      ]
    },
    {
      id: 'financeiro_dre',
      title: '4. Financeiro, Contas a Receber, Contas a Pagar & DRE',
      badge: 'Financeiro',
      icon: DollarSign,
      targetTab: 'financial',
      summary: 'Conciliação bancária simplificada, fluxo de caixa, controle de baixas e DRE Gerencial de alta precisão.',
      steps: [
        'Acesse a aba "Contas a Receber" para visualizar todas as Ordens de Serviço e Vendas do mês.',
        'Clique no botão "Dar Baixa (Receber)" quando o cliente efetuar o pagamento via PIX, dinheiro ou cartão.',
        'Acesse a aba "Contas a Pagar" para acompanhar despesas de aluguel, internet, salários, DAS MEI e parcelas de dívidas.',
        'Clique no botão "Dar Baixa (Pagar)" para liquidar a conta e manter o saldo devedor atualizado.',
        'Consulte a aba "DRE Gerencial" para verificar o Demonstrativo de Resultado oficial: Receita Bruta, Custos Variáveis, Custos com Pessoal, Custos com Frota, Custos Fixos, Tributos e Lucro Líquido.'
      ],
      tips: [
        'Use os filtros rápidos "Apenas Pendentes" e "Apenas Quitados" para focar nas contas do dia.',
        'O DRE desconta automaticamente as taxas de operadoras de cartão informadas nas vendas.'
      ],
      rules: [
        'Uma conta dada como baixa atualiza em tempo real os indicadores do Dashboard.',
        'Contas a pagar atrasadas geram alertas automáticos de atenção.'
      ]
    },
    {
      id: 'custos_iniciais_dividas',
      title: '5. Custos Iniciais, Despesas Recorrentes & Dívidas da Empresa',
      badge: 'Planejamento',
      icon: Calculator,
      targetTab: 'initialCosts',
      summary: 'Mapeamento de contas recorrentes (salários CLT, aluguel, internet, combustíveis, DAS MEI), dívidas da empresa parceladas e cálculo do Break-Even.',
      steps: [
        'Cadastre as despesas mensais recorrentes da sua empresa (Aluguel da Loja, Salários da Equipe, Internet, DAS MEI, Alimentação, Combustíveis).',
        'Cadastre dívidas parceladas (Empréstimos bancários, financiamentos, IPVA parcelado, Seguros em 12x): informe a quantidade de parcelas (ex: 24x), parcelas já pagas e valor mensal.',
        'Use o botão "+1 Parcela Paga" diretamente na tabela para amortizar parcelas pagas no mês.',
        'Clique em "Sincronizar com Contas a Pagar" para alimentar automaticamente o fluxo financeiro do sistema.',
        'Consulte o Simulador de Ponto de Equilíbrio (Break-Even): veja quantas Ordens de Serviço são necessárias no mês para pagar todas as contas fixas e atingir o lucro desejado.'
      ],
      tips: [
        'Ajuste o Ticket Médio previsto por OS e a Margem de Insumos para simular cenários realistas de viabilidade.',
        'O saldo devedor restante de todas as dívidas da empresa é recalculado dinamicamente.'
      ],
      rules: [
        'Contas marcadas como "Sincronizado" alimentam automaticamente as Contas a Pagar do Financeiro.'
      ]
    },
    {
      id: 'produtos_margens',
      title: '6. Produtos, Estoque & Margens (55% Varejo / 35% Atacado)',
      badge: 'Estoque',
      icon: Package,
      targetTab: 'products',
      summary: 'Cadastro de produtos com precificação automática de 55% para varejo e 35% para atacado, controle de estoque mínimo e movimentações.',
      steps: [
        'Ao cadastrar um produto, informe o Preço de Custo (ex: R$ 100,00).',
        'O sistema calcula automaticamente o Preço de Varejo (+55% = R$ 155,00) e o Preço de Atacado (+35% = R$ 135,00).',
        'Utilize o botão "Aplicar Margem 55% Varejo e 35% Atacado em Todos os Produtos" para reajustar todo o catálogo em 1 clique.',
        'Defina o Estoque Mínimo para receber alertas visuais quando o produto estiver prestes a esgotar.',
        'Cadastre Marcas, Categorias, Subcategorias, Tags e URL amigável para organização completa do catálogo.'
      ],
      tips: [
        'A conferência de XML de NF-e aplica automaticamente as margens de 55% e 35% aos itens importados.',
        'Você pode personalizar as margens individualmente caso algum item exija margem diferenciada.'
      ],
      rules: [
        'Preço de Varejo = Custo × 1.55 (Margem de 55%).',
        'Preço de Atacado = Custo × 1.35 (Margem de 35%).'
      ]
    },
    {
      id: 'importacao_nfe',
      title: '7. Importação Multi-Formato & Leitura de NF-e (XML)',
      badge: 'Integrações',
      icon: UploadCloud,
      targetTab: 'cadastros',
      summary: 'Leitura automática de arquivos XML de notas fiscais com cadastro de fornecedor, atualização de estoque e contas a pagar.',
      steps: [
        'Na Central de Cadastros ou na tela de Produtos, selecione "Importar XML de NF-e".',
        'Selecione o arquivo .xml da NF-e emitida pelo seu fornecedor.',
        'O sistema extrai a Razão Social, CNPJ, endereço e dados de contato do Fornecedor.',
        'Todos os produtos da nota são listados com NCM, código do fabricante, custo unitário e sugestão de Varejo (55%) e Atacado (35%).',
        'Confirme a importação: o fornecedor é cadastrado, os produtos entram no estoque e uma Conta a Pagar com o valor da nota é gerada automaticamente.'
      ],
      tips: [
        'Na aba "Importação Multi-Formato & Backup", você pode trazer dados legados em CSV, XLSX, TXT, PDF, XML e SQL com exemplos prontos.',
        'Você pode conferir e ajustar as margens antes de confirmar a importação do XML.'
      ],
      rules: [
        'Produtos com o mesmo código ou nome são atualizados no estoque sem criar duplicidades.',
        'O fornecedor identificado pelo CNPJ não é duplicado se já existir na base.'
      ]
    },
    {
      id: 'operadoras_cartao',
      title: '8. Operadoras de Cartão & Repasse de Taxas',
      badge: 'Meios de Pagamento',
      icon: CreditCard,
      targetTab: 'cardOperators',
      summary: 'Configuração de operadoras de maquininhas (ex: InfinitePay, PagBank), parcelamento em até 12x e regra de absorver ou repassar taxa.',
      steps: [
        'Acesse "Operadoras de Cartão" no menu lateral.',
        'Visualize as operadoras cadastradas (InfinitePay, PagBank, etc.) com suas taxas de Débito, Crédito à Vista e Parcelado de 2x a 12x.',
        'Configure a integração via API/Token ou utilize a simulação de maquininha.',
        'Escolha o modo de absorção padrão: "Repassar para o cliente" (acréscimo no valor) ou "Assumir taxa" (empresa absorve o desconto).',
        'Ao lançar uma venda ou OS, selecione a operadora e a quantidade de parcelas: o sistema calcula o valor líquido a receber e a taxa exata retida.'
      ],
      tips: [
        'A InfinitePay já vem pré-configurada com tabela completa de 1x a 12x parcelas.',
        'As taxas descontadas são contabilizadas automaticamente na linha de "Taxas de Cartão" do DRE.'
      ],
      rules: [
        'Se repassar a taxa, o valor final pago pelo cliente cobre o custo financeiro da operadora.'
      ]
    },
    {
      id: 'backup_seguranca',
      title: '9. Backup, Google Drive & Versionamento',
      badge: 'Segurança',
      icon: HardDrive,
      targetTab: 'googleDrive',
      summary: 'Rotinas de segurança, sincronização na nuvem com Google Drive, logs de auditoria e controle de versão.',
      steps: [
        'Acesse a tela "Google Drive" no menu lateral para autenticar e exportar backups automáticos dos seus dados.',
        'O sistema mantém controle de versão oficial visível no rodapé de todas as telas.',
        'Acesse os "Logs de Auditoria" no cabeçalho para auditar qualquer criação, edição ou exclusão de dados feita pelos usuários.',
        'Você pode baixar o arquivo zip completo do sistema a qualquer momento para backup local offline.'
      ],
      tips: [
        'Recomenda-se realizar o backup semanal para garantir a integridade dos dados históricos.',
        'Apenas administradores têm permissão para restaurar backups e limpar bases de dados.'
      ],
      rules: [
        'Toda ação crítica de exclusão ou alteração de preço gera um registro inalterável de auditoria.'
      ]
    }
  ];

  // Filter sections by search term
  const filteredSections = sections.filter(sec => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      sec.title.toLowerCase().includes(term) ||
      sec.summary.toLowerCase().includes(term) ||
      sec.steps.some(s => s.toLowerCase().includes(term)) ||
      sec.tips.some(t => t.toLowerCase().includes(term))
    );
  });

  const activeSection = sections.find(s => s.id === selectedSectionId) || sections[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Manual do Sistema & Guia de Funções
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manual oficial em português detalhando passo a passo todos os módulos, regras financeiras e fluxos operacionais.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Imprimir Manual</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Pesquisar por assunto, tela, regra de negócio ou fórmula (ex: DRE, NF-e, 55%, checklist, parcelas)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
        />
      </div>

      {/* Main Content Layout: Sidebar of Sections + Section Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Modules List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1 mb-2">
            Módulos & Capítulos do Manual
          </div>
          <div className="space-y-1.5 max-h-[75vh] overflow-y-auto pr-1">
            {filteredSections.map(sec => {
              const Icon = sec.icon;
              const isSelected = sec.id === activeSection.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSectionId(sec.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-300 text-blue-900 shadow-xs ring-1 ring-blue-300'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {sec.badge}
                      </span>
                    </div>
                    <div className="text-xs font-bold truncate">
                      {sec.title}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                      {sec.summary}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section Detail Panel */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          {/* Header of Active Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {activeSection.badge}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {activeSection.title}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {activeSection.summary}
              </p>
            </div>

            {activeSection.targetTab && onNavigate && (
              <button
                onClick={() => onNavigate(activeSection.targetTab!)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs shrink-0 self-start sm:self-center"
              >
                <span>Acessar Módulo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Passo a Passo & Como Operar</span>
            </h3>
            <div className="space-y-2.5">
              {activeSection.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="leading-relaxed flex-1">
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Business Rules & Formulas */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Regras de Negócio & Vínculos de Precisão</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {activeSection.rules.map((rule, idx) => (
                <div key={idx} className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                  <span className="leading-relaxed">{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Best Practices & Pro Tips */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Dicas & Recomendações de Produtividade</span>
            </h3>
            <div className="space-y-2">
              {activeSection.tips.map((tip, idx) => (
                <div key={idx} className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
