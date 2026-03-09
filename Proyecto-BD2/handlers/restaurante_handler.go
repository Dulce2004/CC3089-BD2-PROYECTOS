package handlers

import (
	"Proyecto-BD2/models"
	"Proyecto-BD2/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func CreateRestaurante(c *gin.Context) {
	var restaurante models.Restaurante
	if err := c.ShouldBindJSON(&restaurante); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := services.CreateRestaurante(restaurante); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Restaurante creado"})
}

func GetRestaurantes(c *gin.Context) {
	restaurantes, err := services.GetRestaurantes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, restaurantes)
}

func GetRestauranteByID(c *gin.Context) {
	id := c.Param("id")

	restaurante, err := services.GetRestauranteByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Restaurante no encontrado"})
		return
	}

	c.JSON(http.StatusOK, restaurante)
}

func UpdateRestaurante(c *gin.Context) {
	id := c.Param("id")

	var update bson.M
	if err := c.ShouldBindJSON(&update); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := services.UpdateRestaurante(id, update); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Restaurante actualizado"})
}

func DeleteRestaurante(c *gin.Context) {
	id := c.Param("id")

	if err := services.DeleteRestaurante(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Restaurante eliminado"})
}

func SearchRestaurantes(c *gin.Context) {
	categoria := c.Query("categoria")
	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "10"), 10, 64)
	skip, _ := strconv.ParseInt(c.DefaultQuery("skip", "0"), 10, 64)

	resultados, err := services.BuscarRestaurantesAvanzado(categoria, limit, skip)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resultados)
}

// BuscarRestaurantesPorNombre usa regex index-friendly sobre el campo nombre
func BuscarRestaurantesPorNombre(c *gin.Context) {
	nombre := c.Query("nombre")
	if nombre == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parámetro 'nombre' requerido"})
		return
	}

	resultados, err := services.BuscarPorNombre(nombre)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resultados)
}

// BuscarPorCategoria usa el índice multikey sobre categorias[]
func BuscarPorCategoria(c *gin.Context) {
	cat := c.Query("cat")
	if cat == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parámetro 'cat' requerido"})
		return
	}

	resultados, err := services.BuscarPorCategoria(cat)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resultados)
}

// BuscarRestaurantesCercanos usa el índice 2dsphere con $near
func BuscarRestaurantesCercanos(c *gin.Context) {
	latStr := c.Query("lat")
	lngStr := c.Query("lng")
	distStr := c.DefaultQuery("dist", "5000")

	if latStr == "" || lngStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parámetros 'lat' y 'lng' requeridos"})
		return
	}

	lat, err1 := strconv.ParseFloat(latStr, 64)
	lng, err2 := strconv.ParseFloat(lngStr, 64)
	dist, err3 := strconv.ParseFloat(distStr, 64)

	if err1 != nil || err2 != nil || err3 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "lat, lng y dist deben ser números"})
		return
	}

	resultados, err := services.BuscarCercanos(lng, lat, dist)
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
