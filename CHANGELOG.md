# Histórico de Versões e Alterações — GestãoPro ERP

Este documento registra oficialmente **todas as versões, atualizações, correções pontuais e mini-alterações** realizadas no **GestãoPro ERP** desde o início do projeto (`v1.0.0`) até a versão atual (`v2.7.4`).

---

## [v2.7.4] — 14/11/2026
**Padronização Global de Busca Dinâmica em Tempo Real (Desktop e Mobile)**

### Adicionado
- **Arquitetura Modular de Busca Global**: criados o padrão CSS responsivo (`.global-search-container`, `.search-modal`, `.search-item` em `src/index.css`), o utilitário agnóstico Vanilla JS `setupLiveSearch` (`src/utils/liveSearch.ts`) com `AbortController` e template HTML reutilizável, além do componente React `<LiveSearchInput />` (`src/components/LiveSearchInput.tsx`).
- **UX e Acessibilidade**: ativação a partir de **2 caracteres**, **debounce obrigatório >= 300ms**, indicador visual **"Buscando..."**, destaque do termo encontrado, navegação por teclado (`ArrowDown`, `ArrowUp`, `Enter`, `Escape`) e fechamento automático ao clicar fora ou limpar o campo.
- **Responsividade Mobile Segura**: container de resultados preso ao elemento pai (`width: 100%`, `left: 0; right: 0; max-width: calc(100vw - 1rem)`), altura máxima `60vh` no celular para conviver com o teclado virtual, `z-index: 1050` e itens com altura mínima >= `48px`/`52px` para toque confortável.

### Alterado
- Todos os campos de busca do sistema (PDV, Vendas, Estoque/Produtos, Clientes, Ordens de Serviço, Fornecedores, Financeiro, Painel do Técnico, Cadastro Geral, Google Agenda, Custos Iniciais, Manual, Modal de Ajuda, Google Drive e Busca XML Gmail) foram padronizados com o `<LiveSearchInput />` e tiveram o `overflow-hidden` de seus cards pais ajustado para nunca cortar o dropdown flutuante.

---

## [v2.7.3] — 14/11/2026
**Calculadora de Parcelas e Edição Individual de Pagamentos na Modal de OS**

### Adicionado
- **Calculadora Automática de Entrada & Parcelamento** na modal de **Ordem de Serviço** (`ServiceOrdersView`): calcula o total líquido (serviços + peças + taxa de visita - desconto), aceita entrada opcional e divide automaticamente o saldo restante nas parcelas configuradas com vencimentos escalonados.
- **Edição Individual por Lançamento**: cada linha de pagamento permite alterar livremente o tipo (**Entrada / Parcela / À Vista**), forma de pagamento (**PIX, Dinheiro, Cartão de Crédito/Débito, Boleto, Faturado 30d**), data de vencimento, valor, observação e status **Pago** com **data específica do pagamento** (ex.: parcela em dinheiro paga em determinado dia).
- Painel de conferência em tempo real comparando **Total Líquido da OS**, **Total nas Parcelas**, **Já Pago** e **Falta Alocar**, com botão para ajuste automático da diferença.

### Alterado
- Atualizados `PaymentSplit` (`src/types.ts`), o modelo de impressão A4 (`ServiceOrderPrintTemplate`), a exportação HTML e o checkout do **PDV** (`PdvView`) para exibir condições/parcelas e pré-carregar os recebimentos programados da OS.

---

## [v2.7.2] — 14/11/2026
**Ampliação de 15% na Tipografia Global para Computador**

### Alterado
- Aplicado aumento proporcional de **+15%** em todos os textos do sistema exclusivamente para telas de computador (`@media screen and (min-width: 1024px)`), cobrindo títulos, tabelas, botões, formulários e textos auxiliares em `src/index.css`, mantendo o layout mobile e os comprovantes de impressão intactos.

---

## [v2.7.1] — 14/11/2026
**Atalho de Cadastro Rápido de Cliente (Modal) no PDV**

