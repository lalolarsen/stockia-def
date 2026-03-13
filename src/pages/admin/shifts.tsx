import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useVenueContext } from '@/hooks/use-venue-context'
import { getShifts, closeShift } from '@/services/shifts'
import { getWorkers } from '@/services/workers'
import { getStations } from '@/services/stations'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function Component() {
  const { venueId } = useVenueContext()
  const queryClient = useQueryClient()

  const { data: shifts, isLoading } = useQuery({
    queryKey: ['shifts', venueId],
    queryFn: () => getShifts(venueId!),
    enabled: !!venueId,
  })

  const { data: workers } = useQuery({
    queryKey: ['workers', venueId],
    queryFn: () => getWorkers(venueId!),
    enabled: !!venueId,
  })

  const { data: stations } = useQuery({
    queryKey: ['stations', venueId],
    queryFn: () => getStations(venueId!),
    enabled: !!venueId,
  })

  const closeMutation = useMutation({
    mutationFn: closeShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts', venueId] })
    },
  })

  if (!venueId) {
    return <p className="text-muted-foreground">Selecciona un venue en el Dashboard.</p>
  }

  const formatDate = (d: string) => new Date(d).toLocaleString('es-CL')

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Turnos</h2>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : shifts && shifts.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>Station</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Apertura</TableHead>
              <TableHead>Cierre</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.map((shift) => {
              const worker = workers?.find((w) => w.id === shift.worker_id)
              const station = stations?.find((s) => s.id === shift.station_id)
              return (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">{worker?.name ?? '—'}</TableCell>
                  <TableCell>{station?.name ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={shift.status === 'open' ? 'default' : 'secondary'}>
                      {shift.status === 'open' ? 'Abierto' : 'Cerrado'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(shift.opened_at)}</TableCell>
                  <TableCell className="text-sm">{shift.closed_at ? formatDate(shift.closed_at) : '—'}</TableCell>
                  <TableCell>
                    {shift.status === 'open' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => closeMutation.mutate(shift.id)}
                        disabled={closeMutation.isPending}
                      >
                        Cerrar turno
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      ) : (
        <p className="text-muted-foreground">Sin turnos registrados.</p>
      )}
    </div>
  )
}
