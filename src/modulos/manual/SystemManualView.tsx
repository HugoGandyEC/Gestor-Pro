import React, { useState } from 'react';
import { 
  BookOpen, 
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
  Sparkles,
  Calendar,
  MessageSquare,
  Database,
  Store,
  History,
  Download,
  Receipt,
  BarChart3,
  KeyRound,
  Sliders,
  UserCheck,
  Truck,
  Layers
} from 'lucide-react';
import { ActiveTab } from '../../components/Sidebar';
import { SYSTEM_VERSION, SYSTEM_BUILD, SYSTEM_RELEASE_DATE } from '../../constants/version';
import { SYSTEM_CHANGELOG, ChangeCategory, ChangelogEntry } from '../../constants/changelog';
import { LiveSearchInput, LiveSearchOption } from '../../components/LiveSearchInput';

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
  const [viewMode, setViewMode] = useState<'manual' | 'changelog'>('manual');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('fluxo_geral');
  const [searchTerm, setSearchTerm] = useState('');
  const [changelogCategoryFilter, setChangelogCategoryFilter] = useState<'Todas' | ChangeCategory>('Todas');
  const [changelogSearch, setChangelogSearch] = useState('');

  const sections: ManualSection[] = [
    {
      id: 'fluxo_geral',
      title: '1. Visão Geral & Vínculos Integrados do Sistema',
      badge: 'Arquitetura',
      icon: TrendingUp,
      targetTab: 'dashboard',
      summary: 'Entenda como o sistema interliga Vendas, Ordens de Serviço, PDV, Recibos, Estoque, Equipe, Contas a Pagar/Receber, BI e DRE com precisão matemática.',
      steps: [
        'Abertura de Ordem de Serviço ou Venda: O cliente e os produtos/serviços são buscados na base; itens do estoque têm baixa e estorno automáticos por movimentação Kardex.',
        'Envio ao PDV & Formas de Pagamento: Tanto O.S. quanto Vendas podem ser enviadas ao PDV ou baixadas com uma ou múltiplas formas de pagamento e bandeiras de cartão diferentes (ex.: PIX + Crédito Visa 3x + Débito Mastercard).',
        'Emissão Automática de Recibo: Todo pagamento confirmado no PDV/Caixa, O.S., Venda ou Financeiro gera na hora o Recibo de Pagamento com controle de saldo parcial ou carimbo de QUITADO.',
        'Integração Automática de Custos: Salários, horas trabalhadas, comissões, compras de materiais/XML e contas recorrentes ou parceladas alimentam automaticamente Contas a Pagar, DRE e BI sem duplicidade.',
        'DRE, BI e Painéis: Os dados consolidam a Receita Bruta, deduzem CMV, taxas de cartão, folha, frota e custos fixos para apurar o Lucro Líquido Real em tempo real.'
      ],
      tips: [
        'Acesse "Visão Geral" (Dashboard) para acompanhar faturamento, margens, cards de O.S. com status padronizados e pendências do mês.',
        'Vendas e movimentações canceladas são excluídas automaticamente dos totalizadores do Dashboard, BI, DRE e fechamento contábil, mantendo o registro apenas na auditoria.'
      ],
      rules: [
        'Vendas Diretas ativas e Ordens de Serviço faturadas no período são consolidadas na Receita Bruta.',
        'Todos os módulos operam sincronizados em tempo real com a nuvem (PC ↔ Celular).'
      ]
    },
    {
      id: 'ordens_servico',
      title: '2. Ordens de Serviço (OS), Status Unificados & Busca no Estoque',
      badge: 'Operações',
      icon: ClipboardList,
      targetTab: 'orders',
      summary: 'Abertura completa de O.S. e Orçamentos com busca ao vivo de produtos cadastrados no Estoque, status idênticos em todo o sistema, deslocamento por KM, checklists, fotos e assinatura digital.',
      steps: [
        'Clique em "+ Nova Ordem de Serviço" no topo da tela ou na aba Ordens de Serviço.',
        'Selecione o Cliente (ou cadastre rapidamente sem obrigatoriedade de CPF) e escolha o endereço de atendimento.',
        'Status Padronizados: Escolha o estágio da O.S. ("Orçamento Aberto", "Aguardando Aprovação", "Aprovada / Em Andamento", "Aguardando Peças", "Concluída (Aguardando Retirada)", "Entregue / Finalizada" ou "Cancelada"). O mesmo nome e cor aparecem na O.S., nos cards, no Dashboard, no Painel do Técnico, no Portal do Cliente e no PDV.',
        'Busca e Inclusão de Produtos do Estoque: Use o campo de busca ao vivo (nome, código, SKU, marca, categoria ou código de barras) ou a lista suspensa para incluir peças cadastradas com aplicação automática de preço Varejo ou Atacado.',
        'Serviços, Checklists, Fotos e Assinatura: Adicione serviços do catálogo ou avulsos, preencha checklists inteligentes, anexe fotos de entrada/saída e colete a assinatura digital na tela.',
        'Deslocamento e Despesas de Campo: Para atendimentos externos, informe a quilometragem (calculada automaticamente sobre R$ 1,80/km ida e volta) e despesas de viagem (pedágio, alimentação, estacionamento) para apurar lucro ou prejuízo real da O.S.',
        'Envio ao PDV & Impressão A4: Envie a O.S. para o PDV pelo botão "Cobrar (PDV)" ou imprima/salve em PDF padrão A4.'
      ],
      tips: [
        'No Dashboard, clicar em qualquer card ou status de O.S. filtra automaticamente a tela de Ordens de Serviço no status correspondente.',
        'Em Configurações > Gestão de Dados você pode carregar a massa de exemplos realistas de O.S. (com cenários lucrativos e de prejuízo) para demonstrações.'
      ],
      rules: [
        'As peças aplicadas na O.S. movimentam o Estoque e compõem o Custo de Mercadorias Vendidas (CMV).',
        'O rótulo e a cor de cada status são centralizados em uma única fonte de verdade para evitar divergências entre telas.'
      ]
    },
    {
      id: 'vendas_diretas',
      title: '3. Vendas & Balcão: Busca de Itens, Múltiplas Bandeiras, Cancelamento & Envio ao PDV',
      badge: 'Vendas',
      icon: ShoppingBag,
      targetTab: 'sales',
      summary: 'Criação ágil de vendas com campos limpos na abertura, busca ao vivo de produtos e serviços, múltiplas formas/bandeiras de cartão, cancelamento antes ou depois de salvar, exclusão por senha e envio direto ao PDV.',
      steps: [
        'Abertura Limpa: Ao clicar em "Nova Venda / Balcão", a lista de itens abre vazia e sem valores pré-preenchidos. Selecione o cliente (ou deixe como Venda Balcão Avulsa; clientes Atacadistas liberam a tabela de Atacado).',
        'Busca de Produtos e Serviços: Utilize a barra de busca dinâmica para localizar produtos do Estoque (por nome, código, SKU, marca ou código de barras) ou Serviços cadastrados, defina a quantidade e clique para incluir. Também é possível usar a lista agrupada ou "+ Item Avulso".',
        'Exclusão de Itens & Limpeza de Campos: Cada linha de produto ou serviço possui botão de lixeira para exclusão (inclusive do último item), além do botão "Limpar Lista" que zera itens, desconto e valores de pagamento sem deixar dados residuais.',
        'Múltiplas Formas com Bandeiras Diferentes: Adicione uma ou várias formas de pagamento (PIX, Dinheiro, Cartão Crédito, Cartão Débito, Boleto, Faturado 30d). Cada cartão possui seletor próprio de Bandeira (Visa, Mastercard, Elo, Hipercard, Outra) e Parcelas (1x a 12x), com cálculo de taxa e botão "Restante" para fechar a soma.',
        'Cancelar Venda Antes de Adicionar: Se desistir durante o preenchimento, clique em "Cancelar Venda" (ou no X) para descartar o rascunho e limpar todos os campos sem salvar nada nem mexer no estoque.',
        'Enviar para o PDV ou Receber: Escolha o Terminal PDV de destino e clique em "Salvar & Mandar p/ Fila do PDV", "Enviar e Finalizar no PDV" (abre a tela do PDV já com o checkout da venda pronto para receber do cliente) ou "Receber Agora & Gerar Recibo".',
        'Cancelar ou Excluir Venda Salva: Na listagem, cards ou detalhes da venda, qualquer pessoa com acesso a Vendas pode clicar em "Cancelar" (estorna o estoque e mantém auditoria). Já o botão "Excluir" exige obrigatoriamente senha do Administrador ou de funcionário autorizado.'
      ],
      tips: [
        'Preços de Atacado permanecem bloqueados por padrão até que um cliente cadastrado como Atacadista seja selecionado.',
        'Vendas pendentes já enviadas exibem o selo "Na fila do PDV" e podem ser abertas com 1 clique pelo botão "Enviar PDV".'
      ],
      rules: [
        'A soma das múltiplas formas de pagamento precisa coincidir com o Total Líquido da venda ao salvar.',
        'O cancelamento estorna automaticamente os produtos para o estoque e exclui os valores dos totais financeiros sem apagar o histórico.'
      ]
    },
    {
      id: 'pdv_frente_caixa',
      title: '4. PDV / Frente de Caixa: Múltiplas Bandeiras, Cancelamento & Exclusão por Senha',
      badge: 'PDV / Caixa',
      icon: Store,
      targetTab: 'pdv',
      summary: 'Caixa completo para recebimento de Vendas e Ordens de Serviço com checkout multi-bandeira, balcão rápido, suprimento/sangria, fechamento de turno, cancelamento livre e exclusão protegida por senha.',
      steps: [
        'Abertura de Caixa: Acesse "PDV / Caixa", clique em "Abrir Caixa PDV", selecione o terminal (Caixa 01, Caixa 02, Caixa 03 ou PDV Móvel) e informe o Fundo de Troco inicial.',
        'Fila de Recebimentos & Balcão PDV: Visualize todas as O.S. e Vendas pendentes na Fila (incluindo as enviadas pela tela de Vendas) ou monte vendas rápidas direto na aba "Balcão PDV" com cadastro rápido de cliente.',
        'Checkout com Múltiplas Formas e Bandeiras Diferentes: Clique em "Receber no Caixa" e ative "Múltiplas Formas / Cartões". Em cada linha escolha a forma, a Bandeira do cartão (Visa, Mastercard, Elo, Hipercard, Outra), as parcelas (1x a 12x) e o valor. Se houver dinheiro, informe o valor entregue para cálculo automático do troco.',
        'Quitação Total, Entrada Parcial ou Parcela Programada: Receba o valor integral, apenas uma entrada/pagamento parcial ou liquide uma parcela específica, gerando automaticamente o recibo correspondente.',
        'Cancelar Venda (Qualquer Operador do PDV): Tanto na Fila de Recebimentos quanto na aba "Vendas do PDV", qualquer usuário com acesso ao PDV pode clicar em "Cancelar" para estornar estoque e cancelar lançamentos vinculados sem apagar a auditoria.',
        'Excluir Venda (Protegido por Senha): O botão "Excluir" abre um modal de autorização. A exclusão definitiva só é concluída digitando a Senha Mestra de Exclusão no PDV ou a senha de um Administrador / Funcionário autorizado pelo Administrador.',
        'Suprimento, Sangria & Fechamento: Registre reforços de troco ou retiradas, acompanhe o "Extrato do Caixa" e finalize o turno em "Fechar Caixa" conferindo eventual sobra ou falta.'
      ],
      tips: [
        'Ao clicar em "Enviar e Finalizar no PDV" na tela de Vendas, o PDV abre automaticamente o checkout da venda já com todas as formas e bandeiras pré-carregadas.',
        'Se nenhuma senha de exclusão tiver sido cadastrada ainda, o PDV bloqueia a exclusão e orienta configurar em Configurações.'
      ],
      rules: [
        'Toda exclusão autorizada registra no Log de Auditoria quem executou a exclusão e qual administrador/funcionário autorizou pela senha.',
        'Movimentações e recibos de vendas canceladas ficam marcados como cancelados para não distorcerem o saldo do caixa.'
      ]
    },
    {
      id: 'recibos_pagamento',
      title: '5. Recibos Automáticos de Pagamento (A4, Térmico 80mm, PDF & Saldo)',
      badge: 'Recibos',
      icon: Receipt,
      targetTab: 'pdv',
      summary: 'Geração imediata e automática de recibo em todo lançamento ou confirmação de pagamento no PDV, Vendas, O.S. e Financeiro, com controle visual de saldo parcial e carimbo de quitação.',
      steps: [
        'Disparo Automático: Assim que um pagamento é confirmado (à vista, entrada de O.S., pagamento parcial, parcela ou quitação), o sistema cria o recibo sequencial (REC-YYYY-XXXX) e abre a visualização em modal.',
        'Dados Completos & Origem Vinculada: O recibo exibe automaticamente os dados completos do cliente (Nome/Razão Social, CPF/CNPJ, Telefone e Endereço), número da O.S. ou ID da Venda Direta, lista de itens/serviços, formas de pagamento com bandeiras/parcelas e operador/terminal do caixa.',
        'Controle de Saldo vs Quitação: Em pagamentos parciais/entradas, o recibo destaca em evidência o Valor Pago, o Valor Total da operação e o Saldo Devedor / Falta Restante. Quando integralmente pago, exibe o selo visual "QUITADO / INTEGRALMENTE PAGO".',
        'Formatos de Saída (Modal, 80mm, A4, PDF e Compartilhamento): No modal do recibo, alterne entre visualização "Folha A4" e "Cupom Térmico 80mm", clique em Imprimir, "Baixar PDF" (A4 ou 80mm), "Copiar / Compartilhar" ou envie diretamente via WhatsApp.',
        'Consulta Posterior: Acesse todos os recibos emitidos na aba "Recibos Emitidos" do PDV, na coluna de ações das Vendas/O.S. ou no Portal do Cliente.'
      ],
      tips: [
        'Use a visualização Térmica 80mm para impressoras de balcão não fiscais e Folha A4 para entregas corporativas ou envio em PDF.',
        'Todos os recibos ficam sincronizados na nuvem (Firestore) para reimpressão a qualquer hora.'
      ],
      rules: [
        'Cada recebimento gera um recibo próprio que soma ao histórico acumulado para calcular corretamente o saldo devedor restante.',
        'Recibos vinculados a vendas canceladas recebem indicação visual de cancelamento.'
      ]
    },
    {
      id: 'financeiro_dre',
      title: '6. Financeiro, Contas a Receber, Contas a Pagar & DRE Gerencial',
      badge: 'Financeiro',
      icon: DollarSign,
      targetTab: 'financial',
      summary: 'Conciliação de receitas e despesas com baixa integrada à geração de recibos, sincronização automática de custos de equipe/compras/recorrentes e DRE Gerencial do período.',
      steps: [
        'Contas a Receber: Visualize todas as Ordens de Serviço e Vendas ativas da competência, conferindo valores recebidos, saldos pendentes e atalho de quitação com emissão automática de recibo.',
        'Contas a Pagar: Acompanhe fornecedores (incluindo entradas de estoque/XML NF-e), folha salarial, horas trabalhadas, comissões e custos fixos/recorrentes sincronizados automaticamente.',
        'Baixas e Conciliação: Clique para liquidar contas pendentes em Contas a Pagar ou Receber mantendo o fluxo de caixa atualizado em tempo real.',
        'DRE Gerencial: Consulte o Demonstrativo de Resultado com Receita Bruta (Serviços + Vendas), Deduções/Taxas de Cartão, CMV, Custos de Pessoal, Frota, Custos Fixos e Lucro Líquido.'
      ],
      tips: [
        'Filtre por competência mensal e status (Pendentes / Pagas) para focar nas liquidações do dia.',
        'Os cálculos evitam duplicidade entre despesas já lançadas manualmente e provisões automáticas da folha e recorrências.'
      ],
      rules: [
        'Vendas e O.S. canceladas não compõem a Receita Bruta nem os resultados do DRE.',
        'As taxas de cartão das bandeiras são deduzidas conforme configuração da operadora.'
      ]
    },
    {
      id: 'custos_folha_remuneracao',
      title: '7. Integração de Custos, Folha Salarial & Remuneração (Combobox)',
      badge: 'Custos & Equipe',
      icon: Calculator,
      targetTab: 'employees',
      summary: 'Configuração da forma de remuneração de cada funcionário via combobox e sincronização automática de folha, compras de materiais, despesas recorrentes e parcelamentos no Financeiro e Break-Even.',
      steps: [
        'Cadastro de Funcionários com Combobox de Remuneração: Na tela "Equipe & Funcionários" ou na Central de Cadastros, selecione na combobox o modelo de remuneração do colaborador: "Salário Fixo", "Hora Trabalhada" (informando Valor/Hora e Horas/Mês com prévia automática), "Comissão", "Salário + Comissão" ou "Hora Trabalhada + Comissão".',
        'Filtros em Combobox: Filtre a equipe facilmente pelas comboboxes de Tipo de Remuneração e Situação (Ativos/Inativos).',
        'Integração Automática da Folha e Comissões: Os valores nominais, encargos e comissões sobre O.S. concluídas e vendas pagas são sincronizados automaticamente em Contas a Pagar, DRE, BI, Rentabilidade por Técnico e Fechamento Contábil, mantendo histórico e evitando duplicidade.',
        'Custos Iniciais, Recorrentes & Dívidas: Em "Custos Iniciais / Fixos", cadastre contas recorrentes (aluguel, telefone, celular, internet, energia, água, DAS MEI) e parcelamentos/dívidas, amortize parcelas com "+1 Parcela Paga" e acompanhe o Simulador de Break-Even.',
        'Compras de Materiais & Estoque: Entradas manuais de mercadorias ou importações de XML NF-e geram automaticamente lançamentos de compra de materiais/reposição no mês correspondente.'
      ],
      tips: [
        'Use o modelo "Hora Trabalhada" para técnicos ou prestadores pagos por hora apontada, visualizando a prévia mensal imediata no cadastro.',
        'Ajuste o Ticket Médio e a Margem no Simulador de Break-Even para saber quantas O.S. cobrem os custos fixos mensais.'
      ],
      rules: [
        'O cálculo nominal em todos os relatórios respeita exatamente o tipo de remuneração selecionado na combobox do colaborador.',
        'Comissões só incidem sobre O.S. concluídas/entregues e vendas diretas pagas e não canceladas.'
      ]
    },
    {
      id: 'bi_indicadores',
      title: '8. Gráficos & Indicadores Gerenciais (BI) com Filtros em Combobox',
      badge: 'Inteligência (BI)',
      icon: BarChart3,
      targetTab: 'charts',
      summary: 'Painel analítico interativo com comboboxes para período, status, visão rápida, filtros por entidade e escolha global do modelo de gráfico.',
      steps: [
        'Filtros por Combobox no Topo: Selecione o Período na combobox (Hoje, Semana, Quinzena, Mês, Trimestre, Semestre, Anual ou Personalizado com data início/fim), o Status de Pagamento (Todos, Pago, Pendente), a Visão Rápida e o Modelo de Gráfico.',
        'Recorte por Entidade: Filtre resultados por Cliente, Produto/Peça, Serviço ou Canal (O.S. vs PDV/Vendas).',
        'Modelos de Gráficos: Alterne instantaneamente todos os painéis selecionados entre Colunas Verticais, Barras Horizontais, Linha/Área, Rosca/Pizza ou Proporção 100%.',
        'Panorama Financeiro & Rankings: Analise Receita Bruta, Recebido, A Receber, Custos/Despesas (incluindo folha e compras integradas), Lucro Líquido e rankings de clientes, produtos, serviços e equipe.'
      ],
      tips: [
        'No celular, os filtros avançados ficam recolhidos por padrão com botão de expansão para manter a leitura limpa dos gráficos.',
        'Compare períodos (Semana vs Mês vs Anual) usando a combobox de período para identificar sazonalidades.'
      ],
      rules: [
        'Os indicadores de BI ignoram vendas e O.S. canceladas e aplicam rateio proporcional de folha e frota conforme o período filtrado.'
      ]
    },
    {
      id: 'produtos_margens',
      title: '9. Módulo Estoque: Produtos, Peças, Fotos, EAN-13 & Kardex',
      badge: 'Estoque',
      icon: Package,
      targetTab: 'products',
      summary: 'Módulo renomeado para "Estoque" com todos os filtros em comboboxes, precificação automática 55% Varejo / 35% Atacado, fotos no hover/listagem/grade, código de barras EAN-13, duplicador e Kardex.',
      steps: [
        'Filtros em Combobox: Filtre rapidamente o estoque pelas comboboxes de Categoria, Marca, Subcategoria, Situação do Estoque (Normal, Baixo/Crítico, Zerado) e Tipo de Movimentação Kardex.',
        'Precificação Automática: Informe o Custo do produto para calcular automaticamente Varejo (+55%) e Atacado (+35%), ou aplique em massa para todo o catálogo.',
        'Fotos, EAN-13 & Duplicar: Adicione até 3 fotos (exibidas na listagem, nos cards e ao passar o mouse), gere código de barras EAN-13 válido em 1 clique ou clique em "Duplicar" para variações rápidas de potência/voltagem.',
        'Histórico 360° & Kardex: Consulte entradas manuais, compras XML, saídas em O.S./Vendas e estornos por cancelamento com rastreabilidade completa.'
      ],
      tips: [
        'Mantenha o Estoque Mínimo preenchido para destacar itens críticos antes que faltem para atendimento.',
        'Todas as colunas e cards exibem a miniatura da foto com fallback automático caso o item ainda não possua imagem.'
      ],
      rules: [
        'Preço de Varejo padrão = Custo × 1,55 (55%) · Preço de Atacado padrão = Custo × 1,35 (35%).',
        'Saídas e estornos por venda ou O.S. ficam registrados com documento de referência no Kardex.'
      ]
    },
    {
      id: 'central_cadastros_usuarios',
      title: '10. Central de Cadastros, Usuários, Listagem/Grade & Tooltips',
      badge: 'Cadastros & Acesso',
      icon: Users,
      targetTab: 'cadastros',
      summary: 'Gestão unificada com navegação e filtros por comboboxes, alternância entre Listagem e Grade (Cards), tooltip detalhado no hover e controle de permissões de usuários (incluindo exclusão no PDV/Vendas).',
      steps: [
        'Navegação por Combobox: Na Central de Cadastros, alterne pela combobox entre Clientes, Fornecedores, Estoque (Produtos/Peças), Equipe/Funcionários, Frota/Veículos, Catálogo de Serviços, Checklists, Usuários e Importação Multi-Formato.',
        'Filtros Específicos em Combobox: Cada aba conta com comboboxes próprias (perfil Varejo/Atacado do cliente, cidade/UF de fornecedor, categoria/situação de estoque, tipo de remuneração da equipe, status da frota, categoria de serviço e equipamento de checklist).',
        'Listagem vs Grade & Hover Tooltip: Alterne entre visualização em Tabela compacta ou Cards em Grade e passe o mouse sobre qualquer linha para visualizar um card flutuante com todos os detalhes do registro.',
        'Gestão de Usuários & Permissão de Exclusão: Em Cadastro de Usuários (ou Configurações → Usuários e Acesso), crie usuários com perfil (Administrador, Colaborador, Vendedor, Técnico, Contador, Cliente) e marque a opção "Pode excluir vendas no PDV/Vendas (com sua senha)" para liberar colaboradores confiáveis.'
      ],
      tips: [
        'Clientes cadastrados com perfil "Atacadista" desbloqueiam automaticamente a tabela de preço de Atacado em Vendas, PDV e O.S.',
        'Clique no botão "+" em qualquer linha para abrir a ficha modal completa de detalhes e ações do registro.'
      ],
      rules: [
        'Perfis de Administrador possuem permissão automática para exclusão com senha; demais perfis dependem da habilitação explícita pelo Administrador e de senha cadastrada.'
      ]
    },
    {
      id: 'importacao_nfe',
      title: '11. Importação Multi-Formato & Leitura de NF-e (XML) Anti-Duplicidade',
      badge: 'Integrações',
      icon: UploadCloud,
      targetTab: 'cadastros',
      summary: 'Leitura automática de XML de NF-e com cadastro de fornecedor, atualização de estoque, lançamento financeiro de compra e proteção SHA-256 contra importação duplicada.',
      steps: [
        'Acesse "Estoque" ou "Central de Cadastros > Importação Multi-Formato & XML".',
        'Envie o arquivo .xml da NF-e do fornecedor (ou planilhas CSV/XLSX/TXT/PDF/SQL nos importadores).',
        'Conferência Automática: O sistema extrai CNPJ/dados do fornecedor, NCM, código, quantidade, custo e sugere preços de Varejo (+55%) e Atacado (+35%).',
        'Confirme a Importação: O fornecedor é atualizado/criado sem duplicar, os produtos entram no Estoque (Kardex) e a conta a pagar da compra é lançada automaticamente no Financeiro.'
      ],
      tips: [
        'Detector Anti-Duplicidade: Caso o mesmo XML já tenha sido importado antes (conferência por chave NF-e e hash SHA-256), o sistema avisa imediatamente permitindo cancelar ou reprocessar.'
      ],
      rules: [
        'Fornecedores são conciliados pelo CNPJ e produtos por código/nome para evitar cadastros repetidos.'
      ]
    },
    {
      id: 'operadoras_cartao',
      title: '12. Operadoras de Cartão, Bandeiras & Repasse/Absorção de Taxas',
      badge: 'Meios de Pagamento',
      icon: CreditCard,
      targetTab: 'cardOperators',
      summary: 'Configuração de adquirentes (PagBank, InfinitePay, Stone, Cielo, etc.), taxas por bandeira e parcela (1x a 12x), política de assumir ou repassar juros e baixa automática.',
      steps: [
        'Acesse "Operadoras de Cartão" no menu lateral.',
        'Cadastre ou edite a operadora configurando taxas de PIX, Débito, Crédito à Vista (1x) e Parcelado (2x a 12x) por bandeira.',
        'Defina se a empresa assume a taxa da maquininha ou repassa o acréscimo ao cliente.',
        'No PagBank, ative a Baixa Automática e use "Sincronizar Pedidos Pendentes" para conciliar pagamentos via NSU e código de autorização.'
      ],
      tips: [
        'Quando o PDV ou Vendas utiliza múltiplas bandeiras na mesma compra, cada linha busca a taxa correspondente à sua bandeira e número de parcelas.'
      ],
      rules: [
        'As taxas retidas pelas operadoras compõem as deduções no DRE para mostrar o valor líquido real recebido.'
      ]
    },
    {
      id: 'frota_rentabilidade',
      title: '13. Frota, Deslocamento por KM & Rentabilidade por Técnico',
      badge: 'Frota & Equipe',
      icon: Truck,
      targetTab: 'fleet',
      summary: 'Controle de veículos, abastecimentos, manutenção preventiva, cálculo de KM rodado em atendimentos externos e DRE individual de lucratividade por técnico.',
      steps: [
        'Em "Frota & Custos", cadastre os veículos da empresa e lance abastecimentos, trocas de óleo, pneus, IPVA e seguros.',
        'Em O.S. externas, registre a quilometragem (ida e volta) para ratear o deslocamento e despesas de viagem.',
        'Acesse "Rentabilidade p/ Técnico" para comparar faturamento gerado, custo de peças, folha/comissão (conforme combobox de remuneração) e margem líquida de cada colaborador.'
      ],
      tips: [
        'Acompanhe os alertas automáticos de troca de óleo próxima com base na quilometragem do veículo.'
      ],
      rules: [
        'Custos de frota e deslocamento entram no rateio operacional do DRE e da rentabilidade da equipe.'
      ]
    },
    {
      id: 'portal_cliente',
      title: '14. Portal do Cliente, Garantias por S/N & Abertura de Chamados',
      badge: 'Pós-Venda',
      icon: UserCheck,
      targetTab: 'customerPortal',
      summary: 'Área exclusiva de autoatendimento para o cliente acompanhar suas O.S., consultar garantias por número de série, ver histórico de compras/recibos, alterar senha e abrir chamados.',
      steps: [
        'Acompanhar O.S. e Débitos: O cliente visualiza suas Ordens de Serviço com os mesmos status oficiais da oficina e acompanha pagamentos pendentes ou recibos.',
        'Garantias por Número de Série (S/N): Consulta cada equipamento com contagem de dias restantes de garantia e botão de acionamento rápido.',
        'Histórico de Compras & Perfil: Exibe compras ativas (excluindo canceladas) e permite ao próprio cliente atualizar telefone/endereço/usuário e senha de acesso.'
      ],
      tips: [
        'Clientes também podem assinar digitalmente documentos pendentes diretamente pelo portal.'
      ],
      rules: [
        'O acesso do perfil Cliente é isolado estritamente aos seus próprios registros (O.S., compras, garantias e chamados).'
      ]
    },
    {
      id: 'google_agenda',
      title: '15. Google Agenda & Agendamento de Visitas Técnicas',
      badge: 'Integração Google',
      icon: Calendar,
      targetTab: 'agenda',
      summary: 'Sincronização da agenda corporativa com o Google Calendar, agendamento de visitas de campo em 1 clique direto pela O.S. e avisos pelo WhatsApp.',
      steps: [
        'Acesse "Google Agenda" e clique em "Conectar & Validar Conta Google" para autenticar sua conta Google Workspace.',
        'Crie agendamentos vinculados a Ordens de Serviço (preenchendo automaticamente cliente, endereço e serviço) ou use o botão "Agendar" direto na tela de O.S.',
        'Sincronize eventos para a nuvem e envie a confirmação de data e horário pelo botão "WhatsApp" em 1 clique.'
      ],
      tips: [
        'O endereço completo no agendamento facilita a abertura imediata de rotas no Google Maps ou Waze pelo técnico em campo.'
      ],
      rules: [
        'Exclusões de eventos sincronizados exigem confirmação na tela para evitar perda acidental na agenda.'
      ]
    },
    {
      id: 'whatsapp_integracao',
      title: '16. Integração com WhatsApp & Mensagens Dinâmicas',
      badge: 'Comunicação',
      icon: MessageSquare,
      targetTab: 'configuracoes',
      summary: 'Disparo gratuito e direto de orçamentos, aprovações, garantias, recibos, cobranças PIX e confirmações de visita pelo WhatsApp Web/App.',
      steps: [
        'Configure o telefone comercial e a Chave PIX padrão em Configurações → Integração WhatsApp.',
        'Personalize os modelos prontos usando variáveis automáticas ({cliente_nome}, {os_numero}, {valor_total}, {chave_pix}, {data}, {garantia}).',
        'Clique no botão "WhatsApp" nas telas de O.S., Vendas, Agenda ou dentro do Modal de Recibo para abrir a conversa já preenchida e com o número formatado (+55).'
      ],
      tips: [
        'Você pode editar o texto na hora antes de enviar ou usar o botão "Copiar Texto" caso prefira colar manualmente.'
      ],
      rules: [
        'Os números dos clientes são higienizados e padronizados com DDI +55 automaticamente.'
      ]
    },
    {
      id: 'configuracoes_seguranca',
      title: '17. Configurações Unificadas: Senha Mestra PDV, Temas, Auditoria, Dados & Drive',
      badge: 'Administração',
      icon: KeyRound,
      targetTab: 'configuracoes',
      summary: 'Centralização administrativa: definição da senha de exclusão de vendas no PDV/Vendas, Temas Visuais e Logs de Auditoria movidos para Configurações, gestão de base de dados, MySQL e Google Drive.',
      steps: [
        'Segurança do PDV & Vendas (Senha de Exclusão): Em "Configurações → Dados da Empresa", preencha o campo "Senha Mestra de Exclusão no PDV". Além disso, em "Configurações → Usuários e Acesso", defina quais colaboradores podem excluir vendas utilizando sua própria senha.',
        'Temas & Identidade Visual (Centralizados em Configurações): Os menus de troca de tema foram movidos da barra superior para "Configurações → Temas & Identidade Visual", permitindo alternar entre as paletas visuais mantendo o topo mais limpo.',
        'Logs & Auditoria (Centralizados em Configurações): O histórico imutável de criação, edição, cancelamento e exclusão (antes no topo) agora fica em "Configurações → Logs & Auditoria" com busca por usuário e ação.',
        'Gestão de Dados (Zerar Sistema vs Demo vs MySQL): Em "Configurações → Gestão de Dados", use "Limpar Dados (Zerar Sistema)" para entrar em produção real, "Carregar Dados de Exemplo" para demonstrações, ou baixe o script completo .sql para MySQL.',
        'Backup JSON & Google Drive: Exporte/restaure backups completos em JSON em "Configurações → Backup" ou conecte sua conta na aba "Google Drive" do menu lateral.'
      ],
      tips: [
        'Defina a Senha Mestra de Exclusão no PDV logo na implantação para garantir que apenas o Administrador ou equipe autorizada exclua vendas definitivamente.',
        'No celular, menus administrativos avançados ficam ocultos para manter a operação em campo enxuta e rápida.'
      ],
      rules: [
        'Apenas Administradores acessam a definição de Senha Mestra, restauração de backup e limpeza total da base.',
        'Todas as alterações críticas e exclusões autorizadas geram registro permanente nos Logs de Auditoria.'
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

  const handleDownloadChangelogMd = () => {
    const mdLines: string[] = [
      '# Histórico de Versões e Alterações — FIRE GESTÃO',
      '',
      `Versão Atual: ${SYSTEM_VERSION} (Build ${SYSTEM_BUILD} · ${SYSTEM_RELEASE_DATE})`,
      ''
    ];
    SYSTEM_CHANGELOG.forEach(entry => {
      mdLines.push(`## [${entry.version}] — ${entry.date}`);
      mdLines.push(`**${entry.title}**`);
      mdLines.push('');
      mdLines.push(entry.summary);
      mdLines.push('');
      entry.changes.forEach(ch => {
        mdLines.push(`- **[${ch.category}]** ${ch.description}`);
      });
      mdLines.push('');
    });
    const blob = new Blob([mdLines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `CHANGELOG_${SYSTEM_VERSION}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryBadgeStyle = (category: ChangeCategory) => {
    switch (category) {
      case 'Adicionado':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Corrigido':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Alterado':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Segurança':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Removido':
        return 'bg-rose-50 text-rose-800 border-rose-200';
    }
  };

  const filteredChangelog = SYSTEM_CHANGELOG.map(entry => {
    const q = changelogSearch.trim().toLowerCase();
    const matchingChanges = entry.changes.filter(ch => {
      if (changelogCategoryFilter !== 'Todas' && ch.category !== changelogCategoryFilter) return false;
      if (!q) return true;
      return (
        ch.description.toLowerCase().includes(q) ||
        ch.category.toLowerCase().includes(q) ||
        entry.version.toLowerCase().includes(q) ||
        entry.title.toLowerCase().includes(q)
      );
    });
    return { ...entry, changes: matchingChanges };
  }).filter(entry => entry.changes.length > 0 || (
    changelogCategoryFilter === 'Todas' &&
    (!changelogSearch.trim() ||
      entry.title.toLowerCase().includes(changelogSearch.trim().toLowerCase()) ||
      entry.version.toLowerCase().includes(changelogSearch.trim().toLowerCase()))
  ));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-[#f6eff1] text-[#53383e] flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Manual do Sistema & Documentação de Versões
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#53383e] text-white">
                  {SYSTEM_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Guia operacional completo e registro oficial de todas as versões e alterações do sistema ({SYSTEM_CHANGELOG[SYSTEM_CHANGELOG.length - 1]?.version} até {SYSTEM_VERSION}).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {viewMode === 'changelog' && (
            <button
              type="button"
              onClick={handleDownloadChangelogMd}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#53383e] bg-[#f6eff1] hover:bg-[#ebdce0] border border-[#53383e]/30 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar CHANGELOG.md</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher: Manual vs Changelog */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-0">
        <button
          type="button"
          onClick={() => setViewMode('manual')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            viewMode === 'manual'
              ? 'border-[#53383e] text-[#53383e] bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Manual Operacional ({sections.length} Capítulos)</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('changelog')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            viewMode === 'changelog'
              ? 'border-[#53383e] text-[#53383e] bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Histórico de Versões & Alterações ({SYSTEM_CHANGELOG.length} Versões)</span>
        </button>
      </div>

      {viewMode === 'changelog' ? (
        <div className="space-y-5">
          {/* Current Version Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Versão Atual em Produção</div>
              <div className="text-2xl font-black font-mono text-[#53383e] mt-1">{SYSTEM_VERSION}</div>
              <div className="text-xs text-slate-500 mt-1">Build {SYSTEM_BUILD} · {SYSTEM_RELEASE_DATE}</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Versões Documentadas</div>
              <div className="text-2xl font-black font-mono text-slate-900 mt-1">
                {SYSTEM_CHANGELOG.length} <span className="text-xs font-normal text-slate-500">releases</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Da versão {SYSTEM_CHANGELOG[SYSTEM_CHANGELOG.length - 1]?.version} até {SYSTEM_VERSION}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Total de Alterações Registradas</div>
              <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
                {SYSTEM_CHANGELOG.reduce((acc, e) => acc + e.changes.length, 0)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Adições, correções, segurança e melhorias</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['Todas', 'Adicionado', 'Corrigido', 'Alterado', 'Segurança', 'Removido'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setChangelogCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    changelogCategoryFilter === cat
                      ? 'bg-[#53383e] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="w-full sm:w-72">
              <LiveSearchInput
                value={changelogSearch}
                onChange={setChangelogSearch}
                placeholder="Filtrar versão, PDV, MySQL, Firestore..."
                emptyLabel="Nenhuma versão"
                inputClassName="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#53383e] focus:bg-white"
                getOptions={(query) => {
                  const q = query.toLowerCase();
                  return SYSTEM_CHANGELOG
                    .filter(
                      entry =>
                        entry.version.toLowerCase().includes(q) ||
                        entry.title.toLowerCase().includes(q) ||
                        entry.summary.toLowerCase().includes(q) ||
                        entry.changes.some(ch => ch.description.toLowerCase().includes(q))
                    )
                    .map((entry): LiveSearchOption<ChangelogEntry> => ({
                      id: entry.version,
                      title: `${entry.version} — ${entry.title}`,
                      subtitle: entry.summary,
                      badgeText: entry.date,
                      data: entry
                    }));
                }}
                onSelect={(opt) => setChangelogSearch(opt.data.version)}
              />
            </div>
          </div>

          {/* Releases Timeline */}
          <div className="space-y-4">
            {filteredChangelog.map((entry, idx) => (
              <div key={entry.version} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs ${
                      idx === 0 ? 'bg-[#53383e] text-white' : 'bg-slate-900 text-white'
                    }`}>
                      {entry.version}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{entry.title}</h3>
                    {entry.version === SYSTEM_VERSION && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Versão Atual
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-500">{entry.date}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{entry.summary}</p>

                <div className="space-y-2 pt-1">
                  {entry.changes.map((ch, cIdx) => (
                    <div key={cIdx} className="flex items-start gap-2.5 text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 mt-0.5 ${getCategoryBadgeStyle(ch.category)}`}>
                        {ch.category}
                      </span>
                      <span className="text-slate-800 leading-relaxed">{ch.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
      {/* Search Bar */}
      <LiveSearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Pesquisar por assunto, tela, regra de negócio ou fórmula (ex: PDV, DRE, NF-e, 55%, checklist, parcelas)..."
        emptyLabel="Nenhum capítulo"
        inputClassName="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#53383e] shadow-xs"
        getOptions={(query) => {
          const q = query.toLowerCase();
          return sections
            .filter(
              sec =>
                sec.title.toLowerCase().includes(q) ||
                sec.summary.toLowerCase().includes(q) ||
                sec.badge.toLowerCase().includes(q) ||
                sec.steps.some(st => st.toLowerCase().includes(q)) ||
                sec.rules.some(rl => rl.toLowerCase().includes(q))
            )
            .map((sec): LiveSearchOption<ManualSection> => ({
              id: sec.id,
              title: sec.title,
              subtitle: sec.summary,
              badgeText: sec.badge,
              data: sec
            }));
        }}
        onSelect={(opt) => {
          setSelectedSectionId(opt.data.id);
          setSearchTerm('');
        }}
      />

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
        </>
      )}
    </div>
  );
};
