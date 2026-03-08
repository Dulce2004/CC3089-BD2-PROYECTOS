package handlers

import (
	"Proyecto-BD2/models"
	"Proyecto-BD2/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateOrden(c *gin.Context) {

	var orden models.Orden

	if err := c.ShouldBindJSON(&orden); err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	err := services.CreateOrden(orden)

	if err != nil {
		c.JSON(http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "orden creada",
	})
}
