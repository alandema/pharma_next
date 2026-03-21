import sgMail from '@sendgrid/mail';
import { put } from '@vercel/blob';
import fs from 'node:fs';
import path from 'node:path';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  const body = await readBody<{
    patient_id?: string;
    cid_code?: string;
    formulas?: { formula_id?: string; description?: string }[];
  }>(event);

  const formulaItems = Array.isArray(body.formulas) ? body.formulas : [];

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
    !item?.formula_id || !String(item.description || '').trim()
  );

  if (hasInvalidFormulaItem) {
    throw createError({ statusCode: 400, statusMessage: 'Cada fórmula deve ter fórmula e descrição.' });
  }

  const normalizedFormulaItems = formulaItems.map((item: { formula_id?: string; description?: string }) => ({
    formula_id: String(item.formula_id),
    description: String(item.description).trim(),
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
    ['free', '']
  ]);

  const formInfo = {
    cid_code: body.cid_code,
    formulas: normalizedFormulaItems.map((item) => ({
      formula_id: item.formula_id,
      formula_name: formulaMap.get(item.formula_id) || '',
      description: item.description,
    })),
  };

  const prescription = await prisma.prescription.create({
    data: {
      patient_id: body.patient_id,
      prescribed_by: user.userId,
      date_prescribed: new Date(),
      json_form_info: formInfo,
    },
  });

  const [prescriber, patient] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.userId } }),
    prisma.patient.findUnique({ where: { id: body.patient_id } })
  ]);

  if (prescriber && patient) {
    const attachPDFBuffer = await generatePDFDocument(formInfo, prescriber.username, patient.name);
    
    const dateStr = new Date().toISOString().slice(0, 10);
    const blob = await put(`prescriptions/${user.userId}/${dateStr}/${prescription.id}.pdf`, attachPDFBuffer, { access: 'public' });
    
    await prisma.prescription.update({
      where: { id: prescription.id },
      data: { pdf_url: blob.url }
    });

    if (process.env.SENDGRID_API_KEY) {

      if (patient.email && patient.send_email) {
        await sendPatientEmail(patient.email, patient.name, prescriber.username, blob.url);
      }

      if (prescriber.email && prescriber.send_email) {
        await sendPrescriberEmail(prescriber.email, prescriber.username, patient.name, blob.url);
      }

      await sendPharmacyEmail(patient.name, blob.url);

    }
  }

  await prisma.log.create({ data: { event_time: new Date(), message: `Prescreveu para paciente`, user_id: user.userId, patient_id: body.patient_id } })

  return {
    id: prescription.id,
    patient_id: prescription.patient_id,
    date_prescribed: prescription.date_prescribed.toISOString().slice(0, 10),
  };
});


async function sendPharmacyEmail(patientName: string, pdfUrl: string) {
      const date = new Date().toISOString().slice(0, 10);
      const pharmacyTemplatePath = path.resolve(process.cwd(), 'server/templates/prescription_pharmacy.html');
      let pharmacyHtml = fs.readFileSync(pharmacyTemplatePath, 'utf-8');
      pharmacyHtml = pharmacyHtml.replace('{{patientName}}', patientName)
                                 .replace('{{pdfUrl}}', pdfUrl);
      const emailsToSend = (process.env.ALWAYS_SEND_EMAILS || '').split(',').map(email => email.trim()).filter(email => email);
      for (const email of emailsToSend) {
        await sgMail.send({
          to: email,
          from: 'plataforma@ammafarmacia.com.br',
          subject: `${patientName} - ${date} - Nova Prescrição Salva`,
          html: pharmacyHtml,
        }).catch(e => console.error("SendGrid Error (Pharmacy):", e.response?.body || e));
      }
}

async function sendPrescriberEmail(prescriberEmail: string, prescriberName: string, patientName: string, pdfUrl: string) {
        const doctorTemplatePath = path.resolve(process.cwd(), 'server/templates/prescription_prescriber.html');
        let doctorHtml = fs.readFileSync(doctorTemplatePath, 'utf-8');
        doctorHtml = doctorHtml.replace('{{patientName}}', patientName)
                               .replace('{{prescriberName}}', prescriberName)
                               .replace('{{pdfUrl}}', pdfUrl);
        await sgMail.send({
          to: prescriberEmail,
          from: 'plataforma@ammafarmacia.com.br', 
          subject: `Prescrição gerada para - ${patientName}`,
          html: doctorHtml,
        }).catch(e => console.error("SendGrid Error (Doctor):", e.response?.body || e));
}

async function sendPatientEmail(patientEmail: string, patientName: string, prescriberName: string, pdfUrl: string) {
        
        const patientTemplatePath = path.resolve(process.cwd(), 'server/templates/prescription_patient.html');
        let patientHtml = fs.readFileSync(patientTemplatePath, 'utf-8');
        patientHtml = patientHtml.replace('{{patientName}}', patientName)
                                 .replace('{{prescriberName}}', prescriberName)
                                 .replace('{{pdfUrl}}', pdfUrl);
        console.log("Sending email to patient:", patientEmail);                        
        await sgMail.send({
          to: patientEmail,
          from: 'plataforma@ammafarmacia.com.br', 
          subject: 'Sua Nova Prescrição - Pharma Next',
          html: patientHtml,
        }).catch(e => console.error("SendGrid Error (Patient):", e.response?.body || e));
      }