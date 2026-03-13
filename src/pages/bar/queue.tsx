import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useBarSession } from '@/hooks/use-bar-session'
import { getPendingTokens } from '@/services/bar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function Component() {
  const navigate = useNavigate()
  const session = useBarSession()
  const [manualCode, setManualCode] = useState('')

  if (!session.workerId) {
    navigate('/bar/login')
    return null
  }

  const { data: tokens, isLoading } = useQuery({
    queryKey: ['pending-tokens', session.venueId],
    queryFn: () => getPendingTokens(session.venueId!),
    enabled: !!session.venueId,
    refetchInterval: 5000,
  })

  const goToRedeem = (code: string) => {
    navigate(`/bar/redeem/${code}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cola de pedidos</h2>
        <Badge variant="outline">{session.workerName}</Badge>
      </div>

      {/* Manual code entry */}
      <div className="flex gap-2">
        <Input
          placeholder="Ingresar código manualmente..."
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && manualCode) goToRedeem(manualCode)
          }}
          className="font-mono"
        />
        <Button disabled={!manualCode} onClick={() => goToRedeem(manualCode)}>
          Buscar
        </Button>
      </div>

      {/* Pending tokens */}
      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : tokens && tokens.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {tokens.map((t) => (
            <button
              key={t.id}
              onClick={() => goToRedeem(t.token_code)}
              className="rounded-lg border p-4 text-left hover:bg-accent transition-colors"
            >
              <p className="text-2xl font-mono font-bold tracking-wider">{t.token_code}</p>
              <p className="text-sm text-muted-foreground mt-1">
                ${Number(t.sales.total).toLocaleString()} — {t.sales.workers.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(t.created_at).toLocaleTimeString()}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Sin pedidos pendientes.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
