package services

import (
	"Proyecto-BD2/config"
	"context"

	"go.mongodb.org/mongo-driver/bson"
)

func TopPlatillos() ([]bson.M, error) {

	collection := config.DB.Collection("ordenes")

	pipeline := []bson.M{

		{"$match": bson.M{
			"estado": "entregada",
		}},

		{"$unwind": "$items"},

		{"$group": bson.M{
			"_id": bson.M{
				"restaurante": "$restaurante_id",
				"articulo":    "$items.articulo_id",
			},
			"cantidad_total": bson.M{
				"$sum": "$items.cantidad",
			},
			"ingresos": bson.M{
				"$sum": bson.M{
					"$multiply": []interface{}{
						"$items.cantidad",
						"$items.precio_unitario",
					},
				},
			},
		}},

		{"$sort": bson.M{
			"cantidad_total": -1,
		}},

		{"$limit": 5},
	}

	cursor, err := collection.Aggregate(context.Background(), pipeline)
	if err != nil {
		return nil, err
	}

	var results []bson.M

	cursor.All(context.Background(), &results)

	return results, nil
}

func TopUsuarios() ([]bson.M, error) {

	collection := config.DB.Collection("ordenes")

	pipeline := []bson.M{

		{"$match": bson.M{
			"estado": "entregada",
		}},

		{"$group": bson.M{
			"_id": "$usuario_id",
			"total_gastado": bson.M{
				"$sum": "$total",
			},
			"cantidad_pedidos": bson.M{
				"$sum": 1,
			},
		}},

		{"$sort": bson.M{
			"total_gastado": -1,
		}},

		{"$limit": 10},

		{"$lookup": bson.M{
			"from":         "usuarios",
			"localField":   "_id",
			"foreignField": "_id",
			"as":           "usuario",
		}},

		{"$unwind": "$usuario"},

		{"$project": bson.M{
			"nombre":           "$usuario.nombre",
			"correo":           "$usuario.correo",
			"total_gastado":    1,
			"cantidad_pedidos": 1,
		}},
	}

	cursor, err := collection.Aggregate(context.Background(), pipeline)
	if err != nil {
		return nil, err
	}

	var results []bson.M

	cursor.All(context.Background(), &results)

	return results, nil
}
