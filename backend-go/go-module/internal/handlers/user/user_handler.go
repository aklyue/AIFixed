package user

import (
	"encoding/json"
	"net/http"

	"github.com/AIFixed/backend-go/internal/config"
	"github.com/AIFixed/backend-go/internal/middleware"
	"github.com/AIFixed/backend-go/internal/services/auth"
)

type UserHandler struct {
	authSvc  *auth.AuthService
	verifier *auth.EmailVerifier
	cfg      *config.Config
}

func NewUserHandler(authSvc *auth.AuthService, verifier *auth.EmailVerifier, cfg *config.Config) *UserHandler {
	return &UserHandler{
		authSvc:  authSvc,
		verifier: verifier,
		cfg:      cfg,
	}
}

type UpdateUserRequest struct {
	Name  *string `json:"name"`
	Email *string `json:"email"`
}

func (h *UserHandler) EditUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	currentUser := middleware.GetUserFromContext(r)
	if currentUser == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updatedUser, err := h.authSvc.UpdateUser(currentUser.ID, req.Name, req.Email)
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "user not found" {
			status = http.StatusNotFound
		}
		http.Error(w, err.Error(), status)
	}

	if req.Email != nil && *req.Email != currentUser.Email {
		code := h.verifier.SetVerificationCode(*req.Email)

		go func() {
			_ = auth.SendVerificationEmail(*req.Email, code, h.cfg.SMTPHost, h.cfg.SMTPPort, h.cfg.SMTPUser, h.cfg.SMTPPassword, h.cfg.SMTPFromEmail)
		}()
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(updatedUser)
}
