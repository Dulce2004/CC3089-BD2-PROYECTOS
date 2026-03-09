package main

import (
	"Proyecto-BD2/config"
	"Proyecto-BD2/routes"

	"github.com/gin-gonic/gin"
)

func main() {

	uri := "mongodb+srv://Poposit:8RRcKEhjp927rU2Q@lab01.nznnjvt.mongodb.net/"
	dbName := "Proyecto1-BD2"

	config.ConnectDB(uri, dbName)
	config.InitIndices(config.DB)

	router := gin.Default()

	routes.SetupRoutes(router)

	router.Run(":8080")
}
