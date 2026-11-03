package message

import (
	"io"
	"net/http"

	ai "github.com/AIFixed/backend-go/internal/client/ai"
	"github.com/AIFixed/backend-go/internal/middleware"
	"github.com/AIFixed/backend-go/internal/response"
	presService "github.com/AIFixed/backend-go/internal/services/presentation"
)

type MessageHandler struct {
	presSvc  *presService.PresentationService
	aiClient *ai.Client
}

func NewMessageHandler(presSvc *presService.PresentationService, aiClient *ai.Client) *MessageHandler {
	return &MessageHandler{
		presSvc:  presSvc,
		aiClient: aiClient,
	}
}

func (h *MessageHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	content, statusCode, err := h.aiClient.SendMessage(r.Context(), func() ([]byte, string, error) {
		bodyBytes, err := io.ReadAll(r.Body)
		return bodyBytes, r.Header.Get("Content-Type"), err
	})
	if err != nil {
		response.Error(w, statusCode, err.Error())
		return
	}

	currentUser := middleware.GetUserFromContext(r)
	var presID *string

	if currentUser != nil {
		text := r.FormValue("text")
		title := text
		if len(title) > 50 {
			title = title[:50]
		}

		pres, err := h.presSvc.CreatePresentation(&currentUser.ID, title, content)
		if err == nil {
			presID = &pres.ID
		}
	}

	response.JSON(w, http.StatusOK, MessageResponse{
		PresentationID: presID,
		Content:        content,
	})
}
