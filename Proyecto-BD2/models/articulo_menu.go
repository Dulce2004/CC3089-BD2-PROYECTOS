package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type ArticuloMenu struct {
	ID            primitive.ObjectID `bson:"_id,omitempty"`
	RestauranteID primitive.ObjectID `bson:"restaurante_id"`
	Nombre        string             `bson:"nombre"`
	Descripcion   string             `bson:"descripcion"`
	Precio        float64            `bson:"precio"`
	Disponible    bool               `bson:"disponible"`
	Categoria     string             `bson:"categoria"`
}
