package services

import (
	"Proyecto-BD2/config"
	"Proyecto-BD2/models"
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func ObtenerResenas() ([]bson.M, error) {
	collection := config.DB.Collection("resenas")
	
	opts := options.Find().SetSort(bson.M{"fecha_resena": -1})
	cursor, err := collection.Find(context.Background(), bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	
	var resenas []bson.M
	if err = cursor.All(context.Background(), &resenas); err != nil {
		return nil, err
	}
	
	return resenas, nil
}

func ObtenerResenasPorRestaurante(restauranteID string) ([]bson.M, error) {
	collection := config.DB.Collection("resenas")
	
	id, err := primitive.ObjectIDFromHex(restauranteID)
	if err != nil {
		return nil, err
	}
	
	opts := options.Find().SetSort(bson.M{"fecha_resena": -1})
	cursor, err := collection.Find(context.Background(), bson.M{"restaurante_id": id}, opts)
	if err != nil {
		return nil, err
	}
	
	var resenas []bson.M
	if err = cursor.All(context.Background(), &resenas); err != nil {
		return nil, err
	}
	
	return resenas, nil
}

func CrearResenaTransaccion(resena models.Resena) error {

	ctx := context.Background()

	client := config.DB.Client()

	session, err := client.StartSession()
	if err != nil {
		return err
	}

	defer session.EndSession(ctx)

	callback := func(sessCtx mongo.SessionContext) (interface{}, error) {

		usuarioID, _ := primitive.ObjectIDFromHex(resena.UsuarioID)
		restauranteID, _ := primitive.ObjectIDFromHex(resena.RestauranteID)
		pedidoID, _ := primitive.ObjectIDFromHex(resena.PedidoID)

		resenaDoc := bson.M{
			"usuario_id":     usuarioID,
			"restaurante_id": restauranteID,
			"pedido_id":      pedidoID,
			"calificacion":   resena.Calificacion,
			"comentario":     resena.Comentario,
			"fecha_resena":   time.Now(),
		}

		// 1️⃣ Insertar reseña
		_, err := config.DB.Collection("resenas").InsertOne(sessCtx, resenaDoc)
		if err != nil {
			return nil, err
		}

		// 2️⃣ Marcar orden como reseñada
		_, err = config.DB.Collection("ordenes").UpdateOne(
			sessCtx,
			bson.M{"_id": pedidoID},
			bson.M{"$set": bson.M{"resenado": true}},
		)

		if err != nil {
			return nil, err
		}

		// 3️⃣ Recalcular promedio restaurante
		pipeline := []bson.M{
			{
				"$match": bson.M{
					"restaurante_id": restauranteID,
				},
			},
			{
				"$group": bson.M{
					"_id": nil,
					"avg": bson.M{"$avg": "$calificacion"},
				},
			},
		}

		cursor, err := config.DB.Collection("resenas").Aggregate(sessCtx, pipeline)
		if err != nil {
			return nil, err
		}

		var result []bson.M
		cursor.All(sessCtx, &result)

		if len(result) > 0 {

			avg := result[0]["avg"]

			_, err = config.DB.Collection("restaurantes").UpdateOne(
				sessCtx,
				bson.M{"_id": restauranteID},
				bson.M{"$set": bson.M{"calificacion_promedio": avg}},
			)

			if err != nil {
				return nil, err
			}
		}

		return nil, nil
	}

	_, err = session.WithTransaction(ctx, callback, options.Transaction())

	return err
}
