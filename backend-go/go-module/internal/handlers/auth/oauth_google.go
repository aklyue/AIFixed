package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	services "github.com/AIFixed/backend-go/internal/services/auth"
)

type GoogleOAuthHandler struct {
	authService  *services.AuthService
	ClientID     string
	ClientSecret string
	RedirectURI  string
	FrontURL     string
}

func NewGoogleOAuthHandler(authService *services.AuthService, clientID, clientSecret, redirectURI, frontURL string) *GoogleOAuthHandler {
	return &GoogleOAuthHandler{
		authService:  authService,
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURI:  redirectURI,
		FrontURL:     frontURL,
	}
}

func (h *GoogleOAuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	googleURL := fmt.Sprintf(
		"https://accounts.google.com/o/oauth2/v2/auth?client_id=%s&redirect_uri=%s&response_type=code&scope=email%%20profile",
		h.ClientID, url.QueryEscape(h.RedirectURI),
	)

	http.Redirect(w, r, googleURL, http.StatusTemporaryRedirect)
}

func (h *GoogleOAuthHandler) Callback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "Missing code parameter", http.StatusBadRequest)
		return
	}

	data := url.Values{}
	data.Set("client_id", h.ClientID)
	data.Set("client_secret", h.ClientSecret)
	data.Set("code", code)
	data.Set("redirect_uri", h.RedirectURI)
	data.Set("grant_type", "authorization_code")

	resp, err := http.PostForm("https://oauth2.googleapis.com/token", data)
	if err != nil || resp.StatusCode != http.StatusOK {
		http.Error(w, "Failed to get Google access token", http.StatusBadRequest)
		return
	}

	defer resp.Body.Close()

	var tokenRes map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&tokenRes)
	accessToken, _ := tokenRes["access_token"].(string)
	if accessToken == "" {
		http.Error(w, "Failed to get access token", http.StatusBadRequest)
		return
	}

	httpReq, _ := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	httpReq.Header.Set("Authorization", "Bearer "+accessToken)
	client := &http.Client{}
	userResp, err := client.Do(httpReq)
	if err != nil {
		http.Error(w, "Failed to get Google user info", http.StatusBadRequest)
		return
	}

	defer userResp.Body.Close()

	var userInfo map[string]interface{}
	json.NewDecoder(userResp.Body).Decode(&userInfo)

	email, _ := userInfo["email"].(string)
	name, _ := userInfo["name"].(string)
	picture, _ := userInfo["picture"].(string)

	if email == "" {
		http.Error(w, "Google account has no accessible email", http.StatusBadRequest)
		return
	}

	user, err := h.authService.FindOrCreateOAuthUser(email, name, picture, "google")
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	token, err := services.CreateAccessToken(user.ID, 60)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	setAuthCookie(w, token)
	http.Redirect(w, r, h.FrontURL, http.StatusTemporaryRedirect)
}
