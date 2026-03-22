import {
  isBrazilCountry,
  normalizeBirthDate,
  normalizeBrazilCep,
  normalizeBrazilPhone,
  normalizeBoolean,
  normalizeText,
} from '../../utils/inputNormalization';

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  const body = await readBody(event)

  let normalizedData: any
  try {
    const country = normalizeText(body.country, { titleCase: true })
    const mustValidateCep = isBrazilCountry(country)
    normalizedData = {
      name: normalizeText(body.name, { titleCase: true }),
      email: normalizeText(body.email),
      send_email: normalizeBoolean(body.send_email),
      rg: normalizeText(body.rg),
      gender: normalizeText(body.gender, { titleCase: true }),
      cpf: normalizeText(body.cpf),
      birth_date: normalizeBirthDate(body.birth_date),
      phone: normalizeBrazilPhone(body.phone, true),
      zipcode: mustValidateCep ? normalizeBrazilCep(body.zipcode, true) : null,
      street: normalizeText(body.street, { titleCase: true }),
      district: normalizeText(body.district, { titleCase: true }),
      house_number: normalizeText(body.house_number),
      additional_info: normalizeText(body.additional_info, { titleCase: true }),
      country,
      state: normalizeText(body.state)?.toUpperCase() ?? null,
      city: normalizeText(body.city, { titleCase: true }),
      medical_history: normalizeText(body.medical_history),
    }
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error?.message || 'Dados inválidos' })
  }

  if (!normalizedData.name) {
    throw createError({ statusCode: 400, statusMessage: 'Nome é obrigatório' })
  }

  if(normalizedData.send_email && !normalizedData.email) {
    throw createError({ statusCode: 400, statusMessage: 'E-mail é obrigatório para receber notificações.' });
  }

  const patient = await prisma.patient.create({
    data: {
      registered_by: user.userId,
      name: normalizedData.name,
      email: normalizedData.email,
      send_email: normalizedData.send_email,
      rg: normalizedData.rg,
      gender: normalizedData.gender,
      cpf: normalizedData.cpf,
      birth_date: normalizedData.birth_date,
      phone: normalizedData.phone,
      zipcode: normalizedData.zipcode,
      street: normalizedData.street,
      district: normalizedData.district,
      house_number: normalizedData.house_number,
      additional_info: normalizedData.additional_info,
      country: normalizedData.country,
      state: normalizedData.state,
      city: normalizedData.city,
      medical_history: normalizedData.medical_history,
    },
  })

  await prisma.log.create({ data: { event_time: new Date(), message: `Cadastrou paciente: ${patient.name}`, user_id: user.userId, patient_id: patient.id } })

  return {
    id: patient.id,
    name: patient.name,
    cpf: patient.cpf,
  }
})