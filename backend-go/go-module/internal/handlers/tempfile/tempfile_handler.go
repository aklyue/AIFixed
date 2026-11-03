package tempfile

import (
	"net/http"

	"github.com/AIFixed/backend-go/internal/response"
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
	filename := r.PathValue("filename")
	if filename == "" {
		response.Error(w, http.StatusBadRequest, "Missing filename")
		return
	}

	filePath, err := h.tempfileService.GetFile(filename)
	if err != nil {
		response.Error(w, http.StatusNotFound, "Файл не найден")
		return
	}

	http.ServeFile(w, r, filePath)
}
