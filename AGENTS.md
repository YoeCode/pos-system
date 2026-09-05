# AGENTS.md

Guía definitiva para cualquier agente de código que trabaje en Casa Lis POS.
Este archivo es la fuente de verdad para convenciones, patrones y reglas del proyecto.

---

## 1. Visión General del Proyecto

**Casa Lis POS** es un sistema Point-of-Sale multi-tenant para tiendas de retail.
Permite procesar ventas, gestionar inventario, empleados, clientes, reportes y configuraciones.

- **Stack:** React 19, TypeScript ~5.9, Vite 8, Redux Toolkit 2.11, Tailwind CSS 3.4, Supabase
- **Backend:** Supabase (auth, base de datos, realtime sync, storage)
- **Despliegue:** Vercel (SPA rewrite rule)
- **Multi-tenancy:** Cada operación filtra por `tenantId`. Selección de tenant después del login.

### Capacidades principales

- POS con carrito multi-ventana, atajos de teclado (F1-F4, Ctrl+Z), búsqueda difusa (Fuse.js)
- Checkout de 3 pasos: modal orchestrator → PaymentStep → ReceiptStep
- Generación de tickets PDF (jsPDF + html2canvas) y envío por email (EmailJS)
- Exportación de reportes a Excel (xlsx)
- OCR para notas de entrega (Tesseract.js)
- Sincronización realtime (Supabase Realtime)
- Sistema de roles: cashier → supervisor → manager → admin
- Configuración extensible: impuestos, tienda, POS, categorías, marcas, temporadas, tamaños, lealtad, ticket, devoluciones

---

## 2. Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el dev server de Vite |
| `npm run build` | Type-check (`tsc -b`) + build con Vite |
| `npm run lint` | ESLint (flat config, ESLint 9+) |
| `npm run test` | Vitest en watch mode |
| `npm run test:run` | Vitest single run |
| `npx vitest run src/path/to/file.test.tsx` | Ejecutar un solo archivo de test |

**Requisito:** Siempre ejecutar `npm run lint` y `npm run build` después de cambios para verificar correctitud.

---

## 3. Arquitectura

### Feature-Based Architecture (NO atomic design)

El proyecto organiza el código por dominio de negocio, no por tipo de archivo.

```
src/
├── app/                  # Store de Redux
├── components/           # Componentes compartidos
│   └── ui/               # Primitivas reutilizables (Button, Input, Badge, Modal, Toggle, Select)
├── constants/            # Constantes compartidas (tax.ts)
├── features/             # Cada dominio tiene su propio directorio
│   ├── auth/             # slice + service
│   ├── pos/              # slice + 15+ componentes + checkout/
│   ├── products/         # slice + service + componentes
│   ├── employees/        # slice + service + componentes
│   ├── sales/            # slice + service + componentes
│   ├── dashboard/        # slice (solo selectores, sin async)
│   ├── settings/         # slice (837 líneas) + sections/
│   ├── customers/        # slice + service + componentes
│   ├── refunds/          # slice + componentes
│   ├── tenants/          # service + componentes (sin slice)
│   ├── realtime/         # service + hooks (sin slice)
│   └── invitations/      # service (sin slice)
├── hooks/                # Custom hooks (usePermission)
├── i18n/                 # Internacionalización (context + provider + hook + translations)
├── layouts/              # AuthLayout, DashboardLayout
├── pages/                # Páginas thin-wrapper
├── router/               # createBrowserRouter + ProtectedRoute
├── supabase/             # Client init + types auto-generados
├── test/                 # Setup de Vitest
├── types/                # Tipos de dominio centralizados
└── utils/                # Utilidades (email, export, fuzzy search)
```

### Estructura de cada feature

```
features/<domain>/
├── <domain>Slice.ts      # createSlice + createAsyncThunk + selectores
├── <domain>Service.ts    # Queries a Supabase / capa de servicio
├── <Component>.tsx       # Componentes específicos del dominio
└── <domain>Slice.test.ts # Tests (cuando existen)
```

### Páginas como orquestadores

Las páginas en `src/pages/` son wrappers delgados que:
1. Componen componentes de features
2. Manejan estado local de modales (`useState` para `isOpen`)
3. Implementan shortcuts de teclado (cuando aplica)
4. No contienen lógica de negocio — delegan a Redux y services

### Store de Redux (9 slices)

