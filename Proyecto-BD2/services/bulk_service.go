package services

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"Proyecto-BD2/config"
	"Proyecto-BD2/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type BulkResult struct {
	Usuarios     int64 `json:"usuarios_creados"`
	Restaurantes int64 `json:"restaurantes_creados"`
	Articulos    int64 `json:"articulos_menu_creados"`
	Ordenes      int64 `json:"ordenes_creadas"`
	Resenas      int64 `json:"resenas_creadas"`
}

func GenerarDatosMasivos(cantidad int) (*BulkResult, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	result := &BulkResult{}

	// --- 1. Generar Usuarios ---
	cantUsuarios := cantidad / 10
	if cantUsuarios < 5 {
		cantUsuarios = 5
	}
	usuarios, insertados, err := generarUsuarios(ctx, cantUsuarios)
	if err != nil {
		return nil, fmt.Errorf("error generando usuarios: %w", err)
	}
	result.Usuarios = insertados

	// --- 2. Generar Restaurantes ---
	cantRestaurantes := cantidad / 20
	if cantRestaurantes < 3 {
		cantRestaurantes = 3
	}
	restaurantes, insertados, err := generarRestaurantes(ctx, cantRestaurantes)
	if err != nil {
		return nil, fmt.Errorf("error generando restaurantes: %w", err)
	}
	result.Restaurantes = insertados

	// --- 3. Generar Artículos de Menú ---
	articulos, insertados, err := generarArticulosMenu(ctx, restaurantes)
	if err != nil {
		return nil, fmt.Errorf("error generando artículos de menú: %w", err)
	}
	result.Articulos = insertados

	// --- 4. Generar Órdenes ---
	ordenes, insertados, err := generarOrdenes(ctx, cantidad, usuarios, restaurantes, articulos)
	if err != nil {
		return nil, fmt.Errorf("error generando órdenes: %w", err)
	}
	result.Ordenes = insertados

	// --- 5. Generar Reseñas ---
	insertados, err = generarResenas(ctx, ordenes, usuarios, restaurantes)
	if err != nil {
		return nil, fmt.Errorf("error generando reseñas: %w", err)
	}
	result.Resenas = insertados

	return result, nil
}

// GenerarOrdenesMasivas mantiene la función original para compatibilidad
func GenerarOrdenesMasivas(cantidad int) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	collection := config.DB.Collection("ordenes")

	var modelos []mongo.WriteModel

	estados := []string{"entregada", "pendiente", "cancelada", "en camino"}
	platillos := []string{"Pizza Margherita", "Tacos al Pastor", "Sushi Roll", "Hamburguesa Clásica", "Pasta Carbonara"}

	for i := 0; i < cantidad; i++ {
		cantidad_items := rand.Intn(4) + 1
		items := make([]models.ItemOrden, cantidad_items)
		total := 0.0
		for j := 0; j < cantidad_items; j++ {
			precio := rand.Float64()*(150-20) + 20
			cant := rand.Intn(3) + 1
			items[j] = models.ItemOrden{
				ArticuloID:     primitive.NewObjectID(),
				Nombre:         platillos[rand.Intn(len(platillos))],
				Cantidad:       cant,
				PrecioUnitario: precio,
			}
			total += float64(cant) * precio
		}

		nuevaOrden := models.Orden{
			UsuarioID:     primitive.NewObjectID(),
			RestauranteID: primitive.NewObjectID(),
			Items:         items,
			Estado:        estados[rand.Intn(len(estados))],
			Total:         total,
			FechaPedido:   time.Now().AddDate(0, 0, -rand.Intn(30)),
			Resenado:      false,
		}

		op := mongo.NewInsertOneModel().SetDocument(nuevaOrden)
		modelos = append(modelos, op)
	}

	opts := options.BulkWriteOptions{}
	opts.SetOrdered(false)

	resultado, err := collection.BulkWrite(ctx, modelos, &opts)
	if err != nil {
		return 0, err
	}

	return resultado.InsertedCount, nil
}

// =========== Funciones auxiliares de generación ===========

