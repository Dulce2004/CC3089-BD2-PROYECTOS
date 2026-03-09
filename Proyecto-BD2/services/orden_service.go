package services

import (
	"Proyecto-BD2/config"
	"Proyecto-BD2/models"
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
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

// GetOrdenes devuelve todas las órdenes (opcionalmente filtradas por usuario)
func GetOrdenes(usuarioID string) ([]models.Orden, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.DB.Collection("ordenes")
	filtro := bson.M{}
	if usuarioID != "" {
		objID, err := primitive.ObjectIDFromHex(usuarioID)
		if err == nil {
			filtro = bson.M{"usuario_id": objID}
		}
	}

	cursor, err := collection.Find(ctx, filtro)
	if err != nil {
		return nil, err
	}

	var ordenes []models.Orden
	if err = cursor.All(ctx, &ordenes); err != nil {
		return nil, err
	}
	return ordenes, nil
}

// GetOrdenByID devuelve una orden por su ID
func GetOrdenByID(id string) (*models.Orden, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.DB.Collection("ordenes")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var orden models.Orden
	err = collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&orden)
	if err != nil {
		return nil, err
	}
	return &orden, nil
}

// UpdateOrdenEstado actualiza el estado de una orden individual usando el índice compuesto
func UpdateOrdenEstado(id string, nuevoEstado string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.DB.Collection("ordenes")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	_, err = collection.UpdateOne(ctx,
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"estado": nuevoEstado}},
	)
	return err
}

// GetOrdenesPorRestaurante usa el índice compuesto (restaurante_id, fecha)
func GetOrdenesPorRestaurante(restauranteID string) ([]models.Orden, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.DB.Collection("ordenes")
	objID, err := primitive.ObjectIDFromHex(restauranteID)
	if err != nil {
		return nil, err
	}

	// Usa el índice compuesto (restaurante_id, fecha DESC)
	opts := options.Find().SetSort(bson.D{{Key: "fecha_pedido", Value: -1}})
	cursor, err := collection.Find(ctx, bson.M{"restaurante_id": objID}, opts)
	if err != nil {
		return nil, err
	}

	var ordenes []models.Orden
	if err = cursor.All(ctx, &ordenes); err != nil {
		return nil, err
	}
	return ordenes, nil
}
