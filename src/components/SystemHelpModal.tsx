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
          title: 'Abertura de OS & Atalho de Cadastro Rápido de Cliente',
          icon: ClipboardList,
          badge: 'Operação Central',
          objective: 'Registrar atendimentos técnicos, cadastrar novos clientes sem sair da tela de OS e calcular totais automaticamente.',
          summary: 'Ciclo completo com botão "Cadastrar Cliente" no topo da OS e "+ Cadastrar Cliente" no formulário (com consulta automática de CEP/CNPJ e seleção imediata).',
          howToUse: [
            'Clique em "+ Nova OS" ou use o atalho "Cadastrar Cliente" no topo da tela de Ordens de Serviço.',
            'Dentro do formulário da OS, se o cliente ainda não existir, clique em "+ Cadastrar Cliente" ao lado do seletor para abrir o cadastro rápido (PF/PJ, Varejo/Atacado, busca automática de CEP e CNPJ). Ao salvar, ele já entra selecionado na OS.',
            'Informe o equipamento (tipo, modelo e número de série), a Referência do Contrato (opcional, caso exista contrato vinculado) e relate o problema apresentado.',
            'Adicione serviços de mão de obra e peças buscadas ao vivo no Estoque.',
            'O sistema calcula automaticamente subtotal, deslocamento, descontos e prazo previsto.'
          ],
          tips: 'A numeração segue sua regra personalizada configurada na aba Configurações → Numerações & Séries.',
          targetTab: 'orders'
        },
        {
          id: 'os_print_a4',
          moduleCode: 'MOD-1.2',
          title: 'Impressão da OS em Folha A4 Oficial & PDF (Com Fotos)',
          icon: Printer,
          badge: 'Documento Oficial',
          objective: 'Gerar o documento oficial da OS com logotipo, fotos de Início e Local de Entrega, assinatura digital e formato A4 limpo.',
          summary: 'Regra condicional inteligente para produtos/serviços + seção automática de Registro Fotográfico (Antes dos Serviços e Local de Entrega).',
          howToUse: [
            'Na listagem de OS, clique no botão "Imprimir" ou no ícone da impressora dentro do card.',
            'A tela abre com o modelo padronizado preenchido, logotipo da empresa e as fotos registradas do início e da entrega.',
            'O título da aba no navegador é atualizado para o código da OS para que o PDF seja salvo com o nome correto.',
            'Selecione a impressora física ou clique em "Salvar como PDF" nas opções de impressão do navegador.'
          ],
          tips: 'Assinatura digital, checklist e fotos de Início/Entrega saem organizados automaticamente no documento A4.',
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
          title: 'Fotos do Início (Antes) & Local de Entrega + Checklists Touch',
          icon: Camera,
          badge: 'Registro Fotográfico',
          objective: 'Fotografar o estado inicial antes de começar os serviços e o local de entrega na finalização, além de registrar checklist e assinatura digital.',
          summary: 'Dois espaços dedicados ("Início — Antes de Começar os Serviços" e "Local de Entrega") com câmera ao vivo, troca de lente, galeria, compressão automática e atalho direto na lista de OS.',
          howToUse: [
            'Ao criar/editar a OS, nos detalhes da OS ou clicando no botão de câmera direto em qualquer linha/card da listagem, abra o Registro Fotográfico.',
            'Escolha o bloco "Início — Antes de Começar os Serviços" ou "Local de Entrega dos Serviços".',
            'Clique em "Fotografar Agora" para abrir a câmera ao vivo (com opção de alternar entre câmera traseira e frontal e fallback automático para a câmera nativa no celular) ou clique em "Anexar da Galeria".',
            'Clique em qualquer foto para ampliar em tela cheia; na ficha de detalhes, cada nova foto é salva automaticamente na OS.',
            'Preencha também o checklist técnico e colete a assinatura digital do cliente diretamente na tela.'
          ],
          tips: 'Todas as fotos de Início e Local de Entrega são comprimidas automaticamente e incluídas na impressão/PDF A4 oficial da OS.',
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
          title: 'Importação Inteligente: De-Para, Fator de Conversão, Rateio NF-e & Duplicatas',
          icon: Download,
          badge: 'De-Para & Conversão',
          objective: 'Conciliar produtos na entrada (NF-e XML e Planilhas CSV/XLSX/TXT/XML/SQL/PDF), converter embalagens (ex.: CX → UN), ratear frete/seguro/despesas/descontos e escolher seletivamente a integração financeira.',
          summary: 'Detecção automática por EAN/GTIN, vínculo memorizado e similaridade, fator de conversão decimal, rateio configurável, Custo Médio Ponderado e leitura de duplicatas <cobr>/<dup> com Financeiro opcional (desligado por padrão).',
          howToUse: [
            'Em "Estoque → Importador NF-e XML" ou "Central de Cadastros → Importação", carregue o XML da nota ou sua planilha.',
            'Para cada linha da pré-visualização, escolha a ação: "Vincular a Produto Existente (De-Para)" com comparação visual lado a lado (sem sobrescrever o nome padrão do catálogo), "Cadastrar como Novo Produto" ou "Ignorar Item".',
            'Ajuste o Fator de Conversão (ex.: 1 CX = 12 UN) para calcular em tempo real a Quantidade Convertida e o Custo Unitário Efetivo Convertido na unidade do estoque.',
            'Confira e ajuste Frete, Seguro, Outras Despesas e Descontos da NF-e, escolhendo o critério de rateio (valor, quantidade ou apenas financeiro) e a política de custo (efetivo convertido, Custo Médio Ponderado ou manter custo atual).',
            'Na seção Financeiro, mantenha "Não gerar/vincular financeiro agora" (padrão), ou escolha "Gerar nova Despesa" (com duplicatas lidas do XML e atalhos À vista/7d/14d/28d/30d/X parcelas) ou "Vincular a Despesa existente" sem duplicar valores.'
          ],
          tips: 'Cada vínculo De-Para e Fator de Conversão confirmado é memorizado automaticamente por fornecedor para preencher sozinho nas próximas compras.',
          targetTab: 'products'
        },
        {
          id: 'supplier_depara_mappings',
          moduleCode: 'MOD-2.6B',
          title: 'Vínculos de Fornecedores (De-Para) & Visualização no Produto',
          icon: Layers,
          badge: 'Gestão De-Para',
          objective: 'Consultar, editar, criar manualmente ou excluir vínculos memorizados entre códigos/descrições dos fornecedores e produtos do estoque.',
          summary: 'Aba dedicada em Estoque + painel embutido na ficha de detalhes e edição de cada produto, refletindo alterações imediatamente no motor de importação.',
          howToUse: [
            'Acesse "Estoque → Vínculos De-Para" para listar todos os vínculos salvos e filtrar por fornecedor, produto, busca de texto ou apenas itens com conversão (fator ≠ 1).',
            'Clique em "Editar" para ajustar diretamente o Fator de Conversão, a Unidade do Fornecedor ou o Produto Vinculado, ou em "Novo Vínculo Manual" para cadastrar antes mesmo da próxima nota.',
            'Você também pode visualizar e editar os vínculos associados diretamente dentro do modal de Edição ou Detalhes (+) de qualquer produto no Estoque.'
          ],
          tips: 'Ideal para padronizar embalagens (CX, FD, PCT, RL) de fornecedores recorrentes e eliminar ajustes manuais na entrada de notas.',
          targetTab: 'products'
        },
        {
          id: 'import_history_undo',
          moduleCode: 'MOD-2.6C',
          title: 'Histórico de Importações, Auditoria & Desfazer Seguro',
          icon: History,
          badge: 'Auditoria & Estorno',
          objective: 'Auditar cada NF-e/planilha importada com snapshot completo de itens, conversão, custos e financeiro, e desfazer importações concluídas com segurança.',
          summary: 'Registra automaticamente todas as importações concluídas com filtros, modal "Auditar" completo e botão "Desfazer" com resumo de impacto, proteção de produtos movimentados e controle financeiro.',
          howToUse: [
            'Acesse "Estoque → Histórico de Importações" e filtre por fornecedor, período, status (Concluída / Desfeita) ou busca livre.',
            'Clique em "Auditar" para revisar todos os valores (mercadorias, frete, seguro, outras despesas, desconto), lançamentos financeiros vinculados e a tabela snapshot com custo/saldo anterior e novo.',
            'Para reverter uma importação Concluída, clique em "Desfazer", confira o resumo de impacto (estorno das quantidades convertidas, aviso automático para produtos novos já movimentados e alerta se houver parcela paga) e escolha cancelar despesas geradas ou apenas desvincular.'
          ],
          tips: 'Produtos criados na importação que já tenham movimentação externa, O.S. ou venda são protegidos automaticamente contra exclusão durante o estorno.',
          targetTab: 'products'
        },
        {
          id: 'supplier_purchases_report',
          moduleCode: 'MOD-2.6D',
          title: 'Relatório Compras e Entradas por Fornecedor & Histórico de Custos',
          icon: TrendingUp,
          badge: 'Análise de Compras',
          objective: 'Consolidar gastos, participação percentual, ranking de itens mais importados e evolução do custo unitário convertido considerando apenas importações concluídas.',
          summary: 'Cards KPI, tabela consolidada com visão detalhada por fornecedor, ranking por valor ou unidades convertidas, histórico de custos com % de variação e exportação CSV/PDF.',
          howToUse: [
            'Acesse "Estoque → Compras por Fornecedor" e filtre por período, fornecedor, produto ou busca.',
            'Analise os 4 cards de resumo (Total Gasto, Qtd de Importações, Fornecedor de Maior Volume e Unidades Convertidas) e clique em qualquer fornecedor da tabela para abrir sua visão detalhada.',
            'Consulte o Ranking de Itens Mais Importados e clique em um produto para acompanhar seu Histórico de Custos Unitários Convertidos ao longo das compras.',
            'Clique em "Exportar CSV" ou "Exportar / Imprimir PDF" para salvar ou imprimir o relatório gerencial.'
          ],
          tips: 'Importações com status Desfeita são excluídas automaticamente de todos os totais e indicadores deste relatório.',
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
          title: 'Contas a Pagar, Contas a Receber & DRE Reconciliado',
          icon: DollarSign,
          badge: 'Fluxo & DRE',
          objective: 'Controlar vencimentos, faturas pendentes e apurar o DRE centavo por centavo a partir de uma base 100% limpa (Zero Absoluto).',
          summary: 'Receita aberta em Serviços + Peças − Descontos (rateados) + Vendas, excluindo cancelados e orçamentos não aprovados, com liquidação integrada a recibos.',
          howToUse: [
            'Acesse "Financeiro & DRE" no menu lateral.',
            'Filtre pelo mês ou status (Pendentes, Pagas, Vencidas) acompanhando automaticamente a competência real.',
            'Clique em "Pagar" ou "Dar Baixa" para registrar liquidações com emissão automática de recibo.'
          ],
          tips: 'Na importação de NF-e XML, o lançamento no Contas a Pagar é opcional (desmarcado por padrão), evitando lançamentos indesejados no Financeiro.',
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
          title: 'Backup JSON & Restauração Seletiva (Somente Produtos / Sem Financeiro)',
          icon: Download,
          badge: 'Segurança Total',
          objective: 'Exportar cópia completa em JSON e restaurar tudo ou apenas as categorias escolhidas sem tocar no Financeiro.',
          summary: 'Upload de arquivo .json com contagem prévia em 11 módulos independentes + atalhos "Somente Produtos (Sem Financeiro)" e "Somente Cadastros (Sem Financeiro)".',
          howToUse: [
            'Em "Configurações", clique na aba "Backup & Restauração".',
            'Clique em "Exportar Backup Agora" para salvar o arquivo JSON no seu computador.',
            'Para restaurar, carregue o arquivo .json (ou cole o conteúdo) e veja a prévia automática de quantos registros existem em cada módulo.',
            'Use o atalho "Somente Produtos (Sem Financeiro)", "Somente Cadastros (Sem Financeiro)" ou marque manualmente quais das 11 categorias deseja importar.'
          ],
          tips: 'Em "Configurações → Gestão de Dados" você também pode zerar toda a base (Zero Absoluto) preservando as configurações da empresa.',
          targetTab: 'configuracoes'
        },
        {
          id: 'themes_system',
          moduleCode: 'MOD-4.5',
          title: 'Temas Oficiais FIRE GESTÃO (Chama Alegre & Azul Cobalto)',
          icon: Palette,
          badge: 'Personalização Visual',
          objective: 'Alternar entre os 2 temas oficiais do FIRE GESTÃO: Fire Gestão · Chama Alegre e Azul Cobalto.',
          summary: 'Paletas limpas e harmoniosas: o tema padrão Chama Alegre (amarelo, laranja, verde petróleo, esmeralda e marfim suave) e o tema Azul Cobalto.',
          howToUse: [
            'Acesse "Configurações" no menu lateral e clique na aba "Temas & Identidade Visual".',
            'Escolha entre "Fire Gestão · Chama Alegre" (inspirado no favicon mini chama) ou "Azul Cobalto".',
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
        },
        {
          id: 'system_modules_toggle',
          moduleCode: 'MOD-4.7',
          title: 'Ativar & Desativar Módulos do Sistema (Arquitetura Modular)',
          icon: Layers,
          badge: 'Modularidade',
          objective: 'Ligar ou desligar qualquer um dos 22 módulos do FIRE GESTÃO conforme a necessidade da sua empresa, sem apagar dados.',
          summary: 'Controle em tempo real via Configurações → Módulos do Sistema ou pelo arquivo central ativarModulos.ts (chaves true/false) na pasta modulos.',
          howToUse: [
            'Acesse "Configurações → Módulos do Sistema" para visualizar todos os módulos organizados por categoria.',
            'Ative ou desative qualquer módulo com 1 clique: módulos desativados somem imediatamente do menu lateral, dos atalhos do topo e das rotas.',
            'Para implantação em servidor/VPS, também é possível editar diretamente as chaves true/false no arquivo central ativarModulos.ts dentro da pasta modulos.',
            'Sempre que quiser voltar a usar um módulo desativado, basta religar a chave — todos os dados permanecem preservados.'
          ],
          tips: 'O cabeçalho superior também foi limpo (sem campo de data/mês) para oferecer uma navegação mais leve e focada nos módulos ativos.',
          targetTab: 'configuracoes'
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
      title: 'Acessos, Login FIRE GESTÃO & Identidade Visual',
      icon: Palette,
      description: 'Autenticação limpa (Zero Absoluto), tela de login solar, favicon mini chama, 2 temas oficiais, menu lateral retrátil e auditoria.',
      modules: [
        {
          id: 'login_auth',
          moduleCode: 'MOD-6.1',
          title: 'Tela de Login FIRE GESTÃO (Cores da Chama & Perfis)',
          icon: Lock,
          badge: 'Autenticação Segura',
          objective: 'Proteger o sistema com tela de login nas cores alegres do favicon mini chama (amarelo solar e laranja) e controle de perfis.',
          summary: 'Suporte a Administrador, Colaborador, Técnico em Campo, Vendedor, Contador e Cliente em base limpa (Zero Absoluto).',
          howToUse: [
            'Na tela de login do FIRE GESTÃO, informe seu usuário (ou e-mail) e sua senha cadastrada.',
            'Na instalação inicial (Zero Absoluto), utilize o acesso Administrador padrão e cadastre os demais usuários reais da sua equipe em Configurações → Usuários e Acesso.',
            'Para sair com segurança, clique no botão "Sair" no cabeçalho ou rodapé do menu lateral.'
          ],
          tips: 'A sessão permanece salva com segurança no navegador do dispositivo e respeita os módulos ativos.',
          targetTab: 'dashboard'
        },
        {
          id: 'visual_themes_palettes',
          moduleCode: 'MOD-6.2',
          title: '2 Temas Oficiais: Fire Gestão · Chama Alegre & Azul Cobalto',
          icon: Palette,
          badge: 'Identidade Visual',
          objective: 'Alternar instantaneamente entre as 2 paletas oficiais com alto contraste, conforto visual e identidade da marca FIRE GESTÃO.',
          summary: 'Tema Fire Gestão · Chama Alegre (amarelo + laranja + verde petróleo + esmeralda + marfim suave) e Tema Azul Cobalto.',
          howToUse: [
            'Acesse "Configurações" no menu lateral e clique na aba "Temas & Identidade Visual".',
            'Escolha entre "Fire Gestão · Chama Alegre" ou "Azul Cobalto" visualizando a amostra de cores.',
            'A aplicação atualiza menus, botões, tabelas e cabeçalhos imediatamente.'
          ],
          tips: 'O favicon mini chama amarela e laranja identifica a aba do navegador e a identidade do FIRE GESTÃO em todo o sistema.',
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
