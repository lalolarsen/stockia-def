import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useVenueContext } from '@/hooks/use-venue-context'
import { getVenueCatalogItems } from '@/services/catalog-items'
import { getMenus, createMenu, updateMenu, getMenuItems, addMenuItem, removeMenuItem } from '@/services/menus'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function MenuDetail({ menuId, venueId }: { menuId: string; venueId: string }) {
  const queryClient = useQueryClient()
  const [vciId, setVciId] = useState('')

  const { data: menuItems } = useQuery({
    queryKey: ['menu-items', menuId],
    queryFn: () => getMenuItems(menuId),
  })

  const { data: venueItems } = useQuery({
    queryKey: ['venue-catalog-items', venueId],
    queryFn: () => getVenueCatalogItems(venueId),
    enabled: !!venueId,
  })

  const usedVciIds = menuItems?.map((mi) => mi.venue_catalog_item_id) ?? []
  const available = venueItems?.filter((vi) => !usedVciIds.includes(vi.id)) ?? []

  const addMut = useMutation({
    mutationFn: () => addMenuItem(menuId, vciId, (menuItems?.length ?? 0) + 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', menuId] })
      setVciId('')
    },
  })

  const removeMut = useMutation({
    mutationFn: removeMenuItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu-items', menuId] }),
  })

  return (
    <div className="space-y-2">
      {menuItems?.map((mi) => (
        <div key={mi.id} className="flex items-center justify-between rounded border p-2">
          <span className="text-sm">
            {mi.venue_catalog_items.catalog_items.name} — ${Number(mi.venue_catalog_items.price).toLocaleString()}
          </span>
          <Button size="sm" variant="ghost" onClick={() => removeMut.mutate(mi.id)}>×</Button>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <Select value={vciId} onValueChange={(v) => { if (v) setVciId(v as string) }}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Agregar producto..." />
          </SelectTrigger>
          <SelectContent>
            {available.map((vi) => (
              <SelectItem key={vi.id} value={vi.id}>
                {vi.catalog_items.name} — ${Number(vi.price).toLocaleString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" disabled={!vciId} onClick={() => addMut.mutate()}>+</Button>
      </div>
    </div>
  )
}

export function Component() {
  const { venueId } = useVenueContext()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [menuName, setMenuName] = useState('')
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)

  const { data: menus, isLoading } = useQuery({
    queryKey: ['menus', venueId],
    queryFn: () => getMenus(venueId!),
    enabled: !!venueId,
  })

  const createMut = useMutation({
    mutationFn: () => createMenu(venueId!, menuName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus', venueId] })
      setDialogOpen(false)
      setMenuName('')
    },
  })

  const toggleActiveMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateMenu(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menus', venueId] }),
  })

  if (!venueId) {
    return <p className="text-muted-foreground">Selecciona un venue en el Dashboard.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Menús</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            + Nuevo menú
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear menú</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={menuName} onChange={(e) => setMenuName(e.target.value)} placeholder="Menú principal" />
              </div>
              <Button className="w-full" disabled={!menuName || createMut.isPending} onClick={() => createMut.mutate()}>
                {createMut.isPending ? 'Creando...' : 'Crear'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : menus && menus.length > 0 ? (
        <div className="space-y-3">
          {menus.map((m) => (
            <Card key={m.id}>
              <CardHeader
                className="cursor-pointer py-3 px-4"
                onClick={() => setExpandedMenu(expandedMenu === m.id ? null : m.id)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{m.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={m.is_active ? 'default' : 'secondary'}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleActiveMut.mutate({ id: m.id, is_active: !m.is_active })
                      }}
                    >
                      {m.is_active ? 'Activo' : 'Inactivo'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {expandedMenu === m.id && (
                <CardContent>
                  <MenuDetail menuId={m.id} venueId={venueId} />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Sin menús. Crea uno para agrupar productos de la carta.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
