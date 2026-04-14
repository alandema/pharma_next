import bcrypt from 'bcryptjs'
import { prescriberUpdateBodySchema } from '../../utils/contractSchemas';
import { validatePassword } from '../../utils/credentials'
import {
  normalizeBoolean,
  parseDateOnlyToUtcDate,
  normalizeText,
} from '../../utils/inputNormalization';
import { readStrictBody } from '../../utils/requestValidation';
import { isAdminLike, requireAuthenticatedUser } from '../../utils/rbac';
import { isCouncilNumberAndStateRequired } from '../../utils/councilRequirement';

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

export default defineEventHandler(async (event) => {
  const actor = requireAuthenticatedUser(event)
  const body = await readStrictBody(event, prescriberUpdateBodySchema)

  const currentPrescriber = await prisma.user.findUnique({
    where: { id: actor.userId },
    select: {
      email: true,
      send_email: true,
      full_name: true,
      cpf: true,
      gender: true,
      birth_date: true,
      phone: true,
      council: true,
      council_number: true,
      council_state: true,
      zipcode: true,
      street: true,
      address_number: true,
      city: true,
      state: true,
    },
  })

  if (!currentPrescriber) {
    throw createError({ statusCode: 404, statusMessage: 'Prescritor não encontrado' })
  }

  const canEditOwnIdentity = isAdminLike(actor.role)
  const updateData: any = {}
  const hasField = (key: string) => Object.prototype.hasOwnProperty.call(body, key)

  try {
    if (canEditOwnIdentity && hasField('email')) {
      const normalizedEmail = normalizeText(body.email)
      if (!normalizedEmail) {
        throw createError({ statusCode: 400, statusMessage: 'E-mail é obrigatório.' })
      }
      updateData.email = normalizedEmail.toLowerCase()
    }

    if (canEditOwnIdentity && hasField('cpf')) {
      const normalizedCpf = normalizeText(body.cpf)
      if (!normalizedCpf) {
        throw createError({ statusCode: 400, statusMessage: 'CPF é obrigatório.' })
      }
      updateData.cpf = normalizedCpf
    }

    if (hasField('password')) {
      const normalizedPassword = normalizeText(body.password)
      if (normalizedPassword) {
        const passwordError = validatePassword(normalizedPassword)
        if (passwordError) {
          throw createError({ statusCode: 400, statusMessage: passwordError })
        }
        updateData.password_hash = await bcrypt.hash(normalizedPassword, 10)
      }
    }

    if (hasField('full_name')) updateData.full_name = normalizeText(body.full_name, { titleCase: true })
    if (hasField('title')) updateData.title = normalizeText(body.title, { titleCase: true })
  if (hasField('gender')) updateData.gender = normalizeText(body.gender, { titleCase: true })
  if (hasField('birth_date')) updateData.birth_date = parseDateOnlyToUtcDate(normalizeText(body.birth_date))
  if (hasField('phone')) updateData.phone = normalizeText(body.phone)
    if (hasField('council')) updateData.council = normalizeText(body.council)
    if (hasField('council_number')) updateData.council_number = normalizeText(body.council_number) ?? ''
    if (hasField('council_state')) updateData.council_state = normalizeText(body.council_state)?.toUpperCase() ?? ''
  if (hasField('zipcode')) updateData.zipcode = normalizeText(body.zipcode)
    if (hasField('street')) updateData.street = normalizeText(body.street, { titleCase: true })
    if (hasField('address_number')) updateData.address_number = normalizeText(body.address_number)
    if (hasField('complement')) updateData.complement = normalizeText(body.complement, { titleCase: true })
    if (hasField('city')) updateData.city = normalizeText(body.city, { titleCase: true })
    if (hasField('state')) updateData.state = normalizeText(body.state)?.toUpperCase() ?? null
    if (hasField('send_email')) updateData.send_email = normalizeBoolean(body.send_email)
  } catch (error: any) {
    if (typeof error?.statusCode === 'number') {
      throw error
    }
    throw createError({ statusCode: 400, statusMessage: error?.message || 'Dados inválidos' })
  }

  const finalEmail = 'email' in updateData ? updateData.email : currentPrescriber.email
  const finalSendEmail = 'send_email' in updateData ? updateData.send_email : currentPrescriber.send_email

  if (finalSendEmail && !finalEmail) {
    throw createError({ statusCode: 400, statusMessage: 'E-mail é obrigatório para receber notificações.' })
  }

  const finalRequiredPrescriberData: Record<string, unknown> = {
    full_name: 'full_name' in updateData ? updateData.full_name : currentPrescriber.full_name,
    cpf: 'cpf' in updateData ? updateData.cpf : currentPrescriber.cpf,
    gender: 'gender' in updateData ? updateData.gender : currentPrescriber.gender,
    birth_date: 'birth_date' in updateData ? updateData.birth_date : currentPrescriber.birth_date,
    phone: 'phone' in updateData ? updateData.phone : currentPrescriber.phone,
    council: 'council' in updateData ? updateData.council : currentPrescriber.council,
    council_number: 'council_number' in updateData ? updateData.council_number : currentPrescriber.council_number,
    council_state: 'council_state' in updateData ? updateData.council_state : currentPrescriber.council_state,
    zipcode: 'zipcode' in updateData ? updateData.zipcode : currentPrescriber.zipcode,
    street: 'street' in updateData ? updateData.street : currentPrescriber.street,
    address_number: 'address_number' in updateData ? updateData.address_number : currentPrescriber.address_number,
    city: 'city' in updateData ? updateData.city : currentPrescriber.city,
    state: 'state' in updateData ? updateData.state : currentPrescriber.state,
  }

  const requiredPrescriberProfileFieldLabels = { ...REQUIRED_PRESCRIBER_PROFILE_FIELD_LABELS }
  if (await isCouncilNumberAndStateRequired(event, finalRequiredPrescriberData.council)) {
    requiredPrescriberProfileFieldLabels.council_number = 'Número do conselho'
    requiredPrescriberProfileFieldLabels.council_state = 'UF do conselho'
  }

  const missingRequiredField = getMissingRequiredPrescriberField(finalRequiredPrescriberData, requiredPrescriberProfileFieldLabels)
  if (missingRequiredField) {
    throw createError({ statusCode: 400, statusMessage: `${requiredPrescriberProfileFieldLabels[missingRequiredField]} é obrigatório.` })
  }

  try {
    await prisma.user.update({
      where: { id: actor.userId },
      data: updateData,
    })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      const target = Array.isArray(error?.meta?.target) ? String(error.meta.target[0] ?? '') : String(error?.meta?.target ?? '')
      if (target.includes('email')) {
        throw createError({ statusCode: 409, statusMessage: 'E-mail já cadastrado.' })
      }
      if (target.includes('cpf')) {
        throw createError({ statusCode: 409, statusMessage: 'CPF já cadastrado.' })
      }
      throw createError({ statusCode: 409, statusMessage: 'Valor já cadastrado.' })
    }

    const requiredArgMatch = String(error?.message ?? '').match(/Argument `([^`]+)` must not be null/i)
    if (requiredArgMatch) {
      const field = requiredArgMatch[1] ?? ''
      const label = PRESCRIBER_FIELD_LABELS[field] ?? 'Campo obrigatório'
      throw createError({ statusCode: 400, statusMessage: `${label} é obrigatório.` })
    }

    throw createError({
      statusCode: 400,
      statusMessage: 'Não foi possível atualizar o perfil. Verifique os dados e tente novamente.',
    })
  }

  return {
    message: 'Perfil atualizado com sucesso',
  };
});