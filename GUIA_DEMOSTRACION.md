# 🎯 GUÍA DE DEMOSTRACIÓN PARA EL EVALUADOR

## Introducción
Esta es una guía paso a paso para demostrarle al evaluador que tu proyecto cumple con **TODOS los requisitos de evaluación** usando el frontend interactivo.

---

## 🚀 PASO 0: PREPARACIÓN INICIAL

### Verificar que todo está corriendo
```bash
# En la carpeta raíz del proyecto
docker-compose ps
```

**Deberías ver:**
```
NAME               STATUS
backend_app        Up
frontend_app       Up
```

### Acceder a la aplicación
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8080
- **Postman/Curl:** Para ver requests en crudo (opcional)

---

## 📊 DEMOSTRACIÓN COMPLETA POR CRITERIO

### ✅ **CRITERIO 1: ÍNDICES (5 tipos)**

**Qué mostrar:** Los 4 índices están implementados en la base de datos (transparente para el usuario)

#### Demostración Indirecta en Frontend:

**Índice 1 - ÚNICO (correo en usuarios):**
1. Ir a **Login** (http://localhost:3000)
2. Intentar registrarse dos veces con el MISMO correo:
   - Email: `juan@example.com`
   - Nombre: Juan
   - Contraseña: password123
   - Teléfono: 12345678
3. **Clic en REGISTER** → Primera vez: ✅ Éxito
4. **Intentar registrarse NUEVAMENTE** con el mismo correo
5. **Resultado esperado:** ❌ Error "Correo ya registrado" (El índice único lo evita)

**Qué dice el evaluador:** "El índice único evitó duplicados. ✓"

---

**Índice 2 - COMPUESTO (restaurante_id + fecha en órdenes):**
1. **Login** con cualquier usuario
2. Ir a **Orders** (menú lateral)
3. Ver que las órdenes están ordenas por:
   - Restaurante (agrupadas)
   - Fecha descendente
4. **Crear una nueva orden:**
   - Ir a **Restaurants**
   - Seleccionar un restaurante
   - Seleccionar artículos del menú
   - Crear orden
5. Volver a **Orders**
6. **Resultado:** La nueva orden aparece en la posición correcta (ordenada por restaurante+fecha)

**Qué dice el evaluador:** "Las órdenes se recuperan eficientemente usando el índice compuesto restaurante_id + fecha. ✓"

---

**Índice 3 - MULTIKEY (categorías en restaurantes):**
1. Ir a **Restaurants**
2. Ver filtro de **Categorías** en la parte superior
3. **Buscar por categoría:**
   - Click en categoría dropdown
   - Seleccionar "Pizzería" (o cualquier categoría)
4. **Resultado:** Se muestran solo restaurantes con esa categoría
5. **Cambiar categoría:**
   - Seleccionar "Comida Rápida"
   - Se actualiza al instante

**Qué dice el evaluador:** "La búsqueda por categorías es rápida/eficiente. Usa el índice multikey. ✓"

---

**Índice 4 - GEOESPACIAL (ubicación GeoJSON en restaurantes):**
1. Ir a **Restaurants**
2. Ver el campo **"Buscar cercanos"** o botón de localización
3. **Hacer clic en "Nearby"**
4. Sistema pide tu localización (o simula coordenadas)
5. **Resultado:** Muestra restaurantes más cercanos ordenados por distancia

**Qué dice el evaluador:** "Usa búsqueda geoespacial con el índice 2dsphere. ✓"

---

**Índice 5 - TEXTO (nombre en artículos del menú):**
1. Ir a **Menu**
2. Usar el campo de búsqueda en la parte superior de la página
3. Escribir un nombre de platillo: `"Pizza"` o `"Burger"`
4. **Resultado:** Solo aparecen artículos cuyo nombre contiene la palabra buscada
5. Esto utiliza el índice de texto en `articulos_menu.nombre` con operador `$text`

**Qué dice el evaluador:** "Usa búsqueda de texto completo con el índice TEXT. ✓"

---

**Validación de Índices con explain():**
1. Ir a **Analytics** (menú lateral)
2. Bajar hasta la sección **"Index Validation (explain)"**
3. **Click en "Run explain()"** botón azul
4. Esperar unos segundos...
5. **Ver la tabla de resultados con estas columnas:** Índice | Tipo | Colección | Filtro | Index Name | Stage | Usa Índice
6. **Confirmar que todos muestran ✓ (verde en columna "Usa Índice")**:
   - Unique - correo → `EXPRESS_IXSCAN` → ✓
   - Compound - restaurante+fecha → `IXSCAN` → ✓
   - Multikey - categorías → `IXSCAN` → ✓
   - 2dsphere - ubicacion → `GEO_NEAR_2DSPHERE` → ✓
   - Text - nombre → `TEXT` → ✓
7. **Endpoint subyacente:** `GET /analytics/explain-indices` — ejecuta `explain("queryPlanner")` contra MongoDB para cada índice

**Qué dice el evaluador:** "Ejecutó explain() y comprobó que MongoDB usa los índices en su query planner. ✓"

---

### ✅ **CRITERIO 2: CRUD - DOCUMENTOS EMBEBIDOS**

#### Demostración:

**Embebido 1 - ItemOrden (en Orden):**
1. Ir a **Menu**
2. Ver artículos del menú con:
   - Nombre ✓
   - Precio ✓
   - Categoría ✓
3. Ir a **Orders** → Crear nueva orden
4. **Agregar múltiples items:**
   - Item 1: Pizza 5 unidades
   - Item 2: Bebida 2 unidades
   - Item 3: Postre 1 unidad
5. Ver **Total calculado:** suma de (cantidad × precio)
6. **Enviar orden**
7. **Resultado:** Orden creada con array de ItemOrden embebidos
8. Volver a ver la orden → Muestra todos los items

**Qué dice el evaluador:** "Los items están embebidos correctamente en la orden. ✓"

---

**Embebido 2 - Dirección (en Usuario y Orden):**
1. **Login**
2. Ir a **Orders** (menú lateral)
3. **Click en "New Order"** botón verde
4. Ver que aparece un **dropdown "Saved Addresses"** con tus direcciones guardadas
5. Seleccionar una dirección guardada:
   - ✅ Se auto-completan los campos: Calle, Zona, Ciudad
6. Alternativamente, puedes **ingresar dirección manualmente**:
   - Calle: "Calle Principal 123"
   - Zona: "5"
   - Ciudad: "Guatemala"
7. Seleccionar restaurante y items
8. **Click "Create Order"**
9. **Resultado:** Orden creada con la dirección embebida
10. Ver la orden en la lista y verificar que tiene la dirección correcta

**Qué dice el evaluador:** "Las direcciones se pueden seleccionar del array de direcciones del usuario o ingresar manualmente. Ambas se embeben correctamente en la orden. ✓"

---

**Embebido 3 - Ubicación GeoJSON (en Restaurante):**
1. Ir a **Restaurants**
2. Seleccionar un restaurante
3. Ver **"Location"** o **"Ubicación"** 
4. Mostrar mapa o coordenadas: `{type: "Point", coordinates: [lat, lng]}`

**Qué dice el evaluador:** "La ubicación está embebida como documento GeoJSON. ✓"

---

### ✅ **CRITERIO 3: CRUD - DOCUMENTOS REFERENCIADOS**

#### Demostración:

**Referencia 1 - Usuarios en Órdenes:**
1. Ir a **Dashboard**
2. Ver sección **"Top Users"**
3. Se muestran usuarios CON datos completos:
   - Nombre ✓
   - Correo ✓
   - Total gastado ✓
   - Cantidad de pedidos ✓
4. **Resultado:** Se hizo lookup de órdenes → usuarios

**Qué dice el evaluador:** "Se hizo un lookup (join) entre órdenes y usuarios. ✓"

---

**Referencia 2 - Restaurantes en Órdenes:**
1. Ir a **Orders**
2. Ver cada orden con datos del restaurante:
   - Nombre del restaurante ✓
   - Categoría ✓
3. Ir a **Analytics**
4. Ver **"Top Dishes"** con:
   - Nombre del restaurante ✓
   - Nombre del plato ✓
   - Cantidad vendida ✓

**Qué dice el evaluador:** "Se hizo lookup entre órdenes y restaurantes. ✓"

---

### ✅ **CRITERIO 4: CRUD - CREAR (1 o VARIOS)**

#### Crear 1 documento:

**Crear 1 Usuario:**
1. Ir a **Login**
2. Register nuevo usuario
3. Llenar formulario
4. Clic **REGISTER**
5. **Resultado:** 1 usuario creado

**Crear 1 Orden:**
1. Ir a **Restaurants**
2. Entrar en un restaurante
3. Ir a **Menu**
4. Agregar items al carrito
5. **Crear orden**
6. **Resultado:** 1 orden creada

---

#### Crear VARIOS documentos (BULK):

**Esto es para mostrar al evaluador que pusiste generador de datos:**

1. **Abrir Postman o Terminal:**
```bash
curl -X POST http://localhost:8080/bulk/todo
```

2. **Response esperado:**
```json
{
  "message": "Bulk data inserted successfully",
  "usuarios": 200,
  "restaurantes": 150,
  "articulos": 1000,
  "ordenes": 50000,
  "resenas": 10000
}
```

3. **Volver al Frontend:**
   - Ir a **Dashboard**
   - Esperar a que cargue
   - Ver estadísticas actualizadas con miles de datos

4. **Mostrar en Orders:**
   - Ahora hay 50,000+ órdenes
   - Vista de paginación funciona
   - Páginas 1, 2, 3, etc.

**Qué dice el evaluador:** "¡Excelente! Implementó operaciones BULK para crear miles de documentos. +5 puntos. ✓"

---

### ✅ **CRITERIO 5: CRUD - LECTURA (Filtros, Proyecciones, Sort, Skip, Limit)**

#### Demostración:

**FILTROS:**
1. Ir a **Restaurants**
2. **Filtro por categoría:**
   - Click en dropdown "Categoría"
   - Seleccionar "Pizzería"
   - **Resultado:** Solo pizzerías se muestran
3. Cambiar nuevamente a "Comida Rápida"

**Qué dice el evaluador:** "Se implementaron filtros. ✓"

---

**PROYECCIONES:**
1. Ir a **Dashboard** → **Top Users**
2. Ver que se muestran SOLO estos campos:
   - Nombre
   - Correo
   - Total gastado
   - Cantidad de pedidos
   - ❌ NO muestra: contraseña, fechas, etc.
3. Ir a **Top Dishes**
4. Ver campos proyectados:
   - Nombre del restaurante
   - Nombre del plato
   - Cantidad total
   - ❌ NO muestra: ID interno, campos innecesarios

**Qué dice el evaluador:** "La proyección optimiza la respuesta. ✓"

---

**ORDENAMIENTO (SORT):**
1. Ir a **Dashboard** → **Top Dishes**
2. Ver ordenados por: **Mayor cantidad al menor**
3. Ir a **Top Users**
4. Ver ordenados por: **Mayor gasto al menor**
5. Ir a **Restaurants**
6. Ver pueden ordenar por: **Rating (de mayor a menor)**

**Qué dice el evaluador:** "Implementó ordenamiento descendente. ✓"

---

**SKIP y LIMIT (Paginación):**
1. Ir a **Orders** (después de generar bulk data)
2. Ver paginación abajo: **[1] [2] [3] [4] ...**
3. **Primera página:** Muestra órdenes 1-10
4. **Click en página 2:** Muestra órdenes 11-20
5. **Click en página 3:** Muestra órdenes 21-30
6. Ir a **Users** → Misma funcionalidad

**Cómo funciona:**
- Skip = (page - 1) × limit
- Limit = 10 documentos por página
- Página 1: skip(0) limit(10) → docs 1-10
- Página 2: skip(10) limit(10) → docs 11-20
- Página 3: skip(20) limit(10) → docs 21-30

**Qué dice el evaluador:** "Implementó paginación con skip y limit. ✓"

---

### ✅ **CRITERIO 6: CRUD - ACTUALIZAR 1**

#### Demostración:

1. Ir a **Users**
2. Seleccionar un usuario
3. **Click en "Edit"** o botón de edición
4. Cambiar campo: Nombre
   - De: "Juan"
   - A: "Juan Carlos"
5. **Guardar/Save**
6. **Resultado:** El nombre se actualizó - "Juan Carlos"
7. Ir a **Restaurants**
8. Seleccionar restaurante
9. Editar nombre o categoría
10. **Guardar** → Cambios reflejados

**Qué dice el evaluador:** "UpdateOne funciona. Actualiza un documento a la vez. ✓"

---

### ✅ **CRITERIO 7: CRUD - ACTUALIZAR VARIOS**

#### Demostración:

1. Ir a **Orders**
2. Ver órdenes con estado "Pendiente"
3. **Botón "Bulk Update Status"** o selector:
   - Seleccionar: Estado actual = "Pendiente"
   - Cambiar a: Estado nuevo = "En Preparación"
4. **Click "Update All"**
5. **Resultado:** Todas las órdenes "Pendiente" → "En Preparación"
6. **Verificar:**
   - Recargar página
   - Ver que TODAS las que eran "Pendiente" ahora dicen "En Preparación"

**Qué dice el evaluador:** "UpdateMany funciona. Actualiza múltiples documentos. ✓"

---

### ✅ **CRITERIO 8: CRUD - ELIMINAR 1**

#### Demostración:

1. Ir a **Orders**
2. Seleccionar una orden cualquiera
3. **Click en botón "Delete" (🗑️)**
4. **Confirmar eliminación:** "¿Estás seguro?"
5. **Click "Yes"**
6. **Resultado:**
   - Orden desaparece de la lista
   - Total de órdenes disminuye en 1
   - Mensaje: "Orden eliminada"

**Qué dice el evaluador:** "DeleteOne funciona. Elimina 1 documento. ✓"

---

### ✅ **CRITERIO 9: CRUD - ELIMINAR VARIOS**

#### Demostración:

1. Ir a **Orders**
2. Ver opciones de filter:
   - Estado: "Cancelada"
3. Mostrar botón **"Delete All Cancelled"** o similar
4. **Click en botón**
5. Sistema pide confirmación:
   - "¿Eliminar todas las órdenes canceladas? (N documentos)"
6. **Click "Confirm"**
7. **Resultado:**
   - Todas las órdenes "Cancelada" desaparecen
   - Contador de órdenes disminuye
   - Mensaje: "10 órdenes eliminadas"

**Qué dice el evaluador:** "DeleteMany funciona. Elimina múltiples documentos. ✓"

---

### ✅ **CRITERIO: ARRAYS - $addToSet y $pull en Categorías de Restaurantes**

#### Demostración $addToSet (agregar al array sin duplicados):
1. Ir a **Restaurants**
2. Buscar cualquier restaurante
3. **Click en el botón de edición (lápiz ✏️)**
4. En el modal de edición, bajar hasta la sección **"Manage Categories"**
5. Ver las categorías actuales mostradas como chips (etiquetas)
6. En el campo de texto, escribir una nueva categoría: `"Italiana"`
7. **Click "Add"**
8. **Resultado:** Se añade `"Italiana"` al array de categorías; si ya existía, MongoDB NO la duplica — usa `$addToSet`
9. Intentar agregar la misma categoría nuevamente → no se duplica

**Endpoint:** `POST /restaurantes/:id/categorias` → `$addToSet: {categorias: nueva}`

**Qué dice el evaluador:** "$addToSet agrega la categoría al array sin generar duplicados. ✓"

---

#### Demostración $pull (eliminar del array):
1. En el mismo modal de edición del restaurante
2. Ver las categorías como chips con botón **"×"**
3. **Click en "×"** junto a cualquier categoría
4. **Resultado:** La categoría desaparece del array de categorías inmediatamente — usa `$pull`
5. Cerrar modal y reabrir el mismo restaurante → la categoría ya no está

**Endpoint:** `DELETE /restaurantes/:id/categorias` → `$pull: {categorias: valor}`

**Qué dice el evaluador:** "$pull elimina el elemento del array limpiamente. ✓"

---

### ✅ **CRITERIO: ARRAYS - $pull en Direcciones de Usuarios**

#### Demostración $pull para eliminar una dirección guardada:
1. Ir a **Users** (menú lateral)
2. Seleccionar un usuario que tenga al menos 2 direcciones (o agregar una dirección primero)
3. Ver la sección **"Addresses"** con tarjetas de dirección
4. **Click en el icono 🗑️ (papelera)** junto a una tarjeta de dirección
5. **Resultado:** La dirección desaparece del array `direcciones` del usuario ($pull)
6. El perfil del usuario se recarga automáticamente mostrando las direcciones restantes

**Endpoint:** `DELETE /usuarios/:id/direcciones` → `$pull: {direcciones: {calle: valor}}`

**Qué dice el evaluador:** "$pull elimina el sub-documento del array de direcciones. ✓"

---

### ✅ **CRITERIO 10: GRIDFS - ARCHIVOS**

#### Demostración:

1. Ir a **Files** (en el menú lateral)
2. Ver sección **"Upload File"**
3. **Click en "Choose File"**
4. Seleccionar una imagen (JPG, PNG, etc.)
5. **Click "Upload"**
6. **Resultado:**
   - Archivo se sube a GridFS
   - Mensaje: "Archivo subido exitosamente"
   - Archivo ID: `[ObjectID]`

7. **Ver la lista de archivos:**
   - Aparece el archivo que acabas de subir
   - Se muestra: nombre, tamaño, fecha de carga

8. **Descargar el archivo:**
   - **Click en "Download"** junto al archivo subido
   - El archivo se descarga con el nombre original
   - **Resultado:** Archivo descargado correctamente desde GridFS

**Cómo funciona internamente:**
- Upload: `bucket.OpenUploadStream()` → chunks de 255 KB en `fs.chunks`
- Download: `bucket.DownloadToStream()` → lee chunks y envía como stream
- Los archivos viven en `fs.files` (metadata) y `fs.chunks` (binario)

**Qué dice el evaluador:** "GridFS sube y descarga archivos. Los cambios son visibles en la UI. ✓"

---

## 📊 RESUMEN DE CRITERIOS

| Criterio | Descripción | Status |
|----------|-------------|--------|
| **Índices (5 tipos)** | Unique, Compound, Multikey, 2dsphere, Text | ✅ |
| **explain()** | Validación de uso de índices via Analytics | ✅ |
| **CRUD Embebidos** | ItemOrden, Dirección, Ubicación GeoJSON | ✅ |
| **CRUD Referenciados** | Lookups entre colecciones | ✅ |
| **Crear 1 o varios** | CRUD individual + BulkWrite | ✅ |
| **Lectura** | Filtros, proyecciones, sort, skip, limit | ✅ |
| **Actualizar 1** | UpdateOne en todas las colecciones | ✅ |
| **Actualizar varios** | UpdateMany por estado de orden | ✅ |
| **Eliminar 1** | DeleteOne por ID | ✅ |
| **Eliminar varios** | DeleteMany por estado de orden | ✅ |
| **GridFS** | Upload/Download de archivos | ✅ |
| **Volumen 50k docs** | POST /bulk/todo | ✅ |
| **Agregaciones simples** | Count, Distinct | ✅ |
| **Agregaciones complejas** | Pipelines $match/$group/$lookup/$project | ✅ |
| **Manejo Arrays** | $push, $pull, $addToSet, $unwind | ✅ |
| **Transacciones** | Reseña + UpdateOrden + RecalculoPromedio | ✅ |
| **BulkWrite (+5)** | 5 funciones de inserción masiva | ✅ |
| **Frontend/HCI (+10)** | 9 páginas con UI completa | ✅ |
   - Con botón "Download"

8. **Download:**
   - Click en "Download"
   - Se descarga el archivo original
   - Verificar que es el MISMO archivo

9. **Subir otro archivo:**
   - Repetir pasos 3-6
   - Ahora hay 2 archivos en la lista
   - Prueba que los cambios se ven en tiempo real

**Qué dice el evaluador:** "GridFS está completamente funcional. Upload/Download correctos. ✓"

---

### ✅ **CRITERIO 11: VOLUMEN 50,000 DOCUMENTOS**

#### Demostración:

**Ya hiciste esto cuando corriste `/bulk/todo`, pero ahora verfícalo:**

1. Ir a **Dashboard**
2. Ver estadísticas:
   - "Total Orders: 50,000+" ✓
   - "Total Restaurants: 150+" ✓
   - "Total Users: 200+" ✓

3. Ir a **Orders**
4. Ver paginación: `[1 2 3 4 5 ... 5000]` (páginas)
5. Cálculo: 50,000 / 10 por página = 5,000 páginas
6. Ir a última página
7. Verificar hay datos reales

**Qué dice el evaluador:** "Hay 50,000+ documentos en órdenes. ✓"

---

### ✅ **CRITERIO 12: AGREGACIONES SIMPLES**

#### Demostración:

**Count - Contar órdenes por estado:**
1. Ir a **Dashboard**
2. Ver sección **"Order Status Distribution"**
3. Se muestran conteos:
   - Pendiente: 500
   - En Preparación: 1,200
   - En Camino: 800
   - Entregada: 47,000
   - Cancelada: 500
4. Total = 50,000 ✓

**Qué dice el evaluador:** "CountDocuments está funcionando. ✓"

---

**Distinct - Valores únicos de categorías:**
1. Ir a **Restaurants**
2. Ver dropdown de categorías
3. Muestra categorías ÚNICAS (sin duplicados):
   - Pizzería
   - Comida Rápida
   - Asiática
   - Italiana
   - Postres
4. Sin repeticiones

**Qué dice el evaluador:** "Distinct está funcionando. ✓"

---

### ✅ **CRITERIO 13: AGREGACIONES COMPLEJAS**

#### Demostración:

**Pipeline 1 - Top Platillos:**
1. Ir a **Dashboard**
2. Buscar sección **"Top Dishes"** o **"Top Selling Items"** (generalmente en la parte inferior)
3. Se muestran en forma de **tabla/lista:**
   - #1: Pizza Pepperoni | Cantidad: 2,500 | Ingresos: Q75,000.00
   - #2: Hamburguesa | Cantidad: 2,200 | Ingresos: Q44,000.00
   - #3: Tacos | Cantidad: 1,800 | Ingresos: Q26,970.00
   - #4: Milanesa | Cantidad: 1,600 | Ingresos: Q24,000.00
   - #5: Pasta Carbonara | Cantidad: 1,200 | Ingresos: Q18,000.00

4. Cada fila muestra: **Nombre, Cantidad total vendida, Ingresos totales**

**Qué se hace en el backend (explica al evaluador):**
```
1. $match: filtra solo órdenes "entregada"
2. $unwind: desanida array de items
3. $group: agrupa por articulo_id, suma cantidad e ingresos
4. $sort: ordena por cantidad descendente
5. $limit: solo top 5
6. $lookup: se une con colección articulos_menu para obtener nombres
```

**Qué dice el evaluador:** "¡Pipeline complejo! 6 etapas de agregación con $group y $lookup. ✓"

---

**Pipeline 2 - Top Usuarios:**
1. Ir a **Dashboard**
2. Bajar hasta encontrar sección **"Top Users"** o **"Top Customers"**
3. Se muestran en forma de **lista con tarjetas:**
   - 🏆 #1: Juan Pérez
     - 📧 Email: juan@example.com
     - 💰 Total gastado: Q15,000.00
     - 📦 Cantidad de órdenes: 120
   
   - 🏆 #2: María García
     - 📧 Email: maria@example.com
     - 💰 Total gastado: Q14,200.00
     - 📦 Cantidad de órdenes: 118
   
   - 🏆 #3: Carlos López
     - 📧 Email: carlos@example.com
     - 💰 Total gastado: Q13,800.00
     - 📦 Cantidad de órdenes: 115

4. Cada usuario muestra: **Nombre, Email, Dinero gastado, Cantidad de órdenes**

**Qué se hace en el backend:**
```
1. $match: filtra solo órdenes "entregada"
2. $group: agrupa por usuario_id, suma gastos, cuenta órdenes
3. $sort: ordena por gasto descendente
4. $limit: top 10
5. $lookup: se une con colección usuarios
6. $unwind: desanida el array
7. $project: proyecta nombre, correo, gastos, count
```

**Qué dice el evaluador:** "¡Agregación con 7 etapas incluyendo $lookup! ¡Y muestra todos los TOP 10 usuarios con datos completos! ✓✓✓"

---

### ✅ **CRITERIO 14: MANEJO DE ARRAYS - $push, $unwind, etc.**

#### Demostración:

**$push - Agregar elemento a array:**
1. **Login**
2. Ir a **Perfil** o **Users** → Seleccionar usuario
3. Ver sección **"Direcciones"**
4. Botón **"Agregar Dirección"** (Add Address)
5. Llenar:
   - Calle: "Avenida Reforma 456"
   - Zona: "10"
   - Ciudad: "Ciudad de Guatemala"
6. **Click "Guardar"**
7. **Resultado:** Nueva dirección aparece en la lista
8. Agregar OTRA dirección
9. Ahora hay 2 direcciones en el array

**Qué dice el evaluador:** "$push está usando correctamente. ✓"

---

**$unwind - En Top Dishes:**
- Ya vimos en agregación compleja
- Se desanida el array de items de cada orden
- Permite procesar cada item por separado

**Qué dice el evaluador:** "$unwind para desanidar arrays. ✓"

---

### ✅ **CRITERIO 15: OPERACIONES BULK** (Extra +5 pts)

#### Demostración:

**Ya lo hiciste con `/bulk/todo`, pero explícalo:**

1. Abre **Terminal**
2. Ejecuta:
```bash
curl -X POST http://localhost:8080/bulk/todo \
  -H "Content-Type: application/json"
```

3. **Resultado:**
```json
{
  "message": "Bulk insert completado",
  "usuarios_insertados": 200,
  "restaurantes_insertados": 150,
  "articulos_insertados": 1000,
  "ordenes_insertadas": 50000,
  "resenas_insertadas": 10000
}
```

4. **Volver a frontend y verificar:**
   - Dashboard actualizado
   - 50,000+ órdenes en la BD

**Qué dice el evaluador:** "¡Excelente! Implementó 5 funciones de BulkWrite. +5 puntos. ✓"

---

### ✅ **CRITERIO 16: FRONTEND/HCI** (Extra +10 pts)

#### Demostración Completa de Interfaz:

**1. Sistema de Autenticación:**
- Abre http://localhost:3000
- Ve página de **LOGIN**
- **Toggle a REGISTER** y crea usuario nuevo
- Sistema pide:
  - Nombre ✓
  - Email ✓
  - Contraseña ✓ (no visible)
  - Teléfono ✓
- Login es obligatorio (no puedes saltarlo)

**Qué dice el evaluador:** "Autenticación JWT implementada. No hay bypass. ✓"

---

**2. Navegación Intuitiva:**
- Muestra **Navbar superior** con:
  - Logo/Nombre app
  - Usuario logeado
  - Botón Logout
- Muestra **Sidebar colapsable** con menú:
  - Dashboard
  - Users
  - Restaurants
  - Menu
  - Orders
  - Reviews
  - Analytics
  - Files

**Qué dice el evaluador:** "Interfaz limpia y navegación clara. ✓"

---

**3. Dashboard (Página principal):**

Muestra:
- ✅ **4 StatCards:** Total Usuarios, Total Restaurantes, Total Órdenes, Ingresos
- ✅ **Gráfico Pie:** Distribución de órdenes por estado
- ✅ **Gráfico Bar:** Top 5 platos más vendidos
- ✅ **Tabla:** Top 10 usuarios por gasto

Interactividad:
- Números se actualizan al agregar datos
- Gráficos son responsivos

**Qué dice el evaluador:** "Dashboard visual y funcional con múltiples gráficos. ✓"

---

**4. Páginas CRUD:**

**Users:**
- ✅ Tabla con listado de usuarios
- ✅ Botones: Edit, Delete, View
- ✅ Formulario para editar
- ✅ Confirmación de eliminación

**Restaurants:**
- ✅ Listado con tarjetas/tabla
- ✅ Búsqueda por nombre
- ✅ Filtro por categoría
- ✅ Ver detalles (ubicación, rating)

**Orders:**
- ✅ Tabla con órdenes
- ✅ Estado actual
- ✅ Actualizar estado masivo
- ✅ Eliminar orden(es)
- ✅ Paginación

**Reviews:**
- ✅ Formulario para dejar reseña
- ✅ Seleccionar restaurante
- ✅ Calificación (1-5 estrellas)
- ✅ Comentario
- ✅ Histórico de reseñas

**Files:**
- ✅ Upload de archivos
- ✅ Lista de archivos subidos
- ✅ Botón descargar
- ✅ Muestra cambios en tiempo real

**Qué dice el evaluador:** "9 páginas funcionales totalmente implementadas. +10 puntos. ✓✓✓"

---

**5. Diseño Visual:**
- ✅ Colores coordinados (Tailwind)
- ✅ Iconos de Lucide React
- ✅ Responsive (se ve bien en móvil/tablet/desktop)
- ✅ Loading spinners mientras carga
- ✅ Mensajes de error en rojo
- ✅ Mensajes de éxito en verde

**Qué dice el evaluador:** "Interfaz profesional y amigable. ✓"

---

## 📋 HOJA DE VERIFICACIÓN PARA EL EVALUADOR

```
CRITERIO                              MOSTRADO EN FRONTEND    VERIFICADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Índice Único                       Login (registros dup)   ☐
2. Índice Compuesto                   Orders (sort)           ☐
3. Índice Multikey                    Restaurants (categ)     ☐
4. Índice Geoespacial                 Restaurants (nearby)    ☐
5. CRUD - Embebidos                   Orders (items)          ☐
6. CRUD - Referenciados               Dashboard (lookups)     ☐
7. CRUD - Crear 1                     Register / New Order    ☐
8. CRUD - Crear varios                POST /bulk/todo         ☐
9. CRUD - Leer (Filtros)              Restaurants (categ)     ☐
10. CRUD - Leer (Proyecciones)        Dashboard (campos)      ☐
11. CRUD - Leer (Sort)                Top Dishes (desc)       ☐
12. CRUD - Leer (Skip/Limit)          Orders (paginación)     ☐
13. CRUD - Actualizar 1               Edit User/Restaurant    ☐
14. CRUD - Actualizar varios          Bulk update orders      ☐
15. CRUD - Eliminar 1                 Delete order (demo)     ☐
16. CRUD - Eliminar varios            Delete cancelled oders  ☐
17. GridFS                            Files (up/download)     ☐
18. 50,000 docs                       Dashboard (stats)       ☐
19. Agregación simple                 Dashboard (count/dist)  ☐
20. Agregación compleja               Dashboard (top platos)  ☐
21. Arrays ($push, $unwind)           Addresses (add dirección) ☐
22. Documentos embebidos              Orders (items)          ☐
23. BULK Operations (+5 pts)          Terminal (/bulk/todo)   ☐
24. Frontend Completo (+10 pts)       Todas las páginas       ☐
```

---

## 🎤 SCRIPT DE PRESENTACIÓN (Lo que dices al evaluador)

```
"Buenos días/tardes profesor/a.

Voy a demostrar que mi proyecto CC3089 cumple con TODOS los criterios de evaluación.

PRIMERO - Indices MongoDB:
Mi base de datos tiene 4 tipos de índices:
1. Índice ÚNICO en usuarios.correo (previene registros duplicados)
2. Índice COMPUESTO en ordenes(restaurante_id, fecha)
3. Índice MULTIKEY en restaurantes.categorias
4. Índice GEOESPACIAL en restaurantes.ubicacion para búsquedas cercanas

[Mostrar cada uno en el frontend]

SEGUNDO - CRUD Completo:
Tengo documentos embebidos (ItemOrden, Dirección) y documentos referenciados
con lookups entre colecciones.

[Crear, leer, actualizar, eliminar - mostrar cada operación]

TERCERO - GridFS:
Ver página de Files donde puede subir y descargar archivos almacenados
en MongoDB.

CUARTO - Agregaciones:
Dashboard muestra Top Platos y Top Usuarios usando pipelines complejos
de MongoDB.

QUINTO - Operaciones BULK:
Generé 50,000 documentos usando BulkWrite en un solo endpoint.

SEXTO - Frontend Completo:
9 páginas funcionales con diseño profesional e interfaz amigable.

Todo está funcionando en Docker. ¿Alguna pregunta?"
```

---

## ⚡ ORDEN RECOMENDADO DE DEMOSTRACIÓN

1. **Empezar en Dashboard** (ver estadísticas globales)
2. → **Índices:** Mostrar funcionamiento
3. → **CRUD Lectura:** Restaurants (filtros), Orders (paginación)
4. → **CRUD Escritura:** Crear usuario, crear orden
5. → **CRUD Actualización:** Editar restaurante, bulk update órdenes
6. → **CRUD Eliminación:** Eliminar una orden, eliminar varias
7. → **GridFS:** Ir a Files, subir/descargar
8. → **Agregaciones:** Volver a Dashboard, mostrar gráficos
9. → **BULK:** Terminal - POST /bulk/todo
10. → **Cerrar:** Resumen en Dashboard

---

## 📱 TIPS PARA LA PRESENTACIÓN

✅ **Prepara datos reales:**
- Ten al menos 50,000 documentos cargados
- Si no, ejecuta `/bulk/todo` antes

✅ **Abre todo en navegador:**
- Frontend: http://localhost:3000
- Ten Postman abierto para endpoints adicionales

✅ **Demuestra cada criterio de forma CLARA:**
- "Esto muestra el ÍNDICE ÚNICO...porque..."
- "Aquí ve el BULK INSERT...50,000 documentos..."

✅ **Sé confiado:**
- Todo funciona
- Responde preguntas sobre el código
- Muestra archivos si pide detalles técnicos

✅ **Tiempo estimado:** 15-20 minutos para demostración completa

---

## 🚀 ¡LISTO PARA IMPRESIONAR AL EVALUADOR!

Sigue estos pasos y demuéstrale que entiendes MongoDB, React, Go y puedes
construir aplicaciones full-stack profesionales. 

**¡Mucho éxito!** 🎓
```
