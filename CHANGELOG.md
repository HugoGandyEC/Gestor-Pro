# Histórico de Versões e Alterações — GestãoPro ERP

Este documento registra oficialmente todas as versões, entregas de funcionalidades, correções de bugs, melhorias de segurança e alterações estruturais realizadas no **GestãoPro ERP** desde a versão inicial até a versão atual.

---

## [v2.6.0] — 14/11/2026
**Documentação Completa de Alterações & Alinhamento de Versionamento**

### Adicionado
- Criado o arquivo oficial `CHANGELOG.md` na raiz do repositório com o histórico completo de todas as versões do sistema.
- Adicionada a aba interativa **"Histórico de Versões & Changelog"** dentro do módulo **Ajuda & Manual** do sistema, com filtro por tipo de alteração, busca por palavra-chave, impressão e exportação em `.md`.
- Adicionado o **Capítulo 13 (PDV / Frente de Caixa & Baixa Unificada)** ao Manual do Sistema.

### Alterado
- Versionamento unificado para **`v2.6.0`** (`Build 2026.11.14`) em `src/constants/version.ts`, `package.json`, rodapé do sistema (`SystemFooter`), tela de login (`LoginView`), barra lateral (`Sidebar`), especificação de arquitetura (`SystemDocumentationModal`) e modal de ajuda (`SystemHelpModal`).
- Atualizado o Capítulo 12 do Manual do Sistema para refletir a remoção das opções de backup JSON e download `.ZIP` da tela de Configurações.

---

## [v2.5.0] — 14/11/2026
**Módulo PDV / Frente de Caixa & Baixa Unificada de Vendas e OS**

### Adicionado
- Criada a tela dedicada **PDV / Caixa** (`PdvView.tsx`) no menu **OPERAÇÕES** e atalho rápido no cabeçalho superior.
- **Ciclo de Turno de Caixa**: Abertura de Caixa com seleção de terminal (`Caixa 01`, `Caixa 02`, `Caixa 03`, `PDV Móvel`) e fundo inicial de troco, operações de **Suprimento** e **Sangria**, extrato em tempo real e **Fechamento de Caixa** com cálculo automático de diferença (sobra/falta) entre valor esperado em dinheiro na gaveta e valor contado.
- **Fila Unificada de Recebimentos**: Centraliza todas as **Ordens de Serviço** e **Vendas Diretas** com pagamento pendente para conferência e baixa no caixa.
- **Balcão PDV Rápido**: Frente de loja com catálogo pesquisável (código, nome, SKU, código de barras), tabela Varejo/Atacado, carrinho, aplicação de descontos (`R$`/`%`), envio para a fila do caixa ou recebimento imediato com baixa de estoque.
- **Checkout Multiformas & Comprovante**: Pagamento único ou dividido (**Multi-Split**), cálculo automático de **Troco** em dinheiro, exibição/cópia de **Chave PIX**, seleção de bandeira e parcelamento (1x a 12x) com taxa automática da maquininha, registro de NSU e emissão de **Comprovante de Caixa (cupom não fiscal)** para impressão ou download.

### Alterado
- **Vendas Diretas** e **Ordens de Serviço** integradas ao fluxo real do caixa (`sendSaleToPdv`, `settleSaleInPdv`, `sendOrderToPdv`, `settleServiceOrderInPdv`), gravando sessões e movimentações de caixa (`cashSessions`, `cashMovements`) sincronizadas no Firestore.

---

## [v2.4.0] — 12/11/2026
**Sincronização Multi-Dispositivo (PC ↔ Celular), Persistência de Tela & Limpeza de Configurações**

### Adicionado
- Sincronização em tempo real entre computador e celular via **Firebase Firestore** para produtos, clientes, fornecedores, ordens de serviço, vendas, agendamentos e movimentações de caixa.
- Sincronização instantânea entre múltiplas abas do navegador via `BroadcastChannel` e eventos `storage`.

### Corrigido
- Corrigida a sincronização de produtos e cadastros entre computador e celular (incluindo higienização de campos `undefined` antes de salvar na nuvem com `stripUndefined`).
- Persistência da tela ativa via hash de URL e `localStorage`, garantindo que o usuário permaneça na mesma tela ao atualizar a página.

### Removido
- Removidas da tela de **Configurações** as opções de **Download de Backup (JSON)**, **Restaurar de Arquivo de Backup** e **Download de Código-Fonte & Arquivos (.ZIP)**.

