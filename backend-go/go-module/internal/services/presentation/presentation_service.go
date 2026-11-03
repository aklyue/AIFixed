package presentation

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"

	presModel "github.com/AIFixed/backend-go/internal/models/presentation"
	presRepo "github.com/AIFixed/backend-go/internal/repository/presentation"
)

type PresentationService struct {
	repo *presRepo.PresentationRepository
}

func NewPresentationService(repo *presRepo.PresentationRepository) *PresentationService {
	return &PresentationService{repo: repo}
}

func (s *PresentationService) CreatePresentation(userID *uint, title string, content interface{}) (*presModel.Presentation, error) {
	presID := uuid.NewString()

	contentBytes, err := json.Marshal(content)
	if err != nil {
		return nil, err
	}

	pres := &presModel.Presentation{
		ID:      presID,
		UserID:  userID,
		Title:   title,
		Content: contentBytes,
	}

	var userStrID string
	if userID != nil {
		userStrID = fmt.Sprintf("%d", *userID)
	}

	err = s.repo.Insert(presID, userStrID, title, contentBytes, nil)
	if err != nil {
		return nil, err
	}

	return pres, nil
}

func (s *PresentationService) GetUserPresentations(userID string) ([]presModel.PresentationResponse, error) {
	rawList, err := s.repo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}

	var result []presModel.PresentationResponse
	for _, raw := range rawList {
		var parsedContent, parsedTheme interface{}
		_ = json.Unmarshal(raw.Content, &parsedContent)
		_ = json.Unmarshal(raw.Theme, &parsedTheme)

		result = append(result, presModel.PresentationResponse{
			ID:      raw.ID,
			UserID:  raw.UserID,
			Title:   raw.Title,
			Content: parsedContent,
			Theme:   parsedTheme,
		})
	}
	return result, nil
}

func (s *PresentationService) RemovePresentation(id, userID string) error {
	rowsAffected, err := s.repo.Delete(id, userID)
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return errors.New("presentation not found")
	}
	return nil
}

func (s *PresentationService) SaveOrCreatePresentation(id, userID, title string, content, theme []byte) error {
	exists, err := s.repo.Exists(id, userID)
	if err != nil {
		return err
	}

	if !exists {
		return s.repo.Insert(id, userID, title, content, theme)
	}
	return s.repo.Update(id, userID, title, content, theme)
}
