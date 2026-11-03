package presentation

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/AIFixed/backend-go/internal/client/ai"
	"github.com/AIFixed/backend-go/internal/middleware"
	"github.com/AIFixed/backend-go/internal/response"
	presSvc "github.com/AIFixed/backend-go/internal/services/presentation"
	"github.com/google/uuid"
)

type PresentationHandler struct {
	presSvc  *presSvc.PresentationService
	aiClient *ai.Client
}

func NewPresentationHandler(presSvc *presSvc.PresentationService, aiClient *ai.Client) *PresentationHandler {
	return &PresentationHandler{
		presSvc:  presSvc,
		aiClient: aiClient,
	}
}

func (h *PresentationHandler) MyPresentations(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r)

	userStrID := strconv.Itoa(int(user.ID))

	presentations, err := h.presSvc.GetUserPresentations(userStrID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Database error")
		return
	}

	response.JSON(w, http.StatusOK, presentations)
}

func (h *PresentationHandler) DeletePresentation(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r)

	presentationID := r.PathValue("id")
	if presentationID == "" {
		response.Error(w, http.StatusBadRequest, "Missing presentation ID")
		return
	}

	userStrID := strconv.Itoa(int(user.ID))

	err := h.presSvc.RemovePresentation(presentationID, userStrID)
	if err != nil {
		if err.Error() == "presentation not found" {
			response.Error(w, http.StatusNotFound, "Presentation not found")
			return
		}
		response.Error(w, http.StatusInternalServerError, "Database error")
		return
	}

	response.JSON(w, http.StatusOK, response.StatusResponse{Message: "Presentation deleted"})
}

func (h *PresentationHandler) SavePresentation(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r)

	var req SavePresentationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	presID := ""
	if req.ID == nil || *req.ID == "" {
		presID = uuid.NewString()
	} else {
		presID = *req.ID
	}

	userStrID := strconv.Itoa(int(user.ID))

	err := h.presSvc.SaveOrCreatePresentation(presID, userStrID, req.Title, req.Content, req.Theme)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Database error")
		return
	}

	response.JSON(w, http.StatusOK, response.IDResponse{
		ID:      presID,
		Message: "Presentation saved",
	})
}
