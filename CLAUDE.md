# CLAUDE.md — App Camioneros

## Proyecto
App para camioneros y empresas de transporte. Gestiona viajes, rutas, gastos, documentos, comunicación, GPS y flotas.

## Stack
- **Backend:** Laravel 11 + MySQL
- **Frontend:** React (Vite)
- **Auth:** Laravel Sanctum
- **Tests:** PHPUnit (backend) + Vitest (frontend)
- **API:** RESTful JSON

## Estructura del repositorio
```
/
├── backend/                  ← Proyecto Laravel completo
│   ├── app/
│   │   ├── Models/
│   │   ├── Http/Controllers/Api/
│   │   ├── Services/
│   │   ├── Repositories/
│   │   └── Policies/
│   ├── database/
│   │   ├── migrations/
│   │   ├── factories/
│   │   └── seeders/
│   └── tests/
│       ├── Unit/
│       └── Feature/
└── frontend/                 ← Proyecto React (solo en repo)
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── hooks/
    │   └── services/
    └── tests/
```

## Estructura en servidor
```
/var/www/
├── backend/                  ← Laravel (igual que repo)
├── index.html                ← Build React (npm run build)
└── assets/                   ← Assets generados por Vite
```
## Frontend
- **CSS** — el css y js no deben de ir en el mismo fichero
- Estilo: Dark mode, colores rojo (#ba3534)/Negro, aspecto profesional
- Mobile first
> El frontend se compila con `npm run build` y se sube el contenido de `dist/` al servidor directamente.

## Roles
- **Administrador** — Gestión completa: crea/edita camioneros, vehículos, viajes y todo lo demás
- **Camionero** — Acceso limitado: puede crear sus propios viajes y gestionar lo relacionado con ellos

## Permisos por rol
| Acción | Admin | Camionero |
|---|---|---|
| Crear/editar camioneros | ✅ | ❌ |
| Crear/editar vehículos | ✅ | ✅ |
| Crear viajes | ✅ | ✅ (solo los suyos) |
| Ver viajes | ✅ todos | ✅ solo los suyos |
| Gestionar gastos/docs | ✅ | ✅ (solo los suyos) |

## Entidades principales
- **User** — Tabla única de usuarios con campo `role` (admin / camionero)
- **Camionero** — Perfil extendido del usuario camionero (licencia, datos profesionales)
- **Viaje** — Trayecto asignado o creado por un camionero
- **Ruta** — Origen, destino, paradas
- **Gasto** — Combustible, dietas, peajes
- **Documento** — CMR, albaranes, facturas
- **Vehiculo** — Camión gestionado por el admin, asignado a viajes
- **Mensaje** — Chat entre camionero y administrador

## Convenciones
- **BD:** snake_case, timestamps siempre, soft deletes donde aplique
- **PHP:** PSR-12, camelCase métodos, PascalCase clases
- **React:** camelCase componentes funcionales, hooks con prefijo `use`
- **API:** rutas en `/api/v1/`, respuestas con estructura `{ data, message, status }`
- **Repositorios obligatorios** — no lógica en controladores
- **Services** para lógica de negocio compleja

## Reglas de desarrollo
- Trabajar **tarea a tarea** según TASKS.md
- Cada tarea requiere **tests antes de marcarse completa**
- No pasar a la siguiente tarea sin completar la actual
- Siempre crear **Factory + Seeder** junto a cada modelo
- Migraciones: **nunca modificar** las ya ejecutadas, crear nuevas
- Validaciones siempre en **FormRequest**, nunca en el controlador

## Comandos útiles
```bash
# Backend (desde /backend)
php artisan test                        # Ejecutar todos los tests
php artisan test --filter=NombreTest    # Test específico
php artisan migrate:fresh --seed        # Reset BD con seeders
php artisan make:model X -mfsc          # Modelo + migración + factory + seeder + controller

# Frontend (desde /frontend)
npm run dev                             # Dev server
npm run test                            # Tests
npm run build                           # Genera dist/ para subir al servidor
```

## Tareas
Ver **TASKS.md** para el estado actual y detalle de cada tarea.