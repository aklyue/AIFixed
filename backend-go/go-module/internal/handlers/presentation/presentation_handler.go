package presentation

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/AIFixed/backend-go/internal/middleware"
	"github.com/google/uuid"
)

type PresentationHandler struct {
	db *sql.DB
}

func NewPresentationHandler(db *sql.DB) *PresentationHandler {
	return &PresentationHandler{
		db: db,
	}
}

func (h *PresentationHandler) MyPresentations(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user := middleware.GetUserFromContext(r)
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := h.db.Query(`
		SELECT id, user_id, title, content, theme 
		FROM presentations 
		WHERE user_id = $1
	`, user.ID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	defer rows.Close()

	var presentations []map[string]interface{}
	for rows.Next() {
		var id string
		var userID string
		var title string
		var content, theme []byte

		if err := rows.Scan(&id, &userID, &title, &content, &theme); err != nil {
			continue
		}

		var parsedContent, parsedTheme interface{}
		_ = json.Unmarshal(content, &parsedContent)
		_ = json.Unmarshal(theme, &parsedTheme)

		presentations = append(presentations, map[string]interface{}{
			"id":      id,
			"user_id": userID,
			"title":   title,
			"content": parsedContent,
			"theme":   parsedTheme,
		})
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Database error during iteration", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(presentations)
}

func (h *PresentationHandler) DeletePresentation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user := middleware.GetUserFromContext(r)
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	if len(parts) == 0 {
		http.Error(w, "Invalid URL", http.StatusBadRequest)
		return
	}
	presentationID := parts[len(parts)-1]

	result, err := h.db.Exec(`
		DELETE FROM presentations 
		WHERE id = $1 AND user_id = $2
	`, presentationID, user.ID)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Presentation not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"detail": "Presentation deleted"})
}

type SavePresentationRequest struct {
	ID      *string         `json:"id"`
	Title   string          `json:"title"`
	Content json.RawMessage `json:"content"`
	Theme   json.RawMessage `json:"theme"`
}

func (h *PresentationHandler) SavePresentation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user := middleware.GetUserFromContext(r)
	if user == nil {
		http.Error(w, "Not authenticated", http.StatusUnauthorized)
		return
	}

	var req SavePresentationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	presID := ""
	if req.ID == nil || *req.ID == "" {
		presID = uuid.NewString()
	} else {
		presID = *req.ID
	}

	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM presentations WHERE id = $1 AND user_id = $2)`
	_ = h.db.QueryRow(query, presID, user.ID).Scan(&exists)

	if !exists {
		_, err := h.db.Exec(`
			INSERT INTO presentations (id, user_id, title, content, theme)
			VALUES ($1, $2, $3, $4, $5)
		`, presID, user.ID, req.Title, req.Content, req.Theme)
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
	} else {
		_, err := h.db.Exec(`
			UPDATE presentations 
			SET title = $1, content = $2, theme = $3 
			WHERE id = $4 AND user_id = $5
		`, req.Title, req.Content, req.Theme, presID, user.ID)
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":      presID,
		"message": "Presentation saved",
	})
}
