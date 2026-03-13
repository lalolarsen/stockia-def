export type LocationType = 'warehouse' | 'bar'
export type StationType = 'pos' | 'tablet' | 'kiosk'
export type OrgRole = 'org_owner' | 'org_admin'
export type VenueRole = 'venue_admin' | 'venue_manager' | 'gerencia'
export type WorkerRole = 'cashier' | 'bartender'
export type ShiftStatus = 'open' | 'closed'
export type StockUnit = 'ml' | 'unit'
export type StockCategory = 'spirit' | 'mixer' | 'garnish' | 'beer' | 'wine' | 'supply' | 'other'
export type CatalogCategory = 'cocktail' | 'shot' | 'beer' | 'wine' | 'soft_drink' | 'food' | 'package' | 'other'

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

export interface Worker {
  id: string
  venue_id: string
  name: string
  pin: string
  role: WorkerRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WorkerStationAssignment {
  id: string
  worker_id: string
  station_id: string
  created_at: string
}

export interface WorkerShift {
  id: string
  worker_id: string
  station_id: string
  venue_id: string
  status: ShiftStatus
  opened_at: string
  closed_at: string | null
  created_at: string
  updated_at: string
}

export interface StockItem {
  id: string
  organization_id: string
  name: string
  category: StockCategory
  unit: StockUnit
  cost_per_unit: number
  presentation_qty: number
  presentation_label: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CatalogItem {
  id: string
  organization_id: string
  name: string
  category: CatalogCategory
  description: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface VenueCatalogItem {
  id: string
  venue_id: string
  catalog_item_id: string
  price: number
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface Recipe {
  id: string
  catalog_item_id: string
  organization_id: string
  name: string
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RecipeItem {
  id: string
  recipe_id: string
  stock_item_id: string
  quantity: number
  created_at: string
  updated_at: string
}

export interface Menu {
  id: string
  venue_id: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: string
  menu_id: string
  venue_catalog_item_id: string
  sort_order: number
  created_at: string
}

export type MovementType = 'intake' | 'transfer_out' | 'transfer_in' | 'consumption' | 'adjustment' | 'waste'

export interface InventoryMovement {
  id: string
  organization_id: string
  venue_id: string
  location_id: string
  stock_item_id: string
  movement_type: MovementType
  quantity: number
  reference_id: string | null
  notes: string | null
  performed_by: string | null
  created_at: string
}

export type SaleStatus = 'open' | 'paid' | 'cancelled'
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mixed'
export type TokenStatus = 'pending' | 'redeemed' | 'cancelled'

export interface Sale {
  id: string
  organization_id: string
  venue_id: string
  station_id: string
  shift_id: string
  worker_id: string
  status: SaleStatus
  total: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SaleItem {
  id: string
  sale_id: string
  venue_catalog_item_id: string
  recipe_id: string | null
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
}

export interface SalePayment {
  id: string
  sale_id: string
  method: PaymentMethod
  amount: number
  created_at: string
}

export interface RedemptionToken {
  id: string
  sale_id: string
  venue_id: string
  token_code: string
  status: TokenStatus
  created_at: string
  redeemed_at: string | null
}

export interface RedemptionTokenItem {
  id: string
  token_id: string
  sale_item_id: string
  created_at: string
}

export interface Redemption {
  id: string
  token_id: string
  venue_id: string
  location_id: string
  worker_id: string
  shift_id: string
  created_at: string
}

export interface RedemptionItem {
  id: string
  redemption_id: string
  sale_item_id: string
  recipe_id: string
  created_at: string
}

export interface StockLevel {
  location_id: string
  location_name: string
  stock_item_id: string
  stock_item_name: string
  unit: StockUnit
  current_qty: number
}
