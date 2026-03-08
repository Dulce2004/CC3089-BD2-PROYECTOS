package services

import (
	"Proyecto-BD2/config"
	"Proyecto-BD2/models"
	"context"
	"time"
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
