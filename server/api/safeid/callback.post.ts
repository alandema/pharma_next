import { safeIdCallbackBodySchema } from '../../utils/contractSchemas'
import { readStrictBody } from '../../utils/requestValidation'

export default defineEventHandler(async (event) => {
  // 1. Read the POST body sent by the SafeWeb PSC
  const body = await readStrictBody(event, safeIdCallbackBodySchema)
  
  // 2. Check if the prescriber denied the authorization
  if (body.error === 'user_denied') { //
    console.error('Prescriber denied the authorization.')
    // Handle the denial (e.g., update database status, redirect prescriber to an error page)
    return { success: false, message: 'Autorização negada.' }
  }

  // 3. Extract the successful data
  const { identifierCA, state, expirationDate, serialNumber } = body //

  if (identifierCA) {
    // 4. Store the identifierCA in your database using the 'state' variable 
    // to map it back to the specific doctor/session that initiated the request.
    console.log(`Received CA for session/state: ${state}`)
    
    // IMPORTANT: At this point, you can programmatically trigger the next step 
    // (pwd_authorize) using this identifierCA and the doctor's password, 
    // OR flag the database so the frontend knows it can proceed.
    
    return { success: true }
  }

  // Fallback for unexpected payloads
  throw createError({ statusCode: 400, statusMessage: 'Payload inválido.' })
})