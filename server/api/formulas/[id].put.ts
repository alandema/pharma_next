import { requireAdminLikeUser } from '../../utils/rbac';

export default defineEventHandler(async (event) => {
  requireAdminLikeUser(event)

  const body = await readBody(event)
  const formula = await prisma.formulas.update({
    where: {
      id: event.context.params?.id,
    },
    data: {
      information: body.information,
    },
  })
  return {
    id: formula.id,
    name: formula.name,
    information: formula.information,
  }
})