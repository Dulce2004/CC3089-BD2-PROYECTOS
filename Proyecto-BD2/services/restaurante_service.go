package services

import (
	"Proyecto-BD2/config"
	"Proyecto-BD2/models"
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateRestaurante(restaurante models.Restaurante) error {

	collection := config.DB.Collection("restaurantes")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	restaurante.FechaCreacion = time.Now()

	_, err := collection.InsertOne(ctx, restaurante)

	return err
}

func GetRestaurantes() ([]models.Restaurante, error) {

	collection := config.DB.Collection("restaurantes")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{})

	if err != nil {
		return nil, err
	}

	var restaurantes []models.Restaurante

	if err = cursor.All(ctx, &restaurantes); err != nil {
		return nil, err
	}

	return restaurantes, nil
}

func GetRestauranteByID(id string) (*models.Restaurante, error) {

	collection := config.DB.Collection("restaurantes")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var restaurante models.Restaurante

	err = collection.FindOne(ctx, bson.M{
		"_id": objectID,
	}).Decode(&restaurante)

	if err != nil {
		return nil, err
	}

	return &restaurante, nil
}
