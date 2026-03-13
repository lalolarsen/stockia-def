import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useSalesSession } from '@/hooks/use-sales-session'
import { getVenueCatalogItems } from '@/services/catalog-items'
import { createSale } from '@/services/sales'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface CartItem {
  venue_catalog_item_id: string
  name: string
  unit_price: number
  quantity: number
}

export function Component() {
  const navigate = useNavigate()
  const session = useSalesSession()
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [tokenDialog, setTokenDialog] = useState<{ code: string; total: number } | null>(null)

  if (!session.workerId || !session.shiftId) {
    navigate('/sales/login')
    return null
  }

  const { data: venueItems } = useQuery({
    queryKey: ['venue-catalog-items', session.venueId],
    queryFn: () => getVenueCatalogItems(session.venueId!),
    enabled: !!session.venueId,
  })

  const availableItems = venueItems?.filter((vi) => vi.is_available) ?? []

  const cartTotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

  const addToCart = (vi: { id: string; price: number; catalog_items: { name: string } }) => {
    const existing = cart.find((c) => c.venue_catalog_item_id === vi.id)
    if (existing) {
      setCart(cart.map((c) =>
        c.venue_catalog_item_id === vi.id ? { ...c, quantity: c.quantity + 1 } : c
      ))
    } else {
      setCart([...cart, {
        venue_catalog_item_id: vi.id,
        name: vi.catalog_items.name,
        unit_price: Number(vi.price),
        quantity: 1,
      }])
    }
  }

  const removeFromCart = (vciId: string) => {
    setCart(cart.filter((c) => c.venue_catalog_item_id !== vciId))
  }

  const updateQty = (vciId: string, delta: number) => {
    setCart(cart.map((c) => {
      if (c.venue_catalog_item_id !== vciId) return c
      const newQty = c.quantity + delta
      return newQty > 0 ? { ...c, quantity: newQty } : c
    }))
  }

  const saleMut = useMutation({
    mutationFn: () =>
      createSale({
        organization_id: session.organizationId!,
        venue_id: session.venueId!,
        station_id: session.stationId!,
        shift_id: session.shiftId!,
        worker_id: session.workerId!,
        items: cart.map((c) => ({
          venue_catalog_item_id: c.venue_catalog_item_id,
          quantity: c.quantity,
          unit_price: c.unit_price,
        })),
        payment_method: paymentMethod,
        payment_amount: cartTotal,
      }),
    onSuccess: (result) => {
      setTokenDialog({ code: result.token_code, total: result.total })
      setCart([])
    },
  })

  return (
    <div className="grid grid-cols-3 gap-4 h-[calc(100vh-100px)]">
      {/* Left: Menu items */}
      <div className="col-span-2 overflow-y-auto">
        <div className="grid grid-cols-3 gap-2">
          {availableItems.map((vi) => (
            <button
              key={vi.id}
              onClick={() => addToCart(vi)}
              className="rounded-lg border p-3 text-left hover:bg-accent transition-colors"
            >
              <p className="font-medium text-sm">{vi.catalog_items.name}</p>
              <p className="text-sm text-muted-foreground">${Number(vi.price).toLocaleString()}</p>
            </button>
          ))}
          {availableItems.length === 0 && (
            <p className="col-span-3 text-muted-foreground text-center py-8">
              Sin productos disponibles. Agrega productos a la carta del venue.
            </p>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="flex flex-col border-l pl-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Orden</h3>
          <Badge variant="outline">{session.workerName}</Badge>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Toca un producto para agregar
            </p>
          ) : (
            cart.map((item) => (
              <div key={item.venue_catalog_item_id} className="flex items-center justify-between rounded border p-2">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ${item.unit_price.toLocaleString()} × {item.quantity} = ${(item.unit_price * item.quantity).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" onClick={() => updateQty(item.venue_catalog_item_id, -1)}>-</Button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <Button size="sm" variant="outline" onClick={() => updateQty(item.venue_catalog_item_id, 1)}>+</Button>
                  <Button size="sm" variant="ghost" onClick={() => removeFromCart(item.venue_catalog_item_id)}>×</Button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t pt-3 mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-lg">${cartTotal.toLocaleString()}</span>
            </div>

            <Select value={paymentMethod} onValueChange={(v) => { if (v) setPaymentMethod(v as string) }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="card">Tarjeta</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
              </SelectContent>
            </Select>

            <Button
              className="w-full"
              size="lg"
              disabled={saleMut.isPending}
              onClick={() => saleMut.mutate()}
            >
              {saleMut.isPending ? 'Procesando...' : 'Cobrar'}
            </Button>
          </div>
        )}
      </div>

      {/* Token dialog */}
      <Dialog open={!!tokenDialog} onOpenChange={() => setTokenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Venta completada</DialogTitle>
          </DialogHeader>
          {tokenDialog && (
            <div className="text-center space-y-4 py-4">
              <p className="text-sm text-muted-foreground">Total: ${tokenDialog.total.toLocaleString()}</p>
              <div className="border-2 border-dashed rounded-lg p-6">
                <p className="text-xs text-muted-foreground mb-2">Código de redención</p>
                <p className="text-4xl font-mono font-bold tracking-widest">{tokenDialog.code}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                El cliente presenta este código en la barra para recibir su pedido.
              </p>
              <Button className="w-full" onClick={() => setTokenDialog(null)}>
                Nueva venta
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
