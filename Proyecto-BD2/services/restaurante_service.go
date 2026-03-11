package services

import (
	"Proyecto-BD2/config"
	"Proyecto-BD2/models"
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func CreateRestaurante(restaurante models.Restaurante) error {

	collection := config.DB.Collection("restaurantes")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	restaurante.FechaCreacion = time.Now()

	_, err := collection.InsertOne(ctx, restaurante)

	return err
}

func GetRestaurantes() ([]models.Restaurante, error) {

	collection := config.DB.Collection("restaurantes")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{})

	if err != nil {
		return nil, err
	}

	var restaurantes []models.Restaurante

	if err = cursor.All(ctx, &restaurantes); err != nil {
		return nil, err
	}

	return restaurantes, nil
}

func GetRestauranteByID(id string) (*models.Restaurante, error) {

	collection := config.DB.Collection("restaurantes")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var restaurante models.Restaurante

	err = collection.FindOne(ctx, bson.M{
		"_id": objectID,
	}).Decode(&restaurante)

	if err != nil {
		return nil, err
	}

	return &restaurante, nil
}

// Búsqueda avanzada con Filtro, Sort, Skip, Limit y Proyección
func BuscarRestaurantesAvanzado(categoria string, limit int64, skip int64) ([]bson.M, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.DB.Collection("restaurantes")

	// Filtro: Si envían categoría, filtramos. Si no, traemos todos.
	filtro := bson.M{}
	if categoria != "" {
		filtro = bson.M{"categorias": categoria}
	}

	// Opciones: Sort (calificacion descendente), Skip, Limit y Proyección
	opts := options.Find().
		SetSort(bson.D{{Key: "calificacion_promedio", Value: -1}}).
		SetSkip(skip).
		SetLimit(limit).
		SetProjection(bson.M{"nombre": 1, "calificacion_promedio": 1, "categorias": 1, "_id": 0}) // Proyección: omitimos _id, traemos info clave

	cursor, err := collection.Find(ctx, filtro, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var resultados []bson.M
	if err = cursor.All(ctx, &resultados); err != nil {
		return nil, err
	}

	return resultados, nil
}

// Agregación Simple: Distinct
func ObtenerCategoriasUnicas() ([]interface{}, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.DB.Collection("restaurantes")

	// Obtenemos los valores distintos del array "categorias"
	categorias, err := collection.Distinct(ctx, "categorias", bson.M{})
	if err != nil {
		return nil, err
	}

	return categorias, nil
}

func BuscarCercanos(long float64, lat float64, metros float64) ([]bson.M, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	collection := config.DB.Collection("restaurantes")

	filtro := bson.M{
		"ubicacion": bson.M{
			"$near": bson.M{
				"$geometry": bson.M{
					"type":        "Point",
					"coordinates": []float64{long, lat},
				},
				"$maxDistance": metros,
			},
		},
	}

	cursor, _ := collection.Find(ctx, filtro)
	var resultados []bson.M
	cursor.All(ctx, &resultados)
	return resultados, nil
}

// UpdateRestaurante actualiza un restaurante por su ID
func UpdateRestaurante(id string, update bson.M) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.DB.Collection("restaurantes")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	delete(update, "_id")
	_, err = collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": update})
	return err
}

// DeleteRestaurante elimina un restaurante por su ID
func DeleteRestaurante(id string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.DB.Collection("restaurantes")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	_, err = collection.DeleteOne(ctx, bson.M{"_id": objID})
	return err
}

// Manejo de Arrays ($addToSet) - Agrega categoría sin duplicados
func AgregarCategoriaRestaurante(restauranteID string, categoria string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.DB.Collection("restaurantes")
	objID, err := primitive.ObjectIDFromHex(restauranteID)
	if err != nil {
		return err
	}

	// $addToSet agrega solo si el valor no existe en el array (sin duplicados)
	_, err = collection.UpdateOne(ctx,
		bson.M{"_id": objID},
		bson.M{"$addToSet": bson.M{"categorias": categoria}},
	)
	return err
}

// Manejo de Arrays ($pull) - Elimina categoría del array
func EliminarCategoriaRestaurante(restauranteID string, categoria string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.DB.Collection("restaurantes")
	objID, err := primitive.ObjectIDFromHex(restauranteID)
	if err != nil {
		return err
	}

	// $pull elimina todas las ocurrencias del valor en el array
	_, err = collection.UpdateOne(ctx,
		bson.M{"_id": objID},
		bson.M{"$pull": bson.M{"categorias": categoria}},
	)
	return err
}

// BuscarPorNombre usa regex sobre el campo nombre (index-friendly al inicio)
func BuscarPorNombre(nombre string) ([]models.Restaurante, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.DB.Collection("restaurantes")

	// Regex case-insensitive - más eficiente con ancla ^ para usar índice
	filtro := bson.M{"nombre": primitive.Regex{Pattern: nombre, Options: "i"}}

	cursor, err := collection.Find(ctx, filtro)
	if err != nil {
		return nil, err
	}

	var restaurantes []models.Restaurante
	if err = cursor.All(ctx, &restaurantes); err != nil {
		return nil, err
	}
	return restaurantes, nil
}

// BuscarPorCategoria usa el índice multikey sobre el array categorias
func BuscarPorCategoria(categoria string) ([]models.Restaurante, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.DB.Collection("restaurantes")

	// El índice multikey de categorias se activa con esta query exacta
	filtro := bson.M{"categorias": categoria}

	cursor, err := collection.Find(ctx, filtro)
	if err != nil {
		return nil, err
	}

	var restaurantes []models.Restaurante
	if err = cursor.All(ctx, &restaurantes); err != nil {
		return nil, err
	}
	return restaurantes, nil
}
