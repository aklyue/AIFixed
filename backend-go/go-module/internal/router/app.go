package router

import (
	"net/http"

	msgHandler "github.com/AIFixed/backend-go/internal/handlers/message"
	presHandler "github.com/AIFixed/backend-go/internal/handlers/presentation"
	tempfileHandler "github.com/AIFixed/backend-go/internal/handlers/tempfile"
)

func registerAppRoutes(
	mux *http.ServeMux,
	presH *presHandler.PresentationHandler,
	msgH *msgHandler.MessageHandler,
	tempH *tempfileHandler.TempfileHandler,
	authMW func(http.Handler) http.Handler,
) {
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status": "ok", "service": "go-gateway"}`))
	})
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("AIFixed Go Gateway is running"))
	})

	mux.HandleFunc("GET /api/files/{filename}", tempH.GetTempfileHandler)
	mux.HandleFunc("POST /api/message", msgH.SendMessage)

	mux.Handle("GET /api/presentation/my-presentations", authMW(http.HandlerFunc(presH.MyPresentations)))
	mux.Handle("DELETE /api/presentation/presentations/{presentation_id}", authMW(http.HandlerFunc(presH.DeletePresentation)))
	mux.Handle("POST /api/presentation/save-presentation", authMW(http.HandlerFunc(presH.SavePresentation)))
	mux.HandleFunc("POST /api/presentation/generate", presH.GeneratePresentation)
	mux.HandleFunc("POST /api/presentation/edit", presH.EditSlide)
}
