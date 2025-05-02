package thread

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mateusap1/promptq/pkg/utils"
)

var (
	ErrDoesNotExist = "thread not found"
)

func ThreadMiddleware(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		tid := c.Param("tid")

		id, userId, name, deleted, err := utils.GetThread(db, tid)
		if err == sql.ErrNoRows || deleted {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"message": ErrDoesNotExist, "error": "ErrDoesNotExist"})
			return
		} else if err != nil {
			c.AbortWithError(http.StatusInternalServerError, err)
			return
		}

		c.Set("threadId", id)
		c.Set("threadUserId", userId)
		c.Set("threadName", name)

		c.Next()
	}
}
