import { create } from 'zustand'

interface SalesSession {
  workerId: string | null
  workerName: string | null
  workerRole: string | null
  venueId: string | null
  organizationId: string | null
  stationId: string | null
  stationName: string | null
  shiftId: string | null
  setSession: (session: {
    workerId: string
    workerName: string
    workerRole: string
    venueId: string
    organizationId: string
    stationId: string
    stationName: string
    shiftId: string
  }) => void
  clearSession: () => void
}

export const useSalesSession = create<SalesSession>((set) => ({
  workerId: null,
  workerName: null,
  workerRole: null,
  venueId: null,
  organizationId: null,
  stationId: null,
  stationName: null,
  shiftId: null,
  setSession: (session) => set(session),
  clearSession: () =>
    set({
      workerId: null,
      workerName: null,
      workerRole: null,
      venueId: null,
      organizationId: null,
      stationId: null,
      stationName: null,
      shiftId: null,
    }),
}))
