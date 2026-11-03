package presentation

import (
	"io"
	"net/http"
)

func (h *PresentationHandler) GeneratePresentation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	AIModuleURL := h.AIModuleURL

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

	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.WriteHeader(resp.StatusCode)

	_, err = io.Copy(w, resp.Body)
	if err != nil {
		return
	}
}

func (h *PresentationHandler) EditSlide(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	AIModuleURL := h.AIModuleURL

	proxyReq, err := http.NewRequestWithContext(r.Context(), http.MethodPost, AIModuleURL, r.Body)
	if err != nil {
		http.Error(w, "Failed to create proxy request", http.StatusInternalServerError)
		return
	}

	proxyReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(proxyReq)
	if err != nil {
		http.Error(w, "Python AI service unavailable", http.StatusBadGateway)
		return
	}

	defer resp.Body.Close()

	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.WriteHeader(resp.StatusCode)

	_, _ = io.Copy(w, resp.Body)
}