func generarUsuarios(ctx context.Context, cantidad int) ([]primitive.ObjectID, int64, error) {
	collection := config.DB.Collection("usuarios")

	nombres := []string{"Carlos García", "María López", "Juan Hernández", "Ana Martínez",
		"Pedro Rodríguez", "Laura Sánchez", "Diego Ramírez", "Sofía Torres",
		"Andrés Flores", "Valentina Cruz", "Roberto Morales", "Camila Ortiz",
		"Fernando Díaz", "Isabella Reyes", "Miguel Castillo", "Gabriela Mendoza",
		"José Vargas", "Daniela Rojas", "Luis Guzmán", "Paola Navarro"}

	ciudades := []string{"Ciudad de Guatemala", "Mixco", "Villa Nueva", "Quetzaltenango", "Antigua Guatemala"}
	calles := []string{"Avenida Reforma", "Boulevard Vista Hermosa", "Calzada Roosevelt",
		"Avenida Las Américas", "Calle Martí", "Boulevard Los Próceres", "Avenida Petapa",
		"Calzada San Juan", "Avenida Hincapié", "Boulevard El Naranjo"}

	var modelos []mongo.WriteModel
	var ids []primitive.ObjectID

	for i := 0; i < cantidad; i++ {
		id := primitive.NewObjectID()
		ids = append(ids, id)

		numDirecciones := rand.Intn(3) + 1
		direcciones := make([]models.Direccion, numDirecciones)
		for j := 0; j < numDirecciones; j++ {
			direcciones[j] = models.Direccion{
				Calle:       fmt.Sprintf("%s %d-%d", calles[rand.Intn(len(calles))], rand.Intn(30)+1, rand.Intn(99)+1),
				Zona:        rand.Intn(21) + 1,
				Ciudad:      ciudades[rand.Intn(len(ciudades))],
				Coordenadas: fmt.Sprintf("%.6f, %.6f", 14.5+rand.Float64()*0.2, -(90.5 + rand.Float64()*0.2)),
			}
		}

		nombre := nombres[rand.Intn(len(nombres))]
		usuario := models.Usuario{
			ID:            id,
			Nombre:        nombre,
			Correo:        fmt.Sprintf("user_%s@email.com", id.Hex()),
			Contrasena:    "$2a$10$dummyhashforseeding000000000000000000000000000000",
			Telefono:      fmt.Sprintf("+502 %d-%d", 3000+rand.Intn(7000), 1000+rand.Intn(9000)),
			Direcciones:   direcciones,
			FechaRegistro: time.Now().AddDate(0, -rand.Intn(12), -rand.Intn(28)),
		}

		op := mongo.NewInsertOneModel().SetDocument(usuario)
		modelos = append(modelos, op)
	}

	opts := options.BulkWriteOptions{}
	opts.SetOrdered(false)

	resultado, err := collection.BulkWrite(ctx, modelos, &opts)
	if err != nil {
		return nil, 0, err
	}

	return ids, resultado.InsertedCount, nil
}

func generarRestaurantes(ctx context.Context, cantidad int) ([]primitive.ObjectID, int64, error) {
	collection := config.DB.Collection("restaurantes")

	nombresRestaurantes := []string{
		"La Parrilla del Chef", "Sushi Zen", "Tacos El Güero", "Pizza Napoli",
		"Burger House", "Pollo Campero Express", "Wok & Roll", "Café Barista",
		"El Rincón Chapín", "Pasta La Vista", "Don Taco", "Mar y Tierra",
		"La Esquina del Sabor", "Kebab Palace", "Thai Garden",
		"Antojitos Doña María", "Grill Master", "Sabor Guatemalteco",
		"El Asador Argentino", "Comida China Wong",
	}

	todasCategorias := []string{"Mexicana", "Italiana", "Japonesa", "Guatemalteca",
		"Americana", "China", "Tailandesa", "Argentina", "Mariscos",
		"Postres", "Café", "Comida Rápida", "Saludable", "Vegetariana"}

	// Coordenadas alrededor de Ciudad de Guatemala
	baseLat := 14.6
	baseLng := -90.53

	var modelos []mongo.WriteModel
	var ids []primitive.ObjectID

	for i := 0; i < cantidad; i++ {
		id := primitive.NewObjectID()
		ids = append(ids, id)

		numCats := rand.Intn(3) + 1
		categorias := make([]string, numCats)
		usadas := map[int]bool{}
		for j := 0; j < numCats; j++ {
			idx := rand.Intn(len(todasCategorias))
			for usadas[idx] {
				idx = rand.Intn(len(todasCategorias))
			}
			usadas[idx] = true
			categorias[j] = todasCategorias[idx]
		}

		restaurante := models.Restaurante{
			ID:     id,
			Nombre: fmt.Sprintf("%s #%d", nombresRestaurantes[rand.Intn(len(nombresRestaurantes))], rand.Intn(50)+1),
			Ubicacion: models.Ubicacion{
				Type:        "Point",
				Coordinates: []float64{baseLng + (rand.Float64()-0.5)*0.1, baseLat + (rand.Float64()-0.5)*0.1},
			},
			Categorias:           categorias,
			CalificacionPromedio: float64(rand.Intn(30)+20) / 10.0, // 2.0 - 5.0
			FechaCreacion:        time.Now().AddDate(0, -rand.Intn(24), -rand.Intn(28)),
		}

		op := mongo.NewInsertOneModel().SetDocument(restaurante)
		modelos = append(modelos, op)
	}

	opts := options.BulkWriteOptions{}
	opts.SetOrdered(false)

	resultado, err := collection.BulkWrite(ctx, modelos, &opts)
	if err != nil {
		return nil, 0, err
	}

	return ids, resultado.InsertedCount, nil
}

