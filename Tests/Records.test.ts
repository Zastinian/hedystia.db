import { beforeEach, describe, expect, it } from "bun:test";
import DataBase from "../Package/index";

describe("Inserting, Updating, and Deleting Records", () => {
  let db: DataBase;

  beforeEach(() => {
    db = new DataBase("./Records.ht", "password");
    db.deleteTableIfExists("users");
    db.createTableIfNotExists("users", ["name", "email"]);
  });

  it("should insert a new record into a table", () => {
    db.insert("users", { name: "John", email: "john@example.com" });
    expect(db.readTables().users.records).toEqual([{ name: "John", email: "john@example.com" }]);
    db.delete("users", { name: "John" });
  });

  it("should update a record in a table", () => {
    db.insert("users", { name: "John", email: "john@example.com" });
    db.update("users", { name: "John" }, { email: "john.doe@example.com" });
    expect(db.readTables().users.records).toEqual([{ name: "John", email: "john.doe@example.com" }]);
    db.delete("users", { name: "John" });
  });

  it("should delete a record from a table", () => {
    db.insert("users", { name: "John", email: "john@example.com" });
    db.delete("users", { name: "John" });
    expect(db.readTables().users.records).toEqual([]);
  });
});
