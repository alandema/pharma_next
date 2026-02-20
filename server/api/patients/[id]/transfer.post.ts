export default defineEventHandler(async (event) => {
  const user = event.context.user;

  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: only admins can transfer patients',
    });
  }

  const patientId = event.context.params?.id;
  const body = await readBody(event);
  const { doctor_id } = body;

  if (!doctor_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: doctor_id is required',
    });
  }

  // Verify the target doctor exists and has role 'doctor'
  const targetDoctor = await prisma.user.findUnique({
    where: { id: doctor_id },
    select: { id: true, username: true, role: true },
  });

  if (!targetDoctor || targetDoctor.role !== 'doctor') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Target doctor not found or is not a doctor',
    });
  }

  // Verify the patient exists
  const existingPatient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, name: true, registered_by: true },
  });

  if (!existingPatient) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Patient not found',
    });
  }

  const updated = await prisma.patient.update({
    where: { id: patientId },
    data: { registered_by: doctor_id },
    select: { id: true, name: true, registered_by: true },
  });

  return {
    id: updated.id,
    name: updated.name,
    registered_by: updated.registered_by,
    transferred_to: targetDoctor.username,
  };
});
