package api

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/mateusap1/promptq/pkg/utils"
)

type SignForm struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func startSession(c *gin.Context, db *sql.DB, id int64) error {
	_, token, err := utils.CreateSession(db, id, c.Request.UserAgent(), c.ClientIP())
	if err != nil {
		return err
	}

	// c.SetCookie("session", token, 24*60*60, "/", "", true, true)

	// TODO: IMPORTANT! Change this to have httpOnly true
	// c.SetCookie("session", token, 24*60*60, "/", "", true, false)

	c.SetCookie("session", token, 24*60*60, "/", "", false, false)


	return nil
}

func Register(c *gin.Context, db *sql.DB) {
	var form SignForm
	if err := c.ShouldBindJSON(&form); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": ErrInvalidFormat, "error": "ErrInvalidFormat"})
		return
	}

	email := strings.ToLower(form.Email)
	password := form.Password

	if !utils.ValidEmailFormat(email) {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": ErrInvalidEmailFormat, "error": "ErrInvalidEmailFormat"})
		return
	}

	if !utils.ValidPasswordFormat(password) {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": ErrInvalidPasswordFormat, "error": "ErrInvalidPasswordFormat"})
		return
	}

	exists, err := utils.EmailAlreadyExists(db, email)
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	if exists {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": ErrEmailExists, "error": "ErrEmailExists"})
		return
	}

	passwordHash := utils.EncodePassword(password)
	userId, confirmToken, err := utils.CreateUser(db, email, passwordHash)
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	// Send validation e-mail
	if err := utils.SendValidationEmail(confirmToken); err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	startSession(c, db, userId)

	c.JSON(http.StatusOK, gin.H{})
}

func Login(c *gin.Context, db *sql.DB) {
	var form SignForm
	if err := c.ShouldBindJSON(&form); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": ErrInvalidFormat, "error": "ErrInvalidFormat"})
		return
	}

	email := strings.ToLower(form.Email)
	password := form.Password

	// Enforce user exists and get login information
	userId, passwordHash, err := utils.GetUserLoginByEmail(db, email)
	if err != nil {
		if err == sql.ErrNoRows {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": ErrNoAccountEmail, "error": "ErrNoAccountEmail"})
			return
		} else {
			c.AbortWithError(http.StatusInternalServerError, err)
			return
		}
	}

	// Check password
	if rightPassword, err := utils.ComparePasswordAndHash(password, passwordHash); err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	} else if !rightPassword {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": ErrWrongPassword, "error": "ErrWrongPassword"})
		return
	}

	// It is allowed to have two sessions
	startSession(c, db, userId)

	c.JSON(http.StatusOK, gin.H{})
}

func SignOut(c *gin.Context, db *sql.DB) {
	// Requires auth middleware
	sessionId := c.MustGet("sessionId").(int64)

	err := utils.DeactivateSession(db, sessionId)
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	c.SetCookie("session", "", -1, "/", "", true, true)

	c.JSON(http.StatusOK, gin.H{})
}

func ValidateEmail(c *gin.Context, db *sql.DB) {
	var form struct {
		Token string `json:"token"`
	}
	if err := c.ShouldBindJSON(&form); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": ErrInvalidFormat, "error": "ErrInvalidFormat"})
		return
	}

	id, expired, err := utils.GetUserByValidateToken(db, form.Token)
	if err != nil {
		if err == sql.ErrNoRows {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": ErrValidateTokenNotExist, "error": "ErrValidateTokenNotExist"})
			return
		} else {
			c.AbortWithError(http.StatusInternalServerError, err)
			return
		}
	}

	// If expired return error
	if expired {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": ErrValidateTokenExpired, "error": "ErrValidateTokenExpired"})
		return
	}

	// It should never happen that there exists a token for a verified email
	// This enforced by the fact that whenever an email is validated, the token
	// is set to NULL through the utils.ValidateEmail function

	// Validate Email
	err = utils.ValidateEmail(db, id)
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	// Create new session and return
	_, sessionToken, err := utils.CreateSession(db, id, c.Request.UserAgent(), c.ClientIP())
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	c.SetCookie("session", sessionToken, 24*60*60, "/", "", true, true)
	c.JSON(http.StatusOK, gin.H{})
}

func ResendValidateEmail(c *gin.Context, db *sql.DB) {
	// Requires auth middleware
	userId := c.MustGet("userId").(int64)

	// Make sure the user has not been verified yet
	emailValidated, err := utils.GetEmailValidatedById(db, userId)
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	if emailValidated {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": ErrEmailVerifiedAlready, "error": "ErrEmailVerifiedAlready"})
		return
	}

	token, err := utils.UpdateEmailToken(db, userId)
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	// Send validation e-mail
	if err := utils.SendValidationEmail(token); err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}
