import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useVenueContext } from '@/hooks/use-venue-context'
import { getWorkers, createWorker, getWorkerAssignments, assignWorkerToStation, removeWorkerFromStation } from '@/services/workers'
import { getStations } from '@/services/stations'
import { getShifts } from '@/services/shifts'
import { createWorkerSchema, type CreateWorkerForm } from '@/schemas/workers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Worker } from '@/types/database'

function WorkerAssignments({ worker }: { worker: Worker }) {
  const { venueId } = useVenueContext()
  const queryClient = useQueryClient()
  const [selectedStation, setSelectedStation] = useState('')

  const { data: assignments } = useQuery({
    queryKey: ['worker-assignments', worker.id],
    queryFn: () => getWorkerAssignments(worker.id),
  })

  const { data: stations } = useQuery({
    queryKey: ['stations', venueId],
    queryFn: () => getStations(venueId!),
    enabled: !!venueId,
  })

  const assignMutation = useMutation({
    mutationFn: () => assignWorkerToStation(worker.id, selectedStation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-assignments', worker.id] })
      setSelectedStation('')
    },
  })

  const unassignMutation = useMutation({
    mutationFn: (stationId: string) => removeWorkerFromStation(worker.id, stationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-assignments', worker.id] })
    },
  })

  const assignedStationIds = assignments?.map((a) => a.station_id) ?? []
  const availableStations = stations?.filter((s) => !assignedStationIds.includes(s.id)) ?? []

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-1">
        {assignments?.map((a) => {
          const station = stations?.find((s) => s.id === a.station_id)
          return (
            <Badge key={a.id} variant="secondary" className="gap-1">
              {station?.name ?? a.station_id}
              <button
                onClick={() => unassignMutation.mutate(a.station_id)}
                className="ml-1 text-xs hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )
        })}
      </div>
      {availableStations.length > 0 && (
        <div className="flex gap-2">
          <Select value={selectedStation} onValueChange={(v) => { if (v) setSelectedStation(v) }}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Asignar station..." />
            </SelectTrigger>
            <SelectContent>
              {availableStations.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={!selectedStation || assignMutation.isPending}
            onClick={() => assignMutation.mutate()}
          >
            Asignar
          </Button>
        </div>
      )}
    </div>
  )
}

export function Component() {
  const { venueId } = useVenueContext()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: workers, isLoading } = useQuery({
    queryKey: ['workers', venueId],
    queryFn: () => getWorkers(venueId!),
    enabled: !!venueId,
  })

  const { data: shifts } = useQuery({
    queryKey: ['shifts', venueId],
    queryFn: () => getShifts(venueId!),
    enabled: !!venueId,
  })

  const form = useForm<CreateWorkerForm>({
    resolver: zodResolver(createWorkerSchema),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateWorkerForm) =>
      createWorker({ venue_id: venueId!, name: data.name, pin: data.pin, role: data.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers', venueId] })
      setDialogOpen(false)
      form.reset()
    },
  })

  if (!venueId) {
    return <p className="text-muted-foreground">Selecciona un venue en el Dashboard.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Workers</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            + Nuevo worker
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear worker</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input {...form.register('name')} placeholder="Juan Pérez" />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>PIN</Label>
                <Input {...form.register('pin')} placeholder="1234" maxLength={6} />
                {form.formState.errors.pin && (
                  <p className="text-sm text-destructive">{form.formState.errors.pin.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select onValueChange={(v) => { if (v) form.setValue('role', v as 'cashier' | 'bartender') }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cajero</SelectItem>
                    <SelectItem value="bartender">Bartender</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.role && (
                  <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>
                )}
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
      ) : workers && workers.length > 0 ? (
        <div className="space-y-3">
          {workers.map((w) => {
            const openShift = shifts?.find((s) => s.worker_id === w.id && s.status === 'open')
            return (
              <Card key={w.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{w.name}</p>
                      <p className="text-sm text-muted-foreground">PIN: {w.pin}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={w.role === 'cashier' ? 'default' : 'secondary'}>
                        {w.role === 'cashier' ? 'Cajero' : 'Bartender'}
                      </Badge>
                      {openShift && <Badge variant="outline" className="border-green-500 text-green-600">En turno</Badge>}
                      {!w.is_active && <Badge variant="destructive">Inactivo</Badge>}
                    </div>
                  </div>
                  <WorkerAssignments worker={w} />
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <p className="text-muted-foreground">Sin workers. Crea el primero.</p>
      )}
    </div>
  )
}
