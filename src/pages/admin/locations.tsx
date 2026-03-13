import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useVenueContext } from '@/hooks/use-venue-context'
import { getLocations, createLocation } from '@/services/locations'
import { getStations, createStation } from '@/services/stations'
import { createLocationSchema, createStationSchema, type CreateLocationForm, type CreateStationForm } from '@/schemas/core'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function Component() {
  const { venueId } = useVenueContext()
  const queryClient = useQueryClient()
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const [stationDialogOpen, setStationDialogOpen] = useState(false)

  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ['locations', venueId],
    queryFn: () => getLocations(venueId!),
    enabled: !!venueId,
  })

  const { data: stations } = useQuery({
    queryKey: ['stations', venueId],
    queryFn: () => getStations(venueId!),
    enabled: !!venueId,
  })

  const locationForm = useForm<CreateLocationForm>({
    resolver: zodResolver(createLocationSchema),
  })

  const stationForm = useForm<CreateStationForm>({
    resolver: zodResolver(createStationSchema),
  })

  const createLocationMutation = useMutation({
    mutationFn: (data: CreateLocationForm) =>
      createLocation({ venue_id: venueId!, name: data.name, type: data.type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations', venueId] })
      setLocationDialogOpen(false)
      locationForm.reset()
    },
  })

  const createStationMutation = useMutation({
    mutationFn: (data: CreateStationForm) =>
      createStation({ venue_id: venueId!, location_id: data.location_id, name: data.name, type: data.type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations', venueId] })
      setStationDialogOpen(false)
      stationForm.reset()
    },
  })

  if (!venueId) {
    return <p className="text-muted-foreground">Selecciona un venue en el Dashboard.</p>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Locations y Stations</h2>

      {/* Locations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Locations</CardTitle>
          <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              + Nueva
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear location</DialogTitle>
              </DialogHeader>
              <form onSubmit={locationForm.handleSubmit((d) => createLocationMutation.mutate(d))} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input {...locationForm.register('name')} placeholder="Bodega principal" />
                  {locationForm.formState.errors.name && (
                    <p className="text-sm text-destructive">{locationForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select onValueChange={(v) => { if (v) locationForm.setValue('type', v as 'warehouse' | 'bar') }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warehouse">Bodega</SelectItem>
                      <SelectItem value="bar">Barra</SelectItem>
                    </SelectContent>
                  </Select>
                  {locationForm.formState.errors.type && (
                    <p className="text-sm text-destructive">{locationForm.formState.errors.type.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={createLocationMutation.isPending}>
                  {createLocationMutation.isPending ? 'Creando...' : 'Crear'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {locationsLoading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : locations && locations.length > 0 ? (
            <div className="space-y-2">
              {locations.map((loc) => (
                <div key={loc.id} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="font-medium">{loc.name}</span>
                  <Badge variant="outline">{loc.type === 'warehouse' ? 'Bodega' : 'Barra'}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin locations</p>
          )}
        </CardContent>
      </Card>

      {/* Stations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Stations</CardTitle>
          <Dialog open={stationDialogOpen} onOpenChange={setStationDialogOpen}>
            <DialogTrigger render={<Button size="sm" disabled={!locations || locations.length === 0} />}>
              + Nueva
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear station</DialogTitle>
              </DialogHeader>
              <form onSubmit={stationForm.handleSubmit((d) => createStationMutation.mutate(d))} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input {...stationForm.register('name')} placeholder="POS Caja 1" />
                  {stationForm.formState.errors.name && (
                    <p className="text-sm text-destructive">{stationForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select onValueChange={(v) => { if (v) stationForm.setValue('location_id', v as string) }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {stationForm.formState.errors.location_id && (
                    <p className="text-sm text-destructive">{stationForm.formState.errors.location_id.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select onValueChange={(v) => { if (v) stationForm.setValue('type', v as 'pos' | 'tablet' | 'kiosk') }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pos">POS</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="kiosk">Kiosk</SelectItem>
                    </SelectContent>
                  </Select>
                  {stationForm.formState.errors.type && (
                    <p className="text-sm text-destructive">{stationForm.formState.errors.type.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={createStationMutation.isPending}>
                  {createStationMutation.isPending ? 'Creando...' : 'Crear'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {stations && stations.length > 0 ? (
            <div className="space-y-2">
              {stations.map((st) => {
                const loc = locations?.find((l) => l.id === st.location_id)
                return (
                  <div key={st.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <span className="font-medium">{st.name}</span>
                      <span className="ml-2 text-sm text-muted-foreground">{loc?.name}</span>
                    </div>
                    <Badge variant="outline">{st.type.toUpperCase()}</Badge>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin stations</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
