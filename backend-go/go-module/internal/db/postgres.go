package db

import (
	"database/sql"
	"log"
)

func NewPostgresDB(dsn string) (*sql.DB, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	log.Println("Successfully connected to PostgreSQL")
	return db, nil
}
