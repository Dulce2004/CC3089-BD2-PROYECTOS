package services

import (
	"Proyecto-BD2/config"
	"Proyecto-BD2/models"
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateUsuario(usuario models.Usuario) error {

	collection := config.DB.Collection("usuarios")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	usuario.FechaRegistro = time.Now()

	_, err := collection.InsertOne(ctx, usuario)

	return err
}

func GetUsuarios() ([]models.Usuario, error) {

	collection := config.DB.Collection("usuarios")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{})

	if err != nil {
		return nil, err
	}

	var usuarios []models.Usuario

	if err = cursor.All(ctx, &usuarios); err != nil {
		return nil, err
	}

	return usuarios, nil
}

func GetUsuarioByID(id string) (*models.Usuario, error) {

	collection := config.DB.Collection("usuarios")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var usuario models.Usuario

	err = collection.FindOne(ctx, bson.M{
		"_id": objectID,
	}).Decode(&usuario)

	if err != nil {
		return nil, err
	}

	return &usuario, nil
}
