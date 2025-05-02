package utils

/* Credits to Alex Edwards. Part of this code was taken from
https://www.alexedwards.net/blog/how-to-hash-and-verify-passwords-with-argon2-in-go
*/

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"log"
	"regexp"
	"strings"

	"golang.org/x/crypto/argon2"
)

var (
	ErrInvalidHash         = errors.New("the encoded hash is not in the correct format")
	ErrIncompatibleVersion = errors.New("incompatible version of argon2")
)

type params struct {
	memory      uint32
	iterations  uint32
	parallelism uint8
	saltLength  uint32
	keyLength   uint32
}

func generateRand(n uint32) ([]byte, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return nil, err
	}

	return b, nil
}

func hashPassword(rawPassword string, salt []byte, p *params) []byte {
	// Recommended params memory=64*1024,iterations=1,parallelism=4,
	// saltLength=16,keyLength=32
	return argon2.IDKey([]byte(rawPassword), salt, p.iterations, p.memory, p.parallelism, p.keyLength)
}

func encodeHash(hash []byte, salt []byte, p *params) string {
	// Base64 encode the salt and hashed password.
	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)

	// Return a string using the standard encoded hash representation.
	encodedHash := fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s", argon2.Version, p.memory, p.iterations, p.parallelism, b64Salt, b64Hash)

	return encodedHash
}

func decodeHash(encodedHash string) (p *params, salt, hash []byte, err error) {
	vals := strings.Split(encodedHash, "$")
	if len(vals) != 6 {
		return nil, nil, nil, ErrInvalidHash
	}

	var version int
	if _, err = fmt.Sscanf(vals[2], "v=%d", &version); err != nil {
		return nil, nil, nil, err
	} else if version != argon2.Version {
		return nil, nil, nil, ErrIncompatibleVersion
	}

	p = &params{}
	if _, err = fmt.Sscanf(vals[3], "m=%d,t=%d,p=%d", &p.memory, &p.iterations, &p.parallelism); err != nil {
		return nil, nil, nil, err
	}

	salt, err = base64.RawStdEncoding.Strict().DecodeString(vals[4])
	if err != nil {
		return nil, nil, nil, err
	}
	p.saltLength = uint32(len(salt))

	hash, err = base64.RawStdEncoding.Strict().DecodeString(vals[5])
	if err != nil {
		return nil, nil, nil, err
	}
	p.keyLength = uint32(len(hash))

	return p, salt, hash, nil
}

func ComparePasswordAndHash(password, encodedHash string) (match bool, err error) {
	// Extract the parameters, salt and derived key from the encoded password
	// hash.
	p, salt, hash, err := decodeHash(encodedHash)
	if err != nil {
		return false, err
	}

	// Derive the key from the other password using the same parameters.
	otherHash := argon2.IDKey([]byte(password), salt, p.iterations, p.memory, p.parallelism, p.keyLength)

	// Check that the contents of the hashed passwords are identical. Note
	// that we are using the subtle.ConstantTimeCompare() function for this
	// to help prevent timing attacks.
	if subtle.ConstantTimeCompare(hash, otherHash) == 1 {
		return true, nil
	}
	return false, nil
}

func EncodePassword(password string) (encodedPassword string) {
	params := &params{memory: 64 * 1024, iterations: 1, parallelism: 4, saltLength: 16, keyLength: 32}
	salt, err := generateRand(params.saltLength)
	if err != nil {
		log.Fatal(err)
	}
	hash := hashPassword(password, salt, params)

	return encodeHash(hash, salt, params)
}

func GenerateToken() (validateToken string, err error) {
	token, err := generateRand(128)
	if err != nil {
		return "", err
	}

	return base64.RawStdEncoding.EncodeToString(token), nil
}

func ValidEmailFormat(email string) bool {
	atIdx := strings.IndexRune(email, '@')
	if atIdx == -1 || atIdx == 0 || atIdx == len(email)-1 {
		return false
	}

	if len(email) > 256 {
		return false
	}

	return true
}

func ValidPasswordFormat(password string) bool {
	if len(password) > 64 || len(password) < 8 {
		return false
	}

	specials := `!@#$%^&*()_+\-=\[\]{};:'",.<>?~` + "`"

	// Allowed characters
	regex, err := regexp.Compile(fmt.Sprintf(`^[a-zA-Z\d%v]*$`, specials))
	if err != nil {
		log.Fatal(err)
	}
	if !regex.MatchString(password) {
		return false
	}

	// Required characters (at least once)
	conditions := []string{
		"abcdefghijklmnopqrstuvwxyz",
		"ABCDEFGHIJKLMNOPQRSTUVWXYZ",
		"0123456789",
		specials,
	}
	for i := 0; i < len(conditions); i++ {
		if !strings.ContainsAny(password, conditions[i]) {
			return false
		}
	}

	return true
}

func SendValidationEmail(confirmToken string) error {
	log.Printf("Sending validation e-mail with token %v...\n", confirmToken)

	return nil
}
