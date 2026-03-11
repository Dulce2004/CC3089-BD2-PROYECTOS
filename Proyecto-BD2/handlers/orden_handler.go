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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Si hay user_id en el contexto JWT, usarlo
	if userID, exists := c.Get("user_id"); exists {
		if uid, ok := userID.(string); ok && uid != "" {
			// Se intentará parsear en el servicio si se pasa como string
			_ = uid
		}
	}

	err := services.CreateOrden(orden)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Orden creada"})
}

func GetOrdenes(c *gin.Context) {
	// Devolver todas las órdenes (vista de administrador)
	ordenes, err := services.GetOrdenes("")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, ordenes)
}

func GetOrdenByID(c *gin.Context) {
	id := c.Param("id")

	orden, err := services.GetOrdenByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Orden no encontrada"})
		return
	}

	c.JSON(http.StatusOK, orden)
}

func UpdateOrdenEstado(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Estado string `json:"estado" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := services.UpdateOrdenEstado(id, req.Estado); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Estado actualizado"})
}

func UpdateOrdenesMasivo(c *gin.Context) {
	var req struct {
		EstadoActual string `json:"estado_actual"`
		NuevoEstado  string `json:"nuevo_estado"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido"})
		return
	}

	modificados, err := services.ActualizarEstadoOrdenesMasivo(req.EstadoActual, req.NuevoEstado)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Órdenes actualizadas",
		"modificadas": modificados,
	})
}

func DeleteOrden(c *gin.Context) {
	id := c.Param("id")

	if err := services.EliminarOrden(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Orden eliminada exitosamente"})
}

func DeleteOrdenesMasivo(c *gin.Context) {
	estado := c.Query("estado")
	if estado == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Debe proporcionar el estado por query param (ej: ?estado=cancelada)"})
		return
	}

	eliminados, err := services.EliminarOrdenesPorEstado(estado)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Órdenes eliminadas",
		"eliminadas": eliminados,
	})
}

func GetCountOrdenes(c *gin.Context) {
	estado := c.Query("estado")

	total, err := services.ContarOrdenesPorEstado(estado)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"total_ordenes": total, "estado_filtrado": estado})
}

func GetOrdenesPorRestaurante(c *gin.Context) {
	restauranteID := c.Param("id")

	ordenes, err := services.GetOrdenesPorRestaurante(restauranteID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, ordenes)
}
