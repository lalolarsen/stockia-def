import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useBarSession } from '@/hooks/use-bar-session'
import { Button } from '@/components/ui/button'
import { closeShift } from '@/services/shifts'

const navItems = [
  { to: '/bar/queue', label: 'Cola' },
]

export function BarLayout() {
  const session = useBarSession()
  const clearSession = useBarSession((s) => s.clearSession)
  const navigate = useNavigate()

  const handleEndShift = async () => {
    if (session.shiftId) {
      try {
        await closeShift(session.shiftId)
      } catch {
        // shift may already be closed
      }
    }
    clearSession()
    navigate('/bar/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Stockia — Barra</h1>
          <div className="flex items-center gap-4">
            {session.workerId && (
              <>
                <nav className="flex gap-4">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'text-sm font-medium transition-colors hover:text-foreground',
                          isActive ? 'text-foreground' : 'text-muted-foreground'
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
                <span className="text-sm text-muted-foreground">
                  {session.workerName} — {session.stationName}
                </span>
                <Button size="sm" variant="outline" onClick={handleEndShift}>
                  Cerrar turno
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
