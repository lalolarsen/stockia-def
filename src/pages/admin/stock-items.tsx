import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useVenueContext } from '@/hooks/use-venue-context'
import { getStockItems, createStockItem } from '@/services/stock-items'
import { createStockItemSchema, type CreateStockItemForm } from '@/schemas/stock'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const CATEGORY_LABELS: Record<string, string> = {
  spirit: 'Licor', mixer: 'Mixer', garnish: 'Guarnición',
  beer: 'Cerveza', wine: 'Vino', supply: 'Insumo', other: 'Otro',
}

export function Component() {
  const { organizationId } = useVenueContext()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: items, isLoading } = useQuery({
    queryKey: ['stock-items', organizationId],
    queryFn: () => getStockItems(organizationId!),
    enabled: !!organizationId,
  })

  const form = useForm<CreateStockItemForm>({
    resolver: zodResolver(createStockItemSchema),
    defaultValues: { cost_per_unit: 0, presentation_qty: 1 },
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateStockItemForm) =>
      createStockItem({
        organization_id: organizationId!,
        name: data.name,
        category: data.category,
        unit: data.unit,
        cost_per_unit: data.cost_per_unit,
        presentation_qty: data.presentation_qty,
        presentation_label: data.presentation_label,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-items', organizationId] })
      setDialogOpen(false)
      form.reset()
    },
  })

  if (!organizationId) {
    return <p className="text-muted-foreground">Selecciona una organización en el Dashboard.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Stock Items</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            + Nuevo item
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear stock item</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input {...form.register('name')} placeholder="Vodka Absolut" />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select onValueChange={(v) => { if (v) form.setValue('category', v as CreateStockItemForm['category']) }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category && (
                    <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Unidad</Label>
                  <Select onValueChange={(v) => { if (v) form.setValue('unit', v as 'ml' | 'unit') }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ml">Mililitros (ml)</SelectItem>
                      <SelectItem value="unit">Unidad</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.unit && (
                    <p className="text-sm text-destructive">{form.formState.errors.unit.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Costo por unidad</Label>
                  <Input type="number" step="0.01" {...form.register('cost_per_unit', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Cant. presentación</Label>
                  <Input type="number" step="0.01" {...form.register('presentation_qty', { valueAsNumber: true })} placeholder="750" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Etiqueta presentación</Label>
                <Input {...form.register('presentation_label')} placeholder="Botella 750ml" />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creando...' : 'Crear'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : items && items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Presentación</TableHead>
              <TableHead>Costo/u</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{CATEGORY_LABELS[item.category] ?? item.category}</Badge>
                </TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>
                  {item.presentation_label ?? `${item.presentation_qty} ${item.unit}`}
                </TableCell>
                <TableCell>${Number(item.cost_per_unit).toFixed(2)}</TableCell>
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
            <p className="text-muted-foreground">Sin stock items. Crea el primero (ej: Vodka Absolut, Coca-Cola, Limón).</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
