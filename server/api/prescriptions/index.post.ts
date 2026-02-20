export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const body = await readBody(event);
  
  const formInfo = JSON.stringify({ cid_code: body.cid_code, ...JSON.parse(body.json_form_info || '{}') });

  const prescription = await prisma.prescription.create({
    data: {
      patient_id: body.patient_id,
      prescribed_by: user.userId,
      date_prescribed: body.date_prescribed || new Date().toISOString(),
      json_form_info: formInfo,
    },
  });
  
  return {
    id: prescription.id,
    patient_id: prescription.patient_id,
    date_prescribed: prescription.date_prescribed,
  };
});