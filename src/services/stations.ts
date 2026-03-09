import { supabase } from '@/lib/supabase'
import type { Station, StationType } from '@/types/database'

export async function getStations(venueId: string) {
  const { data, error } = await supabase
    .from('stations')
    .select('*')
    .eq('venue_id', venueId)
    .order('name')
  if (error) throw error
  return data as Station[]
}

export async function createStation(station: {
  venue_id: string
  location_id: string
  name: string
  type: StationType
}) {
  const { data, error } = await supabase
    .from('stations')
    .insert(station)
    .select()
    .single()
  if (error) throw error
  return data as Station
}
