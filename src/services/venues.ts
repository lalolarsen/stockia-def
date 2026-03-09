import { supabase } from '@/lib/supabase'
import type { Venue } from '@/types/database'

export async function getVenues(organizationId: string) {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name')
  if (error) throw error
  return data as Venue[]
}

export async function createVenue(venue: {
  organization_id: string
  name: string
  slug: string
  address?: string
}) {
  const { data, error } = await supabase
    .from('venues')
    .insert(venue)
    .select()
    .single()
  if (error) throw error
  return data as Venue
}

export async function updateVenue(id: string, updates: Partial<Venue>) {
  const { data, error } = await supabase
    .from('venues')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Venue
}
