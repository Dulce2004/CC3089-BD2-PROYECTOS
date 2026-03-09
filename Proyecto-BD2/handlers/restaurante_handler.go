package handlers

import (
	"Proyecto-BD2/services"
	"net/http"
	"strconv"

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

func SearchRestaurantes(c *gin.Context) {
	categoria := c.Query("categoria") // Filtro opcional

	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "10"), 10, 64)
	skip, _ := strconv.ParseInt(c.DefaultQuery("skip", "0"), 10, 64)

	resultados, err := services.BuscarRestaurantesAvanzado(categoria, limit, skip)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resultados)
}

func GetCategorias(c *gin.Context) {
	categorias, err := services.ObtenerCategoriasUnicas()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"categorias_disponibles": categorias})
}
