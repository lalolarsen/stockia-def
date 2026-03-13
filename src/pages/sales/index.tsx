import { Navigate } from 'react-router-dom'
import { useSalesSession } from '@/hooks/use-sales-session'

export function Component() {
  const workerId = useSalesSession((s) => s.workerId)

  if (workerId) {
    return <Navigate to="/sales/pos" replace />
  }

  return <Navigate to="/sales/login" replace />
}
