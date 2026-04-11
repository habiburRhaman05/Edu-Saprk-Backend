import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { IInvoicePayload } from './payment.interface';

export const generatePaymentInvoiceBuffer = (data: IInvoicePayload): Promise<Buffer> => {
   console.log(data);
   
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    // --- Branding ---
    const logoPath = path.join(__dirname, '../../assets/invoice-logo.svg');
    const isSuccess = data.status === 'COMPLETE';
    const primaryColor = '#0070f3';
    const secondaryColor = '#444'; 
    const statusBgColor = isSuccess ? '#e0f2ff' : '#ffe5e5';
    const statusTextColor = isSuccess ? '#0b3d91' : '#b91c1c';
    const statusLabel = isSuccess ? 'Payment Receipt' : 'Payment Failed';

    // --- Header: Logo + Title ---
    // Add error handling for logo
    try {
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 120 });
      } else {
        console.warn('Logo not found at:', logoPath);
      }
    } catch (error) {
      console.error('Failed to add logo:', error);
      // Continue without logo
    }
    
    doc.fillColor(primaryColor).fontSize(20).text('Blitz-Analyzer', 180, 50);
    doc.fontSize(12).fillColor(secondaryColor).text(statusLabel, 180, 75);
    
    // --- Invoice Info ---
    doc.moveDown(2);
    doc.fontSize(10).fillColor('#000')
       .text(`Invoice No: ${data.invoiceNumber}`, 400, 50, { align: 'right' })
       .text(`Date: ${data.paymentTime}`, 400, 65, { align: 'right' });
    
    doc.moveTo(50, 120).lineTo(550, 120).strokeColor('#eeeeee').stroke();

    // --- Billing Details ---
    doc.moveDown();
    doc.fontSize(12).fillColor(primaryColor).text('Bill To:', 50);
    doc.fontSize(11).fillColor('#000')
       .text(`Name: ${data.userName}`)
       .text(`Email: ${data.userEmail}`)
       .text(`Payment Method: ${data.paymentMethod}`)
       .text(`Status: ${data.status}`, { oblique: true });
    
    // --- Table Header ---
    const tableTop = 240;
    doc.rect(50, tableTop, 500, 20).fill('#f9fafb').stroke();
    doc.fillColor('#444').fontSize(10)
       .text('Description', 60, tableTop + 5)
       .text('Credits', 300, tableTop + 5)
       .text('Amount', 480, tableTop + 5);

    // --- Table Row ---
    const rowY = tableTop + 30;
    doc.fillColor('#000')
       .text(`${data.planName} Plan`, 60, rowY)
       .text(`${data.credits} Credits`, 300, rowY)
       .text(`$${data.amount.toFixed(2)}`, 480, rowY);
    
    doc.moveTo(50, rowY + 20).lineTo(550, rowY + 20).strokeColor('#eeeeee').stroke();

    // --- Total Amount ---
    doc.fontSize(14).fillColor(primaryColor)
       .text(`Total: $${data.amount.toFixed(2)}`, 400, rowY + 40);

    // --- Status Message Box ---
    const boxY = rowY + 80;
    doc.roundedRect(50, boxY, 500, 50, 5).fill(statusBgColor);
    doc.fillColor(statusTextColor).fontSize(11)
       .text(data.message, 60, boxY + 15, { width: 480, align: 'center' });

    // --- Footer ---
    doc.fontSize(8).fillColor('#999')
       .text('Blitz-Analyzer • support@blitz-analyzer.com • www.blitz-analyzer.vercel.app', 50, 780, { align: 'center' });

    doc.end();
  });
};