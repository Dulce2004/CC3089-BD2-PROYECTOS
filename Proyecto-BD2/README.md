# Proyecto BD2 — API REST de Gestión de Restaurantes y Pedidos

API REST desarrollada en **Go** que simula un sistema de delivery/pedidos de restaurantes. Permite registrar usuarios, autenticarse con JWT, consultar restaurantes, crear órdenes, dejar reseñas, consultar analíticas, gestionar archivos con GridFS e insertar datos masivos en todas las colecciones. La base de datos utilizada es **MongoDB Atlas** y el framework HTTP es **Gin**.

---

## Tecnologías utilizadas

| Tecnología | Versión | Uso |
|---|---|---|
| Go | 1.21+ | Lenguaje principal |
| Gin | v1.12.0 | Framework HTTP / enrutamiento |
| MongoDB Go Driver | v1.17.9 | Conexión y operaciones con MongoDB |
| MongoDB Atlas | — | Base de datos en la nube |
| JWT | — | Autenticación de usuarios |
| bcrypt | — | Hash de contraseñas |

---

## Estructura del proyecto

```
Proyecto-BD2/
│
├── main.go                   # Punto de entrada de la aplicación
├── go.mod                    # Módulo y dependencias de Go
├── go.sum                    # Checksums de dependencias
│
├── config/
│   └── mongo.go              # Conexión a MongoDB e inicialización de índices
│
├── models/
│   ├── usuario.go            # Modelo de Usuario y Dirección
│   ├── restaurante.go        # Modelo de Restaurante y Ubicación (GeoJSON)
│   ├── orden.go              # Modelo de Orden e ItemOrden
│   ├── resena.go             # Modelo de Reseña
│   └── articulo_menu.go      # Modelo de Artículo del Menú
│
├── middleware/
│   └── auth.go               # Middleware JWT para rutas protegidas
│
├── services/
│   ├── auth_service.go       # Registro y login con bcrypt + JWT
│   ├── usuario_service.go    # Lógica de negocio para usuarios
│   ├── restaurante_service.go# Lógica de negocio para restaurantes
│   ├── menu_service.go       # Lógica de negocio para artículos de menú
│   ├── orden_service.go      # Lógica de negocio para órdenes
│   ├── resena_service.go     # Lógica con transacción para reseñas
│   ├── analytics_service.go  # Aggregation pipelines de analítica
│   ├── archivo_service.go    # Subida y descarga de archivos con GridFS
│   └── bulk_service.go       # Generación masiva de datos en todas las colecciones
│
├── handlers/
│   ├── auth_handler.go       # Handler HTTP para autenticación
│   ├── usuario_handler.go    # Handler HTTP para usuarios
│   ├── restaurante_handler.go# Handler HTTP para restaurantes
│   ├── menu_handler.go       # Handler HTTP para artículos de menú
│   ├── orden_handler.go      # Handler HTTP para órdenes
│   ├── resena_handler.go     # Handler HTTP para reseñas
│   ├── analytics_handler.go  # Handler HTTP para analíticas
│   ├── archivo_handler.go    # Handler HTTP para archivos (GridFS)
│   └── bulk_handler.go       # Handler HTTP para inserción masiva
│
├── routes/
│   └── routes.go             # Registro de todas las rutas HTTP
│
└── utils/
    └── bulk.go               # Utilidades auxiliares de BulkWrite por colección
```

---

## Arquitectura del proyecto

El proyecto sigue una arquitectura en **tres capas** bien diferenciadas:

```
Request HTTP
     │
     ▼
┌─────────────┐
│  Middleware  │  Valida JWT en rutas protegidas
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Handler   │  Recibe la petición, valida el JSON y responde
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Service   │  Contiene la lógica de negocio y consultas a la BD
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  MongoDB    │  Base de datos en la nube (Atlas)
└─────────────┘
```

Los **modelos** son structs de Go que representan los documentos de cada colección en MongoDB. La **configuración** expone una variable global `DB` que todos los servicios usan para acceder a las colecciones.

