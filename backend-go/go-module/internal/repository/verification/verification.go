package verification

import (
	"context"
	"database/sql"
	"time"
)

type VerificationRepository struct {
	db *sql.DB
}

func NewVerificationRepository(db *sql.DB) *VerificationRepository {
	return &VerificationRepository{db: db}
}

func (r *VerificationRepository) UpsertCode(ctx context.Context, email, code string, expiresAt time.Time) error {
	query := `
		INSERT INTO email_verifications (email, code, expires_at, created_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (email) 
		DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, created_at = NOW()
	`
	_, err := r.db.ExecContext(ctx, query, email, code, expiresAt)
	return err
}

func (r *VerificationRepository) DeleteValidCode(ctx context.Context, email, code string) (string, error) {
	query := `
		DELETE FROM email_verifications
		WHERE email = $1 AND code = $2 AND expires_at > NOW()
		RETURNING email
	`
	var returnedEmail string
	err := r.db.QueryRowContext(ctx, query, email, code).Scan(&returnedEmail)
	return returnedEmail, err
}

func (r *VerificationRepository) DeleteExpiredCodes(ctx context.Context) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM email_verifications WHERE expires_at < NOW()")
	return err
}
