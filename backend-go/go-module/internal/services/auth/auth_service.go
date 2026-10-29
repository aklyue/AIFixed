package auth

import (
	"database/sql"
	"errors"
)

type User struct {
	ID       uint   `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Provider string `json:"provider"`
}

type AuthService struct {
	db *sql.DB
}

func NewAuthService(db *sql.DB) *AuthService {
	return &AuthService{db: db}
}

func (s *AuthService) Register(name, email, password string) (*User, error) {
	hashedPassword, err := HashPassword(password)
	if err != nil {
		return nil, err
	}

	query := `
		INSERT INTO users (name, email, password, provider)
		VALUES ($1, $2, $3, 'local')
		RETURNING id, name, email, provider
	`
	user := &User{}

	err = s.db.QueryRow(query, name, email, hashedPassword).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Provider,
	)

	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) Login(name, email, password string) (*User, error) {
	query := `SELECT id, name, email, password, provider FROM users WHERE email = $1`

	user := &User{}

	err := s.db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.Password,
		&user.Provider,
	)

	if err == sql.ErrNoRows {
		return nil, errors.New("invalid login or password")
	} else if err != nil {
		return nil, err
	}

	if !VerifyPassword(password, user.Password) {
		return nil, errors.New("invalid login or password")
	}

	return user, nil
}

func (s *AuthService) FindOrCreateOAuthUser(email, name, avatar, provider string) (*User, error) {
	querySelect := `SELECT id, name, email, provider FROM users WHERE email = $1`

	user := &User{}
	err := s.db.QueryRow(querySelect, email).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Provider,
	)

	if err == nil {
		return user, nil
	}

	if err == sql.ErrNoRows {
		queryInsert := `
			INSERT INTO users (name, email, provider, avatar) 
			VALUES ($1, $2, $3, $4) 
			RETURNING id, name, email, provider
		`

		err = s.db.QueryRow(queryInsert, name, email, provider, avatar).Scan(
			&user.ID,
			&user.Name,
			&user.Email,
			&user.Provider,
		)

		if err != nil {
			return nil, err
		}

		return user, nil
	}

	return user, nil
}

func (s *AuthService) GetUserByID(userID uint) (*User, error) {
	query := `SELECT id, name, email, provider FROM users WHERE id = $1`

	user := &User{}
	err := s.db.QueryRow(query, userID).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Provider,
	)
	if err != nil {
		return nil, err
	}

	return user, nil
}
