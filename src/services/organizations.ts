import { supabase } from '@/lib/supabase'
import type { Organization } from '@/types/database'

export async function getOrganizations() {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('name')
  if (error) throw error
  return data as Organization[]
}

export async function createOrganization(name: string, slug: string) {
  const { data, error } = await supabase.rpc('create_organization', {
    p_name: name,
    p_slug: slug,
  })
  if (error) throw error
  return data as string
}
