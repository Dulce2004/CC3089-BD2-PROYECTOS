# Frontend — Restaurant Dashboard

Interfaz web para el sistema de gestión de restaurantes y pedidos. Desarrollada con **React 18** y **Vite**, estilizada con **Tailwind CSS** y conectada a la API REST del backend en Go.

---

## Tecnologías utilizadas

| Tecnología | Versión | Uso |
|---|---|---|
| React | 18.3.1 | Biblioteca de UI |
| Vite | 5.2.13 | Bundler y servidor de desarrollo |
| React Router DOM | 6.23.1 | Enrutamiento del lado del cliente |
| Axios | 1.7.2 | Cliente HTTP para consumir la API |
| Tailwind CSS | 3.4.4 | Framework de estilos utilitarios |
| Recharts | 2.12.7 | Gráficas (barras, pie, etc.) |
| Lucide React | 0.379.0 | Iconos |

---

## Estructura del proyecto

```
frontend/
├── index.html                  # HTML principal (entrada de Vite)
├── package.json                # Dependencias y scripts
├── vite.config.js              # Configuración de Vite (puerto 5173)
├── tailwind.config.js          # Configuración de Tailwind CSS
├── postcss.config.js           # PostCSS con Tailwind + Autoprefixer
│
├── src/
│   ├── main.jsx                # Punto de entrada (BrowserRouter + App)
│   ├── App.jsx                 # Componente raíz: autenticación + layout + rutas
│   ├── index.css               # Directivas de Tailwind + estilos globales
│   │
│   ├── services/
│   │   └── api.js              # Instancia de Axios + todas las funciones de API
│   │
│   ├── components/
│   │   ├── Navbar.jsx          # Barra superior con info de usuario y logout
│   │   ├── Sidebar.jsx         # Navegación lateral con links a cada página
│   │   ├── DataTable.jsx       # Tabla reutilizable con paginación
│   │   ├── FormInput.jsx       # Input reutilizable (text, select, textarea)
│   │   ├── StatCard.jsx        # Tarjeta de estadística para el dashboard
│   │   └── FileUpload.jsx      # Componente de subida de archivos (drag & click)
│   │
│   └── pages/
│       ├── Login.jsx           # Login y registro de usuarios
│       ├── Dashboard.jsx       # Vista general con estadísticas y gráficas
│       ├── Users.jsx           # Perfil, direcciones, registro y top usuarios
│       ├── Restaurants.jsx     # CRUD de restaurantes con 3 modos de búsqueda
│       ├── Menu.jsx            # CRUD de artículos de menú por restaurante
│       ├── Orders.jsx          # Gestión de órdenes + operaciones masivas
│       ├── Reviews.jsx         # Crear reseñas (transacción MongoDB)
│       ├── Analytics.jsx       # Gráficas de analíticas (Recharts)
│       └── Files.jsx           # Subida de archivos (GridFS) + Bulk insert
│
└── dist/                       # Build de producción
```

---

## Cómo ejecutar

### Requisitos previos

