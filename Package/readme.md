## Installation

```
npm i @hedystia/db

yarn add @hedystia/db
```

## Nodejs Version

- `v18.0.0` or higher

## Links

- [Discord](https://discord.gg/aXvuUpvRQs) [Hedystia Discord]
- [Discord_Bot](https://hedystia.com) [Hedystia Bot]
- [Docs](https://docs.hedystia.com/db/start) [Hedystia Docs]

## Example

```js
const Database = require("@hedystia/db");

// Create a file named database.ht and enter the password
const database = new Database("./database.ht", "password");

// You can only use it once to create the table after that you can no longer use it.
database.createTable("users", ["id", "name", "email"]);

database.insert("users", { id: "1", name: "John Doe", email: "jdoe@example.com" });

database.insert("users", { id: "2", name: "María", email: "maria@example.com" });

const users = database.select("users");

console.log("----------------------------------");

console.log(users);

database.addColumn("users", "phone");

database.addColumn("users", "lang", "en-US");

const newUsersPhone = database.select("users");

console.log("----------------------------------");

console.log(newUsersPhone);

database.deleteColumn("users", "phone");

const oldUsersPhone = database.select("users");

console.log("----------------------------------");

console.log(oldUsersPhone);

const userJohn = database.select("users", { name: "John Doe" });

console.log("----------------------------------");

console.log(userJohn);

database.delete("users", { name: "María" });

const users2 = database.select("users");

console.log("----------------------------------");

console.log(users2);

database.update("users", { id: "1" }, { name: "Jane Doe", lang: "es-ES" });

const users3 = database.select("users");

console.log("----------------------------------");

console.log(users3);
```

## Functions

| Function                 | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `createTable`            | To create a table                              |
| `deleteTable`            | To delete a table                              |
| `createTableIfNotExists` | To create a table if it does not exist         |
| `deleteTableIfExists`    | To delete a table if it exists                 |
| `addColumn`              | To add a column to an already created table    |
| `deleteColumn`           | To remove a column to an already created table |
| `insert`                 | To insert a data in the table                  |
| `update`                 | To update a data in the table                  |
| `select`                 | To search for information in a table           |
| `delete`                 | To delete a data from the table                |
