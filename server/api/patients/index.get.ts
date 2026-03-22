export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const where = user.role === 'admin' || user.role === 'superadmin' ? {} : { registered_by: user.userId };

  const patients = await prisma.patient.findMany({
    where,
    select: { id: true, name: true, cpf: true, user: { select: { username: true } } },
    orderBy: { name: 'asc' },
  });

  // get last prescription date for each patient
  for (const patient of patients) {
    const lastPrescription = await prisma.prescription.findFirst({
      where: { patient_id: patient.id },
      orderBy: { date_prescribed: 'desc' },
      select: { date_prescribed: true },
    });
    (patient as any).last_prescription_date = lastPrescription ? lastPrescription.date_prescribed.toISOString().split('T')[0] : null;
  }


  return patients;
})