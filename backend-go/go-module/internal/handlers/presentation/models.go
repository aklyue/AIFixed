package presentation

import "encoding/json"

type SavePresentationRequest struct {
	ID      *string         `json:"id"`
	Title   string          `json:"title"`
	Content json.RawMessage `json:"content"`
	Theme   json.RawMessage `json:"theme"`
}