### Adicionado
- Botão de atalho **Novo Cliente** no cabeçalho do **PDV** (`PdvView`), botão **Cadastrar** no painel de busca de cliente do **Balcão PDV Rápido** e atalho direto quando a pesquisa não localizar um cliente.
- Janela modal **Cadastro Rápido de Cliente (PDV)** com escolha **PF / PJ**, perfil comercial **Varejista / Atacadista**, consulta automática de **CNPJ** e **CEP**, endereço opcional e observações.

### Alterado
- Ao salvar o novo cliente pela modal do PDV, o registro é sincronizado na nuvem, selecionado automaticamente no Balcão PDV Rápido e já aplica a tabela **Atacado** caso marcado como **Atacadista**.

---

## [v2.7.0] — 14/11/2026
**Liberação de Preços de Atacado Exclusiva para Clientes Atacadistas**

### Adicionado
- Classificação comercial **Tipo de Cliente (`Varejista` vs `Atacadista`)** no modelo de dados (`Client`), no **Cadastro de Clientes** (`ClientsView`), no **Cadastro Geral** (`MasterRegistrationsView`), no importador CSV/Universal (`UniversalDataImportView`), no esquema Firebase (`firebase-blueprint.json`) e na exportação SQL (`SystemSettingsView`).
- Filtro rápido por perfil (**Todos / Varejo / Atacado**) na tela de Clientes e busca rápida de cliente por nome, CPF/CNPJ ou telefone diretamente no **Balcão PDV Rápido** e em **Vendas Diretas**.

### Alterado
- **Bloqueio de Tabela Atacado**: tanto no **PDV** (`PdvView`) quanto em **Vendas Diretas** (`SalesView`), a opção de tabela **Atacado** e os valores atacadistas permanecem bloqueados até que seja buscado e selecionado um cliente cadastrado como **Atacadista**.

### Corrigido
- Reversão automática para preços de **Varejo** no carrinho do PDV e nos itens da venda sempre que o cliente selecionado for alterado para um cliente **Varejista** ou **Consumidor Balcão**.

---

## [v2.6.4] — 14/11/2026
**Ajuste Tipográfico na Chamada da Tela de Login**

### Alterado
- Diminuído o tamanho da fonte do texto *"Controle em tempo real."* e posicionado logo abaixo do título principal *"Gestão completa."* na tela de login (`LoginView`).

---

## [v2.6.3] — 14/11/2026
**Limpeza Visual no Bloco de Marca da Tela de Login**

### Removido
- Retirado o dado secundário da empresa (razão social) exibido abaixo do nome da empresa ao lado da logo na tela de login (`LoginView`), mantendo o cabeçalho de marca mais limpo.

---

## [v2.6.2] — 14/11/2026
**Exibição de Endereço no Login & Detalhamento Completo de Mini-Alterações**

### Alterado
- Removida a exibição do CNPJ na tela de login (`LoginView`), substituindo pelo **endereço completo cadastrado da empresa** (rua, número, bairro, cidade/UF e CEP) junto ao telefone.

### Adicionado
- Detalhamento individual de todas as mini-alterações e correções pontuais (`v2.0.1`, `v2.0.2`, `v2.4.1`, `v2.4.2`, `v2.4.3`, `v2.6.1`, `v2.6.2`) tanto neste `CHANGELOG.md` quanto na tela interna de **Histórico de Versões** em **Ajuda & Manual**.

---

## [v2.6.1] — 14/11/2026
**Redesign da Tela de Login (Fundo Azul Escuro, Fontes Maiores & Logo da Empresa)**

### Alterado
- Alterado o fundo da tela de login para **azul escuro** com gradiente suave e aplicado tema escuro de alto contraste no cartão de login e nos campos de entrada.
- Aumentado o tamanho das fontes da tela de login (títulos, subtítulos, rótulos, campos de texto, links e botão de entrada).

### Adicionado
- Layout em duas colunas exibindo a **logo cadastrada da empresa** ao lado do formulário de acesso (com fallback em monograma caso não haja imagem enviada).

### Corrigido
- Substituído o alerta nativo de navegador em *"Esqueceu a senha?"* por aviso visual integrado dentro do cartão de login.

---

## [v2.6.0] — 14/11/2026
**Documentação Completa de Alterações & Alinhamento de Versionamento**

