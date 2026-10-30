package message

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/google/uuid"

	"github.com/AIFixed/backend-go/internal/middleware"
	presService "github.com/AIFixed/backend-go/internal/services/presentation"
)

type MessageHandler struct {
	presSvc *presService.PresentationService
	tmpDir  string
}

func NewMessageHandler(presSvc *presService.PresentationService, tmpDir string) *MessageHandler {
	return &MessageHandler{
		presSvc: presSvc,
		tmpDir:  tmpDir,
	}
}

func (h *MessageHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if err := r.ParseMultipartForm(32 << 20); err != nil {
		http.Error(w, "Failed to parse multipart form", http.StatusBadRequest)
		return
	}

	text := r.FormValue("text")
	if text == "" {
		http.Error(w, "Field 'text' is required", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Field 'file' is required", http.StatusBadRequest)
		return
	}

	defer file.Close()

	tmpFileName := uuid.NewString() + filepath.Ext(header.Filename)
	tmpFilePath := filepath.Join(h.tmpDir, tmpFileName)

	dst, err := os.Create(tmpFilePath)
	if err != nil {
		http.Error(w, "Failed to create temp file", http.StatusInternalServerError)
		return
	}

	defer os.Remove(tmpFilePath)

	if _, err := io.Copy(dst, file); err != nil {
		dst.Close()
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	dst.Close()

	modelRes := []map[string]interface{}{
		{"slide": 1, "title": text, "bullets": []string{"Point 1", "Point 2"}},
	}

	currentUser := middleware.GetUserFromContext(r)

	var presID *string
	if currentUser != nil {
		title := text
		if len(title) > 50 {
			title = title[:50]
		}

		pres, err := h.presSvc.CreatePresentation(&currentUser.ID, title, modelRes)
		if err == nil {
			presID = &pres.ID
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"presentation_id": presID,
		"content":         modelRes,
	})
}
