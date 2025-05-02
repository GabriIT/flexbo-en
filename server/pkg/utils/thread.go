package utils

import (
	"database/sql"

	"github.com/google/uuid"
)

type Thread struct {
	Identifier string `json:"id"`
	Name       string `json:"name"`
}

type ThreadResponse struct {
	Name     string    `json:"name"`
	Messages []Message `json:"messages"`
}

func GetThread(db *sql.DB, tid string) (id int64, userId int64, name string, deleted bool, err error) {
	const query = "SELECT id, user_id, tname, deleted FROM threads WHERE tid=$1;"
	if err = db.QueryRow(query, tid).Scan(&id, &userId, &name, &deleted); err != nil {
		return -1, -1, "", false, err
	}

	return id, userId, name, deleted, nil
}

func GetThreadFromId(db *sql.DB, id int64) (tid string, userId int64, name string, deleted bool, err error) {
	const query = "SELECT tid, user_id, tname, deleted FROM threads WHERE id=$1;"
	if err = db.QueryRow(query, id).Scan(&tid, &userId, &name, &deleted); err != nil {
		return "", -1, "", false, err
	}

	return tid, userId, name, deleted, nil
}

func GetPendingThreads(db *sql.DB) (threads []Thread, err error) {
	const query = "SELECT tid, tname FROM threads WHERE deleted=false AND pending=true ORDER BY updated_at DESC, created_at DESC;"
	rows, err := db.Query(query)
	if err != nil {
		return []Thread{}, err
	}
	defer rows.Close()

	for rows.Next() {
		var (
			tid  string
			name string
		)
		if err := rows.Scan(&tid, &name); err != nil {
			return []Thread{}, err
		}

		threads = append(threads, Thread{tid, name})
	}

	if threads == nil {
		return []Thread{}, nil
	} else {
		return threads, nil
	}
}

func GetThreads(db *sql.DB, userId int64) (threads []Thread, err error) {
	const query = "SELECT tid, tname FROM threads WHERE user_id=$1 AND deleted=false ORDER BY updated_at DESC, created_at DESC;"
	rows, err := db.Query(query, userId)
	if err != nil {
		return []Thread{}, err
	}
	defer rows.Close()

	for rows.Next() {
		var (
			tid  string
			name string
		)
		if err := rows.Scan(&tid, &name); err != nil {
			return []Thread{}, err
		}

		threads = append(threads, Thread{tid, name})
	}

	if threads == nil {
		return []Thread{}, nil
	} else {
		return threads, nil
	}
}

func CreateThread(db *sql.DB, userId int64, name string) (id int64, tid string, err error) {
	tid = uuid.New().String()
	const query = "INSERT INTO threads (user_id, tid, tname, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id;"
	if err = db.QueryRow(query, userId, tid, name).Scan(&id); err != nil {
		return -1, "", err
	}

	return id, tid, nil
}

func RenameThread(db *sql.DB, threadId int64, name string) error {
	const query = "UPDATE threads SET tname=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2;"
	_, err := db.Exec(query, name, threadId)

	return err
}

func DeleteThread(db *sql.DB, threadId int64) error {
	const query = "UPDATE threads SET deleted=true, updated_at=CURRENT_TIMESTAMP WHERE id=$1;"
	_, err := db.Exec(query, threadId)

	return err
}
