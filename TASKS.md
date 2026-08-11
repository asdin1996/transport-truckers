# TASKS.md — App Camioneros

## Reglas
- Trabajar **una tarea a la vez**
- No marcar como ✅ sin tests pasando
- Una vez pasados los tests hacemos commit y en español
- Actualizar este fichero al terminar cada tarea

---

## 🔄 FASE 1: Setup y Base

### ✅ TAREA-001: Configuración inicial del proyecto
- [x] Crear proyecto Laravel 12 (compatible PHP 8.2)
- [x] Configurar `.env` (MySQL, app name, timezone Europe/Madrid)
- [x] Instalar Laravel Sanctum
- [x] Configurar CORS para React
- [x] Estructura base de carpetas (Repositories, Services)
- [x] Commit inicial

### ✅ TAREA-002: Modelo Camionero
- [x] Migración `camioneros` (nombre, apellidos, email, telefono, licencia, fecha_nacimiento)
- [x] Modelo + relaciones
- [x] Factory + Seeder
- [x] Tests unitarios del modelo
- [x] Tests de la migración

### ✅ TAREA-003: Modelo Empresa
- [x] Migración `empresas` (nombre, cif, email, telefono, direccion)
- [x] Modelo + relaciones
- [x] Factory + Seeder
- [x] Tests unitarios del modelo

### ✅ TAREA-004: Autenticación
- [x] Login camionero (Sanctum)
- [x] Login admin (Sanctum)
- [x] Logout
- [x] Middleware de roles (admin / camionero)
- [x] Tests Feature: login, logout, acceso denegado

---

## ⏳ FASE 2: Vehículos y Rutas

### ✅ TAREA-005: Modelo Vehiculo
- [x] Migración `vehiculos` (matricula, marca, modelo, anio, empresa_id)
- [x] Modelo + relaciones con Empresa
- [x] Factory + Seeder
- [x] CRUD API `/api/v1/vehiculos`
- [x] Tests Feature del CRUD

### ✅ TAREA-006: Modelo Ruta
- [x] Migración `rutas` (origen, destino, km_estimados, paradas JSON)
- [x] Modelo
- [x] Factory + Seeder
- [x] CRUD API `/api/v1/rutas`
- [x] Tests Feature del CRUD

### ✅ TAREA-007: Modelo Viaje
- [x] Migración `viajes` (camionero_id, vehiculo_id, ruta_id, estado, fecha_inicio, fecha_fin)
- [x] Modelo + relaciones
- [x] Factory + Seeder
- [x] Estados: pendiente / en_curso / completado / cancelado
- [x] CRUD API `/api/v1/viajes`
- [x] Tests Feature del CRUD y cambio de estado

---

## ⏳ FASE 3: Gastos y Documentos

### ✅ TAREA-008: Modelo Gasto
- [x] Migración `gastos` (viaje_id, tipo, importe, descripcion, fecha, foto_ticket)
- [x] Tipos: combustible / dieta / peaje / otro
- [x] Modelo + relaciones
- [x] Factory + Seeder
- [x] CRUD API `/api/v1/gastos`
- [x] Subida de foto ticket (Storage)
- [x] Tests Feature

### ✅ TAREA-009: Modelo Documento
- [x] Migración `documentos` (viaje_id, tipo, archivo, nombre_original, fecha)
- [x] Tipos: cmr / albaran / factura / otro
- [x] Modelo + relaciones
- [x] Subida y descarga de documentos
- [x] CRUD API `/api/v1/documentos`
- [x] Tests Feature

---

## ⏳ FASE 4: Comunicación y GPS

### ✅ TAREA-010: Chat / Mensajes
- [x] Migración `mensajes` (de_user_id, para_user_id, contenido, leido, leido_at)
- [x] Modelo + relaciones (remitente/destinatario BelongsTo User)
- [x] Factory + Seeder
- [x] API enviar/recibir mensajes, conversación, no leídos
- [x] Marcar como leído
- [x] Tests Feature (12 tests)

### ✅ TAREA-011: Seguimiento GPS
- [x] Migración `ubicaciones` (camionero_id, viaje_id, lat, lng, registrado_at)
- [x] Modelo + Factory + Seeder
- [x] Endpoint registrar ubicación (solo camioneros)
- [x] Endpoint última ubicación por camionero y por viaje
- [x] Endpoint historial de ubicaciones por viaje
- [x] Tests Feature (13 tests)

---

## ⏳ FASE 5: Frontend React

### ✅ TAREA-012: Setup React
- [x] Crear proyecto React con Vite
- [x] Configurar React Router con rutas protegidas por rol
- [x] Configurar Axios con interceptors (token Bearer + redirección 401)
- [x] Layout base dark mode — sidebar responsive + header con título dinámico
- [x] Contexto de autenticación (login, logout, isAdmin, isCamionero)
- [x] Vitest + Testing Library configurados — 6 tests pasando

### ✅ TAREA-013: Pantallas Camionero
- [x] Login (completado en TAREA-012)
- [x] Dashboard con estadísticas, viajes en curso y últimos gastos
- [x] Listado de viajes con filtrado por estado
- [x] Detalle de viaje con cambio de estado y listado de gastos
- [x] Formulario añadir gasto con subida de foto ticket
- [x] 13 tests Vitest pasando

### ✅ TAREA-014: Pantallas Admin
- [x] Dashboard admin con estadísticas de flota y viajes en curso
- [x] Gestión de camioneros (CRUD con modal inline)
- [x] Gestión de vehículos (CRUD con modal inline)
- [x] Asignar viaje (selects camionero / vehículo / ruta)
- [x] Mapa GPS con Leaflet — última posición de cada camionero, refresco cada 30s
- [x] 21 tests Vitest pasando

---

## ✅ Completadas
- TAREA-001: Configuración inicial del proyecto
- TAREA-002: Modelo Camionero
- TAREA-003: Modelo Empresa
- TAREA-004: Autenticación con Sanctum
- TAREA-005: Modelo Vehiculo con CRUD API
- TAREA-006: Modelo Ruta con CRUD API
- TAREA-007: Modelo Viaje con CRUD API y cambio de estado
- TAREA-008: Modelo Gasto con CRUD API y subida de foto ticket
- TAREA-009: Modelo Documento con CRUD API y descarga
- TAREA-010: Chat / Mensajes con API enviar/conversacion/no-leidos/marcar-leidos
- TAREA-011: Seguimiento GPS con endpoints registrar/consultar última/historial por viaje
- TAREA-012: Setup React con Vite, Router, Axios, layout dark mode y AuthContext
- TAREA-013: Pantallas Camionero — Dashboard, Viajes, Detalle viaje, Añadir gasto
- TAREA-014: Pantallas Admin — Dashboard, CRUD Camioneros/Vehículos, Asignar viaje, Mapa GPS

---

**✅ PROYECTO COMPLETADO**