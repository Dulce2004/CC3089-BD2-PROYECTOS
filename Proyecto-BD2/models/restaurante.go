package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Ubicacion struct {
	Type        string    `bson:"type"`
	Coordinates []float64 `bson:"coordinates"`
}

type Restaurante struct {
	ID                   primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Nombre               string             `bson:"nombre"`
	Ubicacion            Ubicacion          `bson:"ubicacion"`
	Categorias           []string           `bson:"categorias"`
	CalificacionPromedio float64            `bson:"calificacion_promedio"`
	FechaCreacion        time.Time          `bson:"fecha_creacion"`
}
