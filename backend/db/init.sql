PRAGMA foreign_keys = ON;

-- users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY UNIQUE,
    front_id TEXT UNIQUE,
    nickname TEXT NOT NULL UNIQUE,
    birthday TEXT NOT NULL,
    gender TEXT NOT NULL,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    session_id TEXT UNIQUE,
    session_created_at TEXT DEFAULT NULL,
    session_expired_at TEXT DEFAULT NULL
);

-- posts
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY UNIQUE,
    front_id TEXT UNIQUE,
    user_id TEXT NOT NULL,
    content TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ids_posts_user_id ON posts(user_id);

-- categories
CREATE TABLE IF NOT EXISTS categories(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name TEXT UNIQUE
);

-- insert categories seeds
INSERT OR IGNORE INTO categories (category_name)  VALUES
("Social"),
("Education"),
("Sport"),
("Gaming");

-- post-categories
CREATE TABLE IF NOT EXISTS posts_categories (
    post_id TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, category_id)
);
CREATE INDEX IF NOT EXISTS ids_posts_categories_category_id ON posts_categories(category_id);

-- comments
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY UNIQUE,
    front_id TEXT UNIQUE,
    content TEXT NOT NULL,
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ids_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS ids_comments_post_id ON comments(post_id);

-- post reactions
CREATE TABLE IF NOT EXISTS post_reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reaction_type INTEGER CHECK(reaction_type IN (0,1)),
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    UNIQUE(post_id, user_id)
);
CREATE INDEX IF NOT EXISTS ids_post_reactions_user_id ON post_reactions(user_id);
CREATE INDEX IF NOT EXISTS ids_post_reactions_post_id ON post_reactions(post_id);

-- comment reactions
CREATE TABLE IF NOT EXISTS comment_reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reaction_type INTEGER CHECK(reaction_type IN (0,1)),
    user_id TEXT NOT NULL,
    comment_id TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    UNIQUE(comment_id, user_id)
);
CREATE INDEX IF NOT EXISTS ids_comment_reactions_user_id ON comment_reactions(user_id);
CREATE INDEX IF NOT EXISTS ids_comment_reactions_comment_id ON comment_reactions(comment_id);

-- messages
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ids_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS ids_messages_receiver_id ON messages(receiver_id);