package auth

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"
	"log"
	"math/big"
	"net/smtp"
	"time"
)

type VerificationEntry struct {
	Code    string
	Expires time.Time
}

type EmailVerifier struct {
	db *sql.DB
}

func NewEmailVerifier(db *sql.DB) *EmailVerifier {
	return &EmailVerifier{
		db: db,
	}
}

func (ev *EmailVerifier) SetVerificationCode(ctx context.Context, email string) (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(900000))
	if err != nil {
		return "", err
	}
	code := fmt.Sprintf("%06d", n.Int64()+100000)
	expiresAt := time.Now().Add(10 * time.Minute)

	query := `
		INSERT INTO email_verifications (email, code, expires_at, created_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (email) 
		DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, created_at = NOW()
	`
	_, err = ev.db.ExecContext(ctx, query, email, code, expiresAt)
	if err != nil {
		return "", err
	}

	return code, nil
}

func (ev *EmailVerifier) VerifyCode(ctx context.Context, email, code string) (bool, error) {
	query := `
		DELETE FROM email_verifications
		WHERE email = $1 AND code = $2 AND expires_at > NOW()
		RETURNING email
	`
	var returnedEmail string
	err := ev.db.QueryRowContext(ctx, query, email, code).Scan(&returnedEmail)
	if err == sql.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, err
	}

	return true, nil
}

func (ev *EmailVerifier) StartCleanupWorker(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				_, err := ev.db.ExecContext(ctx, "DELETE FROM email_verifications WHERE expires_at < NOW()")
				if err != nil {
					log.Printf("Error cleaning up expired email verification codes: %v", err)
				}
			}
		}
	}()
}

func SendVerificationEmail(toEmail, code, smtpHost, smtpPort, smtpUser, smtpPassword, fromEmail string) error {
	subject := "Subject: Email Verification Code\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/plain; charset=\"UTF-8\";\n\n"
	body := fmt.Sprintf("Ваш код подтверждения: %s\nОн действителен 10 минут.", code)
	msg := []byte(subject + mime + body)

	auth := smtp.PlainAuth("", smtpUser, smtpPassword, smtpHost)
	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)

	return smtp.SendMail(addr, auth, fromEmail, []string{toEmail}, msg)
}
