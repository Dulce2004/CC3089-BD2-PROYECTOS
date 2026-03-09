# CC3089 — Proyecto 1: Sistema de Gestión de Restaurantes y Pedidos

Sistema completo de delivery de restaurantes desarrollado como proyecto del curso **Bases de Datos 2 (CC3089)** de la Universidad del Valle de Guatemala. Incluye una API REST en Go con MongoDB Atlas y una interfaz web en React.

---

## Descripción

La aplicación simula una plataforma de delivery que permite:

- Registrar usuarios y autenticarse con JWT
- Gestionar restaurantes con ubicaciones geoespaciales (GeoJSON)
- Administrar menús por restaurante
- Crear y gestionar órdenes de pedidos
- Dejar reseñas con transacciones atómicas (inserta reseña + marca orden + recalcula promedio)
- Consultar analíticas con aggregation pipelines
- Subir y descargar archivos con GridFS
- Generar datos masivos en todas las colecciones con BulkWrite

---

## Tecnologías

| Capa | Tecnologías |
|---|---|
| **Backend** | Go, Gin, MongoDB Go Driver, JWT, bcrypt |
| **Frontend** | React 18, Vite, Tailwind CSS, Axios, Recharts, React Router |
| **Base de datos** | MongoDB Atlas (Replica Set) |

---

## Estructura del repositorio

```
CC3089-BD2-PROYECTOS/
│
├── Proyecto-BD2/           # Backend — API REST en Go
│   ├── main.go             # Punto de entrada
│   ├── config/             # Conexión a MongoDB e índices
│   ├── models/             # Structs de datos (Usuario, Restaurante, Orden, etc.)
│   ├── services/           # Lógica de negocio y consultas a MongoDB
│   ├── handlers/           # Handlers HTTP (controladores)
│   ├── middleware/         # Middleware JWT
│   ├── routes/             # Registro de rutas
│   ├── utils/              # Utilidades de BulkWrite
│   └── README.md           # Documentación detallada del backend
│
├── frontend/               # Frontend — React + Vite
│   ├── src/
│   │   ├── pages/          # 8 páginas + Login
│   │   ├── components/     # Componentes reutilizables
│   │   └── services/       # Cliente HTTP (Axios)
│   └── README.md           # Documentación detallada del frontend
│
└── README.md               # Este archivo
```

---

## Requisitos previos

- [Go 1.21+](https://go.dev/dl/)
- [Node.js 18+](https://nodejs.org/)
- Acceso a internet (la base de datos está en MongoDB Atlas)

---

## Cómo ejecutar

### 1. Backend

```bash
cd Proyecto-BD2
go mod tidy
go run main.go
```

El servidor arranca en `http://localhost:8080`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación se abre en `http://localhost:5173`.

---

## Funcionalidades de MongoDB demostradas

| Funcionalidad | Descripción | Ubicación |
|---|---|---|
| **CRUD completo** | Crear, leer, actualizar y eliminar en todas las colecciones | Todos los services |
| **Índice único** | `correo` en usuarios para evitar duplicados | `config/mongo.go` |
| **Índice compuesto** | `restaurante_id` + `fecha_pedido` en órdenes | `config/mongo.go` |
| **Índice multikey** | `categorias` (array) en restaurantes | `config/mongo.go` |
| **Índice 2dsphere** | `ubicacion` (GeoJSON) en restaurantes | `config/mongo.go` |
| **Consulta geoespacial** | `$near` para buscar restaurantes cercanos | `restaurante_service.go` |
| **Aggregation Pipeline** | `$match`, `$unwind`, `$group`, `$sort`, `$limit`, `$lookup`, `$project` | `analytics_service.go` |
| **Transacciones** | Inserción atómica de reseña + actualización de orden + recálculo de promedio | `resena_service.go` |
| **BulkWrite** | Inserción masiva con `Ordered: false` para máximo rendimiento | `bulk_service.go` |
| **GridFS** | Almacenamiento de archivos en chunks de 255 KB | `archivo_service.go` |
| **UpdateMany** | Actualización masiva de estado de órdenes | `orden_service.go` |
| **DeleteMany** | Eliminación masiva de órdenes por estado | `orden_service.go` |
| **CountDocuments** | Conteo de documentos con filtro opcional | `orden_service.go` |
| **Distinct** | Obtener valores únicos de categorías | `restaurante_service.go` |
| **$push** | Agregar direcciones al array de un usuario | `usuario_service.go` |
| **Regex** | Búsqueda de restaurantes por nombre | `restaurante_service.go` |
| **Proyección** | Seleccionar campos específicos en consultas | `restaurante_service.go` |

---

## Colecciones

| Colección | Documentos | Descripción |
|---|---|---|
| `usuarios` | Usuarios | Nombre, correo, contraseña (bcrypt), teléfono, direcciones |
| `restaurantes` | Restaurantes | Nombre, ubicación GeoJSON, categorías, calificación promedio |
| `articulos_menu` | Artículos de menú | Nombre, precio, categoría, disponibilidad, restaurante |
| `ordenes` | Órdenes/Pedidos | Usuario, restaurante, items, total, estado, dirección |
| `resenas` | Reseñas | Usuario, restaurante, pedido, calificación, comentario |
| `fs.files` / `fs.chunks` | Archivos GridFS | Archivos almacenados en la base de datos |

---

## Endpoints principales

| Grupo | Endpoints | Auth |
|---|---|---|
| **Auth** | `POST /auth/register`, `POST /auth/login` | No |
| **Usuarios** | `GET/PUT /usuarios/perfil`, `PUT /usuarios/:id/direcciones` | JWT |
| **Restaurantes** | CRUD + búsqueda por nombre, categoría, cercanía | No |
| **Menú** | CRUD de artículos por restaurante | No |
| **Órdenes** | CRUD + operaciones masivas (UpdateMany, DeleteMany) | JWT |
| **Reseñas** | `POST /resenas` (transacción) | No |
| **Analíticas** | `GET /analytics/top-platillos`, `GET /analytics/top-usuarios` | No |
| **Archivos** | `POST /archivos`, `GET /archivos/:id` (GridFS) | No |
| **Bulk** | `POST /bulk/ordenes`, `POST /bulk/todo` | No |

Para la documentación completa de cada endpoint, ver el [README del backend](Proyecto-BD2/README.md).

---

## Generar datos de prueba

Para poblar todas las colecciones con datos interrelacionados:

```
POST http://localhost:8080/bulk/todo?cantidad=500
```

Esto genera usuarios, restaurantes, artículos de menú, órdenes y reseñas con referencias válidas entre sí.

---

## Autores

- Proyecto del curso CC3089 — Bases de Datos 2, Universidad del Valle de Guatemala