```typescript
{
  auth,        // Login/logout, sesión, tenant selection
  pos,         // Carrito, ventanas, payment method, category filter
  products,    // CRUD productos, filtros, estados
  employees,   // CRUD empleados
  sales,       // Órdenes completadas, secuencia de números
  dashboard,   // KPIs, datos de gráficas (solo selectores)
  settings,    // Configuración completa (tax, store, POS, categories, etc.)
  customers,   // CRUD clientes, loyalty points
  refunds,     // Devoluciones
}
```

---

## 4. Convenciones de Código

### Naming

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Archivos de componentes | PascalCase | `ProductCard.tsx`, `CheckoutModal.tsx` |
| Archivos de slice/service | camelCase | `productsSlice.ts`, `productsService.ts` |
| Tests | Co-located con sufijo `.test.ts`/`.test.tsx` | `authSlice.test.ts` |
| Directorios | lowercase | `features/`, `components/`, `hooks/` |
| Páginas | PascalCase directorio + PascalCase archivo | `pages/POS/POSPage.tsx` |
| Interfaces de props | `{ComponentName}Props` | `ButtonProps`, `CartProps` |
| Selectores | Prefijo `select` | `selectFilteredProducts`, `selectLowStockAlerts` |
| Thunks async | Sufijo `Async` | `fetchProductsAsync`, `createProductAsync` |

### Imports

- **Siempre relativos** — no hay aliases de paths (`@/`, `~/`)
- **`import type`** para tipos (obligatorio por `verbatimModuleSyntax: true`)
- **Sin barrel exports** — cada import apunta a un archivo específico
- Profundidad típica: `../../features/domain/file`

```typescript
// Correcto
import type { Product } from '../../types';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { fetchProductsAsync } from './productsSlice';

// Incorrecto
import { Product } from '@/types';           // No hay aliases
import { Product } from '../../types/index'; // Evitar /index explícito
```

### Exports

- **Componentes:** Default export al final del archivo
- **Thunks, selectores, acciones:** Named exports
- **Tipos:** Named exports con `export type`

```typescript
// Patrón correcto de un slice
export const { addToCart, removeFromCart } = posSlice.actions;
export const selectAllProducts = (state: RootState) => state.products.items;
export default posSlice.reducer;
```

### TypeScript

- **Strict mode** habilitado (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`)
- **`erasableSyntaxOnly: true`** — no se permiten enums ni namespaces
- **Target:** ES2023
- **`any`** — tolerado por ESLint (`no-explicit-any: off`) pero minimizar su uso
- **Interfaces de props** se definen al inicio del archivo, antes del componente

```typescript
// Patrón de componente
interface ProductCardProps {
  product: Product;
  onSelect?: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  // ...
};

export default ProductCard;
```

---

## 5. Redux / State Management

### Reglas inquebrantables

1. **Siempre** usar `useAppDispatch` y `useAppSelector` de `src/app/store.ts`
2. **Nunca** usar `useDispatch` o `useSelector` de react-redux directamente
3. Cada servicio que accede a datos filtra por `tenantId` del state de auth
4. Los selectores se definen al fondo del slice, no inline en componentes

### Async Thunks

```typescript
// Patrón estándar
export const fetchProductsAsync = createAsyncThunk(
  'products/fetchProductsAsync',
  async (_, { getState }) => {
    const tenantId = (getState() as RootState).auth.user?.tenantId;
    if (!tenantId) return [];
    return fetchProducts(tenantId);  // Llamada al service
  }
);

// En el slice, extraReducers:
.addCase(fetchProductsAsync.fulfilled, (state, action) => {
  state.items = action.payload;
  state.isLoading = false;
})
```

### Selectores

```typescript
// Simple — al fondo del slice
export const selectAllProducts = (state: RootState): Product[] =>
  state.products.items;

// Memoizado — para datos derivados
export const selectLowStockAlerts = createSelector(
  [selectProductsItems],
  (items): StockAlertItem[] => items.filter(i => i.stock <= i.minStock)
);
```

### Persistencia localStorage

- `pos` slice: guarda ventanas y estado de caja en localStorage directamente en reducers
- `auth` slice: persiste sesión en `nexopos_session`
- No se usa Redux Persist — la persistencia es manual

### Slice settings

El slice de settings es el más grande (837 líneas). Contiene toda la configuración:
tax, store, POS, categories, brands, seasons, sizes, loyalty, ticket, refunds.
Siempre consultar `settingsSlice.ts` antes de crear nueva configuración.

---

## 6. Componentes React

### Estructura de un componente

```typescript
import React from 'react';
import type { Product } from '../../types';

// 1. Interface de props al inicio
interface ProductCardProps {
  product: Product;
  onSelect?: (id: string) => void;
}

// 2. Componente con React.FC<Props>
const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  // 3. Hooks al inicio
  const dispatch = useAppDispatch();
  const t = useI18n();

  // 4. Handlers
  const handleClick = () => onSelect?.(product.id);

  // 5. Render
  return (
    <div className="bg-white rounded-xl border border-border p-4" onClick={handleClick}>
      {/* ... */}
    </div>
  );
};

