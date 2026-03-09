package services

import (
	"Proyecto-BD2/config"
	"Proyecto-BD2/models"
	"context"
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

func jwtSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "proyecto-bd2-secret-key"
	}
	return []byte(secret)
}

func Register(usuario models.Usuario) error {
	if usuario.Correo == "" || usuario.Contrasena == "" {
		return errors.New("correo y contraseña son requeridos")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(usuario.Contrasena), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	usuario.Contrasena = string(hash)
	usuario.FechaRegistro = time.Now()
	if usuario.Direcciones == nil {
		usuario.Direcciones = []models.Direccion{}
	}

	collection := config.DB.Collection("usuarios")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = collection.InsertOne(ctx, usuario)
	return err
}

func Login(correo, contrasena string) (string, *models.Usuario, error) {
	collection := config.DB.Collection("usuarios")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var usuario models.Usuario
	err := collection.FindOne(ctx, bson.M{"correo": correo}).Decode(&usuario)
	if err != nil {
		return "", nil, errors.New("credenciales inválidas")
	}

	if err = bcrypt.CompareHashAndPassword([]byte(usuario.Contrasena), []byte(contrasena)); err != nil {
		return "", nil, errors.New("credenciales inválidas")
	}

	claims := jwt.MapClaims{
		"user_id": usuario.ID.Hex(),
		"correo":  usuario.Correo,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret())
	if err != nil {
		return "", nil, err
	}

	return tokenString, &usuario, nil
}

func GetPerfil(userID string) (*models.Usuario, error) {
	collection := config.DB.Collection("usuarios")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	var usuario models.Usuario
	err = collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&usuario)
	if err != nil {
		return nil, err
	}
	return &usuario, nil
}

func UpdatePerfil(userID string, update bson.M) error {
	collection := config.DB.Collection("usuarios")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	// No permitir cambio de correo/contraseña desde este endpoint
	delete(update, "correo")
	delete(update, "contrasena")
	delete(update, "_id")

	_, err = collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": update})
	return err
}
