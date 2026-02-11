export default defineEventHandler(async (event) => {
  const formulas = await prisma.formulas.findMany({
    select: { id: true, name: true, information: true }
  });

  return formulas;
})