const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const { body, validationResult } = require("express-validator");
const store = require("connect-loki");
const PgPersistence = require("./lib/pg-persistence");
const catchError = require('./lib/catch-error');

const app = express();
const host = "localhost";
const port = 3000;
const LokiStore = store(session);

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 31 * 24 * 60 * 60 * 1000, // 31 days in millseconds
    path: "/",
    secure: false,
  },
  name: "launch-school-todos-session-id",
  resave: false,
  saveUninitialized: true,
  secret: "this is not very secure",
  store: new LokiStore({}),
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.store = new PgPersistence(req.session);
  next();
});

// Extract session info
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// Redirect start page to login
app.get("/", (req, res) => {
  res.redirect("users/signin");
});

//Render sign-in page
app.get("/users/signin", (req, res) => {
  req.flash("info", "Please sign in.");
  res.render("signin", {
    flash: req.flash(),
  })
});

// Redirect user to list of todo lists or reject credentials
app.post("/users/signin", 
  catchError((req, res) => {
    let username = req.body.username.trim();
    let password = req.body.password;
    if (!username || !password) {
      req.flash("error", "Please enter in a valid username and password.");
      res.render("signin", {
        username,
        flash: req.flash(),
      }) 
    }

    if (username === 'admin' && password === 'secret') {
      req.session.username = username;
      req.session.signedIn = true;
      req.flash("info", "Welcome!");
      res.redirect("/lists");
    } else {
      req.flash("error", "Invalid credentials.")
      res.render("signin", {
        username,
        flash: req.flash(),
      });
    }
  })
);

// Store username and password in session store.
app.get("users/signin",
  catchError((req, res, next) => {
    res.locals.username = req.session.username;
    res.locals.password = req.session.password;
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
  })
);

// Sign out user and render login page
app.get("/users/signout",
  catchError((req, res) => {
    delete res.locals.username;
    delete res.locals.password;
    res.redirect("users/signin");
  })
)

// Render the list of todo lists
app.get("/lists",
  catchError(async (req, res) => {
    let store = res.locals.store;
    let todoLists = await store.sortedTodoLists();

    let todosInfo = todoLists.map(todoList => ({
      countAllTodos: todoList.todos.length,
      countDoneTodos: todoList.todos.filter(todo => todo.done).length,
      isDone: store.isDoneTodoList(todoList),
    }));

    res.render("lists", {
      todoLists,
      todosInfo,
    });
  })
);

// Render new todo list page
app.get("/lists/new", (req, res) => {
  res.render("new-list");
});

// Create a new todo list
app.post("/lists",
  [
    body("todoListTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The list title is required.")
      .isLength({ max: 100 })
      .withMessage("List title must be between 1 and 100 characters."),
  ],

  catchError(async (req, res) => {
    let todoListTitle = req.body.todoListTitle;
    let errors = validationResult(req);

    const rerenderNewList = () => {
      res.render("new-list", {
        flash: req.flash(),
        todoListTitle: req.body.todoListTitle,
      });
    };

    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      rerenderNewList();
    } else if (await res.locals.store.existsTodoListTitle(todoListTitle)){
      req.flash('error', 'The list title must be unique.');
      rerenderNewList();
    } else {
      let created = await res.locals.store.createNewTodoList(todoListTitle);
      if (!created) {
        req.flash("error", "The list title must be unique.");
        rerenderNewList();
      } else {
        req.flash("success", "The todo list has been created.");
        res.redirect("/lists");
      }
    }
  })
);

// Render individual todo list and its todos
app.get("/lists/:todoListId", 
  catchError(async (req, res) => {
    let todoListId = req.params.todoListId;
    let todoList = await res.locals.store.loadTodoList(+todoListId);
    if (todoList === undefined) throw new Error('Not found.');
    res.render("list", {
      todoList,
      todos: await res.locals.store.sortedTodos(+todoListId),
      isDoneTodoList: res.locals.store.isDoneTodoList(todoList),
      hasUndoneTodos: res.locals.store.hasUndoneTodos(todoList),
    });
  })
);

// Toggle completion status of a todo
app.post("/lists/:todoListId/todos/:todoId/toggle", 
  catchError(async (req, res) => {
    let { todoListId, todoId } = req.params;
    let toggle = res.locals.store.toggleTodoStatus(+todoListId, +todoId);
    if (!toggle) throw new Error("Not found.");

    let todo = await res.locals.store.loadTodo(+todoListId, +todoId);
    if (todo.done) {
      req.flash("success", `"${todo.title}" marked as NOT done!`);
    } else {
      req.flash("success", `"${todo.title}" marked done.`);
    }

    res.redirect(`/lists/${todoListId}`);
  })
);