---

## [v2.3.0] — 10/11/2026
**Atualização Geral de Dependências & Remoção de Vulnerabilidades**

### Alterado
- Atualização de todas as dependências do sistema para versões atuais: **React 19**, **Vite 8.3**, **Tailwind CSS 4.3**, **TypeScript 7.0**, **Firebase 13.2**, **jsPDF 4.2**, **lucide-react** e **@google/genai 2.4**.

### Segurança
- Eliminação de vulnerabilidades de pacotes por meio da migração segura de `xlsx` (`npm:@e965/xlsx`), atualização do `express` e override de `@grpc/grpc-js`.

---

## [v2.2.0] — 08/11/2026
**Contagem de Páginas & Paginação nas Listagens Principais**

### Adicionado
- Componente `TablePagination` com exibição de página atual, total de páginas (`Página X de Y`), total de registros e seletor de itens por página.
- Paginação aplicada nas telas de **Produtos & Estoque**, **Ordens de Serviço**, **Clientes** e **Fornecedores**.

---

## [v2.1.0] — 05/11/2026
**Detector Anti-Duplicidade de Uploads (XML NF-e e Cadastros)**

### Adicionado
- Verificação criptográfica (**SHA-256**), tamanho do arquivo e conferência de chave fiscal (`chNFe`), número de NF-e e CNPJ para detectar automaticamente envios repetidos.
- Alerta visual no upload de **XML de NF-e** e nas importações cadastrais da **Central de Cadastros** e **Produtos**, permitindo cancelar ou confirmar reprocessamento consciente.

---

## [v2.0.0] — 01/11/2026
**Google Agenda, Google Drive, Exportação MySQL & Correção OAuth**

### Corrigido
- Corrigido o erro `Firebase: Error (auth/unauthorized-domain)` ao conectar a agenda e o Google Drive, implementando tela dedicada de entrada e validação de e-mail e credenciais para integração com o **Google Agenda**.

### Adicionado
- Módulo **Google Agenda** integrado às Ordens de Serviço, com criação de eventos, vínculo automático de endereço/GPS e disparo de confirmação pelo WhatsApp.
- Gerador e exportador de script `.sql` compatível com **MySQL 5.7 / 8.0** (`utf8mb4`).

---

## [v1.5.0] — 20/10/2026
**Operadoras de Cartão, Leitor XML NF-e, WhatsApp & Temas Visuais**

### Adicionado
- Módulo de **Operadoras de Cartão** (PagBank, InfinitePay) com tabela de taxas de 1x a 12x e opção de assumir ou repassar taxas ao cliente.
- Leitor de **XML de NF-e** com cadastro de fornecedor por CNPJ, atualização de estoque com margens de 55% (Varejo) e 35% (Atacado) e criação automática de Conta a Pagar.
- **Central de Cadastros** com importação multi-formato (`CSV`, `XLSX`, `TXT`, `XML`, `PDF`, `SQL`).
- Integração com **WhatsApp** utilizando 6 modelos de mensagens com variáveis dinâmicas e seletor de 5 paletas de **Temas** no cabeçalho.

---

## [v1.2.0] — 10/10/2026
**Portal do Cliente, Frota, Custos Iniciais (Break-Even) & Fechamento Fiscal**

### Adicionado
- **Checklists Inteligentes** com fotos de entrada e saída, **Assinatura Digital Touch** e **Políticas de Garantia** vinculadas a serviços.
- **Portal do Cliente** isolado por cliente (multi-tenancy) para acompanhamento de OS, termos de garantia e abertura de chamados.
- Módulos de **Frota & Veículos**, **Lucratividade por Técnico**, **Custos Fixos**, **Custos Iniciais / Dívidas Parceladas (Break-Even)** e **Fechamento Fiscal/Contábil em PDF**.

---

## [v1.0.0] — 01/10/2026
**Lançamento Inicial do GestãoPro ERP**

### Adicionado
- Núcleo completo do ERP: **Dashboard Gerencial**, **Ordens de Serviço**, **Vendas Diretas**, **Produtos & Estoque** (Kardex), **Clientes**, **Fornecedores** e **Funcionários**.
- Módulo **Financeiro** com Contas a Receber, Contas a Pagar e **DRE Gerencial**.
- Sistema de autenticação com **RBAC** (`Administrador`, `Colaborador`, `Vendedor`, `Técnico`, `Contador`, `Cliente`) e **Logs de Auditoria**.
