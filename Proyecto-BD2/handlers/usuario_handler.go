package handlers

import (
	"Proyecto-BD2/models"
	"Proyecto-BD2/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateUsuario(c *gin.Context) {

	var usuario models.Usuario

	if err := c.ShouldBindJSON(&usuario); err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	err := services.CreateUsuario(usuario)

	if err != nil {
		c.JSON(http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "usuario creado",
	})
}

func AddDireccionUsuario(c *gin.Context) {
	usuarioID := c.Param("id")
	var nuevaDireccion models.Direccion

	if err := c.ShouldBindJSON(&nuevaDireccion); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido"})
		return
	}

	if err := services.AgregarDireccionUsuario(usuarioID, nuevaDireccion); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Dirección agregada correctamente al arreglo"})
}
