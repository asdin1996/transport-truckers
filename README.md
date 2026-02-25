# Transporte Cubicaje

Aplicación web para la gestión integral de empresas de transporte por carretera. Permite administrar camioneros, vehículos, viajes, gastos, documentos, mensajería interna y seguimiento GPS, con acceso diferenciado por rol.

---

## Índice

1. [Stack tecnológico](#stack-tecnológico)
2. [Arquitectura general](#arquitectura-general)
3. [Estructura del repositorio](#estructura-del-repositorio)
4. [Backend — Laravel](#backend--laravel)
   - [Modelos y base de datos](#modelos-y-base-de-datos)
   - [Controladores API](#controladores-api)
   - [Rutas API](#rutas-api)
   - [Servicios y repositorios](#servicios-y-repositorios)
   - [Autenticación y roles](#autenticación-y-roles)
5. [Frontend — React](#frontend--react)
   - [Páginas](#páginas)
   - [Componentes de layout](#componentes-de-layout)
   - [Servicios API](#servicios-api)
   - [Contexto de autenticación](#contexto-de-autenticación)
6. [Roles y permisos](#roles-y-permisos)
7. [Puesta en marcha](#puesta-en-marcha)
8. [Comandos útiles](#comandos-útiles)
9. [Despliegue](#despliegue)

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Laravel 12 + PHP 8.2 |
| Base de datos | MySQL |
| Autenticación | Laravel Sanctum (tokens) |
| Frontend | React 19 + Vite 8 |
| Routing frontend | React Router v7 |
| HTTP client | Axios |
| Mapas | Leaflet + React-Leaflet |
| Tests backend | PHPUnit 11 |
| Tests frontend | Vitest + Testing Library |

---

## Arquitectura general

```
Navegador (React SPA)
        │
        │  HTTP / JSON  (Bearer token)
        ▼
Laravel API  (/api/v1/*)
        │
        ├── Controllers  →  FormRequests (validación)
        ├── Services     →  lógica de negocio
        ├── Repositories →  acceso a datos
        └── Models       →  Eloquent ORM
                │
                ▼
            MySQL
```

El frontend es una SPA compilada con Vite. En producción el build (`dist/`) se sirve directamente desde el servidor web junto al backend Laravel.

---

## Estructura del repositorio

```
/
├── backend/                         ← Proyecto Laravel completo
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/     ← 10 controladores REST
│   │   │   ├── Middleware/          ← CheckRole
│   │   │   └── Requests/           ← Validaciones (FormRequest)
│   │   ├── Models/                  ← 11 modelos Eloquent
│   │   ├── Services/                ← Lógica de negocio
│   │   └── Repositories/           ← Acceso a datos
│   ├── database/
│   │   ├── migrations/              ← 14 migraciones
│   │   ├── factories/
│   │   └── seeders/
│   ├── routes/
│   │   └── api.php                  ← Todas las rutas API
│   └── tests/
│       ├── Unit/
│       └── Feature/
│
└── frontend/                        ← Proyecto React (Vite)
    ├── src/
    │   ├── pages/                   ← Páginas de la aplicación
    │   │   └── admin/               ← Páginas exclusivas admin
    │   ├── components/
    │   │   └── layout/              ← Shell, sidebar, header
    │   ├── context/                 ← AuthContext
    │   ├── services/                ← Llamadas a la API
    │   └── hooks/
    └── dist/                        ← Build para producción
```

---

## Backend — Laravel

### Modelos y base de datos

#### `users`
Tabla única de usuarios con campo `role` para diferenciar administradores de camioneros.

| Campo | Tipo | Descripción |
|---|---|---|
| id | bigint PK | |
| name | string | Nombre completo |
| email | string unique | |
| password | string | Hash bcrypt |
| role | enum | `admin` / `camionero` |
| timestamps | | created_at, updated_at |

Métodos: `isAdmin()`, `isCamionero()`
Relaciones: `hasOne(Camionero)`

---

#### `camioneros`
Perfil profesional extendido del usuario con rol camionero.

| Campo | Tipo | Descripción |
|---|---|---|
| id | bigint PK | |
| user_id | FK → users | |
| nombre | string | |
| apellidos | string | |
| email | string unique | |
| telefono | string nullable | |
| licencia | string unique | Número de licencia |
| fecha_nacimiento | date | |
| deleted_at | timestamp | Soft delete |

Relaciones: `belongsTo(User)`, `hasMany(Viaje)`
Método: `nombreCompleto()`

---

#### `empresas`
Empresas propietarias de vehículos.

| Campo | Tipo | Descripción |
|---|---|---|
| id | bigint PK | |
| nombre | string | |
| cif | string unique | |
| email | string unique | |
| telefono | string nullable | |
| direccion | string nullable | |
| deleted_at | timestamp | Soft delete |

Relaciones: `hasMany(Vehiculo)`

---

#### `vehiculos`
Flota de vehículos (camiones) gestionada por el administrador.

| Campo | Tipo | Descripción |
|---|---|---|
| id | bigint PK | |
| empresa_id | FK nullable | |
| matricula | string unique | |
| marca | string | |
| modelo | string | |
| anio | smallint unsigned | |
| deleted_at | timestamp | Soft delete |

Relaciones: `belongsTo(Empresa)`

---

#### `rutas`
Definición de trayectos reutilizables.

| Campo | Tipo | Descripción |
|---|---|---|
| id | bigint PK | |
| origen | string | |
| destino | string | |
| km_estimados | int unsigned nullable | |
| paradas | JSON nullable | Array de paradas intermedias |

---

#### `viajes`
Entidad central del sistema. Representa un trayecto asignado a un camionero.

| Campo | Tipo | Descripción |
|---|---|---|
| id | bigint PK | |
| camionero_id | FK → camioneros | |
| vehiculo_id | FK nullable → vehiculos | |
| ruta_id | FK nullable → rutas | |
| estado | enum | `pendiente` / `en_curso` / `completado` / `cancelado` |
| fecha_inicio | timestamp nullable | |
| fecha_fin | timestamp nullable | |
| notas | text nullable | |
| deleted_at | timestamp | Soft delete |

Relaciones: `belongsTo(Camionero)`, `belongsTo(Vehiculo)`, `belongsTo(Ruta)`, `hasMany(Gasto)`, `hasMany(Documento)`

---

#### `gastos`
Gastos asociados a un viaje: combustible, dietas, peajes, etc.

| Campo | Tipo | Descripción |
|---|---|---|
| id | bigint PK | |
| viaje_id | FK → viajes | |
| tipo | enum | `combustible` / `dieta` / `peaje` / `otro` |
| importe | decimal(10,2) | |
| descripcion | string nullable | |
| fecha | date | |
| foto_ticket | string nullable | Ruta del archivo subido |
| deleted_at | timestamp | Soft delete |

---

#### `documentos`
Archivos adjuntos a viajes: CMR, albaranes, facturas.

| Campo | Tipo | Descripción |
|---|---|---|
| id | bigint PK | |
| viaje_id | FK → viajes | |
| tipo | enum | `cmr` / `albaran` / `factura` / `otro` |
| archivo | string | Ruta del archivo en storage |
| nombre_original | string | Nombre original del archivo |
| fecha | date | |
| deleted_at | timestamp | Soft delete |

---

#### `mensajes`
Sistema de mensajería interna entre camioneros y administrador.

| Campo | Tipo | Descripción |
|---|---|---|
| id | bigint PK | |
| de_user_id | FK → users | Remitente |
| para_user_id | FK → users | Destinatario |
| contenido | text | |
| leido | boolean | Default false |
| leido_at | timestamp nullable | |

---

#### `ubicaciones`
Registro de posiciones GPS de los camioneros.

| Campo | Tipo | Descripción |
|---|---|---|
| id | bigint PK | |
| camionero_id | FK → camioneros | |
| viaje_id | FK nullable → viajes | |
| lat | decimal(10,7) | Latitud |
| lng | decimal(10,7) | Longitud |
| registrado_at | timestamp | Momento del registro |

---

#### `gestiones`
Notas y comentarios internos sobre un viaje (admin y camionero).

| Campo | Tipo | Descripción |
|---|---|---|
| id | bigint PK | |
| viaje_id | FK → viajes | |
| user_id | FK → users | Autor |
| contenido | text | |
| deleted_at | timestamp | Soft delete |

> Nota: el modelo usa `protected $table = 'gestiones'` para evitar que Eloquent infiera el nombre en inglés (`gestions`).

---

### Controladores API

Todos los controladores están en `app/Http/Controllers/Api/` y siguen el patrón:
- Validación delegada a **FormRequest**
- Lógica delegada a **Service**
- Acceso a datos delegado a **Repository**

| Controlador | Responsabilidad |
|---|---|
| `AuthController` | Login, logout, usuario autenticado |
| `CamioneroController` | CRUD de camioneros |
| `ViajeController` | CRUD de viajes + cambio de estado |
| `VehiculoController` | CRUD de vehículos |
| `RutaController` | CRUD de rutas |
| `GastoController` | CRUD de gastos + upload de foto de ticket |
| `DocumentoController` | CRUD de documentos + upload/descarga de archivos |
| `MensajeController` | Envío, conversación, leídos |
| `UbicacionController` | Registro GPS, última posición, historial |
| `GestionController` | Notas por viaje (CRUD anidado bajo viaje) |

---

### Rutas API

Prefijo base: `/api/v1/`

```
# Autenticación
POST   /login
POST   /logout
GET    /me

# Camioneros
GET    /camioneros
POST   /camioneros
GET    /camioneros/{id}
PUT    /camioneros/{id}
DELETE /camioneros/{id}

# Vehículos
GET    /vehiculos
POST   /vehiculos
GET    /vehiculos/{id}
PUT    /vehiculos/{id}
DELETE /vehiculos/{id}

# Rutas
GET    /rutas
POST   /rutas
GET    /rutas/{id}
PUT    /rutas/{id}
DELETE /rutas/{id}

# Viajes
GET    /viajes
POST   /viajes
GET    /viajes/{id}
PUT    /viajes/{id}
PATCH  /viajes/{id}/estado
DELETE /viajes/{id}

# Gestiones (anidadas en viajes)
GET    /viajes/{viajeId}/gestiones
POST   /viajes/{viajeId}/gestiones
PATCH  /viajes/{viajeId}/gestiones/{id}
DELETE /viajes/{viajeId}/gestiones/{id}

# Gastos
GET    /gastos?viaje_id={id}
POST   /gastos
GET    /gastos/{id}
PUT    /gastos/{id}
DELETE /gastos/{id}

# Documentos
GET    /documentos?viaje_id={id}
POST   /documentos
GET    /documentos/{id}
PUT    /documentos/{id}
DELETE /documentos/{id}
GET    /documentos/{id}/descargar

# Mensajes
POST   /mensajes
GET    /mensajes/no-leidos
GET    /mensajes/conversacion/{userId}
PATCH  /mensajes/leidos/{userId}

# Ubicaciones GPS
POST   /ubicaciones
GET    /ubicaciones/camionero/{camioneroId}
GET    /ubicaciones/viaje/{viajeId}
GET    /ubicaciones/viaje/{viajeId}/historial
```

Todas las rutas (excepto `/login`) requieren token Sanctum en la cabecera:
```
Authorization: Bearer {token}
```

---

### Servicios y repositorios

Cada entidad principal tiene su propio Service y Repository en:
- `app/Services/`
- `app/Repositories/`

Los controladores no contienen lógica de negocio: delegan en el Service, que a su vez delega el acceso a datos en el Repository.

---

### Autenticación y roles

- **Laravel Sanctum** gestiona los tokens de API.
- El middleware `CheckRole` protege rutas según el campo `role` del usuario.
- Las respuestas siguen siempre la estructura:
  ```json
  {
    "data": { ... },
    "message": "Descripción",
    "status": 200
  }
  ```

---

## Frontend — React

### Páginas

#### Comunes (admin y camionero)

| Página | Ruta | Descripción |
|---|---|---|
| `Login` | `/login` | Formulario de acceso con email y contraseña |
| `Dashboard` | `/dashboard` | Estadísticas personales y viajes activos |
| `Viajes` | `/viajes` | Listado de viajes con filtros por estado |
| `ViajeDetalle` | `/viajes/:id` | Detalle de viaje, gestiones y cambio de estado |
| `Mensajes` | `/mensajes` | Mensajería con el administrador |

#### Exclusivas del administrador

| Página | Ruta | Descripción |
|---|---|---|
| `DashboardAdmin` | `/dashboard` | Visión global: estadísticas, flota, viajes en curso |
| `Camioneros` | `/camioneros` | CRUD completo de camioneros con modal |
| `Vehiculos` | `/vehiculos` | CRUD completo de vehículos |
| `NuevoViaje` | `/viajes/nuevo` | Formulario de creación de viaje |
| `MapaGps` | `/mapa` | Mapa Leaflet con posiciones GPS en tiempo real |

---

### Componentes de layout

```
AppLayout.jsx       ← Shell principal (sidebar + header + <Outlet>)
├── Sidebar.jsx     ← Navegación lateral con menú diferenciado por rol
└── Header.jsx      ← Cabecera con título de página y botón de menú

ProtectedRoute.jsx  ← Redirige a /login si no hay sesión activa
```

El sidebar muestra menús distintos según el rol:

- **Admin**: Dashboard, Camioneros, Vehículos, Viajes, Mensajes, Mapa GPS
- **Camionero**: Dashboard, Mis Viajes, Mensajes

---

### Servicios API

Todos en `frontend/src/services/`. Usan una instancia compartida de Axios (`api.js`) que:
- Añade automáticamente el `Authorization: Bearer {token}` en cada petición.
- Redirige a `/login` ante cualquier respuesta `401`.

| Servicio | Endpoints que gestiona |
|---|---|
| `auth.js` | login, logout, me |
| `viajes.js` | CRUD viajes + cambiarEstado |
| `gestiones.js` | CRUD gestiones por viaje |
| `gastos.js` | listar, crear, eliminar gastos |
| `documentos.js` | listar, subir, descargar, eliminar documentos |
| `camioneros.js` | CRUD camioneros |
| `vehiculos.js` | CRUD vehículos |
| `rutas.js` | listar rutas |
| `mensajes.js` | conversación, envío, no leídos, marcar leídos |
| `ubicaciones.js` | última posición por camionero/viaje |

---

### Contexto de autenticación

`AuthContext.jsx` proporciona a toda la aplicación:

- **Estado**: `user` (objeto con id, name, email, role), `loading`
- **Métodos**: `login(email, password)`, `logout()`
- **Helpers**: `isAdmin()`, `isCamionero()`
- **Persistencia**: token y datos de usuario en `localStorage`

Se consume con el hook `useAuth()` desde cualquier componente.

---

## Roles y permisos

| Acción | Admin | Camionero |
|---|---|---|
| Crear / editar camioneros | ✅ | ❌ |
| Crear / editar vehículos | ✅ | ✅ |
| Ver todos los viajes | ✅ | ❌ |
| Crear viajes | ✅ | ✅ (solo los suyos) |
| Ver / editar sus viajes | ✅ | ✅ |
| Gestionar gastos y documentos | ✅ todos | ✅ solo los suyos |
| Crear gestiones en viajes | ✅ | ✅ |
| Editar / eliminar gestiones ajenas | ✅ | ❌ |
| Ver mapa GPS | ✅ | ❌ |
| Mensajería | ✅ con todos | ✅ con el admin |

---

## Puesta en marcha

### Requisitos

- PHP 8.2+
- Composer
- MySQL
- Node.js 20+

### Backend

```bash
cd backend
cp .env.example .env          # Configurar DB_DATABASE, DB_USERNAME, DB_PASSWORD
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve             # http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

---

## Comandos útiles

```bash
# Backend (desde /backend)
php artisan test                         # Todos los tests
php artisan test --filter=NombreTest     # Test específico
php artisan migrate:fresh --seed         # Reset BD con seeders
php artisan migrate:status               # Estado de migraciones

# Frontend (desde /frontend)
npm run dev                              # Servidor de desarrollo
npm run test                             # Tests con Vitest
npm run build                            # Genera dist/ para producción
```

---

## Despliegue

El frontend se compila con Vite y el resultado (`dist/`) se sube directamente al servidor junto al backend Laravel:

```
/var/www/
├── backend/          ← Laravel
├── index.html        ← Punto de entrada React (dist/)
└── assets/           ← JS y CSS compilados (dist/assets/)
```

El servidor web (Nginx / Apache) debe dirigir todas las rutas que no sean `/api/*` al `index.html` de React (SPA routing).
