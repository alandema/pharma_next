import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    business_info: defineCollection({
      type: 'data',
      source: 'business_info.yml',
      schema: z.object({
        name: z.string(),
        address: z.string(),
        phone: z.string(),
        email: z.string().email().optional(),
        website: z.string().optional(),
        cnpj: z.string()
      })
    }),
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
