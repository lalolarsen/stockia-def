import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/layouts/admin-layout'
import { SalesLayout } from '@/layouts/sales-layout'
import { BarLayout } from '@/layouts/bar-layout'
import { GerenciaLayout } from '@/layouts/gerencia-layout'
import { ProtectedRoute } from '@/components/protected-route'

export const router = createBrowserRouter([
  // Auth routes (public)
  {
    path: '/login',
    lazy: () => import('@/pages/auth/login'),
  },
  {
    path: '/register',
    lazy: () => import('@/pages/auth/register'),
  },

  // Admin portal (protected)
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        lazy: () => import('@/pages/admin/dashboard'),
      },
      {
        path: 'locations',
        lazy: () => import('@/pages/admin/locations'),
      },
      {
        path: 'workers',
        lazy: () => import('@/pages/admin/workers'),
      },
      {
        path: 'shifts',
        lazy: () => import('@/pages/admin/shifts'),
      },
      {
        path: 'stock-items',
        lazy: () => import('@/pages/admin/stock-items'),
      },
      {
        path: 'catalog',
        lazy: () => import('@/pages/admin/catalog-items'),
      },
      {
        path: 'recipes',
        lazy: () => import('@/pages/admin/recipes'),
      },
      {
        path: 'menus',
        lazy: () => import('@/pages/admin/menus'),
      },
      {
        path: 'inventory',
        lazy: () => import('@/pages/admin/inventory'),
      },
    ],
  },

  // Sales portal (protected)
  {
    path: '/sales',
    element: (
      <ProtectedRoute>
        <SalesLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        lazy: () => import('@/pages/sales/index'),
      },
      {
        path: 'login',
        lazy: () => import('@/pages/sales/login'),
      },
      {
        path: 'pos',
        lazy: () => import('@/pages/sales/pos'),
      },
      {
        path: 'tickets',
        lazy: () => import('@/pages/sales/tickets'),
      },
    ],
  },

  // Bar portal (protected)
  {
    path: '/bar',
    element: (
      <ProtectedRoute>
        <BarLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        lazy: () => import('@/pages/bar/index'),
      },
      {
        path: 'login',
        lazy: () => import('@/pages/bar/login'),
      },
      {
        path: 'queue',
        lazy: () => import('@/pages/bar/queue'),
      },
      {
        path: 'redeem/:code',
        lazy: () => import('@/pages/bar/redeem'),
      },
    ],
  },

  // Gerencia portal (protected)
  {
    path: '/gerencia',
    element: (
      <ProtectedRoute>
        <GerenciaLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        lazy: () => import('@/pages/gerencia/dashboard'),
      },
    ],
  },

  // Root redirect
  {
    path: '/',
    element: <Navigate to="/admin" replace />,
  },
])
