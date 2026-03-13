import { supabase } from '@/lib/supabase'
import type { Worker, WorkerRole, WorkerStationAssignment } from '@/types/database'

export async function getWorkers(venueId: string) {
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .eq('venue_id', venueId)
    .order('name')
  if (error) throw error
  return data as Worker[]
}

export async function createWorker(worker: {
  venue_id: string
  name: string
  pin: string
  role: WorkerRole
}) {
  const { data, error } = await supabase
    .from('workers')
    .insert(worker)
    .select()
    .single()
  if (error) throw error
  return data as Worker
}

export async function updateWorker(id: string, updates: Partial<Worker>) {
  const { data, error } = await supabase
    .from('workers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Worker
}

export async function getWorkerAssignments(workerId: string) {
  const { data, error } = await supabase
    .from('worker_station_assignments')
    .select('*')
    .eq('worker_id', workerId)
  if (error) throw error
  return data as WorkerStationAssignment[]
}

export async function assignWorkerToStation(workerId: string, stationId: string) {
  const { data, error } = await supabase
    .from('worker_station_assignments')
    .insert({ worker_id: workerId, station_id: stationId })
    .select()
    .single()
  if (error) throw error
  return data as WorkerStationAssignment
}

export async function removeWorkerFromStation(workerId: string, stationId: string) {
  const { error } = await supabase
    .from('worker_station_assignments')
    .delete()
    .eq('worker_id', workerId)
    .eq('station_id', stationId)
  if (error) throw error
}
