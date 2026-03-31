import sgMail from '@sendgrid/mail';
import { put } from '@vercel/blob';
import { createHash } from 'node:crypto';
import { prescriptionPostBodySchema } from '../../utils/contractSchemas';
import { readStrictBody } from '../../utils/requestValidation';

const config = useRuntimeConfig();
const templateStorage = useStorage('assets:server');
const templateCache = new Map<string, string>();

async function getEmailTemplate(filename: string): Promise<string> {
  const cachedTemplate = templateCache.get(filename);
  if (cachedTemplate) {
    return cachedTemplate;
  }

  const template = await templateStorage.getItem<string>(filename);
  if (typeof template !== 'string') {
    throw createError({ statusCode: 500, statusMessage: `Template de e-mail ausente: ${filename}` });
  }

  templateCache.set(filename, template);
  return template;
}

export default defineEventHandler(async (event) => {
  
  const user = event.context.user;

  const body = await readStrictBody(event, prescriptionPostBodySchema)

  const isPreviewOnly = body.preview_only === true;

  if (!Array.isArray(body.formulas)) {
    throw createError({ statusCode: 400, statusMessage: 'Fórmulas devem ser enviadas como array.' });
  }

  const formulaItems = body.formulas;

  if (!body.patient_id) {
    throw createError({ statusCode: 400, statusMessage: 'Paciente é obrigatório.' });
  }

  if (!body.cid_code) {
    throw createError({ statusCode: 400, statusMessage: 'CID é obrigatório.' });
  }

  if (formulaItems.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Adicione ao menos uma fórmula.' });
  }

  if (formulaItems.length > 10) {
    throw createError({ statusCode: 400, statusMessage: 'Máximo de 10 fórmulas por prescrição.' });
  }

  const hasInvalidFormulaItem = formulaItems.some((item: { formula_id?: string; description?: string }) =>
    typeof item?.formula_id !== 'string' || item.formula_id.trim().length === 0 || typeof item.description !== 'string' || item.description.trim().length === 0
  );

  if (hasInvalidFormulaItem) {
    throw createError({ statusCode: 400, statusMessage: 'Cada fórmula deve ter fórmula e descrição.' });
  }

  const normalizedFormulaItems = formulaItems.map((item: { formula_id?: string; description?: string }) => ({
    formula_id: item.formula_id!.trim(),
    description: item.description!.trim(),
  }));

  const dbFormulaIds = Array.from(new Set(normalizedFormulaItems.filter(item => item.formula_id !== 'free').map((item) => item.formula_id)));
  
  let formulas: { id: string, name: string }[] = [];
  if (dbFormulaIds.length > 0) {
    formulas = await prisma.formulas.findMany({
      where: { id: { in: dbFormulaIds } },
      select: { id: true, name: true }
    });
    
    if (formulas.length !== dbFormulaIds.length) {
      throw createError({ statusCode: 400, statusMessage: 'Uma ou mais fórmulas são inválidas.' });
    }
  }

  const formulaMap = new Map([
    ...formulas.map((formula) => [formula.id, formula.name] as [string, string]),
    ['free', ''] as [string, string]
  ]);

  const signatureStatus = body.signature_status === 'signed' ? 'signed' : 'unsigned';

  const formInfo = {
    cid_code: body.cid_code,
    signature_status: signatureStatus,
    formulas: normalizedFormulaItems.map((item) => ({
      formula_id: item.formula_id,
      formula_name: formulaMap.get(item.formula_id)!,
      description: item.description,
    })),
  };

  const [prescriber, patient] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.userId } }),
    prisma.patient.findUnique({ where: { id: body.patient_id } })
  ]);

  if (isPreviewOnly) {
    if (!prescriber || !patient) {
      throw createError({ statusCode: 400, statusMessage: 'Não foi possível gerar pré-visualização para este paciente/prescritor.' });
    }

    const previewBuffer = await generatePDFDocument(formInfo, prescriber, patient, {
      signatureStatus,
    });
    const previewHash = createHash('sha256').update(previewBuffer).digest('hex');

    return {
      pdf_base64: previewBuffer.toString('base64'),
      pdf_hash: previewHash,
    };
  }

  if (typeof body.preview_pdf_base64 !== 'string' || body.preview_pdf_base64.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'PDF de pré-visualização é obrigatório para salvar.' });
  }

  if (typeof body.preview_pdf_hash !== 'string' || body.preview_pdf_hash.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Hash da pré-visualização é obrigatório.' });
  }

  const attachPDFBuffer = Buffer.from(body.preview_pdf_base64, 'base64');
  const previewHash = createHash('sha256').update(attachPDFBuffer).digest('hex');

  if (previewHash !== body.preview_pdf_hash) {
    throw createError({ statusCode: 400, statusMessage: 'PDF de pré-visualização inválido.' });
  }

  if (!prescriber || !patient) {
    throw createError({ statusCode: 400, statusMessage: 'Paciente ou prescritor inválido para salvar.' });
  }

  const sendgridApiKey = config.sendgridApiKey;
  if (!sendgridApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'SENDGRID_API_KEY é obrigatório para criar prescrições.' });
  }

  const alwaysSendEmailsRaw = config.alwaysSendEmails;
  if (alwaysSendEmailsRaw === undefined) {
    throw createError({ statusCode: 500, statusMessage: 'ALWAYS_SEND_EMAILS é obrigatório para criar prescrições.' });
  }

  const alwaysSendEmails = alwaysSendEmailsRaw
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email.length > 0);

  sgMail.setApiKey(sendgridApiKey);

  const prescription = await prisma.prescription.create({
    data: {
      patient_id: body.patient_id,
      prescribed_by: user.userId,
      date_prescribed: new Date(),
      json_form_info: formInfo,
    },
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  const timestamp = Date.now();
  const sanitizedPatientName = await sanitizeName(patient.name);
  const prescriptionName = `${sanitizedPatientName}_${timestamp}`;
  const blob = await put(`prescriptions/${user.userId}/${dateStr}/${prescriptionName}.pdf`, attachPDFBuffer, { access: 'public' });

  await prisma.prescription.update({
    where: { id: prescription.id },
    data: { pdf_url: blob.url }
  });


  const prescriberName = prescriber.full_name ?? prescriber.email ?? 'Prescritor'

  if (patient.email && patient.send_email) {
    await sendPatientEmail(patient.email, patient.name, prescriberName, blob.url);
  }

  if (prescriber.email && prescriber.send_email) {
    await sendPrescriberEmail(prescriber.email, prescriberName, patient.name, blob.url);
  }

  await sendPharmacyEmail(patient.name, blob.url, alwaysSendEmails);


  await prisma.log.create({ data: { event_time: new Date(), message: `Prescritor ${prescriberName} fez uma prescrição para paciente ${patient.name}`, user_id: user.userId, patient_id: body.patient_id } })

  return {
    id: prescription.id,
    patient_id: prescription.patient_id,
    date_prescribed: prescription.date_prescribed.toISOString().slice(0, 10),
  };
});


