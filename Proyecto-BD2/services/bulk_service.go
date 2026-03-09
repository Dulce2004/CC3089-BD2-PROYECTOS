package services

import (
	"context"
	"math/rand"
	"time"

	"Proyecto-BD2/config"
	"Proyecto-BD2/models"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func GenerarOrdenesMasivas(cantidad int) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	collection := config.DB.Collection("ordenes")

	var modelos []mongo.WriteModel

	estados := []string{"entregada", "pendiente", "cancelada", "en camino"}

	platillos := []string{"Pizza Margherita", "Tacos al Pastor", "Sushi Roll", "Hamburguesa Clásica", "Pasta Carbonara"}

	for i := 0; i < cantidad; i++ {
		cantidad_items := rand.Intn(4) + 1
		items := make([]models.ItemOrden, cantidad_items)
		total := 0.0
		for j := 0; j < cantidad_items; j++ {
			precio := rand.Float64()*(150-20) + 20
			cant := rand.Intn(3) + 1
			items[j] = models.ItemOrden{
				ArticuloID:     primitive.NewObjectID(),
				Nombre:         platillos[rand.Intn(len(platillos))],
				Cantidad:       cant,
				PrecioUnitario: precio,
			}
			total += float64(cant) * precio
		}

		nuevaOrden := models.Orden{
			UsuarioID:     primitive.NewObjectID(),
			RestauranteID: primitive.NewObjectID(),
			Items:         items,
			Estado:        estados[rand.Intn(len(estados))],
			Total:         total,
			FechaPedido:   time.Now().AddDate(0, 0, -rand.Intn(30)),
			Resenado:      false,
		}

		op := mongo.NewInsertOneModel().SetDocument(nuevaOrden)
		modelos = append(modelos, op)
	}

	opts := options.BulkWriteOptions{}
	opts.SetOrdered(false)

	resultado, err := collection.BulkWrite(ctx, modelos, &opts)
	if err != nil {
		return 0, err
	}

	return resultado.InsertedCount, nil
}
