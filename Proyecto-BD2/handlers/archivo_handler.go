package handlers

import (
	"Proyecto-BD2/services" // Ajusta el import
	"net/http"

	"github.com/gin-gonic/gin"
)

// UploadImagen maneja la subida de un archivo desde el cliente
func UploadImagen(c *gin.Context) {
	// "file" es el nombre del campo en el formulario form-data
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No se encontró el archivo en la petición"})
		return
	}
	defer file.Close()

	// Llamamos al servicio pasando el nombre original y el archivo (que implementa io.Reader)
	fileID, err := services.SubirArchivo(header.Filename, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al guardar en GridFS: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Archivo subido exitosamente",
		"file_id":   fileID,
		"file_name": header.Filename,
	})
}

// DownloadImagen maneja la descarga o visualización del archivo
func DownloadImagen(c *gin.Context) {
	fileID := c.Param("id")

	// Configuramos los headers. Usamos octet-stream para compatibilidad general,
	// aunque podrías dinámicamente ajustarlo a image/jpeg, image/png, etc.
	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Disposition", "attachment; filename=\"descarga_"+fileID+"\"")

	// Pasamos el c.Writer que es donde Gin escribe la respuesta HTTP directamente al cliente
	if err := services.DescargarArchivo(fileID, c.Writer); err != nil {
		// Si falla, reseteamos el header y enviamos un JSON con el error
		c.Header("Content-Type", "application/json")
		c.JSON(http.StatusNotFound, gin.H{"error": "Archivo no encontrado: " + err.Error()})
		return
	}
}
