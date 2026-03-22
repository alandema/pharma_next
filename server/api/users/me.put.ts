import {
  normalizeBirthDate,
  normalizeBrazilCep,
  normalizeBrazilPhone,
  normalizeBoolean,
  normalizeText,
} from '../../utils/inputNormalization';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const body = await readBody(event);

  const currentUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { id: true, email: true, zipcode: true, send_email: true },
  })

  if (!currentUser) {
    throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado' })
  }

  const updateData: any = {}

  try {
    if ('full_name' in body) updateData.full_name = normalizeText(body.full_name, { titleCase: true })
    if ('gender' in body) updateData.gender = normalizeText(body.gender, { titleCase: true })
    if ('birth_date' in body) updateData.birth_date = normalizeBirthDate(body.birth_date)
    if ('phone' in body) updateData.phone = normalizeBrazilPhone(body.phone)
    if ('professional_type' in body) updateData.professional_type = normalizeText(body.professional_type, { titleCase: true })
    if ('zipcode' in body) updateData.zipcode = normalizeBrazilCep(body.zipcode, true)
    if ('street' in body) updateData.street = normalizeText(body.street, { titleCase: true })
    if ('address_number' in body) updateData.address_number = normalizeText(body.address_number)
    if ('complement' in body) updateData.complement = normalizeText(body.complement, { titleCase: true })
    if ('city' in body) updateData.city = normalizeText(body.city, { titleCase: true })
    if ('state' in body) updateData.state = normalizeText(body.state)?.toUpperCase() ?? null
    if ('send_email' in body) updateData.send_email = normalizeBoolean(body.send_email)
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error?.message || 'Dados inválidos' })
  }

  const finalSendEmail = 'send_email' in updateData ? updateData.send_email : currentUser.send_email
  const finalZipcode = 'zipcode' in updateData ? updateData.zipcode : currentUser.zipcode

  if (finalSendEmail && !currentUser.email) {
    throw createError({ statusCode: 400, statusMessage: 'E-mail é obrigatório para receber notificações.' })
  }

  if (!finalZipcode) {
    throw createError({ statusCode: 400, statusMessage: 'CEP é obrigatório para usuários/profissionais.' })
  }

  const updated = await prisma.user.update({
    where: { id: user.userId },
    data: updateData
  })

  return updated;
});