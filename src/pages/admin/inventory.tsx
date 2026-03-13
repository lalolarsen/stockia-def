import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useVenueContext } from '@/hooks/use-venue-context'
import { getLocations } from '@/services/locations'
import { getStockItems } from '@/services/stock-items'
import { getStockLevels, getMovements, registerIntake, registerTransfer } from '@/services/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const MOVEMENT_LABELS: Record<string, string> = {
  intake: 'Ingreso',
  transfer_out: 'Salida',
  transfer_in: 'Entrada',
  consumption: 'Consumo',
  adjustment: 'Ajuste',
  waste: 'Merma',
}

type Tab = 'levels' | 'intake' | 'transfer' | 'history'

function StockLevelsTab({ venueId }: { venueId: string }) {
  const [locationFilter, setLocationFilter] = useState<string>('')

  const { data: locations } = useQuery({
    queryKey: ['locations', venueId],
    queryFn: () => getLocations(venueId),
  })

  const { data: levels, isLoading } = useQuery({
    queryKey: ['stock-levels', venueId, locationFilter],
    queryFn: () => getStockLevels(venueId, locationFilter || undefined),
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Filtrar por ubicación</Label>
          <Select value={locationFilter} onValueChange={(v) => setLocationFilter(v === '__all__' ? '' : (v as string ?? ''))}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Todas las ubicaciones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas las ubicaciones</SelectItem>
              {locations?.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name} ({loc.type})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : levels && levels.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ubicación</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Unidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {levels.map((l, i) => (
              <TableRow key={i}>
                <TableCell>{l.location_name}</TableCell>
                <TableCell className="font-medium">{l.stock_item_name}</TableCell>
                <TableCell>{Number(l.current_qty).toLocaleString()}</TableCell>
                <TableCell>{l.unit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Sin stock. Registra un ingreso para comenzar.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function IntakeTab({ organizationId, venueId }: { organizationId: string; venueId: string }) {
  const queryClient = useQueryClient()
  const [locationId, setLocationId] = useState('')
  const [items, setItems] = useState<{ stock_item_id: string; quantity: string }[]>([
    { stock_item_id: '', quantity: '' },
  ])
  const [notes, setNotes] = useState('')

  const { data: locations } = useQuery({
    queryKey: ['locations', venueId],
    queryFn: () => getLocations(venueId),
  })

  const { data: stockItems } = useQuery({
    queryKey: ['stock-items', organizationId],
    queryFn: () => getStockItems(organizationId),
  })

  const intakeMut = useMutation({
    mutationFn: () =>
      registerIntake(
        organizationId,
        venueId,
        locationId,
        items
          .filter((it) => it.stock_item_id && it.quantity)
          .map((it) => ({ stock_item_id: it.stock_item_id, quantity: Number(it.quantity) })),
        notes || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      setItems([{ stock_item_id: '', quantity: '' }])
      setNotes('')
    },
  })

  const validItems = items.filter((it) => it.stock_item_id && it.quantity && Number(it.quantity) > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar ingreso de stock</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Ubicación destino</Label>
          <Select value={locationId} onValueChange={(v) => { if (v) setLocationId(v as string) }}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona ubicación" />
            </SelectTrigger>
            <SelectContent>
              {locations?.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name} ({loc.type})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Items</Label>
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <Select
                value={item.stock_item_id}
                onValueChange={(v) => {
                  if (v) {
                    const next = [...items]
                    next[idx] = { ...next[idx], stock_item_id: v as string }
                    setItems(next)
                  }
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Stock item..." />
                </SelectTrigger>
                <SelectContent>
                  {stockItems?.map((si) => (
                    <SelectItem key={si.id} value={si.id}>{si.name} ({si.unit})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Cantidad"
                value={item.quantity}
                onChange={(e) => {
                  const next = [...items]
                  next[idx] = { ...next[idx], quantity: e.target.value }
                  setItems(next)
                }}
                className="w-28"
              />
              {items.length > 1 && (
                <Button size="sm" variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== idx))}>×</Button>
              )}
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setItems([...items, { stock_item_id: '', quantity: '' }])}>
            + Agregar línea
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Notas (opcional)</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Compra proveedor X" />
        </div>

        <Button
          className="w-full"
          disabled={!locationId || validItems.length === 0 || intakeMut.isPending}
          onClick={() => intakeMut.mutate()}
        >
          {intakeMut.isPending ? 'Registrando...' : `Registrar ingreso (${validItems.length} items)`}
        </Button>
      </CardContent>
    </Card>
  )
}

function TransferTab({ organizationId, venueId }: { organizationId: string; venueId: string }) {
  const queryClient = useQueryClient()
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [items, setItems] = useState<{ stock_item_id: string; quantity: string }[]>([
    { stock_item_id: '', quantity: '' },
  ])
  const [notes, setNotes] = useState('')

  const { data: locations } = useQuery({
    queryKey: ['locations', venueId],
    queryFn: () => getLocations(venueId),
  })

  const { data: stockItems } = useQuery({
    queryKey: ['stock-items', organizationId],
    queryFn: () => getStockItems(organizationId),
  })

  const transferMut = useMutation({
    mutationFn: () =>
      registerTransfer(
        organizationId,
        venueId,
        fromId,
        toId,
        items
          .filter((it) => it.stock_item_id && it.quantity)
          .map((it) => ({ stock_item_id: it.stock_item_id, quantity: Number(it.quantity) })),
        notes || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      setItems([{ stock_item_id: '', quantity: '' }])
      setNotes('')
    },
  })

  const validItems = items.filter((it) => it.stock_item_id && it.quantity && Number(it.quantity) > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transferir stock entre ubicaciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Origen</Label>
            <Select value={fromId} onValueChange={(v) => { if (v) setFromId(v as string) }}>
              <SelectTrigger>
                <SelectValue placeholder="Desde..." />
              </SelectTrigger>
              <SelectContent>
                {locations?.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name} ({loc.type})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Destino</Label>
            <Select value={toId} onValueChange={(v) => { if (v) setToId(v as string) }}>
              <SelectTrigger>
                <SelectValue placeholder="Hacia..." />
              </SelectTrigger>
              <SelectContent>
                {locations?.filter((l) => l.id !== fromId).map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name} ({loc.type})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Items</Label>
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <Select
                value={item.stock_item_id}
                onValueChange={(v) => {
                  if (v) {
                    const next = [...items]
                    next[idx] = { ...next[idx], stock_item_id: v as string }
                    setItems(next)
                  }
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Stock item..." />
                </SelectTrigger>
                <SelectContent>
                  {stockItems?.map((si) => (
                    <SelectItem key={si.id} value={si.id}>{si.name} ({si.unit})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Cantidad"
                value={item.quantity}
                onChange={(e) => {
                  const next = [...items]
                  next[idx] = { ...next[idx], quantity: e.target.value }
                  setItems(next)
                }}
                className="w-28"
              />
              {items.length > 1 && (
                <Button size="sm" variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== idx))}>×</Button>
              )}
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setItems([...items, { stock_item_id: '', quantity: '' }])}>
            + Agregar línea
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Notas (opcional)</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reposición barra principal" />
        </div>

        <Button
          className="w-full"
          disabled={!fromId || !toId || fromId === toId || validItems.length === 0 || transferMut.isPending}
          onClick={() => transferMut.mutate()}
        >
          {transferMut.isPending ? 'Transfiriendo...' : `Transferir (${validItems.length} items)`}
        </Button>
      </CardContent>
    </Card>
  )
}

function HistoryTab({ venueId }: { venueId: string }) {
  const [locationFilter, setLocationFilter] = useState<string>('')

  const { data: locations } = useQuery({
    queryKey: ['locations', venueId],
    queryFn: () => getLocations(venueId),
  })

  const { data: movements, isLoading } = useQuery({
    queryKey: ['movements', venueId, locationFilter],
    queryFn: () => getMovements(venueId, locationFilter || undefined),
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Filtrar por ubicación</Label>
          <Select value={locationFilter} onValueChange={(v) => setLocationFilter(v === '__all__' ? '' : (v as string ?? ''))}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas</SelectItem>
              {locations?.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name} ({loc.type})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : movements && movements.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-sm">{new Date(m.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={Number(m.quantity) >= 0 ? 'default' : 'secondary'}>
                    {MOVEMENT_LABELS[m.movement_type] ?? m.movement_type}
                  </Badge>
                </TableCell>
                <TableCell>{m.locations.name}</TableCell>
                <TableCell className="font-medium">{m.stock_items.name}</TableCell>
                <TableCell>{Number(m.quantity) > 0 ? '+' : ''}{Number(m.quantity)} {m.stock_items.unit}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.notes ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Sin movimientos registrados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function Component() {
  const { organizationId, venueId } = useVenueContext()
  const [tab, setTab] = useState<Tab>('levels')

  if (!organizationId || !venueId) {
    return <p className="text-muted-foreground">Selecciona organización y venue en el Dashboard.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Inventario</h2>
      </div>

      <div className="flex gap-2">
        {([
          ['levels', 'Stock actual'],
          ['intake', 'Ingreso'],
          ['transfer', 'Transferencia'],
          ['history', 'Historial'],
        ] as [Tab, string][]).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={tab === key ? 'default' : 'outline'}
            onClick={() => setTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === 'levels' && <StockLevelsTab venueId={venueId} />}
      {tab === 'intake' && <IntakeTab organizationId={organizationId} venueId={venueId} />}
      {tab === 'transfer' && <TransferTab organizationId={organizationId} venueId={venueId} />}
      {tab === 'history' && <HistoryTab venueId={venueId} />}
    </div>
  )
}
