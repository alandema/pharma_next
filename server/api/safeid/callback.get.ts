import { getSafeIdQrSessionByState, saveSafeIdQrSession } from '../../utils/safeidQrSession'

const renderCallbackPage = (title: string, message: string) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f4f7fb; color: #102a43; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
      .card { background: #fff; border: 1px solid #d9e2ec; border-radius: 12px; padding: 24px; max-width: 420px; width: calc(100% - 32px); box-shadow: 0 8px 20px rgba(16,42,67,.08); }
      h1 { margin: 0 0 8px; font-size: 1.25rem; }
      p { margin: 0; line-height: 1.4; }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>${title}</h1>
      <p>${message}</p>
    </main>
  </body>
</html>`

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const state = typeof query.state === 'string' ? query.state : ''
  const code = typeof query.code === 'string' ? query.code : ''
  const error = typeof query.error === 'string' ? query.error : ''

  setHeader(event, 'content-type', 'text/html; charset=utf-8')

  if (!state) {
    setResponseStatus(event, 400)
    return renderCallbackPage('Autorização inválida', 'Parâmetro de estado não informado na resposta do SafeID.')
  }

  const session = await getSafeIdQrSessionByState(state)
  if (!session) {
    setResponseStatus(event, 404)
    return renderCallbackPage('Sessão não encontrada', 'A sessão de assinatura não foi localizada ou já expirou.')
  }

  if (session.status === 'expired') {
    setResponseStatus(event, 410)
    return renderCallbackPage('Sessão expirada', 'A sessão de assinatura expirou. Gere um novo QR Code no Amma Farmácia.')
  }

  if (error) {
    session.status = error === 'user_denied' ? 'denied' : 'failed'
    session.errorMessage = error === 'user_denied'
      ? 'Autorização negada pelo titular no SafeID.'
      : `Erro de autorização no SafeID: ${error}`
    session.completedAt = new Date().toISOString()
    await saveSafeIdQrSession(session)

    return renderCallbackPage('Autorização não concluída', session.errorMessage)
  }

  if (!code) {
    session.status = 'failed'
    session.errorMessage = 'Código de autorização não retornado pelo SafeID.'
    session.completedAt = new Date().toISOString()
    await saveSafeIdQrSession(session)

    setResponseStatus(event, 400)
    return renderCallbackPage('Falha na autorização', session.errorMessage)
  }

  session.authorizationCode = code
  session.authorizedAt = new Date().toISOString()
  session.status = 'authorized'
  session.errorMessage = undefined
  await saveSafeIdQrSession(session)

  return renderCallbackPage('Autorização recebida', 'Você já pode voltar ao Amma Farmácia para finalizar a assinatura do documento.')
})
