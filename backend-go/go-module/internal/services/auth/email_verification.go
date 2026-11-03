package auth

import (
	"context"
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
	"net/smtp"
	"time"

	"github.com/AIFixed/backend-go/internal/repository/verification"
)

type VerificationEntry struct {
	Code    string
	Expires time.Time
}

type EmailVerifier struct {
	verifyRepo *verification.VerificationRepository
}

func NewEmailVerifier(verifyRepo *verification.VerificationRepository) *EmailVerifier {
	return &EmailVerifier{
		verifyRepo: verifyRepo,
	}
}

func (ev *EmailVerifier) SetVerificationCode(ctx context.Context, email string) (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(900000))
	if err != nil {
		return "", err
	}
	code := fmt.Sprintf("%06d", n.Int64()+100000)
	expiresAt := time.Now().Add(10 * time.Minute)

	err = ev.verifyRepo.UpsertCode(ctx, email, code, expiresAt)
	if err != nil {
		return "", err
	}

	return code, nil
}

func (ev *EmailVerifier) VerifyCode(ctx context.Context, email, code string) (bool, error) {
	_, err := ev.verifyRepo.DeleteValidCode(ctx, email, code)

	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			return false, nil
		}
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
				err := ev.verifyRepo.DeleteExpiredCodes(ctx)
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