---

## Cómo ejecutar el proyecto

### Requisitos previos

- Tener instalado [Go 1.21+](https://go.dev/dl/)
- Acceso a internet (la BD está en MongoDB Atlas)

### Pasos

```bash
# 1. Clonar o abrir el proyecto
cd Proyecto-BD2

# 2. Descargar dependencias
go mod tidy

# 3. Ejecutar el servidor
go run main.go
```

El servidor arranca en `http://localhost:8080`.

---

## Índices de MongoDB

El proyecto crea automáticamente los siguientes índices al iniciar:

| Colección | Campo(s) | Tipo | Propósito |
|---|---|---|---|
| `usuarios` | `correo` | Único | Garantiza correos únicos por usuario |
| `ordenes` | `restaurante_id` + `fecha_pedido` | Compuesto | Optimiza consultas de órdenes por restaurante |
| `restaurantes` | `categorias` | Multikey | Indexa elementos del array para filtrar por categoría |
| `restaurantes` | `ubicacion` | 2dsphere | Habilita consultas geoespaciales (`$near`) |

---

## Endpoints disponibles

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/register` | Registrar un nuevo usuario |
| `POST` | `/auth/login` | Iniciar sesión y obtener token JWT |

### Usuarios (protegidos con JWT)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/usuarios/perfil` | Obtener perfil del usuario autenticado |
| `PUT` | `/usuarios/perfil` | Actualizar perfil del usuario autenticado |
| `PUT` | `/usuarios/:id/direcciones` | Agregar una dirección al array de un usuario (`$push`) |

### Restaurantes

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/restaurantes` | Obtener todos los restaurantes |
| `POST` | `/restaurantes` | Crear un nuevo restaurante |
| `GET` | `/restaurantes/:id` | Obtener un restaurante por ID |
| `PUT` | `/restaurantes/:id` | Actualizar un restaurante |
| `DELETE` | `/restaurantes/:id` | Eliminar un restaurante |
| `GET` | `/restaurantes/buscar?nombre=` | Búsqueda por nombre (regex) |
| `GET` | `/restaurantes/categoria?cat=` | Filtrar por categoría (índice multikey) |
| `GET` | `/restaurantes/cerca?lat=&lng=&dist=` | Búsqueda geoespacial (índice 2dsphere) |
| `GET` | `/restaurantes/search?categoria=&limit=&skip=` | Búsqueda avanzada con filtro, sort, paginación y proyección |
| `GET` | `/restaurantes/categorias` | Obtener categorías únicas (`distinct`) |
| `POST` | `/restaurantes/:id/menu` | Crear artículo de menú para un restaurante |
| `GET` | `/restaurantes/:id/menu` | Obtener menú de un restaurante |
| `GET` | `/restaurantes/:id/ordenes` | Obtener órdenes de un restaurante (índice compuesto) |

### Menú

| Método | Ruta | Descripción |
|--------|------|-------------|
| `PUT` | `/menu/:id` | Actualizar artículo de menú |
| `DELETE` | `/menu/:id` | Eliminar artículo de menú |

### Órdenes (protegidas con JWT)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/ordenes` | Crear una nueva orden (total calculado automáticamente) |
| `GET` | `/ordenes` | Obtener órdenes del usuario autenticado |
| `GET` | `/ordenes/:id` | Obtener una orden por ID |
| `PUT` | `/ordenes/:id/estado` | Actualizar estado de una orden |
| `DELETE` | `/ordenes/:id` | Eliminar una orden |
| `GET` | `/ordenes/count?estado=` | Contar órdenes (filtro opcional por estado) |
| `PUT` | `/ordenes/estado-masivo` | Actualizar estado de múltiples órdenes (`UpdateMany`) |
| `DELETE` | `/ordenes/masivo?estado=` | Eliminar múltiples órdenes por estado (`DeleteMany`) |

### Reseñas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/resenas` | Crear reseña (transacción: inserta reseña + marca orden + recalcula promedio) |

### Analíticas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/analytics/top-platillos` | Top 5 platillos más pedidos (aggregation pipeline) |
| `GET` | `/analytics/top-usuarios` | Top 10 usuarios que más han gastado (aggregation con `$lookup`) |

### Archivos (GridFS)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/archivos` | Subir un archivo (multipart/form-data, campo `file`) |
| `GET` | `/archivos/:id` | Descargar un archivo por su ID |

### Operaciones Masivas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/bulk/ordenes?cantidad=50000` | Generar órdenes ficticias masivas con BulkWrite (máx. 100,000) |
| `POST` | `/bulk/todo?cantidad=500` | Generar datos en **todas** las colecciones (usuarios, restaurantes, menú, órdenes, reseñas) |

---

## Modelos de datos

### Usuario

```
Usuario
├── ID            (ObjectID)     — Identificador único de MongoDB
├── Nombre        (string)       — Nombre completo
├── Correo        (string)       — Dirección de correo electrónico (único)
├── Contrasena    (string)       — Hash bcrypt de la contraseña
├── Telefono      (string)       — Número de teléfono
├── Direcciones   ([]Direccion)  — Lista de direcciones de entrega
└── FechaRegistro (time.Time)    — Fecha de registro

Direccion (struct embebido)
├── Calle         (string)
├── Zona          (int)
├── Ciudad        (string)
└── Coordenadas   (string)
```

### Restaurante

```
Restaurante
├── ID                   (ObjectID)   — Identificador único
├── Nombre               (string)     — Nombre del restaurante
├── Ubicacion            (Ubicacion)  — Coordenadas GeoJSON
├── Categorias           ([]string)   — Tipos de cocina
├── CalificacionPromedio (float64)    — Promedio calculado automáticamente al recibir reseñas
└── FechaCreacion        (time.Time)  — Fecha de registro

Ubicacion (GeoJSON Point)
├── Type        (string)     — Siempre "Point"
└── Coordinates ([]float64)  — [longitud, latitud]
```

### ArticuloMenu

```
ArticuloMenu
├── ID            (ObjectID) — Identificador único
├── RestauranteID (ObjectID) — Restaurante al que pertenece
├── Nombre        (string)   — Nombre del platillo
├── Descripcion   (string)   — Descripción del platillo
├── Precio        (float64)  — Precio unitario
├── Disponible    (bool)     — Si está disponible para pedidos
└── Categoria     (string)   — Categoría (ej: "Entradas", "Bebidas", "Postres")
```

### Orden

```
Orden
├── ID            (ObjectID)    — Identificador único
├── UsuarioID     (ObjectID)    — Referencia al usuario que realizó el pedido
├── RestauranteID (ObjectID)    — Referencia al restaurante
├── Items         ([]ItemOrden) — Lista de artículos pedidos
├── Estado        (string)      — "pendiente", "en camino", "entregada", "cancelada"
├── Total         (float64)     — Total calculado automáticamente
├── FechaPedido   (time.Time)   — Fecha/hora del pedido
├── Direccion     (Direccion)   — Dirección de entrega
└── Resenado      (bool)        — Indica si ya se dejó reseña

ItemOrden (struct embebido)
├── ArticuloID     (ObjectID) — Referencia al artículo del menú
├── Nombre         (string)   — Nombre del artículo (desnormalizado)
├── Cantidad       (int)      — Cantidad pedida
└── PrecioUnitario (float64)  — Precio al momento del pedido
```

### Resena

```
Resena
├── ID            (ObjectID) — Identificador único
├── UsuarioID     (ObjectID) — ID del usuario que escribe la reseña
├── RestauranteID (ObjectID) — ID del restaurante reseñado
├── PedidoID      (ObjectID) — ID del pedido asociado
├── Calificacion  (int)      — Puntaje numérico (1-5)
├── Comentario    (string)   — Texto de la reseña
└── FechaResena   (time.Time)— Fecha/hora de la reseña
```

---

## Colecciones en MongoDB

Base de datos: `Proyecto1-BD2`

| Colección | Descripción |
|-----------|-------------|
| `usuarios` | Usuarios registrados en el sistema |
| `restaurantes` | Restaurantes disponibles |
| `articulos_menu` | Platillos/artículos del menú de cada restaurante |
| `ordenes` | Pedidos realizados por usuarios |
| `resenas` | Reseñas escritas por usuarios sobre restaurantes |
| `fs.files` / `fs.chunks` | Archivos almacenados en GridFS |

---

## Funcionalidades destacadas de MongoDB

### Transacciones

La creación de reseñas utiliza una **transacción de MongoDB** para ejecutar tres operaciones de forma atómica:

```
Cliente envía POST /resenas
          │
          ▼
   Handler valida JSON
          │
          ▼
   Service inicia sesión + transacción
          │
   ┌──────┴───────────────────────────────────┐
   │  1. INSERT en colección "resenas"         │
   │  2. UPDATE orden → resenado: true         │
   │  3. AGGREGATE calificaciones del rest.   │
   │     UPDATE restaurante → nuevo promedio  │
   └──────┬───────────────────────────────────┘
          │
     ¿Éxito en todo?
       /        \
    SÍ           NO
     │             │
  COMMIT       ROLLBACK
     │             │
  200 OK       500 Error
```

### Aggregation Pipelines

- **Top Platillos**: `$match` → `$unwind` → `$group` → `$sort` → `$limit`
- **Top Usuarios**: `$match` → `$group` → `$sort` → `$limit` → `$lookup` → `$unwind` → `$project`

### Consultas Geoespaciales

Búsqueda de restaurantes cercanos usando el operador `$near` con índice `2dsphere` sobre coordenadas GeoJSON.

### BulkWrite

Inserción masiva con `BulkWrite` y `Ordered: false` para maximizar rendimiento y tolerar fallos individuales.

### GridFS

Almacenamiento de archivos directamente en MongoDB, divididos en chunks de 255 KB.

---

## Generación masiva de datos (`/bulk/todo`)

El endpoint `POST /bulk/todo?cantidad=500` genera datos interrelacionados en todas las colecciones:

1. **Usuarios** (~cantidad/10) — Con nombres, correos únicos, teléfonos y direcciones en Guatemala
2. **Restaurantes** (~cantidad/20) — Con ubicaciones GeoJSON reales alrededor de Ciudad de Guatemala
3. **Artículos de menú** (5-12 por restaurante) — Distribuidos en 4 categorías
4. **Órdenes** (cantidad) — Referenciando usuarios y restaurantes reales con items del menú correspondiente
5. **Reseñas** (~40% de órdenes entregadas) — Con calificaciones y comentarios variados

Ejemplo de respuesta:

```json
{
  "message": "Datos masivos generados exitosamente en todas las colecciones",
  "resultado": {
    "usuarios_creados": 50,
    "restaurantes_creados": 25,
    "articulos_menu_creados": 200,
    "ordenes_creadas": 500,
    "resenas_creadas": 45
  }
}
```

---

## Notas de diseño

- **Desnormalización**: Los items de una orden guardan el `nombre` y `precio_unitario` directamente para evitar joins costosos y preservar el precio histórico.
- **Transacciones**: Solo la creación de reseñas usa transacción completa porque involucra modificar tres colecciones.
- **Aggregation Pipelines**: Las analíticas se resuelven en el lado del servidor MongoDB sin procesar datos en Go.
- **Timeouts de contexto**: Todas las operaciones usan `context.WithTimeout` para evitar operaciones colgadas.
- **Autenticación JWT**: Las rutas de usuarios y órdenes están protegidas con middleware JWT.
- **Contraseñas**: Se almacenan como hash bcrypt, nunca en texto plano.
