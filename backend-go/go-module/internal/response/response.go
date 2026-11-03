package response

import (
	"encoding/json"
	"net/http"
)

type ResponseError struct {
	Error string `json:"error"`
}

type StatusResponse struct {
	Message string `json:"message"`
}

type IDResponse struct {
	ID      string `json:"id"`
	Message string `json:"message"`
}

func JSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if data != nil {
		if err := json.NewEncoder(w).Encode(data); err != nil {
			// Если не смогли закодировать сам ответ (крайне редко), пишем системную ошибку
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func Error(w http.ResponseWriter, status int, msg string) {
	JSON(w, status, ResponseError{Error: msg})
}
