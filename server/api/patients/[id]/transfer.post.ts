export default defineEventHandler(async (event) => {
  const user = event.context.user;

  if (user.role !== 'admin' && user.role !== 'superadmin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: only admins can transfer patients',
    });
  }

  const patientId = event.context.params?.id;
  const body = await readBody(event);
  const { prescritor_id } = body;

  if (!prescritor_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: prescritor_id is required',
    });
  }

  // Verify the target user exists and has role 'user'
  const targetPrescritor = await prisma.user.findUnique({
    where: { id: prescritor_id },
    select: { id: true, username: true, role: true },
  });

  if (!targetPrescritor || targetPrescritor.role !== 'user') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Target user not found or is not a user',
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
    data: { registered_by: prescritor_id },
    select: { id: true, name: true, registered_by: true },
  });

  return {
    id: updated.id,
    name: updated.name,
    registered_by: updated.registered_by,
    transferred_to: targetPrescritor.username,
  };
});
