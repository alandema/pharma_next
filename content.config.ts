import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    cids: defineCollection({
      type: 'data',
      source: 'cids.yml',
      schema: z.object({
        codes: z.array(z.object({ id: z.number(), code: z.string(), name: z.string() }))
      })
    }),
    councils: defineCollection({
      type: 'data',
      source: 'councils.yml',
      schema: z.object({
        councils: z.array(z.object({ id: z.number(), name: z.string(), abbreviation: z.string(), required: z.boolean() }))
      })
    })
  }
})
