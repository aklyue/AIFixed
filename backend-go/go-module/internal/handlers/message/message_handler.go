package message

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/AIFixed/backend-go/internal/middleware"
	presService "github.com/AIFixed/backend-go/internal/services/presentation"
)

type MessageHandler struct {
	presSvc     *presService.PresentationService
	AIModuleURL string
}

func NewMessageHandler(presSvc *presService.PresentationService, AIModuleURL string) *MessageHandler {
	return &MessageHandler{
		presSvc:     presSvc,
		AIModuleURL: AIModuleURL,
	}
}

func (h *MessageHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	AIModuleURL := h.AIModuleURL + "/message"

	proxyReq, err := http.NewRequestWithContext(r.Context(), http.MethodPost, AIModuleURL, r.Body)
	if err != nil {
		http.Error(w, "Failed to create proxy request", http.StatusInternalServerError)
		return
	}
	proxyReq.Header.Set("Content-Type", r.Header.Get("Content-Type"))

	client := &http.Client{}
	resp, err := client.Do(proxyReq)
	if err != nil {
		http.Error(w, "Python AI service unavailable", http.StatusBadGateway)
		return
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		http.Error(w, "AI service error", resp.StatusCode)
		return
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Failed to read AI response", http.StatusInternalServerError)
		return
	}

	var aiResponse struct {
		Content interface{} `json:"content"`
	}

	if err := json.Unmarshal(bodyBytes, &aiResponse); err != nil {
		http.Error(w, "Invalid AI response format", http.StatusInternalServerError)
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

		pres, err := h.presSvc.CreatePresentation(&currentUser.ID, title, aiResponse.Content)
		if err == nil {
			presID = &pres.ID
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"presentation_id": presID,
		"content":         aiResponse.Content,
	})
}
