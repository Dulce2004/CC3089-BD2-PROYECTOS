# Proyecto BD2 — API REST de Gestión de Restaurantes y Pedidos

API REST desarrollada en **Go** que simula un sistema de delivery/pedidos de restaurantes. Permite registrar usuarios, consultar restaurantes, crear órdenes, dejar reseñas, consultar analíticas, gestionar archivos con GridFS e insertar datos masivos. La base de datos utilizada es **MongoDB Atlas** y el framework HTTP es **Gin**.

---

## Tecnologías utilizadas

| Tecnología | Versión | Uso |
|---|---|---|
| Go | 1.21+ | Lenguaje principal |
| Gin | v1.12.0 | Framework HTTP / enrutamiento |
| MongoDB Go Driver | v1.17.9 | Conexión y operaciones con MongoDB |
| MongoDB Atlas | — | Base de datos en la nube |

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
│   └── mongo.go              # Conexión a MongoDB
│
├── models/
│   ├── usuario.go            # Modelo de Usuario y Dirección
│   ├── restaurante.go        # Modelo de Restaurante y Ubicación
│   ├── orden.go              # Modelo de Orden e ItemOrden
│   ├── resena.go             # Modelo de Reseña
│   └── articulo_menu.go      # Modelo de Artículo del Menú
│
├── services/
│   ├── usuario_service.go    # Lógica de negocio para usuarios
│   ├── restaurante_service.go# Lógica de negocio para restaurantes
│   ├── orden_service.go      # Lógica de negocio para órdenes
│   ├── resena_service.go     # Lógica con transacción para reseñas
│   ├── analytics_service.go  # Aggregation pipelines de analítica
│   ├── archivo_service.go    # Subida y descarga de archivos con GridFS
│   └── bulk_service.go       # Generación masiva de órdenes con BulkWrite
│
├── handlers/
│   ├── usuario_handler.go    # Handler HTTP para usuarios
│   ├── restaurante_handler.go# Handler HTTP para restaurantes
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
    └── bulk.go               # Utilidad auxiliar para inserción masiva de órdenes
```

---

## Arquitectura del proyecto

El proyecto sigue una arquitectura en **tres capas** bien diferenciadas:

```
Request HTTP
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

## Endpoints disponibles

### Usuarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/usuarios` | Crear un nuevo usuario |
| `PUT` | `/usuarios/:id/direcciones` | Agregar una dirección al array de un usuario (`$push`) |

### Restaurantes

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/restaurantes` | Obtener todos los restaurantes |
| `GET` | `/restaurantes/search?categoria=pizza&limit=5&skip=0` | Búsqueda avanzada con filtro, sort, skip, limit y proyección |
| `GET` | `/restaurantes/categorias` | Obtener lista de categorías únicas (`distinct`) |

### Órdenes

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/ordenes` | Crear una nueva orden |
| `PUT` | `/ordenes/estado-masivo` | Actualizar el estado de múltiples órdenes a la vez |
| `DELETE` | `/ordenes/:id` | Eliminar una orden por ID |
| `DELETE` | `/ordenes/masivo?estado=cancelada` | Eliminar múltiples órdenes por estado |
| `GET` | `/ordenes/count?estado=pendiente` | Contar órdenes (filtro opcional por estado) |

### Reseñas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/resenas` | Crear una reseña (con transacción) |

### Analíticas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/analytics/top-platillos` | Top 5 platillos más pedidos (aggregation pipeline) |
| `GET` | `/analytics/top-usuarios` | Top 10 usuarios que más han gastado (aggregation pipeline) |

### Archivos (GridFS)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/archivos` | Subir un archivo (multipart/form-data, campo `file`) |
| `GET` | `/archivos/:id` | Descargar un archivo por su ID |

### Operaciones Masivas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/bulk/ordenes?cantidad=50000` | Generar órdenes ficticias masivas con BulkWrite (máx. 100,000) |

---

## Descripción detallada de cada archivo

---

### `main.go`

Punto de entrada de la aplicación. Realiza tres acciones en orden:

