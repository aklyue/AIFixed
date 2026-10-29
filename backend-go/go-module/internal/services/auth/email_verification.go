package auth

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"net/smtp"
	"sync"
	"time"
)

type VerificationEntry struct {
	Code    string
	Expires time.Time
}

type EmailVerifier struct {
	mu    sync.RWMutex
	codes map[string]VerificationEntry
}

func NewEmailVerifier() *EmailVerifier {
	return &EmailVerifier{
		codes: make(map[string]VerificationEntry),
	}
}

func (ev *EmailVerifier) SetVerificationCode(email string) string {
	n, _ := rand.Int(rand.Reader, big.NewInt(900000))
	code := fmt.Sprintf("%06d", n.Int64()+100000)

	ev.mu.Lock()
	defer ev.mu.Unlock()

	ev.codes[email] = VerificationEntry{
		Code:    code,
		Expires: time.Now().Add(10 * time.Minute),
	}

	return code
}

func (ev *EmailVerifier) VerifyCode(email, code string) bool {
	ev.mu.Lock()
	defer ev.mu.Unlock()

	entry, exists := ev.codes[email]
	if !exists {
		return false
	}

	if time.Now().After(entry.Expires) || entry.Code != code {
		delete(ev.codes, email)
		return false
	}

	delete(ev.codes, email)
	return true
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
