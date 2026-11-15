import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanySettings, PaymentMethod, PaymentReceipt } from '../types';

export const RECEIPT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  boleto: 'Boleto Bancário',
  faturado_30d: 'Faturado 30 Dias',
  transferencia: 'Transferência Bancária',
  transferencia_ted: 'TED / DOC'
};

export const RECEIPT_KIND_LABELS: Record<PaymentReceipt['paymentKind'], string> = {
  vista: 'Pagamento à Vista',
  entrada: 'Entrada / Sinal',
  parcela: 'Pagamento de Parcela',
  parcial: 'Pagamento Parcial',
  quitacao: 'Quitação de Saldo'
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

export const buildReceiptShareText = (
  receipt: PaymentReceipt,
  company: CompanySettings
): string => {
  const companyName = company.tradeName || company.companyName || 'GestãoPro';
  const originLabel =
    receipt.sourceType === 'os' ? `Ordem de Serviço ${receipt.sourceCode}` : `Venda ${receipt.sourceCode}`;
  const statusLine = receipt.isFullyPaid
    ? '✅ STATUS: QUITADO / INTEGRALMENTE PAGO'
    : `⏳ STATUS: PAGAMENTO PARCIAL — FALTA RESTANTE: ${formatBRL(receipt.remainingBalance)}`;

  const itemsSummary = receipt.items
    .filter(i => i.kind !== 'desconto')
    .slice(0, 8)
    .map(i => `• ${i.quantity}x ${i.name} (${formatBRL(i.totalPrice)})`)
    .join('\n');

  const methodsLine =
    receipt.payments && receipt.payments.length > 0
      ? receipt.payments
          .map(p => `${RECEIPT_METHOD_LABELS[p.method] || p.method}: ${formatBRL(p.amount)}`)
          .join(' | ')
      : `${RECEIPT_METHOD_LABELS[receipt.paymentMethod] || receipt.paymentMethod}: ${formatBRL(receipt.amountPaidNow)}`;

  return [
    `*${companyName}* — RECIBO DE PAGAMENTO`,
    `Recibo Nº: *${receipt.receiptNumber}*`,
    `Data/Hora: ${formatDateTimeBR(receipt.createdAt)}`,
    `Origem: ${originLabel} (${RECEIPT_KIND_LABELS[receipt.paymentKind]})`,
    ``,
    `*Cliente:* ${receipt.clientName}`,
    receipt.clientDocument ? `CPF/CNPJ: ${receipt.clientDocument}` : '',
    receipt.clientPhone ? `Telefone: ${receipt.clientPhone}` : '',
    receipt.clientAddress ? `Endereço: ${receipt.clientAddress}` : '',
    ``,
    itemsSummary ? `*Itens / Serviços:*\n${itemsSummary}` : '',
    ``,
    `*Valor Pago Agora:* ${formatBRL(receipt.amountPaidNow)}`,
    `Total da Operação: ${formatBRL(receipt.orderTotal)}`,
    receipt.previouslyPaid > 0 ? `Pago Anteriormente: ${formatBRL(receipt.previouslyPaid)}` : '',
    `Total Já Pago: ${formatBRL(receipt.totalPaidAccumulated)}`,
    !receipt.isFullyPaid ? `*Saldo Devedor Restante:* ${formatBRL(receipt.remainingBalance)}` : '',
    `Forma de Pagamento: ${methodsLine}`,
    receipt.nsu ? `Autenticação / NSU: ${receipt.nsu}` : '',
    `Operador: ${receipt.operatorName} · ${receipt.terminalName}`,
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
  let cursorY = 14;

  // Header band
  doc.setFillColor(83, 56, 62); // #53383e
  doc.rect(marginX, cursorY, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(company.tradeName || company.companyName || 'GestãoPro', marginX + 5, cursorY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const companyLine = [
    company.cnpj ? `CNPJ: ${company.cnpj}` : '',
    company.phone ? `Tel: ${company.phone}` : '',
    company.email ? company.email : ''
  ]
    .filter(Boolean)
    .join('  ·  ');
  if (companyLine) {
    doc.text(companyLine, marginX + 5, cursorY + 13.5);
  }
  if (company.address) {
    doc.text(`${company.address}${company.city ? ` - ${company.city}/${company.state}` : ''}`, marginX + 5, cursorY + 18);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('RECIBO DE PAGAMENTO', pageWidth - marginX - 5, cursorY + 8.5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Nº ${receipt.receiptNumber}`, pageWidth - marginX - 5, cursorY + 14, { align: 'right' });
  doc.setFontSize(8);
  doc.text(formatDateTimeBR(receipt.createdAt), pageWidth - marginX - 5, cursorY + 18.5, { align: 'right' });

  cursorY += 27;

  // Stamp Banner (QUITADO vs PARCIAL)
  if (receipt.isFullyPaid) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.6);
    doc.roundedRect(marginX, cursorY, contentWidth, 13, 2, 2, 'FD');
    doc.setTextColor(6, 95, 70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('QUITADO / INTEGRALMENTE PAGO', marginX + 5, cursorY + 8.2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Valor Total Quitado: ${formatBRL(receipt.orderTotal)}`, pageWidth - marginX - 5, cursorY + 8.2, {
      align: 'right'
    });
  } else {
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.6);
    doc.roundedRect(marginX, cursorY, contentWidth, 15, 2, 2, 'FD');
    doc.setTextColor(146, 64, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(
      `PAGAMENTO PARCIAL (${RECEIPT_KIND_LABELS[receipt.paymentKind].toUpperCase()})`,
      marginX + 5,
      cursorY + 6.5
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      `Pago Agora: ${formatBRL(receipt.amountPaidNow)}   |   Total da OS/Venda: ${formatBRL(receipt.orderTotal)}   |   Saldo Devedor Restante: ${formatBRL(receipt.remainingBalance)}`,
      marginX + 5,
      cursorY + 11.8
    );
  }
  cursorY += 19;

  // Customer Details Card
  doc.setDrawColor(216, 216, 216);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, cursorY, contentWidth, 24, 2, 2, 'FD');
  doc.setTextColor(83, 56, 62);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DADOS DO CLIENTE / PAGADOR', marginX + 4, cursorY + 5.5);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(receipt.clientName || 'Consumidor Balcão', marginX + 4, cursorY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `CPF / CNPJ: ${receipt.clientDocument || 'Não informado'}   ·   Telefone: ${receipt.clientPhone || 'Não informado'}`,
    marginX + 4,
    cursorY + 16
  );
  const addressLine = receipt.clientAddress || 'Endereço não cadastrado';
  doc.text(`Endereço: ${addressLine.slice(0, 105)}`, marginX + 4, cursorY + 21);

  cursorY += 29;

  // Operation Origin Block
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(216, 216, 216);
  doc.roundedRect(marginX, cursorY, contentWidth, 18, 2, 2, 'FD');
  doc.setTextColor(83, 56, 62);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('ORIGEM DA OPERAÇÃO & CAIXA', marginX + 4, cursorY + 5.5);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const originText =
    receipt.sourceType === 'os'
      ? `Ordem de Serviço Nº ${receipt.sourceCode}`
      : `Venda Direta / Balcão Nº ${receipt.sourceCode}`;
  doc.text(
    `${originText}   ·   Operador: ${receipt.operatorName}   ·   Terminal: ${receipt.terminalName}`,
    marginX + 4,
    cursorY + 11
  );
  doc.text(
    `Sessão de Caixa: ${receipt.cashSessionCode || receipt.cashSessionId}${receipt.nsu ? `   ·   Autenticação / NSU: ${receipt.nsu}` : ''}`,
    marginX + 4,
    cursorY + 15.5
  );

  cursorY += 23;

  // Items / Services Table
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
    head: [['#', 'Descrição do Item / Serviço', 'Qtd', 'Unitário', 'Subtotal']],
    body: itemRows.length > 0 ? itemRows : [['01', originText, '1', formatBRL(receipt.orderTotal), formatBRL(receipt.orderTotal)]],
    styles: { fontSize: 8, cellPadding: 2.2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [83, 56, 62], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' }
    }
  });

  const finalY = ((doc as any).lastAutoTable?.finalY || cursorY + 25) + 6;
  cursorY = finalY;

  // Payment Methods Table + Financial Summary Box side by side
  const payRows = (receipt.payments && receipt.payments.length > 0
    ? receipt.payments
    : [{ id: '1', method: receipt.paymentMethod, amount: receipt.amountPaidNow, netAmount: receipt.amountPaidNow }]
  ).map(p => [
    RECEIPT_METHOD_LABELS[p.method] || p.method,
    p.cardBrand ? `${p.cardBrand.toUpperCase()}${p.installments && p.installments > 1 ? ` (${p.installments}x)` : ''}` : '—',
    formatBRL(p.amount)
  ]);

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: pageWidth / 2 + 2 },
    head: [['Forma de Pagamento', 'Detalhe', 'Valor']],
    body: payRows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [54, 55, 57], textColor: [255, 255, 255] },
    columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } }
  });

  const summaryX = pageWidth / 2 + 4;
  const summaryWidth = pageWidth - marginX - summaryX;
  doc.setFillColor(246, 239, 241);
  doc.setDrawColor(83, 56, 62);
  doc.roundedRect(summaryX, cursorY, summaryWidth, 34, 2, 2, 'FD');

  doc.setTextColor(54, 55, 57);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Total da OS / Venda:', summaryX + 4, cursorY + 6.5);
  doc.text(formatBRL(receipt.orderTotal), summaryX + summaryWidth - 4, cursorY + 6.5, { align: 'right' });

  doc.text('Pago Anteriormente:', summaryX + 4, cursorY + 12);
  doc.text(formatBRL(receipt.previouslyPaid), summaryX + summaryWidth - 4, cursorY + 12, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(83, 56, 62);
  doc.setFontSize(10);
  doc.text('VALOR PAGO AGORA:', summaryX + 4, cursorY + 18.5);
  doc.text(formatBRL(receipt.amountPaidNow), summaryX + summaryWidth - 4, cursorY + 18.5, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setTextColor(receipt.isFullyPaid ? 6 : 180, receipt.isFullyPaid ? 95 : 83, receipt.isFullyPaid ? 70 : 9);
  doc.text(receipt.isFullyPaid ? 'SALDO RESTANTE (QUITADO):' : 'SALDO DEVEDOR RESTANTE:', summaryX + 4, cursorY + 25.5);
  doc.text(formatBRL(receipt.remainingBalance), summaryX + summaryWidth - 4, cursorY + 25.5, { align: 'right' });

  if (receipt.changeAmount && receipt.changeAmount > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(54, 55, 57);
    doc.text(`Troco Devolvido: ${formatBRL(receipt.changeAmount)}`, summaryX + 4, cursorY + 31);
  }

  // Footer / Signature
  const signY = Math.max(cursorY + 46, ((doc as any).lastAutoTable?.finalY || cursorY) + 18);
  if (signY < 275) {
    doc.setDrawColor(148, 163, 184);
    doc.line(marginX + 10, signY, marginX + 80, signY);
    doc.line(pageWidth - marginX - 80, signY, pageWidth - marginX - 10, signY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${company.tradeName || company.companyName} · ${receipt.operatorName}`, marginX + 45, signY + 4.5, {
      align: 'center'
    });
    doc.text(`${receipt.clientName}`, pageWidth - marginX - 45, signY + 4.5, { align: 'center' });
  }

  doc.save(`Recibo_${receipt.receiptNumber}_${receipt.sourceCode}.pdf`);
};

const downloadThermal80mmPdf = (receipt: PaymentReceipt, company: CompanySettings): void => {
  const estimatedHeight = Math.max(155, 115 + receipt.items.length * 6.5);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, estimatedHeight] });
  const w = 80;
  const mx = 4;
  let y = 7;

  doc.setTextColor(20, 20, 20);
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.text((company.tradeName || company.companyName || 'GestãoPro').slice(0, 32), w / 2, y, { align: 'center' });
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
  doc.setFontSize(9.5);
  doc.text('RECIBO DE PAGAMENTO', w / 2, y, { align: 'center' });
  y += 4;
  doc.setFontSize(8);
  doc.text(`Nº ${receipt.receiptNumber}`, w / 2, y, { align: 'center' });
  y += 3.8;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.2);
  doc.text(formatDateTimeBR(receipt.createdAt), w / 2, y, { align: 'center' });
  y += 3.5;
  doc.text(`${receipt.terminalName} | Op: ${receipt.operatorName.slice(0, 16)}`, w / 2, y, { align: 'center' });
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
  if (receipt.clientAddress) {
    const addrLines = doc.splitTextToSize(`END: ${receipt.clientAddress}`, w - mx * 2);
    doc.text(addrLines.slice(0, 2), mx, y);
    y += addrLines.slice(0, 2).length * 3.3;
  }

  doc.line(mx, y, w - mx, y);
  y += 4;

  // Origin + Items
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.6);
  doc.text(
    `${receipt.sourceType === 'os' ? 'O.S.' : 'VENDA'}: ${receipt.sourceCode} (${RECEIPT_KIND_LABELS[receipt.paymentKind]})`,
    mx,
    y
  );
  y += 4;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  receipt.items.slice(0, 18).forEach(it => {
    const label = `${it.quantity}x ${it.name}`.slice(0, 27);
    doc.text(label, mx, y);
    doc.text(formatBRL(it.totalPrice), w - mx, y, { align: 'right' });
    y += 3.5;
  });

  doc.line(mx, y, w - mx, y);
  y += 4;

  // Values
  doc.setFontSize(7.5);
  doc.text('TOTAL DA OPERACAO:', mx, y);
  doc.text(formatBRL(receipt.orderTotal), w - mx, y, { align: 'right' });
  y += 3.6;

  if (receipt.previouslyPaid > 0) {
    doc.text('JA PAGO ANTES:', mx, y);
    doc.text(formatBRL(receipt.previouslyPaid), w - mx, y, { align: 'right' });
    y += 3.6;
  }

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.text('VALOR PAGO AGORA:', mx, y);
  doc.text(formatBRL(receipt.amountPaidNow), w - mx, y, { align: 'right' });
  y += 4.2;

  doc.setFontSize(8);
  if (receipt.isFullyPaid) {
    doc.text('SALDO RESTANTE:', mx, y);
    doc.text('R$ 0,00', w - mx, y, { align: 'right' });
    y += 5;
    doc.rect(mx, y - 3.5, w - mx * 2, 7);
    doc.text('*** QUITADO / INTEGRALMENTE PAGO ***', w / 2, y + 1, { align: 'center' });
    y += 7;
  } else {
    doc.text('FALTA RESTANTE:', mx, y);
    doc.text(formatBRL(receipt.remainingBalance), w - mx, y, { align: 'right' });
    y += 5;
    doc.rect(mx, y - 3.5, w - mx * 2, 7);
    doc.text('PAGAMENTO PARCIAL - SALDO ABERTO', w / 2, y + 1, { align: 'center' });
    y += 7;
  }

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.2);
  const payDesc =
    receipt.payments && receipt.payments.length > 0
      ? receipt.payments.map(p => `${RECEIPT_METHOD_LABELS[p.method]} ${formatBRL(p.amount)}`).join(', ')
      : `${RECEIPT_METHOD_LABELS[receipt.paymentMethod]}`;
  const payLines = doc.splitTextToSize(`PGTO: ${payDesc}`, w - mx * 2);
  doc.text(payLines, mx, y);
  y += payLines.length * 3.4;

  if (receipt.changeAmount && receipt.changeAmount > 0) {
    doc.text(`TROCO: ${formatBRL(receipt.changeAmount)}`, mx, y);
    y += 3.6;
  }
  if (receipt.nsu) {
    doc.text(`AUT/NSU: ${receipt.nsu}`, mx, y);
    y += 3.6;
  }

  y += 3;
  doc.text('Obrigado pela preferencia!', w / 2, y, { align: 'center' });

  doc.save(`Recibo_80mm_${receipt.receiptNumber}.pdf`);
};