1. **Conecta a MongoDB Atlas** llamando a `config.ConnectDB()` con la URI de conexión y el nombre de la base de datos (`Proyecto1-BD2`).
2. **Crea el router de Gin** con `gin.Default()` (incluye middleware de logger y recovery por defecto).
3. **Registra las rutas** con `routes.SetupRoutes()` y levanta el servidor en el puerto `:8080`.

---

### `config/mongo.go`

Gestiona la conexión a MongoDB. Expone la variable global `DB` de tipo `*mongo.Database` que es usada por todos los servicios.

**Función `ConnectDB(uri, dbName string)`:**
- Crea las opciones del cliente con la URI de Atlas.
- Abre la conexión con un timeout de 10 segundos.
- Hace un `Ping` para verificar que la conexión es exitosa.
- Asigna la base de datos a la variable global `DB`.
- Si ocurre algún error, el programa termina con `log.Fatal`.

---

### `models/`

Define las estructuras (structs) que representan los documentos almacenados en MongoDB. Usan etiquetas `bson` para el mapeo con MongoDB y `json` para las respuestas/peticiones HTTP.

#### `usuario.go`

```
Usuario
├── ID            (ObjectID)     — Identificador único de MongoDB
├── Nombre        (string)       — Nombre completo
├── Correo        (string)       — Dirección de correo electrónico
├── Telefono      (string)       — Número de teléfono
├── Direcciones   ([]Direccion)  — Lista de direcciones de entrega
└── FechaRegistro (time.Time)    — Fecha de registro (asignada automáticamente)

Direccion (struct embebido)
├── Calle         (string)
├── Zona          (int)
├── Ciudad        (string)
└── Coordenadas   (string)
```

Un usuario puede tener **múltiples direcciones de entrega**.

#### `restaurante.go`

```
Restaurante
├── ID                   (ObjectID)   — Identificador único
├── Nombre               (string)     — Nombre del restaurante
├── Ubicacion            (Ubicacion)  — Coordenadas GeoJSON
├── Categorias           ([]string)   — Tipos de cocina (ej: "italiano", "pizza")
├── CalificacionPromedio (float64)    — Promedio calculado automáticamente al recibir reseñas
└── FechaCreacion        (time.Time)  — Fecha de registro

Ubicacion (GeoJSON Point)
├── Type        (string)     — Siempre "Point"
└── Coordinates ([]float64)  — [longitud, latitud]
```

La ubicación sigue el formato **GeoJSON**, lo que permite queries geoespaciales en MongoDB.

#### `orden.go`

```
Orden
├── ID            (ObjectID)    — Identificador único
├── UsuarioID     (ObjectID)    — Referencia al usuario que realizó el pedido
├── RestauranteID (ObjectID)    — Referencia al restaurante
├── Items         ([]ItemOrden) — Lista de artículos pedidos
├── Estado        (string)      — Estado del pedido ("pendiente", "en camino", "entregada", "cancelada")
├── Total         (float64)     — Total calculado automáticamente
├── FechaPedido   (time.Time)   — Fecha/hora del pedido
├── Direccion     (Direccion)   — Dirección de entrega
└── Resenado      (bool)        — Indica si ya se dejó reseña de este pedido

ItemOrden (struct embebido)
├── ArticuloID     (ObjectID) — Referencia al artículo del menú
├── Nombre         (string)   — Nombre del artículo (desnormalizado)
├── Cantidad       (int)      — Cantidad pedida
└── PrecioUnitario (float64)  — Precio al momento del pedido
```

El campo `Resenado` evita que un mismo pedido tenga múltiples reseñas; se actualiza a `true` automáticamente al crear una reseña.

#### `resena.go`

```
Resena
├── ID            (ObjectID) — Identificador único
├── UsuarioID     (string)   — ID del usuario que escribe la reseña
├── RestauranteID (string)   — ID del restaurante reseñado
├── PedidoID      (string)   — ID del pedido asociado (garantiza compra previa)
├── Calificacion  (int)      — Puntaje numérico (ej: 1-5)
├── Comentario    (string)   — Texto de la reseña
└── FechaResena   (time.Time)— Fecha/hora de la reseña
```