### Adicionado
- Criado o arquivo oficial `CHANGELOG.md` na raiz do repositório com o histórico de versões do sistema.
- Adicionada a aba interativa **"Histórico de Versões & Changelog"** dentro do módulo **Ajuda & Manual**, com filtro por tipo de alteração, busca textual, impressão e download em `.md`.
- Adicionado o **Capítulo 13 (PDV / Frente de Caixa & Baixa Unificada)** ao Manual do Sistema.

### Alterado
- Versionamento unificado em `src/constants/version.ts`, `package.json`, rodapé (`SystemFooter`), tela de login (`LoginView`), barra lateral (`Sidebar`), especificação de arquitetura (`SystemDocumentationModal`) e modal de ajuda (`SystemHelpModal`).
- Atualizado o Capítulo 12 do Manual do Sistema para refletir a remoção das opções de backup JSON e `.ZIP` em Configurações.

---

## [v2.5.0] — 14/11/2026
**Módulo PDV / Frente de Caixa & Baixa Unificada de Vendas e OS**

### Adicionado
- Criada a tela dedicada **PDV / Caixa** (`PdvView.tsx`) no menu **OPERAÇÕES** e atalho rápido no cabeçalho superior.
- **Ciclo de Turno de Caixa**: Abertura de Caixa com seleção de terminal (`Caixa 01`, `Caixa 02`, `Caixa 03`, `PDV Móvel`) e fundo inicial de troco, **Suprimento**, **Sangria**, extrato em tempo real e **Fechamento de Caixa** com cálculo de diferença (sobra/falta).
- **Fila Unificada de Recebimentos**: Centraliza todas as **Ordens de Serviço** e **Vendas Diretas** pendentes para conferência e baixa no caixa.
- **Balcão PDV Rápido**: Catálogo pesquisável (código, nome, SKU, código de barras), tabela Varejo/Atacado, carrinho, descontos (`R$`/`%`), envio para a fila ou recebimento imediato com baixa de estoque.
- **Checkout Multiformas & Comprovante**: Pagamento único ou dividido (**Multi-Split**), cálculo automático de **Troco**, cópia de **Chave PIX**, bandeira/parcelamento (1x–12x) com taxa automática, NSU e **Comprovante de Caixa** para impressão ou download.

### Alterado
- **Vendas Diretas** e **Ordens de Serviço** integradas ao fluxo real do caixa (`sendSaleToPdv`, `settleSaleInPdv`, `sendOrderToPdv`, `settleServiceOrderInPdv`), com sessões e movimentações sincronizadas no Firestore.

---

## [v2.4.3] — 13/11/2026
**Limpeza da Tela de Configurações**

### Removido
- Removidas da tela de **Configurações** as opções de **Download de Backup (JSON)**, **Restaurar de Arquivo de Backup** e **Código-Fonte & Arquivos (.ZIP)**.

---

## [v2.4.2] — 13/11/2026
**Correção da Visibilidade de Produtos Cadastrados entre PC e Celular**

### Corrigido
- Resolvido o erro em que produtos cadastrados no computador não apareciam no celular: adicionada higienização de propriedades `undefined` antes da gravação no Firestore (`stripUndefined`) e sincronização automática completa da coleção de produtos.

---

## [v2.4.1] — 12/11/2026
**Persistência da Tela Atual ao Atualizar o Sistema**

### Corrigido
- Adicionada persistência da aba ativa via hash na URL (`#rota`) e `localStorage`, garantindo que o sistema permaneça exatamente na mesma tela após atualizar a página.

---

## [v2.4.0] — 12/11/2026
**Sincronização em Tempo Real entre Computador e Celular**

### Adicionado
- Sincronização bidirecional via **Firebase Firestore** (`onSnapshot` + `bootstrapCloudDatabase`) e entre abas (`BroadcastChannel`) para que computador e celular exibam o mesmo sistema e os mesmos registros em tempo real.

---

## [v2.3.0] — 10/11/2026
**Atualização Geral de Dependências & Remoção de Vulnerabilidades**

### Alterado
- Atualização de todos os pacotes do sistema para as versões mais atuais: **React 19**, **Vite 8.3**, **Tailwind CSS 4.3**, **TypeScript 7.0**, **Firebase 13.2**, **jsPDF 4.2**, **lucide-react** e **@google/genai 2.4**.

