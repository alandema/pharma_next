import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const token = getCookie(event, 'AccessToken'); // Get the 'token' cookie

  const { username, password, role } = body;
  
  if (!username || !password) { 
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing username or password'
    });
  }

  const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Username already exists'
    });
  }

  const hash = await bcrypt.hash(password, 10);

  if (role !== 'user'){
    try {
        const decoded = jwt.verify(token!, JWT_SECRET!) as JwtPayload;
        if (decoded.role !== 'admin') {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden: Admins only'
            });
        }
    } catch (err) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized: Invalid token'
        });
    }
  }
  const user = await prisma.user.create({
    data: {
      username,
      password_hash: hash,
      role: role,
    },
  });

  console.log('User created:', username, 'role:', role);
  
  return {
    success: true,
    message: 'User created successfully',
    userId: user.id
  };
})