#### `articulo_menu.go`

```
ArticuloMenu
├── ID            (ObjectID) — Identificador único
├── RestauranteID (ObjectID) — Restaurante al que pertenece
├── Nombre        (string)   — Nombre del platillo
├── Descripcion   (string)   — Descripción del platillo
├── Precio        (float64)  — Precio unitario
├── Disponible    (bool)     — Si está disponible para pedidos
└── Categoria     (string)   — Categoría (ej: "entrada", "bebida", "postre")
```

---

### `services/`

Contiene toda la lógica de negocio. Cada función accede a MongoDB a través de la variable global `config.DB`. Todos los contextos tienen un timeout de 5 segundos para evitar operaciones colgadas.

#### `usuario_service.go`

- **`CreateUsuario(usuario)`** — Asigna `FechaRegistro = time.Now()` antes de insertar el documento en la colección `usuarios`.
- **`GetUsuarios()`** — Retorna todos los usuarios de la colección con `Find(ctx, bson.M{})`.
- **`GetUsuarioByID(id)`** — Busca un usuario por su `ObjectID` convertido desde string hexadecimal.
- **`AgregarDireccionUsuario(usuarioID, direccion)`** — Usa `$push` para agregar una nueva dirección al array `direcciones` del usuario sin reemplazar las existentes.

#### `restaurante_service.go`

- **`CreateRestaurante(restaurante)`** — Asigna `FechaCreacion = time.Now()` e inserta en `restaurantes`.
- **`GetRestaurantes()`** — Retorna todos los restaurantes.
- **`GetRestauranteByID(id)`** — Busca un restaurante por ID.
- **`BuscarRestaurantesAvanzado(categoria, limit, skip)`** — Búsqueda con filtro opcional por categoría, ordenada por `calificacion_promedio` descendente, con paginación (skip/limit) y proyección (solo devuelve `nombre`, `calificacion_promedio` y `categorias`).
- **`ObtenerCategoriasUnicas()`** — Ejecuta `Distinct` sobre el campo `categorias` para devolver los valores únicos disponibles.

#### `orden_service.go`

- **`CreateOrden(orden)`** — Calcula el `total` automáticamente (`cantidad × precio_unitario`), asigna `FechaPedido`, `Estado = "pendiente"` y `Resenado = false`.
- **`ActualizarEstadoOrdenesMasivo(estadoActual, nuevoEstado)`** — Usa `UpdateMany` para cambiar el estado de todas las órdenes que coincidan con el filtro. Devuelve el conteo de documentos modificados.
- **`EliminarOrden(id)`** — Elimina una orden individual por su `ObjectID` con `DeleteOne`.
- **`EliminarOrdenesPorEstado(estado)`** — Elimina múltiples órdenes con `DeleteMany` filtrando por estado. Devuelve el conteo de documentos eliminados.
- **`ContarOrdenesPorEstado(estado)`** — Usa `CountDocuments` para contar órdenes; si `estado` está vacío, cuenta todas.

#### `resena_service.go`

Esta es la función más compleja del proyecto. Utiliza una **transacción de MongoDB** para garantizar la consistencia de los datos.

**`CrearResenaTransaccion(resena)`** ejecuta tres operaciones de forma atómica:

1. **Inserta la reseña** en la colección `resenas`.
2. **Marca la orden como reseñada** (`resenado: true`) en la colección `ordenes` usando el `pedido_id`.
3. **Recalcula el promedio** de calificaciones del restaurante mediante un aggregation pipeline (`$match` + `$group` con `$avg`) y actualiza el campo `calificacion_promedio` en la colección `restaurantes`.

Si cualquiera de los tres pasos falla, **toda la transacción se revierte** (rollback). Esto garantiza que nunca haya un estado inconsistente (ej: reseña insertada pero promedio no actualizado).

