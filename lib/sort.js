// Compare object titles alphabetically (case insensitive)
const compareByTitle = (itemA, itemB) => {
  let titleA = itemA.title.toLowerCase();
  let titleB = itemB.title.toLowerCase();

  if (titleA < titleB) {
    return -1;
  } else if (titleA > titleB) {
    return 1;
  } else {
    return 0;
  }
};

// sorts items for todos or todo lists based on completion status and title
const sortItems = function (undone, done) {
  undone.sort(compareByTitle);
  done.sort(compareByTitle);
  return [].concat(undone, done);
};

module.exports = {
  sortTodoLists: sortItems,
  sortTodos: sortItems,
};
