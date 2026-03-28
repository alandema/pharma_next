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

const USER_FIELD_LABELS: Record<string, string> = {
  username: 'Usuário',
  email: 'E-mail',
  full_name: 'Nome completo',
  cpf: 'CPF',
  gender: 'Sexo',
  birth_date: 'Data de nascimento',
  phone: 'Telefone',
  council: 'Conselho',
  council_number: 'Número do conselho',
  council_state: 'UF do conselho',
  zipcode: 'CEP',
  street: 'Endereço',
  address_number: 'Número',
  city: 'Cidade',
  state: 'Estado',
}

const hasRequiredValue = (value: unknown) => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

const getMissingRequiredUserField = (data: Record<string, unknown>) => {
  for (const [field] of Object.entries(USER_FIELD_LABELS)) {
    if (!hasRequiredValue(data[field])) {
      return field
    }
  }

  return null
}

const toFriendlyUserUpdateError = (error: any) => {
  if (error?.code === 'P2002') {
    const target = Array.isArray(error?.meta?.target) ? String(error.meta.target[0] ?? '') : String(error?.meta?.target ?? '')
    if (target.includes('username')) {
      return createError({ statusCode: 409, statusMessage: 'Nome de usuário já existe.' })
    }
    if (target.includes('email')) {
      return createError({ statusCode: 409, statusMessage: 'E-mail já cadastrado.' })
    }
    if (target.includes('cpf')) {
      return createError({ statusCode: 409, statusMessage: 'CPF já cadastrado.' })
    }
    return createError({ statusCode: 409, statusMessage: 'Valor já cadastrado.' })
  }

  const requiredArgMatch = String(error?.message ?? '').match(/Argument `([^`]+)` must not be null/i)
  if (requiredArgMatch) {
    const field = requiredArgMatch[1] ?? ''
    const label = USER_FIELD_LABELS[field] ?? 'Campo obrigatório'
    return createError({ statusCode: 400, statusMessage: `${label} é obrigatório.` })
  }

  return createError({
    statusCode: 400,
    statusMessage: 'Não foi possível atualizar o usuário. Verifique os dados e tente novamente.',
  })
}

export default defineEventHandler(async (event) => {
  const actor = requireAdminLikeUser(event)
  const id = event.context.params?.id

  const body = await readBody(event).catch(() => {
    throw createError({ statusCode: 400, statusMessage: 'Corpo da requisição inválido.' })
  })

  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo da requisição inválido.' })
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { is_active: true, username: true, email: true, send_email: true, role: true, full_name: true, cpf: true, gender: true, birth_date: true, phone: true, council: true, council_number: true, council_state: true, zipcode: true, street: true, address_number: true, city: true, state: true } })
  if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })

  if (!isKnownRole(user.role)) {
    throw createError({ statusCode: 500, statusMessage: 'Configuração de papel de destino inválida.' })
  }

  assertCanManageTargetRole(actor.role, user.role)

  if ('role' in body && body.role !== user.role) {
    throw createError({ statusCode: 400, statusMessage: 'Mudança de papel não é permitida pela aplicação.' })
  }

  if (Object.keys(body).length === 0) {
    try {
      const updated = await prisma.user.update({
        where: { id },
        data: { is_active: !user.is_active },
        select: USER_SAFE_SELECT,
      })
      return {
        ...updated,
        birth_date: updated.birth_date ? new Date(updated.birth_date).toISOString().split('T')[0] : null,
      }
    } catch (error: any) {
      throw toFriendlyUserUpdateError(error)
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
    if ('council' in body) updateData.council = normalizeText(body.council)
    if ('council_number' in body) updateData.council_number = normalizeText(body.council_number)
    if ('council_state' in body) updateData.council_state = normalizeText(body.council_state)?.toUpperCase() ?? null
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

  if (finalSendEmail && !finalEmail) {
    throw createError({ statusCode: 400, statusMessage: 'E-mail é obrigatório para receber notificações.' })
  }

  const finalRequiredUserData: Record<string, unknown> = {
    full_name: 'full_name' in updateData ? updateData.full_name : user.full_name,
    cpf: 'cpf' in updateData ? updateData.cpf : user.cpf,
    gender: 'gender' in updateData ? updateData.gender : user.gender,
    birth_date: 'birth_date' in updateData ? updateData.birth_date : user.birth_date,
    phone: 'phone' in updateData ? updateData.phone : user.phone,
    council: 'council' in updateData ? updateData.council : user.council,
    council_number: 'council_number' in updateData ? updateData.council_number : user.council_number,
    council_state: 'council_state' in updateData ? updateData.council_state : user.council_state,
    zipcode: 'zipcode' in updateData ? updateData.zipcode : user.zipcode,
    street: 'street' in updateData ? updateData.street : user.street,
    address_number: 'address_number' in updateData ? updateData.address_number : user.address_number,
    city: 'city' in updateData ? updateData.city : user.city,
    state: 'state' in updateData ? updateData.state : user.state,
  }

  const missingRequiredField = getMissingRequiredUserField(finalRequiredUserData)
  if (missingRequiredField) {
    throw createError({ statusCode: 400, statusMessage: `${USER_FIELD_LABELS[missingRequiredField]} é obrigatório.` })
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SAFE_SELECT,
    })

    return {
      ...updated,
      birth_date: updated.birth_date ? new Date(updated.birth_date).toISOString().split('T')[0] : null,
    }
  } catch (error: any) {
    throw toFriendlyUserUpdateError(error)
  }
})
