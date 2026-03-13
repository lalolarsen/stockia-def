import { supabase } from '@/lib/supabase'
import type { CatalogItem, CatalogCategory, VenueCatalogItem } from '@/types/database'

export async function getCatalogItems(organizationId: string) {
  const { data, error } = await supabase
    .from('catalog_items')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name')
  if (error) throw error
  return data as CatalogItem[]
}

export async function createCatalogItem(item: {
  organization_id: string
  name: string
  category: CatalogCategory
  description?: string
}) {
  const { data, error } = await supabase
    .from('catalog_items')
    .insert(item)
    .select()
    .single()
  if (error) throw error
  return data as CatalogItem
}

export async function updateCatalogItem(id: string, updates: Partial<CatalogItem>) {
  const { data, error } = await supabase
    .from('catalog_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as CatalogItem
}

// Venue catalog items (pricing per venue)
export async function getVenueCatalogItems(venueId: string) {
  const { data, error } = await supabase
    .from('venue_catalog_items')
    .select('*, catalog_items(*)')
    .eq('venue_id', venueId)
    .order('created_at')
  if (error) throw error
  return data as (VenueCatalogItem & { catalog_items: CatalogItem })[]
}

export async function addCatalogItemToVenue(venueId: string, catalogItemId: string, price: number) {
  const { data, error } = await supabase
    .from('venue_catalog_items')
    .insert({ venue_id: venueId, catalog_item_id: catalogItemId, price })
    .select()
    .single()
  if (error) throw error
  return data as VenueCatalogItem
}

export async function updateVenueCatalogItem(id: string, updates: { price?: number; is_available?: boolean }) {
  const { data, error } = await supabase
    .from('venue_catalog_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as VenueCatalogItem
}

export async function removeVenueCatalogItem(id: string) {
  const { error } = await supabase
    .from('venue_catalog_items')
    .delete()
    .eq('id', id)
  if (error) throw error
}
