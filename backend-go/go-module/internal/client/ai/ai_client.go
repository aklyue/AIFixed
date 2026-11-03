package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type Client struct {
	baseURL    string
	httpClient *http.Client
}

func NewClient(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 90 * time.Second,
		},
	}
}

func (c *Client) SendMessage(ctx context.Context, bodyProvider func() ([]byte, string, error)) (interface{}, int, error) {
	apiURL := c.baseURL + "/message"

	bodyBytes, contentType, err := bodyProvider()
	if err != nil {
		return nil, http.StatusInternalServerError, fmt.Errorf("failed to read request body: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, http.StatusInternalServerError, fmt.Errorf("failed to create request to AI service: %w", err)
	}
	req.Header.Set("Content-Type", contentType)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, http.StatusBadGateway, fmt.Errorf("AI service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, resp.StatusCode, fmt.Errorf("AI service returned error status")
	}

	var aiResponse struct {
		Content interface{} `json:"content"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&aiResponse); err != nil {
		return nil, http.StatusInternalServerError, fmt.Errorf("failed to decode AI response: %w", err)
	}

	return aiResponse.Content, http.StatusOK, nil
}

func (c *Client) ProxyStream(ctx context.Context, method, path, contentType string, body io.Reader, w http.ResponseWriter) (int, error) {
	apiURL := c.baseURL + path

	req, err := http.NewRequestWithContext(ctx, method, apiURL, body)
	if err != nil {
		return http.StatusInternalServerError, fmt.Errorf("failed to create request to AI service: %w", err)
	}

	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return http.StatusBadGateway, fmt.Errorf("AI service unavailable: %w", err)
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return resp.StatusCode, fmt.Errorf("AI service returned error status: %d", resp.StatusCode)
	}

	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.WriteHeader(resp.StatusCode)

	if _, err := io.Copy(w, resp.Body); err != nil {
		return resp.StatusCode, fmt.Errorf("failed to stream response body: %w", err)
	}

	return http.StatusOK, nil
}
