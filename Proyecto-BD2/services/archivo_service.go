package services

import (
	"io"

	"Proyecto-BD2/config" // Ajusta este import según el nombre de tu módulo en go.mod

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/gridfs"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// SubirArchivo recibe un nombre de archivo y un io.Reader, y lo guarda en GridFS
func SubirArchivo(nombreArchivo string, fileStream io.Reader) (string, error) {
	// Usamos la base de datos global que ya tienes en config.DB
	bucket, err := gridfs.NewBucket(config.DB)
	if err != nil {
		return "", err
	}

	// Opcional: podemos definir un tamaño de chunk (por defecto es 255KB)
	uploadOpts := options.GridFSUpload().SetChunkSizeBytes(255 * 1024)

	// Subimos el archivo leyendo directamente del stream (ideal para no saturar la RAM)
	uploadStream, err := bucket.OpenUploadStream(nombreArchivo, uploadOpts)
	if err != nil {
		return "", err
	}
	defer uploadStream.Close()

	// Copiamos el contenido del stream HTTP al stream de MongoDB
	_, err = io.Copy(uploadStream, fileStream)
	if err != nil {
		return "", err
	}

	// Retornamos el ObjectID generado por GridFS como string
	fileID := uploadStream.FileID.(primitive.ObjectID).Hex()
	return fileID, nil
}

// DescargarArchivo busca un archivo por su ID y lo escribe en el io.Writer proporcionado (el response HTTP)
func DescargarArchivo(fileID string, w io.Writer) error {
	bucket, err := gridfs.NewBucket(config.DB)
	if err != nil {
		return err
	}

	objID, err := primitive.ObjectIDFromHex(fileID)
	if err != nil {
		return err
	}

	// Descargamos el archivo escribiendo directamente en el ResponseWriter
	_, err = bucket.DownloadToStream(objID, w)
	return err
}
