import bcrypt from "bcryptjs";

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { username, password} = body;
  
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
  const user = await prisma.user.create({
    data: {
      username,
      password_hash: hash,
      role: 'user',
    },
  });

  console.log('User created:', username, 'role:', 'user');
  
  return {
    success: true,
    message: 'User created successfully',
    userId: user.id
  };
})