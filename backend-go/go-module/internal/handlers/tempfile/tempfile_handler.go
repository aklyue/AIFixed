package tempfile

import (
	"net/http"
	"strings"

	tempSvc "github.com/AIFixed/backend-go/internal/services/tempfile"
)

type TempfileHandler struct {
	tempfileService *tempSvc.TempfileService
}

func NewTempfileHandler(tempfileService *tempSvc.TempfileService) *TempfileHandler {
	return &TempfileHandler{
		tempfileService: tempfileService,
	}
}

func (h *TempfileHandler) GetTempfileHandler(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) == 0 {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	filename := parts[len(parts)-1]

	filePath, err := h.tempfileService.GetFile(filename)
	if err != nil {
		http.Error(w, "Файл не найден", http.StatusNotFound)
		return
	}

	http.ServeFile(w, r, filePath)
}
