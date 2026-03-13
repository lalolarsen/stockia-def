import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { useBarSession } from '@/hooks/use-bar-session'
import { getTokenDetails, redeemToken } from '@/services/bar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function Component() {
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()
  const session = useBarSession()

  if (!session.workerId) {
    navigate('/bar/login')
    return null
  }

  const { data: token, isLoading, error } = useQuery({
    queryKey: ['token-details', code, session.venueId],
    queryFn: () => getTokenDetails(code!, session.venueId!),
    enabled: !!code && !!session.venueId,
  })

  const redeemMut = useMutation({
    mutationFn: () =>
      redeemToken({
        token_code: code!,
        venue_id: session.venueId!,
        location_id: session.locationId!,
        worker_id: session.workerId!,
        shift_id: session.shiftId!,
      }),
    onSuccess: () => {
      navigate('/bar/queue')
    },
  })

  if (isLoading) {
    return <p className="text-muted-foreground">Buscando token...</p>
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{(error as Error).message}</p>
        <Button variant="outline" onClick={() => navigate('/bar/queue')}>Volver</Button>
      </div>
    )
  }

  if (!token) return null

  if (token.status !== 'pending') {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-mono font-bold mb-2">{token.token_code}</p>
            <Badge variant="secondary">
              {token.status === 'redeemed' ? 'Ya redimido' : 'Cancelado'}
            </Badge>
          </CardContent>
        </Card>
        <Button variant="outline" onClick={() => navigate('/bar/queue')}>Volver</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Preparar pedido</h2>
          <p className="text-3xl font-mono font-bold tracking-widest mt-1">{token.token_code}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/bar/queue')}>Volver</Button>
      </div>

      <div className="space-y-3">
        {token.items?.map((item) => (
          <Card key={item.sale_item_id}>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {item.quantity}× {item.product_name}
                </CardTitle>
                {item.recipe_name && (
                  <Badge variant="outline">{item.recipe_name}</Badge>
                )}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={redeemMut.isPending}
        onClick={() => redeemMut.mutate()}
      >
        {redeemMut.isPending ? 'Preparando...' : 'Confirmar preparación'}
      </Button>

      {redeemMut.isError && (
        <p className="text-sm text-destructive">{(redeemMut.error as Error).message}</p>
      )}
    </div>
  )
}
