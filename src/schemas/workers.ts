import { z } from 'zod'

export const createWorkerSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  pin: z.string().min(4, 'Mínimo 4 dígitos').max(6, 'Máximo 6 dígitos').regex(/^\d+$/, 'Solo números'),
  role: z.enum(['cashier', 'bartender']),
})

export type CreateWorkerForm = z.infer<typeof createWorkerSchema>
