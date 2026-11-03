package auth

import (
	"database/sql"
	"errors"

	"github.com/AIFixed/backend-go/internal/models/user"
)

type AuthService struct {
	db *sql.DB
}

func NewAuthService(db *sql.DB) *AuthService {
	return &AuthService{db: db}
}

func (s *AuthService) Register(name, email, password string) (*user.User, error) {
	hashedPassword, err := HashPassword(password)
	if err != nil {
		return nil, err
	}

	query := `
		INSERT INTO users (name, email, password, provider)
		VALUES ($1, $2, $3, 'local')
		RETURNING id, name, email, provider
	`
	user := &user.User{}

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

func (s *AuthService) Login(name, email, password string) (*user.User, error) {
	query := `SELECT id, name, email, password, provider FROM users WHERE email = $1`

	user := &user.User{}

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

func (s *AuthService) FindOrCreateOAuthUser(email, name, avatar, provider string) (*user.User, error) {
	querySelect := `SELECT id, name, email, provider FROM users WHERE email = $1`

	user := &user.User{}
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

func (s *AuthService) GetUserByID(userID uint) (*user.User, error) {
	query := `SELECT id, name, email, provider FROM users WHERE id = $1`

	user := &user.User{}
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

func (s *AuthService) UpdateUser(userID uint, name *string, newEmail *string) (*user.User, error) {
	currentUser, err := s.GetUserByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if name != nil {
		currentUser.Name = *name
	}

	if newEmail != nil && *newEmail != currentUser.Email {
		var exists bool
		err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 AND id != $2)", *newEmail, userID).Scan(&exists)
		if err != nil {
			return nil, err
		}

		if exists {
			return nil, errors.New("email is already used")
		}

		currentUser.NewEmail = *newEmail
		currentUser.IsVerified = false
	}

	query := `
		UPDATE users 
		SET name = $1, new_email = $2, is_verified = $3 
		WHERE id = $4
		RETURNING id, name, email, new_email, provider, avatar, is_verified
	`

	updatedUser := &user.User{}
	err = s.db.QueryRow(query, currentUser.Name, currentUser.NewEmail, currentUser.IsVerified, userID).Scan(
		&updatedUser.ID,
		&updatedUser.Name,
		&updatedUser.Email,
		&updatedUser.NewEmail,
		&updatedUser.Provider,
		&updatedUser.Avatar,
		&updatedUser.IsVerified,
	)
	if err != nil {
		return nil, err
	}

	return updatedUser, nil
}
