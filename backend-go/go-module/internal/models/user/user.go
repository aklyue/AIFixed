package user

type User struct {
	ID         uint   `json:"id"`
	Name       string `json:"name"`
	NewEmail   string `json:"new_email,omitempty"`
	Email      string `json:"email"`
	Password   string `json:"password,omitempty"`
	Provider   string `json:"provider"`
	Avatar     string `json:"avatar,omitempty"`
	IsVerified bool   `json:"is_verified"`
}
