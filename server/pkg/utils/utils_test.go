package utils

import (
	"database/sql"
	"log"
)

func setup() (db *sql.DB) {
	db = OpenSQLite(":memory:")

	if _, err := db.Exec(`
		CREATE TABLE users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			email VARCHAR NOT NULL,
			password_hash VARCHAR NOT NULL,
			email_verified BOOLEAN DEFAULT FALSE NOT NULL,
			validate_token VARCHAR NULL,
			validate_token_expires TIMESTAMP NULL,
			reset_token VARCHAR NULL,
			reset_token_expires TIMESTAMP NULL,
			created_at TIMESTAMP DEFAULT NOW,
			updated_at TIMESTAMP
		);

		CREATE TABLE sessions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL REFERENCES users ON DELETE CASCADE,
			user_agent VARCHAR NOT NULL,
			ip_address VARCHAR NOT NULL,
			session_token VARCHAR NOT NULL,
			active BOOLEAN DEFAULT TRUE NOT NULL,
			created_at TIMESTAMP DEFAULT NOW,
			expires_at TIMESTAMP
		);

		CREATE TABLE threads (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL REFERENCES users ON DELETE CASCADE,
			tid VARCHAR NOT NULL,
			tname VARCHAR NOT NULL,
			pending BOOLEAN DEFAULT false NOT NULL,
			deleted BOOLEAN DEFAULT false NOT NULL,
			deleted_at TIMESTAMP,
			created_at TIMESTAMP DEFAULT NOW,
			updated_at TIMESTAMP
		);

		CREATE TABLE prompts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			thread_id INTEGER NOT NULL REFERENCES threads ON DELETE CASCADE,
			ai BOOLEAN DEFAULT false NOT NULL,
			content VARCHAR NOT NULL,
			created_at TIMESTAMP DEFAULT NOW
		);
    `); err != nil {
		log.Fatal("Error creating tables: ", err)
	}

	return db
}

func CreateMockUser(db *sql.DB, email string, passwordHash string, verified bool) (id int64) {
	const query = "INSERT INTO users (email, password_hash, email_verified) VALUES ($1, $2, $3) RETURNING id;"
	if err := db.QueryRow(query, email, passwordHash, verified).Scan(&id); err != nil {
		log.Fatal("Error inserting user: ", err)
	}

	return id
}

func CreateMockSession(db *sql.DB, userId int64, userAgent string, ipAddress string, token string, active bool) (id int64) {
	const query = "INSERT INTO sessions (user_id, user_agent, ip_address, session_token, active) VALUES ($1, $2, $3, $4, $5) RETURNING id;"
	if err := db.QueryRow(query, userId, userAgent, ipAddress, token, active).Scan(&id); err != nil {
		log.Fatal("Error inserting session: ", err)
	}

	return id
}

func CreateMockThread(db *sql.DB, userId int64, tid string, tname string, deleted bool, pending bool) (id int64) {
	const query = "INSERT INTO threads (user_id, tid, tname, deleted, pending) VALUES ($1, $2, $3, $4, $5) RETURNING id;"
	if err := db.QueryRow(query, userId, tid, tname, deleted, pending).Scan(&id); err != nil {
		log.Fatal("Error inserting thread: ", err)
	}

	return id
}

func CreateMockPrompt(db *sql.DB, threadId int64, content string, ai bool) (id int64) {
	const query = "INSERT INTO prompts (thread_id, content, ai) VALUES ($1, $2, $3) RETURNING id;"
	if err := db.QueryRow(query, threadId, content, ai).Scan(&id); err != nil {
		log.Fatal("Error inserting prompt: ", err)
	}

	return id
}
