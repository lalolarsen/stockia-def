import { create } from 'zustand'

interface BarSession {
  workerId: string | null
  workerName: string | null
  venueId: string | null
  organizationId: string | null
  stationId: string | null
  stationName: string | null
  locationId: string | null
  shiftId: string | null
  setSession: (session: {
    workerId: string
    workerName: string
    venueId: string
    organizationId: string
    stationId: string
    stationName: string
    locationId: string
    shiftId: string
  }) => void
  clearSession: () => void
}

export const useBarSession = create<BarSession>((set) => ({
  workerId: null,
  workerName: null,
  venueId: null,
  organizationId: null,
  stationId: null,
  stationName: null,
  locationId: null,
  shiftId: null,
  setSession: (session) => set(session),
  clearSession: () =>
    set({
      workerId: null,
      workerName: null,
      venueId: null,
      organizationId: null,
      stationId: null,
      stationName: null,
      locationId: null,
      shiftId: null,
    }),
}))
