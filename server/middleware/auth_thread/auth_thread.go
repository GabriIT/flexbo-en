package auththread

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

var (
	ErrNoPermission = "user does not have permission to perform this action"
)

func AuthThreadMiddleware(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		threadUserId := c.MustGet("threadUserId").(int64)

		// Requires auth middleware
		if value, exists := c.Get("userId"); !exists || value.(int64) != threadUserId {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": ErrNoPermission, "error": "ErrNoPermission"})
			return
		}

		c.Next()
	}
}
