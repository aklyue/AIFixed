package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/AIFixed/backend-go/internal/config"
	"github.com/AIFixed/backend-go/internal/db"
	authHandler "github.com/AIFixed/backend-go/internal/handlers/auth"
	msgHandler "github.com/AIFixed/backend-go/internal/handlers/message"
	presHandler "github.com/AIFixed/backend-go/internal/handlers/presentation"
	tempfileHandler "github.com/AIFixed/backend-go/internal/handlers/tempfile"
	userHandler "github.com/AIFixed/backend-go/internal/handlers/user"
	"github.com/AIFixed/backend-go/internal/router"
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

	if err := db.RunMigrations(database, os.DirFS("migrations")); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	authSvc := authService.NewAuthService(database)
	emailVerifier := authService.NewEmailVerifier(database)
	presSvc := presService.NewPresentationService(database)

	tempSvc, err := tempfileService.NewTempfileService(cfg.TempfileDir, cfg.TempfileCleanupSec)
	if err != nil {
		log.Fatalf("Failed to init tempfile service: %v", err)
	}

	ctx := context.Background()
	go emailVerifier.StartCleanupWorker(ctx, 5*time.Minute)
	go tempSvc.StartCleanupWorker(ctx)

	authH := authHandler.NewAuthHandler(authSvc, cfg, emailVerifier)
	githubOAuthH := authHandler.NewGithubOAuthHandler(authSvc, cfg)
	googleOAuthH := authHandler.NewGoogleOAuthHandler(authSvc, cfg)
	tempH := tempfileHandler.NewTempfileHandler(tempSvc)
	msgH := msgHandler.NewMessageHandler(presSvc, cfg.AIModuleURL)
	presH := presHandler.NewPresentationHandler(database, cfg.AIModuleURL)
	userH := userHandler.NewUserHandler(authSvc, emailVerifier, cfg)

	handler := router.NewRouter(cfg, authSvc, emailVerifier, presH, msgH, tempH, userH, githubOAuthH, googleOAuthH, authH)

	port := ":8080"
	log.Printf("Server is running on %s", port)
	if err := http.ListenAndServe(port, handler); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
