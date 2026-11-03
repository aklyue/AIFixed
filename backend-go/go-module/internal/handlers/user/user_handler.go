package user

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/AIFixed/backend-go/internal/config"
	"github.com/AIFixed/backend-go/internal/middleware"
	"github.com/AIFixed/backend-go/internal/response"
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

func (h *UserHandler) EditUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	currentUser := middleware.GetUserFromContext(r)
	if currentUser == nil {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	updatedUser, err := h.authSvc.UpdateUser(currentUser.ID, req.Name, req.Email)
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "user not found" {
			status = http.StatusNotFound
		}
		response.Error(w, status, err.Error())
		return
	}

	if req.Email != nil && *req.Email != currentUser.Email {
		ctx := r.Context()
		code, err := h.verifier.SetVerificationCode(ctx, *req.Email)
		if err != nil {
			log.Printf("Failed to set verification code for email change: %v", err)
			response.Error(w, http.StatusInternalServerError, "Failed to set verification code for email change")
		} else {
			go func() {
				_ = auth.SendVerificationEmail(
					*req.Email,
					code,
					h.cfg.SMTPHost,
					h.cfg.SMTPPort,
					h.cfg.SMTPUser,
					h.cfg.SMTPPassword,
					h.cfg.SMTPFromEmail)
			}()
		}

	}

	response.JSON(w, http.StatusOK, updatedUser)
}