> **Nota:** Las transacciones de MongoDB requieren que el servidor sea un **Replica Set** o un clúster de Atlas, que es el caso aquí.

#### `analytics_service.go`

Implementa **MongoDB Aggregation Pipelines** para extraer métricas del negocio.

**`TopPlatillos()`** — Pipeline sobre la colección `ordenes`:

| Etapa | Operación |
|-------|-----------|
| `$match` | Solo órdenes con `estado: "entregada"` |
| `$unwind` | Descompone el array `items` en documentos individuales |
| `$group` | Agrupa por `restaurante_id` + `articulo_id`, suma `cantidad` e `ingresos` |
| `$sort` | Ordena por `cantidad_total` descendente |
| `$limit` | Limita a los 5 platillos más pedidos |

**`TopUsuarios()`** — Pipeline sobre la colección `ordenes`:

| Etapa | Operación |
|-------|-----------|
| `$match` | Solo órdenes con `estado: "entregada"` |
| `$group` | Agrupa por `usuario_id`, suma `total` y cuenta pedidos |
| `$sort` | Ordena por `total_gastado` descendente |
| `$limit` | Limita a los 10 usuarios |
| `$lookup` | Join con la colección `usuarios` para obtener nombre y correo |
| `$unwind` | Descompone el array del join |
| `$project` | Selecciona los campos a devolver |

#### `archivo_service.go`

Gestiona archivos usando **MongoDB GridFS**, que divide los archivos en chunks y los almacena en la base de datos.

- **`SubirArchivo(nombreArchivo, fileStream)`** — Abre un stream de subida en el bucket GridFS, copia el contenido del `io.Reader` recibido y devuelve el `ObjectID` generado como string. El tamaño de chunk por defecto es 255 KB.
- **`DescargarArchivo(fileID, writer)`** — Convierte el ID hex a `ObjectID`, busca el archivo en GridFS y escribe el contenido directamente en el `io.Writer` proporcionado (el `ResponseWriter` de Gin).

#### `bulk_service.go`

Genera e inserta órdenes ficticias masivamente usando `BulkWrite`.

**`GenerarOrdenesMasivas(cantidad int)`:**
- Genera `cantidad` documentos de órdenes con datos aleatorios (estado, total, fecha de los últimos 30 días).
- Acumula todos los modelos como `InsertOneModel` y los envía en **una sola operación de red** con `BulkWrite`.
- Usa `Ordered: false` para que los fallos individuales no detengan las demás inserciones.
- Timeout de 30 segundos para tolerar el volumen de datos.
- Límite máximo de 100,000 órdenes por petición para evitar timeouts.

---

### `handlers/`

Los handlers son funciones de Gin que actúan como **controladores HTTP**. Reciben la petición (`*gin.Context`), validan el cuerpo JSON, llaman al servicio correspondiente y devuelven una respuesta JSON.

#### `usuario_handler.go`
- **`CreateUsuario`** — Deserializa el body JSON a `models.Usuario`, llama a `services.CreateUsuario` y devuelve `200 OK`.
- **`AddDireccionUsuario`** — Extrae el `:id` de la URL y el body JSON como `models.Direccion`. Llama a `services.AgregarDireccionUsuario` para hacer `$push` en el array.

#### `restaurante_handler.go`
- **`GetRestaurantes`** — Sin body; devuelve el array completo de restaurantes.
- **`SearchRestaurantes`** — Lee los query params `categoria`, `limit` y `skip`, llama a `services.BuscarRestaurantesAvanzado` y devuelve los resultados paginados.
- **`GetCategorias`** — Llama a `services.ObtenerCategoriasUnicas` y devuelve `{"categorias_disponibles": [...]}`.

