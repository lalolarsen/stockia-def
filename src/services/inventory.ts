import { supabase } from '@/lib/supabase'
import type { InventoryMovement, StockLevel } from '@/types/database'

export async function registerIntake(
  organizationId: string,
  venueId: string,
  locationId: string,
  items: { stock_item_id: string; quantity: number; notes?: string }[],
  notes?: string
) {
  const { data, error } = await supabase.rpc('register_intake', {
    p_organization_id: organizationId,
    p_venue_id: venueId,
    p_location_id: locationId,
    p_items: items,
    p_notes: notes ?? null,
  })
  if (error) throw error
  return data as string[]
}

export async function registerTransfer(
  organizationId: string,
  venueId: string,
  fromLocationId: string,
  toLocationId: string,
  items: { stock_item_id: string; quantity: number }[],
  notes?: string
) {
  const { data, error } = await supabase.rpc('register_transfer', {
    p_organization_id: organizationId,
    p_venue_id: venueId,
    p_from_location_id: fromLocationId,
    p_to_location_id: toLocationId,
    p_items: items,
    p_notes: notes ?? null,
  })
  if (error) throw error
  return data as string
}

export async function getStockLevels(venueId: string, locationId?: string) {
  const { data, error } = await supabase.rpc('get_stock_levels', {
    p_venue_id: venueId,
    p_location_id: locationId ?? null,
  })
  if (error) throw error
  return data as StockLevel[]
}

export async function getMovements(venueId: string, locationId?: string) {
  let query = supabase
    .from('inventory_movements')
    .select('*, stock_items(name, unit), locations(name)')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (locationId) {
    query = query.eq('location_id', locationId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as (InventoryMovement & {
    stock_items: { name: string; unit: string }
    locations: { name: string }
  })[]
}
