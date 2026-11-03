package presentation

import (
	"net/http"

	"github.com/AIFixed/backend-go/internal/response"
)

func (h *PresentationHandler) GeneratePresentation(w http.ResponseWriter, r *http.Request) {
	statusCode, err := h.aiClient.ProxyStream(r.Context(), http.MethodPost, "/presentation/generate", r.Header.Get("Content-Type"), r.Body, w)
	if err != nil {
		response.Error(w, statusCode, "AI service error")
		return
	}
}

func (h *PresentationHandler) EditSlide(w http.ResponseWriter, r *http.Request) {
	statusCode, err := h.aiClient.ProxyStream(r.Context(), http.MethodPost, "/presentation/edit", "application/json", r.Body, w)
	if err != nil {
		response.Error(w, statusCode, "AI service error")
		return
	}
}
