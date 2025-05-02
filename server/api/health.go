package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetHealth(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, gin.H{
		"message": "healthy",
	})
}
