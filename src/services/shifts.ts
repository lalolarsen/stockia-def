import { supabase } from '@/lib/supabase'
import type { WorkerShift } from '@/types/database'

export async function workerPinLogin(stationId: string, pin: string) {
  const { data, error } = await supabase.rpc('worker_pin_login', {
    p_station_id: stationId,
    p_pin: pin,
  })
  if (error) throw error
  return data as {
    worker_id: string
    worker_name: string
    worker_role: string
    venue_id: string
    organization_id: string
    station_id: string
    station_name: string
  }
}

export async function openShift(workerId: string, stationId: string) {
  const { data, error } = await supabase.rpc('open_shift', {
    p_worker_id: workerId,
    p_station_id: stationId,
  })
  if (error) throw error
  return data as string
}

export async function closeShift(shiftId: string) {
  const { error } = await supabase.rpc('close_shift', {
    p_shift_id: shiftId,
  })
  if (error) throw error
}

export async function getOpenShift(workerId: string) {
  const { data, error } = await supabase
    .from('worker_shifts')
    .select('*')
    .eq('worker_id', workerId)
    .eq('status', 'open')
    .maybeSingle()
  if (error) throw error
  return data as WorkerShift | null
}

export async function getShifts(venueId: string) {
  const { data, error } = await supabase
    .from('worker_shifts')
    .select('*')
    .eq('venue_id', venueId)
    .order('opened_at', { ascending: false })
  if (error) throw error
  return data as WorkerShift[]
}
