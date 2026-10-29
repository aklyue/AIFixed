package config

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	OpenRouterAPIKey  string
	OpenAIAPIKey      string
	OpenRouterAPIURL  string
	DefaultModel      string
	DefaultEmbedding  string
	CrossEncoderModel string

	QdrantHost   string
	QdrantAPIKey string

	TempfileDir        string
	TempfileCleanupSec int

	Domain   string
	FrontURL string

	DBUser     string
	DBPassword string
	DBName     string
	DBHost     string
	DBPort     string

	SecretKey string
	Algorithm string

	SMTPHost      string
	SMTPPort      string
	SMTPUser      string
	SMTPPassword  string
	SMTPFromEmail string

	GithubClientID     string
	GithubClientSecret string
	GithubRedirectURI  string

	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURI  string

	EmbeddingModel  string
	EmbeddingDevice string
	EmbeddingPort   int
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on system environment variables")
	}

	return &Config{
		OpenRouterAPIKey:  getEnv("OPENROUTER_API_KEY", ""),
		OpenAIAPIKey:      getEnv("OPENAI_API_KEY", ""),
		OpenRouterAPIURL:  getEnv("OPENROUTER_API_URL", "https://openrouter.ai/api/v1/chat/completions"),
		DefaultModel:      getEnv("DEFAULT_MODEL", "moonshotai/kimi-k2-0905"),
		DefaultEmbedding:  getEnv("DEFAULT_EMBEDDING_MODEL", "openai/gpt-oss-120b"),
		CrossEncoderModel: getEnv("CROSS_ENCODER_MODEL", "google/gemma-3-12b-it"),

		QdrantHost:   getEnv("QDRANT_HOST", "http://localhost:6333"),
		QdrantAPIKey: getEnv("QDRANT_API_KEY", ""),

		TempfileDir:        getEnv("TEMPFILE_DIR", "./tmp"),
		TempfileCleanupSec: getEnvAsInt("TEMPFILE_CLEANUP_INTERVAL_SECONDS", 3600),

		Domain:   getEnv("DOMAIN", "http://localhost:3000"),
		FrontURL: getEnv("FRONT_URL", "http://localhost:3000"),

		DBUser:     getEnv("POSTGRES_USER", "postgres"),
		DBPassword: getEnv("POSTGRES_PASSWORD", ""),
		DBName:     getEnv("POSTGRES_DB", "aifixeddb"),
		DBHost:     getEnv("POSTGRES_HOST", "localhost"),
		DBPort:     getEnv("POSTGRES_PORT", "5432"),

		SecretKey: getEnv("SECRET_KEY", "secret"),
		Algorithm: getEnv("ALGORITHM", "HS256"),

		SMTPHost:      getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:      getEnv("SMTP_PORT", "587"),
		SMTPUser:      getEnv("SMTP_USER", ""),
		SMTPPassword:  getEnv("SMTP_PASSWORD", ""),
		SMTPFromEmail: getEnv("SMTP_FROM_EMAIL", ""),

		GithubClientID:     getEnv("GITHUB_CLIENT_ID", ""),
		GithubClientSecret: getEnv("GITHUB_CLIENT_SECRET", ""),
		GithubRedirectURI:  getEnv("GITHUB_REDIRECT_URI", ""),

		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURI:  getEnv("GOOGLE_REDIRECT_URI", ""),

		EmbeddingModel:  getEnv("EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"),
		EmbeddingDevice: getEnv("EMBEDDING_DEVICE", "cpu"),
		EmbeddingPort:   getEnvAsInt("EMBEDDING_PORT", 8001),
	}
}

func (c *Config) DSN() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName,
	)
}

func getEnv(key, defaultVal string) string {
	if val, exists := os.LookupEnv(key); exists {
		return val
	}
	return defaultVal
}

func getEnvAsInt(key string, defaultVal int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultVal
}
