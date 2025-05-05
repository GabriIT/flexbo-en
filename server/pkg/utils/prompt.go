package utils

import "database/sql"

type Message struct {
	Content string `json:"content"`
	AI      bool   `json:"ai"`
}

func SendMessage(db *sql.DB, threadId int64, content string, ai bool) error {
	// Should update thread updated_at
	query := "INSERT INTO prompts (thread_id, ai, content) VALUES ($1, $2, $3);"
	if _, err := db.Exec(query, threadId, ai, content); err != nil {
		return err
	}

	query = "UPDATE threads SET pending=$1 WHERE id=$2;"
	if _, err := db.Exec(query, !ai, threadId); err != nil {
		return err
	}

	return nil
}

func GetMessages(db *sql.DB, threadId int64) (messages []Message, err error) {
	const query = "SELECT content, ai FROM prompts WHERE thread_id=$1 ORDER BY created_at;"
	rows, err := db.Query(query, threadId)
	if err != nil {
		return []Message{}, err
	}
	defer rows.Close()

	for rows.Next() {
		var (
			content string
			ai      bool
		)
		if err := rows.Scan(&content, &ai); err != nil {
			return []Message{}, err
		}

		messages = append(messages, Message{content, ai})
	}

	return messages, nil
}
