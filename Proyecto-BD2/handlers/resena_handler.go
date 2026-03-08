package handlers

import (
	"Proyecto-BD2/models"
	"Proyecto-BD2/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

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
