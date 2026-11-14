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
