import { z } from 'zod'

const optionalNullableString = z.union([z.string(), z.null()]).optional()

export const authLoginBodySchema = z.object({
  email: z.string(),
  password: z.string(),
}).strict()

export const prescriberCreateBodySchema = z.object({
  password: z.string(),
  email: z.string(),
  send_email: z.boolean(),
  full_name: z.string(),
  cpf: z.string(),
  gender: z.string(),
  birth_date: z.string(),
  phone: z.string(),
  council: z.string(),
  council_number: z.string(),
  council_state: z.string(),
  zipcode: z.string(),
  street: z.string(),
  address_number: z.string(),
  complement: optionalNullableString,
  city: z.string(),
  state: z.string(),
  role: z.string().optional(),
}).strict()

export const prescriberUpdateBodySchema = z.object({
  password: z.string().optional(),
  email: z.string().optional(),
  send_email: z.boolean().optional(),
  full_name: z.string().optional(),
  cpf: z.string().optional(),
  gender: z.string().optional(),
  birth_date: z.string().optional(),
  phone: z.string().optional(),
  council: z.string().optional(),
  council_number: z.string().optional(),
  council_state: z.string().optional(),
  zipcode: z.string().optional(),
  street: z.string().optional(),
  address_number: z.string().optional(),
  complement: optionalNullableString,
  city: z.string().optional(),
  state: z.string().optional(),
  role: z.string().optional(),
}).strict()

export const patientWriteBodySchema = z.object({
  name: z.string().optional(),
  email: optionalNullableString,
  send_email: z.boolean(),
  rg: optionalNullableString,
  gender: optionalNullableString,
  cpf: optionalNullableString,
  birth_date: optionalNullableString,
  phone: optionalNullableString,
  zipcode: optionalNullableString,
  street: optionalNullableString,
  district: optionalNullableString,
  house_number: optionalNullableString,
  additional_info: optionalNullableString,
  country: optionalNullableString,
  state: optionalNullableString,
  city: optionalNullableString,
  medical_history: optionalNullableString,
}).strict()

export const patientTransferBodySchema = z.object({
  prescritor_id: z.string(),
}).strict()

export const formulaCreateBodySchema = z.object({
  name: z.string(),
  information: optionalNullableString,
}).strict()

export const formulaUpdateBodySchema = z.object({
  information: optionalNullableString,
}).strict()

export const logCreateBodySchema = z.object({
  message: z.string(),
  user_id: optionalNullableString,
  patient_id: optionalNullableString,
}).strict()

export const safeIdSignBodySchema = z.object({
  doctorCpf: z.string(),
  doctorPassword: z.string(),
  base64Pdf: z.string(),
}).strict()

export const safeIdCallbackBodySchema = z.object({
  error: z.string().optional(),
  identifierCA: z.string().optional(),
  state: z.string().optional(),
  expirationDate: z.string().optional(),
  serialNumber: z.string().optional(),
}).strict()

export const prescriptionFormulaItemSchema = z.object({
  formula_id: z.string().optional(),
  description: z.string().optional(),
}).strict()

export const prescriptionPostBodySchema = z.object({
  patient_id: z.string().optional(),
  cid_code: z.string().optional(),
  formulas: z.array(prescriptionFormulaItemSchema).optional(),
  preview_only: z.boolean().optional(),
  preview_pdf_base64: z.string().optional(),
  preview_pdf_hash: z.string().optional(),
}).strict()
