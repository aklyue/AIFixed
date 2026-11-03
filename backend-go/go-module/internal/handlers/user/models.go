package user

type UpdateUserRequest struct {
	Name  *string `json:"name"`
	Email *string `json:"email"`
}
