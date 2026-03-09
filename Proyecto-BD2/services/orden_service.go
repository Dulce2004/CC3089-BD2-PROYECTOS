package services

import (
	"Proyecto-BD2/config"
	"Proyecto-BD2/models"
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateOrden(orden models.Orden) error {

	collection := config.DB.Collection("ordenes")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	total := 0.0

	for _, item := range orden.Items {
		total += float64(item.Cantidad) * item.PrecioUnitario
	}

	orden.Total = total
	orden.FechaPedido = time.Now()
	orden.Estado = "pendiente"
	orden.Resenado = false

	_, err := collection.InsertOne(ctx, orden)

	return err
}

// Actualizar Varios Documentos a la vez
func ActualizarEstadoOrdenesMasivo(estadoActual string, nuevoEstado string) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.DB.Collection("ordenes")

	filtro := bson.M{"estado": estadoActual}
	actualizacion := bson.M{"$set": bson.M{"estado": nuevoEstado}}

	resultado, err := collection.UpdateMany(ctx, filtro, actualizacion)
	if err != nil {
		return 0, err
	}

	return resultado.ModifiedCount, nil
}

// Eliminar 1 documento
func EliminarOrden(id string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.DB.Collection("ordenes")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	filtro := bson.M{"_id": objID}
	_, err = collection.DeleteOne(ctx, filtro)
	return err
}

// Eliminar varios documentos
func EliminarOrdenesPorEstado(estado string) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.DB.Collection("ordenes")
	filtro := bson.M{"estado": estado}

	resultado, err := collection.DeleteMany(ctx, filtro)
	if err != nil {
		return 0, err
	}
	return resultado.DeletedCount, nil
}

// Agregación Simple: Count
func ContarOrdenesPorEstado(estado string) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.DB.Collection("ordenes")
	filtro := bson.M{}
	if estado != "" {
		filtro = bson.M{"estado": estado}
	}

	total, err := collection.CountDocuments(ctx, filtro)
	return total, err
}
