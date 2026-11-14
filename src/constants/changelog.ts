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
    version: 'v2.6.0',
    date: '14/11/2026',
    title: 'Documentação Completa de Alterações & Alinhamento de Versionamento',
    summary:
      'Padronização semântica de todas as versões do sistema desde a implantação inicial (v1.0.0 até v2.6.0), com criação de Changelog oficial, atualização do Manual do Sistema (incluindo módulo PDV) e sincronização de versão em todo o ERP.',
    highlights: [
      'Changelog oficial estruturado (v1.0.0 → v2.6.0)',
      'Nova aba "Histórico de Versões" no Manual do Sistema',
      'Capítulo completo de PDV / Frente de Caixa no Manual',
      'Alinhamento de versão entre sistema, rodapé, login, modais e package.json'
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
          'Adicionada a aba interativa "Histórico de Versões & Changelog" em Ajuda & Manual com busca textual, filtro por tipo de alteração e exportação para Markdown/Impressão.'
      },
      {
        category: 'Adicionado',
        description:
          'Incluído o Capítulo 13 no Manual do Sistema detalhando o fluxo completo do PDV / Frente de Caixa (abertura, fila de recebimentos, balcão rápido, suprimento/sangria e fechamento).'
      },
      {
        category: 'Alterado',
        description:
          'Versionamento ajustado seguindo SemVer (MAJOR.MINOR.PATCH) para v2.6.0 (Build 2026.11.14) em version.ts, package.json, rodapé, tela de login, especificação de arquitetura e modal de ajuda.'
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
      'Implantação do Ponto de Venda (PDV) completo para que todas as Vendas Diretas e Ordens de Serviço passem obrigatoriamente pelo caixa para conferência, recebimento, emissão de comprovante e fechamento de turno.',
    highlights: [
      'Abertura, Suprimento, Sangria e Fechamento de Caixa',
      'Fila unificada de recebimentos para OS e Vendas Diretas',
      'Balcão PDV Rápido com carrinho, desconto e busca por código de barras',
      'Pagamento único ou dividido (Multi-Split) com cálculo automático de troco e taxas'
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
          'Adicionadas operações de Suprimento (reforço) e Sangria (retirada), extrato detalhado por forma de pagamento e Fechamento de Caixa com conferência entre saldo esperado em gaveta e valor contado (sobra/falta).'
      },
      {
        category: 'Adicionado',
        description:
          'Criado modo "Balcão PDV Rápido" com seleção de tabela Varejo/Atacado, carrinho em tempo real, desconto em R$/% e envio direto para fila ou baixa imediata com dedução de estoque.'
      },
      {
        category: 'Adicionado',
        description:
          'Emissão de Comprovante de Caixa (cupom não fiscal) com código NSU, troco, formas de pagamento, impressão térmica e download em HTML.'
      },
      {
        category: 'Alterado',
        description:
          'Telas de Vendas Diretas e Ordens de Serviço integradas às ações reais do caixa (sendSaleToPdv, settleSaleInPdv, sendOrderToPdv, settleServiceOrderInPdv), gerando movimentações persistidas e sincronizadas no Firestore.'
      }
    ]
  },
  {
    version: 'v2.4.0',
    date: '12/11/2026',
    title: 'Sincronização em Nuvem (PC ↔ Celular), Persistência de Tela & Limpeza de Configurações',
    summary:
      'Sincronização em tempo real entre dispositivos físicos (computador e celular) via Firebase Firestore, manutenção da mesma tela ao atualizar o navegador e simplificação do painel de Configurações.',
    highlights: [
      'Dados de produtos, clientes, fornecedores e OS sincronizados entre PC e Celular',
      'Manutenção automática da tela ativa após F5 / Reload',
      'Configurações mais enxutas sem exportação/importação JSON e .ZIP'
    ],
    changes: [
      {
        category: 'Adicionado',
        description:
          'Implementada sincronização bidirecional em tempo real via Firebase Firestore (onSnapshot e bootstrapCloudDatabase) garantindo que produtos e registros cadastrados no computador apareçam imediatamente no celular.'
      },
      {
        category: 'Adicionado',
        description:
          'Sincronização local instantânea entre abas abertas do navegador via BroadcastChannel e eventos de storage.'
      },
      {
        category: 'Corrigido',
        description:
          'Persistência da aba ativa via URL hash (#rota) e localStorage, mantendo o usuário exatamente na tela que estava acessando ao atualizar o sistema.'
      },
      {
        category: 'Corrigido',
        description:
          'Tratamento de campos opcionais antes da gravação no Firestore (stripUndefined) evitando falhas silenciosas de sincronização na nuvem.'
      },
      {
        category: 'Removido',
        description:
          'Removidos os botões de Download de Backup (JSON), Restaurar de Arquivo de Backup e Download de Código-Fonte & Arquivos (.ZIP) da tela de Configurações.'
      }
    ]
  },
  {
    version: 'v2.3.0',
    date: '10/11/2026',
    title: 'Atualização Geral de Dependências & Blindagem de Segurança',
    summary:
      'Atualização completa dos pacotes do projeto para as versões mais recentes e eliminação de vulnerabilidades conhecidas nas dependências de produção e desenvolvimento.',
    highlights: [
      'Stack atualizada: React 19, Vite 8, TypeScript 7, Tailwind CSS 4 e Firebase 13',
      'Substituição/atualização de pacotes vulneráveis (xlsx, jsPDF, express, @grpc/grpc-js)'
    ],
    changes: [
      {
        category: 'Alterado',
        description:
          'Atualizadas dependências principais para suas versões estáveis mais recentes: React 19, Vite 8.3, @tailwindcss/vite 4.3, TypeScript 7.0, Firebase 13.2, jsPDF 4.2, lucide-react e @google/genai 2.4.'
      },
      {
        category: 'Segurança',
        description:
          'Resolvidas vulnerabilidades de dependências por meio da migração do pacote xlsx para @e965/xlsx, atualização do express e override seguro de @grpc/grpc-js.'
      }
    ]
  },
  {
    version: 'v2.2.0',
    date: '08/11/2026',
    title: 'Paginação em Cadastros Principais & Contagem de Páginas',
    summary:
      'Adição de navegação paginada com seletor de itens por página e indicador total de páginas nas principais listagens operacionais do ERP.',
    highlights: [
      'Componente TablePagination com contagem "Página X de Y"',
      'Aplicado em Produtos, Ordens de Serviço, Clientes e Fornecedores'
    ],
    changes: [
      {
        category: 'Adicionado',
        description:
          'Criado componente reutilizável TablePagination exibindo página atual, total de páginas, faixa de registros visíveis e seletor de quantidade por página.'
      },
      {
        category: 'Adicionado',
        description:
          'Integrada contagem de páginas nas telas de Produtos & Estoque, Ordens de Serviço, Clientes e Fornecedores.'
      }
    ]
  },
  {
    version: 'v2.1.0',
    date: '05/11/2026',
    title: 'Detector Anti-Duplicidade em Uploads (XML NF-e e Cadastros via Arquivo)',
    summary:
      'Sistema inteligente de detecção de arquivos repetidos utilizando hash criptográfico SHA-256 e metadados fiscais para evitar importações duplicadas acidentais.',
    highlights: [
      'Verificação SHA-256 + Chave NF-e (chNFe) + Número/CNPJ',
      'Alerta interativo com opções de cancelar ou reprocessar'
    ],
    changes: [
      {
        category: 'Adicionado',
        description:
          'Implementado registro persistente de histórico de uploads calculando assinatura SHA-256, nome, tamanho e metadados dos arquivos enviados.'
      },
      {
        category: 'Adicionado',
        description:
          'Adicionada sinalização imediata ao tentar reenviar o mesmo arquivo XML de NF-e ou planilhas/arquivos na Central de Cadastros e Produtos.'
      }
    ]
  },
  {
    version: 'v2.0.0',
    date: '01/11/2026',
    title: 'Google Agenda, Google Drive, Exportação MySQL & Correção OAuth',
    summary:
      'Integração completa com Google Calendar e Google Drive, tela própria de validação de credenciais sem erro auth/unauthorized-domain e suporte a scripts SQL para banco MySQL.',
    highlights: [
      'Correção do erro Firebase auth/unauthorized-domain',
      'Tela de entrada e validação de e-mail/credenciais para Google Agenda',
      'Exportação de script SQL completo compatível com MySQL 5.7 / 8.0'
    ],
    changes: [
      {
        category: 'Corrigido',
        description:
          'Corrigido erro "Firebase: Error (auth/unauthorized-domain)" ao conectar Google Agenda e Google Drive, abrindo fluxo próprio de inserção e validação de e-mail e credenciais.'
      },
      {
        category: 'Adicionado',
        description:
          'Módulo Google Agenda com agendamento de visitas técnicas, vínculo automático com Ordens de Serviço e link GPS para endereço do cliente.'
      },
      {
        category: 'Adicionado',
        description:
          'Exportador de estrutura e carga completa em SQL (.sql) compatível com bancos MySQL (charset utf8mb4).'
      }
    ]
  },
  {
    version: 'v1.5.0',
    date: '20/10/2026',
    title: 'Operadoras de Cartão, Importação XML NF-e, WhatsApp & Temas Visuais',
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
