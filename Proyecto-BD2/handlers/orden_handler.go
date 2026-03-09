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

func UpdateOrdenesMasivo(c *gin.Context) {
	// Esperamos un JSON tipo: {"estado_actual": "pendiente", "nuevo_estado": "entregada"}
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
	estado := c.Query("estado") // Opcional

	total, err := services.ContarOrdenesPorEstado(estado)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"total_ordenes": total, "estado_filtrado": estado})
}
