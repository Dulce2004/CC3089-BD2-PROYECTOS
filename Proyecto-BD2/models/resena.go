package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Resena struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UsuarioID     string             `bson:"usuario_id" json:"usuario_id"`
	RestauranteID string             `bson:"restaurante_id" json:"restaurante_id"`
	PedidoID      string             `bson:"pedido_id" json:"pedido_id"`
	Calificacion  int                `bson:"calificacion" json:"calificacion"`
	Comentario    string             `bson:"comentario" json:"comentario"`
	FechaResena   time.Time          `bson:"fecha_resena"`
}
