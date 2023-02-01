## Installation

```
npm i esmile.db

yarn add esmile.db
```

## Nodejs Version

- `v16.9.0` or higher

## Links

- [Discord](https://discord.gg/aXvuUpvRQs) [Esmile Discord]
- [Discord_Bot](https://mresmile.com) [Esmile Bot]

## Example

```js
const Database = require("esmile.db");

// Create a file named database.esmile and enter the password
const database = new Database("./database.esmile", "password");

// Only use it 1 time or you can delete all the data if it is run for 2 times put it in a database_init.js file
database.createTable("users", ["id", "name", "email"]);

database.insert("users", {id: "1", name: "John Doe", email: "jdoe@example.com"});

database.insert("users", {id: "2", name: "María", email: "maria@example.com"});

const users = database.select("users");

console.log("----------------------------------");

console.log(users);

const userJohn = database.select("usuarios", {name: "John Doe"});
console.log("----------------------------------");
console.log(userJohn);

database.delete("users", {name: "María"});

const users2 = database.select("users");
console.log("----------------------------------");
console.log(users2);

database.update("users", {id: "1"}, {name: "Jane Doe"});

const users3 = database.select("users");
console.log("----------------------------------");
console.log(users3);
```

## Functions

| Function      | Description                          |
| ------------- | ------------------------------------ |
| `createTable` | To create a table                    |
| `insert`      | To insert a data in the table        |
| `update`      | To update a data in the table        |
| `select`      | To search for information in a table |
| `delete`      | To delete a data from the table      |
