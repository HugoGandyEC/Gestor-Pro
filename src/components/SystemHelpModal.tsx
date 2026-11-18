import React, { useState, useMemo } from 'react';
import { 
  HelpCircle, 
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
  Info,
  ShoppingBag,
  HardHat,
  ChevronRight,
  Bookmark,
  ChevronDown,
  Lock,
  Menu,
  Shield,
  FileText,
  User,
  Wrench,
  Check,
  Building,
  KeyRound,
  Eye,
  Sliders,
  HardDrive,
  Receipt,
  BarChart3,
  Ban,
  Store,
  Search
} from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { SYSTEM_VERSION } from '../constants/version';
import { LiveSearchInput, LiveSearchOption } from './LiveSearchInput';

interface SystemHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: ActiveTab) => void;
}

export interface ManualModule {
  id: string;
  moduleCode: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  summary: string;
  objective: string;
  howToUse: string[];
  tips?: string;
  targetTab?: ActiveTab;
}

export interface ManualCategory {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  modules: ManualModule[];
}

export const SystemHelpModal: React.FC<SystemHelpModalProps> = ({ 
  isOpen, 
  onClose,
  onNavigate 
}) => {
  const [viewMode, setViewMode] = useState<'manual' | 'cards'>('manual');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('operacoes');
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>('os_create');

  if (!isOpen) return null;

  // Manual estruturado por Categorias e Módulos
  const manualCategories: ManualCategory[] = [
    {
      id: 'operacoes',
      title: 'Operações de Campo & Ordens de Serviço',
      icon: ClipboardList,
      description: 'Gestão de atendimentos, laudos técnicos, vistorias fotográficas, assinatura digital e impressão oficial A4.',
      modules: [
        {
          id: 'os_create',
          moduleCode: 'MOD-1.1',
          title: 'Abertura & Gestão de Ordens de Serviço (OS)',
          icon: ClipboardList,
          badge: 'Operação Central',
          objective: 'Registrar atendimentos técnicos, diagnósticos, serviços de mão de obra e peças com cálculo automático de totais.',
          summary: 'Ciclo completo desde o orçamento até a entrega do equipamento (reservatórios térmicos, piscinas, bombas e tubulações).',
          howToUse: [
            'Clique no botão "+ Nova OS" no cabeçalho ou na tela de Ordens de Serviço.',
            'Selecione o cliente já cadastrado ou digite seu nome para puxar endereço e telefone automaticamente.',
            'Informe o equipamento (tipo, modelo e número de série) e relate o problema apresentado.',
            'Adicione os serviços de mão de obra (com horas estimadas) e as peças necessárias do estoque.',
            'O sistema calcula a taxa de visita, subtotal, descontos e prazo previsto de conclusão.'
          ],
          tips: 'A numeração segue sua regra personalizada configurada na aba de Configurações.',
          targetTab: 'orders'
        },
        {
          id: 'os_print_a4',
          moduleCode: 'MOD-1.2',
          title: 'Impressão da OS em Folha A4 Oficial & PDF',
          icon: Printer,
          badge: 'Documento Oficial',
          objective: 'Gerar o documento oficial da OS com logotipo, número da OS no canto superior direito e formato A4 sem barras.',
          summary: 'Regra condicional inteligente: se for só venda, imprime só produtos; se for só serviço, imprime mão de obra; se conjugado, imprime ambos.',
          howToUse: [
            'Na listagem de OS, clique no botão "Imprimir" ou no ícone da impressora dentro do card.',
            'A tela abre com o modelo padronizado preenchido e logotipo da empresa.',
            'O título da aba no navegador é atualizado para "OS-2026-XXX" para que o PDF seja salvo com o nome correto.',
            'Selecione a impressora física ou clique em "Salvar como PDF" nas opções de impressão do navegador.'
          ],
          tips: 'Se houver assinatura digital coletada, o carimbo oficial autenticado sai impresso automaticamente no rodapé.',
          targetTab: 'orders'
        },
        {
          id: 'os_charge_pdv',
          moduleCode: 'MOD-1.3',
          title: 'Botão "Cobrar" & Envio da Fatura para o PDV',
          icon: CreditCard,
          badge: 'Faturamento',
          objective: 'Faturar a OS concluída enviando os valores imediatamente para o caixa e registrando a forma de pagamento.',
          summary: 'Integração direta entre a ordem de serviço e a frente de caixa (PDV) com cálculo de taxas de cartão ou Pix.',
          howToUse: [
            'Na visualização da OS, clique no botão azul "Cobrar (PDV)".',
            'A tela de pagamento abre com o valor residual da OS pré-preenchido.',
            'Selecione a forma de pagamento: Pix, Cartão de Débito, Cartão de Crédito (1x a 12x) ou Boleto.',
            'Ao confirmar o pagamento, o status da OS atualiza para "Pago" e o valor entra no fluxo de caixa.'
          ],
          tips: 'Ao usar maquininha com taxas cadastradas, o sistema já calcula o valor líquido exato a receber pela empresa.',
          targetTab: 'orders'
        },
        {
          id: 'os_checklists_photos',
          moduleCode: 'MOD-1.4',
          title: 'Checklists Inteligentes & Vistoria com Fotos Touch',
          icon: Camera,
          badge: 'Vistoria Técnica',
          objective: 'Registrar laudo visual e fotográfico de entrada e saída do equipamento para proteção jurídica.',
          summary: 'Checklist separado por categorias: Estrutura/Tanque, Hidráulica, Elétrica e Segurança, com foto e assinatura em tela.',
          howToUse: [
            'Ao editar ou abrir a OS, vá na aba "Checklists & Vistoria".',
            'Marque o status de cada item verificado: "Conforme", "Defeito" ou "Não se aplica".',
            'Anexe até fotos do equipamento na chegada e após a conclusão da manutenção.',
            'Colete a assinatura do cliente diretamente na tela do tablet ou smartphone com o dedo ou caneta touch.'
          ],
          tips: 'A assinatura e o checklist saem impressos diretamente no relatório final da OS.',
          targetTab: 'orders'
        },
        {
          id: 'technician_panel',
          moduleCode: 'MOD-1.5',
          title: 'Painel do Técnico: Escala e Diárias (Sem Financeiro da Empresa)',
          icon: HardHat,
          badge: 'Modo Técnico',
          objective: 'Oferecer ao técnico em campo uma visão limpa de suas tarefas sem expor as finanças globais da empresa.',
          summary: 'Lista unicamente os serviços atribuídos a ele, rotas no GPS, link para WhatsApp do cliente e extrato de suas diárias e comissões.',
          howToUse: [
            'Ao acessar o sistema com o perfil "Técnico em Campo", o painel financeiro geral da empresa é automaticamente removido.',
            'O técnico visualiza a quantidade de serviços a realizar e serviços já concluídos.',
            'Cada card possui botões rápidos: "Abrir GPS/Rotas", "Avisar no WhatsApp", "Iniciar Atendimento" e "Concluir Serviço".',
            'O técnico visualiza o valor de sua diária de visita técnica e a comissão de mão de obra calculada.'
          ],
          tips: 'Garante total sigilo comercial sobre margens da empresa enquanto oferece uma ferramenta produtiva em campo.',
          targetTab: 'dashboard'
        },
        {
          id: 'os_columns_tooltips',
          moduleCode: 'MOD-1.6',
          title: 'Tabela de OS: Abreviaturas & Tooltips Explicativos',
          icon: Info,
          badge: 'Interface Limpa',
          objective: 'Manter a tabela enxuta e elegante com títulos abreviados e detalhes completos ao passar o mouse.',
          summary: 'Colunas: Código, Cliente, Técnico, Garantia e Taxa, com tooltips em cada cabeçalho e em cada célula da linha.',
          howToUse: [
            'Passe o mouse sobre os cabeçalhos pontilhados (Código, Cliente, Técnico, Garantia, Taxa) para ver a legenda.',
            'Passe o mouse sobre qualquer dado na linha para visualizar o endereço completo, placa do veículo alocado ou prazo de garantia.'
          ],
          tips: 'Facilita a visualização em notebooks e tablets sem cortar colunas essenciais.',
          targetTab: 'orders'
        },
        {
          id: 'os_unified_status_stock_search',
          moduleCode: 'MOD-1.7',
          title: 'Busca de Produtos do Estoque na OS & Status Unificados',
          icon: Search,
          badge: 'Sincronia OS',
          objective: 'Garantir que todos os produtos cadastrados no Estoque apareçam na busca da OS e que os status sejam idênticos em toda a interface.',
          summary: 'Pesquisa instantânea por nome, código, marca ou barras + seleção direta na OS; status idênticos entre tabela, cards do Painel e Portal.',
          howToUse: [
            'Ao criar ou editar uma OS, use o campo de busca inteligente para pesquisar qualquer produto ou serviço do Estoque.',
            'Selecione o item desejado na lista suspensa ou no seletor para adicioná-lo com preço e baixa automática ao concluir.',
            'Os status oficiais ("Orçamento Aberto", "Aguardando Aprovação", "Aprovada / Em Andamento", "Aguardando Peças", "Concluída (Aguardando Retirada)", "Entregue / Finalizada" e "Cancelada") aparecem com exatamente o mesmo rótulo e cor nos cards do Painel e na listagem de OS.'
          ],
          tips: 'Evita divergências de nomenclatura entre a equipe de campo, recepção e painel gerencial.',
          targetTab: 'orders'
        }
      ]
    },
    {
      id: 'vendas_estoque',
      title: 'Vendas, PDV, Recibos & Módulo Estoque',
      icon: Package,
      description: 'Gestão do módulo Estoque com comboboxes, vendas diretas com múltiplas bandeiras, frente de caixa PDV, recibos A4/80mm e XML NF-e.',
      modules: [
        {
          id: 'product_barcode',
          moduleCode: 'MOD-2.1',
          title: 'Código de Barras EAN-13 com Gerador Automático',
          icon: Barcode,
          badge: 'Estoque Inteligente',
          objective: 'Gerar códigos de barras válidos no padrão oficial EAN-13 para etiquetas e leitura rápida em leitores ópticos.',
          summary: 'Cálculo instantâneo do dígito verificador e compatibilidade total com leitores USB e Bluetooth.',
          howToUse: [
            'Acesse "Produtos & Estoque" e clique em "+ Novo Produto" ou edite um produto existente.',
            'Ao lado do campo "Código de Barras", clique no botão "Gerar Código".',
            'O sistema gera automaticamente um código EAN-13 válido com dígito verificador.',
            'Você também pode bipar ou digitar manualmente códigos de barras já existentes nas embalagens dos fabricantes.'
          ],
          tips: 'O código de barras gerado pode ser pesquisado instantaneamente na busca de vendas, OS e PDV. Todos os filtros do módulo Estoque (Categoria, Marca, Subcategoria, Situação e Kardex) usam comboboxes limpas.',
          targetTab: 'products'
        },
        {
          id: 'product_duplicate',
          moduleCode: 'MOD-2.2',
          title: 'Botão "Duplicar" no Estoque de Produtos',
          icon: Copy,
          badge: 'Agilidade de Cadastro',
          objective: 'Criar novos produtos rapidamente aproveitando todas as configurações de um item existente.',
          summary: 'Copia fornecedor, categoria, margem de lucro, NCM e impostos, bastando ajustar a variação (voltagem, potência ou tamanho).',
          howToUse: [
            'Na tabela do módulo "Estoque", localize o produto que deseja usar como modelo.',
            'Clique no botão "Duplicar" na coluna de Ações.',
            'O modal abrirá preenchido com o nome acrescido de "(Cópia)".',
            'Ajuste o modelo, voltagem ou preço e salve.'
          ],
          tips: 'Ideal para cadastrar linhas completas de motobombas (1/4cv, 1/3cv, 1/2cv, 1cv) em poucos minutos.',
          targetTab: 'products'
        },
        {
          id: 'product_photos',
          moduleCode: 'MOD-2.3',
          title: 'Galeria de Fotos do Produto (Até 3 Fotos)',
          icon: Camera,
          badge: 'Catálogo Visual',
          objective: 'Armazenar até 3 fotos por produto para facilitar a identificação visual por técnicos e clientes.',
          summary: 'Permite carregar fotos das conexões, vista explodida do motor e placa técnica com número de série.',
          howToUse: [
            'No cadastro do produto no Estoque, vá na seção "Galeria de Fotos".',
            'Carregue até 3 fotos da peça ou equipamento.',
            'As fotos ficam visíveis na ficha do produto, no histórico e no catálogo do cliente.'
          ],
          tips: 'Fotos de alta resolução ajudam os técnicos a conferir a furação de flanges e voltagem correta antes de sair da oficina.',
          targetTab: 'products'
        },
        {
          id: 'product_history',
          moduleCode: 'MOD-2.4',
          title: 'Histórico Total 360° & Kardex do Estoque',
          icon: History,
          badge: 'Rastreabilidade',
          objective: 'Visualizar todas as entradas, saídas em OS, vendas diretas, estornos de cancelamentos e saldo residual.',
          summary: 'Auditoria completa por produto com filtro por tipo de movimentação em combobox, data, NF ou OS e margem obtida.',
          howToUse: [
            'Na lista do Estoque, clique no botão "Histórico Total" do produto ou acesse o Kardex.',
            'Filtre pelo tipo de movimentação (Entrada XML, Saída Venda/OS, Ajuste/Estorno) na combobox.',
            'Consulte o saldo remanescente em prateleira e o lucro bruto total gerado.'
          ],
          tips: 'Essencial para conferência de estoque físico e suporte em garantias de fábrica.',
          targetTab: 'products'
        },
        {
          id: 'direct_sales',
          moduleCode: 'MOD-2.5',
          title: 'Vendas Diretas: Busca, Limpeza, Múltiplas Bandeiras & Envio ao PDV',
          icon: Package,
          badge: 'Balcão Inteligente',
          objective: 'Montar vendas rapidamente buscando produtos e serviços, com formulário limpo, múltiplas bandeiras e envio direto para receber no PDV.',
          summary: 'Busca unificada (Estoque + Serviços + Item Avulso), exclusão de qualquer item (deixando valores zerados/limpos), cancelar antes ou depois, excluir por senha e enviar ao PDV.',
          howToUse: [
            'Clique em "+ Nova Venda": a tela abre totalmente limpa (lista vazia e campos numéricos sem zeros fixos).',
            'Use a "Busca Rápida de Produtos e Serviços" (por nome, código ou código de barras) ou a lista agrupada para adicionar itens do Estoque, serviços ou item avulso.',
            'Para remover qualquer produto ou serviço (mesmo sendo o único item), clique no ícone da lixeira na linha ou em "Limpar Lista".',
            'Adicione uma ou mais formas de pagamento escolhendo Operadora, Bandeira diferente e Parcelas por linha, ou clique em "Enviar e Finalizar no PDV" para o caixa receber.',
            'Antes de confirmar, clique em "Cancelar Venda" para descartar o rascunho; após criada, qualquer usuário pode "Cancelar" (estorna estoque) ou o Admin/permitido pode "Excluir" mediante senha.'
          ],
          tips: 'Ao enviar para o PDV, o sistema abre o Frente de Caixa já posicionado para cobrar o cliente.',
          targetTab: 'sales'
        },
        {
          id: 'xml_nfe_import',
          moduleCode: 'MOD-2.6',
          title: 'Importação de NF-e via Arquivo XML (Anti-Duplicidade)',
          icon: Download,
          badge: 'Automação Fiscal',
          objective: 'Abastecer o Estoque e cadastrar novos produtos automaticamente através do XML da nota fiscal com proteção anti-duplicidade.',
          summary: 'Leitura automática de código, NCM, quantidade e custo unitário, bloqueando XML já importado e gerando compra no Contas a Pagar.',
          howToUse: [
            'Na tela de Estoque ou Central de Cadastros, clique em "Importar XML de NF-e".',
            'Selecione o arquivo .xml emitido pelo seu fornecedor.',
            'Confira a listagem dos itens importados (o sistema alerta caso a chave NF-e já tenha sido lançada) e confirme.',
            'Os itens são somados ao Estoque e o custo de reposição entra automaticamente no Contas a Pagar do mês.'
          ],
          tips: 'Evita digitação manual, elimina entradas duplicadas de nota e mantém o financeiro sincronizado.',
          targetTab: 'products'
        },
        {
          id: 'pdv_multipay_security',
          moduleCode: 'MOD-2.7',
          title: 'PDV / Frente de Caixa: Múltiplas Bandeiras, Cancelar & Excluir por Senha',
          icon: Store,
          badge: 'Frente de Caixa',
          objective: 'Receber OS e Vendas dividindo em quantas formas de pagamento e bandeiras diferentes o cliente precisar, com controle de cancelamento e exclusão.',
          summary: 'Suporta Pix + Dinheiro + Crédito Visa + Débito Elo na mesma venda, cancelamento aberto a operadores do PDV e exclusão definitiva protegida por senha.',
          howToUse: [
            'Acesse "PDV / Frente de Caixa", abra o caixa (informando o fundo de troco) e selecione a OS, Venda ou adicione itens avulsos.',
            'Em "Pagamentos", adicione quantas linhas desejar (+ Adicionar Forma): escolha Dinheiro, Pix ou Cartão com bandeira e parcelas independentes em cada linha.',
            'Confira o saldo pago vs restante e finalize o recebimento.',
            'Para estornar mantendo o histórico contábil e devolvendo os produtos ao Estoque, qualquer operador do PDV pode clicar em "Cancelar Venda".',
            'Para remover o registro definitivamente ("Excluir Venda"), é obrigatória a senha mestra do PDV cadastrada em Configurações (ou usuário Admin / colaborador autorizado).'
          ],
          tips: 'Vendas canceladas não contam no faturamento do Painel, DRE, BI nem no Fechamento Contábil.',
          targetTab: 'pdv'
        },
        {
          id: 'auto_receipts_a4_80mm',
          moduleCode: 'MOD-2.8',
          title: 'Recibos Automáticos de Pagamento (A4, Térmico 80mm & PDF)',
          icon: Receipt,
          badge: 'Comprovantes',
          objective: 'Emitir instantaneamente o recibo oficial após qualquer recebimento de OS ou Venda no PDV ou Financeiro.',
          summary: 'Alterna entre folha A4 completa e bobina térmica 80mm, indicando selo "QUITADO" ou "PAGAMENTO PARCIAL (Restante a Pagar)" e detalhando cada bandeira.',
          howToUse: [
            'Assim que um recebimento parcial ou total é concluído no PDV ou no Contas a Receber, o modal do Recibo abre automaticamente.',
            'Escolha o layout desejado no topo: "Folha A4" ou "Cupom Térmico 80mm".',
            'Verifique o número sequencial do recibo (ex: REC-2026-0001), cliente, cada forma/bandeira paga e o saldo restante se parcial.',
            'Clique em "Imprimir / Salvar PDF" ou reabra qualquer recibo emitido pelo histórico da venda ou financeiro.'
          ],
          tips: 'Pagamentos parciais mantêm a fatura em aberto apenas pelo saldo restante até a quitação final.',
          targetTab: 'pdv'
        }
      ]
    },
    {
      id: 'financeiro',
      title: 'Financeiro, Custos Integrados, BI & Contábil',
      icon: DollarSign,
      description: 'Gestão de contas, operadoras de cartão com taxas detalhadas, baixa automática PagBank e fechamento contábil.',
      modules: [
        {
          id: 'card_operators_pagbank',
          moduleCode: 'MOD-3.1',
          title: 'Operadoras de Cartão & Baixa Automática PagBank',
          icon: CreditCard,
          badge: 'Automação Bancária',
          objective: 'Configurar adquirentes com suas taxas e ativar a baixa automática de pagamentos via PagBank.',
          summary: 'Conciliação em tempo real com controle de NSU, valor bruto, taxa deduzida e valor líquido creditado na conta.',
          howToUse: [
            'Acesse "Operadoras & PagBank" no menu lateral.',
            'Edite as taxas contratadas para Débito, Crédito à Vista e Parcelado (2x a 12x).',
            'No card do PagBank, ative a chave "Baixa Automática".',
            'Quando o cliente pagar uma OS pelo link ou maquininha, a baixa ocorre instantaneamente.'
          ],
          tips: 'O botão "Sincronizar Pedidos Pendentes" varre os pagamentos pendentes e atualiza o caixa em 1 segundo.',
          targetTab: 'cardOperators'
        },
        {
          id: 'installments_rates',
          moduleCode: 'MOD-3.2',
          title: 'Edição de Parcelas com Taxas para Repassar ou Assumir',
          icon: Sliders,
          badge: 'Flexibilidade',
          objective: 'Definir para cada bandeira e parcela (de 1x até 12x) a taxa exata e escolher se a empresa assume ou repassa o juro.',
          summary: 'Cálculo transparente do valor da parcela cobrada do cliente versus o valor líquido que entra na empresa.',
          howToUse: [
            'Na tela de Operadoras, clique em "Configurar Taxas das Parcelas".',
            'Informe a taxa percentual de cada parcela (1x, 2x, 3x ... 12x).',
            'Selecione a política: "Repassar juros ao cliente" ou "Assumir taxas da maquininha".',
            'Nas telas de OS e Vendas, o cálculo se ajusta automaticamente.'
          ],
          tips: 'Evita surpresas no final do mês com taxas ocultas de antecipação de cartão.',
          targetTab: 'cardOperators'
        },
        {
          id: 'financial_pay_receive',
          moduleCode: 'MOD-3.3',
          title: 'Contas a Pagar & Contas a Receber',
          icon: DollarSign,
          badge: 'Fluxo de Caixa',
          objective: 'Controlar vencimentos de fornecedores, impostos, aluguel e faturas pendentes de clientes.',
          summary: 'Visão unificada das contas do mês com alerta de pendências e botão de quitação imediata.',
          howToUse: [
            'Acesse "Contas a Pagar / Receber" no menu Financeiro.',
            'Filtre pelo mês ou status (Pendentes, Pagas, Vencidas).',
            'Clique em "Pagar" ou "Dar Baixa" para registrar a liquidação com data e comprovante.'
          ],
          tips: 'Todas as saídas de NF-e importadas entram automaticamente no contas a pagar.',
          targetTab: 'financial'
        },
        {
          id: 'fleet_costs',
          moduleCode: 'MOD-3.4',
          title: 'Custos de Frota, Combustível & KM Rodado',
          icon: Truck,
          badge: 'Custos de Campo',
          objective: 'Ratear custos de veículos (gasolina, troca de óleo, pneus e seguro) por atendimento.',
          summary: 'Registra a quilometragem das ordens de serviço e calcula o custo real de cada visita técnica.',
          howToUse: [
            'Acesse "Frota & Custos" no menu lateral.',
            'Cadastre os veículos com placa, modelo e quilometragem atual.',
            'Lance os gastos de abastecimento e manutenção.',
            'Ao abrir uma OS, informe os km percorridos para vincular o custo da rota ao cliente.'
          ],
          tips: 'O sistema avisa automaticamente quando um veículo estiver próximo da quilometragem de troca de óleo.',
          targetTab: 'fleet'
        },
        {
          id: 'accounting_closing',
          moduleCode: 'MOD-3.5',
          title: 'Fechamento Contábil Mensal para o Contador',
          icon: FileSpreadsheet,
          badge: 'Fiscal & DRE',
          objective: 'Gerar o relatório consolidado de receitas e despesas tributáveis para apuração contábil.',
          summary: 'Documento limpo para envio à assessoria contábil para emissão de guias do Simples Nacional ou Lucro Presumido.',
          howToUse: [
            'Acesse a aba "Fechamento Contábil".',
            'Selecione o mês desejado.',
            'Revise o faturamento bruto, deduções de taxas bancárias e despesas comprovadas.',
            'Clique em "Exportar Relatório do Contador" para salvar em PDF ou planilha.'
          ],
          tips: 'Economiza horas no final do mês eliminando a troca de notas em papel.',
          targetTab: 'accounting'
        },
        {
          id: 'employee_profitability',
          moduleCode: 'MOD-3.6',
          title: 'Rentabilidade & Performance por Colaborador',
          icon: TrendingUp,
          badge: 'Produtividade',
          objective: 'Avaliar o retorno financeiro real gerado por cada técnico após abater salários e custos operacionais.',
          summary: 'DRE individual por técnico com receita gerada, custo de peças aplicadas, encargos e margem líquida.',
          howToUse: [
            'Acesse "Rentabilidade p/ Técnico".',
            'Analise a tabela comparativa de desempenho da equipe técnica.',
            'Verifique a taxa de conversão de orçamentos e tempo médio de atendimento.'
          ],
          tips: 'Excelente balizador para planos de comissão e premiações por produtividade com base no modelo de remuneração de cada técnico.',
          targetTab: 'profitability'
        },
        {
          id: 'integrated_costs_payroll',
          moduleCode: 'MOD-3.7',
          title: 'Integração de Custos, Folha & Remuneração por Combobox',
          icon: DollarSign,
          badge: 'Sincronia DRE',
          objective: 'Refletir automaticamente salários, horas trabalhadas, comissões, compras de materiais e contas recorrentes no Contas a Pagar e DRE.',
          summary: 'Combobox de Forma de Remuneração (Salário Fixo, Hora Trabalhada, Comissão, Salário + Comissão, Hora + Comissão) + prevenção de duplicidade.',
          howToUse: [
            'No cadastro do colaborador (Equipe ou Central de Cadastros), escolha a "Forma de Remuneração" na combobox.',
            'Se escolher Hora Trabalhada, preencha Valor/Hora e Horas/Mês para cálculo automático da prévia mensal.',
            'Folha salarial, comissões sobre OS concluídas/vendas pagas, compras manuais ou XML e recorrentes (aluguel, telefone, energia) são sincronizados no Contas a Pagar.',
            'A DRE e o Break-Even eliminam qualquer risco de dupla contagem e permitem quitar a folha com controle de pagamento.'
          ],
          tips: 'Use as comboboxes de filtro na equipe e no financeiro para auditar cada centro de custo em segundos.',
          targetTab: 'financial'
        },
        {
          id: 'bi_analytics_combobox',
          moduleCode: 'MOD-3.8',
          title: 'Gráficos & Indicadores Gerenciais (BI) com Filtros em Combobox',
          icon: BarChart3,
          badge: 'Inteligência BI',
          objective: 'Analisar faturamento, lucro líquido, ticket médio e fluxo de caixa por meio de gráficos interativos e filtros combinados.',
          summary: 'Comboboxes de Período (Hoje a Anual/Personalizado), Status de Pagamento, Visão Rápida e Modelo de Gráfico (Barras, Linha, Área, Pizza).',
          howToUse: [
            'Acesse "Gráficos & Indicadores (BI)" no menu lateral.',
            'Selecione na combobox o período desejado (Hoje, Semana, Quinzena, Mês, Trimestre, Semestre, Anual ou Personalizado).',
            'Combine com as comboboxes de Status de Pagamento, Visão Rápida e tipo de gráfico.',
            'Vendas canceladas são excluídas automaticamente dos indicadores para manter a fidelidade financeira.'
          ],
          tips: 'Ideal para reuniões gerenciais rápidas e comparação de margem por mês.',
          targetTab: 'charts'
        }
      ]
    },
    {
      id: 'configuracoes',
      title: 'Configurações, Garantias & Cadastros Mestres',
      icon: Settings,
      description: 'Numeração inicial de OS/vendas, políticas de garantia atreladas a serviços, backup e cadastros.',
      modules: [
        {
          id: 'sequence_settings',
          moduleCode: 'MOD-4.1',
          title: 'Configuração das Numerações Iniciais (OS, Vendas e Orçamentos)',
          icon: ListOrdered,
          badge: 'Sequências Personalizadas',
          objective: 'Definir a partir de qual número o sistema iniciará a contagem oficial das OSs, orçamentos e vendas.',
          summary: 'Permite configurar prefixos (ex: OS-, VD-, ORC-), número inicial e quantidade de dígitos.',
          howToUse: [
            'Vá em "Configurações" e clique na aba "Numerações & Séries".',
            'Informe o número exato desejado (ex: continuar a partir de 20261050).',
            'Veja a prévia em tempo real de como o código será gerado.',
            'Clique em "Salvar Numerações": todas as novas ordens seguirão a nova regra.'
          ],
          tips: 'Ideal para manter a sequência histórica de blocos de papel ou sistemas antigos.',
          targetTab: 'configuracoes'
        },
        {
          id: 'warranty_policies',
          moduleCode: 'MOD-4.2',
          title: 'Políticas de Garantia Atreladas aos Serviços',
          icon: ShieldCheck,
          badge: 'Garantias Oficiais',
          objective: 'Criar termos de garantia específicos e vinculá-los aos serviços do catálogo.',
          summary: 'Prazos legais (90 dias) e de fábrica (365 a 1095 dias) com termos contratuais e NBR 15569.',
          howToUse: [
            'Em "Configurações", acesse a aba "Garantias & Serviços Atrelados".',
            'Clique em "+ Nova Política de Garantia".',
            'Defina o título, prazo em dias e o texto legal dos termos.',
            'Marque quais serviços do catálogo utilizam essa garantia.',
            'Ao adicionar o serviço na OS, o prazo e o vencimento são calculados automaticamente!'
          ],
          tips: 'Os termos da garantia saem impressos diretamente no rodapé da folha da OS do cliente.',
          targetTab: 'configuracoes'
        },
        {
          id: 'master_registrations',
          moduleCode: 'MOD-4.3',
          title: 'Central de Cadastros: Comboboxes, Listagem/Grade & Tooltips',
          icon: Building,
          badge: 'Cadastros Unificados',
          objective: 'Gerenciar clientes, fornecedores, estoque, equipe, frota, serviços e checklists com navegação e filtros via combobox e visão em lista ou cards.',
          summary: 'Alternância entre abas e filtros específicos por combobox, exibição em Listagem (tabela) ou Grade (cards) e tooltips detalhados ao passar o mouse.',
          howToUse: [
            'Acesse "Central de Cadastros" no menu lateral.',
            'Use a combobox de seção ou os botões para alternar entre Clientes, Fornecedores, Estoque, Equipe, Frota, Serviços e Checklists.',
            'Utilize os filtros em combobox de cada seção (perfil, cidade/UF, categoria/situação de estoque, remuneração da equipe, status da frota).',
            'Alterne o botão de visualização entre Listagem e Grade (Cards) e passe o mouse nos itens para ver dados completos em tooltip.'
          ],
          tips: 'Clientes aceitam múltiplos endereços com títulos de referência (ex: Casa de Campo, Sede, Filial).',
          targetTab: 'cadastros'
        },
        {
          id: 'backup_restore',
          moduleCode: 'MOD-4.4',
          title: 'Backup Completo em JSON & Restauração 1-Clique',
          icon: Download,
          badge: 'Segurança Total',
          objective: 'Exportar uma cópia integral de todos os dados do sistema para segurança e migração.',
          summary: 'Salva clientes, produtos, histórico, ordens de serviço, finanças e configurações em um único arquivo.',
          howToUse: [
            'Em "Configurações", clique na aba "Backup & Banco de Dados".',
            'Clique em "Exportar Backup Agora" para salvar o arquivo no seu computador.',
            'Para restaurar os dados em outra máquina ou após formatação, basta arrastar o arquivo JSON em "Restaurar Backup".'
          ],
          tips: 'Recomendamos salvar um backup semanalmente para garantir total tranquilidade na operação.',
          targetTab: 'configuracoes'
        },
        {
          id: 'themes_system',
          moduleCode: 'MOD-4.5',
          title: 'Temas & Identidade Visual (Paletas Personalizadas)',
          icon: Palette,
          badge: 'Personalização Visual',
          objective: 'Alternar entre as identidades visuais do sistema: Clássico, Terra & Oliva, Claro Ouro, Terracota Mineral e Solar Alegre.',
          summary: 'Permite selecionar a paleta visual ideal com 1 clique diretamente nas configurações do sistema.',
          howToUse: [
            'Acesse "Configurações" no menu lateral e clique na aba "Temas & Identidade Visual".',
            'Escolha entre o Clássico, as paletas minerais terrosas (#615F6D/#A67153/#594A3C/#26241E/#F2E6D8) ou o tema Solar Cobalto vívido e alegre.',
            'O sistema atualiza instantaneamente todo o layout sem necessidade de recarregar.'
          ],
          tips: 'Sua escolha de tema fica salva automaticamente no navegador para os próximos acessos.',
          targetTab: 'configuracoes'
        },
        {
          id: 'google_drive_integration',
          moduleCode: 'MOD-4.6',
          title: 'Google Drive & Backup em Nuvem',
          icon: HardDrive,
          badge: 'Google Workspace',
          objective: 'Conectar com sua conta Google Drive para armazenar comprovantes, exportar relatórios fiscais e manter backups do ERP na nuvem.',
          summary: 'Navegação por pastas, upload de arquivos, exportação direta de relatórios contábeis e backup do sistema.',
          howToUse: [
            'Acesse a tela "Google Drive" no menu lateral.',
            'Clique no botão "Conectar com Google Drive" e autorize com sua conta Google.',
            'Crie pastas corporativas para organizar Ordens de Serviço e Relatórios Fiscais.',
            'Use os botões de ação rápida para exportar cópias de segurança em JSON diretamente para seu Drive.'
          ],
          tips: 'Qualquer exclusão de arquivo exige confirmação explícita na tela por segurança.',
          targetTab: 'googleDrive'
        }
      ]
    },
    {
      id: 'portal',
      title: 'Portal do Cliente & Pós-Venda',
      icon: UserCheck,
      description: 'Autoatendimento, consulta de garantias por S/N, histórico de compras, troca de senha e abertura de chamados.',
      modules: [
        {
          id: 'client_profile_pwd',
          moduleCode: 'MOD-5.1',
          title: 'Perfil do Cliente & Alteração de Usuário e Senha pelo Próprio Cliente',
          icon: KeyRound,
          badge: 'Segurança do Cliente',
          objective: 'Permitir que o cliente consulte seus dados cadastrais e altere suas próprias credenciais de acesso ao portal.',
          summary: 'Campos de Usuário, Nova Senha e Confirmação de Senha com persistência e feedback instantâneo.',
          howToUse: [
            'O cliente acessa a aba "Portal do Cliente" e clica em "Perfil & Segurança".',
            'Ele pode revisar e atualizar seu nome, e-mail, telefones e endereços.',
            'No card de Credenciais, define o Usuário desejado e a Nova Senha (mínimo 4 dígitos).',
            'Clica em "Salvar Alterações de Perfil e Senha" para ativar suas novas credenciais.'
          ],
          tips: 'Com essas credenciais, o cliente pode entrar no sistema pela tela de login a qualquer momento.',
          targetTab: 'customerPortal'
        },
        {
          id: 'warranties_by_serial',
          moduleCode: 'MOD-5.2',
          title: 'Garantias Desmembradas por Número de Série (S/N)',
          icon: ShieldCheck,
          badge: 'Rastreio de Séries',
          objective: 'Painel dedicado exclusivamente aos equipamentos vendidos com número de série (bombas, aquecedores, tanques).',
          summary: 'Status visual de "Garantia Ativa" (com contagem de dias restantes) ou "Garantia Expirada em dd/mm/aaaa".',
          howToUse: [
            'Acesse o Portal do Cliente e clique na aba "Garantias & S/N".',
            'Consulte os equipamentos vinculados às suas Ordens de Serviço.',
            'Equipamentos com prazo vigente exibem selo verde e contagem regressiva de dias.',
            'Equipamentos vencidos exibem selo vermelho de garantia expirada.',
            'Clique no botão "Acionar Garantia deste Equipamento" para abrir o chamado imediatamente com o S/N já preenchido.'
          ],
          tips: 'Possui botão para copiar o número de série com 1 clique para agilizar contatos com a fábrica.',
          targetTab: 'customerPortal'
        },
        {
          id: 'customer_purchases_tab',
          moduleCode: 'MOD-5.3',
          title: 'Histórico Completo de Compras & Comprovantes',
          icon: ShoppingBag,
          badge: 'Histórico de Compras',
          objective: 'Permitir que o cliente visualize todas as aquisições já realizadas em seu cadastro.',
          summary: 'Consolida vendas de balcão e peças instaladas em ordens de serviço, com quantidades, valores e comprovantes para impressão.',
          howToUse: [
            'No Portal do Cliente, clique na aba "Histórico de Compras".',
            'Veja o total investido e a relação cronológica de todas as aquisições.',
            'Consulte os itens comprados, quantidades, valores unitários e formas de pagamento.',
            'Clique em "Ver Comprovante de Aquisição" para visualizar e imprimir o recibo oficial.'
          ],
          tips: 'Mantém um registro histórico seguro e transparente de todas as peças adquiridas pelo cliente.',
          targetTab: 'customerPortal'
        },
        {
          id: 'customer_tickets_claims',
          moduleCode: 'MOD-5.4',
          title: 'Abertura de Chamados Técnicos & Acionamento Facilitado',
          icon: HelpCircle,
          badge: 'Suporte Online',
          objective: 'Abrir chamados técnicos buscando e anexando o equipamento pelo campo do número de série.',
          summary: 'O formulário lista os números de série das OS do cliente e alerta caso o prazo de garantia já tenha expirado.',
          howToUse: [
            'Clique no botão "+ Abrir Chamado / Acionar Garantia" no topo do Portal.',
            'Selecione o número de série (S/N) do equipamento cadastrado.',
            'O sistema preenche automaticamente o equipamento, modelo e data da OS de origem.',
            'Se a garantia estiver vencida, o sistema avisa que o atendimento será realizado como vistoria avulsa.',
            'Relate o defeito observado e confirme o envio da solicitação.'
          ],
          tips: 'A solicitação entra imediatamente na fila de chamados da oficina técnica.',
          targetTab: 'customerPortal'
        }
      ]
    },
    {
      id: 'temas_seguranca',
      title: 'Acessos, Login & Identidade Visual',
      icon: Palette,
      description: 'Autenticação de usuários, 3 temas visuais com cores vibrantes, menu lateral retrátil e auditoria.',
      modules: [
        {
          id: 'login_auth',
          moduleCode: 'MOD-6.1',
          title: 'Tela de Login com Usuário, Senha & Perfis',
          icon: Lock,
          badge: 'Autenticação Segura',
          objective: 'Proteger o sistema com tela de autenticação por usuário e senha, adaptando os menus por perfil.',
          summary: 'Suporte a Administrador, Técnico em Campo, Vendedor, Contador e Cliente.',
          howToUse: [
            'Na tela de login, informe seu usuário (ou e-mail) e sua senha cadastrada.',
            'Você pode utilizar o seletor visual de temas já na tela de login para escolher as cores de sua preferência.',
            'Para demonstração rápida, utilize os botões de atalho dos usuários demo disponíveis.',
            'Para sair com segurança, clique no botão "Sair" no cabeçalho ou rodapé do menu lateral.'
          ],
          tips: 'A sessão permanece salva com segurança no navegador do dispositivo.',
          targetTab: 'dashboard'
        },
        {
          id: 'visual_themes_palettes',
          moduleCode: 'MOD-6.2',
          title: '3 Temas Visuais com Paletas Vibrantes e Suaves',
          icon: Palette,
          badge: 'Identidade Visual',
          objective: 'Alternar instantaneamente as cores do sistema entre 3 temas desenhados com alto contraste e elegância.',
          summary: 'Tema MP Piscina Clássico, Tema Terra & Oliva Vibrante (Paleta 1) e Tema Claro & Suave com Ouro Vibrante (Paleta 2).',
          howToUse: [
            'Acesse "Configurações" no menu lateral e clique na aba "Temas & Identidade Visual".',
            'Escolha entre os temas disponíveis com amostra das cores oficiais.',
            'A aplicação atualiza as cores de menus, botões, tabelas e cabeçalhos imediatamente.'
          ],
          tips: 'O tema Claro & Suave com Ouro Vibrante oferece leitura agradável para atendimentos diurnos. O seletor foi movido para Configurações para deixar o cabeçalho superior mais limpo.',
          targetTab: 'configuracoes'
        },
        {
          id: 'sidebar_collapse',
          moduleCode: 'MOD-6.3',
          title: 'Menu Lateral Retrátil (Ação Encolher / Expandir)',
          icon: Menu,
          badge: 'Espaço de Trabalho',
          objective: 'Recolher o menu lateral para ganhar mais espaço visual em tabelas largas e relatórios.',
          summary: 'Clique na seta ou no botão de recolher: os itens viram ícones compactos com dicas ao passar o mouse.',
          howToUse: [
            'Clique no botão com ícone de seta dupla no topo do menu lateral.',
            'O menu encolhe para o modo compacto, ampliando a área das tabelas.',
            'Para expandir novamente com os textos das categorias, basta clicar novamente na seta.'
          ],
          tips: 'O estado do menu (aberto ou fechado) é lembrado mesmo se você recarregar a página.',
          targetTab: 'dashboard'
        },
        {
          id: 'audit_logs',
          moduleCode: 'MOD-6.4',
          title: 'Logs de Auditoria & Rastreabilidade (em Configurações)',
          icon: Shield,
          badge: 'Auditoria',
          objective: 'Rastrear todas as ações realizadas no sistema (quem alterou, cancelou ou excluiu, data e horário) dentro de Configurações.',
          summary: 'Histórico imutável de cadastros, OSs, cancelamentos e exclusões de vendas no PDV com o nome do autorizador.',
          howToUse: [
            'Acesse "Configurações" no menu lateral e clique na aba "Logs & Auditoria".',
            'Consulte a listagem de eventos com data, hora, usuário responsável e descrição da ação.',
            'Filtre por perfil ou palavra-chave para investigações e conferência.'
          ],
          tips: 'O botão de auditoria também foi movido do topo para Configurações, garantindo interface limpa e centralizada.',
          targetTab: 'configuracoes'
        },
        {
          id: 'pdv_delete_security_rules',
          moduleCode: 'MOD-6.5',
          title: 'Senha Mestra de Exclusão no PDV/Vendas & Permissão por Usuário',
          icon: Ban,
          badge: 'Segurança de Caixa',
          objective: 'Diferenciar "Cancelar Venda" (aberto ao operador, estorna estoque) de "Excluir Venda" (apagamento definitivo protegido por senha).',
          summary: 'Apenas a senha definida pelo Administrador em Configurações ou usuários autorizados explicitamente ("Pode Excluir Vendas") removem uma venda.',
          howToUse: [
            'Em "Configurações > Empresa & Séries", cadastre a "Senha de Exclusão de Vendas (PDV/Vendas)".',
            'No cadastro do colaborador ("Equipe & Usuários"), marque a permissão "Permitido excluir vendas no PDV/Vendas" apenas para gerentes de confiança.',
            'Ao clicar em "Excluir" em Vendas ou no PDV, o sistema exige a senha autorizada e registra o autor nos Logs de Auditoria.',
            'Já o botão "Cancelar" pode ser usado por qualquer operador autorizado para estornar itens ao Estoque preservando o registro.'
          ],
          tips: 'Protege o caixa contra fraudes mantendo agilidade operacional para erros simples de digitação.',
          targetTab: 'configuracoes'
        }
      ]
    }
  ];

  // Filtro de módulos por pesquisa e categoria
  const activeCategoryObj = manualCategories.find(c => c.id === selectedCategory) || manualCategories[0];

  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    const results: Array<{ category: ManualCategory; module: ManualModule }> = [];
    manualCategories.forEach(cat => {
      cat.modules.forEach(mod => {
        const match = 
          mod.title.toLowerCase().includes(q) ||
          mod.summary.toLowerCase().includes(q) ||
          mod.objective.toLowerCase().includes(q) ||
          mod.howToUse.some(s => s.toLowerCase().includes(q)) ||
          (mod.tips && mod.tips.toLowerCase().includes(q)) ||
          cat.title.toLowerCase().includes(q);

        if (match) {
          results.push({ category: cat, module: mod });
        }
      });
    });
    return results;
  }, [searchQuery]);

  const handleGoToFeature = (tab?: ActiveTab) => {
    if (tab && onNavigate) {
      onNavigate(tab);
      onClose();
    }
  };

  const handlePrintManual = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col border border-[#d8d8d8] overflow-hidden">
        
        {/* Top Header of Modal */}
        <div className="px-5 py-4 border-b border-[#d8d8d8] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#53383e] text-white flex items-center justify-center shadow-sm shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#363739] tracking-tight">
                  Manual de Uso do Sistema FIRE GESTÃO
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#f6eff1] text-[#53383e] border border-[#d8d8d8]">
                  Por Categoria & Módulo
                </span>
              </div>
              <p className="text-xs text-[#707174] mt-0.5">
                Guia operacional completo com passo a passo ilustrado, regras de negócio e boas práticas para cada função.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Seletor de Modo: Manual por Módulos vs Cards Rápidos */}
            <div className="inline-flex rounded-xl p-1 bg-[#f4f5f6] border border-[#d8d8d8] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('manual')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'manual' 
                    ? 'bg-[#53383e] text-white shadow-xs font-bold' 
                    : 'text-[#707174] hover:text-[#363739]'
                }`}
              >
                Manual Completo
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'cards' 
                    ? 'bg-[#53383e] text-white shadow-xs font-bold' 
                    : 'text-[#707174] hover:text-[#363739]'
                }`}
              >
                Cards Rápidos
              </button>
            </div>

            <button
              onClick={handlePrintManual}
              className="p-2 text-[#707174] hover:text-blue-700 hover:bg-blue-50 border border-[#d8d8d8] rounded-xl transition-colors cursor-pointer"
              title="Imprimir / Salvar Manual em PDF"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-[#707174] hover:text-[#363739] hover:bg-[#f4f5f6] rounded-xl transition-colors cursor-pointer"
              title="Fechar manual"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Pesquisa Rápida */}
        <div className="px-5 py-3 bg-[#fafafa] border-b border-[#d8d8d8] flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <LiveSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Pesquisar por assunto ou módulo (ex: folha A4, garantia por número de série, pagbank, trocar senha, técnico, código de barras)..."
              emptyLabel="Nenhum módulo"
              inputClassName="w-full pl-9 pr-9 py-2 bg-white border border-[#d8d8d8] rounded-xl text-xs sm:text-sm font-medium text-[#363739] focus:outline-hidden focus:ring-2 focus:ring-[#53383e] shadow-xs"
              getOptions={(query) => {
                const q = query.toLowerCase();
                const items: LiveSearchOption<{ categoryId: string; module: ManualModule }>[] = [];
                manualCategories.forEach(cat => {
                  cat.modules.forEach(mod => {
                    const match =
                      mod.title.toLowerCase().includes(q) ||
                      mod.summary.toLowerCase().includes(q) ||
                      mod.objective.toLowerCase().includes(q) ||
                      mod.howToUse.some(s => s.toLowerCase().includes(q)) ||
                      (mod.tips && mod.tips.toLowerCase().includes(q)) ||
                      cat.title.toLowerCase().includes(q);
                    if (match) {
                      items.push({
                        id: `${cat.id}-${mod.id}`,
                        title: mod.title,
                        subtitle: `${cat.title} · ${mod.summary}`,
                        badgeText: mod.badge,
                        data: { categoryId: cat.id, module: mod }
                      });
                    }
                  });
                });
                return items;
              }}
              onSelect={(opt) => {
                setSelectedCategory(opt.data.categoryId);
                setExpandedModuleId(opt.data.module.id);
                setViewMode('manual');
                setSearchQuery('');
              }}
            />
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#707174]">
            <Bookmark className="w-3.5 h-3.5 text-[#53383e]" />
            <span>
              {manualCategories.length} Categorias · {manualCategories.reduce((acc, c) => acc + c.modules.length, 0)} Módulos Mapeados
            </span>
          </div>
        </div>

        {/* RESULTADOS DA BUSCA (Se houver texto digitado) */}
        {searchQuery.trim() ? (
          <div className="flex-1 overflow-y-auto p-5 bg-[var(--color-canvas)] space-y-4">
            <div className="text-xs font-bold text-[#363739] flex items-center gap-2">
              <span>Resultados encontrados para "{searchQuery}":</span>
              <span className="px-2 py-0.5 rounded-full bg-[#f6eff1] text-[#53383e] font-mono">
                {searchResults.length} módulos
              </span>
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-[#d8d8d8] p-8">
                <HelpCircle className="w-10 h-10 text-[#707174] mx-auto mb-3" />
                <h3 className="text-sm font-bold text-[#363739]">Nenhum módulo encontrado</h3>
                <p className="text-xs text-[#707174] mt-1">
                  Tente buscar com palavras-chave como: "ordem", "garantia", "diária", "estoque", "pagbank", "senha" ou "xml".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map(({ category, module }) => {
                  const Icon = module.icon;
                  return (
                    <div key={module.id} className="bg-white rounded-2xl border border-[#d8d8d8] p-5 shadow-xs space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#f6eff1] text-[#53383e] flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              {category.title} · {module.moduleCode}
                            </span>
                            <h3 className="text-sm font-extrabold text-[#363739]">
                              {module.title}
                            </h3>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-[#363739]">
                          {module.badge}
                        </span>
                      </div>

                      <p className="text-xs text-[#5a5b5e] leading-relaxed">
                        {module.summary}
                      </p>

                      <div className="bg-[#fcfbf9] rounded-xl p-3 border border-[#ede9e3] space-y-1.5 text-xs">
                        <div className="font-bold text-[#363739] text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Passo a Passo:
                        </div>
                        {module.howToUse.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-slate-600">
                            <span className="font-mono font-bold text-[10px] text-slate-400 mt-0.5">{idx + 1}.</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>

                      {module.targetTab && onNavigate && (
                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={() => handleGoToFeature(module.targetTab)}
                            className="text-xs font-bold text-[#53383e] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Ir para este módulo agora</span>
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
        ) : viewMode === 'manual' ? (
          /* =========================================================================
              MODO 1: MANUAL COMPLETO (Por Categoria e Módulo com Sumário Lateral)
             ========================================================================= */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* Coluna Esquerda: Índice de Categorias */}
            <div className="w-full md:w-72 lg:w-80 bg-slate-50 border-r border-[#d8d8d8] flex flex-col shrink-0 overflow-y-auto p-3 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-2 tracking-wider">
                Categorias do Sistema
              </span>

              {manualCategories.map(cat => {
                const CatIcon = cat.icon;
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setExpandedModuleId(cat.modules[0]?.id || null);
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 border ${
                      isSelected
                        ? 'bg-white border-[#53383e] shadow-xs text-[#363739] ring-1 ring-[#53383e]/20'
                        : 'border-transparent text-[#707174] hover:bg-white hover:text-[#363739]'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isSelected ? 'bg-[#53383e] text-white' : 'bg-slate-200/70 text-slate-600'
                    }`}>
                      <CatIcon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-extrabold truncate ${isSelected ? 'text-[#363739]' : 'text-slate-700'}`}>
                          {cat.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/60 text-slate-600 shrink-0 font-bold">
                          {cat.modules.length}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Coluna Direita: Módulos Detalhados da Categoria Selecionada */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white space-y-5">
              {/* Cabeçalho da Categoria Ativa */}
              <div className="bg-gradient-to-r from-slate-900 to-[#363739] p-5 rounded-2xl text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                    <activeCategoryObj.icon className="w-4 h-4" />
                    <span>Categoria Selecionada</span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">
                    {activeCategoryObj.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    {activeCategoryObj.description}
                  </p>
                </div>

                <div className="text-right text-xs text-slate-300 font-mono">
                  <span>{activeCategoryObj.modules.length} módulos documentados</span>
                </div>
              </div>

              {/* Lista dos Módulos da Categoria */}
              <div className="space-y-4">
                {activeCategoryObj.modules.map(mod => {
                  const ModIcon = mod.icon;
                  const isExpanded = expandedModuleId === mod.id;

                  return (
                    <div 
                      key={mod.id} 
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isExpanded 
                          ? 'border-[#53383e] shadow-sm bg-white ring-1 ring-[#53383e]/10' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Header do Módulo Clicável */}
                      <button
                        type="button"
                        onClick={() => setExpandedModuleId(isExpanded ? null : mod.id)}
                        className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#f6eff1] text-[#53383e] flex items-center justify-center shrink-0">
                            <ModIcon className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {mod.moduleCode}
                              </span>
                              <h4 className="text-sm font-extrabold text-[#363739] truncate">
                                {mod.title}
                              </h4>
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {mod.summary}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 hidden sm:inline">
                            {mod.badge}
                          </span>
                          <div className="p-1 rounded-lg text-slate-400">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-[#53383e]" /> : <ChevronRight className="w-4 h-4" />}
                          </div>
                        </div>
                      </button>

                      {/* Corpo do Módulo Expandido */}
                      {isExpanded && (
                        <div className="p-5 pt-0 border-t border-slate-100 space-y-4 text-xs animate-in fade-in duration-150">
                          {/* Objetivo */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-4">
                            <span className="font-bold text-slate-900 block mb-0.5">Objetivo do Módulo:</span>
                            <p className="text-slate-600 leading-relaxed">{mod.objective}</p>
                          </div>

                          {/* Como Usar Passo a Passo */}
                          <div className="space-y-2">
                            <span className="font-extrabold text-[#363739] uppercase text-[11px] tracking-wide flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Passo a Passo Operacional:
                            </span>

                            <div className="space-y-2 bg-[#fcfbf9] p-4 rounded-xl border border-[#ede9e3]">
                              {mod.howToUse.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-2.5">
                                  <span className="w-5 h-5 rounded-full bg-white border border-[#d8d8d8] text-[11px] font-bold text-[#53383e] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <span className="text-slate-700 leading-relaxed">{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Dica de Especialista */}
                          {mod.tips && (
                            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <strong>Dica de Produtividade:</strong> {mod.tips}
                              </div>
                            </div>
                          )}

                          {/* Ação Rápida: Ir para o Módulo */}
                          {mod.targetTab && onNavigate && (
                            <div className="pt-2 flex justify-end">
                              <button
                                onClick={() => handleGoToFeature(mod.targetTab)}
                                className="px-4 py-2 bg-[#53383e] hover:bg-[#432c32] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <span>Acessar Módulo no Sistema</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
              MODO 2: VISÃO RÁPIDA EM CARDS
             ========================================================================= */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[var(--color-canvas)]">
            {/* Seletor de Categorias Horizontal */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
              {manualCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-[#53383e] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-[#d8d8d8] hover:text-[#363739]'
                  }`}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  <span>{cat.title} ({cat.modules.length})</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCategoryObj.modules.map(mod => {
                const Icon = mod.icon;
                return (
                  <div key={mod.id} className="bg-white rounded-2xl border border-[#d8d8d8] p-5 shadow-xs space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#f6eff1] text-[#53383e] flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-400 block">
                              {mod.moduleCode}
                            </span>
                            <h4 className="text-sm font-extrabold text-[#363739] leading-tight">
                              {mod.title}
                            </h4>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-[#363739]">
                          {mod.badge}
                        </span>
                      </div>

                      <p className="text-xs text-[#5a5b5e] leading-relaxed mb-3">
                        {mod.summary}
                      </p>

                      <div className="bg-[#fcfbf9] rounded-xl p-3 border border-[#ede9e3] space-y-1.5 text-xs">
                        <div className="font-bold text-[#363739] text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Como Usar:
                        </div>
                        {mod.howToUse.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-slate-600">
                            <span className="font-mono font-bold text-[10px] text-slate-400 mt-0.5">{idx + 1}.</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {mod.targetTab && onNavigate && (
                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => handleGoToFeature(mod.targetTab)}
                          className="text-xs font-bold text-[#53383e] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Acessar {mod.title}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rodapé Informativo */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-[#d8d8d8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Manual Oficial FIRE GESTÃO {SYSTEM_VERSION} · Atualizado e em conformidade operacional</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrintManual}
              className="text-xs font-semibold text-slate-700 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Gerar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white font-bold rounded-lg transition-colors cursor-pointer"
            >
              Fechar Guia
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
