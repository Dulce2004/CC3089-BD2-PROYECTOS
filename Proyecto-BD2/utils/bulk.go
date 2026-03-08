package utils

import (
	"Proyecto-BD2/config"
	"Proyecto-BD2/models"
	"context"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
)

func BulkInsertOrdenes(ordenes []models.Orden) error {

	collection := config.DB.Collection("ordenes")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var operations []mongo.WriteModel

	for _, orden := range ordenes {

		orden.FechaPedido = time.Now()
		orden.Estado = "entregado"

		model := mongo.NewInsertOneModel().SetDocument(orden)

		operations = append(operations, model)
	}

	_, err := collection.BulkWrite(ctx, operations)

	return err
}
