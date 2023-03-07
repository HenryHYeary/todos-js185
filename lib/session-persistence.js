const SeedData = require("./seed-data");
const deepCopy = require("./deep-copy");
const { sortTodoLists, sortTodos } = require("./sort");

module.exports = class SessionPersistence {
  constructor(session) {
    this._todoLists = session.todoLists || deepCopy(SeedData);
    session.todoLists = this._todoLists;
  }

  // Are all of the todos in the todo list done?
  isDoneTodoList(todoList) {
    return todoList.todos.length > 0 && todoList.todos.every(todo => todo.done);
  }

  // Return the list of todo lists sorted by completion status and title (case-
  // insensitive).
  sortedTodoLists() {
    let todoLists = deepCopy(this._todoLists);
    let undone = todoLists.filter(todoList => !this.isDoneTodoList(todoList));
    let done = todoLists.filter(todoList => this.isDoneTodoList(todoList));
    return sortTodoLists(undone, done);
  }

  sortedTodos(todoList) {
    let undone = todoList.todos.filter(todo => !todo.done);
    let done = todoList.todos.filter(todo => todo.done);
    return sortTodos(undone, done);
  }

  loadTodoList(todoListId) {
    let todoList = this._todoLists.find(todoList => todoList.id === todoListId);
    return deepCopy(todoList);
  }

  loadTodo(todoListId, todoId) {
    let todoList = this.loadTodoList(todoListId);
    if (!todoList) return undefined;

    return todoList.todos.find(todo => todo.id === todoId);
  }

  hasUndoneTodos(todoList) {
    return todoList.todos.some(todo => !todo.done);
  }

  _findTodoList(todoListId) {
    let todoLists = this._todoLists;
    return todoLists.find(todoList => todoList.id === todoListId);
  }

  _findTodo(todoListId, todoId) {
    let todoList = this._findTodoList(todoListId);
    if (!todoList) return undefined;

    let todos = todoList.todos;
    return todos.find(todo => todo.id === todoId);
  }

  toggleTodoStatus(todoListId, todoId) {
    let todo = this._findTodo(todoListId, todoId);
    if (!todo) return undefined;

    if (!todo.done) {
      todo.done = true;
      return false;
    } else {
      todo.done = false;
      return true;
    }
  }

  deleteTodo(todoListId, todoId) {
    let todoList = this._findTodoList(todoListId);
    let todos = todoList.todos;
    let todo = this._findTodo(todoListId, todoId);
    if (!todo) {
      return undefined;
    } else {
      todos.splice(todos.indexOf(todo), 1);
      return true;
    }
  }

  completeAllTodos(todoListId) {
    let todoList = this._findTodoList(todoListId);
    if (!todoList) {
      return undefined
    } else {
      let todos = todoList.todos;
    
      todos.forEach(todo => {
        todo.done = true;
      });

      return true;
    }
  }
};