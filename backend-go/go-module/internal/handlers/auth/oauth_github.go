package auth

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/AIFixed/backend-go/internal/config"
	services "github.com/AIFixed/backend-go/internal/services/auth"
)

type GithubOAuthHandler struct {
	authService  *services.AuthService
	ClientID     string
	ClientSecret string
	RedirectURI  string
	FrontURL     string
	cfg          *config.Config
}

func NewGithubOAuthHandler(authService *services.AuthService, cfg *config.Config) *GithubOAuthHandler {
	return &GithubOAuthHandler{
		authService:  authService,
		ClientID:     cfg.GithubClientID,
		ClientSecret: cfg.GithubClientSecret,
		RedirectURI:  cfg.GithubRedirectURI,
		FrontURL:     cfg.FrontURL,
		cfg:          cfg,
	}
}

func (h *GithubOAuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	githubAuthURL := fmt.Sprintf(
		"https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=user:email",
		h.ClientID, url.QueryEscape(h.RedirectURI),
	)

	http.Redirect(w, r, githubAuthURL, http.StatusTemporaryRedirect)
}

func (h *GithubOAuthHandler) Callback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "Missing code parameter", http.StatusBadRequest)
	}

	data := url.Values{}
	data.Set("client_id", h.ClientID)
	data.Set("client_secret", h.ClientSecret)
	data.Set("code", code)
	data.Set("redirect_uri", h.RedirectURI)

	httpReq, _ := http.NewRequest("POST", "https://github.com/login/oauth/access_token", strings.NewReader(data.Encode()))
	httpReq.Header.Set("Accept", "application/json")
	httpReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil || resp.StatusCode != http.StatusOK {
		http.Error(w, "Failed to get GitHub token", http.StatusBadRequest)
		return
	}

	defer resp.Body.Close()

	var tokenRes map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&tokenRes)
	githubToken, _ := tokenRes["access_token"].(string)
	if githubToken == "" {
		http.Error(w, "Failed to get GitHub token from response", http.StatusBadRequest)
		return
	}

	userReq, _ := http.NewRequest("GET", "https://api.github.com/user", nil)
	userReq.Header.Set("Authorization", "Bearer "+githubToken)
	userReq.Header.Set("User-Agent", "Go-Auth-App")

	userResp, err := client.Do(userReq)
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
		emailsReq, _ := http.NewRequest("GET", "https://api.github.com/user/emails", nil)
		emailsReq.Header.Set("Authorization", "Bearer "+githubToken)
		emailsReq.Header.Set("User-Agent", "Go-Auth-App")

		emailsResp, err := client.Do(emailsReq)
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

	token, err := services.CreateAccessToken(user.ID, 60, h.cfg.SecretKey)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	setAuthCookie(w, token)
	http.Redirect(w, r, h.FrontURL, http.StatusTemporaryRedirect)
}
