package auth

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/AIFixed/backend-go/internal/config"
	authSvc "github.com/AIFixed/backend-go/internal/services/auth"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type GoogleOAuthHandler struct {
	authService *authSvc.AuthService
	oauthConfig *oauth2.Config
	frontURL    string
	cfg         *config.Config
}

func NewGoogleOAuthHandler(authService *authSvc.AuthService, cfg *config.Config) *GoogleOAuthHandler {
	return &GoogleOAuthHandler{
		authService: authService,
		oauthConfig: &oauth2.Config{
			ClientID:     cfg.GoogleClientID,
			ClientSecret: cfg.GoogleClientSecret,
			RedirectURL:  cfg.GoogleRedirectURI,
			Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
			Endpoint:     google.Endpoint,
		},
		frontURL: cfg.FrontURL,
		cfg:      cfg,
	}
}

func (h *GoogleOAuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	url := h.oauthConfig.AuthCodeURL("state-string", oauth2.AccessTypeOnline)

	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func (h *GoogleOAuthHandler) Callback(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "Missing code parameter", http.StatusBadRequest)
		return
	}

	token, err := h.oauthConfig.Exchange(ctx, code)
	if err != nil {
		http.Error(w, "Failed to exchange Google token", http.StatusBadRequest)
		return
	}

	client := h.oauthConfig.Client(ctx, token)

	userResp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
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

	jwtToken, err := authSvc.CreateAccessToken(user.ID, 60, h.cfg.SecretKey)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	setAuthCookie(w, jwtToken)
	http.Redirect(w, r, h.frontURL, http.StatusTemporaryRedirect)
}
