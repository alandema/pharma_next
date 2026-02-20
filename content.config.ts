import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    cids: defineCollection({
      type: 'data',
      source: 'cids.yml',
      schema: z.object({
        codes: z.array(z.object({ code: z.string(), name: z.string() }))
      })
    })
  }
})
