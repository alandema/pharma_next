import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import type { H3Event } from 'h3';
import { queryCollection } from '@nuxt/content/server';

export async function generatePDFDocument(event: H3Event, body: any, prescriber: any, patient: any): Promise<Buffer> {
  const businessData = await queryCollection(event, 'business_info').first();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);
    
    // Add Logo
    const logoPath = path.resolve('public', 'logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, { width: 150, align: 'center' });
      doc.moveDown(2);
    } else {
      doc.fontSize(24).text(businessData?.name || 'Amma Farmácia', { align: 'center' });

      doc.moveDown(2);
    }

    if (businessData?.address) doc.fontSize(12).text(businessData.address, { align: 'center' });
    if (businessData?.phone) doc.fontSize(12).text(businessData.phone, { align: 'center' });
    if (businessData?.email || businessData?.website || businessData?.cnpj) {
      const contactInfo = [businessData?.email, businessData?.website, businessData?.cnpj].filter(Boolean).join(' | ');
      doc.fontSize(10).text(contactInfo, { align: 'center' });
    }

    // Header / Prescription Date
    doc.fontSize(12).text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'right' });
    doc.moveDown();

    // Patient & CID Info
    doc.fontSize(14).text('Informações do Paciente', { underline: true });
    doc.fontSize(12).text(`Nome: ${patient.name || patient}`);
    if (body?.cid_code) {
      doc.text(`CID: ${body.cid_code}`);
    }
    doc.moveDown();
    
    // Formulas / Medicines
    doc.fontSize(14).text('Prescrição', { underline: true });
    doc.moveDown();

    if (!Array.isArray(body?.formulas)) {
      reject(new Error('Formato inválido: formulas deve ser um array.'));
      return;
    }

    const formulas = body.formulas;
    formulas.forEach((f: any, index: number) => {
      doc.fontSize(12).text(`${index + 1}. ${f.formula_name || 'Fórmula'}`, { continued: f.description ? false : true });
      if (f.description) {
        doc.fontSize(11).text(`${f.description}`);
      }
      doc.moveDown();
    });

    // Prescriber Info (Footer-ish)
    doc.moveDown(4);
    doc.fontSize(12).text('_____________________________________', { align: 'center' });
    doc.text(`Dr(a). ${prescriber.full_name || prescriber.username || prescriber}`, { align: 'center' });
    if (prescriber.council && prescriber.council_number && prescriber.council_state) {
      doc.text(`${prescriber.council}: ${prescriber.council_number} / ${prescriber.council_state}`, { align: 'center' });
    }
    if (prescriber.professional_type) {
      doc.text(`${prescriber.professional_type}`, { align: 'center' });
    }

    doc.end();
  });
}
