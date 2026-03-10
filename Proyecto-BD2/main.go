package main

import (
	"Proyecto-BD2/config"
	"Proyecto-BD2/routes"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {

	// Get MongoDB URI from environment variable, with fallback to local
	uri := os.Getenv("MONGO_URI")
	if uri == "" {
		uri = "mongodb+srv://Poposit:8RRcKEhjp927rU2Q@lab01.nznnjvt.mongodb.net/"
	}

	// Get database name from environment variable, with fallback
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "Proyecto1-BD2"
	}

	config.ConnectDB(uri, dbName)
	config.InitIndices(config.DB)

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000", "http://frontend:3000", "http://localhost:8080"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	routes.SetupRoutes(router)

	router.Run(":8080")
}
