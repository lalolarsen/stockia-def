import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/providers/auth-provider'
import { getOrganizations } from '@/services/organizations'
import { Button } from '@/components/ui/button'
import { signOut } from '@/services/auth'
import { useNavigate } from 'react-router-dom'

export function Component() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: orgs, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: getOrganizations,
  })

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Organizaciones</h3>
        {isLoading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : orgs && orgs.length > 0 ? (
          <ul className="space-y-2">
            {orgs.map((org) => (
              <li
                key={org.id}
                className="rounded-lg border p-4"
              >
                <p className="font-medium">{org.name}</p>
                <p className="text-sm text-muted-foreground">{org.slug}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            No tienes organizaciones. El onboarding se construirá en esta fase.
          </p>
        )}
      </div>
    </div>
  )
}
