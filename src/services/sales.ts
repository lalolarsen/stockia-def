import { supabase } from '@/lib/supabase'
import type { Sale, RedemptionToken } from '@/types/database'

export interface CreateSaleResult {
  sale_id: string
  total: number
  token_id: string
  token_code: string
}

export async function createSale(params: {
  organization_id: string
  venue_id: string
  station_id: string
  shift_id: string
  worker_id: string
  items: { venue_catalog_item_id: string; recipe_id?: string; quantity: number; unit_price: number }[]
  payment_method: string
  payment_amount: number
  notes?: string
}) {
  const { data, error } = await supabase.rpc('create_sale', {
    p_organization_id: params.organization_id,
    p_venue_id: params.venue_id,
    p_station_id: params.station_id,
    p_shift_id: params.shift_id,
    p_worker_id: params.worker_id,
    p_items: params.items.map((i) => ({
      venue_catalog_item_id: i.venue_catalog_item_id,
      recipe_id: i.recipe_id ?? '',
      quantity: i.quantity,
      unit_price: i.unit_price,
    })),
    p_payment_method: params.payment_method,
    p_payment_amount: params.payment_amount,
    p_notes: params.notes ?? null,
  })
  if (error) throw error
  return data as CreateSaleResult
}

export async function getSales(venueId: string, shiftId?: string) {
  let query = supabase
    .from('sales')
    .select('*, workers(name), sale_items(*, venue_catalog_items(*, catalog_items(name)))')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (shiftId) {
    query = query.eq('shift_id', shiftId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as (Sale & {
    workers: { name: string }
    sale_items: (import('@/types/database').SaleItem & {
      venue_catalog_items: { catalog_items: { name: string } }
    })[]
  })[]
}

export async function getTokenBySale(saleId: string) {
  const { data, error } = await supabase
    .from('redemption_tokens')
    .select('*')
    .eq('sale_id', saleId)
    .single()
  if (error) throw error
  return data as RedemptionToken
}
