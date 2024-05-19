import { beforeEach, describe, expect, it } from "bun:test";
import DataBase from "../Package/index";

describe("Adding and Deleting Columns", () => {
  let db: DataBase;

  beforeEach(() => {
    db = new DataBase("./Columns.ht", "password");
    db.deleteTableIfExists("users");
    db.createTableIfNotExists("users", ["name", "email"]);
  });

  it("should add a new column to a table", () => {
    db.addColumn("users", "age", 0);
    expect(db.readTables().users.columns).toEqual(["name", "email", "age"]);
    expect(db.readTables().users.records.every((record) => record.age === 0)).toBe(true);
  });

  it("should throw an error if the column already exists", () => {
    expect(() => db.addColumn("users", "name", "John")).toThrowError('Column "name" already exists in table "users".');
  });

  it("should delete a column from a table", () => {
    db.addColumn("users", "age", 0);
    db.deleteColumn("users", "age");
    expect(db.readTables().users.columns).toEqual(["name", "email"]);
    expect(db.readTables().users.records.every((record) => !record.hasOwnProperty("age"))).toBe(true);
  });

  it("should throw an error if the column doesn't exist", () => {
    expect(() => db.deleteColumn("users", "age")).toThrowError('Column "age" does not exist in table "users".');
  });
});
