package auth

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/AIFixed/backend-go/internal/config"
	authSvc "github.com/AIFixed/backend-go/internal/services/auth"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
)

type GithubOAuthHandler struct {
	authService *authSvc.AuthService
	oauthConfig *oauth2.Config
	frontURL    string
	cfg         *config.Config
}

func NewGithubOAuthHandler(authService *authSvc.AuthService, cfg *config.Config) *GithubOAuthHandler {
	return &GithubOAuthHandler{
		authService: authService,
		oauthConfig: &oauth2.Config{
			ClientID:     cfg.GithubClientID,
			ClientSecret: cfg.GithubClientSecret,
			RedirectURL:  cfg.GithubRedirectURI,
			Scopes:       []string{"user:email"},
			Endpoint:     github.Endpoint,
		},
		frontURL: cfg.FrontURL,
		cfg:      cfg,
	}
}

func (h *GithubOAuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	url := h.oauthConfig.AuthCodeURL("state-string", oauth2.AccessTypeOnline)

	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func (h *GithubOAuthHandler) Callback(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "Missing code parameter", http.StatusBadRequest)
	}

	token, err := h.oauthConfig.Exchange(ctx, code)
	if err != nil {
		http.Error(w, "Failed to exchange GitHub token", http.StatusBadRequest)
		return
	}

	client := h.oauthConfig.Client(ctx, token)

	userResp, err := client.Get("https://api.github.com/user")
	if err != nil {
		http.Error(w, "Failed to get GitHub user info", http.StatusBadRequest)
		return
	}

	defer userResp.Body.Close()

	var userInfo map[string]interface{}
	json.NewDecoder(userResp.Body).Decode(&userInfo)

	email, _ := userInfo["email"].(string)
	login, _ := userInfo["login"].(string)
	avatar, _ := userInfo["avatar"].(string)

	if email == "" {
		emailsResp, err := client.Get("https://api.github.com/user/emails")
		if err != nil {
			http.Error(w, "Cannot access GitHub emails", http.StatusBadRequest)
		}
		defer emailsResp.Body.Close()

		if err == nil {
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
	}

	if email == "" {
		http.Error(w, "GitHub account has no accessible email", http.StatusBadRequest)
		return
	}

	user, err := h.authService.FindOrCreateOAuthUser(email, login, avatar, "github")
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	jwtToken, err := authSvc.CreateAccessToken(user.ID, 60, h.cfg.SecretKey)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	setAuthCookie(w, jwtToken)
	http.Redirect(w, r, h.frontURL, http.StatusTemporaryRedirect)
}
