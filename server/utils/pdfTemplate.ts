import PDFDocument from 'pdfkit';
import { existsSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';

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
  const buildAddress = (address: {
    street?: string | null
    number?: string | null
    complement?: string | null
    city?: string | null
    state?: string | null
    zipcode?: string | null
  }) => {
    const streetLine = [address.street, address.number, address.complement]
      .map((part) => `${part ?? ''}`.trim())
      .filter(Boolean)
      .join(' ');

    const cityState = [address.city, address.state]
      .map((part) => `${part ?? ''}`.trim())
      .filter(Boolean)
      .join('-');

    return [streetLine, cityState, `${address.zipcode ?? ''}`.trim()]
      .filter(Boolean)
      .join(', ');
  };

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);

    const prescriberDisplayName = prescriber.full_name || prescriber.email || prescriber;
    const signatureStatus: SignatureStatus = options.signatureStatus === 'signed' ? 'signed' : 'unsigned';
    const signatureStamp = signatureStatus === 'signed' ? `${prescriberDisplayName}` : 'DOCUMENTO NÃO ASSINADO';
    const signatureStampColor = signatureStatus === 'signed' ? '#000000' : '#B91C1C';
    const signatureFontPathCandidates = [
      resolvePath(process.cwd(), 'public', 'Thesignature.ttf'),
      resolvePath(process.cwd(), '.output', 'public', 'Thesignature.ttf'),
    ];
    const signatureFontPath = signatureFontPathCandidates.find((candidatePath) => existsSync(candidatePath));

    // Header / Prescription Date
    doc.fontSize(12).text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'right' });
    doc.moveDown();

    // Patient & CID Info
    doc.fontSize(14).text('Informações do Paciente', { underline: true });
    doc.fontSize(12).text(`Nome: ${patient.name || patient}`);
    const patientAddress = buildAddress({
      street: patient.street,
      number: patient.house_number || patient.address_number,
      complement: patient.additional_info || patient.complement,
      city: patient.city,
      state: patient.state,
      zipcode: patient.zipcode,
    });
    doc.fontSize(12).text(`Endereço: ${patientAddress}`);
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
    if (signatureStatus === 'signed' && signatureFontPath) {
      doc.registerFont('prescriber-signature', signatureFontPath);
      doc.font('prescriber-signature').fontSize(24).fillColor(signatureStampColor).text(signatureStamp, { align: 'center' });
      doc.font('Helvetica');
    } else {
      doc.fontSize(10).fillColor(signatureStampColor).text(signatureStamp, { align: 'center' });
    }
    doc.fillColor('black');
    doc.fontSize(12).text('_____________________________________', { align: 'center' });
    doc.text(`${prescriberDisplayName}`, { align: 'center' });
    if (prescriber.council && prescriber.council_number && prescriber.council_state) {
      doc.text(`${prescriber.council}: ${prescriber.council_number} / ${prescriber.council_state}`, { align: 'center' });
    }

    // presriber address and contact
    const builtAddress = buildAddress({
      street: prescriber.street,
      number: prescriber.address_number,
      complement: prescriber.complement,
      city: prescriber.city,
      state: prescriber.state,
      zipcode: prescriber.zipcode,
    });
    if (builtAddress) {
      doc.text(builtAddress, { align: 'center' });
    }
    if (prescriber.phone) {
      doc.text(`Tel: ${prescriber.phone}`, { align: 'center' });
    }

    doc.end();
  });
}
