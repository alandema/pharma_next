import { createHash } from 'node:crypto'
import { getSafeIdQrSession, markSessionFailed, saveSafeIdQrSession } from '../../../utils/safeidQrSession'

const SAFEID_BASE_URL = 'https://pscsafeweb.safewebpss.com.br/Service/Microservice/OAuth/api/v0/oauth'

type SafeIdTokenResponse = {
  access_token?: string
}

type SafeIdPadesStartResponse = {
  id?: string
}

type SafeIdPadesFinishResponse = {
  content?: string
}

const getSafeIdErrorMessage = (error: unknown) => {
  const normalized = error as {
    data?: { error_description?: string; error?: string; message?: string }
    statusMessage?: string
    message?: string
  }

  const dataMessage = normalized?.data?.error_description || normalized?.data?.error || normalized?.data?.message
  if (typeof dataMessage === 'string' && dataMessage.trim().length > 0) {
    return dataMessage
  }

  if (typeof normalized?.statusMessage === 'string' && normalized.statusMessage.trim().length > 0) {
    return normalized.statusMessage
  }

  if (typeof normalized?.message === 'string' && normalized.message.trim().length > 0) {
    return normalized.message
  }

  return 'Falha ao assinar documento no SafeID.'
}

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const sessionId = getQuery(event).session_id

  if (!user?.userId) {
    throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado.' })
  }

  if (typeof sessionId !== 'string' || !sessionId) {
    throw createError({ statusCode: 400, statusMessage: 'Sessão de assinatura inválida.' })
  }

  const session = await getSafeIdQrSession(sessionId)
  if (!session || session.userId !== user.userId) {
    throw createError({ statusCode: 404, statusMessage: 'Sessão de assinatura não encontrada.' })
  }

  if (session.status === 'signed') {
    return {
      status: session.status,
      signed_pdf_base64: session.signedPdfBase64,
      signed_pdf_hash: session.signedPdfHash,
    }
  }

  const config = useRuntimeConfig()

  // Non-production bypass for end-to-end flow tests without external signing.
  if (config.allowSigningBypass && ['pending_authorization', 'authorized', 'processing'].includes(session.status)) {
    const bypassSignedPdfBase64 = session.pdfBase64
    const bypassSignedPdfHash = createHash('sha256').update(Buffer.from(bypassSignedPdfBase64, 'base64')).digest('hex')

    session.status = 'signed'
    session.signedPdfBase64 = bypassSignedPdfBase64
    session.signedPdfHash = bypassSignedPdfHash
    session.completedAt = new Date().toISOString()
    session.errorMessage = undefined
    await saveSafeIdQrSession(session)

    console.warn('[SIGNING_BYPASS_ACTIVE]', `session=${session.id}`, `user=${user.userId}`)

    return {
      status: session.status,
      signed_pdf_base64: session.signedPdfBase64,
      signed_pdf_hash: session.signedPdfHash,
    }
  }

  if (['pending_authorization', 'processing', 'denied', 'failed', 'expired'].includes(session.status)) {
    return {
      status: session.status,
      error: session.errorMessage,
    }
  }

  session.status = 'processing'
  session.errorMessage = undefined
  await saveSafeIdQrSession(session)

  const clientId = config.safeidClientId
  const clientSecret = config.safeidClientSecret
  const redirectUri = config.safeidRedirectUri

  if (!clientId || !clientSecret || !redirectUri) {
    await markSessionFailed(session, 'Configuração SafeID incompleta.')
    return {
      status: session.status,
      error: session.errorMessage,
    }
  }

  const baseUrl = config.safeidBaseUrl || SAFEID_BASE_URL

  try {
    const tokenResponse = await $fetch<SafeIdTokenResponse>(`${baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: session.authorizationCode!,
        redirect_uri: redirectUri,
        code_verifier: session.codeVerifier,
      }).toString(),
    })

    if (!tokenResponse.access_token) {
      throw new Error('Token de uso não retornado pelo SafeID.')
    }

    const authHeader = { Authorization: `Bearer ${tokenResponse.access_token}` }

    const padesStart = await $fetch<SafeIdPadesStartResponse>(`${baseUrl}/pades-signature/start`, {
      method: 'POST',
      headers: authHeader,
      body: {
        file: {
          content: session.pdfBase64,
        },
      },
    })

    if (!padesStart.id) {
      throw new Error('Identificador do documento não retornado no fluxo PAdES.')
    }

    await $fetch(`${baseUrl}/pades-signature/apply`, {
      method: 'POST',
      headers: authHeader,
      body: {
        id: padesStart.id,
        alias: session.signerCpf,
        signature_policy: 1,
      },
    })

    const finishResponse = await $fetch<SafeIdPadesFinishResponse>(`${baseUrl}/pades-signature/finish`, {
      method: 'GET',
      headers: authHeader,
      query: { documentId: padesStart.id },
    })

    if (!finishResponse.content) {
      throw new Error('Conteúdo assinado não retornado pelo SafeID.')
    }

    session.status = 'signed'
    session.signedPdfBase64 = finishResponse.content
    session.signedPdfHash = createHash('sha256').update(Buffer.from(finishResponse.content, 'base64')).digest('hex')
    session.completedAt = new Date().toISOString()
    await saveSafeIdQrSession(session)

    return {
      status: session.status,
      signed_pdf_base64: session.signedPdfBase64,
      signed_pdf_hash: session.signedPdfHash,
    }
  } catch (error) {
    await markSessionFailed(session, getSafeIdErrorMessage(error))

    return {
      status: session.status,
      error: session.errorMessage,
    }
  }
})
