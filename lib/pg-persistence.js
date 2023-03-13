const { dbQuery } = require('./db-query');
const bcrypt = require("bcrypt");

module.exports = class PgPersistence {
  constructor(session) {
    this.username = session.username;
  }

  // Returns a promise that resolves to a sorted list of all the todo lists
  // together with their todos. The list is sorted by completion status and title
  // (case-insensitive). The todos in the list are unsorted.
  async sortedTodoLists() {
    const ALL_TODOLISTS = "SELECT * FROM todolists" +
                          " WHERE username = $1" +
                          " ORDER BY lower(title) ASC";

    const ALL_TODOS = "SELECT * FROM todos WHERE username = $1";

    let resultTodoLists = dbQuery(ALL_TODOLISTS, this.username);
    let resultTodos = dbQuery(ALL_TODOS, this.username);
    let resultBoth = await Promise.all([resultTodoLists, resultTodos]);

    let allTodoLists = resultBoth[0].rows;
    let allTodos = resultBoth[1].rows;
    if (!allTodoLists || !allTodos) return undefined;

    allTodoLists.forEach(todoList => {
      todoList.todos = allTodos.filter(todo => {
        return todoList.id === todo.todolist_id;
      });
    });

    return this._partitionTodoLists(allTodoLists);
  };

  // Returns a new list of todo lists partitioned by completeion status.
  _partitionTodoLists(todoLists) {
    let undone = [];
    let done = [];

    todoLists.forEach(todoList => {
      if (this.isDoneTodoList(todoList)) {
        done.push(todoList);
      } else {
        undone.push(todoList);
      }
    });

    return undone.concat(done);
  };

  // Are all of the todos in the todo list done? If the todo list has at least
  // one todo and all of its todos are marked as done, then the todo list is
  // done. Otherwise, it is undone.
  isDoneTodoList(todoList) {
    return todoList.length > 0 && todoList.todos.every(todo => todo.done);
  };

  hasUndoneTodos(todoList) {
    return todoList.todos.some(todo => !todo.done);
  };

  async loadTodoList(todoListId) {
    const FIND_TODOLIST = "SELECT * FROM todolists WHERE id = $1 AND username = $2";
    const FIND_TODOS = "SELECT * FROM todos WHERE todolist_id = $1 AND username = $2";
    
    let resultTodoList = await dbQuery(FIND_TODOLIST, todoListId, this.username);
    let resultTodos = await dbQuery(FIND_TODOS, todoListId, this.username);
    let resultBoth = await Promise.all([resultTodoList, resultTodos]);

    let todoList = resultBoth[0].rows[0];
    if (!todoList) return undefined;

    todoList.todos = resultBoth[1].rows;
    todoList.hasUndoneTodos = this.hasUndoneTodos(todoList);
    return todoList;
  };


  async sortedTodos(todoListId) {
    let FIND_ORDERED_TODOS = "SELECT * FROM todos WHERE todolist_id = $1 AND username = $2 ORDER BY done, lower(title)";

    let result = await dbQuery(FIND_ORDERED_TODOS, todoListId, this.username);
    let todos = result.rows;

    return todos;
  }

  async loadTodo(todoListId, todoId) {
    let todoList = await this.loadTodoList(todoListId);
    if (!todoList) return undefined;

    return todoList.todos.find(todo => todo.id === todoId);
  }

  async toggleTodoStatus(todoListId, todoId) {
    const TOGGLE_DONE = "UPDATE todos SET done = NOT done" +
                        " WHERE todolist_id = $1 AND id = $2 AND username = $3";

    let result = await dbQuery(TOGGLE_DONE, todoListId, todoId, this.username);
    return result.rowCount > 0;
  }

  async deleteTodo(todoListId, todoId) {
    const DELETE_TODO = "DELETE FROM todos WHERE id = $2 AND todolist_id = $1 AND username = $3";

    let result = await dbQuery(DELETE_TODO, todoListId, todoId, this.username);
    return result.rowCount > 0;
  }

  async completeAllTodos(todoListId) {
    const COMPLETE_ALL_TODOS = "UPDATE todos SET done = true WHERE todolist_id = $1 AND username = $2 AND NOT done";

    let result = await dbQuery(COMPLETE_ALL_TODOS, todoListId, this.username);
    return result.rowCount > 0;
  }

  async createNewTodo(todoListId, todoTitle) {
    const CREATE_NEW_TODO = "INSERT INTO todos (title, todolist_id, username) VALUES ($2, $1, $3)";

    let result = await dbQuery(CREATE_NEW_TODO, todoListId, todoTitle, this.username);
    return result.rowCount > 0;
  }

  async deleteTodoList(todoListId) {
    const DELETE_TODOLIST = "DELETE FROM todolists WHERE id = $1 AND username = $2";

    let result = await dbQuery(DELETE_TODOLIST, todoListId, this.username);
    return result.rowCount > 0;
  }

  async editTodoListTitle(todoListId, todoListTitle) {
    const EDIT_LIST_TITLE = "UPDATE todolists SET title = $1 WHERE id = $2 AND username = $3";

    let result = await dbQuery(EDIT_LIST_TITLE, todoListTitle, todoListId, this.username);
    return result.rowCount > 0;
  }

  async existsTodoListTitle(title) {
    const FIND_TODOLIST = "SELECT null FROM todolists WHERE title = $1 AND username = $2";

    let result = await dbQuery(FIND_TODOLIST, title, this.username);
    return result.rowCount > 0;
  }

  isUniqueConstraintViolation(error) {
    return /duplicate key value violates unique constraint/.test(String(error));
  }

  async createNewTodoList(title) {
    const CREATE_NEW_TODOLIST = "INSERT INTO todolists (title, username) VALUES ($1, $2)";

    try {
      let result = await dbQuery(CREATE_NEW_TODOLIST, title, this.username);
      return result.rowCount > 0;
    } catch (error) {
      if (this.isUniqueConstraintViolation(error)) return false;
      throw error;
    }
  }

  async areValidLoginCredentials(username, password) {
    const FIND_HASHED_PASSWORD = "SELECT password FROM users" +
                                  " WHERE username = $1";

    let result = await dbQuery(FIND_HASHED_PASSWORD, username);
    if (result.rowCount === 0) return false;

    return bcrypt.compare(password, result.rows[0].password);
  }
};