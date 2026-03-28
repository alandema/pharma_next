import bcrypt from 'bcryptjs';
import { validateCredentials } from '../../../utils/credentials';
import {
  normalizeBirthDate,
  normalizeBrazilCep,
  normalizeBrazilPhone,
  normalizeBoolean,
  normalizeText,
} from '../../../utils/inputNormalization';
import { assertCanManageTargetRole, isKnownRole, requireAdminLikeUser, USER_SAFE_SELECT } from '../../../utils/rbac';

export default defineEventHandler(async (event) => {
  const actor = requireAdminLikeUser(event)
  const id = event.context.params?.id

  const body = await readBody(event).catch(() => {
    throw createError({ statusCode: 400, statusMessage: 'Corpo da requisição inválido.' })
  })

  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo da requisição inválido.' })
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { is_active: true, username: true, email: true, zipcode: true, send_email: true, role: true } })
  if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })

  if (!isKnownRole(user.role)) {
    throw createError({ statusCode: 500, statusMessage: 'Configuração de papel de destino inválida.' })
  }

  assertCanManageTargetRole(actor.role, user.role)

  if ('role' in body && body.role !== user.role) {
    throw createError({ statusCode: 400, statusMessage: 'Mudança de papel não é permitida pela aplicação.' })
  }

  if (Object.keys(body).length === 0) {
    const updated = await prisma.user.update({
      where: { id },
      data: { is_active: !user.is_active },
      select: USER_SAFE_SELECT,
    })
    return {
      ...updated,
      birth_date: updated.birth_date ? new Date(updated.birth_date).toISOString().split('T')[0] : null,
    }
  }

  const updateData: any = {}

  try {
    if ('password' in body) {
      const normalizedPassword = normalizeText(body.password)
      if (normalizedPassword) {
        const passwordError = validateCredentials(user.username, normalizedPassword)
        if (passwordError) {
          throw createError({ statusCode: 400, statusMessage: passwordError })
        }
        updateData.password_hash = await bcrypt.hash(normalizedPassword, 10)
      }
    }
    if ('send_email' in body) updateData.send_email = normalizeBoolean(body.send_email)
    if ('full_name' in body) updateData.full_name = normalizeText(body.full_name, { titleCase: true })
    if ('cpf' in body) updateData.cpf = normalizeText(body.cpf)
    if ('gender' in body) updateData.gender = normalizeText(body.gender, { titleCase: true })
    if ('birth_date' in body) updateData.birth_date = normalizeBirthDate(body.birth_date)
    if ('phone' in body) updateData.phone = normalizeBrazilPhone(body.phone)
    if ('professional_type' in body) updateData.professional_type = normalizeText(body.professional_type, { titleCase: true })
    if ('council' in body) updateData.council = normalizeText(body.council)
    if ('council_number' in body) updateData.council_number = normalizeText(body.council_number)
    if ('council_state' in body) updateData.council_state = normalizeText(body.council_state)?.toUpperCase() ?? null
    if ('specialties' in body) updateData.specialties = body.specialties
    if ('zipcode' in body) updateData.zipcode = normalizeBrazilCep(body.zipcode, true)
    if ('street' in body) updateData.street = normalizeText(body.street, { titleCase: true })
    if ('address_number' in body) updateData.address_number = normalizeText(body.address_number)
    if ('complement' in body) updateData.complement = normalizeText(body.complement, { titleCase: true })
    if ('city' in body) updateData.city = normalizeText(body.city, { titleCase: true })
    if ('state' in body) updateData.state = normalizeText(body.state)?.toUpperCase() ?? null
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error?.message || 'Dados inválidos' })
  }

  const finalEmail = user.email
  const finalSendEmail = 'send_email' in updateData ? updateData.send_email : user.send_email
  const finalZipcode = 'zipcode' in updateData ? updateData.zipcode : user.zipcode

  if (finalSendEmail && !finalEmail) {
    throw createError({ statusCode: 400, statusMessage: 'E-mail é obrigatório para receber notificações.' })
  }

  if (!finalZipcode) {
    throw createError({ statusCode: 400, statusMessage: 'CEP é obrigatório para usuários/profissionais.' })
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: USER_SAFE_SELECT,
  })

  return {
    ...updated,
    birth_date: updated.birth_date ? new Date(updated.birth_date).toISOString().split('T')[0] : null,
  }
})
