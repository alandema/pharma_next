export default defineEventHandler(async (event) => {
  const user = event.context.user;

  const body = await readBody(event)
  const patient = await prisma.patients.create({
    data: {
      registered_by: user.userId,
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