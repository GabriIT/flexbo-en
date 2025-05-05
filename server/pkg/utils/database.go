package utils

import (
	"database/sql"
	"log"

	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
)

func OpenPostgresDB(dbUrl string) *sql.DB {
	db, err := sql.Open("postgres", dbUrl)
	if err != nil {
		log.Fatal(err)
	}

	if err := db.Ping(); err != nil {
		log.Fatal("Database ping failed with: ", err)
	}

	return db
}

func OpenSQLite(dbUrl string) *sql.DB {
	db, err := sql.Open("sqlite3", dbUrl)
	if err != nil {
		log.Fatal(err)
	}

	if err := db.Ping(); err != nil {
		log.Fatal("Database ping failed with: ", err)
	}

	return db
}
