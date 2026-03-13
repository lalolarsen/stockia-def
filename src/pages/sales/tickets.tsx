import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useSalesSession } from '@/hooks/use-sales-session'
import { getSales } from '@/services/sales'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const STATUS_LABELS: Record<string, string> = {
  open: 'Abierta',
  paid: 'Pagada',
  cancelled: 'Cancelada',
}

export function Component() {
  const navigate = useNavigate()
  const session = useSalesSession()

  if (!session.workerId || !session.shiftId) {
    navigate('/sales/login')
    return null
  }

  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales', session.venueId, session.shiftId],
    queryFn: () => getSales(session.venueId!, session.shiftId!),
    refetchInterval: 10000,
  })

  const totalShift = sales?.reduce((sum, s) => sum + Number(s.total), 0) ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Ventas del turno</h2>
        <div className="flex gap-2 items-center">
          <Badge variant="outline">{session.workerName}</Badge>
          <Badge>Total: ${totalShift.toLocaleString()}</Badge>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : sales && sales.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hora</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="text-sm">
                  {new Date(sale.created_at).toLocaleTimeString()}
                </TableCell>
                <TableCell className="text-sm">
                  {sale.sale_items.map((si) => (
                    <span key={si.id} className="block">
                      {si.quantity}× {si.venue_catalog_items.catalog_items.name}
                    </span>
                  ))}
                </TableCell>
                <TableCell className="font-medium">${Number(sale.total).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={sale.status === 'paid' ? 'default' : 'secondary'}>
                    {STATUS_LABELS[sale.status] ?? sale.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Sin ventas en este turno.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
