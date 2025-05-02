package auth

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/mateusap1/promptq/pkg/utils"
)

var (
	ErrInvalidSession  = "session token does't exist"
	ErrInactiveSession = "session token is inactive"
	ErrExpiredSession  = "session token has expired"
	ErrWrongKey        = "invalid api key"
)

func AuthMiddleware(db *sql.DB) gin.HandlerFunc {
	expectedApiKey, present := os.LookupEnv("API_KEY")
	if !present {
		log.Fatalf("API_KEY env not present")
	}

	return func(c *gin.Context) {
		// IMPORTANT! Very powerful, admin can create threads
		// for users and send messages in their name. Change this!
		// Just make sure admin is false in such endpoints

		apiKey := c.GetHeader("X-API-KEY")
		if apiKey != "" {
			if apiKey == expectedApiKey {
				c.Set("admin", true)
			} else {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": ErrWrongKey, "error": "ErrWrongKey"})
				return
			}
		} else {
			token, err := c.Cookie("session")
			if err != nil {
				if err == http.ErrNoCookie {
					c.AbortWithError(http.StatusUnauthorized, http.ErrNoCookie)
					return
				} else {
					log.Fatal(err)
					return
				}
			}

			sessionId, userId, active, expiresAt, err := utils.GetSessionByToken(db, token)
			if err != nil {
				if err == sql.ErrNoRows {
					c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": ErrInvalidSession, "error": "ErrInvalidSession"})
					return
				}
				log.Fatal(err)
				return
			}

			if !active {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": ErrInactiveSession, "error": "ErrInactiveSession"})
				return
			} else if time.Now().UTC().After(expiresAt) {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": ErrExpiredSession, "error": "ErrExpiredSession"})
				return
			}

			c.Set("admin", false)
			c.Set("sessionId", sessionId)
			c.Set("userId", userId)
		}

		c.Next()
	}
}
