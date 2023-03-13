CREATE TABLE todolists (
  id serial PRIMARY KEY,
  title text UNIQUE NOT NULL,
  username text NOT NULL
);

CREATE TABLE todos (
  id serial PRIMARY KEY,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  username text NOT NULL,
  todolist_id int REFERENCES todolists(id) ON DELETE CASCADE NOT NULL
);

CREATE TABLE users (
  username text PRIMARY KEY,
  password text NOT NULL
);