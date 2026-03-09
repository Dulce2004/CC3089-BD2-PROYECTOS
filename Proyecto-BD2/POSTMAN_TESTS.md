# POSTMAN TESTS — Proyecto BD2 API

Base URL: `http://localhost:8080`

> **Importante:** Para rutas protegidas, primero haz login y copia el token en el header:
> `Authorization: Bearer <token>`

---

## 1. AUTH

### POST /auth/register
Registra un nuevo usuario. La contraseña se hashea con bcrypt. Usa el índice único sobre `correo`.

```
POST http://localhost:8080/auth/register
Content-Type: application/json

{
  "nombre": "María García",
  "correo": "maria@example.com",
  "contrasena": "miPassword123",
  "telefono": "5550001234"
}
```

**Respuesta esperada (201):**
```json
{
  "message": "Usuario registrado exitosamente"
}
```

**Error duplicado (400):**
```json
{
  "error": "E11000 duplicate key error collection: ... index: correo_1 ..."
}
```

---

### POST /auth/login
Inicia sesión y devuelve un JWT válido por 24h.

```
POST http://localhost:8080/auth/login
Content-Type: application/json

{
  "correo": "maria@example.com",
  "contrasena": "miPassword123"
}
```

**Respuesta esperada (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "64abc123...",
    "nombre": "María García",
    "correo": "maria@example.com",
    "telefono": "5550001234",
    "direcciones": [],
    "fecha_registro": "2026-03-08T18:00:00Z"
  }
}
```

---

## 2. USUARIOS (requieren JWT)

### GET /usuarios/perfil
Obtiene el perfil del usuario autenticado.

```
GET http://localhost:8080/usuarios/perfil
Authorization: Bearer <token>
```

**Respuesta esperada (200):**
```json
{
  "id": "64abc123...",
  "nombre": "María García",
  "correo": "maria@example.com",
  "telefono": "5550001234",
  "direcciones": [],
  "fecha_registro": "2026-03-08T18:00:00Z"
}
```

---

### PUT /usuarios/perfil
Actualiza datos del perfil (no permite cambiar correo ni contraseña).

```
PUT http://localhost:8080/usuarios/perfil
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "María García López",
  "telefono": "5559998877"
}
```

**Respuesta esperada (200):**
```json
{
  "message": "Perfil actualizado"
}
```

---

### PUT /usuarios/:id/direcciones
Agrega una dirección al array del usuario (`$push`).

```
PUT http://localhost:8080/usuarios/64abc123.../direcciones
Authorization: Bearer <token>
Content-Type: application/json

{
  "calle": "6a Avenida 13-01",
  "zona": 10,
  "ciudad": "Guatemala",
  "coordenadas": "14.5994, -90.5614"
}
```

**Respuesta esperada (200):**
```json
{
  "message": "Dirección agregada correctamente al arreglo"
}
```

---

## 3. RESTAURANTES

### POST /restaurantes
Crea un restaurante con ubicación GeoJSON (necesita índice 2dsphere).

```
POST http://localhost:8080/restaurantes
Content-Type: application/json

{
  "nombre": "La Italiana",
  "categorias": ["italiana", "pasta", "pizza"],
  "ubicacion": {
    "type": "Point",
    "coordinates": [-90.5061, 14.6408]
  }
}
```

**Respuesta esperada (201):**
```json
{
  "message": "Restaurante creado"
}
```

---

### GET /restaurantes
Lista todos los restaurantes.

```
GET http://localhost:8080/restaurantes
```

**Respuesta esperada (200):**
```json
[
  {
    "id": "64def456...",
    "nombre": "La Italiana",
    "ubicacion": {
      "type": "Point",
      "coordinates": [-90.5061, 14.6408]
    },
    "categorias": ["italiana", "pasta", "pizza"],
    "calificacion_promedio": 0,
    "fecha_creacion": "2026-03-08T18:05:00Z"
  }
]
```

---

### GET /restaurantes/:id
Obtiene un restaurante por su ID.

```
GET http://localhost:8080/restaurantes/64def456...
```

---

### PUT /restaurantes/:id
Actualiza un restaurante.

```
PUT http://localhost:8080/restaurantes/64def456...
Content-Type: application/json

