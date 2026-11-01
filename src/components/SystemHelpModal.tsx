import React, { useState, useMemo } from 'react';
import { 
  HelpCircle, 
  Search, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  ClipboardList, 
  Printer, 
  CreditCard, 
  Package, 
  Barcode, 
  Copy, 
  History, 
  FileSpreadsheet, 
  DollarSign, 
  TrendingUp, 
  Truck, 
  ShieldCheck, 
  Palette, 
  UserCheck, 
  Settings, 
  ListOrdered, 
  ExternalLink,
  BookOpen,
  Camera,
  PenTool,
  Download,
  Info
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface SystemHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: ActiveTab) => void;
}

interface HelpItem {
  id: string;
  category: 'operacoes' | 'vendas_estoque' | 'financeiro' | 'configuracoes' | 'portal';
  categoryLabel: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  summary: string;
  howToUse: string[];
  tips?: string;
  targetTab?: ActiveTab;
}

export const SystemHelpModal: React.FC<SystemHelpModalProps> = ({ 
  isOpen, 
  onClose,
  onNavigate 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [activeItemDetails, setActiveItemDetails] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    { id: 'todos', label: 'Todas as Funções' },
    { id: 'operacoes', label: 'Operações & OS' },
    { id: 'vendas_estoque', label: 'Vendas & Estoque' },
    { id: 'financeiro', label: 'Financeiro & PagBank' },
    { id: 'configuracoes', label: 'Configurações & Garantias' },
    { id: 'portal', label: 'Portal & Clientes' }
  ];

  const helpItems: HelpItem[] = [
    {
      id: 'os_create',
      category: 'operacoes',
      categoryLabel: 'Operações & OS',
      title: 'Abertura & Gestão de Ordens de Serviço (OS)',
      icon: ClipboardList,
      badge: 'Operação Central',
      summary: 'Fluxo completo de assistência técnica, diagnóstico de defeitos, serviços a executar, peças necessárias e prazos de entrega.',
      howToUse: [
        'Clique no botão "+ Nova OS" no cabeçalho ou na tela de Ordens de Serviço.',
        'Selecione o cliente já cadastrado ou digite seu nome/documento.',
        'Informe o equipamento (Ex: Aquecedor Rheem, Bomba Dancor, Casco Piscina) e a descrição do problema relatado.',
        'Adicione os serviços de mão de obra e as peças que serão utilizadas.',
        'O sistema calcula automaticamente o valor total, taxas de deslocamento e prazos.'
      ],
      tips: 'A numeração da OS segue a sua regra personalizada configurada na aba de Configurações.',
      targetTab: 'orders'
    },
    {
      id: 'os_print_a4',
      category: 'operacoes',
      categoryLabel: 'Operações & OS',
      title: 'Impressão da OS em Folha A4 Oficial & PDF',
      icon: Printer,
      badge: 'Documento Oficial',
      summary: 'Impressão padronizada em folha A4 com o número da OS no canto superior direito, logotipo da empresa à esquerda e campos inteligentes.',
      howToUse: [
        'Abra qualquer OS na lista clicando no botão "Visualizar / Ações".',
        'Clique em "Imprimir / Salvar PDF".',
        'A tela de impressão abre formatada para folha A4 sem barras ou cabeçalhos do navegador.',
        'Regra Condicional Automática: se for apenas venda de produtos, imprime só o bloco de produtos; se for apenas serviço, imprime só o bloco de mão de obra; se for conjugado, imprime ambos os blocos.'
      ],
      tips: 'Você pode salvar como PDF ou enviar direto para sua impressora térmica ou jato de tinta.',
      targetTab: 'orders'
    },
    {
      id: 'os_charge_pdv',
      category: 'operacoes',
      categoryLabel: 'Operações & OS',
      title: 'Botão "Cobrar" & Envio da Fatura para o PDV',
      icon: CreditCard,
      badge: 'Faturamento Direto',
      summary: 'Permite faturar a OS finalizada enviando-a imediatamente para o módulo PDV de caixa, realizando o acerto financeiro.',
      howToUse: [
        'Na visualização da OS, clique no botão azul "Cobrar (Enviar ao PDV)".',
        'A tela de pagamento se abre com o valor residual da OS pré-preenchido.',
        'Selecione a forma de pagamento: Pix, Cartão de Débito, Cartão de Crédito ou Boleto.',
        'Ao confirmar o recebimento, o status da OS muda para "Pago / Entregue" e o valor entra no fluxo de caixa.'
      ],
      tips: 'Ao usar maquininha com taxas cadastradas, o sistema já calcula o valor líquido recebido pela empresa.',
      targetTab: 'orders'
    },
    {
      id: 'os_checklists_photos',
      category: 'operacoes',
      categoryLabel: 'Operações & OS',
      title: 'Checklists Inteligentes & Fotos de Entrada/Saída',
      icon: Camera,
      badge: 'Vistoria Técnica',
      summary: 'Vistoria detalhada dividida por Estrutura/Tanque, Hidráulica, Elétrica e Segurança, com registro fotográfico e assinatura digital.',
      howToUse: [
        'Ao editar ou abrir a OS, vá na aba "Checklists & Vistoria".',
        'Marque o status de cada item: "Conforme", "Defeito" ou "Não se aplica".',
        'Anexe fotos do equipamento no momento da chegada (fotos de entrada) e após o conserto (fotos de saída).',
        'Colete a assinatura do cliente diretamente na tela do tablet ou celular.'
      ],
      tips: 'A assinatura digital e o checklist completo saem impressos no relatório final da OS.',
      targetTab: 'orders'
    },
    {
      id: 'product_barcode',
      category: 'vendas_estoque',
      categoryLabel: 'Vendas & Estoque',
      title: 'Código de Barras EAN-13 com Gerador Automático',
      icon: Barcode,
      badge: 'Estoque Inteligente',
      summary: 'Geração com 1 clique de códigos de barras no padrão oficial EAN-13 para agilizar a leitura em leitor óptico e PDV.',
      howToUse: [
        'Acesse a tela "Produtos & Estoque" e clique em "+ Novo Produto".',
        'Ao lado do campo "Código de Barras", clique no botão "Gerar Código".',
        'O sistema calcula os dígitos válidos com o dígito verificador EAN-13 oficial.',
        'Você também pode digitar ou bipar manualmente com um leitor USB/Bluetooth.'
      ],
      tips: 'O código de barras gerado pode ser pesquisado instantaneamente na busca rápida de vendas.',
      targetTab: 'products'
    },
    {
      id: 'product_duplicate',
      category: 'vendas_estoque',
      categoryLabel: 'Vendas & Estoque',
      title: 'Botão "Duplicar" no Estoque de Produtos',
      icon: Copy,
      badge: 'Agilidade de Cadastro',
      summary: 'Duplica todos os dados de um produto existente (modelo, categoria, fornecedor, margem e taxas) para criar um novo produto em segundos.',
      howToUse: [
        'Na tabela de Produtos & Estoque, localize o produto que deseja usar como modelo.',
        'Clique no botão "Duplicar" na coluna de Ações.',
        'O modal de cadastro abrirá com os dados preenchidos e o nome com o sufixo "(Cópia)".',
        'Ajuste apenas o que mudar (ex: voltagem 220V para 110V ou tamanho) e salve.'
      ],
      tips: 'Economiza tempo precioso ao cadastrar filtros de diferentes capacidades ou potências de motobombas.',
      targetTab: 'products'
    },
    {
      id: 'product_history',
      category: 'vendas_estoque',
      categoryLabel: 'Vendas & Estoque',
      title: 'Histórico Total 360° do Produto',
      icon: History,
      badge: 'Rastreabilidade',
      summary: 'Extrato completo de movimentações de um item: compras via NF-e, saídas em ordens de serviço, vendas diretas e saldo em estoque.',
      howToUse: [
        'Na lista de produtos, clique no botão "Histórico Total" de qualquer produto.',
        'Veja a linha do tempo com data, quantidade movimentada, preço praticado e número da OS ou Venda.',
        'Acompanhe o saldo residual e o lucro bruto total gerado por aquele item.'
      ],
      tips: 'Ideal para auditorias e conferência de garantia com distribuidores e fornecedores.',
      targetTab: 'products'
    },
    {
      id: 'direct_sales',
      category: 'vendas_estoque',
      categoryLabel: 'Vendas & Estoque',
      title: 'Vendas Diretas de Balcão (PDV)',
      icon: Package,
      badge: 'Faturamento Rápido',
      summary: 'Emissão ágil de vendas de peças, produtos químicos e equipamentos sem necessidade de abrir uma ordem de serviço.',
      howToUse: [
        'Acesse a tela "Vendas" no menu lateral.',
        'Clique em "+ Nova Venda".',
        'Selecione os produtos do estoque, ajuste as quantidades e aplique descontos se desejar.',
        'Selecione a tabela de preço (Varejo ou Atacado) e as opções de pagamento.',
        'Ao salvar, o estoque dá baixa imediata e a receita é contabilizada.'
      ],
      tips: 'Permite parcelamento em cartão com cálculo automático de taxas da maquininha.',
      targetTab: 'sales'
    },
    {
      id: 'xml_nfe_import',
      category: 'vendas_estoque',
      categoryLabel: 'Vendas & Estoque',
      title: 'Importação de NF-e via Arquivo XML',
      icon: Download,
      badge: 'Automação Fiscal',
      summary: 'Carregue o arquivo XML da nota fiscal enviada pelo fornecedor para cadastrar ou abastecer itens do estoque automaticamente.',
      howToUse: [
        'Na tela de Produtos ou Cadastros, clique em "Importar XML de NF-e".',
        'Selecione o arquivo .xml da nota fiscal de compra emitida contra seu CNPJ.',
        'O sistema lê todos os itens, códigos, NCM, quantidades e custos unitários.',
        'Confirme a importação: os produtos têm seu estoque incrementado e a despesa entra no contas a pagar.'
      ],
      tips: 'Evita digitação manual e elimina erros de digitação de custos e quantidades.',
      targetTab: 'products'
    },
    {
      id: 'card_operators_pagbank',
      category: 'financeiro',
      categoryLabel: 'Financeiro & PagBank',
      title: 'Operadoras de Cartão & Baixa Automática PagBank',
      icon: CreditCard,
      badge: 'Automação Bancária',
      summary: 'Configuração de adquirentes (PagBank, Cielo, Stone, Rede) com taxas por bandeira e conciliação bancária automática via webhook.',
      howToUse: [
        'Acesse "Operadoras & PagBank" no menu Financeiro.',
        'Consulte ou edite as taxas contratadas para Débito, Crédito à Vista e Parcelado de 2x a 12x.',
        'No card do PagBank, ative a "Baixa Automática".',
        'Quando um cliente pagar uma OS via link ou cartão PagBank, o sistema dá baixa imediata com registro de NSU e taxa deduzida.'
      ],
      tips: 'O botão "Sincronizar Pedidos Pendentes" varre os pagamentos pendentes e atualiza o caixa em 1 segundo.',
      targetTab: 'cardOperators'
    },
    {
      id: 'employee_profitability',
      category: 'financeiro',
      categoryLabel: 'Financeiro & PagBank',
      title: 'Lucratividade & Performance por Colaborador',
      icon: TrendingUp,
      badge: 'Gestão de Produtividade',
      summary: 'Painel que calcula o retorno financeiro real de cada técnico e funcionário, descontando salário, encargos e custos de deslocamento.',
      howToUse: [
        'Acesse a tela "Lucratividade" no menu lateral.',
        'Selecione o mês desejado no topo do sistema.',
        'Veja a receita gerada por cada técnico em serviços e peças vendidas.',
        'O sistema subtrai o custo de peças, salário, combustível e veículos para exibir o Lucro Líquido Real gerado pelo funcionário.'
      ],
      tips: 'Excelente métrica para distribuição de comissões e bonificações por resultado.',
      targetTab: 'profitability'
    },
    {
      id: 'fleet_and_km',
      category: 'financeiro',
      categoryLabel: 'Financeiro & PagBank',
      title: 'Frota, Combustível & Quilometragem por OS',
      icon: Truck,
      badge: 'Custos de Campo',
      summary: 'Controle de veículos da empresa, gastos com gasolina, trocas de óleo, pneus e rateio de IPVA e seguro por ordem de serviço.',
      howToUse: [
        'Acesse "Frota & Veículos" no menu lateral.',
        'Cadastre os veículos (placa, modelo, motorista responsável e km atual).',
        'Lance os abastecimentos e notas de manutenção da oficina.',
        'Nas ordens de serviço, informe a quilometragem percorrida: o sistema rateia o custo do km rodado no custo daquela OS.'
      ],
      tips: 'Ajuda a saber exatamente quanto custa colocar um carro na rua para atender cada cliente.',
      targetTab: 'fleet'
    },
    {
      id: 'accounting_closing',
      category: 'financeiro',
      categoryLabel: 'Financeiro & PagBank',
      title: 'Fechamento Contábil Mensal para o Contador',
      icon: FileSpreadsheet,
      badge: 'Contabilidade & Fiscal',
      summary: 'Relatório estruturado com todas as entradas tributáveis, despesas operacionais comprovadas e conciliação para envio ao contador.',
      howToUse: [
        'Acesse a aba "Fechamento Fiscal" no menu lateral.',
        'Selecione o mês de fechamento.',
        'Revise as receitas por método de pagamento e as despesas com comprovantes.',
        'Clique em "Exportar Relatório do Contador" para gerar o documento formatado em PDF ou planilha.'
      ],
      tips: 'Evita retrabalho no final do mês e reduz o tempo de fechamento do Simples Nacional ou Lucro Presumido.',
      targetTab: 'accounting'
    },
    {
      id: 'sequence_settings',
      category: 'configuracoes',
      categoryLabel: 'Configurações & Garantias',
      title: 'Configuração das Numerações de OS, Vendas e Orçamentos',
      icon: ListOrdered,
      badge: 'Sequências Personalizadas',
      summary: 'Permite configurar o próximo número de OS (ex: a partir de 2025020328), prefixos (como OS-, VD-, ORC-) e dígitos mínimos.',
      howToUse: [
        'Vá em "Configurações" no menu lateral e clique na aba "Numerações & Séries".',
        'Informe o número exato a partir do qual deseja que o sistema continue a contagem.',
        'Defina prefixos personalizados e quantidade de dígitos com zeros à esquerda.',
        'Veja a visualização prévia em tempo real e clique em "Salvar Numerações".'
      ],
      tips: 'Ideal para empresas que já possuíam um bloco de notas ou sistema anterior e precisam manter a sequência oficial.',
      targetTab: 'configuracoes'
    },
    {
      id: 'warranty_policies',
      category: 'configuracoes',
      categoryLabel: 'Configurações & Garantias',
      title: 'Políticas de Garantia Atreladas aos Serviços',
      icon: ShieldCheck,
      badge: 'Proteção Jurídica',
      summary: 'Crie prazos de garantia específicos (ex: 90 dias para mão de obra, 365 dias para tanques) e vincule aos serviços do catálogo.',
      howToUse: [
        'Em "Configurações", acesse a aba "Garantias & Serviços Atrelados".',
        'Clique em "+ Nova Política de Garantia".',
        'Informe o nome da garantia, prazo em dias (ex: 90, 180, 365) e os termos contratuais.',
        'Marque quais serviços do catálogo utilizarão essa regra de garantia.',
        'Ao abrir uma OS com esses serviços, o prazo de garantia e o vencimento são calculados automaticamente!'
      ],
      tips: 'Os termos da garantia saem impressos diretamente no rodapé da folha de OS do cliente.',
      targetTab: 'configuracoes'
    },
    {
      id: 'themes_visual',
      category: 'configuracoes',
      categoryLabel: 'Configurações & Garantias',
      title: 'Personalização Visual: 3 Temas com Cores Vibrantes',
      icon: Palette,
      badge: 'Design & Cores',
      summary: 'Alterne entre o tema MP Piscina Clássico, o tema Terra & Oliva Vibrante (paleta 1) e o tema Claro & Suave com Ouro Vibrante (paleta 2).',
      howToUse: [
        'Você pode trocar o tema em qualquer momento pelo botão "Tema" no cabeçalho superior.',
        'Ou na aba "Temas & Identidade Visual" dentro de Configurações.',
        'Ou logo na tela inicial de Login.',
        'A troca é imediata e preservada na memória do seu navegador.'
      ],
      tips: 'O tema Claro & Suave com Ouro Vibrante oferece excelente nitidez para leitura em tablets e ambientes iluminados.',
      targetTab: 'configuracoes'
    },
    {
      id: 'customer_portal',
      category: 'portal',
      categoryLabel: 'Portal & Clientes',
      title: 'Portal Exclusivo do Cliente & Abertura de Chamados',
      icon: UserCheck,
      badge: 'Área do Cliente',
      summary: 'Ambiente exclusivo para que clientes consultem suas OSs finalizadas, baixem seus comprovantes e solicitem garantia online.',
      howToUse: [
        'O cliente pode acessar o sistema com seu usuário (ex: maria.gorete).',
        'A interface simplifica os menus mostrando apenas suas ordens e garantias ativas.',
        'O cliente pode abrir um novo chamado informando o problema e anexando fotos.',
        'A notificação entra instantaneamente para a equipe técnica no painel principal.'
      ],
      tips: 'Você pode enviar o link de acesso direto pelo WhatsApp com o número da OS do cliente.',
      targetTab: 'customerPortal'
    },
    {
      id: 'backup_restore',
      category: 'configuracoes',
      categoryLabel: 'Configurações & Garantias',
      title: 'Backup Completo & Restauração em 1-Clique',
      icon: Download,
      badge: 'Segurança dos Dados',
      summary: 'Exportação de segurança de todos os clientes, produtos, ordens de serviço, finanças e configurações em um único arquivo JSON.',
      howToUse: [
        'Acesse a tela "Configurações" e vá na aba "Backup & Banco de Dados".',
        'Clique em "Exportar Backup Agora" para salvar uma cópia segura em seu computador ou pen drive.',
        'Para restaurar em outra máquina ou após formatação, basta arrastar o arquivo JSON em "Restaurar Backup".'
      ],
      tips: 'Recomendamos salvar um backup semanal para garantir total tranquilidade na operação.',
      targetTab: 'configuracoes'
    }
  ];

  const filteredItems = useMemo(() => {
    return helpItems.filter(item => {
      const matchesCategory = selectedCategory === 'todos' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        item.howToUse.some(step => step.toLowerCase().includes(q)) ||
        (item.tips && item.tips.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [helpItems, selectedCategory, searchQuery]);

  const handleGoToFeature = (tab?: ActiveTab) => {
    if (tab && onNavigate) {
      onNavigate(tab);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-[#d8d8d8] overflow-hidden">
        
        {/* Top Header of Modal */}
        <div className="px-6 py-5 border-b border-[#d8d8d8] bg-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#53383e] text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#363739] tracking-tight">
                  Guia do Sistema & Central de Ajuda
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#f6eff1] text-[#53383e] border border-[#d8d8d8]">
                  Manual Interativo
                </span>
              </div>
              <p className="text-xs text-[#707174] mt-0.5">
                Consulte todas as funcionalidades do GestãoPro e saiba passo a passo como utilizá-las na sua operação.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#707174] hover:text-[#363739] hover:bg-[#f4f5f6] rounded-xl transition-colors cursor-pointer"
            title="Fechar guia de ajuda"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 sm:px-6 bg-[#fafafa] border-b border-[#d8d8d8] space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#707174] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar função (ex: imprimir folha A4, código de barras, duplicar produto, pagbank, garantia, PDV)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#d8d8d8] rounded-xl text-xs sm:text-sm font-medium text-[#363739] focus:outline-none focus:ring-2 focus:ring-[#53383e] shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#707174] hover:text-[#363739]"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Categories Horizontal Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#53383e] text-white shadow-xs'
                    : 'bg-white text-[#707174] hover:text-[#363739] border border-[#d8d8d8]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[var(--color-canvas)]">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#d8d8d8] p-8">
              <HelpCircle className="w-10 h-10 text-[#707174] mx-auto mb-3" />
              <h3 className="text-sm font-bold text-[#363739]">Nenhuma função encontrada</h3>
              <p className="text-xs text-[#707174] mt-1 max-w-md mx-auto">
                Tente buscar por outros termos como "OS", "impressão", "código de barras", "pagbank", "duplicar" ou "garantia".
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('todos'); }}
                className="mt-4 px-3 py-1.5 bg-[#53383e] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Ver Todas as Funções
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const isExpanded = activeItemDetails === item.id;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-[#d8d8d8] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#f6eff1] text-[#53383e] flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#707174] tracking-wider block">
                              {item.categoryLabel}
                            </span>
                            <h3 className="text-sm font-extrabold text-[#363739] leading-tight">
                              {item.title}
                            </h3>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-[#363739] shrink-0 border border-slate-200">
                          {item.badge}
                        </span>
                      </div>

                      {/* Summary */}
                      <p className="text-xs text-[#5a5b5e] leading-relaxed mb-3">
                        {item.summary}
                      </p>

                      {/* Step-by-Step Guide */}
                      <div className="bg-[#fcfbf9] rounded-xl p-3 border border-[#ede9e3] space-y-2 mb-3">
                        <div className="text-[11px] font-bold text-[#363739] flex items-center gap-1.5 uppercase tracking-wide">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Como Usar Passo a Passo:
                        </div>
                        <ol className="space-y-1.5 text-xs text-[#5a5b5e]">
                          {item.howToUse.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-white border border-[#d8d8d8] text-[10px] font-bold text-[#363739] flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Tips */}
                      {item.tips && (
                        <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2 mb-3">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span><strong>Dica Prática:</strong> {item.tips}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Footer */}
                    {item.targetTab && (
                      <div className="pt-2 border-t border-[#f0f0f0] flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleGoToFeature(item.targetTab)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#53383e] hover:text-white bg-[#f6eff1] hover:bg-[#53383e] rounded-lg transition-all cursor-pointer border border-[#d8d8d8]"
                        >
                          <span>Ir para esta função</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-[#d8d8d8] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#707174]">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#53383e]" />
            <span>Precisa de treinamento adicional? O sistema possui integração de auditoria e validação automática.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#53383e] hover:bg-[#432c32] text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            Entendido / Fechar Guia
          </button>
        </div>

      </div>
    </div>
  );
};