#### `orden_handler.go`
- **`CreateOrden`** — Deserializa el body JSON a `models.Orden` y llama a `services.CreateOrden`.
- **`UpdateOrdenesMasivo`** — Recibe `{"estado_actual": "...", "nuevo_estado": "..."}` y llama a `services.ActualizarEstadoOrdenesMasivo`. Devuelve el conteo de documentos modificados.
- **`DeleteOrden`** — Extrae el `:id` de la URL y llama a `services.EliminarOrden`.
- **`DeleteOrdenesMasivo`** — Lee el query param `estado` y llama a `services.EliminarOrdenesPorEstado`. Devuelve el conteo de eliminados.
- **`GetCountOrdenes`** — Lee el query param `estado` (opcional) y llama a `services.ContarOrdenesPorEstado`.

#### `resena_handler.go`
- **`CreateResena`** — Deserializa el body JSON a `models.Resena` y llama a `services.CrearResenaTransaccion` (operación transaccional).

#### `analytics_handler.go`
- **`TopPlatillos`** y **`TopUsuarios`** — Sin body (GET). Llaman a sus respectivos servicios y devuelven los resultados del pipeline directamente.

#### `archivo_handler.go`
- **`UploadImagen`** — Lee el archivo del campo `file` en un formulario `multipart/form-data` y llama a `services.SubirArchivo`. Devuelve el `file_id` y el nombre del archivo.
- **`DownloadImagen`** — Extrae el `:id` de la URL, configura headers de descarga y llama a `services.DescargarArchivo` escribiendo directamente en el `ResponseWriter`.

#### `bulk_handler.go`
- **`InsertBulkOrdenes`** — Lee el query param `cantidad` (default 50,000, máx. 100,000) y llama a `services.GenerarOrdenesMasivas`. Devuelve el conteo de documentos creados.

---

### `routes/routes.go`

Registra todos los endpoints del servidor en el router de Gin:

```go
POST   /usuarios                       → handlers.CreateUsuario
PUT    /usuarios/:id/direcciones       → handlers.AddDireccionUsuario

GET    /restaurantes                   → handlers.GetRestaurantes
GET    /restaurantes/search            → handlers.SearchRestaurantes
GET    /restaurantes/categorias        → handlers.GetCategorias

POST   /ordenes                        → handlers.CreateOrden
PUT    /ordenes/estado-masivo          → handlers.UpdateOrdenesMasivo
DELETE /ordenes/:id                    → handlers.DeleteOrden
DELETE /ordenes/masivo                 → handlers.DeleteOrdenesMasivo
GET    /ordenes/count                  → handlers.GetCountOrdenes

POST   /resenas                        → handlers.CreateResena

GET    /analytics/top-platillos        → handlers.TopPlatillos
GET    /analytics/top-usuarios         → handlers.TopUsuarios

POST   /archivos                       → handlers.UploadImagen
GET    /archivos/:id                   → handlers.DownloadImagen

POST   /bulk/ordenes                   → handlers.InsertBulkOrdenes
```

---

### `utils/bulk.go`

Utilidad auxiliar para **inserción masiva** de órdenes usando `BulkWrite` de MongoDB.

**`BulkInsertOrdenes(ordenes []models.Orden)`:**
- Itera sobre un slice de órdenes y genera un `InsertOneModel` por cada una.
- Acumula todos los modelos en un slice de `mongo.WriteModel`.
- Envía todas las inserciones en **una sola operación de red** con `collection.BulkWrite`.
- Asigna `FechaPedido = time.Now()` y `Estado = "entregado"` a cada orden.
- Timeout de 10 segundos.

---

## Colecciones en MongoDB

El proyecto trabaja con las siguientes colecciones dentro de la base de datos `Proyecto1-BD2`:

| Colección | Descripción |
|-----------|-------------|
| `usuarios` | Usuarios registrados en el sistema |
| `restaurantes` | Restaurantes disponibles |
| `ordenes` | Pedidos realizados por usuarios |
| `resenas` | Reseñas escritas por usuarios sobre restaurantes |
| `articulos_menu` | Platillos/artículos del menú de cada restaurante |
| `fs.files` / `fs.chunks` | Archivos almacenados en GridFS |

---

## Ejemplos de uso (peticiones HTTP)

### Crear un usuario

