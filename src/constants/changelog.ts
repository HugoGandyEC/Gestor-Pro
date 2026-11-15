export type ChangeCategory = 'Adicionado' | 'Corrigido' | 'Alterado' | 'Segurança' | 'Removido';

export interface ChangelogItem {
  category: ChangeCategory;
  description: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  summary: string;
  highlights: string[];
  changes: ChangelogItem[];
}

export const SYSTEM_CHANGELOG: ChangelogEntry[] = [
  {
    version: 'v2.7.7',
    date: '14/11/2026',
    title: 'Alteração de Status e Data de Entrega dos Serviços na Tela de Ordens de Serviço',
    summary:
      'Adicionados controles completos na tela de Ordens de Serviço para alterar o status diretamente na listagem, na modal de detalhes (+), em modal rápida dedicada e no cadastro/edição da OS, com registro específico da Data de Entrega dos Serviços e Previsão de Entrega.',
    highlights: [
      'Seletor rápido de Status e botão da coluna Entrega Serviços diretamente na listagem em linha única de OS',
      'Modal rápida "Alterar Status & Entrega" ao concluir/finalizar ou clicar na data de entrega',
      'Painel inline de edição de Status, Previsão e Data de Entrega dentro da modal (+) de detalhes da OS',
      'Campos dedicados de Status, Previsão e Data de Entrega dos Serviços na modal de Nova/Editar OS e na ficha A4 impressa'
    ],
    changes: [
      {
        category: 'Adicionado',
        description:
          'Adicionado seletor de alteração rápida de Status na tabela de Ordens de Serviço (ServiceOrdersView), coluna clicável "Entrega Serviços", filtros completos para todos os status (incluindo Aprovação, Aguardando Peças e Canceladas) e modal rápida "Alterar Status & Entrega" com botão "Hoje".'
      },
      {
        category: 'Adicionado',
        description:
          'Incluído editor de Status da OS, Previsão de Entrega e Data de Entrega dos Serviços na modal completa (+) da Ordem de Serviço e na modal de abertura/edição de OS.'
      },
      {
        category: 'Alterado',
        description:
          'Atualizados o modelo de impressão A4 (ServiceOrderPrintTemplate) e a exportação HTML de OS para exibirem a Data de Entrega dos Serviços no bloco Prazos e Responsável.'
      }
    ]
  },
  {
    version: 'v2.7.6',
    date: '14/11/2026',
    title: 'Listas Abreviadas em Linha Única com Botão (+) para Modal Completa de Dados',
    summary:
      'Reversão dos cartões empilhados, gavetas abaixo da linha e tooltips flutuantes (hover), padronizando todas as listagens do sistema no formato lista abreviada em linha única com botão (+) que abre todos os dados completos do registro em uma janela modal.',
    highlights: [
      'Remoção de tooltips flutuantes (hover), gavetas abaixo da linha e cards empilhados multi-linha',
      'Formato lista rigorosamente em 1 linha única (white-space: nowrap) com dados essenciais abreviados',
      'Botão (+) padronizado em cada registro abrindo a Modal Completa (<RecordDetailModal />) com todos os dados e ações',
      'Aplicado em Ordens de Serviço, Clientes, Produtos & Estoque, Vendas, Fornecedores, Equipe, Frota e Serviços'
    ],
    changes: [
      {
        category: 'Removido',
        description:
          'Removido o componente <RowHoverDetail />, removidas as gavetas expansíveis abaixo das linhas de O.S. (#os-drawer-*), removidos os blocos em cards empilhados (md:hidden) e eliminadas células com quebra de segunda linha nas tabelas.'
      },
      {
        category: 'Adicionado',
        description:
          'Criado componente global <RecordDetailModal /> (src/components/RecordDetailModal.tsx), classe .list-plus-btn em src/index.css e controlador Vanilla JS setupListDetailModals em src/utils/uiPatterns.ts.'
      },
      {
        category: 'Alterado',
        description:
          'Padronizadas todas as listagens em formato lista abreviada de linha única (.dense-table / .dense-row) com botão (+) abrindo todos os dados completos e ações rápidas em modal nas telas de Ordens de Serviço, Clientes, Produtos & Estoque, Vendas, Fornecedores e Cadastro Geral.'
      }
    ]
  },
  {
    version: 'v2.7.5',
    date: '14/11/2026',
    title: 'Padronização Global de Tabelas Compactas, Hover de Detalhes e O.S. em Linha Única Expansível (+)',
    summary:
      'Refatoração completa de UX/UI nas telas de Ordens de Serviço, Clientes, Produtos & Estoque, Vendas Diretas, Fornecedores e Equipe/Funcionários: tabelas densas compactas com card flutuante de detalhes ao passar o mouse (hover), listagem de O.S. em linha única com nome completo do cliente + card expansível (+), cards empilhados no mobile sem scroll horizontal e busca dinâmica em Vendas.',
    highlights: [
      'Ordens de Serviço em linha única compacta com nome completo do cliente sem cortes e botão card expansível (+)',
      'Gaveta expansível na própria linha da OS exibindo técnico, veículo, equipamento, serviços, peças, parcelas e ações rápidas',
      'Tabelas compactas (.dense-table) com card flutuante (<RowHoverDetail />) em Clientes, Produtos, Vendas, Fornecedores e Equipe',
      'Cards empilhados no mobile (< 768px) com área de toque >= 44px e campo LiveSearchInput no Histórico de Vendas'
    ],
    changes: [
      {
        category: 'Adicionado',
        description:
          'Criado componente React <RowHoverDetail /> (src/components/RowHoverDetail.tsx) com React Portal seguro contra cortes de overflow, e utilitários modulares Vanilla JS setupExpandableServiceOrders e setupDenseRowTooltips (src/utils/uiPatterns.ts) com classes CSS padronizadas (.dense-table, .hover-detail-card, .os-compact-row, .os-expand-card-btn, .os-expanded-drawer, .os-mobile-stack).'
      },
      {
        category: 'Alterado',
        description:
          'Refatorada a listagem de Ordens de Serviço (ServiceOrdersView) para exibir estritamente 1 linha compacta por OS no desktop (ID curto, status, data, nome completo do cliente/responsável sem truncate, total e botão card +), além de cards empilhados responsivos no mobile com botão + >= 44px.'
      },
      {
        category: 'Alterado',
        description:
          'Compactadas as tabelas de Clientes (ClientsView), Produtos & Estoque (ProductsAndStockView), Vendas Diretas (SalesView), Fornecedores (SuppliersView) e Cadastro Geral / Equipe & Técnicos (MasterRegistrationsView), exibindo dados completos ao passar o mouse (hover) e cards empilhados no celular.'
      },
      {
        category: 'Adicionado',
        description:
          'Incluída barra de Busca Dinâmica (<LiveSearchInput />) diretamente no cabeçalho do Histórico de Vendas Faturadas (SalesView) para filtrar pedidos em tempo real por código, cliente ou vendedor.'
      }
    ]
  },
  {
    version: 'v2.7.4',
    date: '14/11/2026',
    title: 'Padronização Global de Busca Dinâmica em Tempo Real (Desktop e Mobile)',
    summary:
      'Implementação padronizada de Busca Dinâmica com Lista Suspensa (Autocomplete/Dropdown) em todos os campos de busca e pesquisa do sistema, com debounce de 300ms, ativação a partir de 2 caracteres, navegação completa por teclado e responsividade móvel travada ao viewport.',
    highlights: [
      'Componente global LiveSearchInput + utilitário modular Vanilla JS setupLiveSearch (.global-search-container)',
      'Ativação automática com >= 2 caracteres, debounce mínimo de 300ms e estado visual de carregamento (Buscando...)',
      'Navegação por teclado (ArrowDown, ArrowUp, Enter, Escape), fechamento ao clicar fora e destaque do termo buscado',
      'CSS mobile-first com largura segura (100% / max-width: calc(100vw - 1rem)), altura máxima 60vh e tap targets >= 44px'
    ],
    changes: [
      {
        category: 'Adicionado',
        description:
          'Criado padrão global de estilos responsivos (.global-search-container, .search-modal, .search-item, .search-highlight) em src/index.css com z-index 1050, rolagem interna max-height: 60vh no mobile e áreas de toque mínimas de 48px-52px.'
      },
      {
        category: 'Adicionado',
        description:
          'Implementado utilitário framework-agnostic setupLiveSearch (src/utils/liveSearch.ts) com AbortController, debounce >= 300ms, cache de requisições, Escape/clique fora e template HTML reutilizável (LIVE_SEARCH_HTML_TEMPLATE).'
      },
      {
        category: 'Adicionado',
        description:
          'Criado componente React reutilizável LiveSearchInput (src/components/LiveSearchInput.tsx) com thumbnail, título destacado, subtítulo, preço/valor alinhado à direita e mensagem amigável de nenhum resultado encontrado.'
      },
      {
        category: 'Alterado',
        description:
          'Substituídos todos os campos de busca do sistema (PDV Balcão e Fila, Vendas Diretas, Produtos & Estoque, Clientes, Ordens de Serviço, Fornecedores, Financeiro, Painel do Técnico, Cadastro Geral, Google Agenda, Custos Iniciais, Manual, Ajuda, Google Drive e Busca XML Gmail) pelo padrão global LiveSearchInput, removendo overflow-hidden de containers pais para evitar cortes no dropdown.'
      }
    ]
  },
  {
    version: 'v2.7.3',
    date: '14/11/2026',
    title: 'Calculadora de Parcelas e Edição Individual de Pagamentos na Modal de OS',
    summary:
      'Atualização da modal de Ordem de Serviço para calcular automaticamente o total líquido e dividir entrada e parcelas com datas escalonadas, permitindo editar manualmente data, tipo (Entrada/Parcela/À Vista), forma de pagamento (ex: Dinheiro) e data específica de quitação em cada lançamento.',
    highlights: [
      'Calculadora automática de Entrada + divisão exata em parcelas com cálculo de taxas e líquido',
      'Edição individual de tipo (Entrada / Parcela / À Vista), data de vencimento, forma e valor por linha',
      'Marcação de status Pago com data específica de recebimento (ex: parcela em dinheiro paga em tal dia)',
      'Sincronização com impressão A4 da OS, exportação HTML e pré-carregamento no PDV Caixa'
    ],
    changes: [
      {
        category: 'Adicionado',
        description:
          'Calculadora Automática de Entrada & Parcelamento na modal de Ordem de Serviço (ServiceOrdersView) com divisão exata em centavos, intervalo de dias configurável e pré-visualização instantânea.'
      },
      {
        category: 'Adicionado',
        description:
          'Editor individual por parcela permitindo alterar tipo (Entrada / Parcela / À Vista), forma de pagamento (PIX, Dinheiro, Cartão, Boleto, Faturado), data de vencimento, valor, observação e status Pago com campo de data específica de pagamento (paidAt).'
      },
      {
        category: 'Alterado',
        description:
          'Estendido o tipo PaymentSplit (src/types.ts), o comprovante de impressão A4 (ServiceOrderPrintTemplate), a exportação HTML e o checkout do PDV (PdvView) para refletirem valores já quitados em entrada/parcelas e as condições programadas.'
      }
    ]
  },
  {
    version: 'v2.7.2',
    date: '14/11/2026',
    title: 'Ampliação de 15% na Tipografia Global para Computador',
    summary:
      'Aumento proporcional de 15% em todos os textos do sistema exclusivamente para telas de computador (>= 1024px), melhorando a legibilidade sem alterar a visualização mobile nem a impressão A4.',
    highlights: [
      'Aumento global de +15% em títulos, rótulos, tabelas, campos e textos no desktop',
      'Preservação integral do layout responsivo no celular e da escala de impressão'
    ],
    changes: [
      {
        category: 'Alterado',
        description:
          'Aplicada escala tipográfica de +15% em todas as variáveis de tamanho de fonte (--text-xs até --text-5xl), texto base do corpo e classes de fonte fixa para visualização em telas de computador (@media screen and (min-width: 1024px)).'
      }
    ]
  },
  {
    version: 'v2.7.1',
    date: '14/11/2026',
    title: 'Atalho de Cadastro Rápido de Cliente (Modal) no PDV',
    summary:
      'Adicionado atalho direto no PDV (cabeçalho e Balcão PDV Rápido) para abrir janela modal de cadastro rápido de cliente, com definição de Varejista/Atacadista, consulta de CNPJ/CEP e seleção automática na venda.',
    highlights: [
      'Botão "Novo Cliente" no cabeçalho do PDV e botão "Cadastrar" ao lado da busca no Balcão PDV',
      'Cadastro rápido com escolha PF/PJ, perfil Varejista/Atacadista e busca automática de CNPJ e CEP',
      'Seleção automática do cliente recém-cadastrado e liberação imediata de atacado se Atacadista'
    ],
    changes: [
      {
        category: 'Adicionado',
        description:
          'Atalho e janela modal "Cadastro Rápido de Cliente (PDV)" acessíveis pelo cabeçalho do PDV, pelo botão "Cadastrar" no carrinho e quando a busca não encontrar um cliente.'
      },
      {
        category: 'Alterado',
        description:
          'addClient no AppContext agora retorna o cliente recém-criado para selecioná-lo automaticamente no Balcão PDV Rápido logo após salvar.'
      }
    ]
  },
  {
    version: 'v2.7.0',
    date: '14/11/2026',
    title: 'Liberação de Preços de Atacado Exclusiva para Clientes Atacadistas',
    summary:
      'Inclusão da classificação comercial do cliente (Varejista ou Atacadista) em todos os cadastros e bloqueio automático da tabela de atacado no PDV e em Vendas Diretas até a busca e seleção de um cliente cadastrado como Atacadista.',
    highlights: [
      'Campo Tipo de Cliente (Varejista vs Atacadista) nos cadastros, filtros e importações',
      'Busca rápida de cliente por nome, CPF/CNPJ ou telefone no PDV e em Vendas Diretas',
      'Tabela Atacado bloqueada automaticamente para vendas balcão e clientes varejistas'
    ],
    changes: [
      {
        category: 'Adicionado',
        description:
          'Adicionado o campo Tipo de Cliente (Varejista / Atacadista) no modelo Client, no Cadastro de Clientes (ClientsView), no Cadastro Geral (MasterRegistrationsView), na importação CSV/Universal, no schema Firebase e na exportação MySQL.'
      },
      {
        category: 'Adicionado',
        description:
          'Adicionado filtro por perfil comercial (Todos, Varejo, Atacado) e indicador visual na listagem de clientes.'
      },
      {
        category: 'Alterado',
        description:
          'No Balcão PDV Rápido (PdvView) e em Vendas Diretas (SalesView), adicionada busca rápida de clientes e bloqueio da tabela de Atacado enquanto um cliente cadastrado como Atacadista não for buscado e selecionado.'
      },
      {
        category: 'Corrigido',
        description:
          'Ao trocar de cliente atacadista para varejista ou consumidor balcão no PDV ou em Vendas, os preços do carrinho/itens são automaticamente revertidos para a tabela de Varejo.'
      }
    ]
  },
  {
    version: 'v2.6.4',
    date: '14/11/2026',
    title: 'Ajuste Tipográfico na Chamada da Tela de Login',
    summary:
      'Redução da escala de fonte de "Controle em tempo real." posicionando-o logo abaixo do título principal "Gestão completa." para maior destaque hierárquico.',
    highlights: [
      'Título principal "Gestão completa." em destaque acima de "Controle em tempo real."'
    ],
    changes: [
      {
        category: 'Alterado',
        description:
          'Diminuído o tamanho da fonte do texto "Controle em tempo real." e posicionado como subtítulo diretamente abaixo de "Gestão completa." na tela de login.'
      }
    ]
  },
  {
    version: 'v2.6.3',
    date: '14/11/2026',
    title: 'Limpeza Visual no Bloco de Marca da Tela de Login',
    summary:
      'Remoção da linha secundária com dado da empresa exibida abaixo do nome principal ao lado da logo na tela de login, mantendo o visual mais limpo.',
    highlights: [
      'Apenas logo e nome principal no cabeçalho de marca do login'
    ],
    changes: [
      {
        category: 'Removido',
        description:
          'Retirado o dado secundário da empresa (razão social) exibido abaixo do nome da empresa ao lado da logo na tela de login (LoginView).'
      }
    ]
  },
  {
    version: 'v2.6.2',
    date: '14/11/2026',
    title: 'Exibição de Endereço no Login & Detalhamento Completo de Mini-Alterações',
    summary:
      'Substituição do CNPJ pelo endereço completo cadastrado da empresa na tela de acesso e expansão do histórico de versões para registrar individualmente cada ajuste e correção aplicada ao sistema.',
    highlights: [
      'Endereço completo da empresa exibido na tela de login no lugar do CNPJ',
      'Histórico granular detalhando cada mini-alteração desde a v1.0.0 até a v2.6.2'
    ],
    changes: [
      {
        category: 'Alterado',
        description:
          'Removida a exibição do CNPJ na tela de login (LoginView), passando a mostrar o endereço completo cadastrado (rua, número, bairro, cidade/UF e CEP) junto ao telefone da empresa.'
      },
      {
        category: 'Adicionado',
        description:
          'Detalhadas todas as mini-alterações (patches v2.0.1, v2.0.2, v2.4.1, v2.4.2, v2.4.3, v2.6.1 e v2.6.2) no Changelog oficial e na aba Histórico de Versões dentro do sistema.'
      }
    ]
  },
  {
    version: 'v2.6.1',
    date: '14/11/2026',
    title: 'Redesign da Tela de Login (Fundo Azul Escuro, Fontes Maiores & Logo da Empresa)',
    summary:
      'Reformulação visual completa da tela de login inspirada em layout moderno de duas colunas com tema azul escuro, fontes ampliadas para melhor leitura e exibição da logo cadastrada da empresa.',
    highlights: [
      'Fundo em azul escuro com cartão translúcido dark',
      'Fontes ampliadas nos títulos, rótulos, campos e botões',
      'Logo da empresa cadastrada exibida ao lado do formulário'
    ],
    changes: [
      {
        category: 'Alterado',
        description:
          'Alterado o fundo da tela de login para azul escuro com gradiente suave e aplicado tema escuro de alto contraste no cartão de autenticação e nos campos de entrada.'
      },
      {
        category: 'Alterado',
        description:
          'Aumentado o tamanho das fontes da tela de login (título principal, subtítulo, cabeçalho do cartão, rótulos de usuário/senha, caixas de texto e botão de entrada).'
      },
      {
        category: 'Adicionado',
        description:
          'Layout dividido em duas colunas exibindo a logo cadastrada da empresa ao lado do cartão de login (com fallback elegante em monograma caso não haja imagem configurada).'
      },
      {
        category: 'Corrigido',
        description:
          'Substituído o alerta nativo de navegador em "Esqueceu a senha?" por aviso integrado dentro do próprio cartão de login.'
      }
    ]
  },
  {
    version: 'v2.6.0',
    date: '14/11/2026',
    title: 'Documentação Completa de Alterações & Alinhamento de Versionamento',
    summary:
      'Padronização semântica das versões do sistema desde a implantação inicial, criação do Changelog oficial, atualização do Manual do Sistema (com capítulo do PDV) e unificação da versão em todos os módulos.',
    highlights: [
      'Changelog oficial estruturado (CHANGELOG.md)',
      'Nova aba "Histórico de Versões" no Manual do Sistema',
      'Capítulo completo de PDV / Frente de Caixa no Manual'
    ],
    changes: [
      {
        category: 'Adicionado',
        description:
          'Criado o arquivo CHANGELOG.md na raiz do projeto documentando todas as versões e evoluções cronológicas do GestãoPro ERP.'
      },
      {
        category: 'Adicionado',
        description:
          'Adicionada a aba interativa "Histórico de Versões & Changelog" em Ajuda & Manual com busca textual, filtro por tipo de alteração e exportação em Markdown/Impressão.'
      },
      {
        category: 'Adicionado',
        description:
          'Incluído o Capítulo 13 no Manual do Sistema detalhando o fluxo completo do PDV / Frente de Caixa.'
      },
      {
        category: 'Alterado',
        description:
          'Alinhado o versionamento em version.ts, package.json, rodapé, tela de login, barra lateral, especificação de arquitetura e modal de ajuda.'
      },
      {
        category: 'Alterado',
        description:
          'Atualizado o Capítulo 12 do Manual do Sistema removendo referências aos antigos botões de download JSON e .ZIP retirados da tela de Configurações.'
      }
    ]
  },
  {
    version: 'v2.5.0',
    date: '14/11/2026',
    title: 'Módulo PDV / Frente de Caixa & Baixa Unificada de Vendas e OS',
    summary:
      'Implantação do Ponto de Venda (PDV) completo para que todas as Vendas Diretas e Ordens de Serviço passem pelo caixa para conferência, baixa de valores recebidos, emissão de comprovante e fechamento de turno.',
    highlights: [
      'Abertura, Suprimento, Sangria e Fechamento de Caixa',
      'Fila unificada de recebimentos para OS e Vendas Diretas',
      'Balcão PDV Rápido com carrinho, desconto e busca por código de barras',
      'Pagamento único ou dividido (Multi-Split) com cálculo de troco e taxas'
    ],
    changes: [
      {
        category: 'Adicionado',
        description:
          'Criada a tela dedicada "PDV / Caixa" (PdvView) acessível pelo menu lateral (OPERAÇÕES) e atalho rápido no cabeçalho superior, com contador dinâmico de títulos na fila.'
      },
      {
        category: 'Adicionado',
        description:
          'Implementado controle completo de sessões de caixa (CashRegisterSession) com Abertura de Caixa, seleção de terminal (Caixa 01, Caixa 02, Caixa 03, PDV Móvel) e fundo inicial de troco.'
      },
      {
        category: 'Adicionado',
        description:
          'Adicionadas operações de Suprimento e Sangria, extrato detalhado por forma de pagamento e Fechamento de Caixa com conferência entre saldo esperado e contado na gaveta.'
      },
      {
        category: 'Adicionado',
        description:
          'Criado modo "Balcão PDV Rápido" com tabela Varejo/Atacado, carrinho, descontos em R$/% e envio para fila ou liquidação imediata com baixa de estoque.'
      },
      {
        category: 'Adicionado',
        description:
          'Emissão de Comprovante de Caixa (cupom não fiscal) com código NSU, troco, formas de pagamento, impressão térmica e download em HTML.'
      },
      {
        category: 'Alterado',
        description:
          'Telas de Vendas Diretas e Ordens de Serviço integradas às ações reais do caixa (sendSaleToPdv, settleSaleInPdv, sendOrderToPdv, settleServiceOrderInPdv), sincronizadas em nuvem no Firestore.'
      }
    ]
  },
  {
    version: 'v2.4.3',
    date: '13/11/2026',
    title: 'Remoção de Backup JSON, Restauração e Download .ZIP em Configurações',
    summary:
      'Simplificação da tela de Configurações removendo ferramentas manuais de backup/restauração em JSON e download de código-fonte .ZIP.',
    highlights: [
      'Remoção de Download de Backup (JSON)',
      'Remoção de Restaurar de Arquivo de Backup e Código-Fonte (.ZIP)'
    ],
    changes: [
      {
        category: 'Removido',
        description:
          'Removidos da tela de Configurações os botões e painéis de Download de Backup (JSON), Restaurar de Arquivo de Backup e Código-Fonte & Arquivos (.ZIP).'
      }
    ]
  },
  {
    version: 'v2.4.2',
    date: '13/11/2026',
    title: 'Correção da Visibilidade de Produtos Cadastrados entre PC e Celular',
    summary:
      'Ajuste no motor de sincronização Firestore para garantir que todo produto cadastrado no computador apareça imediatamente no celular.',
    highlights: [
      'Higienização de propriedades undefined antes do envio ao Firestore',
      'Carga inicial e escuta contínua de produtos garantida em ambos os dispositivos'
    ],
    changes: [
      {
        category: 'Corrigido',
        description:
          'Corrigido problema em que produtos cadastrados no computador não apareciam no celular devido a campos opcionais undefined rejeitados pelo Firestore (aplicada função stripUndefined e listeners em tempo real).'
      }
    ]
  },
  {
    version: 'v2.4.1',
    date: '12/11/2026',
    title: 'Persistência da Tela Atual ao Atualizar o Navegador (F5 / Reload)',
    summary:
      'Garantia de permanência na mesma tela em uso quando o usuário recarrega ou atualiza o sistema.',
    highlights: [
      'Rota ativa preservada via hash (#aba) e localStorage'
    ],
    changes: [
      {
        category: 'Corrigido',
        description:
          'Corrigido comportamento que voltava para o Dashboard ao atualizar a página: o sistema agora salva a aba ativa na URL (#rota) e no localStorage, mantendo exatamente na mesma tela após atualização.'
      }
    ]
  },
  {
    version: 'v2.4.0',
    date: '12/11/2026',
    title: 'Sincronização em Tempo Real entre Computador e Celular',
    summary:
      'Implantação da sincronização em nuvem e entre abas para que computador e celular operem como o mesmo sistema espelhado.',
    highlights: [
      'Sincronização em tempo real via Firebase Firestore (onSnapshot)',
      'Espelhamento instantâneo entre abas locais via BroadcastChannel'
    ],
    changes: [
      {
        category: 'Adicionado',
        description:
          'Implementada sincronização em nuvem (Firestore) para produtos, clientes, fornecedores, ordens de serviço e agendamentos, unificando a base visualizada no computador e no celular.'
      },
      {
        category: 'Adicionado',
        description:
          'Adicionado BroadcastChannel e listener de eventos storage para sincronização imediata entre múltiplas abas abertas.'
      }
    ]
  },
  {
    version: 'v2.3.0',
    date: '10/11/2026',
    title: 'Atualização Geral de Dependências & Remoção de Vulnerabilidades',
    summary:
      'Atualização completa dos pacotes do sistema para as versões mais atuais e eliminação de vulnerabilidades de segurança conhecidas.',
    highlights: [
      'Stack atualizada: React 19, Vite 8, TypeScript 7, Tailwind CSS 4 e Firebase 13',
      'Eliminação de vulnerabilidades em xlsx, express e @grpc/grpc-js'
    ],
    changes: [
      {
        category: 'Alterado',
        description:
          'Atualizadas todas as dependências do projeto para as versões mais atuais (React 19, Vite 8.3, @tailwindcss/vite 4.3, TypeScript 7.0, Firebase 13.2, jsPDF 4.2, lucide-react e @google/genai 2.4).'
      },
      {
        category: 'Segurança',
        description:
          'Removidas vulnerabilidades de dependências substituindo xlsx pelo pacote seguro @e965/xlsx, atualizando express e aplicando override seguro de @grpc/grpc-js.'
      }
    ]
  },
  {
    version: 'v2.2.0',
    date: '08/11/2026',
    title: 'Contagem de Páginas & Paginação em Produtos, OS, Clientes e Fornecedores',
    summary:
      'Adição de barra de paginação com contagem total de páginas e seletor de registros por página nas principais listagens cadastrais e operacionais.',
    highlights: [
      'Componente TablePagination com contagem "Página X de Y"',
      'Aplicado em Produtos, Ordens de Serviço, Clientes e Fornecedores'
    ],
    changes: [
      {
        category: 'Adicionado',
        description:
          'Criado componente TablePagination exibindo página atual, contagem total de páginas, faixa de itens exibidos e seletor de itens por página.'
      },
      {
        category: 'Adicionado',
        description:
          'Adicionada a contagem e navegação de páginas nas telas de Produtos, Ordens de Serviço, Cadastro de Clientes e Cadastro de Fornecedores.'
      }
    ]
  },
  {
    version: 'v2.1.0',
    date: '05/11/2026',
    title: 'Detector Anti-Duplicidade de Uploads (XML NF-e e Demais Cadastros)',
    summary:
      'Identificação e sinalização automática ao tentar fazer upload do mesmo arquivo tanto em XML de NF-e quanto nos demais cadastros via upload.',
    highlights: [
      'Verificação SHA-256 + Chave NF-e (chNFe) + Número/CNPJ',
      'Alerta interativo antes de reprocessar arquivo repetido'
    ],
    changes: [
      {
        category: 'Adicionado',
        description:
          'Implementado histórico e detector de arquivos duplicados por assinatura SHA-256, tamanho, nome e chave fiscal da NF-e.'
      },
      {
        category: 'Adicionado',
        description:
          'Sinalização visual imediata ao enviar arquivo XML de NF-e ou arquivo cadastral repetido na Central de Cadastros e na tela de Produtos, com opção de cancelar ou confirmar reprocessamento.'
      }
    ]
  },
  {
    version: 'v2.0.2',
    date: '02/11/2026',
    title: 'Compatibilidade & Exportação para Banco MySQL',
    summary:
      'Adequação do sistema para geração e exportação de estrutura e carga de dados compatível com banco de dados relacional MySQL.',
    highlights: [
      'Script .sql compatível com MySQL 5.7 / 8.0 e utf8mb4'
    ],
    changes: [
      {
        category: 'Adicionado',
        description:
          'Adicionado gerador/exportador de script SQL completo compatível com MySQL 5.7 e 8.0 (tabelas, chaves e registros em utf8mb4) para integração com servidores MySQL.'
      }
    ]
  },
  {
    version: 'v2.0.1',
    date: '01/11/2026',
    title: 'Correção de Erro "auth/unauthorized-domain" & Tela de Validação Google Agenda/Drive',
    summary:
      'Correção do bloqueio de domínio não autorizado ao conectar o Google Agenda e Google Drive, com criação de tela dedicada para inserir e validar e-mail e credenciais.',
    highlights: [
      'Correção de Firebase: Error (auth/unauthorized-domain)',
      'Tela própria para entrada e validação de e-mail e senha/credenciais da Agenda'
    ],
    changes: [
      {
        category: 'Corrigido',
        description:
          'Corrigido erro "Firebase: Error (auth/unauthorized-domain)" ao clicar para conectar Google Agenda e Google Drive.'
      },
      {
        category: 'Adicionado',
        description:
          'Criado modal dedicado de entrada e validação de dados (e-mail e credenciais) para ligação direta e funcional com Google Agenda e Google Drive.'
      }
    ]
  },
  {
    version: 'v2.0.0',
    date: '30/10/2026',
    title: 'Integração Google Agenda & Google Drive',
    summary:
      'Lançamento dos módulos de agenda corporativa integrada ao Google Calendar e armazenamento/exportação via Google Drive.',
    highlights: [
      'Módulo Google Agenda integrado às Ordens de Serviço',
      'Módulo Google Drive para backup em nuvem'
    ],
    changes: [
      {
        category: 'Adicionado',
        description:
          'Criado módulo Google Agenda com criação de agendamentos técnicos, vínculo automático com OS, endereço GPS e confirmação por WhatsApp.'
      },
      {
        category: 'Adicionado',
        description:
          'Criado módulo Google Drive para autenticação e envio de backups da base na nuvem.'
      }
    ]
  },
  {
    version: 'v1.5.0',
    date: '20/10/2026',
    title: 'Operadoras de Cartão, Leitor XML NF-e, WhatsApp & Temas Visuais',
    summary:
      'Expansão financeira e operacional com taxas de operadoras de 1x a 12x, importação de NF-e, comunicação direta via WhatsApp e personalização de temas.',
    highlights: [
      'Operadoras de cartão (PagBank, InfinitePay) com absorver/repassar taxa',
      'Leitura automática de XML de NF-e com atualização de custo e estoque',
      '6 templates integrados de mensagens para WhatsApp'
    ],
    changes: [
      {
        category: 'Adicionado',
        description:
          'Cadastro de Operadoras de Cartão com taxas customizadas de Débito, Crédito à Vista e Parcelado (2x a 12x), além de conciliação de transações.'
      },
      {
        category: 'Adicionado',
        description:
          'Importador XML de NF-e com cadastro automático de fornecedor por CNPJ, recálculo de margem (55% Varejo / 35% Atacado) e lançamento em Contas a Pagar.'
      },
      {
        category: 'Adicionado',
        description:
          'Central de Importação Multi-Formato (CSV, XLSX, TXT, XML, PDF, SQL) e Modal WhatsApp com preenchimento dinâmico de variáveis.'
      },
      {
        category: 'Adicionado',
        description:
          'Seletor de 5 paletas de temas visuais no cabeçalho do sistema.'
      }
    ]
  },
  {
    version: 'v1.2.0',
    date: '10/10/2026',
    title: 'Portal do Cliente, Frota, Custos Iniciais (Break-Even) & Fechamento Fiscal',
    summary:
      'Introdução dos módulos gerenciais avançados: controle de frota e lucratividade por técnico, simulador de custos iniciais/dívidas, checklists com foto, assinatura touch e fechamento contábil PDF.',
    highlights: [
      'Checklists inteligentes com fotos de entrada/saída e assinatura digital touch',
      'Portal exclusivo do cliente com chamados e garantia por número de série',
      'Relatórios de Lucratividade por Técnico, Frota e Fechamento Fiscal PDF'
    ],
    changes: [
      {
        category: 'Adicionado',
        description:
          'Checklists técnicos vinculados aos serviços, upload de fotos antes/depois, assinatura digital na tela e políticas de garantia parametrizáveis.'
      },
      {
        category: 'Adicionado',
        description:
          'Portal do Cliente com isolamento multi-tenant para acompanhamento de OS, garantias e abertura de chamados.'
      },
      {
        category: 'Adicionado',
        description:
          'Módulos de Frota & Veículos, Custos Fixos Operacionais, Custos Iniciais / Dívidas Parceladas com Simulador de Break-Even e Fechamento Contábil em PDF.'
      }
    ]
  },
  {
    version: 'v1.0.0',
    date: '01/10/2026',
    title: 'Lançamento Inicial do GestãoPro ERP',
    summary:
      'Base operacional completa para gestão de assistência técnica, vendas de peças/equipamentos, controle de estoque, financeiro e controle de acesso por perfis.',
    highlights: [
      'Ordens de Serviço, Orçamentos e Vendas Diretas',
      'Produtos/Estoque com movimentações Kardex, Clientes e Fornecedores',
      'Financeiro (Contas a Pagar/Receber + DRE Gerencial) e RBAC'
    ],
    changes: [
      {
        category: 'Adicionado',
        description:
          'Estrutura principal do ERP com Dashboard Gerencial, Ordens de Serviço, Vendas Diretas (Varejo/Atacado), Produtos & Estoque, Clientes, Fornecedores e Funcionários.'
      },
      {
        category: 'Adicionado',
        description:
          'Módulo Financeiro com Contas a Pagar, Contas a Receber e Demonstrativo de Resultado do Exercício (DRE) em tempo real.'
      },
      {
        category: 'Adicionado',
        description:
          'Autenticação com controle de permissões por perfil (Administrador, Colaborador, Vendedor, Técnico, Contador e Cliente) e Logs de Auditoria.'
      }
    ]
  }
];
