import { Outlet } from 'react-router-dom'

export function SalesLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <h1 className="text-xl font-bold">Stockia — Ventas</h1>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
