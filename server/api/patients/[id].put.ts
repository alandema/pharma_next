import { patientWriteBodySchema } from '../../utils/contractSchemas';
import {
  normalizeBoolean,
  normalizeText,
} from '../../utils/inputNormalization';
import { readStrictBody } from '../../utils/requestValidation';

const toDbDate = (value: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const where: any = { id: event.context.params?.id };
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    where.registered_by = user.userId;
  }

  const body = await readStrictBody(event, patientWriteBodySchema)

  const normalizedData = {
    name: normalizeText(body.name, { titleCase: true }),
    email: normalizeText(body.email),
    send_email: normalizeBoolean(body.send_email),
    rg: normalizeText(body.rg),
    gender: normalizeText(body.gender, { titleCase: true }),
    cpf: normalizeText(body.cpf),
    birth_date: toDbDate(normalizeText(body.birth_date)),
    phone: normalizeText(body.phone),
    zipcode: normalizeText(body.zipcode),
    street: normalizeText(body.street, { titleCase: true }),
    district: normalizeText(body.district, { titleCase: true }),
    house_number: normalizeText(body.house_number),
    additional_info: normalizeText(body.additional_info, { titleCase: true }),
    country: normalizeText(body.country, { titleCase: true }),
    state: normalizeText(body.state)?.toUpperCase() ?? null,
    city: normalizeText(body.city, { titleCase: true }),
    medical_history: normalizeText(body.medical_history),
  }

  if (!normalizedData.name) {
    throw createError({ statusCode: 400, statusMessage: 'Nome é obrigatório' })
  }

  if (normalizedData.send_email && !normalizedData.email) {
    throw createError({ statusCode: 400, statusMessage: 'E-mail é obrigatório para receber notificações.' })
  }

  const patient = await prisma.patient.update({
    where,
    data: {
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
  await prisma.log.create({ data: { event_time: new Date(), message: `Editou paciente: ${patient.name}`, user_id: user.userId, patient_id: patient.id } })

  return {
    id: patient.id,
    name: patient.name,
    cpf: patient.cpf,
  }
})