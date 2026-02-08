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
      statusMessage: 'Missing username or password'
    });
  }

  const existing = await prisma.user.findUnique(
    { where: { username },
    select: { id: true, password_hash: true, username: true, role: true 
    }
    });
  if (!existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'User does not exist'
    });
  }

  if (!(await bcrypt.compare(password, existing.password_hash))) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid username or password'
    });
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
      message: 'Login successful'
    };

})