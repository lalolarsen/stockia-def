import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useVenueContext } from '@/hooks/use-venue-context'
import { getCatalogItems, createCatalogItem, getVenueCatalogItems, addCatalogItemToVenue, updateVenueCatalogItem, removeVenueCatalogItem } from '@/services/catalog-items'
import { createCatalogItemSchema, addToVenueSchema, type CreateCatalogItemForm, type AddToVenueForm } from '@/schemas/stock'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const CATALOG_LABELS: Record<string, string> = {
  cocktail: 'Cóctel', shot: 'Shot', beer: 'Cerveza', wine: 'Vino',
  soft_drink: 'Bebida', food: 'Comida', package: 'Paquete', other: 'Otro',
}

export function Component() {
  const { organizationId, venueId } = useVenueContext()
  const queryClient = useQueryClient()
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false)
  const [venueDialogOpen, setVenueDialogOpen] = useState(false)

  const { data: catalogItems, isLoading } = useQuery({
    queryKey: ['catalog-items', organizationId],
    queryFn: () => getCatalogItems(organizationId!),
    enabled: !!organizationId,
  })

  const { data: venueItems } = useQuery({
    queryKey: ['venue-catalog-items', venueId],
    queryFn: () => getVenueCatalogItems(venueId!),
    enabled: !!venueId,
  })

  const catalogForm = useForm<CreateCatalogItemForm>({
    resolver: zodResolver(createCatalogItemSchema),
  })

  const venueForm = useForm<AddToVenueForm>({
    resolver: zodResolver(addToVenueSchema),
  })

  const createCatalogMutation = useMutation({
    mutationFn: (data: CreateCatalogItemForm) =>
      createCatalogItem({
        organization_id: organizationId!,
        name: data.name,
        category: data.category,
        description: data.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-items', organizationId] })
      setCatalogDialogOpen(false)
      catalogForm.reset()
    },
  })

  const addToVenueMutation = useMutation({
    mutationFn: (data: AddToVenueForm) =>
      addCatalogItemToVenue(venueId!, data.catalog_item_id, data.price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-catalog-items', venueId] })
      setVenueDialogOpen(false)
      venueForm.reset()
    },
  })

  const toggleAvailMutation = useMutation({
    mutationFn: ({ id, is_available }: { id: string; is_available: boolean }) =>
      updateVenueCatalogItem(id, { is_available }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-catalog-items', venueId] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: removeVenueCatalogItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-catalog-items', venueId] })
    },
  })

  if (!organizationId) {
    return <p className="text-muted-foreground">Selecciona una organización en el Dashboard.</p>
  }

  const venueItemIds = venueItems?.map((vi) => vi.catalog_item_id) ?? []
  const availableForVenue = catalogItems?.filter((ci) => !venueItemIds.includes(ci.id)) ?? []

  return (
    <div className="space-y-6">
      {/* Master catalog */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Catálogo</h2>
        <Dialog open={catalogDialogOpen} onOpenChange={setCatalogDialogOpen}>
          <DialogTrigger render={<Button />}>
            + Nuevo producto
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear producto</DialogTitle>
            </DialogHeader>
            <form onSubmit={catalogForm.handleSubmit((d) => createCatalogMutation.mutate(d))} className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input {...catalogForm.register('name')} placeholder="Cuba Libre" />
                {catalogForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{catalogForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select onValueChange={(v) => { if (v) catalogForm.setValue('category', v as CreateCatalogItemForm['category']) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATALOG_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {catalogForm.formState.errors.category && (
                  <p className="text-sm text-destructive">{catalogForm.formState.errors.category.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Descripción (opcional)</Label>
                <Input {...catalogForm.register('description')} placeholder="Ron + Coca-Cola + limón" />
              </div>
              <Button type="submit" className="w-full" disabled={createCatalogMutation.isPending}>
                {createCatalogMutation.isPending ? 'Creando...' : 'Crear'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : catalogItems && catalogItems.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {catalogItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{CATALOG_LABELS[item.category] ?? item.category}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.description ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={item.is_active ? 'default' : 'secondary'}>
                    {item.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Sin productos. Crea el primero (ej: Cuba Libre, Vodka Tonic).</p>
          </CardContent>
        </Card>
      )}

      {/* Venue catalog + pricing */}
      {venueId && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Carta del Venue</h3>
            <Dialog open={venueDialogOpen} onOpenChange={setVenueDialogOpen}>
              <DialogTrigger render={<Button size="sm" disabled={availableForVenue.length === 0} />}>
                + Agregar a carta
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar producto a la carta</DialogTitle>
                </DialogHeader>
                <form onSubmit={venueForm.handleSubmit((d) => addToVenueMutation.mutate(d))} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Producto</Label>
                    <Select onValueChange={(v) => { if (v) venueForm.setValue('catalog_item_id', v as string) }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableForVenue.map((ci) => (
                          <SelectItem key={ci.id} value={ci.id}>{ci.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {venueForm.formState.errors.catalog_item_id && (
                      <p className="text-sm text-destructive">{venueForm.formState.errors.catalog_item_id.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Precio</Label>
                    <Input type="number" step="1" {...venueForm.register('price', { valueAsNumber: true })} placeholder="5000" />
                    {venueForm.formState.errors.price && (
                      <p className="text-sm text-destructive">{venueForm.formState.errors.price.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={addToVenueMutation.isPending}>
                    {addToVenueMutation.isPending ? 'Agregando...' : 'Agregar'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {venueItems && venueItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Disponible</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {venueItems.map((vi) => (
                  <TableRow key={vi.id}>
                    <TableCell className="font-medium">{vi.catalog_items.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{CATALOG_LABELS[vi.catalog_items.category] ?? vi.catalog_items.category}</Badge>
                    </TableCell>
                    <TableCell>${Number(vi.price).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={vi.is_available ? 'default' : 'secondary'}
                        onClick={() => toggleAvailMutation.mutate({ id: vi.id, is_available: !vi.is_available })}
                      >
                        {vi.is_available ? 'Sí' : 'No'}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => removeMutation.mutate(vi.id)}>
                        Quitar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Carta vacía. Agrega productos del catálogo con su precio.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
