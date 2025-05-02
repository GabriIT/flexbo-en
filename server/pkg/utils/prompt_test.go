package utils

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSendMessage(t *testing.T) {
	db := setup()

	userId := CreateMockUser(db, "alice@email.com", "", true)
	threadId := CreateMockThread(db, userId, "tid", "tname", false, false)

	err := SendMessage(db, threadId, "Hello there!", false)
	assert.Nil(t, err)

	var (
		content string
		ai      bool
	)
	err = db.QueryRow("SELECT content, ai FROM prompts;").Scan(&content, &ai)
	assert.Nil(t, err)
	assert.Equal(t, "Hello there!", content)
	assert.Equal(t, false, ai)
}

func TestGetMessages(t *testing.T) {
	db := setup()

	userId := CreateMockUser(db, "alice@email.com", "", true)
	threadId := CreateMockThread(db, userId, "tid", "tname", false, false)

	for i := range 5 {
		CreateMockPrompt(db, threadId, fmt.Sprintf("content_%v", i), i%3 == 0)
	}

	messages, err := GetMessages(db, userId)
	assert.Nil(t, err)
	assert.Equal(t, len(messages), 5)

	for i := range 5 {
		assert.Equal(t, fmt.Sprintf("content_%v", i), messages[i].Content)
		assert.Equal(t, i%3 == 0, messages[i].AI)
	}
}
