package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/AIFixed/backend-go/internal/config"
	"github.com/AIFixed/backend-go/internal/response"
	authSvc "github.com/AIFixed/backend-go/internal/services/auth"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
)

type OAuthHandler struct {
	authService  *authSvc.AuthService
	githubConfig *oauth2.Config
	googleConfig *oauth2.Config
	frontURL     string
	cfg          *config.Config
}

func NewOAuthHandler(authService *authSvc.AuthService, cfg *config.Config) *OAuthHandler {
	return &OAuthHandler{
		authService: authService,
		githubConfig: &oauth2.Config{
			ClientID:     cfg.GithubClientID,
			ClientSecret: cfg.GithubClientSecret,
			RedirectURL:  cfg.GithubRedirectURI,
			Scopes:       []string{"user:email"},
			Endpoint:     github.Endpoint,
		},
		googleConfig: &oauth2.Config{
			ClientID:     cfg.GoogleClientID,
			ClientSecret: cfg.GoogleClientSecret,
			RedirectURL:  cfg.GoogleRedirectURI,
			Scopes:       []string{"https://googleapis.com", "https://googleapis.com"},
			Endpoint:     google.Endpoint,
		},
		frontURL: cfg.FrontURL,
		cfg:      cfg,
	}
}

func (h *OAuthHandler) getProviderConfig(provider string) (*oauth2.Config, error) {
	switch provider {
	case "github":
		return h.githubConfig, nil
	case "google":
		return h.googleConfig, nil
	default:
		return nil, fmt.Errorf("unknown provider: %s", provider)
	}
}

func (h *OAuthHandler) Login(provider string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		oauthConfig, err := h.getProviderConfig(provider)
		if err != nil {
			response.Error(w, http.StatusBadRequest, err.Error())
			return
		}

		b := make([]byte, 32)
		if _, err := rand.Read(b); err != nil {
			response.Error(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
		state := base64.URLEncoding.EncodeToString(b)

		http.SetCookie(w, &http.Cookie{
			Name:     "oauth_state_" + provider,
			Value:    state,
			Path:     "/",
			HttpOnly: true,
			MaxAge:   86400,
			SameSite: http.SameSiteLaxMode,
			Secure:   false,
		})

		url := oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOnline)
		http.Redirect(w, r, url, http.StatusTemporaryRedirect)

	}
}

func (h *OAuthHandler) Callback(provider string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := context.Background()

		oauthConfig, err := h.getProviderConfig(provider)
		if err != nil {
			response.Error(w, http.StatusBadRequest, err.Error())
			return
		}

		cookie, err := r.Cookie("oauth_state_" + provider)
		if err != nil || cookie.Value != r.URL.Query().Get("state") {
			response.Error(w, http.StatusBadRequest, "CSRF token mismatch. Invalid state.")
			return
		}

		http.SetCookie(w, &http.Cookie{
			Name:   "oauth_state_" + provider,
			Value:  "",
			Path:   "/",
			MaxAge: -1,
		})

		code := r.URL.Query().Get("code")
		if code == "" {
			response.Error(w, http.StatusBadRequest, "Missing code parameter")
			return
		}

		token, err := oauthConfig.Exchange(ctx, code)
		if err != nil {
			response.Error(w, http.StatusBadRequest, fmt.Sprintf("Failed to exchange %s token", provider))
			return
		}

		client := oauthConfig.Client(ctx, token)

		var email, login, avatar string

		if provider == "github" {
			userResp, err := client.Get("https://api.github.com/user")
			if err != nil {
				response.Error(w, http.StatusBadRequest, "Failed to get GitHub user info")
				return
			}

			defer userResp.Body.Close()

			var userInfo map[string]interface{}
			json.NewDecoder(userResp.Body).Decode(&userInfo)

			email, _ = userInfo["email"].(string)
			login, _ = userInfo["login"].(string)
			avatar, _ = userInfo["avatar"].(string)

			if email == "" {
				emailsResp, err := client.Get("https://api.github.com/user/emails")
				if err != nil {
					response.Error(w, http.StatusBadRequest, "Cannot access GitHub emails")
					return
				}
				defer emailsResp.Body.Close()

				var emailsData []map[string]interface{}
				json.NewDecoder(emailsResp.Body).Decode(&emailsData)

				for _, e := range emailsData {
					isPrimary, _ := e["primary"].(bool)
					isVerified, _ := e["verified"].(bool)
					if isPrimary && isVerified {
						email, _ = e["email"].(string)
						break
					}
				}
			}
		} else if provider == "google" {
			userResp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
			if err != nil {
				response.Error(w, http.StatusBadRequest, "Failed to get Google user info")
				return
			}

			defer userResp.Body.Close()

			var userInfo map[string]interface{}
			json.NewDecoder(userResp.Body).Decode(&userInfo)

			email, _ = userInfo["email"].(string)
			login, _ = userInfo["name"].(string)
			avatar, _ = userInfo["picture"].(string)
		}

		if email == "" {
			response.Error(w, http.StatusBadRequest, fmt.Sprintf("%s account has no accessible email", provider))
			return
		}

		user, err := h.authService.FindOrCreateOAuthUser(email, login, avatar, "github")
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "Database error")
			return
		}

		jwtToken, err := authSvc.CreateAccessToken(user.ID, 60, h.cfg.SecretKey)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "Internal server error")
			return
		}

		setAuthCookie(w, jwtToken)
		http.Redirect(w, r, h.frontURL, http.StatusTemporaryRedirect)
	}
}
