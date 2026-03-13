import { supabase } from '@/lib/supabase'
import type { Recipe, RecipeItem, StockItem } from '@/types/database'

export async function getRecipes(organizationId: string) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, catalog_items(name)')
    .eq('organization_id', organizationId)
    .order('name')
  if (error) throw error
  return data as (Recipe & { catalog_items: { name: string } })[]
}

export async function getRecipesByCatalogItem(catalogItemId: string) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('catalog_item_id', catalogItemId)
    .order('name')
  if (error) throw error
  return data as Recipe[]
}

export async function createRecipe(recipe: {
  catalog_item_id: string
  organization_id: string
  name: string
}) {
  const { data, error } = await supabase
    .from('recipes')
    .insert(recipe)
    .select()
    .single()
  if (error) throw error
  return data as Recipe
}

export async function getRecipeItems(recipeId: string) {
  const { data, error } = await supabase
    .from('recipe_items')
    .select('*, stock_items(name, unit)')
    .eq('recipe_id', recipeId)
  if (error) throw error
  return data as (RecipeItem & { stock_items: Pick<StockItem, 'name' | 'unit'> })[]
}

export async function addRecipeItem(recipeId: string, stockItemId: string, quantity: number) {
  const { data, error } = await supabase
    .from('recipe_items')
    .insert({ recipe_id: recipeId, stock_item_id: stockItemId, quantity })
    .select()
    .single()
  if (error) throw error
  return data as RecipeItem
}

export async function removeRecipeItem(id: string) {
  const { error } = await supabase.from('recipe_items').delete().eq('id', id)
  if (error) throw error
}

