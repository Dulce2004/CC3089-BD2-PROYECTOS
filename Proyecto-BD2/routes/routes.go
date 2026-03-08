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
}
