package handlers

import (
	"Proyecto-BD2/models"
	"Proyecto-BD2/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateArticuloMenu(c *gin.Context) {
	restauranteID := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(restauranteID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de restaurante inválido"})
		return
	}

	var articulo models.ArticuloMenu
	if err := c.ShouldBindJSON(&articulo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	articulo.RestauranteID = objID

	if err := services.CrearArticuloMenu(articulo); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Artículo creado exitosamente"})
}

func GetMenuRestaurante(c *gin.Context) {
	restauranteID := c.Param("id")

	articulos, err := services.GetMenuRestaurante(restauranteID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, articulos)
}

func UpdateArticuloMenu(c *gin.Context) {
	id := c.Param("id")

	var update bson.M
	if err := c.ShouldBindJSON(&update); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := services.UpdateArticuloMenu(id, update); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Artículo actualizado"})
}

func DeleteArticuloMenu(c *gin.Context) {
	id := c.Param("id")

	if err := services.DeleteArticuloMenu(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Artículo eliminado"})
}