{
  "nombre": "La Italiana Premium",
  "categorias": ["italiana", "pasta", "pizza", "postres"]
}
```

**Respuesta esperada (200):**
```json
{
  "message": "Restaurante actualizado"
}
```

---

### DELETE /restaurantes/:id
Elimina un restaurante.

```
DELETE http://localhost:8080/restaurantes/64def456...
```

**Respuesta esperada (200):**
```json
{
  "message": "Restaurante eliminado"
}
```

---

## 4. BÚSQUEDAS (usan índices)

### GET /restaurantes/buscar?nombre=
Búsqueda por nombre con regex (usa índice sobre `nombre`).

```
GET http://localhost:8080/restaurantes/buscar?nombre=italiana
```

**Respuesta esperada (200):**
```json
[
  {
    "id": "64def456...",
    "nombre": "La Italiana",
    ...
  }
]
```

---

### GET /restaurantes/categoria?cat=
Búsqueda por categoría — **usa el índice multikey sobre `categorias[]`**.

```
GET http://localhost:8080/restaurantes/categoria?cat=pizza
```

**Respuesta esperada (200):**
```json
[
  {
    "id": "64def456...",
    "nombre": "La Italiana",
    "categorias": ["italiana", "pasta", "pizza"]
  }
]
```

---

### GET /restaurantes/cerca?lat=&lng=&dist=
Búsqueda geoespacial con `$near` — **usa el índice 2dsphere**. `dist` en metros.

```
GET http://localhost:8080/restaurantes/cerca?lat=14.6408&lng=-90.5061&dist=3000
```

**Respuesta esperada (200):**
```json
[
  {
    "nombre": "La Italiana",
    "ubicacion": {
      "type": "Point",
      "coordinates": [-90.5061, 14.6408]
    }
  }
]
```

---

### GET /restaurantes/search
Búsqueda avanzada con filtro, sort, skip, limit y proyección.

```
GET http://localhost:8080/restaurantes/search?categoria=pizza&limit=5&skip=0
```

---

### GET /restaurantes/categorias
Distinct de todas las categorías existentes.

```
GET http://localhost:8080/restaurantes/categorias
```

**Respuesta esperada (200):**
```json
{
  "categorias_disponibles": ["italiana", "pasta", "pizza", "sushi", "mexicana"]
}
```

---

## 5. MENÚ / PLATILLOS

### POST /restaurantes/:id/menu
Crea un platillo en el menú de un restaurante.

```
POST http://localhost:8080/restaurantes/64def456.../menu
Content-Type: application/json

{
  "nombre": "Pizza Margherita",
  "descripcion": "Pizza clásica con tomate y mozzarella",
  "precio": 75.00,
  "categoria": "pizza"
}
```

**Respuesta esperada (201):**
```json
{
  "message": "Artículo creado exitosamente"
}
```

---

### GET /restaurantes/:id/menu
Obtiene todos los platillos de un restaurante.

```
GET http://localhost:8080/restaurantes/64def456.../menu
```

**Respuesta esperada (200):**
```json
[
  {
    "id": "64ghi789...",
    "restaurante_id": "64def456...",
    "nombre": "Pizza Margherita",
    "descripcion": "Pizza clásica con tomate y mozzarella",
    "precio": 75,
    "disponible": true,
    "categoria": "pizza"
  }
]
```

---

### PUT /menu/:id
Actualiza un platillo.

```
PUT http://localhost:8080/menu/64ghi789...
Content-Type: application/json

{
  "precio": 80.00,
  "disponible": false
}
```

**Respuesta esperada (200):**
```json
{
  "message": "Artículo actualizado"
}
```

---

### DELETE /menu/:id
Elimina un platillo.

```
DELETE http://localhost:8080/menu/64ghi789...
```

**Respuesta esperada (200):**
```json
{
  "message": "Artículo eliminado"
}
```

---

## 6. ÓRDENES (requieren JWT)

### POST /ordenes
Crea una orden. El total se calcula automáticamente.

```
POST http://localhost:8080/ordenes
Authorization: Bearer <token>
Content-Type: application/json

{
  "usuario_id": "64abc123...",
  "restaurante_id": "64def456...",
  "items": [
    {
      "articulo_id": "64ghi789...",
      "nombre": "Pizza Margherita",
      "cantidad": 2,
      "precio_unitario": 75.00
    }
  ],
  "direccion_entrega": {
    "calle": "6a Avenida 13-01",
    "zona": 10,
    "ciudad": "Guatemala",
    "coordenadas": "14.5994, -90.5614"
  }
}
```

**Respuesta esperada (201):**
```json
{
  "message": "Orden creada"
}
```

---

### GET /ordenes
Lista las órdenes del usuario autenticado.

```
GET http://localhost:8080/ordenes
Authorization: Bearer <token>
```

---

### GET /ordenes/:id
Obtiene una orden por su ID.

```
GET http://localhost:8080/ordenes/64jkl012...
Authorization: Bearer <token>
```

---

### PUT /ordenes/:id/estado
Actualiza el estado de una orden individual.

```
PUT http://localhost:8080/ordenes/64jkl012.../estado
Authorization: Bearer <token>
Content-Type: application/json

