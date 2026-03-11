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

// Actualizar 1 documento y Manejo de Arrays ($push)
func AgregarDireccionUsuario(usuarioID string, nuevaDireccion models.Direccion) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.DB.Collection("usuarios")
	objID, err := primitive.ObjectIDFromHex(usuarioID)
	if err != nil {
		return err
	}

	filtro := bson.M{"_id": objID}
	// Usamos $push para agregar al array de direcciones
	actualizacion := bson.M{"$push": bson.M{"direcciones": nuevaDireccion}}

	_, err = collection.UpdateOne(ctx, filtro, actualizacion)
	return err
}

// Manejo de Arrays ($pull) - Eliminar dirección del array por calle
func EliminarDireccionUsuario(usuarioID string, calle string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.DB.Collection("usuarios")
	objID, err := primitive.ObjectIDFromHex(usuarioID)
	if err != nil {
		return err
	}

	filtro := bson.M{"_id": objID}
	// Usamos $pull para eliminar del array de direcciones donde la calle coincida
	actualizacion := bson.M{"$pull": bson.M{"direcciones": bson.M{"calle": calle}}}

	_, err = collection.UpdateOne(ctx, filtro, actualizacion)
	return err
}

// Eliminar 1 usuario
func DeleteUsuario(id string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.DB.Collection("usuarios")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	_, err = collection.DeleteOne(ctx, bson.M{"_id": objID})
	return err
}
