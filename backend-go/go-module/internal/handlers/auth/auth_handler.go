package auth

import (
	"encoding/json"
	"net/http"

	"github.com/AIFixed/backend-go/internal/config"
	"github.com/AIFixed/backend-go/internal/middleware"
	"github.com/AIFixed/backend-go/internal/response"
	authSvc "github.com/AIFixed/backend-go/internal/services/auth"
)

type AuthHandler struct {
	authService *authSvc.AuthService
	cfg         *config.Config
	verifier    *authSvc.EmailVerifier
}

func NewAuthHandler(authService *authSvc.AuthService, cfg *config.Config, verifier *authSvc.EmailVerifier) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		cfg:         cfg,
		verifier:    verifier,
	}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	user, err := h.authService.Register(req.Name, req.Email, req.Password)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	response.JSON(w, http.StatusCreated, user)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	user, err := h.authService.Login(req.Name, req.Email, req.Password)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	token, err := authSvc.CreateAccessToken(user.ID, 60, h.cfg.SecretKey)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	setAuthCookie(w, token)

	response.JSON(w, http.StatusOK, response.StatusResponse{Message: "logged in successfully"})
}

func (h *AuthHandler) HandleMe(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func setAuthCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		MaxAge:   86400,
		SameSite: http.SameSiteLaxMode,
		Secure:   false,
	})
}

func (h *AuthHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req struct {
		Email string `json:"email"`
		Code  string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	valid, err := h.verifier.VerifyCode(r.Context(), req.Email, req.Code)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Internal server error")
		return
	}
	if !valid {
		response.Error(w, http.StatusBadRequest, "Incorrect or expired code")
		return
	}

	response.JSON(w, http.StatusOK, response.StatusResponse{Message: "Email confirmed successfully"})
}
