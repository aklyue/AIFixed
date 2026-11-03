package presentation

import "database/sql"

type RawPresentation struct {
	ID      string
	UserID  string
	Title   string
	Content []byte
	Theme   []byte
}

type PresentationRepository struct {
	db *sql.DB
}

func NewPresentationRepository(db *sql.DB) *PresentationRepository {
	return &PresentationRepository{db: db}
}

func (r *PresentationRepository) GetByUserID(userID string) ([]RawPresentation, error) {
	rows, err := r.db.Query(`
		SELECT id, user_id, title, content, theme 
		FROM presentations 
		WHERE user_id = $1
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []RawPresentation
	for rows.Next() {
		var p RawPresentation
		if err := rows.Scan(&p.ID, &p.UserID, &p.Title, &p.Content, &p.Theme); err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	return list, rows.Err()
}

func (r *PresentationRepository) Exists(id, userID string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM presentations WHERE id = $1 AND user_id = $2)`
	err := r.db.QueryRow(query, id, userID).Scan(&exists)
	return exists, err
}

func (r *PresentationRepository) Insert(id, userID, title string, content, theme []byte) error {
	_, err := r.db.Exec(`
		INSERT INTO presentations (id, user_id, title, content, theme)
		VALUES ($1, $2, $3, $4, $5)
	`, id, userID, title, content, theme)
	return err
}

func (r *PresentationRepository) Update(id, userID, title string, content, theme []byte) error {
	_, err := r.db.Exec(`
		UPDATE presentations 
		SET title = $1, content = $2, theme = $3 
		WHERE id = $4 AND user_id = $5
	`, title, content, theme, id, userID)
	return err
}

func (r *PresentationRepository) Delete(id, userID string) (int64, error) {
	result, err := r.db.Exec(`
		DELETE FROM presentations 
		WHERE id = $1 AND user_id = $2
	`, id, userID)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}
