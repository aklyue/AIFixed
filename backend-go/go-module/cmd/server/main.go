package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	ai "github.com/AIFixed/backend-go/internal/client/ai"
	"github.com/AIFixed/backend-go/internal/config"
	"github.com/AIFixed/backend-go/internal/db"
	authHandler "github.com/AIFixed/backend-go/internal/handlers/auth"
	msgHandler "github.com/AIFixed/backend-go/internal/handlers/message"
	presHandler "github.com/AIFixed/backend-go/internal/handlers/presentation"
	tempfileHandler "github.com/AIFixed/backend-go/internal/handlers/tempfile"
	userHandler "github.com/AIFixed/backend-go/internal/handlers/user"
	presRepository "github.com/AIFixed/backend-go/internal/repository/presentation"
	userRepository "github.com/AIFixed/backend-go/internal/repository/user"
	verifyRepository "github.com/AIFixed/backend-go/internal/repository/verification"
	"github.com/AIFixed/backend-go/internal/router"
	authService "github.com/AIFixed/backend-go/internal/services/auth"
	presService "github.com/AIFixed/backend-go/internal/services/presentation"
	tempfileService "github.com/AIFixed/backend-go/internal/services/tempfile"
	"github.com/AIFixed/backend-go/migrations"
)

func main() {
	cfg := config.Load()

	database, err := db.NewPostgresDB(cfg.DSN())
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := db.RunMigrations(database, migrations.FS); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	userRepo := userRepository.NewUserRepository(database)
	presRepo := presRepository.NewPresentationRepository(database)
	verifyRepo := verifyRepository.NewVerificationRepository(database)

	authSvc := authService.NewAuthService(userRepo)
	emailVerifier := authService.NewEmailVerifier(verifyRepo)
	presSvc := presService.NewPresentationService(presRepo)

	aiClient := ai.NewClient(cfg.AIModuleURL)

	tempSvc, err := tempfileService.NewTempfileService(cfg.TempfileDir, cfg.TempfileCleanupSec)
	if err != nil {
		log.Fatalf("Failed to init tempfile service: %v", err)
	}

	workersCtx, cancelWorkers := context.WithCancel(context.Background())
	defer cancelWorkers()

	go emailVerifier.StartCleanupWorker(workersCtx, 5*time.Minute)
	go tempSvc.StartCleanupWorker(workersCtx)

	authH := authHandler.NewAuthHandler(authSvc, cfg, emailVerifier)
	OAuthH := authHandler.NewOAuthHandler(authSvc, cfg)
	tempH := tempfileHandler.NewTempfileHandler(tempSvc)
	msgH := msgHandler.NewMessageHandler(presSvc, aiClient)
	presH := presHandler.NewPresentationHandler(presSvc, aiClient)
	userH := userHandler.NewUserHandler(authSvc, emailVerifier, cfg)

	handler := router.NewRouter(cfg, authSvc, emailVerifier, presH, msgH, tempH, userH, OAuthH, authH)

	port := ":8080"

	server := &http.Server{
		Addr:    port,
		Handler: handler,
	}

	serverErrors := make(chan error, 1)

	go func() {
		log.Printf("Server is running on %s", port)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErrors <- err
		}
	}()

	shutdownSignal := make(chan os.Signal, 1)
	signal.Notify(shutdownSignal, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)

	select {
	case err := <-serverErrors:
		database.Close()
		log.Fatalf("Server failed to start: %v", err)
	case sig := <-shutdownSignal:
		log.Printf("Main: Intercepted signal %v. Initiating graceful shutdown...", sig)

		log.Println("Main: Stopping background workers...")
		cancelWorkers()

		shutdownCtx, cancelShutdown := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancelShutdown()

		if err := server.Shutdown(shutdownCtx); err != nil {
			log.Printf("Main: HTTP server shutdown failed, forcing close: %v", err)
			if err := server.Close(); err != nil {
				log.Printf("Main: Forced server close failed: %v", err)
			}
		}

		log.Println("Main: Closing database connections...")
		if err := database.Close(); err != nil {
			log.Printf("Main: Database close error: %v", err)
		}
	}
	log.Println("Main: Application gracefully stopped")
}
