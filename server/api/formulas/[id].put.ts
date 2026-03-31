import { formulaUpdateBodySchema } from '../../utils/contractSchemas';
import { readStrictBody } from '../../utils/requestValidation';
import { requireAdminLikeUser } from '../../utils/rbac';

export default defineEventHandler(async (event) => {
  requireAdminLikeUser(event)

  const body = await readStrictBody(event, formulaUpdateBodySchema)
  const formula = await prisma.formulas.update({
    where: {
      id: event.context.params?.id,
    },
    data: {
      information: typeof body.information === 'string' ? body.information : null,
    },
  })
  return {
    id: formula.id,
    name: formula.name,
    information: formula.information,
  }
})