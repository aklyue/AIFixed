package main

import (
	"log"
	"net/http"

	"github.com/AIFixed/backend-go/internal/db"
	handlers "github.com/AIFixed/backend-go/internal/handlers/auth"
	"github.com/AIFixed/backend-go/internal/middleware"
	services "github.com/AIFixed/backend-go/internal/services/auth"
)

func main() {
	dsn := "postgres://user:password@localhost:5432/dbname?sslmode=disable"
	database, err := db.NewPostgresDB(dsn)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	defer database.Close()

	authService := services.NewAuthService(database)
	authHandler := handlers.NewAuthHandler(authService)
	authMW := middleware.AuthMiddleware(authService)

	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/auth/login", authHandler.Login)
	mux.Handle("GET /api/auth/me", authMW(http.HandlerFunc(handlers.HandleMe)))

	log.Println("Server is running on :8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
