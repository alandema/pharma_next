import bcrypt from "bcryptjs";
import { validateCredentials } from '../../../utils/credentials';
import {
  normalizeBirthDate,
  normalizeBrazilCep,
  normalizeBrazilPhone,
  normalizeBoolean,
  normalizeText,
} from '../../../utils/inputNormalization';

export default defineEventHandler(async (event) => {
  const body = await readBody(event)


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
    throw createError({ statusCode: 400, statusMessage: 'Todos os campos sao obrigatorios, exceto complemento' })
  }
  if (!Array.isArray(normalizedData.specialties) || normalizedData.specialties.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Especialidades e obrigatorio' })
  }

  const existing = await prisma.user.findUnique({ where: { username: normalizedUsername }, select: { id: true } });
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Username already exists'
    });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username: normalizedUsername,
      password_hash: hash,
      role: 'user',
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

  console.log('User created:', normalizedUsername, 'role:', 'user');
  
  return {
    success: true,
    message: 'User created successfully',
    userId: user.id
  };
})