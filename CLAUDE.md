# CLAUDE.md — Contexto del proyecto STOCKIA-DI

Antes de construir cualquier cosa, lee la documentación en `/docs`.

## 📚 Documentación disponible

- **Rutas:** `docs/rutas/router.md`
- **Tablas Supabase:** `docs/supabase/tablas/`
- **Servicios:** `docs/servicios/`
- **Componentes y páginas:** `docs/componentes/`
- **Índice general:** `docs/index.md`

## 🏗️ Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Supabase (auth, base de datos, storage)
- **Estilos:** Tailwind CSS
- **Estado del servidor:** TanStack Query
- **Validación:** Zod (schemas en `src/schemas/`)

## 📁 Estructura del proyecto

```
src/
├── app/router.tsx        # Rutas principales
├── components/ui/        # Componentes reutilizables (shadcn)
├── hooks/                # Hooks personalizados
├── layouts/              # Layouts por rol (admin, bar, sales, gerencia)
├── lib/                  # Supabase client, utils
├── pages/                # Páginas por módulo
├── providers/            # Auth y Query providers
├── schemas/              # Validaciones Zod
├── services/             # Llamadas a Supabase
└── types/database.ts     # Tipos generados de Supabase
```

## 📐 Convenciones

- Los servicios van en `src/services/` y solo contienen llamadas a Supabase
- Los hooks van en `src/hooks/` y usan TanStack Query (`useQuery`, `useMutation`)
- Las páginas consumen hooks, no llaman a Supabase directamente
- Los schemas de validación van en `src/schemas/`
- Usar los componentes UI existentes en `src/components/ui/` antes de crear nuevos

## ⚠️ Antes de construir

1. Lee la documentación del módulo relevante en `docs/`
2. Revisa si ya existe un servicio para la tabla que necesitas
3. Sigue el patrón: `service → hook → página`
4. Si agregas nuevas tablas o componentes, ejecuta `node generate-docs.mjs` para actualizar la documentación
