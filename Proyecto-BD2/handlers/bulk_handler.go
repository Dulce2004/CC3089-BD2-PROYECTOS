package handlers

import (
	"Proyecto-BD2/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func InsertBulkOrdenes(c *gin.Context) {
	// Obtenemos la cantidad de la URL, por defecto 50,000
	cantidadStr := c.DefaultQuery("cantidad", "50000")
	cantidad, _ := strconv.Atoi(cantidadStr)

	if cantidad > 100000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El límite por petición es de 100,000 para evitar timeout"})
		return
	}

	insertados, err := services.GenerarOrdenesMasivas(cantidad)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error en BulkWrite: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":            "Operación Bulk completada",
		"documentos_creados": insertados,
		"status":             "Requerimiento de volumen de datos cumplido",
	})
}
