package handlers

import (
	"Proyecto-BD2/models"
	"Proyecto-BD2/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetResenas(c *gin.Context) {
	resenas, err := services.ObtenerResenas()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resenas)
}

func GetResenasPorRestaurante(c *gin.Context) {
	restauranteID := c.Param("id")
	resenas, err := services.ObtenerResenasPorRestaurante(restauranteID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resenas)
}

func CreateResena(c *gin.Context) {

	var resena models.Resena

	if err := c.ShouldBindJSON(&resena); err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	err := services.CrearResenaTransaccion(resena)

	if err != nil {
		c.JSON(http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "reseña creada con transacción",
	})
}
