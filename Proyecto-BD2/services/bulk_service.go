package services

import (
	"context"
	"math/rand"
	"time"

	"Proyecto-BD2/config"
	"Proyecto-BD2/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func GenerarOrdenesMasivas(cantidad int) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	collection := config.DB.Collection("ordenes")

	// Lista de modelos de operación para BulkWrite
	var modelos []mongo.WriteModel

	estados := []string{"entregada", "pendiente", "cancelada", "en camino"}

	rand.Seed(time.Now().UnixNano())

	for i := 0; i < cantidad; i++ {
		// Creamos una orden ficticia
		nuevaOrden := bson.M{
			"fecha":      time.Now().AddDate(0, 0, -rand.Intn(30)), // Fechas de los últimos 30 días
			"estado":     estados[rand.Intn(len(estados))],
			"total":      rand.Float64()*(500-20) + 20, // Precios entre 20 y 500
			"cliente_id": "usuario_anonimo",
			"items": []models.ItemOrden{
				{Nombre: "Platillo Pro", PrecioUnitario: 50.0, Cantidad: rand.Intn(5) + 1},
			},
			"resenado": false,
		}

		// Creamos una operación de inserción para el Bulk
		op := mongo.NewInsertOneModel().SetDocument(nuevaOrden)
		modelos = append(modelos, op)
	}

	// Ejecutamos el BulkWrite
	// Ordered: false permite que si una inserción falla, las demás continúen
	opts := options.BulkWriteOptions{}
	opts.SetOrdered(false)

	resultado, err := collection.BulkWrite(ctx, modelos, &opts)
	if err != nil {
		return 0, err
	}

	return resultado.InsertedCount, nil
}
