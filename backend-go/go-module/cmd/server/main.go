package main

import (
	"context"
	"log"
	"net/http"

	"github.com/AIFixed/backend-go/internal/config"
	"github.com/AIFixed/backend-go/internal/db"
	authHandler "github.com/AIFixed/backend-go/internal/handlers/auth"
	msgHandler "github.com/AIFixed/backend-go/internal/handlers/message"
	presHandler "github.com/AIFixed/backend-go/internal/handlers/presentation"
	tempfileHandler "github.com/AIFixed/backend-go/internal/handlers/tempfile"
	userHandler "github.com/AIFixed/backend-go/internal/handlers/user"
	"github.com/AIFixed/backend-go/internal/middleware"
	authService "github.com/AIFixed/backend-go/internal/services/auth"
	presService "github.com/AIFixed/backend-go/internal/services/presentation"
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
	emailVerifier := authService.NewEmailVerifier()

	presSvc := presService.NewPresentationService(database)

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
	msgH := msgHandler.NewMessageHandler(presSvc, cfg.TempfileDir)
	presH := presHandler.NewPresentationHandler(database)

	authMW := middleware.AuthMiddleware(authSvc, cfg)

	userH := userHandler.NewUserHandler(authSvc, emailVerifier, cfg)

	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/auth/register", authH.Register)
	mux.HandleFunc("POST /api/auth/login", authH.Login)
	mux.Handle("GET /api/auth/me", authMW(http.HandlerFunc(authH.HandleMe)))

	mux.Handle("PUT /api/user/edit", authMW(http.HandlerFunc(userH.EditUser)))

	mux.HandleFunc("GET /api/auth/github/login", githubOAuthH.Login)
	mux.HandleFunc("GET /api/auth/github/callback", githubOAuthH.Callback)

	mux.HandleFunc("GET /api/auth/google/login", googleOAuthH.Login)
	mux.HandleFunc("GET /api/auth/google/callback", googleOAuthH.Callback)

	mux.HandleFunc("GET /api/files/{filename}", tempH.GetTempfileHandler)

	mux.HandleFunc("POST /api/message", msgH.SendMessage)

	mux.Handle("GET /api/presentation/my-presentations", authMW(http.HandlerFunc(presH.MyPresentations)))
	mux.Handle("DELETE /api/presentation/presentations/{presentation_id}", authMW(http.HandlerFunc(presH.DeletePresentation)))
	mux.Handle("POST /api/presentation/save-presentation", authMW(http.HandlerFunc(presH.SavePresentation)))

	mux.HandleFunc("POST /api/presentation/generate", presH.GeneratePresentation)
	mux.HandleFunc("POST /api/presentation/edit", presH.EditSlide)

	log.Println("Server is running on :8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
