export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const formula = await prisma.formulas.update({
    where: {
      id: event.context.params?.id,
    },
    data: {
      name: body.name,
      information: body.information,
    },
  })
  return {
    id: formula.id,
    name: formula.name,
    information: formula.information,
  }
})