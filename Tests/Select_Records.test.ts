import { beforeEach, describe, expect, it } from "bun:test";
import DataBase from "../Package/index";

describe("Selecting Records", () => {
  let db: DataBase;

  beforeEach(() => {
    db = new DataBase("./Select_Records.ht", "password");
    db.deleteTableIfExists("users");
    db.createTableIfNotExists("users", ["name", "email"]);
    db.insert("users", { name: "John", email: "john@example.com" });
    db.insert("users", { name: "Jane", email: "jane@example.com" });
  });

  it("should select all records from a table", () => {
    expect(db.select("users")).toEqual([
      { name: "John", email: "john@example.com" },
      { name: "Jane", email: "jane@example.com" },
    ]);
  });

  it("should select records based on a query", () => {
    expect(db.select("users", { name: "John" })).toEqual([{ name: "John", email: "john@example.com" }]);
  });

  it("should return an empty array if no records match the query", () => {
    expect(db.select("users", { name: "Bob" })).toEqual([]);
  });
});
