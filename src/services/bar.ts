import { supabase } from '@/lib/supabase'

export interface TokenDetails {
  token_id: string
  token_code: string
  status: string
  created_at: string
  items: {
    sale_item_id: string
    quantity: number
    product_name: string
    recipe_id: string | null
    recipe_name: string | null
    option_groups: {
      group_id: string
      group_name: string
      is_required: boolean
      options: {
        option_id: string
        label: string
        stock_item_id: string
      }[]
    }[]
  }[]
}

export async function getTokenDetails(tokenCode: string, venueId: string) {
  const { data, error } = await supabase.rpc('get_token_details', {
    p_token_code: tokenCode.toUpperCase(),
    p_venue_id: venueId,
  })
  if (error) throw error
  return data as TokenDetails
}

export async function redeemToken(params: {
  token_code: string
  venue_id: string
  location_id: string
  worker_id: string
  shift_id: string
  options?: {
    sale_item_id: string
    option_selections: { option_group_id: string; option_item_id: string }[]
  }[]
}) {
  const { data, error } = await supabase.rpc('redeem_token', {
    p_token_code: params.token_code.toUpperCase(),
    p_venue_id: params.venue_id,
    p_location_id: params.location_id,
    p_worker_id: params.worker_id,
    p_shift_id: params.shift_id,
    p_options: params.options ?? [],
  })
  if (error) throw error
  return data as { redemption_id: string; token_code: string; status: string }
}

export async function getPendingTokens(venueId: string) {
  const { data, error } = await supabase
    .from('redemption_tokens')
    .select('*, sales(total, workers(name))')
    .eq('venue_id', venueId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as {
    id: string
    token_code: string
    status: string
    created_at: string
    sales: { total: number; workers: { name: string } }
  }[]
}