type articuloConID struct {
	ID            primitive.ObjectID
	RestauranteID primitive.ObjectID
	Nombre        string
	Precio        float64
}

func generarArticulosMenu(ctx context.Context, restauranteIDs []primitive.ObjectID) ([]articuloConID, int64, error) {
	collection := config.DB.Collection("articulos_menu")

	platillosPorCategoria := map[string][]struct {
		nombre string
		precio float64
	}{
		"Entradas": {
			{"Nachos con Guacamole", 45}, {"Sopa del Día", 35}, {"Ensalada César", 40},
			{"Alitas BBQ", 55}, {"Dedos de Queso", 38}, {"Ceviche", 60},
		},
		"Platos Fuertes": {
			{"Pizza Margherita", 75}, {"Hamburguesa Clásica", 65}, {"Tacos al Pastor", 50},
			{"Sushi Roll Especial", 90}, {"Pasta Carbonara", 70}, {"Pollo a la Parrilla", 80},
			{"Churrasco Argentino", 110}, {"Pad Thai", 72}, {"Pepián", 60}, {"Kak'ik", 65},
		},
		"Bebidas": {
			{"Limonada Natural", 18}, {"Horchata", 20}, {"Cerveza Artesanal", 35},
			{"Agua Pura", 10}, {"Café Americano", 22}, {"Smoothie de Frutas", 30},
		},
		"Postres": {
			{"Flan Napolitano", 30}, {"Pastel de Chocolate", 40}, {"Helado Artesanal", 25},
			{"Churros con Chocolate", 28}, {"Rellenitos de Plátano", 20},
		},
	}

	var modelos []mongo.WriteModel
	var articulos []articuloConID

	for _, restID := range restauranteIDs {
		// Cada restaurante tiene entre 5 y 12 artículos
		numArticulos := rand.Intn(8) + 5

		categorias := []string{"Entradas", "Platos Fuertes", "Bebidas", "Postres"}
		count := 0

		for _, cat := range categorias {
			platillos := platillosPorCategoria[cat]
			numDeCategoria := rand.Intn(3) + 1

			for j := 0; j < numDeCategoria && count < numArticulos; j++ {
				p := platillos[rand.Intn(len(platillos))]
				id := primitive.NewObjectID()

				// Variar el precio un poco
				precioFinal := p.precio + (rand.Float64()-0.5)*10

				articulo := models.ArticuloMenu{
					ID:            id,
					RestauranteID: restID,
					Nombre:        p.nombre,
					Descripcion:   fmt.Sprintf("Delicioso(a) %s preparado(a) con ingredientes frescos", p.nombre),
					Precio:        precioFinal,
					Disponible:    rand.Float64() > 0.15, // 85% disponibles
					Categoria:     cat,
				}

				articulos = append(articulos, articuloConID{
					ID:            id,
					RestauranteID: restID,
					Nombre:        p.nombre,
					Precio:        precioFinal,
				})

				op := mongo.NewInsertOneModel().SetDocument(articulo)
				modelos = append(modelos, op)
				count++
			}
		}
	}

	if len(modelos) == 0 {
		return articulos, 0, nil
	}

	opts := options.BulkWriteOptions{}
	opts.SetOrdered(false)

	resultado, err := collection.BulkWrite(ctx, modelos, &opts)
	if err != nil {
		return nil, 0, err
	}

	return articulos, resultado.InsertedCount, nil
}

