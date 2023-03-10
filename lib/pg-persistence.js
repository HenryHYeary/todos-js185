const Todo = require("./todo");
const TodoList = require("./todolist");
const { dbQuery } = require('./db-query');

module.exports = class PgPersistence {
  // Returns a promise that resolves to a sorted list of all the todo lists
  // together with their todos. The list is sorted by completion status and title
  // (case-insensitive). The todos in the list are unsorted.
  async sortedTodoLists() {
    const ALL_TODOLISTS = "SELECT * FROM todolists ORDER BY lower(title) ASC";
    const FIND_TODOS = "SELECT * FROM todos WHERE todolist_id = $1";

    let result = await dbQuery(ALL_TODOLISTS);
    let todoLists = result.rows;

    for (let index = 0; index < todoLists.length; index++) {
      let todoList = todoLists[index];
      let todos = await dbQuery(FIND_TODOS, todoList.id);
      todoList.todos = todos.rows;
    }

    return this._partitionTodoLists(todoLists);
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
    const FIND_TODOLIST = "SELECT * FROM todolists WHERE id = $1";
    const FIND_TODOS = "SELECT * FROM todos WHERE todolist_id = $1";
    
    let resultTodoList = await dbQuery(FIND_TODOLIST, todoListId);
    let resultTodos = await dbQuery(FIND_TODOS, todoListId);
    let resultBoth = await Promise.all([resultTodoList, resultTodos]);

    let todoList = resultBoth[0].rows[0];
    if (!todoList) return undefined;

    todoList.todos = resultBoth[1].rows;
    todoList.hasUndoneTodos = this.hasUndoneTodos(todoList);
    return todoList;
  };

  // // Are all of the todos in the todo list done?
  // isDoneTodoList(todoList) {
  //   return todoList.todos.length > 0 && todoList.todos.every(todo => todo.done);
  // }

  // // Return the list of todo lists sorted by completion status and title (case-
  // // insensitive).
  // sortedTodoLists() {
  //   let todoLists = deepCopy(this._todoLists);
  //   let undone = todoLists.filter(todoList => !this.isDoneTodoList(todoList));
  //   let done = todoLists.filter(todoList => this.isDoneTodoList(todoList));
  //   return sortTodoLists(undone, done);
  // }

  async sortedTodos(todoListId) {
    let FIND_ORDERED_TODOS = "SELECT * FROM todos WHERE todolist_id = $1 ORDER BY done, lower(title)";

    let result = await dbQuery(FIND_ORDERED_TODOS, todoListId);
    let todos = result.rows;

    return todos;
  }

  // loadTodoList(todoListId) {
  //   let todoList = this._todoLists.find(todoList => todoList.id === todoListId);
  //   return deepCopy(todoList);
  // }

  async loadTodo(todoListId, todoId) {
    let todoList = await this.loadTodoList(todoListId);
    if (!todoList) return undefined;

    return todoList.todos.find(todo => todo.id === todoId);
  }

  // _findTodoList(todoListId) {
  //   let todoLists = this._todoLists;
  //   return todoLists.find(todoList => todoList.id === todoListId);
  // }

  // _findTodo(todoListId, todoId) {
  //   let todoList = this._findTodoList(todoListId);
  //   if (!todoList) return undefined;

  //   let todos = todoList.todos;
  //   return todos.find(todo => todo.id === todoId);
  // }

  async toggleTodoStatus(todoListId, todoId) {
    const TOGGLE_DONE = "UPDATE todos SET done = NOT done" +
                        " WHERE todolist_id = $1 AND id = $2";

    let result = await dbQuery(TOGGLE_DONE, todoListId, todoId);
    return result.rowCount > 0;
  }

  async deleteTodo(todoListId, todoId) {
    const DELETE_TODO = "DELETE FROM todos WHERE id = $2 AND todolist_id = $1";

    let result = await dbQuery(DELETE_TODO, todoListId, todoId);
    return result.rowCount > 0;
  }

  async completeAllTodos(todoListId) {
    const COMPLETE_ALL_TODOS = "UPDATE todos SET done = true WHERE todolist_id = $1";

    let result = await dbQuery(COMPLETE_ALL_TODOS, todoListId);
    return result.rowCount > 0;
  }

  // createNewTodo(todoListId, todoTitle) {
  //   let todoList = this._findTodoList(todoListId);
  //   if (!todoList) {
  //     return undefined;
  //   } else {
  //     let todos = todoList.todos;
  //     todos.push(new Todo(todoTitle));
  //   }
  // }

  // _findTodoListIndex(todoListId) {
  //   let todoLists = this._todoLists;
  //   let todoList = this._findTodoList(todoListId);
  //   if (!todoList) return undefined;

  //   return todoLists.indexOf(todoList);
  // }

  // deleteTodoList(todoListId) {
  //   let todoListIndex = this._findTodoListIndex(todoListId);
  //   if (!todoListIndex) {
  //     return undefined;
  //   } else {
  //     this._todoLists.splice(todoListIndex, 1);
  //     return true;
  //   }
  // }

  // editTodoListTitle(todoListId, todoListTitle) {
  //   let todoList = this._findTodoList(+todoListId);
  //   if (!todoList) {
  //     return undefined;
  //   } else {
  //     todoList.title = todoListTitle;
  //     return true;
  //   }
  // }

  // titleNotTaken(title) {
  //   return this._todoLists.every(todoList => todoList.title !== title);
  // }

  // createNewTodoList(title) {
  //   this._todoLists.push(new TodoList(title));
  // }
};