```http
POST /usuarios
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "correo": "juan@example.com",
  "telefono": "50212345678",
  "direcciones": [
    {
      "calle": "6 Avenida 10-50",
      "zona": 10,
      "ciudad": "Guatemala",
      "coordenadas": "14.6099,-90.5285"
    }
  ]
}
```

### Agregar una dirección a un usuario

```http
PUT /usuarios/64a1b2c3d4e5f6789012345/direcciones
Content-Type: application/json

{
  "calle": "12 Calle 5-10",
  "zona": 1,
  "ciudad": "Guatemala",
  "coordenadas": "14.6407,-90.5133"
}
```

### Crear una orden

```http
POST /ordenes
Content-Type: application/json

{
  "usuario_id": "64a1b2c3d4e5f6789012345",
  "restaurante_id": "64a1b2c3d4e5f6789012346",
  "items": [
    {
      "articulo_id": "64a1b2c3d4e5f6789012347",
      "nombre": "Pizza Margherita",
      "cantidad": 2,
      "precio_unitario": 75.00
    }
  ],
  "direccion_entrega": {
    "calle": "6 Avenida 10-50",
    "zona": 10,
    "ciudad": "Guatemala",
    "coordenadas": "14.6099,-90.5285"
  }
}
```

> Los campos `total`, `estado`, `fecha_pedido` y `resenado` son calculados/asignados automáticamente por el servidor.

### Actualizar estado de órdenes masivamente

```http
PUT /ordenes/estado-masivo
Content-Type: application/json

{
  "estado_actual": "pendiente",
  "nuevo_estado": "entregada"
}
```

### Eliminar órdenes por estado

```http
DELETE /ordenes/masivo?estado=cancelada
```

### Contar órdenes

```http
GET /ordenes/count?estado=pendiente
```

### Búsqueda avanzada de restaurantes

```http
GET /restaurantes/search?categoria=pizza&limit=5&skip=0
```

### Crear una reseña

```http
POST /resenas
Content-Type: application/json

{
  "usuario_id": "64a1b2c3d4e5f6789012345",
  "restaurante_id": "64a1b2c3d4e5f6789012346",
  "pedido_id": "64a1b2c3d4e5f6789012348",
  "calificacion": 5,
  "comentario": "Excelente comida, llegó rápido y caliente."
}
```

### Subir un archivo

```http
POST /archivos
Content-Type: multipart/form-data

(Body → form-data → Key: "file", Type: File)
```

### Descargar un archivo

```http
GET /archivos/64a1b2c3d4e5f6789012349
```

### Consultar analíticas

```http
GET /analytics/top-platillos
GET /analytics/top-usuarios
```

### Inserción masiva de órdenes

```http
POST /bulk/ordenes?cantidad=50000
```

---

## Flujo de una reseña (transacción)

```
Cliente envía POST /resenas
          │
          ▼
   Handler valida JSON
          │
          ▼
   Service inicia sesión + transacción en MongoDB
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

---

## Notas de diseño

- **Desnormalización**: Los items de una orden guardan el `nombre` y `precio_unitario` directamente, en lugar de solo una referencia. Esto es una práctica estándar en MongoDB para evitar joins costosos y preservar el precio histórico al momento del pedido.
- **Transacciones**: Solo la creación de reseñas usa transacción completa porque involucra modificar tres colecciones que deben mantenerse consistentes entre sí.
- **Aggregation Pipelines**: Las analíticas se resuelven completamente en el lado del servidor MongoDB, sin procesar datos en la aplicación Go, aprovechando al máximo el motor de MongoDB.
- **Timeouts de contexto**: Todas las operaciones usan `context.WithTimeout` para evitar que una consulta lenta bloquee el servidor indefinidamente.
- **GridFS**: Los archivos se almacenan directamente en MongoDB usando GridFS, que divide el contenido en chunks de 255 KB y los referencia mediante un `ObjectID`.
- **BulkWrite**: Las operaciones masivas usan `BulkWrite` con `Ordered: false` para maximizar el rendimiento y tolerar fallos individuales sin detener el resto de inserciones.