func generarOrdenes(ctx context.Context, cantidad int, usuarioIDs, restauranteIDs []primitive.ObjectID, articulos []articuloConID) ([]ordenGenerada, int64, error) {
	collection := config.DB.Collection("ordenes")

	estados := []string{"entregada", "pendiente", "cancelada", "en camino"}
	ciudades := []string{"Ciudad de Guatemala", "Mixco", "Villa Nueva", "Quetzaltenango"}
	calles := []string{"Avenida Reforma", "Boulevard Vista Hermosa", "Calzada Roosevelt", "Avenida Las Américas"}

	// Agrupar artículos por restaurante
	articulosPorRest := map[primitive.ObjectID][]articuloConID{}
	for _, a := range articulos {
		articulosPorRest[a.RestauranteID] = append(articulosPorRest[a.RestauranteID], a)
	}

	var modelos []mongo.WriteModel
	var ordenesGeneradas []ordenGenerada

	for i := 0; i < cantidad; i++ {
		usuarioID := usuarioIDs[rand.Intn(len(usuarioIDs))]
		restauranteID := restauranteIDs[rand.Intn(len(restauranteIDs))]

		// Obtener artículos disponibles de este restaurante
		articulosDisponibles := articulosPorRest[restauranteID]
		if len(articulosDisponibles) == 0 {
			continue
		}

		cantidadItems := rand.Intn(4) + 1
		items := make([]models.ItemOrden, cantidadItems)
		total := 0.0

		for j := 0; j < cantidadItems; j++ {
			art := articulosDisponibles[rand.Intn(len(articulosDisponibles))]
			cant := rand.Intn(3) + 1
			items[j] = models.ItemOrden{
				ArticuloID:     art.ID,
				Nombre:         art.Nombre,
				Cantidad:       cant,
				PrecioUnitario: art.Precio,
			}
			total += float64(cant) * art.Precio
		}

		estado := estados[rand.Intn(len(estados))]
		ordenID := primitive.NewObjectID()

		orden := models.Orden{
			ID:            ordenID,
			UsuarioID:     usuarioID,
			RestauranteID: restauranteID,
			Items:         items,
			Estado:        estado,
			Total:         total,
			FechaPedido:   time.Now().AddDate(0, 0, -rand.Intn(60)),
			Direccion: models.Direccion{
				Calle:       fmt.Sprintf("%s %d-%d", calles[rand.Intn(len(calles))], rand.Intn(30)+1, rand.Intn(99)+1),
				Zona:        rand.Intn(21) + 1,
				Ciudad:      ciudades[rand.Intn(len(ciudades))],
				Coordenadas: fmt.Sprintf("%.6f, %.6f", 14.5+rand.Float64()*0.2, -(90.5+rand.Float64()*0.2)),
			},
			Resenado: false,
		}

		ordenesGeneradas = append(ordenesGeneradas, ordenGenerada{
			ID:            ordenID,
			UsuarioID:     usuarioID,
			RestauranteID: restauranteID,
			Estado:        estado,
		})

		op := mongo.NewInsertOneModel().SetDocument(orden)
		modelos = append(modelos, op)
	}

	if len(modelos) == 0 {
		return ordenesGeneradas, 0, nil
	}

	opts := options.BulkWriteOptions{}
	opts.SetOrdered(false)

	resultado, err := collection.BulkWrite(ctx, modelos, &opts)
	if err != nil {
		return nil, 0, err
	}

	return ordenesGeneradas, resultado.InsertedCount, nil
}

type ordenGenerada struct {
	ID            primitive.ObjectID
	UsuarioID     primitive.ObjectID
	RestauranteID primitive.ObjectID
	Estado        string
}

func generarResenas(ctx context.Context, ordenes []ordenGenerada, usuarioIDs, restauranteIDs []primitive.ObjectID) (int64, error) {
	collection := config.DB.Collection("resenas")

	comentarios := []string{
		"Excelente comida, muy recomendado!",
		"Buena relación calidad-precio.",
		"La entrega fue rápida y la comida llegó caliente.",
		"El sabor es increíble, volveré a pedir.",
		"Regular, esperaba algo mejor por el precio.",
		"Muy buen servicio y presentación.",
		"Los platillos estaban frescos y bien preparados.",
		"No me gustó mucho, la comida estaba fría.",
		"Pedido correcto y a tiempo, muy satisfecho.",
		"Porciones generosas y buen sabor.",
		"La mejor comida de la zona, sin duda.",
		"Aceptable pero mejorable en sabor.",
		"Superó mis expectativas, todo delicioso.",
		"El envío tardó un poco pero la comida estaba buena.",
		"No volvería a pedir, mala experiencia.",
	}

	var modelos []mongo.WriteModel

	// Solo generar reseñas para órdenes entregadas (~40% de ellas)
	for _, orden := range ordenes {
		if orden.Estado != "entregada" {
			continue
		}
		if rand.Float64() > 0.4 {
			continue
		}

		resenaDoc := bson.M{
			"usuario_id":     orden.UsuarioID,
			"restaurante_id": orden.RestauranteID,
			"pedido_id":      orden.ID,
			"calificacion":   rand.Intn(5) + 1,
			"comentario":     comentarios[rand.Intn(len(comentarios))],
			"fecha_resena":   time.Now().AddDate(0, 0, -rand.Intn(30)),
		}

		op := mongo.NewInsertOneModel().SetDocument(resenaDoc)
		modelos = append(modelos, op)
	}

	if len(modelos) == 0 {
		return 0, nil
	}

	opts := options.BulkWriteOptions{}
	opts.SetOrdered(false)

	resultado, err := collection.BulkWrite(ctx, modelos, &opts)
	if err != nil {
		return 0, err
	}

	return resultado.InsertedCount, nil
}
