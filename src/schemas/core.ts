import { z } from 'zod'

export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  slug: z.string().min(2, 'Mínimo 2 caracteres').regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
})

export const createVenueSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  slug: z.string().min(2, 'Mínimo 2 caracteres').regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  address: z.string().optional(),
})

export const createLocationSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  type: z.enum(['warehouse', 'bar']),
})

export const createStationSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  location_id: z.string().uuid('Selecciona una location'),
  type: z.enum(['pos', 'tablet', 'kiosk']),
})

export type CreateOrganizationForm = z.infer<typeof createOrganizationSchema>
export type CreateVenueForm = z.infer<typeof createVenueSchema>
export type CreateLocationForm = z.infer<typeof createLocationSchema>
export type CreateStationForm = z.infer<typeof createStationSchema>
