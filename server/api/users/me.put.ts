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
  
  // Strip disabled fields to prevent overriding
  const { cpf, email, password, specialties, council, council_number, council_state, role, is_active, id, ...allowedUpdates } = body;

  const currentUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { id: true, email: true, zipcode: true, send_email: true },
  })

  if (!currentUser) {
    throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado' })
  }

  const updateData: any = {}

  try {
    if ('full_name' in allowedUpdates) updateData.full_name = normalizeText(allowedUpdates.full_name, { titleCase: true })
    if ('gender' in allowedUpdates) updateData.gender = normalizeText(allowedUpdates.gender, { titleCase: true })
    if ('birth_date' in allowedUpdates) updateData.birth_date = normalizeBirthDate(allowedUpdates.birth_date)
    if ('phone' in allowedUpdates) updateData.phone = normalizeBrazilPhone(allowedUpdates.phone)
    if ('professional_type' in allowedUpdates) updateData.professional_type = normalizeText(allowedUpdates.professional_type, { titleCase: true })
    if ('zipcode' in allowedUpdates) updateData.zipcode = normalizeBrazilCep(allowedUpdates.zipcode, true)
    if ('street' in allowedUpdates) updateData.street = normalizeText(allowedUpdates.street, { titleCase: true })
    if ('address_number' in allowedUpdates) updateData.address_number = normalizeText(allowedUpdates.address_number)
    if ('complement' in allowedUpdates) updateData.complement = normalizeText(allowedUpdates.complement, { titleCase: true })
    if ('city' in allowedUpdates) updateData.city = normalizeText(allowedUpdates.city, { titleCase: true })
    if ('state' in allowedUpdates) updateData.state = normalizeText(allowedUpdates.state)?.toUpperCase() ?? null
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