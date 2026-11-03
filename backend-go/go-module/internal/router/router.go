package router

import (
	"database/sql"
	"net/http"

	"github.com/AIFixed/backend-go/internal/config"
	authHandler "github.com/AIFixed/backend-go/internal/handlers/auth"
	msgHandler "github.com/AIFixed/backend-go/internal/handlers/message"
	presHandler "github.com/AIFixed/backend-go/internal/handlers/presentation"
	tempfileHandler "github.com/AIFixed/backend-go/internal/handlers/tempfile"
	userHandler "github.com/AIFixed/backend-go/internal/handlers/user"
	"github.com/AIFixed/backend-go/internal/middleware"
	authService "github.com/AIFixed/backend-go/internal/services/auth"
)

type RouterDeps struct {
	Cfg           *config.Config
	AuthSvc       *authService.AuthService
	EmailVerifier *authService.EmailVerifier
	PresSvc       *presHandler.PresentationHandler
	MsgSvc        *msgHandler.MessageHandler
	TempSvc       *tempfileHandler.TempfileHandler
	PresService   *presHandler.PresentationHandler
	Database      *sql.DB
}

func NewRouter(
	cfg *config.Config,
	authSvc *authService.AuthService,
	emailVerifier *authService.EmailVerifier,
	presH *presHandler.PresentationHandler,
	msgH *msgHandler.MessageHandler,
	tempH *tempfileHandler.TempfileHandler,
	userH *userHandler.UserHandler,
	githubH *authHandler.GithubOAuthHandler,
	googleH *authHandler.GoogleOAuthHandler,
	authH *authHandler.AuthHandler,
) http.Handler {
	mux := http.NewServeMux()
	authMW := middleware.AuthMiddleware(authSvc, cfg)

	registerAuthRoutes(mux, authH, githubH, googleH, userH, authMW)
	registerAppRoutes(mux, presH, msgH, tempH, authMW)

	return enableCORS(mux)
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
