import PDFDocument from 'pdfkit';

export async function generatePDFDocument(body: any, prescriber: any, patient: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);

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
    doc.text(`${prescriber.full_name || prescriber.username || prescriber}`, { align: 'center' });
    if (prescriber.council && prescriber.council_number && prescriber.council_state) {
      doc.text(`${prescriber.council}: ${prescriber.council_number} / ${prescriber.council_state}`, { align: 'center' });
    }

    doc.end();
  });
}
