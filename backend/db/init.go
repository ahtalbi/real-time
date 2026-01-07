package db

import (
	"database/sql"
	"os"
)

func InitDB() (*sql.DB, error) {
	// prepare the driver
	db, er := sql.Open("sqlite3", "./db/rtf.db")
	if er != nil {
		return nil, er
	}

	// test connection
	er = db.Ping()
	if er != nil {
		return nil, er
	}

	//
	sql, er := os.ReadFile("./db/init.sql")
	if er != nil {
		return nil, er
	}
	_, er = db.Exec(string(sql))
	if er != nil {
		return nil, er
	}

	return db, nil
}
