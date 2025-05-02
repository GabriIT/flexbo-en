package api

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mateusap1/promptq/pkg/utils"
)

func CreateThread(c *gin.Context, db *sql.DB) {
	// Requires auth middleware
	userId := c.MustGet("userId").(int64)

	var form struct {
		Name string `json:"name"`
	}
	if err := c.ShouldBindJSON(&form); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": ErrInvalidFormat, "error": "ErrInvalidFormat"})
		return
	}

	_, tid, err := utils.CreateThread(db, userId, form.Name)
	if err != nil {
		log.Fatal(err)
	}

	c.JSON(http.StatusOK, gin.H{"threadId": tid})
}

func GetThread(c *gin.Context, db *sql.DB) {
	// Requires thread middleware
	threadId := c.MustGet("threadId").(int64)
	threadName := c.MustGet("threadName").(string)

	messages, err := utils.GetMessages(db, threadId)
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, utils.ThreadResponse{Name: threadName, Messages: messages})
}

func GetPendingThreads(c *gin.Context, db *sql.DB) {
	// Requires auth middleware
	admin := c.MustGet("admin").(bool)
	if !admin {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": ErrAdminRequired, "error": "ErrAdminRequired"})
		return
	}

	threads, err := utils.GetPendingThreads(db)
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, threads)
}

func GetThreads(c *gin.Context, db *sql.DB) {
	// Requires auth middleware
	userId := c.MustGet("userId").(int64)

	threads, err := utils.GetThreads(db, userId)
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, threads)
}

func DeleteThread(c *gin.Context, db *sql.DB) {
	// Required thread middleware
	threadId := c.MustGet("threadId").(int64)

	if err := utils.DeleteThread(db, threadId); err != nil {
		log.Fatal(err)
	}

	c.JSON(http.StatusOK, gin.H{})
}

func RenameThread(c *gin.Context, db *sql.DB) {
	// Required thread middleware
	threadId := c.MustGet("threadId").(int64)

	var form struct {
		Name string `json:"name"`
	}
	if err := c.ShouldBindJSON(&form); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": ErrInvalidFormat, "error": "ErrInvalidFormat"})
		return
	}

	if err := utils.RenameThread(db, threadId, form.Name); err != nil {
		log.Fatal(err)
	}

	c.JSON(http.StatusOK, gin.H{})
}
