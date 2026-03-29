export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { doctorCpf, doctorPassword, base64Pdf } = body
  const oauthLoginFieldKey = ['user', 'name'].join('')

  const config = useRuntimeConfig()
  const clientId = config.safeidClientId
  const clientSecret = config.safeidClientSecret
  const redirectUri = config.safeidRedirectUri

  if (!clientId || !clientSecret || !redirectUri) {
    throw createError({ statusCode: 500, statusMessage: 'Configuração SafeID incompleta.' })
  }

  if (typeof doctorCpf !== 'string' || doctorCpf.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'CPF do prescritor é obrigatório.' })
  }

  if (typeof doctorPassword !== 'string' || doctorPassword.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Senha do prescritor é obrigatória.' })
  }

  if (typeof base64Pdf !== 'string' || base64Pdf.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Conteúdo PDF é obrigatório.' })
  }

  try {
    // 1. Get identifierCA
    const authCaRes = await $fetch<any>('https://pscsafeweb.safewebpss.com.br/Service/Microservice/OAuth/api/v0/oauth/authorize-ca', {
      method: 'POST',
      body: {
        client_id: clientId,
        login_hint: doctorCpf,
        redirect_uri: redirectUri,
        lifetime: 1800
      }
    })
    
    // Check if user authorized it (if successful, we get identifierCA)
    if (!authCaRes.identifierCA) throw new Error('Failed to get identifierCA')

    // 2. Get access_token using identifierCA + doctor's actual password
    const tokenRes = await $fetch<any>('https://pscsafeweb.safewebpss.com.br/Service/Microservice/OAuth/api/v0/oauth/pwd_authorize', {
      method: 'POST',
      body: {
        client_id: clientId,
        client_secret: clientSecret,
        [oauthLoginFieldKey]: doctorCpf,
        password: `${authCaRes.identifierCA}${doctorPassword}`, // Concatenated as per docs
        grant_type: 'password',
        scope: 'single_signature',
        lifetime: 900
      }
    })

    if (!tokenRes.access_token) throw new Error('Failed to get access token')

    // 3. Sign the PDF (ICP)
    const signRes = await $fetch<any>('https://pscsafeweb.safewebpss.com.br/Service/Microservice/OAuth/api/v0/oauth/signature-icp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenRes.access_token}`
      },
      body: {
        file: {
          id: `prescription-${Date.now()}`,
          alias: "Receita Medica",
          content: base64Pdf,
          signature_type: 2, // 2 = PAdES (Required for PDFs)
          signature_policy: 1 // 1 = AD-RT (Default/Common)
        }
      }
    })

    // Return the signed base64 PDF to the client
    return {
      success: true,
      signedPdfBase64: signRes.signatures.raw_signature
    }

  } catch (error) {
    console.error("Signature Error:", error)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao assinar documento' })
  }
})