import { requireAdminLikeUser } from '../../utils/rbac';

export default defineEventHandler(async (event) => {
  requireAdminLikeUser(event)

  //delete formula
  await prisma.formulas.delete({
    where: {
      id: event.context.params?.id,
    },
  })
  return { deleted: true }
})