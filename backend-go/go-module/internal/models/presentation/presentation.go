package presentation

import "encoding/json"

type Presentation struct {
	ID      string          `json:"id"`
	UserID  *uint           `json:"user_id,omitempty"`
	Title   string          `json:"title"`
	Content json.RawMessage `json:"content"`
	Theme   json.RawMessage `json:"theme,omitempty"`
}
