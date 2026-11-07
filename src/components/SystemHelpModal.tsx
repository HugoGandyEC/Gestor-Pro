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
  HardDrive
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

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
        }
      ]
    },
    {
      id: 'vendas_estoque',
      title: 'Vendas, Produtos & Controle de Estoque',
      icon: Package,
      description: 'Gestão de catálogo, código de barras EAN-13, fotos, duplicador ágil, histórico 360° e PDV balcão.',
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
          tips: 'O código de barras gerado pode ser pesquisado instantaneamente na busca de vendas e PDV.',
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
            'Na tabela de Produtos & Estoque, localize o produto que deseja usar como modelo.',
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
            'No cadastro do produto, vá na seção "Galeria de Fotos".',
            'Carregue até 3 fotos da peça ou equipamento.',
            'As fotos ficam visíveis na ficha do produto, no histórico e no catálogo do cliente.'
          ],
          tips: 'Fotos de alta resolução ajudam os técnicos a conferir a furação de flanges e voltagem correta antes de sair da oficina.',
          targetTab: 'products'
        },
        {
          id: 'product_history',
          moduleCode: 'MOD-2.4',
          title: 'Histórico Total 360° do Produto',
          icon: History,
          badge: 'Rastreabilidade',
          objective: 'Visualizar todas as entradas, saídas em OS, vendas diretas e saldo residual em estoque.',
          summary: 'Auditoria completa por produto com data, número da nota fiscal ou OS, quantidade movimentada e margem obtida.',
          howToUse: [
            'Na lista de produtos, clique no botão "Histórico Total" do produto.',
            'Uma linha do tempo é exibida com todas as transações que movimentaram aquele item.',
            'Consulte o saldo remanescente em prateleira e o lucro bruto total gerado.'
          ],
          tips: 'Essencial para conferência de estoque físico e suporte em garantias de fábrica.',
          targetTab: 'products'
        },
        {
          id: 'direct_sales',
          moduleCode: 'MOD-2.5',
          title: 'Frente de Caixa (PDV) & Vendas Diretas de Balcão',
          icon: Package,
          badge: 'Balcão Ágil',
          objective: 'Vender peças, produtos químicos e acessórios diretamente no balcão sem necessidade de abrir uma OS.',
          summary: 'Seleção ágil de itens, escolha de tabela de preço (Varejo ou Atacado), parcelamento e impressão de recibo.',
          howToUse: [
            'Acesse a tela "Vendas" no menu lateral.',
            'Clique em "+ Nova Venda".',
            'Adicione os itens do estoque e selecione o cliente.',
            'Defina a condição de pagamento (Pix, Cartão à vista ou parcelado) e confirme.',
            'O sistema baixa o estoque automaticamente e emite o comprovante de venda.'
          ],
          tips: 'Você pode aplicar descontos em percentual ou em valor fixo em reais.',
          targetTab: 'sales'
        },
        {
          id: 'xml_nfe_import',
          moduleCode: 'MOD-2.6',
          title: 'Importação de NF-e via Arquivo XML',
          icon: Download,
          badge: 'Automação Fiscal',
          objective: 'Abastecer o estoque e cadastrar novos produtos automaticamente através do XML da nota fiscal do fornecedor.',
          summary: 'Leitura automática de código, NCM, quantidade e custo unitário, gerando também a duplicata no Contas a Pagar.',
          howToUse: [
            'Na tela de Produtos ou Cadastros, clique em "Importar XML de NF-e".',
            'Selecione o arquivo .xml emitido pelo seu distribuidor ou fabricante.',
            'Confira a listagem dos itens importados e confirme.',
            'Os itens são somados ao estoque e a despesa entra na aba de financeiro.'
          ],
          tips: 'Evita digitação manual e elimina erros de tributação ou custo.',
          targetTab: 'products'
        }
      ]
    },
    {
      id: 'financeiro',
      title: 'Financeiro, Bancos & PagBank',
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
          tips: 'Excelente balizador para planos de comissão e premiações por produtividade.',
          targetTab: 'profitability'
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
          title: 'Central de Cadastros Mestres (Clientes, Fornecedores, Frota e Equipe)',
          icon: Building,
          badge: 'Cadastros Unificados',
          objective: 'Gerenciar em um único local todos os dados cadastrais da empresa.',
          summary: 'Clientes com múltiplos endereços, fornecedores com dados fiscais, técnicos com veículos e catálogo de serviços.',
          howToUse: [
            'Acesse a tela "Cadastros Gerais" no menu lateral.',
            'Selecione a categoria desejada (Clientes, Fornecedores, Funcionários, Veículos, Serviços).',
            'Cadastre ou edite dados com validação automática de CPF/CNPJ e CEP.'
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
          summary: 'Permite selecionar a paleta visual ideal com 1 clique diretamente pelo menu superior ou nas configurações.',
          howToUse: [
            'Clique no botão de paleta "Tema" no canto superior direito do cabeçalho.',
            'Ou acesse "Configurações" e clique na aba "Temas & Cores".',
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
            'Clique no botão "Tema" com o ícone da paleta de cores no cabeçalho superior.',
            'Ou acesse a aba "Temas & Cores" dentro de Configurações.',
            'Escolha entre os 3 temas disponíveis com amostra das cores oficiais.',
            'A aplicação atualiza as cores de menus, botões, tabelas e cabeçalhos imediatamente.'
          ],
          tips: 'O tema Claro & Suave com Ouro Vibrante oferece leitura agradável para atendimentos diurnos.',
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
          title: 'Logs de Auditoria & Rastreabilidade de Operações',
          icon: Shield,
          badge: 'Auditoria',
          objective: 'Rastrear todas as ações realizadas no sistema (quem alterou, o que alterou, data e horário).',
          summary: 'Histórico imutável de cadastros de clientes, emissão de OSs, baixas no PDV e alterações de garantias.',
          howToUse: [
            'Clique no botão "Auditoria" no cabeçalho superior.',
            'Consulte a listagem de eventos com data, hora, usuário responsável e descrição da ação.',
            'Filtre por tipo de ação para investigações e conferência.'
          ],
          tips: 'Excelente ferramenta para controle interno e prevenção contra exclusões indevidas.',
          targetTab: 'dashboard'
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
                  Manual de Uso do Sistema GestãoPro
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
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#707174] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por assunto ou módulo (ex: folha A4, garantia por número de série, pagbank, trocar senha, técnico, código de barras)..."
              className="w-full pl-10 pr-10 py-2 bg-white border border-[#d8d8d8] rounded-xl text-xs sm:text-sm font-medium text-[#363739] focus:outline-hidden focus:ring-2 focus:ring-[#53383e] shadow-xs"
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

          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#707174]">
            <Bookmark className="w-3.5 h-3.5 text-[#53383e]" />
            <span>6 Categorias · 28 Módulos Mapeados</span>
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
            <span>Manual Oficial GestãoPro v2.0 · Atualizado e em conformidade operacional</span>
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
