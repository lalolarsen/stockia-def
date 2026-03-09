import { Outlet } from 'react-router-dom'

export function BarLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <h1 className="text-xl font-bold">Stockia — Barra</h1>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