async function sendPharmacyEmail(patientName: string, pdfUrl: string, alwaysSendEmails: string[]) {
  const date = new Date().toLocaleDateString('pt-BR');
  let pharmacyHtml = await getEmailTemplate('prescription_pharmacy.html');
  pharmacyHtml = pharmacyHtml.replace('{{patientName}}', patientName)
                             .replace('{{pdfUrl}}', pdfUrl);
  for (const email of alwaysSendEmails) {
    await sgMail.send({
      to: email,
      from: config.fromEmail,
      subject: `${patientName} - ${date} - Nova Prescrição Salva`,
      html: pharmacyHtml,
    });
  }
}

async function sendPrescriberEmail(prescriberEmail: string, prescriberName: string, patientName: string, pdfUrl: string) {
  let doctorHtml = await getEmailTemplate('prescription_prescriber.html');
  doctorHtml = doctorHtml.replace('{{patientName}}', patientName)
                         .replace('{{prescriberName}}', prescriberName)
                         .replace('{{pdfUrl}}', pdfUrl);
  await sgMail.send({
    to: prescriberEmail,
    from: config.fromEmail,
    subject: `Prescrição gerada para - ${patientName}`,
    html: doctorHtml,
  });
}

async function sendPatientEmail(patientEmail: string, patientName: string, prescriberName: string, pdfUrl: string) {
  let patientHtml = await getEmailTemplate('prescription_patient.html');
  patientHtml = patientHtml.replace('{{patientName}}', patientName)
                           .replace('{{prescriberName}}', prescriberName)
                           .replace('{{pdfUrl}}', pdfUrl);
  console.log("Sending email to patient:", patientEmail);
  await sgMail.send({
    to: patientEmail,
    from: config.fromEmail,
    subject: 'Sua Nova Prescrição - Pharma Next',
    html: patientHtml,
  });
}
    
async function sanitizeName(name: string): Promise<string> {
  // Remove accents and not american characters
  let sanitized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // substitute spaces for underscores
  sanitized = sanitized.replace(/\s+/g, '_');
  return sanitized;

}