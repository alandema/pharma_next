import bcrypt from 'bcryptjs';
import { prescriberUpdateBodySchema } from '../../../utils/contractSchemas';
import { validatePassword } from '../../../utils/credentials';
import {
  normalizeBoolean,
  normalizeText,
} from '../../../utils/inputNormalization';
import { readStrictBody } from '../../../utils/requestValidation';
import { assertCanManageTargetRole, isKnownRole, requireAdminLikeUser, PRESCRIBER_SAFE_SELECT } from '../../../utils/rbac';

const PRESCRIBER_FIELD_LABELS: Record<string, string> = {
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

const REQUIRED_PRESCRIBER_PROFILE_FIELD_LABELS: Record<string, string> = {
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

const getMissingRequiredPrescriberField = (
  data: Record<string, unknown>,
  requiredFieldLabels: Record<string, string>,
) => {
  for (const field of Object.keys(requiredFieldLabels)) {
    if (!hasRequiredValue(data[field])) {
      return field
    }
  }

  return null
}

const toFriendlyPrescriberUpdateError = (error: any) => {
  if (error?.code === 'P2002') {
    const target = Array.isArray(error?.meta?.target) ? String(error.meta.target[0] ?? '') : String(error?.meta?.target ?? '')
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
    const label = PRESCRIBER_FIELD_LABELS[field] ?? 'Campo obrigatório'
    return createError({ statusCode: 400, statusMessage: `${label} é obrigatório.` })
  }

  return createError({
    statusCode: 400,
    statusMessage: 'Não foi possível atualizar o prescritor. Verifique os dados e tente novamente.',
  })
}

const toDbDate = (value: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export default defineEventHandler(async (event) => {
  const actor = requireAdminLikeUser(event)
  const id = event.context.params?.id

  const body = await readStrictBody(event, prescriberUpdateBodySchema)

  const prescriber = await prisma.user.findUnique({ where: { id }, select: { is_active: true, email: true, send_email: true, role: true, full_name: true, cpf: true, gender: true, birth_date: true, phone: true, council: true, council_number: true, council_state: true, zipcode: true, street: true, address_number: true, city: true, state: true } })
  if (!prescriber) throw createError({ statusCode: 404, statusMessage: 'Prescritor não encontrado.' })

  if (!isKnownRole(prescriber.role)) {
    throw createError({ statusCode: 500, statusMessage: 'Configuração de papel de destino inválida.' })
  }

  assertCanManageTargetRole(actor.role, prescriber.role)

  if ('role' in body && body.role !== prescriber.role) {
    throw createError({ statusCode: 400, statusMessage: 'Mudança de papel não é permitida pela aplicação.' })
  }

  if (Object.keys(body).length === 0) {
    try {
      const updated = await prisma.user.update({
        where: { id },
        data: { is_active: !prescriber.is_active },
        select: PRESCRIBER_SAFE_SELECT,
      })
      return {
        ...updated,
        birth_date: updated.birth_date ? new Date(updated.birth_date).toISOString().split('T')[0] : null,
      }
    } catch (error: any) {
      throw toFriendlyPrescriberUpdateError(error)
    }
  }

  const updateData: any = {}

  try {
    if ('password' in body) {
      const normalizedPassword = normalizeText(body.password)
      if (normalizedPassword) {
        const passwordError = validatePassword(normalizedPassword)
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
    if ('birth_date' in body) updateData.birth_date = toDbDate(normalizeText(body.birth_date))
    if ('phone' in body) updateData.phone = normalizeText(body.phone)
    if ('council' in body) updateData.council = normalizeText(body.council)
    if ('council_number' in body) updateData.council_number = normalizeText(body.council_number)
    if ('council_state' in body) updateData.council_state = normalizeText(body.council_state)?.toUpperCase() ?? null
    if ('zipcode' in body) updateData.zipcode = normalizeText(body.zipcode)
    if ('street' in body) updateData.street = normalizeText(body.street, { titleCase: true })
    if ('address_number' in body) updateData.address_number = normalizeText(body.address_number)
    if ('complement' in body) updateData.complement = normalizeText(body.complement, { titleCase: true })
    if ('city' in body) updateData.city = normalizeText(body.city, { titleCase: true })
    if ('state' in body) updateData.state = normalizeText(body.state)?.toUpperCase() ?? null
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error?.message || 'Dados inválidos' })
  }

  const finalEmail = prescriber.email
  const finalSendEmail = 'send_email' in updateData ? updateData.send_email : prescriber.send_email

  if (finalSendEmail && !finalEmail) {
    throw createError({ statusCode: 400, statusMessage: 'E-mail é obrigatório para receber notificações.' })
  }

  const finalRequiredPrescriberData: Record<string, unknown> = {
    full_name: 'full_name' in updateData ? updateData.full_name : prescriber.full_name,
    cpf: 'cpf' in updateData ? updateData.cpf : prescriber.cpf,
    gender: 'gender' in updateData ? updateData.gender : prescriber.gender,
    birth_date: 'birth_date' in updateData ? updateData.birth_date : prescriber.birth_date,
    phone: 'phone' in updateData ? updateData.phone : prescriber.phone,
    council: 'council' in updateData ? updateData.council : prescriber.council,
    council_number: 'council_number' in updateData ? updateData.council_number : prescriber.council_number,
    council_state: 'council_state' in updateData ? updateData.council_state : prescriber.council_state,
    zipcode: 'zipcode' in updateData ? updateData.zipcode : prescriber.zipcode,
    street: 'street' in updateData ? updateData.street : prescriber.street,
    address_number: 'address_number' in updateData ? updateData.address_number : prescriber.address_number,
    city: 'city' in updateData ? updateData.city : prescriber.city,
    state: 'state' in updateData ? updateData.state : prescriber.state,
  }

  const missingRequiredField = getMissingRequiredPrescriberField(finalRequiredPrescriberData, REQUIRED_PRESCRIBER_PROFILE_FIELD_LABELS)
  if (missingRequiredField) {
    throw createError({ statusCode: 400, statusMessage: `${REQUIRED_PRESCRIBER_PROFILE_FIELD_LABELS[missingRequiredField]} é obrigatório.` })
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: PRESCRIBER_SAFE_SELECT,
    })

    return {
      ...updated,
      birth_date: updated.birth_date ? new Date(updated.birth_date).toISOString().split('T')[0] : null,
    }
  } catch (error: any) {
    throw toFriendlyPrescriberUpdateError(error)
  }
})
