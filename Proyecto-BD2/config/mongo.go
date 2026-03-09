package config

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var DB *mongo.Database

func ConnectDB(uri string, dbName string) {

	clientOptions := options.Client().ApplyURI(uri)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal(err)
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	DB = client.Database(dbName)

	log.Println("MongoDB connected")
}

func InitIndices(db *mongo.Database) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 1. Índice Simple y Único (Usuarios)
	db.Collection("usuarios").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "correo", Value: 1}},
		Options: options.Index().SetUnique(true),
	})

	// 2. Índice Compuesto (Ordenes)
	db.Collection("ordenes").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "restaurante_id", Value: 1}, {Key: "fecha", Value: -1}},
	})

	// 3. Índice Multikey (Restaurantes - Categorías es un array)
	db.Collection("restaurantes").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "categorias", Value: 1}},
	})

	// 4. Índice Geoespacial (Restaurantes)
	db.Collection("restaurantes").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "ubicacion", Value: "2dsphere"}},
	})

	fmt.Println("🚀 Índices verificados/creados exitosamente")
}
