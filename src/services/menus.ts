import { supabase } from '@/lib/supabase'
import type { Menu, MenuItem, CatalogItem, VenueCatalogItem } from '@/types/database'

export async function getMenus(venueId: string) {
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('venue_id', venueId)
    .order('name')
  if (error) throw error
  return data as Menu[]
}

export async function createMenu(venueId: string, name: string) {
  const { data, error } = await supabase
    .from('menus')
    .insert({ venue_id: venueId, name })
    .select()
    .single()
  if (error) throw error
  return data as Menu
}

export async function updateMenu(id: string, updates: Partial<Menu>) {
  const { data, error } = await supabase
    .from('menus')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Menu
}

export async function getMenuItems(menuId: string) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*, venue_catalog_items(*, catalog_items(*))')
    .eq('menu_id', menuId)
    .order('sort_order')
  if (error) throw error
  return data as (MenuItem & {
    venue_catalog_items: VenueCatalogItem & { catalog_items: CatalogItem }
  })[]
}

export async function addMenuItem(menuId: string, venueCatalogItemId: string, sortOrder: number) {
  const { data, error } = await supabase
    .from('menu_items')
    .insert({ menu_id: menuId, venue_catalog_item_id: venueCatalogItemId, sort_order: sortOrder })
    .select()
    .single()
  if (error) throw error
  return data as MenuItem
}

export async function removeMenuItem(id: string) {
  const { error } = await supabase.from('menu_items').delete().eq('id', id)
  if (error) throw error
}
