import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanySettings, PaymentMethod, PaymentReceipt } from '../types';
import { getOsReceiptClassificationTitle } from './pixBrCode';

export const RECEIPT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  boleto: 'Boleto Bancário',
  faturado_30d: 'Faturado 30 Dias'
};

export const RECEIPT_KIND_LABELS: Record<PaymentReceipt['paymentKind'], string> = {
  vista: 'Quitação / Pagamento Total',
  entrada: 'Sinal / Entrada',
  parcela: 'Pagamento Parcial / Parcela',
  parcial: 'Pagamento Parcial',
  quitacao: 'Quitação / Pagamento Total'
};

const formatBRL = (value: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(Number(value || 0));

const formatDateTimeBR = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDateOnlyBR = (iso: string): string => {
  if (!iso) return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
};

export const buildReceiptShareText = (
  receipt: PaymentReceipt,
  company: CompanySettings
): string => {
  const companyName = company.tradeName || company.companyName || 'FIRE GESTÃO';
  const classificationTitle = getOsReceiptClassificationTitle(
    receipt.paymentKind,
    receipt.isFullyPaid
  );
  const originLabel =
    receipt.sourceType === 'os'
      ? `Ordem de Serviço Nº ${receipt.sourceCode}`
      : `Venda Nº ${receipt.sourceCode}`;
  const statusLine = receipt.isFullyPaid
    ? 'STATUS: QUITADO / INTEGRALMENTE PAGO (Saldo Restante: R$ 0,00)'
    : `STATUS: ${classificationTitle.toUpperCase()} — SALDO RESTANTE A PAGAR: ${formatBRL(receipt.remainingBalance)}`;

  const methodsLine =
    receipt.payments && receipt.payments.length > 0
      ? receipt.payments
          .map(p => {
            const brand = p.cardBrand ? ` · ${p.cardBrand.toUpperCase()}` : '';
            const inst = p.installments && p.installments > 1 ? ` ${p.installments}x` : '';
            return `${RECEIPT_METHOD_LABELS[p.method] || p.method}${brand}${inst}: ${formatBRL(p.amount)}`;
          })
          .join(' | ')
      : `${RECEIPT_METHOD_LABELS[receipt.paymentMethod] || receipt.paymentMethod}: ${formatBRL(receipt.amountPaidNow)}`;

  const priorHistoryLines =
    receipt.previousPaymentsHistory && receipt.previousPaymentsHistory.length > 0
      ? [
          `*Pagamentos Anteriores:*`,
          ...receipt.previousPaymentsHistory.map(
            h =>
              `• ${formatDateOnlyBR(h.date)} — ${RECEIPT_METHOD_LABELS[h.method] || h.method}: ${formatBRL(h.amount)}${
                h.receiptNumber ? ` (${h.receiptNumber})` : ''
              }`
          )
        ].join('\n')
      : receipt.previouslyPaid > 0.01
      ? `Pagamentos Anteriores: ${formatBRL(receipt.previouslyPaid)}`
      : '';

  return [
    `*${companyName}* — ${classificationTitle.toUpperCase()}`,
    `Recibo Nº: *${receipt.receiptNumber}*`,
    `Origem: *${originLabel}*`,
    `Data/Hora: ${formatDateTimeBR(receipt.createdAt)}`,
    ``,
    `*Cliente:* ${receipt.clientName}`,
    receipt.clientDocument ? `CPF/CNPJ: ${receipt.clientDocument}` : '',
    receipt.clientPhone ? `Telefone: ${receipt.clientPhone}` : '',
    receipt.clientAddress ? `Endereço: ${receipt.clientAddress}` : '',
    ``,
    `Valor Total da ${receipt.sourceType === 'os' ? 'OS' : 'Venda'}: ${formatBRL(receipt.orderTotal)}`,
    priorHistoryLines,
    `*Valor Pago neste Lançamento:* ${formatBRL(receipt.amountPaidNow)}`,
    `Total Já Pago Acumulado: ${formatBRL(receipt.totalPaidAccumulated)}`,
    `*Saldo Restante a Pagar:* ${formatBRL(receipt.isFullyPaid ? 0 : receipt.remainingBalance)}`,
    `Forma de Pagamento: ${methodsLine}`,
    receipt.nsu ? `Autenticação / NSU: ${receipt.nsu}` : '',
    ``,
    statusLine
  ]
    .filter(Boolean)
    .join('\n');
};

export const downloadReceiptPdf = (
  receipt: PaymentReceipt,
  company: CompanySettings,
  format: 'a4' | 'thermal' = 'a4'
): void => {
  if (format === 'thermal') {
    downloadThermal80mmPdf(receipt, company);
    return;
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  let cursorY = 12;

  const companyDisplayName = company.tradeName || company.companyName || 'FIRE GESTÃO';
  const classificationTitle = getOsReceiptClassificationTitle(
    receipt.paymentKind,
    receipt.isFullyPaid
  );
  const originLabel =
    receipt.sourceType === 'os'
      ? `OS Nº ${receipt.sourceCode}`
      : `VENDA Nº ${receipt.sourceCode}`;

  // ===== CABEÇALHO PADRÃO DA OS (Empresa à esquerda + Box OS/Recibo à direita) =====
  const boxWidth = 58;
  const boxX = pageWidth - marginX - boxWidth;

  // Logo (se disponível como data URL)
  let textStartX = marginX;
  if (company.logoUrl && company.logoUrl.startsWith('data:image/')) {
    try {
      const imgType = company.logoUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(company.logoUrl, imgType, marginX, cursorY, 18, 18);
      textStartX = marginX + 21;
    } catch {
      textStartX = marginX;
    }
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(companyDisplayName.toUpperCase().slice(0, 36), textStartX, cursorY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  let infoY = cursorY + 9.5;
  if (company.companyName && company.companyName !== companyDisplayName) {
    doc.setFont('helvetica', 'bold');
    doc.text(company.companyName.toUpperCase().slice(0, 52), textStartX, infoY);
    doc.setFont('helvetica', 'normal');
    infoY += 4;
  }
  const companyAddr = [
    [company.street, company.number].filter(Boolean).join(', '),
    company.neighborhood,
    company.city ? `${company.city} / ${company.state || ''}` : ''
  ]
    .filter(Boolean)
    .join(' - ');
  if (companyAddr) {
    doc.text(companyAddr.slice(0, 62), textStartX, infoY);
    infoY += 4;
  }
  const companyContacts = [
    company.phone ? `Tel: ${company.phone}` : '',
    company.email ? `E-mail: ${company.email}` : '',
    company.cnpj ? `CNPJ: ${company.cnpj}` : ''
  ]
    .filter(Boolean)
    .join(' | ');
  if (companyContacts) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(companyContacts.slice(0, 66), textStartX, infoY);
  }

  // Right Box matching Standard OS Header
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.roundedRect(boxX, cursorY, boxWidth, 21, 1.5, 1.5, 'S');
  doc.setFillColor(15, 23, 42);
  doc.rect(boxX, cursorY, boxWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(classificationTitle.toUpperCase(), boxX + boxWidth / 2, cursorY + 4.2, {
    align: 'center'
  });

  doc.setTextColor(15, 23, 42);
  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.text(originLabel, boxX + boxWidth / 2, cursorY + 12.2, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Recibo ${receipt.receiptNumber}`, boxX + boxWidth / 2, cursorY + 16.5, {
    align: 'center'
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(formatDateTimeBR(receipt.createdAt), boxX + boxWidth / 2, cursorY + 19.8, {
    align: 'center'
  });

  // Strong OS-style bottom rule
  cursorY += 24;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.7);
  doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
  cursorY += 4;

  // ===== FAIXA DE CLASSIFICAÇÃO DO PAGAMENTO =====
  const isEntry = !receipt.isFullyPaid && receipt.paymentKind === 'entrada';
  if (receipt.isFullyPaid) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(16, 185, 129);
  } else if (isEntry) {
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(59, 130, 246);
  } else {
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(245, 158, 11);
  }
  doc.setLineWidth(0.5);
  doc.roundedRect(marginX, cursorY, contentWidth, 13, 1.5, 1.5, 'FD');

  if (receipt.isFullyPaid) {
    doc.setTextColor(6, 95, 70);
  } else if (isEntry) {
    doc.setTextColor(30, 64, 175);
  } else {
    doc.setTextColor(146, 64, 14);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(classificationTitle.toUpperCase(), marginX + 4, cursorY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.text(
    receipt.isFullyPaid
      ? `Pagamento integral confirmado referente à ${originLabel}. Saldo restante: R$ 0,00.`
      : `Lançamento confirmado referente à ${originLabel}. Saldo restante a pagar: ${formatBRL(receipt.remainingBalance)}.`,
    marginX + 4,
    cursorY + 10.5
  );

  doc.setFont('courier', 'bold');
  doc.setFontSize(11.5);
  doc.text(formatBRL(receipt.amountPaidNow), pageWidth - marginX - 4, cursorY + 8, {
    align: 'right'
  });

  cursorY += 17;

  // ===== DADOS DO CLIENTE & REFERÊNCIA DA OS (2 Colunas estilo OS) =====
  const halfW = (contentWidth - 4) / 2;
  const cardH = 27;

  // Card 1: Dados do Cliente
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(marginX, cursorY, halfW, cardH, 'S');
  doc.setFillColor(238, 243, 248);
  doc.rect(marginX, cursorY, halfW, 5.5, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DADOS DO CLIENTE', marginX + 3, cursorY + 4);

  doc.setFontSize(8.5);
  doc.text((receipt.clientName || 'Cliente').toUpperCase().slice(0, 42), marginX + 3, cursorY + 10.2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`CPF/CNPJ: ${receipt.clientDocument || '-'}`, marginX + 3, cursorY + 14.8);
  doc.text(`Telefone: ${receipt.clientPhone || '-'}`, marginX + 3, cursorY + 19.2);
  doc.text(`End.: ${(receipt.clientAddress || '-').slice(0, 48)}`, marginX + 3, cursorY + 23.8);

  // Card 2: Dados do Pagamento & OS
  const rightCardX = marginX + halfW + 4;
  doc.rect(rightCardX, cursorY, halfW, cardH, 'S');
  doc.setFillColor(238, 243, 248);
  doc.rect(rightCardX, cursorY, halfW, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('REFERÊNCIA E COMPROVANTE', rightCardX + 3, cursorY + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(
    receipt.sourceType === 'os'
      ? `Ordem de Serviço Nº ${receipt.sourceCode}`
      : `Venda Direta Nº ${receipt.sourceCode}`,
    rightCardX + 3,
    cursorY + 10.2
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Classificação: ${classificationTitle}`, rightCardX + 3, cursorY + 14.8);
  doc.text(`Data/Hora: ${formatDateTimeBR(receipt.createdAt)}`, rightCardX + 3, cursorY + 19.2);
  doc.text(
    `Forma: ${RECEIPT_METHOD_LABELS[receipt.paymentMethod] || receipt.paymentMethod}${
      receipt.nsu ? ` · NSU: ${receipt.nsu}` : ''
    }`,
    rightCardX + 3,
    cursorY + 23.8
  );

  cursorY += cardH + 5;

  // ===== HISTÓRICO DE PAGAMENTOS ANTERIORES (SE HOUVER) =====
  const priorHistory = receipt.previousPaymentsHistory || [];
  if (priorHistory.length > 0 || receipt.previouslyPaid > 0.01) {
    const historyBody =
      priorHistory.length > 0
        ? priorHistory.map((h, idx) => [
            String(idx + 1).padStart(2, '0'),
            formatDateOnlyBR(h.date),
            h.receiptNumber || 'Lançamento Anterior',
            RECEIPT_METHOD_LABELS[h.method] || h.method,
            formatBRL(h.amount)
          ])
        : [['01', '-', 'Pagamentos Anteriores Acumulados', '-', formatBRL(receipt.previouslyPaid)]];

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [['#', 'Data', 'Recibo / Referência Anterior', 'Forma', 'Valor Pago']],
      body: historyBody,
      styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
      headStyles: { fillColor: [238, 243, 248], textColor: [30, 41, 59], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 24 },
        4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
      }
    });
    cursorY = ((doc as any).lastAutoTable?.finalY || cursorY + 18) + 5;
  }

  // ===== DETALHAMENTO DOS ITENS / SERVIÇOS DA OS =====
  if (receipt.items && receipt.items.length > 0) {
    const itemRows = receipt.items.map((item, idx) => [
      String(idx + 1).padStart(2, '0'),
      item.name,
      String(item.quantity),
      formatBRL(item.unitPrice),
      formatBRL(item.totalPrice)
    ]);

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [['#', 'Itens / Serviços da Ordem de Serviço', 'Qtd', 'Unitário', 'Subtotal']],
      body: itemRows,
      styles: { fontSize: 7.8, cellPadding: 2, textColor: [30, 41, 59] },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 26, halign: 'right' },
        4: { cellWidth: 26, halign: 'right' }
      }
    });
    cursorY = ((doc as any).lastAutoTable?.finalY || cursorY + 20) + 6;
  }

  // ===== FORMA DE PAGAMENTO DESTE LANÇAMENTO + RESUMO FINANCEIRO =====
  const payRows = (receipt.payments && receipt.payments.length > 0
    ? receipt.payments
    : [
        {
          id: '1',
          method: receipt.paymentMethod,
          amount: receipt.amountPaidNow,
          netAmount: receipt.amountPaidNow
        }
      ]
  ).map(p => [
    RECEIPT_METHOD_LABELS[p.method] || p.method,
    p.cardBrand
      ? `${p.cardBrand.toUpperCase()}${p.installments && p.installments > 1 ? ` (${p.installments}x)` : ''}`
      : formatDateOnlyBR(p.paidAt || receipt.createdAt),
    formatBRL(p.amount)
  ]);

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: pageWidth / 2 + 2 },
    head: [['Forma de Pagamento', 'Data / Detalhe', 'Valor']],
    body: payRows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [238, 243, 248], textColor: [30, 41, 59], fontStyle: 'bold' },
    columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } }
  });

  const summaryX = pageWidth / 2 + 4;
  const summaryWidth = pageWidth - marginX - summaryX;
  const summaryHeight = 38;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.roundedRect(summaryX, cursorY, summaryWidth, summaryHeight, 1.5, 1.5, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Valor Total da ${receipt.sourceType === 'os' ? 'OS' : 'Venda'}:`, summaryX + 3.5, cursorY + 6.5);
  doc.setFont('helvetica', 'bold');
  doc.text(formatBRL(receipt.orderTotal), summaryX + summaryWidth - 3.5, cursorY + 6.5, {
    align: 'right'
  });

  doc.setFont('helvetica', 'normal');
  doc.text('Pagamentos Anteriores:', summaryX + 3.5, cursorY + 12.2);
  doc.text(formatBRL(receipt.previouslyPaid), summaryX + summaryWidth - 3.5, cursorY + 12.2, {
    align: 'right'
  });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.setFontSize(9.5);
  doc.text('Pago neste Lançamento:', summaryX + 3.5, cursorY + 18.8);
  doc.text(formatBRL(receipt.amountPaidNow), summaryX + summaryWidth - 3.5, cursorY + 18.8, {
    align: 'right'
  });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.text('Total Pago Acumulado:', summaryX + 3.5, cursorY + 24.5);
  doc.text(formatBRL(receipt.totalPaidAccumulated), summaryX + summaryWidth - 3.5, cursorY + 24.5, {
    align: 'right'
  });

  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX + 3, cursorY + 27.5, summaryX + summaryWidth - 3, cursorY + 27.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(receipt.isFullyPaid ? 6 : 190, receipt.isFullyPaid ? 95 : 18, receipt.isFullyPaid ? 70 : 60);
  doc.text('Saldo Restante a Pagar:', summaryX + 3.5, cursorY + 33.5);
  doc.text(
    formatBRL(receipt.isFullyPaid ? 0 : receipt.remainingBalance),
    summaryX + summaryWidth - 3.5,
    cursorY + 33.5,
    { align: 'right' }
  );

  // Observações (se houver)
  let nextY = Math.max(cursorY + summaryHeight + 5, ((doc as any).lastAutoTable?.finalY || cursorY) + 8);
  if (receipt.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Observações: ${receipt.notes}`, marginX, nextY);
    nextY += 6;
  }

  // ===== CAMPO PARA ASSINATURAS =====
  const signY = Math.min(266, Math.max(nextY + 18, 225));
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.35);
  doc.line(marginX + 8, signY, marginX + 82, signY);
  doc.line(pageWidth - marginX - 82, signY, pageWidth - marginX - 8, signY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  doc.text(companyDisplayName.toUpperCase(), marginX + 45, signY + 4.5, { align: 'center' });
  doc.text((receipt.clientName || 'Cliente').toUpperCase(), pageWidth - marginX - 45, signY + 4.5, {
    align: 'center'
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Assinatura do Responsável · Op.: ${receipt.operatorName}`, marginX + 45, signY + 8.5, {
    align: 'center'
  });
  doc.text(
    `Assinatura do Cliente · ${receipt.clientDocument || 'Pagador'}`,
    pageWidth - marginX - 45,
    signY + 8.5,
    { align: 'center' }
  );

  doc.save(`Recibo_${receipt.receiptNumber}_${receipt.sourceCode}.pdf`);
};

const downloadThermal80mmPdf = (receipt: PaymentReceipt, company: CompanySettings): void => {
  const priorCount = receipt.previousPaymentsHistory?.length || 0;
  const estimatedHeight = Math.max(165, 125 + receipt.items.length * 6 + priorCount * 5);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, estimatedHeight] });
  const w = 80;
  const mx = 4;
  let y = 7;

  const classificationTitle = getOsReceiptClassificationTitle(
    receipt.paymentKind,
    receipt.isFullyPaid
  );

  doc.setTextColor(20, 20, 20);
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.text((company.tradeName || company.companyName || 'FIRE GESTÃO').slice(0, 32), w / 2, y, {
    align: 'center'
  });
  y += 4.2;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  if (company.cnpj) {
    doc.text(`CNPJ: ${company.cnpj}`, w / 2, y, { align: 'center' });
    y += 3.5;
  }
  if (company.phone) {
    doc.text(`Tel: ${company.phone}`, w / 2, y, { align: 'center' });
    y += 3.5;
  }

  doc.line(mx, y, w - mx, y);
  y += 4.2;

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.text(classificationTitle.toUpperCase(), w / 2, y, { align: 'center' });
  y += 4;
  doc.setFontSize(8);
  doc.text(
    `${receipt.sourceType === 'os' ? 'OS' : 'VENDA'} Nº ${receipt.sourceCode} | ${receipt.receiptNumber}`,
    w / 2,
    y,
    { align: 'center' }
  );
  y += 3.8;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.2);
  doc.text(formatDateTimeBR(receipt.createdAt), w / 2, y, { align: 'center' });
  y += 3.5;
  doc.line(mx, y, w - mx, y);
  y += 4;

  // Client
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.8);
  doc.text(`CLIENTE: ${receipt.clientName.slice(0, 30)}`, mx, y);
  y += 3.6;
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.2);
  if (receipt.clientDocument) {
    doc.text(`DOC: ${receipt.clientDocument}`, mx, y);
    y += 3.4;
  }
  if (receipt.clientPhone) {
    doc.text(`TEL: ${receipt.clientPhone}`, mx, y);
    y += 3.4;
  }
  doc.line(mx, y, w - mx, y);
  y += 4;

  // Values
  doc.setFontSize(7.5);
  doc.text(`TOTAL DA ${receipt.sourceType === 'os' ? 'OS' : 'VENDA'}:`, mx, y);
  doc.text(formatBRL(receipt.orderTotal), w - mx, y, { align: 'right' });
  y += 3.6;

  if (receipt.previouslyPaid > 0.01) {
    doc.text('PAGOS ANTERIORES:', mx, y);
    doc.text(formatBRL(receipt.previouslyPaid), w - mx, y, { align: 'right' });
    y += 3.6;
  }

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.text('PAGO NESTE LANC.:', mx, y);
  doc.text(formatBRL(receipt.amountPaidNow), w - mx, y, { align: 'right' });
  y += 4.2;

  doc.setFontSize(8);
  doc.text('SALDO RESTANTE:', mx, y);
  doc.text(formatBRL(receipt.isFullyPaid ? 0 : receipt.remainingBalance), w - mx, y, {
    align: 'right'
  });
  y += 5;

  doc.rect(mx, y - 3.5, w - mx * 2, 7);
  doc.text(
    receipt.isFullyPaid ? '*** QUITADO (R$ 0,00) ***' : classificationTitle.toUpperCase(),
    w / 2,
    y + 1,
    { align: 'center' }
  );
  y += 7;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.2);
  const payDesc =
    receipt.payments && receipt.payments.length > 0
      ? receipt.payments
          .map(p => `${RECEIPT_METHOD_LABELS[p.method]} ${formatBRL(p.amount)}`)
          .join(', ')
      : `${RECEIPT_METHOD_LABELS[receipt.paymentMethod]}`;
  const payLines = doc.splitTextToSize(`FORMA PGTO: ${payDesc}`, w - mx * 2);
  doc.text(payLines, mx, y);
  y += payLines.length * 3.4 + 8;

  doc.line(mx + 6, y, w - mx - 6, y);
  y += 3.5;
  doc.text('Assinatura', w / 2, y, { align: 'center' });

  doc.save(`Recibo_80mm_${receipt.receiptNumber}.pdf`);
};
