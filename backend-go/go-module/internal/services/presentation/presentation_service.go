package presentation

import (
	"database/sql"
	"encoding/json"

	"github.com/google/uuid"

	"github.com/AIFixed/backend-go/internal/models/presentation"
)

type PresentationService struct {
	db *sql.DB
}

func NewPresentationService(db *sql.DB) *PresentationService {
	return &PresentationService{db: db}
}

func (s *PresentationService) CreatePresentation(userID *uint, title string, content interface{}) (*presentation.Presentation, error) {
	presID := uuid.NewString()

	contentBytes, err := json.Marshal(content)
	if err != nil {
		return nil, err
	}

	query := `
		INSERT INTO presentations (id, user_id, title, content)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, title, content
	`

	pres := &presentation.Presentation{
		ID:      presID,
		UserID:  userID,
		Title:   title,
		Content: contentBytes,
	}

	err = s.db.QueryRow(query, presID, userID, title, contentBytes).Scan(
		&pres.ID,
		&pres.UserID,
		&pres.Title,
		&pres.Content,
	)
	if err != nil {
		return nil, err
	}

	return pres, nil
}
