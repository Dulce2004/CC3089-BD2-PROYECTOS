package routes

import (
	"Proyecto-BD2/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {

	r.POST("/usuarios", handlers.CreateUsuario)
	r.GET("/restaurantes", handlers.GetRestaurantes)

	r.POST("/ordenes", handlers.CreateOrden)

	r.POST("/resenas", handlers.CreateResena)

	r.GET("/analytics/top-platillos", handlers.TopPlatillos)
	r.GET("/analytics/top-usuarios", handlers.TopUsuarios)

	// Búsqueda avanzada (GET /restaurantes/search?categoria=pizza&limit=5&skip=0)
	r.GET("/restaurantes/search", handlers.SearchRestaurantes)

	// Actualizar 1 doc + Arrays ($push) (PUT /usuarios/:id/direcciones)
	r.PUT("/usuarios/:id/direcciones", handlers.AddDireccionUsuario)

	// Actualizar varios docs (PUT /ordenes/estado-masivo)
	r.PUT("/ordenes/estado-masivo", handlers.UpdateOrdenesMasivo)

	// --- ELIMINAR ---
	// Eliminar 1 orden (DELETE /ordenes/:id)
	r.DELETE("/ordenes/:id", handlers.DeleteOrden)

	// Eliminar varias órdenes (DELETE /ordenes/masivo?estado=cancelada)
	r.DELETE("/ordenes/masivo", handlers.DeleteOrdenesMasivo)

	// --- AGREGACIONES SIMPLES ---
	// Count de órdenes (GET /ordenes/count?estado=pendiente)
	r.GET("/ordenes/count", handlers.GetCountOrdenes)

	// Distinct de categorías (GET /restaurantes/categorias)
	r.GET("/restaurantes/categorias", handlers.GetCategorias)

	// --- GRIDFS / ARCHIVOS ---
	// Subir una imagen (POST /archivos)
	// En Postman debes usar Body -> form-data -> Key: "file" (tipo File)
	r.POST("/archivos", handlers.UploadImagen)

	// Descargar/Ver una imagen (GET /archivos/:id)
	r.GET("/archivos/:id", handlers.DownloadImagen)

	// --- OPERACIONES MASIVAS (Puntos Extra) ---
	// Generar datos de prueba (POST /bulk/ordenes?cantidad=50000)
	r.POST("/bulk/ordenes", handlers.InsertBulkOrdenes)
}
