package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Direccion struct {
	Calle       string `bson:"calle" json:"calle"`
	Zona        int    `bson:"zona" json:"zona"`
	Ciudad      string `bson:"ciudad" json:"ciudad"`
	Coordenadas string `bson:"coordenadas" json:"coordenadas"`
}

type Usuario struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Nombre        string             `bson:"nombre" json:"nombre"`
	Correo        string             `bson:"correo" json:"correo"`
	Telefono      string             `bson:"telefono" json:"telefono"`
	Direcciones   []Direccion        `bson:"direcciones" json:"direcciones"`
	FechaRegistro time.Time          `bson:"fecha_registro" json:"fecha_registro"`
}
