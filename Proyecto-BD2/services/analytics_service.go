package services

import (
	"Proyecto-BD2/config"
	"context"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ── explain() helpers ──────────────────────────────────────────────────────

type ExplainResult struct {
	Indice    string `json:"indice"`
	Tipo      string `json:"tipo"`
	Coleccion string `json:"coleccion"`
	Filtro    string `json:"filtro"`
	IndexUsado string `json:"index_usado"`
	Stage     string `json:"stage"`
	UsaIndice bool   `json:"usa_indice"`
}

func findIxscanInPlan(plan bson.M) (indexName, stage string) {
	s, _ := plan["stage"].(string)
	stage = s

	// IXSCAN and EXPRESS_IXSCAN both indicate index usage
	if s == "IXSCAN" || s == "EXPRESS_IXSCAN" {
		if idx, ok := plan["indexName"].(string); ok {
			return idx, s
		}
	}
	if strings.Contains(s, "GEO") || strings.Contains(s, "SPHERE") {
		if idx, ok := plan["indexName"].(string); ok {
			return idx, s
		}
		return "ubicacion_2dsphere", s
	}
	// TEXT index: look deeper
	if s == "TEXT" {
		if input, ok := plan["inputStage"].(bson.M); ok {
			if s2, _ := input["stage"].(string); s2 == "TEXT_MATCH" {
				if input2, ok := input["inputStage"].(bson.M); ok {
					if idx, st := findIxscanInPlan(input2); idx != "" {
						return idx, st
					}
				}
			}
		}
		return "text_nombre_restaurante", s
	}

	if input, ok := plan["inputStage"].(bson.M); ok {
		if idx, st := findIxscanInPlan(input); idx != "" {
			return idx, st
		}
	}
	if inputs, ok := plan["inputStages"].(bson.A); ok {
		for _, inp := range inputs {
			if m, ok := inp.(bson.M); ok {
				if idx, st := findIxscanInPlan(m); idx != "" {
					return idx, st
				}
			}
		}
	}
	return "", s
}

func extractWinningPlan(result bson.M) (indexName, stage string) {
	qp, _ := result["queryPlanner"].(bson.M)
	if qp == nil {
		return "", ""
	}
	wp, _ := qp["winningPlan"].(bson.M)
	if wp == nil {
		return "", ""
	}
	return findIxscanInPlan(wp)
}

func ExplainIndices() ([]ExplainResult, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	type explainCase struct {
		indice    string
		tipo      string
		coleccion string
		filtro    string
		cmd       bson.D
	}

	cases := []explainCase{
		{
			indice:    "Unique Index",
			tipo:      "Simple / Unique",
			coleccion: "usuarios",
			filtro:    `{ correo: "test@example.com" }`,
			cmd: bson.D{
				{Key: "explain", Value: bson.D{
					{Key: "find", Value: "usuarios"},
					{Key: "filter", Value: bson.D{{Key: "correo", Value: "test@example.com"}}},
				}},
				{Key: "verbosity", Value: "queryPlanner"},
			},
		},
		{
			indice:    "Compound Index",
			tipo:      "Compound",
			coleccion: "ordenes",
			filtro:    `{ restaurante_id: ObjectId("000000000000000000000000") }`,
			cmd: bson.D{
				{Key: "explain", Value: bson.D{
					{Key: "find", Value: "ordenes"},
					{Key: "filter", Value: bson.D{
						{Key: "restaurante_id", Value: primitive.NilObjectID},
					}},
				}},
				{Key: "verbosity", Value: "queryPlanner"},
			},
		},
		{
			indice:    "Multikey Index",
			tipo:      "Multikey (Array)",
			coleccion: "restaurantes",
			filtro:    `{ categorias: "pizza" }`,
			cmd: bson.D{
				{Key: "explain", Value: bson.D{
					{Key: "find", Value: "restaurantes"},
					{Key: "filter", Value: bson.D{{Key: "categorias", Value: "pizza"}}},
				}},
				{Key: "verbosity", Value: "queryPlanner"},
			},
		},
		{
			indice:    "2dsphere Index",
			tipo:      "Geospatial (2dsphere)",
			coleccion: "restaurantes",
			filtro:    `{ ubicacion: { $near: { coordinates: [-90.5069, 14.6349], $maxDistance: 5000 } } }`,
			cmd: bson.D{
				{Key: "explain", Value: bson.D{
					{Key: "find", Value: "restaurantes"},
					{Key: "filter", Value: bson.M{
						"ubicacion": bson.M{
							"$near": bson.M{
								"$geometry": bson.M{
									"type":        "Point",
									"coordinates": bson.A{-90.5069, 14.6349},
								},
								"$maxDistance": 5000,
							},
						},
					}},
				}},
				{Key: "verbosity", Value: "queryPlanner"},
			},
		},
		{
			indice:    "Text Index",
			tipo:      "Full-text",
			coleccion: "restaurantes",
			filtro:    `{ $text: { $search: "pizza" } }`,
			cmd: bson.D{
				{Key: "explain", Value: bson.D{
					{Key: "find", Value: "restaurantes"},
					{Key: "filter", Value: bson.M{
						"$text": bson.M{"$search": "pizza"},
					}},
				}},
				{Key: "verbosity", Value: "queryPlanner"},
			},
		},
	}

	var results []ExplainResult
	for _, c := range cases {
		var raw bson.M
		err := config.DB.RunCommand(ctx, c.cmd).Decode(&raw)
		if err != nil {
			results = append(results, ExplainResult{
				Indice:     c.indice,
				Tipo:       c.tipo,
				Coleccion:  c.coleccion,
				Filtro:     c.filtro,
				IndexUsado: "error: " + err.Error(),
				Stage:      "ERROR",
				UsaIndice:  false,
			})
			continue
		}
		idx, stage := extractWinningPlan(raw)
		results = append(results, ExplainResult{
			Indice:     c.indice,
			Tipo:       c.tipo,
			Coleccion:  c.coleccion,
			Filtro:     c.filtro,
			IndexUsado: idx,
			Stage:      stage,
			UsaIndice:  idx != "",
		})
	}
	return results, nil
}

func TopPlatillos() ([]bson.M, error) {

	collection := config.DB.Collection("ordenes")

	pipeline := []bson.M{

		{"$match": bson.M{
			"estado": "entregada",
		}},

		{"$unwind": "$items"},

		{"$group": bson.M{
			"_id": "$items.articulo_id",
			"cantidad_total": bson.M{
				"$sum": "$items.cantidad",
			},
			"ingresos": bson.M{
				"$sum": bson.M{
					"$multiply": []interface{}{
						"$items.cantidad",
						"$items.precio_unitario",
					},
				},
			},
		}},

		{"$sort": bson.M{
			"cantidad_total": -1,
		}},

		{"$limit": 5},

		{"$lookup": bson.M{
			"from":         "articulos_menu",
			"localField":   "_id",
			"foreignField": "_id",
			"as":           "articulo",
		}},

		{"$unwind": "$articulo"},

		{"$project": bson.M{
			"nombre":          "$articulo.nombre",
			"cantidad_total":  1,
			"ingresos":        1,
		}},
	}

	cursor, err := collection.Aggregate(context.Background(), pipeline)
	if err != nil {
		return nil, err
	}

	var results []bson.M

	cursor.All(context.Background(), &results)

	return results, nil
}

func TopUsuarios() ([]bson.M, error) {

	collection := config.DB.Collection("ordenes")

	pipeline := []bson.M{

		{"$match": bson.M{
			"estado": "entregada",
		}},

		{"$group": bson.M{
			"_id": "$usuario_id",
			"total_gastado": bson.M{
				"$sum": "$total",
			},
			"cantidad_pedidos": bson.M{
				"$sum": 1,
			},
		}},

		{"$sort": bson.M{
			"total_gastado": -1,
		}},

		{"$limit": 10},

		{"$lookup": bson.M{
			"from":         "usuarios",
			"localField":   "_id",
			"foreignField": "_id",
			"as":           "usuario",
		}},

		{"$unwind": "$usuario"},

		{"$project": bson.M{
			"nombre":           "$usuario.nombre",
			"correo":           "$usuario.correo",
			"total_gastado":    1,
			"cantidad_pedidos": 1,
		}},
	}

	cursor, err := collection.Aggregate(context.Background(), pipeline)
	if err != nil {
		return nil, err
	}

	var results []bson.M

	cursor.All(context.Background(), &results)

	return results, nil
}
