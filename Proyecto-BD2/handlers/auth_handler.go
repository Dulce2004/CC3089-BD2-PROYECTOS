package handlers

import (
	"Proyecto-BD2/models"
	"Proyecto-BD2/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func Register(c *gin.Context) {
	var req struct {
		Nombre     string `json:"nombre" binding:"required"`
		Correo     string `json:"correo" binding:"required"`
		Contrasena string `json:"contrasena" binding:"required"`
		Telefono   string `json:"telefono"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	usuario := models.Usuario{
		Nombre:     req.Nombre,
		Correo:     req.Correo,
		Contrasena: req.Contrasena,
		Telefono:   req.Telefono,
	}

	if err := services.Register(usuario); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Usuario registrado exitosamente"})
}

func Login(c *gin.Context) {
	var req struct {
		Correo     string `json:"correo" binding:"required"`
		Contrasena string `json:"contrasena" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	token, usuario, err := services.Login(req.Correo, req.Contrasena)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":   token,
		"usuario": usuario,
	})
}

func GetPerfil(c *gin.Context) {
	userID, _ := c.Get("user_id")

	usuario, err := services.GetPerfil(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
		return
	}

	c.JSON(http.StatusOK, usuario)
}

func UpdatePerfil(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var update bson.M
	if err := c.ShouldBindJSON(&update); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := services.UpdatePerfil(userID.(string), update); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Perfil actualizado"})
}
