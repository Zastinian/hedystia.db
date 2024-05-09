const db = require("../Package/index");

const database = new db("./database.ht", "password");

database.createTable("users", ["id", "name", "email"]);

database.insert("users", { id: "1", name: "John Doe", email: "jdoe@example.com" });

database.insert("users", { id: "2", name: "María", email: "maria@example.com" });

const users = database.select("users");

console.log("----------------------------------");

console.log(users);

database.addColumn("users", "phone", "null");

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

database.update("users", { id: "1" }, { name: "Jane Doe" });

const users3 = database.select("users");
console.log("----------------------------------");
console.log(users3);
