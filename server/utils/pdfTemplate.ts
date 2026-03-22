import PDFDocument from 'pdfkit';

export function generatePDFDocument(body: any, doctorName: string, patientName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);
    
    doc.fontSize(20).text('Prescription', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Doctor: ${doctorName}`);
    doc.text(`Patient: ${patientName}`);
    doc.moveDown();
    
    if (!Array.isArray(body?.formulas)) {
      reject(new Error('Formato inválido: formulas deve ser um array.'));
      return;
    }

    const formulas = body.formulas;
    formulas.forEach((f: any) => {
      if (f.formula_name) {
        doc.text(`- Formula: ${f.formula_name}`);
        doc.text(`  Descrição: ${f.description}`);
      } else {
        doc.text(`- Prescrição:`);
        doc.text(`  ${f.description}`);
      }
      doc.moveDown();
    });
    doc.end();
  });
}
