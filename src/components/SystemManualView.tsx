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
  Download
} from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { SYSTEM_VERSION, SYSTEM_BUILD, SYSTEM_RELEASE_DATE } from '../constants/version';
import { SYSTEM_CHANGELOG, ChangeCategory, ChangelogEntry } from '../constants/changelog';
import { LiveSearchInput, LiveSearchOption } from './LiveSearchInput';

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
        'Detector Anti-Duplicidade Ativo: Se você enviar acidentalmente o mesmo arquivo XML ou planilha, o sistema alertará na hora exibindo a data e os detalhes do envio anterior.',
        'Na aba "Importação Multi-Formato & Backup", você pode trazer dados legados em CSV, XLSX, TXT, PDF, XML e SQL com exemplos prontos.',
        'Você pode conferir e ajustar as margens antes de confirmar a importação do XML.'
      ],
      rules: [
        'Proteção contra Upload Duplicado: O sistema calcula a assinatura SHA-256 e confere Chave da NF-e / Número / CNPJ / Tamanho para prevenir duplicidades.',
        'Se um arquivo duplicado for detectado, o sistema oferece as opções de cancelar ou reprocessar com segurança.',
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
        'Acesse "Configurações > Logs & Auditoria" no menu lateral para auditar qualquer criação, edição ou exclusão de dados feita pelos usuários.',
        'Você pode baixar o arquivo zip completo do sistema a qualquer momento para backup local offline.'
      ],
      tips: [
        'Recomenda-se realizar o backup semanal para garantir a integridade dos dados históricos.',
        'Apenas administradores têm permissão para restaurar backups e limpar bases de dados.'
      ],
      rules: [
        'Toda ação crítica de exclusão ou alteração de preço gera um registro inalterável de auditoria.'
      ]
    },
    {
      id: 'google_agenda',
      title: '10. Google Agenda & Agendamento de Serviços e Visitas Técnicas',
      badge: 'Integração Google',
      icon: Calendar,
      targetTab: 'agenda',
      summary: 'Como conectar a agenda corporativa com o Google Calendar, agendar visitas de campo, serviços técnicos em piscinas e bombas, e gerenciar dados fictícios de exemplo.',
      steps: [
        'Autenticação & Validação Google: No menu lateral, acesse "Google Agenda" e clique em "Conectar & Validar Conta Google". O sistema abre a tela oficial de validação onde você informa seu e-mail (mppiscina2004@gmail.com) e credenciais, validando a integração diretamente sem bloqueios de domínio ("auth/unauthorized-domain").',
        'Novo Agendamento: Clique em "+ Novo Agendamento" para cadastrar visitas técnicas, serviços especializados, compromissos diários ou entregas.',
        'Vínculo com Ordens de Serviço: Ao selecionar uma OS cadastrada, o sistema preenche automaticamente cliente, endereço e detalhes técnicos no agendamento.',
        'Agendamento Direto na Tela de OS: Na tela "Ordens de Serviço", clique no botão "Agendar" na coluna de Ações para criar o evento correspondente em 1 clique.',
        'Sincronização em Tempo Real: Clique em "Sincronizar Google Agenda" para enviar agendamentos pendentes diretamente para sua agenda remota da nuvem.',
        'Notificação via WhatsApp: Em cada compromisso agendado, você conta com o botão verde "WhatsApp" para disparar instantaneamente a confirmação de data e horário ao cliente.',
        'Gestão e Limpeza de Dados: A limpeza de dados fictícios está centralizada no menu "Configurações > Gestão de Dados", garantindo que a base seja zerada com total segurança operacional.'
      ],
      tips: [
        'Agendamentos sincronizados com o Google Agenda notificam a equipe técnica automaticamente via alertas no celular.',
        'Ao agendar uma OS, o endereço completo da residência ou condomínio é automaticamente formatado no evento do Google Calendar com link para navegação GPS (Google Maps / Waze).',
        'Se você utiliza banco de dados MySQL, acesse "Configurações > Gestão de Dados" para baixar o script de carga completo .sql compatível com MySQL 5.7 / 8.0 e charset utf8mb4.'
      ],
      rules: [
        'Exclusões de compromissos que estejam sincronizados com o Google Agenda requerem confirmação explícita na tela para evitar perdas acidentais.'
      ]
    },
    {
      id: 'whatsapp_integracao',
      title: '11. Integração com WhatsApp & Notificações Rápidas',
      badge: 'Comunicação',
      icon: MessageSquare,
      targetTab: 'configuracoes',
      summary: 'Como configurar e usar o WhatsApp integrado para envio de orçamentos, confirmação de visitas, aprovação e conclusão de OS com garantia, cobrança PIX e comprovantes.',
      steps: [
        'Configurações Iniciais: Acesse "Configurações" no menu lateral e clique na aba "Integração WhatsApp". Informe o Telefone Comercial com DDD (ex: 11 99999-8888) e a Chave PIX Padrão.',
        'Modelos de Mensagem: O sistema já possui 6 modelos profissionais pré-configurados: Orçamento de OS, OS Aprovada, OS Concluída com Garantia, Visita Técnica Agendada, Cobrança com Chave Pix e Comprovante de Venda/PDV.',
        'Personalização de Textos: Você pode editar e criar novos modelos na tela de configurações, utilizando variáveis dinâmicas como {cliente_nome}, {os_numero}, {valor_total}, {chave_pix}, {data}, {horario} e {garantia}.',
        'Envio em 1 Clique em Ordens de Serviço: Na tela de "Ordens de Serviço", clique no botão verde "WhatsApp" na coluna de Ações. O modal abrirá com o modelo apropriado pré-selecionado e as variáveis substituídas.',
        'Envio em 1 Clique na Google Agenda: Na tela de "Google Agenda", cada card de visita ou serviço técnico possui o botão "WhatsApp" para avisar o cliente sobre o horário agendado.',
        'Disparo Direto: Clique em "Abrir & Enviar no WhatsApp". O sistema abre o WhatsApp Web no computador ou o aplicativo nativo no celular/tablet, com o número do cliente formatado internacionalmente (+55) e o texto pronto para envio.'
      ],
      tips: [
        'Você pode editar o texto da mensagem no próprio modal antes de disparar, adicionando observações personalizadas para o cliente.',
        'Se o WhatsApp Web não abrir diretamente no seu navegador, você pode usar o botão "Copiar Texto" e colar manualmente na conversa do WhatsApp.',
        'Não há cobrança por mensagem nem necessidade de aprovação de templates por terceiros, funcionando 100% de forma direta e gratuita via protocolo web/app.'
      ],
      rules: [
        'O número do cliente é sanitizado automaticamente pelo sistema: pontuações, espaços e parênteses são removidos e o código do Brasil (+55) é inserido caso omitido.',
        'As mensagens com termos de garantia informam formalmente os prazos de cobertura conforme o Código de Defesa do Consumidor e termos da empresa.'
      ]
    },
    {
      id: 'gestao_dados_limpeza',
      title: '12. Gestão de Dados: Limpar Dados (Zerar Sistema), Restaurar Exemplos & Backups',
      badge: 'Administração',
      icon: Database,
      targetTab: 'configuracoes',
      summary: 'Centralização das ferramentas de controle de base de dados: como zerar o sistema para entrar em produção real, como restaurar dados de demonstração e como recuperar backups.',
      steps: [
        'Localização Centralizada: Todos os comandos de controle de dados e exportação SQL MySQL estão centralizados em "Configurações > Gestão de Dados" para segurança operacional.',
        'Sincronização em Tempo Real (PC ↔ Celular): Todos os produtos, clientes, fornecedores, ordens de serviço, vendas e movimentações de caixa são sincronizados automaticamente na nuvem via Firestore.',
        'Botão "Limpar Dados (Zerar Sistema)": Use esta opção quando estiver pronto para colocar o sistema em PRODUÇÃO REAL. Ela zera todos os registros de exemplo (clientes, fornecedores, produtos, OS, vendas, agenda, caixa e despesas).',
        'Confirmação Segura: Ao clicar em "Limpar Dados", uma janela de confirmação é exibida explicando exatamente o que será zerado.',
        'Botão "Restaurar Dados de Exemplo": Para demonstrações e treinamentos, recarrega instantaneamente toda a base padrão de exemplo.',
        'Exportação SQL para MySQL: Permite baixar o script .sql completo compatível com MySQL 5.7 / 8.0 (charset utf8mb4).'
      ],
      tips: [
        'Após zerar o sistema, você pode começar cadastrando seus Fornecedores e Produtos importando diretamente os XMLs das notas fiscais.',
        'O detector anti-duplicidade evita que o mesmo XML ou planilha seja importado duas vezes por engano.'
      ],
      rules: [
        'A ação de "Limpar Dados" reinicia os contadores de sequência de OS e Vendas para o número inicial 1.',
        'Toda operação de limpeza e restauração de dados gera um registro de auditoria com data, hora e usuário responsável.'
      ]
    },
    {
      id: 'pdv_frente_caixa',
      title: '13. PDV / Frente de Caixa & Baixa Unificada de Recebimentos',
      badge: 'PDV / Caixa',
      icon: Store,
      targetTab: 'pdv',
      summary: 'Fluxo completo de caixa para recebimento e baixa de todas as Vendas Diretas e Ordens de Serviço, com abertura/fechamento de turno, suprimento, sangria e comprovante.',
      steps: [
        'Abertura de Caixa: Acesse "PDV / Caixa" no menu lateral ou no cabeçalho superior, clique em "Abrir Caixa PDV", escolha o terminal (Caixa 01, Caixa 02, Caixa 03 ou PDV Móvel) e informe o Fundo de Troco inicial em dinheiro.',
        'Fila de Recebimentos: Todas as Vendas Diretas e Ordens de Serviço com pagamento pendente aparecem automaticamente na Fila do Caixa.',
        'Receber no Caixa: Clique em "Receber no Caixa" em qualquer OS ou Venda. Selecione pagamento único ou "Dividir Pagamento" (Multi-Split), informe dinheiro recebido (com cálculo automático de troco), PIX ou cartão com bandeira e parcelas (1x a 12x).',
        'Balcão PDV Rápido: Monte vendas de balcão buscando produtos por nome, código ou código de barras, alternando tabela Varejo/Atacado e finalizando direto para o caixa.',
        'Suprimento e Sangria: Registre reforços de troco ou retiradas para cofre mantendo o saldo esperado em gaveta sempre exato.',
        'Fechamento de Caixa: Ao encerrar o turno, clique em "Fechar Caixa", informe o valor contado na gaveta e confira automaticamente se houve diferença (sobra/falta).'
      ],
      tips: [
        'Após cada baixa no caixa, é possível imprimir o Comprovante de Recebimento térmico ou baixá-lo em HTML.',
        'Você também pode encaminhar uma OS ou Venda para a fila de um terminal específico diretamente pelo botão "Cobrar (PDV)" nas telas de OS e Vendas.'
      ],
      rules: [
        'Cada recebimento liquidado no PDV gera uma movimentação vinculada à sessão aberta do caixa e sincroniza em tempo real entre computador e celular.',
        'Taxas de operadoras de cartão são descontadas automaticamente para apuração do valor líquido recebido.'
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
      '# Histórico de Versões e Alterações — GestãoPro ERP',
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
