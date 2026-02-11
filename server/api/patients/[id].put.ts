export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const where: any = { id: event.context.params?.id };
  if (user.role !== 'admin') {
    where.registered_by = user.userId;
  }

  const body = await readBody(event)
  const patient = await prisma.patients.update({
    where,
    data: {
      name: body.name,
      rg: body.rg,
      gender: body.gender,
      cpf: body.cpf,
      birth_date: body.birth_date,
      phone: body.phone,
      zipcode: body.zipcode,
      street: body.street,
      district: body.district,
      house_number: body.house_number,
      additional_info: body.additional_info,
      country: body.country,
      state: body.state,
      city: body.city,
      medical_history: body.medical_history,
    },
  })
  return {
    id: patient.id,
    name: patient.name,
    cpf: patient.cpf,
  }
})