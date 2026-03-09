package routes

import (
	"Proyecto-BD2/handlers"
	"Proyecto-BD2/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {

	// --- AUTH ---
	auth := r.Group("/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
	}

	// --- USUARIOS (protegidos) ---
	usuarios := r.Group("/usuarios")
	usuarios.Use(middleware.AuthRequired())
	{
		usuarios.GET("/perfil", handlers.GetPerfil)
		usuarios.PUT("/perfil", handlers.UpdatePerfil)
		usuarios.PUT("/:id/direcciones", handlers.AddDireccionUsuario)
	}

	// --- RESTAURANTES ---
	restaurantes := r.Group("/restaurantes")
	{
		restaurantes.GET("", handlers.GetRestaurantes)
		restaurantes.POST("", handlers.CreateRestaurante)
		restaurantes.GET("/buscar", handlers.BuscarRestaurantesPorNombre) // ?nombre=
		restaurantes.GET("/categoria", handlers.BuscarPorCategoria)       // ?cat=
		restaurantes.GET("/cerca", handlers.BuscarRestaurantesCercanos)   // ?lat=&lng=&dist=
		restaurantes.GET("/search", handlers.SearchRestaurantes)          // ?categoria=&limit=&skip=
		restaurantes.GET("/categorias", handlers.GetCategorias)
		restaurantes.GET("/:id", handlers.GetRestauranteByID)
		restaurantes.PUT("/:id", handlers.UpdateRestaurante)
		restaurantes.DELETE("/:id", handlers.DeleteRestaurante)

		// Menú por restaurante
		restaurantes.POST("/:id/menu", handlers.CreateArticuloMenu)
		restaurantes.GET("/:id/menu", handlers.GetMenuRestaurante)

		// Órdenes por restaurante (usa índice compuesto)
		restaurantes.GET("/:id/ordenes", handlers.GetOrdenesPorRestaurante)
	}

	// --- MENÚ ---
	menu := r.Group("/menu")
	{
		menu.PUT("/:id", handlers.UpdateArticuloMenu)
		menu.DELETE("/:id", handlers.DeleteArticuloMenu)
	}

	// --- ORDENES (protegidas) ---
	ordenes := r.Group("/ordenes")
	ordenes.Use(middleware.AuthRequired())
	{
		ordenes.POST("", handlers.CreateOrden)
		ordenes.GET("", handlers.GetOrdenes)
		ordenes.GET("/count", handlers.GetCountOrdenes)
		ordenes.PUT("/estado-masivo", handlers.UpdateOrdenesMasivo)
		ordenes.DELETE("/masivo", handlers.DeleteOrdenesMasivo)
		ordenes.GET("/:id", handlers.GetOrdenByID)
		ordenes.PUT("/:id/estado", handlers.UpdateOrdenEstado)
		ordenes.DELETE("/:id", handlers.DeleteOrden)
	}

	// --- RESEÑAS ---
	r.POST("/resenas", handlers.CreateResena)

	// --- ANALYTICS ---
	r.GET("/analytics/top-platillos", handlers.TopPlatillos)
	r.GET("/analytics/top-usuarios", handlers.TopUsuarios)

	// --- GRIDFS / ARCHIVOS ---
	r.POST("/archivos", handlers.UploadImagen)
	r.GET("/archivos/:id", handlers.DownloadImagen)

	// --- OPERACIONES MASIVAS ---
	r.POST("/bulk/ordenes", handlers.InsertBulkOrdenes)
}
