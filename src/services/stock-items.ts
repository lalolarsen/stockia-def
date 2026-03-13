import { supabase } from '@/lib/supabase'
import type { StockItem, StockUnit, StockCategory } from '@/types/database'

export async function getStockItems(organizationId: string) {
  const { data, error } = await supabase
    .from('stock_items')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name')
  if (error) throw error
  return data as StockItem[]
}

export async function createStockItem(item: {
  organization_id: string
  name: string
  category: StockCategory
  unit: StockUnit
  cost_per_unit?: number
  presentation_qty?: number
  presentation_label?: string
}) {
  const { data, error } = await supabase
    .from('stock_items')
    .insert(item)
    .select()
    .single()
  if (error) throw error
  return data as StockItem
}

export async function updateStockItem(id: string, updates: Partial<StockItem>) {
  const { data, error } = await supabase
    .from('stock_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as StockItem
}
