import { createHash } from 'node:crypto'
import { safeIdQrStartBodySchema } from '../../../utils/contractSchemas'
import { normalizeBrazilCpf, onlyDigits } from '../../../utils/inputNormalization'
import { readStrictBody } from '../../../utils/requestValidation'
import { buildSafeIdAuthorizeUrl, createCodeChallenge, createSafeIdQrSession } from '../../../utils/safeidQrSession'

const SAFEID_BASE_URL = 'https://pscsafeweb.safewebpss.com.br/Service/Microservice/OAuth/api/v0/oauth'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readStrictBody(event, safeIdQrStartBodySchema)

  if (!user?.userId) {
    throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado.' })
  }

  if (!body.pdf_base64) {
    throw createError({ statusCode: 400, statusMessage: 'PDF de pré-visualização é obrigatório.' })
  }

  if (!body.pdf_hash) {
    throw createError({ statusCode: 400, statusMessage: 'Hash da pré-visualização é obrigatório.' })
  }

  const previewHash = createHash('sha256').update(Buffer.from(body.pdf_base64, 'base64')).digest('hex')
  if (previewHash !== body.pdf_hash) {
    throw createError({ statusCode: 400, statusMessage: 'PDF inválido para assinatura.' })
  }

  const prescriber = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { cpf: true },
  })

  if (!prescriber?.cpf) {
    throw createError({ statusCode: 400, statusMessage: 'CPF do prescritor não encontrado para assinatura.' })
  }

  const config = useRuntimeConfig()
  const clientId = config.safeidClientId
  const redirectUri = config.safeidRedirectUri

  if (!clientId || !redirectUri) {
    throw createError({ statusCode: 500, statusMessage: 'Configuração SafeID incompleta.' })
  }

  const signerCpf = onlyDigits(normalizeBrazilCpf(prescriber.cpf, true))
  const session = await createSafeIdQrSession({
    userId: user.userId,
    signerCpf,
    pdfBase64: body.pdf_base64,
    pdfHash: body.pdf_hash,
  })

  const baseUrl = config.safeidBaseUrl || SAFEID_BASE_URL
  const authorizeUrl = buildSafeIdAuthorizeUrl({
    baseUrl,
    clientId,
    redirectUri,
    state: session.state,
    codeChallenge: createCodeChallenge(session.codeVerifier),
    loginHint: signerCpf,
    scope: 'single_signature',
  })

  return {
    session_id: session.id,
    authorize_url: authorizeUrl,
    expires_at: session.expiresAt,
  }
})
