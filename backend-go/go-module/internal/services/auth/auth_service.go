package auth

import (
	"errors"

	"github.com/AIFixed/backend-go/internal/models/user"
	userRepo "github.com/AIFixed/backend-go/internal/repository/user"
)

type AuthService struct {
	userRepo *userRepo.UserRepository
}

func NewAuthService(userRepo *userRepo.UserRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

func (s *AuthService) Register(name, email, password string) (*user.User, error) {
	hashedPassword, err := HashPassword(password)
	if err != nil {
		return nil, err
	}

	return s.userRepo.InsertLocal(name, email, hashedPassword)
}

func (s *AuthService) Login(name, email, password string) (*user.User, error) {
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		return nil, errors.New("invalid login or password")
	}

	if !VerifyPassword(password, user.Password) {
		return nil, errors.New("invalid login or password")
	}

	return user, nil
}

func (s *AuthService) FindOrCreateOAuthUser(email, name, avatar, provider string) (*user.User, error) {
	user, err := s.userRepo.GetByEmail(email)
	if err == nil {
		return user, nil
	}

	return s.userRepo.InsertOAuth(name, email, provider, avatar)
}

func (s *AuthService) GetUserByID(userID uint) (*user.User, error) {
	return s.userRepo.GetByID(userID)
}

func (s *AuthService) UpdateUser(userID uint, name *string, newEmail *string) (*user.User, error) {
	currentUser, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if name != nil {
		currentUser.Name = *name
	}

	if newEmail != nil && *newEmail != currentUser.Email {
		exists, err := s.userRepo.CheckEmailExists(*newEmail, userID)
		if err != nil {
			return nil, err
		}

		if exists {
			return nil, errors.New("email is already used")
		}

		currentUser.NewEmail = *newEmail
		currentUser.IsVerified = false
	}

	return s.userRepo.Update(userID, currentUser.Name, currentUser.NewEmail, currentUser.IsVerified)
}
