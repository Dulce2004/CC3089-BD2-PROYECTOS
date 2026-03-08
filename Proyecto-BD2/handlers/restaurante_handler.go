package handlers

import (
	"Proyecto-BD2/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetRestaurantes(c *gin.Context) {

	restaurantes, err := services.GetRestaurantes()

	if err != nil {
		c.JSON(http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, restaurantes)
}
