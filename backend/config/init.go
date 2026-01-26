package config

import "time"

const Port = ":3000"

// message rate limiting
const (
	Max_Messages = 10
	FiveSec      = 5 * time.Second
)

// ping pong
const (
	Pong                    = 60 * time.Second // if no pong come from the client in 60 sec, conn will be dead
	Ping                    = 50 * time.Second
	Try_write               = 10 * time.Second // attemps to write before 10 sec, otherwise close conn
	MESSAGE_SIZE_READ_LIMIT = 512              // message limit is 512 bytes
)

const (
	Max_Size_message     = 2 * 1024 * 1024
	COMMENTS_FETCH_LIMIT = 10
)