// 6. Default export al final
export default ProductCard;
```

### UI Primitives (`src/components/ui/`)

Componentes reutilizables que extienden atributos HTML nativos:

| Componente | Props variantes | Uso |
|-----------|----------------|-----|
| `Button` | `variant: primary/secondary/danger`, `size: sm/md/lg`, `fullWidth` | Acciones |
| `Input` | `label`, `error`, `icon` | Campos de formulario |
| `Badge` | `variant: success/warning/error/neutral/info` | Estados, etiquetas |
| `Modal` | `isOpen`, `onClose`, `title`, `subtitle` | Diálogos |
| `Toggle` | `checked`, `onChange`, `label` | Interruptores |
| `Select` | `options`, `value`, `onChange`, `label` | Selección única |

### Patrón de modales

```typescript
interface MyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MyModal: React.FC<MyModalProps> = ({ isOpen, onClose }) => {
  // Reset form al abrir
  useEffect(() => {
    if (isOpen) {
      setForm(defaultForm);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Título">
      {/* contenido */}
    </Modal>
  );
};
```

### Icons

Todos los iconos son **SVG inline en JSX**. No se usa ninguna librería de iconos.
Cada componente renderiza sus propios SVGs directamente.

### Kebab Menu para Acciones de Fila

Cuando una fila de tabla o lista tiene acciones (editar, eliminar, etc.), **siempre** usar un menú kebab (⋮) en vez de botones individuales. Esto aplica para:
- Listas de variantes de producto
- Tablas de empleados
- Cualquier lista con acciones por fila

**Reglas:**
1. El menú kebab se renderiza como un botón con SVG de 3 puntos verticales
2. Al hacer clic, se despliega un dropdown con las opciones
3. Cada opción es un botón con icono + texto
4. Cerrar el menú al hacer clic fuera (`useRef` + `mousedown`)
5. Si el usuario no tiene permiso para una acción, esa opción no se muestra (no se deshabilita, se omite)
6. Si no tiene permisos para ninguna acción, mostrar "—" en su lugar

```typescript
// Patrón correcto
<div className="relative" ref={menuRef}>
  <button onClick={() => setOpenMenuId(openMenuId === v.id ? null : v.id)}>
    {/* SVG kebab icon */}
  </button>
  {openMenuId === v.id && (
    <div className="absolute right-0 top-full mt-1 z-10 w-36 bg-white border border-border rounded-lg shadow-lg py-1">
      {canEdit && (
        <button onClick={() => openEditForm(v)}>
          {/* SVG edit icon + texto */}
        </button>
      )}
      {canDelete && (
        <button onClick={() => handleDelete(v.id)}>
          {/* SVG delete icon + texto */}
        </button>
      )}
    </div>
  )}
</div>

// ❌ NO hacer esto — botones individuales visibles
<div className="flex items-center gap-1">
  <button onClick={onEdit}>{/* edit */}</button>
  <button onClick={onDelete}>{/* delete */}</button>
</div>
```

### React.memo

Actualmente **no se usa** en ningún componente, a pesar del potencial de re-render
en el grid del POS. Considerar usarlo para `ProductCard` y `CartItem` en optimizaciones futuras.

---

## 7. Estilos y Design System

### Tailwind CSS exclusivo

- **No** CSS modules
- **No** styled-components
- **No** objetos de estilos inline (excepto animaciones puntuales)

### Tokens de color (tailwind.config.js)

| Token | Valor | Uso |
|-------|-------|-----|
| `primary` | #00C853 | Botones primarios, éxito, navegación activa |
| `primary-dark` | #00A846 | Hover de botones primarios |
| `secondary` | #0091EA | Acciones secundarias, info |
| `text-primary` | #0A0B0D | Texto principal |
| `text-muted` | #7A8194 | Texto secundario, placeholders |
| `border` | #E2E5EE | Bordes, separadores |
| `error` | #FF5370 | Errores, acciones destructivas |
| `warning` | #FFA726 | Advertencias |
| `background` | #F5F6FA | Canvas principal |
| `surface` | #FFFFFF | Cards, modales, superficies elevadas |

### Reglas de color

- **La Regla de Una Voz:** El verde primario se usa en ≤15% de cualquier pantalla
- **La Regla del Canvas Porcelain:** Fondos en #F5F6FA o más oscuro. Blanco reservado para superficies interactivas
- **Alert Rose** (#FF5370) solo para errores y confirmaciones destructivas

### Tipografía

- **Sora** (sans-serif): fuente principal para todo el UI
- **DM Mono** (monospace): datos numéricos (precios, cantidades, números de orden)
- Pesos: 400 (body) y 600 (énfasis) para 90% del UI
- Labels: siempre uppercase, 0.75rem, tracking-wider

### Clases comunes reutilizadas

| Propósito | Clases |
|-----------|--------|
| Card container | `bg-white rounded-xl border border-border p-4` |
| Botón primario | `bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all duration-150 active:scale-[0.98]` |
| Botón secundario | `bg-transparent border border-border text-text-primary hover:bg-gray-50 rounded-lg` |
| Input field | `px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors` |
| Label de sección | `text-xs font-semibold text-text-muted uppercase tracking-wider` |
| Punto de estado | `w-2 h-2 rounded-full bg-primary` (activo) / `bg-error` (inactivo) |

### Spacing y layout

- Grid base: 8px
- Escala: 4px (xs), 8px (sm), 16px (md), 24px (lg), 32px (xl)
- Padding de cards: 24px estándar, 16px compacto
- Spacing entre campos: 16px
- Touch targets: mínimo 44px de altura en POS

### Responsive

- Desktop-first (cajas registradoras, tablets)
- Breakpoints: `md:` (tablets), `lg:` (desktop), `xl:` (pantallas grandes)
- POS: grid de 2-5 columnas según viewport
- Sidebar colapsa en móvil → bottom sheet

### Elevation

- **Ambient Modal:** `box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25)` — solo modales
- **Surface Lift:** `box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)` — cards en dashboard
- **Backdrop:** `rgba(0,0,0,0.5)` + `backdrop-filter: blur(4px)` — solo detrás de modales
- **No glassmorphism** — blur fuera de overlays de modal está prohibido

### Formas

| Elemento | Radius | Tailwind |
|----------|--------|----------|
| Botones, inputs | 8px | `rounded-lg` |
| Cards, modales | 12px | `rounded-xl` |
| Badges, chips | 9999px | `rounded-full` |
| Elementos pequeños | 4px | `rounded-sm` |

---

## 8. Formularios

No se usa librería de formularios. Todos los formularios se construyen con:

- `useState` para cada campo
- `onChange` handlers inline
- Validación imperativa al submit
- Reset en `useEffect` al abrir el modal

```typescript
// Patrón estándar
const defaultForm = { name: '', email: '', role: 'cashier' as Employee['role'] };
const [form, setForm] = useState(defaultForm);
const [error, setError] = useState('');

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!form.name.trim()) { setError('Nombre requerido'); return; }
  // dispatch action
};

