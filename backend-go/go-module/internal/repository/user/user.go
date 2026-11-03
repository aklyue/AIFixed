package user

import (
	"database/sql"

	"github.com/AIFixed/backend-go/internal/models/user"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) InsertLocal(name, email, hashedPassword string) (*user.User, error) {
	query := `
		INSERT INTO users (name, email, password, provider)
		VALUES ($1, $2, $3, 'local')
		RETURNING id, name, email, provider
	`
	user := &user.User{}
	err := r.db.QueryRow(query, name, email, hashedPassword).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Provider)
	return user, err
}

func (r *UserRepository) GetByEmail(email string) (*user.User, error) {
	query := `SELECT id, name, email, password, provider FROM users WHERE email = $1`
	user := &user.User{}
	err := r.db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.Password,
		&user.Provider)
	return user, err
}

func (r *UserRepository) InsertOAuth(name, email, provider, avatar string) (*user.User, error) {
	query := `
		INSERT INTO users (name, email, provider, avatar) 
		VALUES ($1, $2, $3, $4) 
		RETURNING id, name, email, provider
	`
	user := &user.User{}
	err := r.db.QueryRow(query, name, email, provider, avatar).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Provider)
	return user, err
}

func (r *UserRepository) GetByID(userID uint) (*user.User, error) {
	query := `SELECT id, name, email, provider FROM users WHERE id = $1`
	user := &user.User{}
	err := r.db.QueryRow(query, userID).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Provider)
	return user, err
}

func (r *UserRepository) CheckEmailExists(email string, excludeID uint) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 AND id != $2)`
	err := r.db.QueryRow(query, email, excludeID).Scan(&exists)
	return exists, err
}

func (r *UserRepository) Update(userID uint, name string, newEmail string, isVerified bool) (*user.User, error) {
	query := `
		UPDATE users 
		SET name = $1, new_email = $2, is_verified = $3 
		WHERE id = $4
		RETURNING id, name, email, new_email, provider, avatar, is_verified
	`
	user := &user.User{}
	err := r.db.QueryRow(query, name, newEmail, isVerified, userID).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.NewEmail,
		&user.Provider,
		&user.Avatar,
		&user.IsVerified,
	)
	return user, err
}
