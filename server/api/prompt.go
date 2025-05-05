package api

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mateusap1/promptq/pkg/utils"
)

func SendPrompt(c *gin.Context, db *sql.DB) {
	// Required thread middleware
	threadId := c.MustGet("threadId").(int64)

	var form struct {
		Content string `json:"content"`
	}
	if err := c.ShouldBindJSON(&form); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": ErrInvalidFormat, "error": "ErrInvalidFormat"})
		return
	}

	if err := utils.SendMessage(db, threadId, form.Content, false); err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

func AnswerPrompt(c *gin.Context, db *sql.DB) {
	// Required thread middleware
	threadId := c.MustGet("threadId").(int64)
	admin := c.MustGet("admin").(bool)

	if !admin {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": ErrAdminRequired, "error": "ErrAdminRequired"})
		return
	}

	var form struct {
		Content string `json:"content"`
	}
	if err := c.ShouldBindJSON(&form); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": ErrInvalidFormat, "error": "ErrInvalidFormat"})
		return
	}

	if err := utils.SendMessage(db, threadId, form.Content, true); err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

func GetMessages(c *gin.Context, db *sql.DB) {
	threadId := c.MustGet("threadId").(int64)

	messages, err := utils.GetMessages(db, threadId)
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"messages": messages})
}
