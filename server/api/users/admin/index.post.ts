import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import sgMail from '@sendgrid/mail';
import fs from 'node:fs';
import path from 'node:path';
import { validateCredentials } from '../../../utils/credentials';
import {
  normalizeBirthDate,
  normalizeBrazilCep,
  normalizeBrazilPhone,
  normalizeBoolean,
  normalizeText,
} from '../../../utils/inputNormalization';
import { requireAdminLikeUser } from '../../../utils/rbac';

export default defineEventHandler(async (event) => {
  requireAdminLikeUser(event)

  const config = useRuntimeConfig(event)
  const body = await readBody(event)

  if (body && typeof body === 'object' && 'role' in body && body.role !== 'user') {
    throw createError({ statusCode: 400, statusMessage: 'A criação de perfis admin/superadmin é permitida apenas via script.' })
  }


  const { username, password, email, full_name, cpf, gender, birth_date, phone, professional_type, council, council_number, council_state, specialties, zipcode, street, address_number, complement, city, state } = body;
  const normalizedUsername = typeof username === 'string' ? username.trim() : username

  const errorMessage = validateCredentials(normalizedUsername, password)



  if (errorMessage) {
    throw createError({
      statusCode: 400,
      statusMessage: errorMessage
    });
  }

  let normalizedData: any
  try {
    normalizedData = {
      email: normalizeText(email),
      send_email: normalizeBoolean(body.send_email),
      full_name: normalizeText(full_name, { titleCase: true }),
      cpf: normalizeText(cpf),
      gender: normalizeText(gender, { titleCase: true }),
      birth_date: normalizeBirthDate(birth_date),
      phone: normalizeBrazilPhone(phone),
      professional_type: normalizeText(professional_type, { titleCase: true }),
      council: normalizeText(council),
      council_number: normalizeText(council_number),
      council_state: normalizeText(council_state)?.toUpperCase() ?? null,
      specialties,
      zipcode: normalizeBrazilCep(zipcode, true),
      street: normalizeText(street, { titleCase: true }),
      address_number: normalizeText(address_number),
      complement: normalizeText(complement, { titleCase: true }),
      city: normalizeText(city, { titleCase: true }),
      state: normalizeText(state)?.toUpperCase() ?? null,
    }
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error?.message || 'Dados inválidos' })
  }

  if (!normalizedData.email) {
    throw createError({ statusCode: 400, statusMessage: 'E-mail é obrigatório' });
  }

  const requiredFields = ['full_name', 'cpf', 'gender', 'birth_date', 'phone', 'professional_type', 'council', 'council_number', 'council_state', 'zipcode', 'street', 'address_number', 'city', 'state'] as const
  if (requiredFields.some((field) => !normalizedData[field])) {
    throw createError({ statusCode: 400, statusMessage: 'Todos os campos são obrigatórios, exceto complemento.' })
  }
  if (!Array.isArray(normalizedData.specialties) || normalizedData.specialties.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Especialidades são obrigatórias.' })
  }

  const existing = await prisma.user.findUnique({ where: { username: normalizedUsername }, select: { id: true } });
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Nome de usuário já existe.'
    });
  }

  const hash = await bcrypt.hash(password, 10);
  const activationSecret = config.activationTokenSecret
  if (!activationSecret) {
    throw createError({ statusCode: 500, statusMessage: 'ACTIVATION token secret não configurado' })
  }

  const activationBaseUrl = config.activationBaseUrl
  if (!activationBaseUrl) {
    throw createError({ statusCode: 500, statusMessage: 'ACTIVATION base URL não configurada' })
  }

  const sendgridApiKey = config.sendgridApiKey
  if (!sendgridApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'SENDGRID_API_KEY é obrigatório para ativação de conta' })
  }
  sgMail.setApiKey(sendgridApiKey)

  
  const user = await prisma.user.create({
    data: {
      username: normalizedUsername,
      password_hash: hash,
      role: 'user',
      is_active: false,
      email: normalizedData.email,
      send_email: normalizedData.send_email,
      full_name: normalizedData.full_name,
      cpf: normalizedData.cpf,
      gender: normalizedData.gender,
      birth_date: normalizedData.birth_date,
      phone: normalizedData.phone,
      professional_type: normalizedData.professional_type,
      council: normalizedData.council,
      council_number: normalizedData.council_number,
      council_state: normalizedData.council_state,
      specialties: normalizedData.specialties,
      zipcode: normalizedData.zipcode,
      street: normalizedData.street,
      address_number: normalizedData.address_number,
      complement: normalizedData.complement,
      city: normalizedData.city,
      state: normalizedData.state,
    },
  });

  const activationToken = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      purpose: 'account-activation',
    },
    activationSecret,
    { expiresIn: '24h' }
  )

  const normalizedBaseUrl = activationBaseUrl.replace(/\/$/, '')
  const activationLink = `${normalizedBaseUrl}/api/auth/activate?token=${encodeURIComponent(activationToken)}`
  const activationEmail = user.email ?? normalizedData.email
  const activationName = user.full_name ?? normalizedData.full_name ?? normalizedUsername

  if (!activationEmail || !activationName) {
    throw createError({ statusCode: 500, statusMessage: 'Dados de ativação inválidos' })
  }

  try {
    await sendActivationEmail(activationEmail, activationName, activationLink)
  } catch (error) {
    console.error('Erro ao enviar e-mail de ativação:', error)
    try {
      await prisma.user.delete({ where: { id: user.id } })
    } catch (deleteError) {
      console.error('Falha ao reverter usuário após erro de e-mail:', deleteError)
    }
    throw createError({ statusCode: 500, statusMessage: 'Não foi possível enviar e-mail de ativação. Tente novamente.' })
  }
  
  return {
    success: true,
    message: 'Usuário criado em estado inativo. E-mail de ativação enviado.',
    userId: user.id
  };
})

async function sendActivationEmail(email: string, fullName: string, activationLink: string) {
  const templatePath = path.resolve(process.cwd(), 'server/templates/account_activation.html')
  let html = fs.readFileSync(templatePath, 'utf-8')

  html = html
    .replace('{{fullName}}', fullName)
    .replace('{{activationLink}}', activationLink)

  await sgMail.send({
    to: email,
    from: 'plataforma@ammafarmacia.com.br',
    html,
  })
}