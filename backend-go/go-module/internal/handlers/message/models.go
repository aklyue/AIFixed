package message

type MessageResponse struct {
	PresentationID *string     `json:"presentation_id"`
	Content        interface{} `json:"content"`
}