useEffect(() => {
  if (isOpen) {
    setForm(editingEmployee ? { ...editingEmployee } : { ...defaultForm });
    setError('');
  }
}, [isOpen, editingEmployee]);
```

### Validación

- Imperativa: checks manuales con `if` antes del dispatch
- Sin schemas (no Zod, no Yup)
- Errores en estado local: `useState<string | null>(null)` — no en Redux
- Feedback: toasts (`useToast`) o texto inline en el modal

---

## 9. Enrutamiento y Auth

### Rutas

- Creadas con `createBrowserRouter` de react-router-dom v7
- Todas las páginas se cargan con `React.lazy()` + `<Suspense>`
- Rutas planas (sin nested routing)

```typescript
// src/router/index.tsx
const POSPage = lazy(() => import('../pages/POS/POSPage'));
const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage'));
```

### ProtectedRoute

```typescript
// src/router/ProtectedRoute.tsx
// 1. Verifica isAuthenticated + user
// 2. Verifica permisos por ruta usando PAGE_PERMISSIONS
// 3. Cashiers → fallback a /pos, otros → /dashboard
```

### Sistema de permisos

- **Roles:** cashier, supervisor, manager, admin
- **Permisos:** 22 strings como `'pos:sale'`, `'product:create'`, `'dashboard:view'`
- **ROLE_PERMISSIONS:** Mapa rol → array de permisos (en `src/types/index.ts`)
- **PAGE_PERMISSIONS:** Mapa ruta → permiso requerido
- **DashboardLayout** filtra items de navegación por permisos del usuario

---

## 10. Internacionalización (i18n)

- **Context:** `src/i18n/I18nContext.ts`
- **Provider:** `src/i18n/I18nProvider.tsx`
- **Hook:** `useI18n()` retorna objeto de traducciones `t`
- **Traducciones:** `src/i18n/translations/en.ts` y `es.ts`
- **Uso:** `<span>{t.pos.addToCart}</span>` o `{t.pos.outOfStock}: {product.name}`
- **Fallback:** Algunos strings aún tienen fallback manual con `|| 'Texto en español'`

```typescript
// Patrón
const t = useI18n();
return <button>{t.pos.checkout}</button>;
```

---

## 11. Testing

### Stack

- **Runner:** Vitest 4.1 (jsdom environment)
- **Library:** @testing-library/react + @testing-library/user-event + jest-dom
- **Setup:** `src/test/setup.ts`
- **Globals:** `describe`, `it`, `expect` disponibles sin import (pero los tests los importan explícitamente — inconsistencia menor)

### Estrategia

1. **Reducer tests** (más comunes): Llamar reducer directamente con action creators, asertar cambios de estado
2. **Component integration tests**: Wrapping en `<Provider store={store}>` + `<I18nProvider>`, render + userEvent
3. **Factory functions** para datos mock: `mockEmployee()`, `createMockStorage()`
4. **Nunca snapshots** — solo behavioral assertions

### Patrón de test de componente

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

function createTestStore() {
  return configureStore({
    reducer: { products: productsReducer, settings: settingsReducer },
    preloadedState: { /* ... */ },
  });
}

function renderComponent(store = createTestStore()) {
  return render(
    <Provider store={store}>
      <I18nProvider>
        <MyComponent />
      </I18nProvider>
    </Provider>
  );
}

it('should do something', async () => {
  renderComponent();
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

### Mocking servicios

```typescript
vi.mock('./productsService', () => ({
  fetchProducts: vi.fn().mockResolvedValue([]),
  createProduct: vi.fn((product: any) => Promise.resolve(product)),
}));
```

### Cobertura actual

Solo 5 archivos de test para 12 features. Cobertura baja en:
settings, sales, dashboard, refunds, realtime, layouts, hooks, UI components, router.

---

## 12. Git y Commits

### Conventional Commits

```
feat: agregar selector de cliente en POS
fix: corregir cálculo de impuestos en checkout
chore: actualizar dependencias de Supabase
docs: actualizar CLAUDE.md con slices faltantes
refactor: extraer lógica de descuento a hook
test: agregar tests para customersSlice
style: ajustar spacing en DashboardPage
```

### Reglas

- **Sin atribución AI** en commits
- **Sin `--no-verify`** para bypass de hooks
- **Branches:** `tipo/descripción-corta` (e.g., `feat/loyalty-points`, `fix/tax-calculation`)
- **PRs:** Issue-first — toda PR debe referenciar un issue
- **Merge strategy:** Squash-merge preferido

---

## 13. Seguridad

- **`.env`** está en `.gitignore` — nunca commitear secrets
- **Supabase client-side:** Las credenciales de anon key son públicas por diseño, pero RLS policies protegen los datos
- **Multi-tenancy:** Cada service call filtra por `tenantId` — nunca saltarse esto
- **Roles:** ProtectedRoute verifica permisos antes de renderizar. No confiar solo en el UI
- **PINs de empleado:** Se almacenan hasheados (implementación actual) — nunca loguear PINs en texto plano

---

## 14. Anti-patrones

### ❌ NO hacer esto

| Anti-pattern | Por qué | Alternativa correcta |
|-------------|---------|---------------------|
| `useDispatch()` / `useSelector()` de react-redux | No tiene tipos de RootState | `useAppDispatch`, `useAppSelector` de `src/app/store.ts` |
| CSS modules o styled-components | Convención del proyecto: Tailwind exclusivo | Usar clases de Tailwind con tokens custom |
| Class components | Proyecto 100% funcional | `React.FC<Props>` con hooks |
| Barrel exports (`index.ts`) | Profundiza imports innecesariamente | Import directo al archivo |
| `alert()` para feedback | Rompe consistencia con toast system | `addToast()` de `useToast()` |
| `window.confirm()` para confirmaciones | Inconsistente con diseño | Modal de confirmación custom inline |
| Enums o namespaces | `erasableSyntaxOnly: true` lo prohíbe | Union types o `as const` objects |
| `import type` omitido | `verbatimModuleSyntax: true` lo requiere | Siempre: `import type { X } from '...'` |
| `any` innecesario | Debilita type safety | Tipar correctamente, `unknown` si es necesario |
| Lógica de negocio en páginas | Las páginas son orquestadores delgados | Lógica en Redux slices, hooks, o utils |
| Strings hardcoded sin i18n | Proyecto tiene sistema de traducciones | `t.domain.key` con fallback |
| Componentes > 300 líneas sin split | Dificulta testing y mantenimiento | Extraer sub-componentes |
| Imports circulares | Causa bugs difíciles de diagnosticar | Dependencias unidireccionales |
| Crear feature sin slice/service | Rompe la estructura feature-based | Seguir patrón `<domain>Slice.ts` + `<domain>Service.ts` |

---

## 15. Estructura de Archivos (Referencia)

```
pos-system/
├── public/
├── src/
│   ├── app/
│   │   └── store.ts                    # Store + typed hooks
│   ├── assets/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Select.tsx
│   │   │   └── Toggle.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── StockAlertBanner.tsx
│   │   ├── ToastContext.ts
│   │   ├── ToastProvider.tsx
│   │   └── useToast.ts
│   ├── constants/
│   │   └── tax.ts                      # TAX_RATE = 0.21
│   ├── features/
│   │   ├── auth/                       # authSlice + authService
│   │   ├── customers/                  # customersSlice + 3 components
│   │   ├── dashboard/                  # dashboardSlice (selectores)
│   │   ├── employees/                  # employeesSlice + 3 components
│   │   ├── invitations/                # invitationsService
│   │   ├── pos/                        # posSlice (493 líneas) + 15+ components
│   │   │   └── checkout/               # CheckoutModal + PaymentStep + ReceiptStep
│   │   ├── products/                   # productsSlice + 4 components
│   │   ├── realtime/                   # realtimeService + 2 hooks
│   │   ├── refunds/                    # refundsSlice + RefundModal
│   │   ├── sales/                      # salesSlice + SaleDetailView
│   │   ├── settings/                   # settingsSlice (837 líneas) + 7 sections
│   │   │   └── sections/               # TaxSettings, StoreSettings, etc.
│   │   └── tenants/                    # tenantsService + BillingSection
│   ├── hooks/
│   │   └── usePermission.ts
│   ├── i18n/
│   │   ├── I18nContext.ts
│   │   ├── I18nProvider.tsx
│   │   ├── useI18n.ts
│   │   └── translations/
│   │       ├── en.ts
│   │       └── es.ts
│   ├── layouts/
│   │   ├── AuthLayout.tsx
│   │   └── DashboardLayout.tsx         # Sidebar + header
│   ├── pages/
│   │   ├── AcceptInvite/
│   │   ├── Customers/
│   │   ├── Dashboard/                  # DashboardPage + 5 sub-components
│   │   ├── Employees/
│   │   ├── Inventory/
│   │   ├── Landing/
│   │   ├── Login/
│   │   ├── POS/
│   │   ├── Products/
│   │   ├── Register/
│   │   ├── Reports/
│   │   ├── Settings/
│   │   ├── TenantSelect/
│   │   └── TenantSettings/
│   ├── router/
│   │   ├── index.tsx
│   │   └── ProtectedRoute.tsx
│   ├── supabase/
│   │   ├── client.ts
│   │   └── types.ts                    # Auto-generado, 1076 líneas
│   ├── test/
│   │   └── setup.ts
│   ├── types/
│   │   └── index.ts                    # Todos los tipos de dominio (389 líneas)
│   ├── utils/
│   │   ├── emailService.ts
│   │   ├── exportUtils.ts
│   │   ├── fuzzySearch.ts              # Fuse.js wrapper
│   │   └── invitationEmail.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── supabase/                           # SQL, migrations, seed data
├── CLAUDE.md
├── DESIGN.md                           # Design system completo
├── PRODUCT.md                          # Requisitos del producto (español)
├── AGENTS.md                           # Este archivo
├── eslint.config.js
├── tailwind.config.js
├── tsconfig.json
├── vitest.config.ts
└── vercel.json
```
