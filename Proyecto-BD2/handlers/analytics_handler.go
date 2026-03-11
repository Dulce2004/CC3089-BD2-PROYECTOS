package handlers

import (
	"Proyecto-BD2/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

func TopPlatillos(c *gin.Context) {

	data, err := services.TopPlatillos()

	if err != nil {
		c.JSON(http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, data)
}

func TopUsuarios(c *gin.Context) {

	data, err := services.TopUsuarios()

	if err != nil {
		c.JSON(http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, data)
}

func ExplainIndices(c *gin.Context) {
	data, err := services.ExplainIndices()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}
