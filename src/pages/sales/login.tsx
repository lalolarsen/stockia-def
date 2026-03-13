import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useSalesSession } from '@/hooks/use-sales-session'
import { getAllStations } from '@/services/stations'
import { workerPinLogin, openShift, getOpenShift } from '@/services/shifts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function Component() {
  const navigate = useNavigate()
  const setSession = useSalesSession((s) => s.setSession)
  const [stationId, setStationId] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const { data: stations, isLoading } = useQuery({
    queryKey: ['all-stations'],
    queryFn: getAllStations,
  })

  const loginMut = useMutation({
    mutationFn: async () => {
      setError('')
      // 1. PIN login — returns worker info + venue_id + organization_id
      const result = await workerPinLogin(stationId, pin)

      // 2. Check for open shift or open one
      let shiftId: string
      const existing = await getOpenShift(result.worker_id)
      if (existing) {
        shiftId = existing.id
      } else {
        shiftId = await openShift(result.worker_id, stationId)
      }

      return { ...result, shiftId }
    },
    onSuccess: (data) => {
      setSession({
        workerId: data.worker_id,
        workerName: data.worker_name,
        workerRole: data.worker_role,
        venueId: data.venue_id,
        organizationId: data.organization_id,
        stationId: data.station_id,
        stationName: data.station_name,
        shiftId: data.shiftId,
      })
      navigate('/sales/pos')
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">Inicio de turno</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Station</Label>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando stations...</p>
            ) : (
              <Select value={stationId} onValueChange={(v) => { if (v) setStationId(v as string) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona station" />
                </SelectTrigger>
                <SelectContent>
                  {stations?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.venues.name} — {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label>PIN</Label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="****"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && stationId && pin) loginMut.mutate()
              }}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            className="w-full"
            disabled={!stationId || !pin || loginMut.isPending}
            onClick={() => loginMut.mutate()}
          >
            {loginMut.isPending ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
