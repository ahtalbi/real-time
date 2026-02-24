# real-time-forum
simple social platform with Go backend and static frontend.

## team
- iaboudou
- ahtalbi

## Start the server
Open a terminal in the backend/ folder and run the server.
```
cd backend
go run main.go
```

## Repository 
```
.
├── backend
│   ├── config
│   │   └── init.go
│   ├── controllers
│   │   ├── auth.go
│   │   ├── checksession.go
│   │   ├── createcomment.go
│   │   ├── createposts.go
│   │   ├── getcomments.go
│   │   ├── getposts.go
│   │   ├── getusers.go
│   │   ├── help.go
│   │   ├── home.go
│   │   ├── reactions.go
│   │   ├── static.go
│   │   ├── structs.go
│   │   └── ws.go
│   ├── db
│   │   ├── init.go
│   │   ├── init.sql
│   │   ├── pics
│   │   ├── repo.go
│   │   └── rtf.db
│   ├── go.mod
│   ├── go.sum
│   ├── main.go
│   ├── models
│   │   └── models.go
│   ├── pkg
│   │   └── utils.go
│   └── routes
│       ├── middleware.go
│       ├── ratelimit.go
│       ├── router.go
│       └── struct.go
├── frontend
│   ├── assets
│   │   └── images
│   ├── backup.html
│   ├── confing_theme.css
│   ├── index.html
│   ├── packages
│   │   ├── eventsManager.js
│   │   ├── loader.js
│   │   ├── router.js
│   │   └── websocket.js
│   └── src
│       ├── events
│       │   └── init.js
│       ├── index.js
│       ├── pages
│       │   ├── error
│       │   │   ├── error.css
│       │   │   ├── error.html
│       │   │   └── error.js
│       │   ├── home
│       │   │   ├── home.css
│       │   │   ├── home.html
│       │   │   ├── home.js
│       │   │   └── utils
│       │   │       ├── home_comments.js
│       │   │       ├── home_createPost.js
│       │   │       ├── home_fetchPosts.js
│       │   │       ├── home_fetchUsers.js
│       │   │       ├── home_initLogout.js
│       │   │       ├── home_reactions.js
│       │   │       ├── home_setUserData.js
│       │   │       └── home_templates.js
│       │   ├── login
│       │   │   ├── login.css
│       │   │   ├── login.html
│       │   │   ├── login.js
│       │   │   └── utils
│       │   │       ├── login_imageAnimation.js
│       │   │       ├── login_postRequest.js
│       │   │       └── login_validateLoginForm.js
│       │   ├── messages
│       │   │   ├── messages.css
│       │   │   ├── messages.html
│       │   │   ├── messages.js
│       │   │   └── utils
│       │   │       ├── messages_conversation.js
│       │   │       ├── messages_fetchMessages.js
│       │   │       ├── messages_fetchUsers.js
│       │   │       └── messages_templates.js
│       │   └── register
│       │       ├── register.css
│       │       ├── register.html
│       │       ├── register.js
│       │       └── utils
│       │           ├── register_postRequest.js
│       │           └── register_validateRegisterForm.js
│       ├── router.js
│       └── utils
│           ├── alert.js
│           └── sortUsers.js
└── README.md

```

- `backend/` : Go server, DB initialization, controllers, and WebSocket.
- `db/` : SQL initialization (init.sql) and related files.
- `frontend/` : Static UI (HTML/CSS/JS) for the client application.