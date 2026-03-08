package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ItemOrden struct {
	ArticuloID     primitive.ObjectID `bson:"articulo_id" json:"articulo_id"`
	Nombre         string             `bson:"nombre" json:"nombre"`
	Cantidad       int                `bson:"cantidad" json:"cantidad"`
	PrecioUnitario float64            `bson:"precio_unitario" json:"precio_unitario"`
}

type Orden struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UsuarioID     primitive.ObjectID `bson:"usuario_id" json:"usuario_id"`
	RestauranteID primitive.ObjectID `bson:"restaurante_id" json:"restaurante_id"`
	Items         []ItemOrden        `bson:"items" json:"items"`
	Estado        string             `bson:"estado" json:"estado"`
	Total         float64            `bson:"total" json:"total"`
	FechaPedido   time.Time          `bson:"fecha_pedido" json:"fecha_pedido"`
	Direccion     Direccion          `bson:"direccion_entrega" json:"direccion_entrega"`
	Resenado      bool               `bson:"resenado" json:"resenado"`
}
