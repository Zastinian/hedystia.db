const db = require("../Package/Database");

const d_1 = new db("../db.ht", "123");
const d_2 = new db("../db2.ht", "123");

d_1.createTable("users", ["id", "name", "email"]);
d_2.createTable("users", ["id", "name", "email"]);

const d_3 = new db("./db.ht", "123");
const d_4 = new db("./db2.ht", "123");

d_3.createTable("users", ["id", "name", "email"]);
d_4.createTable("users", ["id", "name", "email"]);
