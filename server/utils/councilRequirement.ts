import { queryCollection } from '@nuxt/content/server'

type CouncilCollection = {
  councils?: Array<{ abbreviation?: string | null; required?: boolean | null }>
}

export async function isCouncilNumberAndStateRequired(event: any, council: unknown) {
  const normalizedCouncil = typeof council === 'string' ? council.trim().toUpperCase() : ''
  if (!normalizedCouncil) return true

  const councilCollection = await queryCollection(event, 'councils').first() as CouncilCollection | null
  const matchedCouncil = councilCollection?.councils?.find(
    (item) => `${item?.abbreviation ?? ''}`.trim().toUpperCase() === normalizedCouncil,
  )

  return matchedCouncil?.required !== false
}