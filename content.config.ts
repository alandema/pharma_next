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
    professionals: defineCollection({
      type: 'data',
      source: 'professionals.yml',
      schema: z.object({
        professionals: z.array(z.object({ id: z.number(), name: z.string(), council: z.string(), specialties: z.array(z.string()) }))
      })
    })
  }
})
