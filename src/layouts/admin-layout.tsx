import { Outlet, NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/locations', label: 'Locations' },
  { to: '/admin/workers', label: 'Workers' },
  { to: '/admin/shifts', label: 'Turnos' },
  { to: '/admin/stock-items', label: 'Stock' },
  { to: '/admin/catalog', label: 'Catálogo' },
  { to: '/admin/recipes', label: 'Recetas' },
  { to: '/admin/menus', label: 'Menús' },
  { to: '/admin/inventory', label: 'Inventario' },
]

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Stockia — Admin</h1>
          <nav className="flex gap-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
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
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
