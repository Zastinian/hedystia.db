import { beforeEach, describe, expect, it } from "bun:test";
import DataBase from "../Package/index";

describe("Table Creation and Deletion", () => {
  let db: DataBase;

  beforeEach(() => {
    db = new DataBase("./Records.ht", "password");
  });

  it("should create a new table", () => {
    db.deleteTableIfExists("users");
    db.createTableIfNotExists("users", ["name", "email"]);
    expect(db.tables).toHaveProperty("users");
    expect(db.tables.users.columns).toEqual(["name", "email"]);
    expect(db.tables.users.records).toEqual([]);
  });

  it("should throw an error if the table already exists", () => {
    expect(() => db.createTable("users", ["name", "email"])).toThrowError('Table "users" already exists.');
  });

  it("should create a table if it doesn't exist", () => {
    db.createTableIfNotExists("posts", ["title", "content"]);
    expect(db.tables).toHaveProperty("posts");
    expect(db.tables.posts.columns).toEqual(["title", "content"]);
    expect(db.tables.posts.records).toEqual([]);
  });

  it("should not create a table if it already exists", () => {
    db.createTableIfNotExists("posts", ["title", "content"]);
    expect(db.tables.posts.columns).toEqual(["title", "content"]);
    expect(db.tables.posts.records).toEqual([]);
  });

  it("should delete a table", () => {
    db.deleteTable("users");
    expect(db.tables).not.toHaveProperty("users");
  });

  it("should throw an error if the table doesn't exist", () => {
    expect(() => db.deleteTable("users")).toThrowError('Table "users" does not exist.');
  });

  it("should delete a table if it exists", () => {
    db.deleteTableIfExists("posts");
    expect(db.tables).not.toHaveProperty("posts");
  });

  it("should not delete a table if it doesn't exist", () => {
    db.deleteTableIfExists("posts");
    expect(db.tables).not.toHaveProperty("posts");
  });
});
