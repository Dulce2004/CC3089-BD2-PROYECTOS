package services

import (
	"Proyecto-BD2/config"
	"Proyecto-BD2/models"
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CrearArticuloMenu(articulo models.ArticuloMenu) error {
	collection := config.DB.Collection("articulos_menu")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	articulo.Disponible = true
	_, err := collection.InsertOne(ctx, articulo)
	return err
}

func GetMenuRestaurante(restauranteID string) ([]models.ArticuloMenu, error) {
	collection := config.DB.Collection("articulos_menu")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	objID, err := primitive.ObjectIDFromHex(restauranteID)
	if err != nil {
		return nil, err
	}

	cursor, err := collection.Find(ctx, bson.M{"restaurante_id": objID})
	if err != nil {
		return nil, err
	}

	var articulos []models.ArticuloMenu
	if err = cursor.All(ctx, &articulos); err != nil {
		return nil, err
	}
	return articulos, nil
}

func UpdateArticuloMenu(id string, update bson.M) error {
	collection := config.DB.Collection("articulos_menu")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	delete(update, "_id")
	delete(update, "restaurante_id")

	_, err = collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": update})
	return err
}

func DeleteArticuloMenu(id string) error {
	collection := config.DB.Collection("articulos_menu")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	_, err = collection.DeleteOne(ctx, bson.M{"_id": objID})
	return err
}
