import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { username, password} = body;
  if (!username || !password) { 
    throw createError({
      statusCode: 400,
      statusMessage: 'Usuário ou senha ausentes'
    });
  }

  const existing = await prisma.user.findUnique(
    { where: { username },
    select: { id: true, password_hash: true, username: true, role: true, is_active: true }
    });
  if (!existing) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Usuário ou senha inválidos'
    });
  }

  if (!(await bcrypt.compare(password, existing.password_hash))) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Usuário ou senha inválidos'
    });
  }

  if (!existing.is_active) {
    throw createError({ statusCode: 403, statusMessage: 'Conta inativa. Ative a conta pelo link enviado no e-mail.' });
  }

  const token = jwt.sign(
      { userId: existing.id, username: existing.username , role: existing.role} as JwtPayload,
      JWT_SECRET!,
      { expiresIn: '8h' }
    );

    // set token in httpOnly cookie
    setCookie(event, 'AccessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
      path: '/'
    })

    return {
      message: 'Login realizado com sucesso',
      role: existing.role
    };

})