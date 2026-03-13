import { z } from 'zod'

export const createStockItemSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  category: z.enum(['spirit', 'mixer', 'garnish', 'beer', 'wine', 'supply', 'other']),
  unit: z.enum(['ml', 'unit']),
  cost_per_unit: z.number().min(0, 'Debe ser positivo'),
  presentation_qty: z.number().min(0.01, 'Debe ser mayor a 0'),
  presentation_label: z.string().optional(),
})

export const createCatalogItemSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  category: z.enum(['cocktail', 'shot', 'beer', 'wine', 'soft_drink', 'food', 'package', 'other']),
  description: z.string().optional(),
})

export const addToVenueSchema = z.object({
  catalog_item_id: z.string().uuid('Selecciona un producto'),
  price: z.number().min(0, 'Debe ser positivo'),
})

export type CreateStockItemForm = z.infer<typeof createStockItemSchema>
export type CreateCatalogItemForm = z.infer<typeof createCatalogItemSchema>
export type AddToVenueForm = z.infer<typeof addToVenueSchema>