- [Node.js 18+](https://nodejs.org/)
- El backend debe estar corriendo en `http://localhost:8080`

### Pasos

```bash
# 1. Entrar al directorio
cd frontend

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

La aplicación se abre en `http://localhost:5173`.

### Build de producción

```bash
npm run build
```

Los archivos se generan en la carpeta `dist/`.

---

## Páginas

### Login (`/` sin autenticación)

- Formulario de inicio de sesión y registro
- Al autenticarse, almacena el token JWT y los datos del usuario en `localStorage`
- Mientras no haya token, la aplicación solo muestra esta página

### Dashboard (`/`)

- 4 tarjetas de estadísticas: usuarios, restaurantes, órdenes y ganancias totales (en Quetzales)
- Gráfica de pie: distribución de órdenes por estado
- Gráfica de barras: top platillos más vendidos
- Gráfica de barras: top usuarios por gasto

### Users (`/users`)

- **Mi Perfil**: ver y editar nombre, correo, teléfono
- **Mis Direcciones**: ver direcciones existentes y agregar nuevas
- **Registrar Nuevo Usuario**: formulario de registro
- **Top Usuarios**: tabla con los 10 usuarios que más han gastado (aggregation pipeline)

### Restaurants (`/restaurants`)

- CRUD completo de restaurantes
- 3 modos de búsqueda:
  - **Por nombre**: búsqueda con regex
  - **Por categoría**: filtro con índice multikey
  - **Cercanos**: búsqueda geoespacial con latitud, longitud y distancia
- Formulario de creación con coordenadas GeoJSON y categorías
- Modal de edición
- Tabla paginada con opciones de eliminación

### Menu (`/menu`)

- Selector de restaurante
- CRUD de artículos: nombre, descripción, precio, categoría, disponibilidad
- Tabla con todos los artículos del restaurante seleccionado

### Orders (`/orders`)

- **Crear orden**: seleccionar restaurante, elegir artículos del menú con cantidades
- **Ver órdenes**: tabla paginada del usuario autenticado
- **Actualizar estado**: individual o masivo (`UpdateMany`)
- **Eliminar**: individual o masivo por estado (`DeleteMany`)
- **Conteo por estado**: pills con la cantidad de órdenes en cada estado
- **Órdenes por restaurante**: consulta usando índice compuesto
- Modal de detalle de orden

### Reviews (`/reviews`)

- Crear reseñas para órdenes entregadas
- Muestra calificación promedio por restaurante
- Explica visualmente el flujo de la transacción MongoDB (3 operaciones atómicas)

### Analytics (`/analytics`)

- Top platillos más vendidos (BarChart)
- Distribución de órdenes por estado (PieChart)
- Top usuarios por gasto (BarChart horizontal)
- Ingresos por restaurante
- Sección educativa sobre las funcionalidades de MongoDB utilizadas

### Files (`/files`)

- **Subida de archivos**: componente drag & click que sube archivos a GridFS
- **Bulk Insert**: generar datos de prueba masivos con BulkWrite

---

## Conexión con la API

Todas las llamadas HTTP están centralizadas en `src/services/api.js`. La instancia de Axios:

- **Base URL**: `http://localhost:8080`
- **Timeout**: 15 segundos
- **Interceptor**: adjunta automáticamente el token JWT como `Authorization: Bearer <token>` en cada petición

### Endpoints consumidos

| Módulo | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/register` |
| Usuarios | `GET /usuarios/perfil`, `PUT /usuarios/perfil`, `PUT /usuarios/:id/direcciones` |
| Restaurantes | `GET/POST /restaurantes`, `GET/PUT/DELETE /restaurantes/:id`, búsquedas por nombre/categoría/cercanía, categorías, menú y órdenes por restaurante |
| Menú | `PUT/DELETE /menu/:id` |
| Órdenes | `GET/POST /ordenes`, `GET/PUT/DELETE /ordenes/:id`, conteo, estado masivo, eliminación masiva |
| Reseñas | `POST /resenas` |
| Analíticas | `GET /analytics/top-platillos`, `GET /analytics/top-usuarios` |
| Archivos | `POST /archivos`, `GET /archivos/:id` |
| Bulk | `POST /bulk/ordenes`, `POST /bulk/todo` |

---

## Componentes reutilizables

| Componente | Descripción |
|---|---|
| `Navbar` | Barra superior con nombre de usuario, stack tecnológico y botón de logout |
| `Sidebar` | Navegación lateral responsive (drawer en móvil) con 8 secciones |
| `DataTable` | Tabla genérica con paginación, columnas configurables y callback de click en fila |
| `FormInput` | Input universal que soporta text, number, email, password, select y textarea |
| `StatCard` | Tarjeta de estadística con ícono, valor y color configurable |
| `FileUpload` | Dropzone para subida de archivos con preview |

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo en el puerto 5173 |
| `npm run build` | Genera el build de producción en `dist/` |
| `npm run preview` | Previsualiza el build de producción |
