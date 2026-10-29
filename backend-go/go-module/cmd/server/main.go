package main

import (
	"context"
	"log"
	"net/http"

	"github.com/AIFixed/backend-go/internal/config"
	"github.com/AIFixed/backend-go/internal/db"
	authHandler "github.com/AIFixed/backend-go/internal/handlers/auth"
	tempfileHandler "github.com/AIFixed/backend-go/internal/handlers/tempfile"
	"github.com/AIFixed/backend-go/internal/middleware"
	authService "github.com/AIFixed/backend-go/internal/services/auth"
	tempfileService "github.com/AIFixed/backend-go/internal/services/tempfile"
)

func main() {
	cfg := config.Load()

	database, err := db.NewPostgresDB(cfg.DSN())
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	authSvc := authService.NewAuthService(database)

	tempSvc, err := tempfileService.NewTempfileService(cfg.TempfileDir, cfg.TempfileCleanupSec)
	if err != nil {
		log.Fatalf("Failed to init tempfile service: %v", err)
	}
	ctx := context.Background()
	go tempSvc.StartCleanupWorker(ctx)

	authH := authHandler.NewAuthHandler(authSvc, cfg)
	githubOAuthH := authHandler.NewGithubOAuthHandler(authSvc, cfg)
	googleOAuthH := authHandler.NewGoogleOAuthHandler(authSvc, cfg)
	tempH := tempfileHandler.NewTempfileHandler(tempSvc)

	authMW := middleware.AuthMiddleware(authSvc, cfg)

	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/auth/register", authH.Register)
	mux.HandleFunc("POST /api/auth/login", authH.Login)
	mux.Handle("GET /api/auth/me", authMW(http.HandlerFunc(authH.HandleMe)))

	mux.HandleFunc("GET /auth/github/login", githubOAuthH.Login)
	mux.HandleFunc("GET /auth/github/callback", githubOAuthH.Callback)

	mux.HandleFunc("GET /auth/google/login", googleOAuthH.Login)
	mux.HandleFunc("GET /auth/google/callback", googleOAuthH.Callback)

	mux.HandleFunc("GET /files/{filename}", tempH.GetTempfileHandler)

	log.Println("Server is running on :8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
