package middleware

import (
	"context"
	"net/http"

	"github.com/AIFixed/backend-go/internal/config"
	services "github.com/AIFixed/backend-go/internal/services/auth"
)

type contextKey string

const userContextKey contextKey = "currentUser"

func AuthMiddleware(authService *services.AuthService, cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie("access_token")
			if err != nil || cookie.Value == "" {
				http.Error(w, "Not authenticated", http.StatusUnauthorized)
				return
			}

			userID, err := services.VerifyAccessToken(cookie.Value, cfg.SecretKey)
			if err != nil {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			user, err := authService.GetUserByID(userID)
			if err != nil {
				http.Error(w, "User not found", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), userContextKey, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetUserFromContext(r *http.Request) *services.User {
	user, _ := r.Context().Value(userContextKey).(*services.User)
	return user
}
