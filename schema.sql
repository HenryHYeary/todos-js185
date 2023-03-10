CREATE TABLE todolists (
  id serial PRIMARY KEY,
  title text UNIQUE NOT NULL
);

CREATE TABLE todos (
  id serial PRIMARY KEY,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  todolist_id int REFERENCES todolists(id) ON DELETE CASCADE NOT NULL
);