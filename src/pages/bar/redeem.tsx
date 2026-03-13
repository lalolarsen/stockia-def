import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { useBarSession } from '@/hooks/use-bar-session'
import { getTokenDetails, redeemToken } from '@/services/bar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export function Component() {
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()
  const session = useBarSession()
  // Map: sale_item_id -> { option_group_id -> option_item_id }
  const [selections, setSelections] = useState<Record<string, Record<string, string>>>({})

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
    mutationFn: () => {
      const options = Object.entries(selections).map(([saleItemId, groups]) => ({
        sale_item_id: saleItemId,
        option_selections: Object.entries(groups).map(([groupId, optionId]) => ({
          option_group_id: groupId,
          option_item_id: optionId,
        })),
      }))

      return redeemToken({
        token_code: code!,
        venue_id: session.venueId!,
        location_id: session.locationId!,
        worker_id: session.workerId!,
        shift_id: session.shiftId!,
        options,
      })
    },
    onSuccess: () => {
      navigate('/bar/queue')
    },
  })

  const setOptionSelection = (saleItemId: string, groupId: string, optionId: string) => {
    setSelections((prev) => ({
      ...prev,
      [saleItemId]: {
        ...(prev[saleItemId] ?? {}),
        [groupId]: optionId,
      },
    }))
  }

  // Check if all required options are selected
  const allRequiredSelected = () => {
    if (!token?.items) return true
    for (const item of token.items) {
      if (!item.option_groups) continue
      for (const group of item.option_groups) {
        if (group.is_required && !selections[item.sale_item_id]?.[group.group_id]) {
          return false
        }
      }
    }
    return true
  }

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

      {/* Items to prepare */}
      <div className="space-y-4">
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
            {item.option_groups && item.option_groups.length > 0 && (
              <CardContent className="px-4 pb-4 space-y-3">
                {item.option_groups.map((group) => (
                  <div key={group.group_id} className="space-y-1">
                    <Label className="text-sm">
                      {group.group_name}
                      {group.is_required && <span className="text-destructive"> *</span>}
                    </Label>
                    <Select
                      value={selections[item.sale_item_id]?.[group.group_id] ?? ''}
                      onValueChange={(v) => {
                        if (v) setOptionSelection(item.sale_item_id, group.group_id, v as string)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {group.options?.map((opt) => (
                          <SelectItem key={opt.option_id} value={opt.option_id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={!allRequiredSelected() || redeemMut.isPending}
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
