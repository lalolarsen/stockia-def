import { create } from 'zustand'

interface VenueContext {
  organizationId: string | null
  venueId: string | null
  setOrganizationId: (id: string | null) => void
  setVenueId: (id: string | null) => void
}

export const useVenueContext = create<VenueContext>((set) => ({
  organizationId: null,
  venueId: null,
  setOrganizationId: (id) => set({ organizationId: id, venueId: null }),
  setVenueId: (id) => set({ venueId: id }),
}))
