## Installation

```
npm i hedystia.db

yarn add hedystia.db
```

## Nodejs Version

- `v16.9.0` or higher

## Links

- [Discord](https://discord.gg/aXvuUpvRQs) [Hedystia Discord]
- [Discord_Bot](https://hedystia.com) [Hedystia Bot]

## Example

```js
const Database = require("hedystia.db");

// Create a file named database.ht and enter the password
const database = new Database("./database.ht", "password");

// You can only use it once to create the table after that you can no longer use it.
database.createTable("users", ["id", "name", "email"]);

database.insert("users", {id: "1", name: "John Doe", email: "jdoe@example.com"});

database.insert("users", {id: "2", name: "María", email: "maria@example.com"});

const users = database.select("users");

console.log("----------------------------------");

console.log(users);

const userJohn = database.select("users", {name: "John Doe"});
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
| `deleteTable` | To delete a table                    |
| `insert`      | To insert a data in the table        |
| `update`      | To update a data in the table        |
| `select`      | To search for information in a table |
| `delete`      | To delete a data from the table      |
