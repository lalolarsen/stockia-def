import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useVenueContext } from '@/hooks/use-venue-context'
import { getCatalogItems } from '@/services/catalog-items'
import { getStockItems } from '@/services/stock-items'
import { getRecipes, createRecipe, getRecipeItems, addRecipeItem, removeRecipeItem, getOptionGroups, createOptionGroup, deleteOptionGroup, getOptionItems, addOptionItem, deleteOptionItem } from '@/services/recipes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Recipe } from '@/types/database'

function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const { organizationId } = useVenueContext()
  const queryClient = useQueryClient()
  const [stockItemId, setStockItemId] = useState('')
  const [qty, setQty] = useState('')
  const [groupName, setGroupName] = useState('')

  const { data: stockItems } = useQuery({
    queryKey: ['stock-items', organizationId],
    queryFn: () => getStockItems(organizationId!),
    enabled: !!organizationId,
  })

  const { data: items } = useQuery({
    queryKey: ['recipe-items', recipe.id],
    queryFn: () => getRecipeItems(recipe.id),
  })

  const { data: groups } = useQuery({
    queryKey: ['option-groups', recipe.id],
    queryFn: () => getOptionGroups(recipe.id),
  })

  const addItemMut = useMutation({
    mutationFn: () => addRecipeItem(recipe.id, stockItemId, Number(qty)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe-items', recipe.id] })
      setStockItemId(''); setQty('')
    },
  })

  const removeItemMut = useMutation({
    mutationFn: removeRecipeItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipe-items', recipe.id] }),
  })

  const addGroupMut = useMutation({
    mutationFn: () => createOptionGroup(recipe.id, groupName, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['option-groups', recipe.id] })
      setGroupName('')
    },
  })

  const delGroupMut = useMutation({
    mutationFn: deleteOptionGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['option-groups', recipe.id] }),
  })

  return (
    <div className="space-y-4">
      {/* Recipe items (fixed ingredients) */}
      <div>
        <p className="text-sm font-medium mb-2">Ingredientes fijos</p>
        {items?.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded border p-2 mb-1">
            <span className="text-sm">{item.stock_items.name} — {Number(item.quantity)} {item.stock_items.unit}</span>
            <Button size="sm" variant="ghost" onClick={() => removeItemMut.mutate(item.id)}>×</Button>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <Select value={stockItemId} onValueChange={(v) => { if (v) setStockItemId(v as string) }}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Stock item..." />
            </SelectTrigger>
            <SelectContent>
              {stockItems?.map((si) => (
                <SelectItem key={si.id} value={si.id}>{si.name} ({si.unit})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="number" placeholder="Cant." value={qty} onChange={(e) => setQty(e.target.value)} className="w-24" />
          <Button size="sm" disabled={!stockItemId || !qty} onClick={() => addItemMut.mutate()}>+</Button>
        </div>
      </div>

      {/* Option groups (e.g., mixer selection) */}
      <div>
        <p className="text-sm font-medium mb-2">Grupos de opciones (mixer, etc.)</p>
        {groups?.map((group) => (
          <OptionGroupDetail key={group.id} group={group} stockItems={stockItems ?? []} onDelete={() => delGroupMut.mutate(group.id)} />
        ))}
        <div className="flex gap-2 mt-2">
          <Input placeholder="Nombre grupo (ej: Mixer)" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="flex-1" />
          <Button size="sm" disabled={!groupName} onClick={() => addGroupMut.mutate()}>+ Grupo</Button>
        </div>
      </div>
    </div>
  )
}

function OptionGroupDetail({ group, stockItems, onDelete }: { group: { id: string; name: string }; stockItems: { id: string; name: string; unit: string }[]; onDelete: () => void }) {
  const queryClient = useQueryClient()
  const [stockId, setStockId] = useState('')
  const [qty, setQty] = useState('')
  const [label, setLabel] = useState('')

  const { data: optItems } = useQuery({
    queryKey: ['option-items', group.id],
    queryFn: () => getOptionItems(group.id),
  })

  const addMut = useMutation({
    mutationFn: () => addOptionItem(group.id, stockId, Number(qty), label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['option-items', group.id] })
      setStockId(''); setQty(''); setLabel('')
    },
  })

  const delMut = useMutation({
    mutationFn: deleteOptionItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['option-items', group.id] }),
  })

  return (
    <Card className="mb-2">
      <CardHeader className="py-2 px-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">{group.name}</CardTitle>
        <Button size="sm" variant="ghost" onClick={onDelete}>×</Button>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {optItems?.map((oi) => (
          <div key={oi.id} className="flex items-center justify-between rounded border p-1.5 mb-1 text-sm">
            <span>{oi.label} — {Number(oi.quantity)} {oi.stock_items.unit}</span>
            <Button size="sm" variant="ghost" onClick={() => delMut.mutate(oi.id)}>×</Button>
          </div>
        ))}
        <div className="flex gap-1 mt-1">
          <Select value={stockId} onValueChange={(v) => { if (v) setStockId(v as string) }}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Item..." />
            </SelectTrigger>
            <SelectContent>
              {stockItems.map((si) => (
                <SelectItem key={si.id} value={si.id}>{si.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Cant." type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="w-16" />
          <Input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} className="w-24" />
          <Button size="sm" disabled={!stockId || !qty || !label} onClick={() => addMut.mutate()}>+</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function Component() {
  const { organizationId } = useVenueContext()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [catalogItemId, setCatalogItemId] = useState('')
  const [recipeName, setRecipeName] = useState('')
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null)

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['recipes', organizationId],
    queryFn: () => getRecipes(organizationId!),
    enabled: !!organizationId,
  })

  const { data: catalogItems } = useQuery({
    queryKey: ['catalog-items', organizationId],
    queryFn: () => getCatalogItems(organizationId!),
    enabled: !!organizationId,
  })

  const createMut = useMutation({
    mutationFn: () => createRecipe({
      catalog_item_id: catalogItemId,
      organization_id: organizationId!,
      name: recipeName,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes', organizationId] })
      setDialogOpen(false)
      setCatalogItemId(''); setRecipeName('')
    },
  })

  if (!organizationId) {
    return <p className="text-muted-foreground">Selecciona una organización en el Dashboard.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Recetas</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            + Nueva receta
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear receta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Producto</Label>
                <Select onValueChange={(v) => { if (v) setCatalogItemId(v as string) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogItems?.map((ci) => (
                      <SelectItem key={ci.id} value={ci.id}>{ci.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nombre receta</Label>
                <Input value={recipeName} onChange={(e) => setRecipeName(e.target.value)} placeholder="Receta estándar" />
              </div>
              <Button className="w-full" disabled={!catalogItemId || !recipeName || createMut.isPending} onClick={() => createMut.mutate()}>
                {createMut.isPending ? 'Creando...' : 'Crear'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : recipes && recipes.length > 0 ? (
        <div className="space-y-3">
          {recipes.map((r) => (
            <Card key={r.id}>
              <CardHeader
                className="cursor-pointer py-3 px-4"
                onClick={() => setExpandedRecipe(expandedRecipe === r.id ? null : r.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{r.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{r.catalog_items.name}</p>
                  </div>
                  <div className="flex gap-2">
                    {r.is_default && <Badge>Default</Badge>}
                    <Badge variant={r.is_active ? 'default' : 'secondary'}>
                      {r.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              {expandedRecipe === r.id && (
                <CardContent>
                  <RecipeDetail recipe={r} />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Sin recetas. Crea la primera para definir qué stock consume cada producto.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
