package handlers

import (
	"Proyecto-BD2/models"
	"Proyecto-BD2/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetUsuarios(c *gin.Context) {
	usuarios, err := services.GetUsuarios()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, usuarios)
}

func DeleteUsuario(c *gin.Context) {
	id := c.Param("id")
	if err := services.DeleteUsuario(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Usuario eliminado"})
}

func EliminarDireccionUsuario(c *gin.Context) {
	usuarioID := c.Param("id")
	var body struct {
		Calle string `json:"calle" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Se requiere el campo 'calle'"})
		return
	}
	if err := services.EliminarDireccionUsuario(usuarioID, body.Calle); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Dirección eliminada del arreglo ($pull)"})
}

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
