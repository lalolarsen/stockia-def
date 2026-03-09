export type LocationType = 'warehouse' | 'bar'
export type StationType = 'pos' | 'tablet' | 'kiosk'
export type OrgRole = 'org_owner' | 'org_admin'
export type VenueRole = 'venue_admin' | 'venue_manager' | 'gerencia'

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface Venue {
  id: string
  organization_id: string
  name: string
  slug: string
  address: string | null
  timezone: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Location {
  id: string
  venue_id: string
  name: string
  type: LocationType
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Station {
  id: string
  location_id: string
  venue_id: string
  name: string
  type: StationType
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationMembership {
  id: string
  organization_id: string
  user_id: string
  role: OrgRole
  created_at: string
  updated_at: string
}

export interface VenueMembership {
  id: string
  venue_id: string
  user_id: string
  role: VenueRole
  created_at: string
  updated_at: string
}
