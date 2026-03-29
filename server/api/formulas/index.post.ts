import { normalizeText } from '../../utils/inputNormalization';
import { formulaCreateBodySchema } from '../../utils/contractSchemas';
import { readStrictBody } from '../../utils/requestValidation';
import { requireAdminLikeUser } from '../../utils/rbac';

export default defineEventHandler(async (event) => {
  requireAdminLikeUser(event)

  const body = await readStrictBody(event, formulaCreateBodySchema)

  const name = normalizeText(body.name, { titleCase: true })

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nome da fórmula é obrigatório',
    });
  }

  //check if formula with same name already exists
  const existingFormula = await prisma.formulas.findUnique({
    where: {
      name: name,
    },
  })

  if (existingFormula) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A fórmula com esse nome já existe',
    });
  }

  const formula = await prisma.formulas.create({
    data: {
      name: name,
      information: typeof body.information === 'string' ? body.information : null,
    },
  })
  return {
    id: formula.id,
    name: formula.name,
    information: formula.information,
  }
})