### Segurança
- Eliminação de vulnerabilidades conhecidas mediante substituição segura de `xlsx` (`npm:@e965/xlsx`), atualização de `express` e override de `@grpc/grpc-js`.

---

## [v2.2.0] — 08/11/2026
**Contagem de Páginas & Paginação em Produtos, OS, Clientes e Fornecedores**

### Adicionado
- Componente `TablePagination` com contagem de páginas (`Página X de Y`), faixa de registros visíveis e seletor de itens por página aplicado em **Produtos**, **Ordens de Serviço**, **Clientes** e **Fornecedores**.

---

## [v2.1.0] — 05/11/2026
**Detector Anti-Duplicidade de Uploads (XML NF-e e Demais Cadastros)**

### Adicionado
- Verificação criptográfica (**SHA-256**), tamanho e conferência de chave fiscal (`chNFe`), número de NF-e e CNPJ para identificar e sinalizar automaticamente o envio do mesmo arquivo tanto em **XML de NF-e** quanto nos **demais cadastros via upload**.

---

## [v2.0.2] — 02/11/2026
**Compatibilidade & Exportação de Banco MySQL**

### Adicionado
- Gerador e exportador de script `.sql` completo (estrutura e dados em `utf8mb4`) compatível com **MySQL 5.7 / 8.0**.

---

## [v2.0.1] — 01/11/2026
**Correção de Erro "auth/unauthorized-domain" & Tela de Validação Google Agenda/Drive**

### Corrigido
- Corrigido o erro `Firebase: Error (auth/unauthorized-domain)` ao tentar conectar a Google Agenda e o Google Drive.

### Adicionado
- Criada tela dedicada para inserir e validar os dados de e-mail e credenciais da conta para ligação com **Google Agenda** e **Google Drive**.

---

## [v2.0.0] — 30/10/2026
**Integração Google Agenda & Google Drive**

### Adicionado
- Módulo **Google Agenda** integrado às Ordens de Serviço, com criação de agendamentos, endereço GPS e confirmação por WhatsApp.
- Módulo **Google Drive** para backups em nuvem.

---

## [v1.5.0] — 20/10/2026
**Operadoras de Cartão, Leitor XML NF-e, WhatsApp & Temas Visuais**

### Adicionado
- Módulo de **Operadoras de Cartão** (PagBank, InfinitePay) com taxas de 1x a 12x e opção de assumir ou repassar taxas.
- Leitor de **XML de NF-e** com cadastro de fornecedor por CNPJ, atualização de estoque com margens de 55% (Varejo) e 35% (Atacado) e criação automática de Conta a Pagar.
- **Central de Cadastros** com importação multi-formato (`CSV`, `XLSX`, `TXT`, `XML`, `PDF`, `SQL`).
- Integração **WhatsApp** com 6 modelos dinâmicos e seletor de 5 paletas de **Temas**.

---

## [v1.2.0] — 10/10/2026
**Portal do Cliente, Frota, Custos Iniciais (Break-Even) & Fechamento Fiscal**

### Adicionado
- **Checklists Inteligentes** com fotos de entrada e saída, **Assinatura Digital Touch** e **Políticas de Garantia**.
- **Portal do Cliente** isolado por cliente (multi-tenancy) para acompanhamento de OS, termos de garantia e abertura de chamados.
- Módulos de **Frota & Veículos**, **Lucratividade por Técnico**, **Custos Fixos**, **Custos Iniciais / Dívidas Parceladas (Break-Even)** e **Fechamento Fiscal/Contábil em PDF**.

---

## [v1.0.0] — 01/10/2026
**Lançamento Inicial do GestãoPro ERP**

### Adicionado
- Núcleo completo do ERP: **Dashboard Gerencial**, **Ordens de Serviço**, **Vendas Diretas**, **Produtos & Estoque** (Kardex), **Clientes**, **Fornecedores** e **Funcionários**.
- Módulo **Financeiro** com Contas a Receber, Contas a Pagar e **DRE Gerencial**.
- Sistema de autenticação com **RBAC** (`Administrador`, `Colaborador`, `Vendedor`, `Técnico`, `Contador`, `Cliente`) e **Logs de Auditoria**.
