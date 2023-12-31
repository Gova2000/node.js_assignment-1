const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initialize = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB ERROR ${e.message}`);
    process.exit(-1);
  }
};
initialize();

const InvalidResponses = async (request, response, next) => {
  const { search_q, category, status, priority, date } = request.query;
  const { todoId } = request.params;
  if (category !== undefined) {
    const cateArray = ["WORK", "HOME", "LEARNING"];
    const cateQuery = cateArray.includes(category);
    if (cateQuery === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date);

      const formattedDate = format(new Date(date), "yyyy-MM-dd");

      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
        )
      );

      const isValidDate = await isValid(result);

      if (isValidDate === true) {
        request.date = formattedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  request.todoId = todoId;
  request.search_q = search_q;

  next();
};

const checkRequestsBody = (request, response, next) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  const { todoId } = request.params;

  if (category !== undefined) {
    categoryArray = ["WORK", "HOME", "LEARNING"];
    categoryIsInArray = categoryArray.includes(category);

    if (categoryIsInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    priorityArray = ["HIGH", "MEDIUM", "LOW"];
    priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate);
      const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");

      const result = toDate(new Date(formatedDate));

      const isValidDate = isValid(result);

      if (isValidDate === true) {
        request.dueDate = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.todo = todo;
  request.id = id;

  request.todoId = todoId;

  next();
};

//get based on path queries

app.get("/todos/", InvalidResponses, async (request, response) => {
  const { status = "", search_q = "", priority = "", category = "" } = request;
  console.log(status, search_q, priority, category);
  const getTodosQuery = `
        SELECT 
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate 
        FROM 
            todo
        WHERE 
        todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%' 
        AND status LIKE '%${status}%' AND category LIKE '%${category}%';`;

  const todosArray = await db.all(getTodosQuery);
  response.send(todosArray);
});

//get based on ID
app.get("/todos/:todoId/", InvalidResponses, async (request, response) => {
  const { todoId } = request.params;
  const apps = `
    SELECT
    id,
    todo,
    priority,
    status,
    category,
    due_date AS dueDate 
    FROM
    todo
    WHERE id=${todoId};`;
  const ap = await db.get(apps);
  response.send(ap);
});

//get based on date
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (date === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const isDated = isValid(new Date(date));
    if (isDated) {
      const formatted = format(new Date(date), "yyyy-MM-dd");
      const apps = `
    SELECT
    id,
    todo,
    priority,
    status,
    category,
    due_date AS dueDate 
    FROM
    todo
    WHERE 
    due_date='${formatted}';`;

      const ap = await db.all(apps);
      response.send(ap);
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

//add todo
app.post("/todos/", checkRequestsBody, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  Date1 = format(new Date(dueDate), "yyyy-MM-dd");
  const addTodo = `
    INSERT INTO
    todo(id,todo,priority,status,category,due_date)
    VALUES
    (
        ${id},
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
        ${Date1}
    );`;
  await db.run(addTodo);
  response.send("Todo Successfully Added");
});

//update based on ID
app.put("/todos/:todoId/", checkRequestsBody, async (request, response) => {
  const { todoId } = request.params;
  const reBody = request.body;
  const { id, todo, priority, status, category, dueDate } = reBody;
  let updateTodoQuery = "";
  switch (true) {
    case status !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                status = '${status}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateTodoQuery);
      response.send("Status Updated");
      break;
    case priority !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                priority = '${priority}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateTodoQuery);
      response.send("Priority Updated");
      break;
    case todo !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                todo = '${todo}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    case category !== undefined:
      const updateCategoryQuery = `
            UPDATE
                todo
            SET 
                category = '${category}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateCategoryQuery);
      response.send("Category Updated");
      break;
    case dueDate !== undefined:
      const updateDateQuery = `
            UPDATE
                todo
            SET 
                due_date = '${dueDate}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateDateQuery);
      response.send("Due Date Updated");
      break;
  }
});

//get based on ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const apps = `
    DELETE FROM
    todo
    WHERE id=${todoId};`;
  await db.run(apps);
  response.send("Todo Deleted");
});

module.exports = app;