// Delete a todo
app.post("/lists/:todoListId/todos/:todoId/destroy", 
  catchError(async (req, res) => {
    let { todoListId, todoId } = req.params;
    let del = await res.locals.store.deleteTodo(+todoListId, +todoId);
    if (!del) throw new Error("Not found.");
    
    req.flash("success", "The todo has been deleted.");
    res.redirect(`/lists/${todoListId}`);
  })
);

// Mark all todos as done
app.post("/lists/:todoListId/complete_all",
  catchError(async (req, res) => {
    let todoListId = req.params.todoListId;
    let markAllAsDone = await res.locals.store.completeAllTodos(+todoListId);
    if (!markAllAsDone) throw new Error("Not found.");
    req.flash("success", "All todos have been marked as done.");
    res.redirect(`/lists/${todoListId}`);
  })
);

// Create a new todo and add it to the specified list
app.post("/lists/:todoListId/todos",
  [
    body("todoTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The todo title is required.")
      .isLength({ max: 100 })
      .withMessage("Todo title must be between 1 and 100 characters."),
  ],
  catchError(async (req, res) => {
    let todoTitle = req.body.todoTitle;
    let todoListId = req.params.todoListId;

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));

    let todoList = await res.locals.store.loadTodoList(+todoListId);
    if (!todoList) throw new Error ("Not found.");

      res.render("list", {
        flash: req.flash(),
        todoList: todoList,
        isDoneTodoList: res.locals.store.isDoneTodoList(todoList),
        hasUndoneTodos: res.locals.store.hasUndoneTodos(todoList),
      });
    } else {
      let created = await res.locals.store.createNewTodo(+todoListId, todoTitle);
      if (!created) throw new Error ("Not found.");
      req.flash("success", "The todo has been created.");
      res.redirect(`/lists/${todoListId}`);
    }
  })
);

// Render edit todo list form
app.get("/lists/:todoListId/edit",
  catchError(async (req, res) => {
    let todoListId = req.params.todoListId;
    let todoList = await res.locals.store.loadTodoList(+todoListId);
    if (!todoList) throw new Error("Not found.");
    res.render("edit-list", { 
        todoList,
        todoListTitle: todoList.title,
      });
    })
);

// Delete todo list
app.post("/lists/:todoListId/destroy",
  catchError(async (req, res) => {
    let todoListId = req.params.todoListId;
    let deletedTodoList = await res.locals.store.deleteTodoList(+todoListId);
    if (!deletedTodoList) throw new Error("Not found.");
    req.flash("success", "Todo list deleted.");
    res.redirect("/lists");
  })
);

// Edit todo list title
app.post("/lists/:todoListId/edit",
  [
    body("todoListTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The list title is required.")
      .isLength({ max: 100 })
      .withMessage("List title must be between 1 and 100 characters."),
  ],
  catchError(async (req, res) => {
    let store = res.locals.store;
    let todoListId = req.params.todoListId;
    let todoListTitle = req.body.todoListTitle;

    async function rerenderList() {
      let todoList = await store.loadTodoList(+todoListId);
      if (!todoList) throw new Error("Not found.");

      res.render("edit-list", {
        flash: req.flash(),
        todoList,
        todoListTitle,
      });
    };

    try {
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));
        rerenderList();
      } else if (await store.existsTodoListTitle(todoListTitle)) {
        req.flash('error', 'The list title must be unique.');
        rerenderList();
      } else {
        let updated = await store.editTodoListTitle(+todoListId, todoListTitle);
        if (!updated) throw new Error("Not found.");

        req.flash("success", "Todo list updated.");
        res.redirect(`/lists/${todoListId}`);
      }
    } catch (error) {
      if (store.isUniqueConstraintViolation(error)) {
        req.flash("error", "The list title must be unique.");
        rerenderList();
      } else {
        throw error;
      }
    }
  }) 
);

// Error handler
app.use((err, req, res, _next) => {
  console.log(err); // Writes more extensive information to the console log
  res.status(404).send(err.message);
});

// Listener
app.listen(port, host, () => {
  console.log(`Todos is listening on port ${port} of ${host}!`);
});
