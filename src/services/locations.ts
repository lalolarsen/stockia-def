import { supabase } from '@/lib/supabase'
import type { Location, LocationType } from '@/types/database'

export async function getLocations(venueId: string) {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('venue_id', venueId)
    .order('name')
  if (error) throw error
  return data as Location[]
}

export async function createLocation(location: {
  venue_id: string
  name: string
  type: LocationType
}) {
  const { data, error } = await supabase
    .from('locations')
    .insert(location)
    .select()
    .single()
  if (error) throw error
  return data as Location
}
