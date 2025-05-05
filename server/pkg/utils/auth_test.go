package utils

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestValidEmailFormat(t *testing.T) {
	assert.Equal(t, true, ValidEmailFormat("a@b"))
	assert.Equal(t, false, ValidEmailFormat("@ba"))
	assert.Equal(t, false, ValidEmailFormat("ab@"))
	assert.Equal(t, false, ValidEmailFormat("a@"+strings.Repeat("a", 256)))
}

func TestValidPasswordFormat(t *testing.T) {
	assert.Equal(t, true, ValidPasswordFormat("P@ssw0rd"))
	assert.Equal(t, true, ValidPasswordFormat("Pass1-_*)!"))
	assert.Equal(t, false, ValidPasswordFormat("password"))
	assert.Equal(t, false, ValidPasswordFormat("pWd0!"))
	assert.Equal(t, false, ValidPasswordFormat("pAssw0rd"))
	assert.Equal(t, false, ValidPasswordFormat("12345a678@"))
	assert.Equal(t, false, ValidPasswordFormat("12345A678!"))
	assert.Equal(t, false, ValidPasswordFormat(strings.Repeat("a", 64)+"A@0"))
}
