import { createHash, randomBytes, randomUUID } from 'node:crypto'

export type SafeIdQrSessionStatus =
  | 'pending_authorization'
  | 'authorized'
  | 'processing'
  | 'signed'
  | 'denied'
  | 'failed'
  | 'expired'

export type SafeIdQrSession = {
  id: string
  state: string
  userId: string
  signerCpf: string
  codeVerifier: string
  pdfBase64: string
  pdfHash: string
  status: SafeIdQrSessionStatus
  createdAt: string
  expiresAt: string
  authorizationCode?: string
  authorizedAt?: string
  signedPdfBase64?: string
  signedPdfHash?: string
  completedAt?: string
  errorMessage?: string
}

type CreateSessionInput = {
  userId: string
  signerCpf: string
  pdfBase64: string
  pdfHash: string
  ttlSeconds?: number
}

const STORAGE_NAMESPACE = 'safeid:qr'
const DEFAULT_TTL_SECONDS = 10 * 60

const getStorage = () => useStorage('cache')
const getSessionKey = (sessionId: string) => `${STORAGE_NAMESPACE}:session:${sessionId}`
const getStateKey = (state: string) => `${STORAGE_NAMESPACE}:state:${state}`

const now = () => Date.now()
const nowIso = () => new Date().toISOString()

const isSessionExpired = (session: SafeIdQrSession) => {
  const expiresAt = new Date(session.expiresAt).getTime()
  return Number.isFinite(expiresAt) && expiresAt <= now()
}

const makeCodeVerifier = () => randomBytes(64).toString('base64url')

export const createCodeChallenge = (codeVerifier: string) =>
  createHash('sha256').update(codeVerifier).digest('base64url')

export const createSafeIdQrSession = async (input: CreateSessionInput): Promise<SafeIdQrSession> => {
  const ttlSeconds = typeof input.ttlSeconds === 'number' && input.ttlSeconds > 0
    ? input.ttlSeconds
    : DEFAULT_TTL_SECONDS

  const createdAtMs = now()
  const session: SafeIdQrSession = {
    id: randomUUID(),
    state: randomUUID(),
    userId: input.userId,
    signerCpf: input.signerCpf,
    codeVerifier: makeCodeVerifier(),
    pdfBase64: input.pdfBase64,
    pdfHash: input.pdfHash,
    status: 'pending_authorization',
    createdAt: new Date(createdAtMs).toISOString(),
    expiresAt: new Date(createdAtMs + ttlSeconds * 1000).toISOString(),
  }

  await saveSafeIdQrSession(session)
  return session
}

export const saveSafeIdQrSession = async (session: SafeIdQrSession) => {
  const storage = getStorage()
  await storage.setItem(getSessionKey(session.id), session)
  await storage.setItem(getStateKey(session.state), session.id)
}

export const getSafeIdQrSession = async (sessionId: string): Promise<SafeIdQrSession | null> => {
  if (!sessionId) {
    return null
  }

  const storage = getStorage()
  const session = await storage.getItem<SafeIdQrSession>(getSessionKey(sessionId))
  if (!session) {
    return null
  }

  if (isSessionExpired(session) && !['signed', 'failed', 'denied', 'expired'].includes(session.status)) {
    session.status = 'expired'
    session.errorMessage = 'Sessão de assinatura expirada. Gere um novo QR Code.'
    await saveSafeIdQrSession(session)
  }

  return session
}

export const getSafeIdQrSessionByState = async (state: string): Promise<SafeIdQrSession | null> => {
  if (!state) {
    return null
  }

  const storage = getStorage()
  const sessionId = await storage.getItem<string>(getStateKey(state))
  if (!sessionId) {
    return null
  }

  return getSafeIdQrSession(sessionId)
}

export const buildSafeIdAuthorizeUrl = (params: {
  baseUrl: string
  clientId: string
  redirectUri: string
  state: string
  codeChallenge: string
  loginHint?: string
  scope?: 'single_signature' | 'multi_signature' | 'signature_session'
  lifetimeSeconds?: number
}) => {
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    code_challenge_method: 'S256',
    code_challenge: params.codeChallenge,
    state: params.state,
    scope: params.scope ?? 'single_signature',
    lifetime: String(params.lifetimeSeconds ?? DEFAULT_TTL_SECONDS),
  })

  if (params.loginHint) {
    query.set('login_hint', params.loginHint)
  }

  return `${params.baseUrl}/authorize?${query.toString()}`
}

export const markSessionFailed = async (session: SafeIdQrSession, message: string) => {
  session.status = 'failed'
  session.errorMessage = message
  session.completedAt = nowIso()
  await saveSafeIdQrSession(session)
}
