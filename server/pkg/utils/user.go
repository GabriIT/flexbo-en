package utils

import (
	"database/sql"
	"time"
)

func CreateUser(db *sql.DB, email, passwordHash string) (id int64, validateToken string, err error) {
	validateToken, err = GenerateToken()
	if err != nil {
		return -1, "", err
	}

	confirmDuration := 24 * time.Hour
	currentTime := time.Now().UTC()

	query := "INSERT INTO users (email, password_hash, validate_token, validate_token_expires) VALUES ($1, $2, $3, $4) RETURNING id;"
	if err := db.QueryRow(query, email, passwordHash, validateToken, currentTime.Add(confirmDuration)).Scan(&id); err != nil {
		return -1, "", err
	}

	return id, validateToken, nil
}

func GetUserLoginByEmail(db *sql.DB, email string) (id int64, passwordHash string, err error) {
	if err = db.QueryRow("SELECT id, password_hash FROM users WHERE email=$1;", email).Scan(&id, &passwordHash); err != nil {
		// error sql.ErrNoRows means that the user does not exist
		return -1, "", err
	}

	return id, passwordHash, nil
}

func EmailAlreadyExists(db *sql.DB, email string) (bool, error) {
	_, _, err := GetUserLoginByEmail(db, email)
	if err == nil {
		return true, nil
	} else if err == sql.ErrNoRows {
		return false, nil
	} else {
		return false, err
	}
}

func GetActiveSession(db *sql.DB, userId int64) (id int64, token string, err error) {
	const query = "SELECT id, session_token FROM sessions WHERE user_id=$1 AND active=TRUE ORDER BY expires_at DESC;"
	if err = db.QueryRow(query, userId).Scan(&id, &token); err != nil {
		return -1, "", err
	}

	return id, token, nil
}

func GetSessionByToken(db *sql.DB, token string) (id int64, userId int64, active bool, expiresAt time.Time, err error) {
	var exp sql.NullTime
	const query = "SELECT id, user_id, active, expires_at FROM sessions WHERE session_token=$1;"
	if err = db.QueryRow(query, token).Scan(&id, &userId, &active, &exp); err != nil {
		return -1, -1, false, time.Unix(-1, -1), err
	}

	return id, userId, active, exp.Time, nil
}

func CreateSession(db *sql.DB, userId int64, userAgent string, ipAddress string) (id int64, token string, err error) {
	token, err = GenerateToken()
	if err != nil {
		return -1, "", err
	}

	sessionDuration := 24 * time.Hour
	currentTime := time.Now().UTC()

	const query = "INSERT INTO sessions (user_id, user_agent, ip_address, session_token, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING id;"
	if err := db.QueryRow(query, userId, userAgent, ipAddress, token, currentTime.Add(sessionDuration)).Scan(&id); err != nil {
		return -1, "", err
	}

	return id, token, nil
}

func DeactivateSession(db *sql.DB, id int64) error {
	const query = "UPDATE sessions SET active=FALSE WHERE id=$1;"
	_, err := db.Exec(query, id)
	return err
}

func GetUserByValidateToken(db *sql.DB, token string) (id int64, expired bool, err error) {
	// Needs (unit) testing

	var exp sql.NullTime
	const query = "SELECT id, validate_token_expires FROM users WHERE validate_token=$1;"
	if err = db.QueryRow(query, token).Scan(&id, &exp); err != nil {
		return -1, false, err
	}

	currentTime := time.Now().UTC()
	return id, currentTime.After(exp.Time), nil
}

func GetEmailValidatedById(db *sql.DB, id int64) (emailVerified bool, err error) {
	// Needs unit testing

	const query = "SELECT email_verified FROM users WHERE id=$1;"
	if err = db.QueryRow(query, id).Scan(&emailVerified); err != nil {
		return false, err
	}

	return emailVerified, nil
}

func ValidateEmail(db *sql.DB, id int64) error {
	// Needs unit testing

	const query = "UPDATE users SET email_verified=true, validate_token=NULL, validate_token_expires=NULL WHERE id=$1;"
	_, err := db.Exec(query, id)

	return err
}

func UpdateEmailToken(db *sql.DB, id int64) (token string, err error) {
	// Needs unit testing

	validateToken, err := GenerateToken()
	if err != nil {
		return "", err
	}

	confirmDuration := 24 * time.Hour
	currentTime := time.Now().UTC()

	const query = "UPDATE users SET validate_token=$1, validate_token_expires=$2 WHERE id=$3"
	_, err = db.Exec(query, validateToken, currentTime.Add(confirmDuration), id)
	if err != nil {
		return "", err
	}

	return validateToken, nil
}
