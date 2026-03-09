import { Outlet } from 'react-router-dom'

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <h1 className="text-xl font-bold">Stockia — Admin</h1>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
