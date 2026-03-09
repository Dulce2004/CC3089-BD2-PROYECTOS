package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Ubicacion struct {
	Type        string    `bson:"type" json:"type"`
	Coordinates []float64 `bson:"coordinates" json:"coordinates"`
}

type Restaurante struct {
	ID                   primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Nombre               string             `bson:"nombre" json:"nombre"`
	Ubicacion            Ubicacion          `bson:"ubicacion" json:"ubicacion"`
	Categorias           []string           `bson:"categorias" json:"categorias"`
	CalificacionPromedio float64            `bson:"calificacion_promedio" json:"calificacion_promedio"`
	FechaCreacion        time.Time          `bson:"fecha_creacion" json:"fecha_creacion"`
}
