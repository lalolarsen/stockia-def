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
