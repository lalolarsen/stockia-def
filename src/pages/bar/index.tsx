import { Navigate } from 'react-router-dom'
import { useBarSession } from '@/hooks/use-bar-session'

export function Component() {
  const workerId = useBarSession((s) => s.workerId)

  if (workerId) {
    return <Navigate to="/bar/queue" replace />
  }

  return <Navigate to="/bar/login" replace />
}
