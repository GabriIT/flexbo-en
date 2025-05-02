package api

var (
	ErrEmailExists           = "email taken"
	ErrNoAccountEmail        = "no account with email"
	ErrWrongPassword         = "wrong password"
	ErrInvalidPasswordFormat = "invalid password format or weak password"
	ErrInvalidEmailFormat    = "invalid email format"
	ErrInvalidFormat         = "invalid request format"
	ErrValidateTokenExpired  = "validate token expired"
	ErrValidateTokenNotExist = "validate token does not exist"
	ErrEmailVerifiedAlready  = "email verified already"
	ErrAdminRequired         = "only admins can perform this action"
	ErrNoPermission          = "user does not have permission to perform this action"
)
