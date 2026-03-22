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
    if ('gender' in body) updateData.gender = body.gender
    if ('birth_date' in body) updateData.birth_date = normalizeBirthDate(body.birth_date)
    if ('phone' in body) updateData.phone = normalizeBrazilPhone(body.phone)
    if ('professional_type' in body) updateData.professional_type = body.professional_type
    if ('council' in body) updateData.council = body.council
    if ('council_number' in body) updateData.council_number = normalizeText(body.council_number)
    if ('council_state' in body) updateData.council_state = body.council_state
    if ('specialties' in body) updateData.specialties = body.specialties
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

  const updated = await prisma.user.update({
    where: { id: user.userId },
    data: updateData
  })

  return {
    message: 'Perfil atualizado com sucesso',
  };
});