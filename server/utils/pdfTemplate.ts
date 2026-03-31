import PDFDocument from 'pdfkit';

type SignatureStatus = 'signed' | 'unsigned'

type PdfGenerationOptions = {
  signatureStatus?: SignatureStatus
}

export async function generatePDFDocument(
  body: any,
  prescriber: any,
  patient: any,
  options: PdfGenerationOptions = {},
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);

    const signatureStatus: SignatureStatus = options.signatureStatus === 'signed' ? 'signed' : 'unsigned';
    const signatureStamp = signatureStatus === 'signed' ? 'ASSINADO DIGITALMENTE' : 'DOCUMENTO NÃO ASSINADO';
    const signatureStampColor = signatureStatus === 'signed' ? '#000000' : '#B91C1C';

    const prescriberDisplayName = prescriber.full_name || prescriber.email || prescriber;

    // Header / Prescription Date
    doc.fontSize(12).text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'right' });
    doc.moveDown();

    // Patient & CID Info
    doc.fontSize(14).text('Informações do Paciente', { underline: true });
    doc.fontSize(12).text(`Nome: ${patient.name || patient}`);
    doc.fontSize(12).text(`Endereço: ${patient.street || ''} ${patient.address_number || ''} ${patient.complement || ''}, ${patient.city || ''}-${patient.state || ''}, ${patient.zipcode || ''}`.trim());
    doc.fontSize(12).text(`Telefone: ${patient.phone || ''}`);
    doc.moveDown();
    
    // Formulas / Medicines
        if (body?.cid_code) {
      doc.text(`CID: ${body.cid_code}`);
    }
    doc.moveDown();
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
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor(signatureStampColor).text(signatureStamp, { align: 'center' });
    doc.fillColor('black');
    doc.fontSize(12).text('_____________________________________', { align: 'center' });
    doc.text(`${prescriberDisplayName}`, { align: 'center' });
    if (prescriber.council && prescriber.council_number && prescriber.council_state) {
      doc.text(`${prescriber.council}: ${prescriber.council_number} / ${prescriber.council_state}`, { align: 'center' });
    }

    // presriber address and contact
    const builtAddress = `${prescriber.street || ''} ${prescriber.address_number || ''} ${prescriber.complement || ''}, ${prescriber.city || ''}-${prescriber.state || ''}, ${prescriber.zipcode || ''}`.trim();
    if (builtAddress) {
      doc.text(builtAddress, { align: 'center' });
    }
    if (prescriber.phone) {
      doc.text(`Tel: ${prescriber.phone}`, { align: 'center' });
    }

    doc.end();
  });
}
