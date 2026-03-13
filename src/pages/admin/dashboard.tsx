import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/providers/auth-provider'
import { getOrganizations, createOrganization } from '@/services/organizations'
import { getVenues, createVenue } from '@/services/venues'
import { useVenueContext } from '@/hooks/use-venue-context'
import { createOrganizationSchema, createVenueSchema, type CreateOrganizationForm, type CreateVenueForm } from '@/schemas/core'
import { signOut } from '@/services/auth'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

export function Component() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { organizationId, venueId, setOrganizationId, setVenueId } = useVenueContext()
  const [orgDialogOpen, setOrgDialogOpen] = useState(false)
  const [venueDialogOpen, setVenueDialogOpen] = useState(false)

  const { data: orgs, isLoading: orgsLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: getOrganizations,
  })

  const { data: venues } = useQuery({
    queryKey: ['venues', organizationId],
    queryFn: () => getVenues(organizationId!),
    enabled: !!organizationId,
  })

  // Auto-select first org
  if (orgs && orgs.length > 0 && !organizationId) {
    setOrganizationId(orgs[0].id)
  }

  // Auto-select first venue
  if (venues && venues.length > 0 && !venueId) {
    setVenueId(venues[0].id)
  }

  const orgForm = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
  })

  const venueForm = useForm<CreateVenueForm>({
    resolver: zodResolver(createVenueSchema),
  })

  const createOrgMutation = useMutation({
    mutationFn: (data: CreateOrganizationForm) => createOrganization(data.name, data.slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      setOrgDialogOpen(false)
      orgForm.reset()
    },
  })

  const createVenueMutation = useMutation({
    mutationFn: (data: CreateVenueForm) =>
      createVenue({
        organization_id: organizationId!,
        name: data.name,
        slug: data.slug,
        address: data.address,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues', organizationId] })
      setVenueDialogOpen(false)
      venueForm.reset()
    },
  })

  const selectedOrg = orgs?.find((o) => o.id === organizationId)
  const selectedVenue = venues?.find((v) => v.id === venueId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="outline" onClick={() => { signOut(); navigate('/login') }}>
          Cerrar sesión
        </Button>
      </div>

      {/* Org + Venue selector */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Organizations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Organización</CardTitle>
            <Dialog open={orgDialogOpen} onOpenChange={setOrgDialogOpen}>
              <DialogTrigger render={<Button size="sm" />}>
                + Nueva
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear organización</DialogTitle>
                </DialogHeader>
                <form onSubmit={orgForm.handleSubmit((d) => createOrgMutation.mutate(d))} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input {...orgForm.register('name')} placeholder="Berlin SpA" />
                    {orgForm.formState.errors.name && (
                      <p className="text-sm text-destructive">{orgForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input {...orgForm.register('slug')} placeholder="berlin-spa" />
                    {orgForm.formState.errors.slug && (
                      <p className="text-sm text-destructive">{orgForm.formState.errors.slug.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={createOrgMutation.isPending}>
                    {createOrgMutation.isPending ? 'Creando...' : 'Crear'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {orgsLoading ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : orgs && orgs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {orgs.map((org) => (
                  <Badge
                    key={org.id}
                    variant={org.id === organizationId ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setOrganizationId(org.id)}
                  >
                    {org.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Crea tu primera organización</p>
            )}
          </CardContent>
        </Card>

        {/* Venues */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Venue</CardTitle>
            <Dialog open={venueDialogOpen} onOpenChange={setVenueDialogOpen}>
              <DialogTrigger render={<Button size="sm" disabled={!organizationId} />}>
                + Nuevo
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear venue</DialogTitle>
                </DialogHeader>
                <form onSubmit={venueForm.handleSubmit((d) => createVenueMutation.mutate(d))} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input {...venueForm.register('name')} placeholder="Berlin Valdivia" />
                    {venueForm.formState.errors.name && (
                      <p className="text-sm text-destructive">{venueForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input {...venueForm.register('slug')} placeholder="berlin-valdivia" />
                    {venueForm.formState.errors.slug && (
                      <p className="text-sm text-destructive">{venueForm.formState.errors.slug.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Dirección (opcional)</Label>
                    <Input {...venueForm.register('address')} placeholder="Av. Principal 123" />
                  </div>
                  <Button type="submit" className="w-full" disabled={createVenueMutation.isPending}>
                    {createVenueMutation.isPending ? 'Creando...' : 'Crear'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {!organizationId ? (
              <p className="text-sm text-muted-foreground">Selecciona una organización</p>
            ) : venues && venues.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {venues.map((venue) => (
                  <Badge
                    key={venue.id}
                    variant={venue.id === venueId ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setVenueId(venue.id)}
                  >
                    {venue.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Crea tu primer venue</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick info */}
      {selectedOrg && selectedVenue && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Operando en <span className="font-medium text-foreground">{selectedOrg.name}</span> →{' '}
              <span className="font-medium text-foreground">{selectedVenue.name}</span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
