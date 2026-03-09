package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type ArticuloMenu struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	RestauranteID primitive.ObjectID `bson:"restaurante_id" json:"restaurante_id"`
	Nombre        string             `bson:"nombre" json:"nombre"`
	Descripcion   string             `bson:"descripcion" json:"descripcion"`
	Precio        float64            `bson:"precio" json:"precio"`
	Disponible    bool               `bson:"disponible" json:"disponible"`
	Categoria     string             `bson:"categoria" json:"categoria"`
}
