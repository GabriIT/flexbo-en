package utils

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetThread(t *testing.T) {
	db := setup()

	userId := CreateMockUser(db, "alice@email.com", "", true)
	id := CreateMockThread(db, userId, "test_id", "test_name", false, false)

	threadId, actualUserId, tname, deleted, err := GetThread(db, "test_id")
	assert.Nil(t, err)

	assert.Equal(t, threadId, id)
	assert.Equal(t, actualUserId, userId)
	assert.Equal(t, tname, "test_name")
	assert.Equal(t, deleted, false)
}

func TestGetPendingThreads(t *testing.T) {
	db := setup()

	userId := CreateMockUser(db, "alice@email.com", "", true)

	for i := range 5 {
		CreateMockThread(db, userId, fmt.Sprintf("id_%v", i), fmt.Sprintf("name_%v", i), false, true)
	}

	CreateMockThread(db, userId, "id_deleted", "name_deleted", true, true)
	CreateMockThread(db, userId, "id_not_pending", "name_not_pending", true, false)

	threads, err := GetThreads(db, userId)
	assert.Nil(t, err)
	assert.Equal(t, len(threads), 5)

	for i := range 5 {
		assert.Equal(t, fmt.Sprintf("id_%v", i), threads[i].Identifier)
		assert.Equal(t, fmt.Sprintf("name_%v", i), threads[i].Name)
	}
}

func TestGetThreads(t *testing.T) {
	db := setup()

	userId := CreateMockUser(db, "alice@email.com", "", true)

	for i := range 5 {
		CreateMockThread(db, userId, fmt.Sprintf("id_%v", i), fmt.Sprintf("name_%v", i), false, i%2 == 0)
	}

	CreateMockThread(db, userId, "id_deleted", "name_deleted", true, false)

	threads, err := GetThreads(db, userId)
	assert.Nil(t, err)
	assert.Equal(t, len(threads), 5)

	for i := range 5 {
		assert.Equal(t, fmt.Sprintf("id_%v", i), threads[i].Identifier)
		assert.Equal(t, fmt.Sprintf("name_%v", i), threads[i].Name)
	}
}

func TestCreateThread(t *testing.T) {
	db := setup()

	userId := CreateMockUser(db, "alice@email.com", "", true)
	id, tid, err := CreateThread(db, userId, "test")
	assert.Nil(t, err)

	var actualUserId int64
	var actualTId string
	var actualName string
	err = db.QueryRow("SELECT user_id, tid, tname FROM threads WHERE id=$1;", id).Scan(&actualUserId, &actualTId, &actualName)
	assert.Nil(t, err)

	assert.Equal(t, actualUserId, userId)
	assert.Equal(t, actualTId, tid)
	assert.Equal(t, actualName, "test")
}

func TestRenameThread(t *testing.T) {
	db := setup()

	userId := CreateMockUser(db, "alice@email.com", "", true)
	id := CreateMockThread(db, userId, "tid", "tname", false, false)

	RenameThread(db, id, "new_name")

	var actualName string
	err := db.QueryRow("SELECT tname FROM threads WHERE id=$1;", id).Scan(&actualName)
	assert.Nil(t, err)
	assert.Equal(t, "new_name", actualName)
}

func TestDeleteThread(t *testing.T) {
	db := setup()

	userId := CreateMockUser(db, "alice@email.com", "", true)
	id := CreateMockThread(db, userId, "tid", "tname", false, false)

	DeleteThread(db, id)

	var deleted bool
	err := db.QueryRow("SELECT deleted FROM threads WHERE id=$1;", id).Scan(&deleted)
	assert.Nil(t, err)
	assert.Equal(t, true, deleted)
}
