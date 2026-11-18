# Gestor-Pro — Sistema de Gestão de Ordem de Serviços e Vendas

Aplicação web desenvolvida em **React, TypeScript e Vite**, integrada ao **Firebase (Firestore)** e **Google Drive**, com suporte a PDV (Ponto de Venda), controle de caixa e geração de PDFs.

---

## 📋 Pré-requisitos da VPS / Hospedagem

* **Sistema Operacional:** Ubuntu 20.04 / 22.04 / 24.04 LTS (ou painel aaPanel / cPanel).
* **Node.js:** Versão 20 LTS ou superior (ou **Bun**, conforme `bun.lock`).
* **Servidor Web:** Nginx (recomendado) ou Apache.
* **SSL:** Certificado HTTPS ativo (Let's Encrypt) — obrigatório para autenticação Firebase e integração com Google Drive.

---

## ⚙️ 1. Variáveis de Ambiente

Antes de gerar o build de produção, crie o arquivo `.env` na raiz do projeto com base no `.env.example`:

```bash
cp .env.example .env
nano .env
```

---

## 🚀 2. Build de Produção & Atualização na VPS

Sempre que atualizar os arquivos do sistema na VPS (via Git ou extraindo o pacote atualizado `gestaopro-sistema-completo.zip` baixado em **Google Drive → Baixar ZIP para Computador**), execute obrigatoriamente na pasta raiz do projeto:

```bash
# 1. Instalar / atualizar dependências
npm install

# 2. Limpar build antigo e gerar novo build de produção em dist/
rm -rf dist && npm run build
```

Aponte o **Nginx / Apache** para a pasta `dist/` recém-gerada e configure o cabeçalho `Cache-Control: no-store` para o `index.html` (para evitar que o navegador na VPS carregue versões antigas em cache):

```nginx
server {
    listen 80;
    server_name seu-dominio.com.br;
    root /var/www/gestaopro/dist;
    index index.html;

    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        try_files $uri /index.html;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

> **Dica:** após subir o novo `dist/` na VPS, recarregue o navegador com **Ctrl + Shift + R** (ou **Cmd + Shift + R**) para limpar o cache local do navegador.