{
  "estado": "en camino"
}
```

**Estados válidos:** `pendiente`, `en camino`, `entregada`, `cancelada`

**Respuesta esperada (200):**
```json
{
  "message": "Estado actualizado"
}
```

---

### DELETE /ordenes/:id
Elimina una orden.

```
DELETE http://localhost:8080/ordenes/64jkl012...
Authorization: Bearer <token>
```

---

### GET /restaurantes/:id/ordenes
Lista las órdenes de un restaurante ordenadas por fecha — **usa el índice compuesto `(restaurante_id, fecha)`**.

```
GET http://localhost:8080/restaurantes/64def456.../ordenes
```

---

### GET /ordenes/count?estado=
Cuenta órdenes por estado.

```
GET http://localhost:8080/ordenes/count?estado=pendiente
Authorization: Bearer <token>
```

**Respuesta esperada (200):**
```json
{
  "total_ordenes": 12,
  "estado_filtrado": "pendiente"
}
```

---

### PUT /ordenes/estado-masivo
Actualiza el estado de múltiples órdenes a la vez.

```
PUT http://localhost:8080/ordenes/estado-masivo
Authorization: Bearer <token>
Content-Type: application/json

{
  "estado_actual": "pendiente",
  "nuevo_estado": "en camino"
}
```

**Respuesta esperada (200):**
```json
{
  "message": "Órdenes actualizadas",
  "modificadas": 5
}
```

---

### DELETE /ordenes/masivo?estado=
Elimina todas las órdenes con un estado específico.

```
DELETE http://localhost:8080/ordenes/masivo?estado=cancelada
Authorization: Bearer <token>
```

**Respuesta esperada (200):**
```json
{
  "message": "Órdenes eliminadas",
  "eliminadas": 3
}
```

---

## 7. RESEÑAS

### POST /resenas
Crea una reseña con transacción MongoDB (inserta reseña + marca orden + actualiza promedio).

```
POST http://localhost:8080/resenas
Content-Type: application/json

{
  "usuario_id": "64abc123...",
  "restaurante_id": "64def456...",
  "pedido_id": "64jkl012...",
  "calificacion": 5,
  "comentario": "Excelente servicio y comida deliciosa"
}
```

**Respuesta esperada (200):**
```json
{
  "message": "reseña creada con transacción"
}
```

---

## 8. ANALYTICS

### GET /analytics/top-platillos
Top 5 platillos más vendidos (agregación con `$unwind` + `$group`).

```
GET http://localhost:8080/analytics/top-platillos
```

**Respuesta esperada (200):**
```json
[
  {
    "_id": {
      "restaurante": "64def456...",
      "articulo": "64ghi789..."
    },
    "cantidad_total": 45,
    "ingresos": 3375
  }
]
```

---

### GET /analytics/top-usuarios
Top 10 usuarios con mayor gasto total (agregación con `$lookup`).

```
GET http://localhost:8080/analytics/top-usuarios
```

**Respuesta esperada (200):**
```json
[
  {
    "_id": "64abc123...",
    "nombre": "María García",
    "correo": "maria@example.com",
    "total_gastado": 1250.50,
    "cantidad_pedidos": 8
  }
]
```

---

## 9. ARCHIVOS (GridFS)

### POST /archivos
Sube un archivo de imagen. En Postman usar **Body → form-data → Key: `file` (tipo File)**.

```
POST http://localhost:8080/archivos
Body: form-data
  Key: file  |  Type: File  |  Value: [selecciona un archivo]
```

**Respuesta esperada (200):**
```json
{
  "message": "Archivo subido exitosamente",
  "file_id": "64mno345...",
  "file_name": "foto.jpg"
}
```

---

### GET /archivos/:id
Descarga/visualiza un archivo por su ID de GridFS.

```
GET http://localhost:8080/archivos/64mno345...
```

Responde con el contenido binario del archivo (image/octet-stream).

---

## 10. OPERACIONES MASIVAS

### POST /bulk/ordenes?cantidad=
Genera N órdenes de prueba con BulkWrite (por defecto 50,000, máximo 100,000).

```
POST http://localhost:8080/bulk/ordenes?cantidad=1000
```

**Respuesta esperada (200):**
```json
{
  "message": "Operación Bulk completada",
  "documentos_creados": 1000,
  "status": "Requerimiento de volumen de datos cumplido"
}
```

---

## Flujo de prueba recomendado

1. `POST /auth/register` → crear usuario
2. `POST /auth/login` → obtener token
3. `POST /restaurantes` → crear restaurante (guardar el ID)
4. `POST /restaurantes/:id/menu` → crear platillo (guardar el ID)
5. `POST /ordenes` → crear orden (con JWT, guardar el ID)
6. `GET /ordenes` → ver mis órdenes
7. `PUT /ordenes/:id/estado` → cambiar estado a "entregada"
8. `POST /resenas` → crear reseña sobre la orden
9. `GET /restaurantes/cerca?lat=14.6408&lng=-90.5061&dist=5000` → buscar cercanos
10. `GET /analytics/top-platillos` → ver estadísticas
