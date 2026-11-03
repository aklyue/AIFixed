package router

import (
	"net/http"

	authHandler "github.com/AIFixed/backend-go/internal/handlers/auth"
	userHandler "github.com/AIFixed/backend-go/internal/handlers/user"
)

func registerAuthRoutes(
	mux *http.ServeMux,
	authH *authHandler.AuthHandler,
	githubH *authHandler.GithubOAuthHandler,
	googleH *authHandler.GoogleOAuthHandler,
	userH *userHandler.UserHandler,
	authMW func(http.Handler) http.Handler,
) {
	mux.HandleFunc("POST /api/auth/register", authH.Register)
	mux.HandleFunc("POST /api/auth/login", authH.Login)
	mux.HandleFunc("POST /api/auth/verify-email", authH.VerifyEmail)
	mux.Handle("GET /api/auth/me", authMW(http.HandlerFunc(authH.HandleMe)))
	mux.Handle("PUT /api/user/edit", authMW(http.HandlerFunc(userH.EditUser)))

	mux.HandleFunc("GET /api/auth/github/login", githubH.Login)
	mux.HandleFunc("GET /api/auth/github/callback", githubH.Callback)

	mux.HandleFunc("GET /api/auth/google/login", googleH.Login)
	mux.HandleFunc("GET /api/auth/google/callback", googleH.Callback)
}
