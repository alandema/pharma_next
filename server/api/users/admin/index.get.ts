export default defineEventHandler(async (event) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true }
  });
  return users;
})