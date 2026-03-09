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

func InsertBulkTodo(c *gin.Context) {
	cantidadStr := c.DefaultQuery("cantidad", "500")
	cantidad, _ := strconv.Atoi(cantidadStr)

	if cantidad > 100000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El límite de órdenes por petición es de 100,000"})
		return
	}

	if cantidad < 1 {
		cantidad = 500
	}

	resultado, err := services.GenerarDatosMasivos(cantidad)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generando datos masivos: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Datos masivos generados exitosamente en todas las colecciones",
		"resultado": resultado,
		"nota": "Las órdenes referencian usuarios y restaurantes reales. Las reseñas referencian órdenes entregadas.",
	})
}
