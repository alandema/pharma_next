export default defineEventHandler(async (event) => {
  const users = await prisma.user.findMany({
    select: { id: true, full_name: true, username: true, role: true, is_active: true },
    orderBy: { full_name: 'asc' }
  });
  return users;
})