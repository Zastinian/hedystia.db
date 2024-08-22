import { beforeEach, describe, expect, it } from "bun:test";
import DataBase from "../Package/index";

describe("Database Migrations", () => {
	let db: DataBase;

	beforeEach(() => {
		db = new DataBase("./Migrations.ht", "password");
		db.deleteTableIfExists("migrations");
		db.enableMigrations();
	});

	it("should enable migrations", () => {
		db.createMigration(
			{ id: "001", description: "Initial migration", timestamp: Date.now() },
			() => {},
		);
		expect(db.readTables()).toHaveProperty("migrations");
	});

	it("should create a new migration and apply it", () => {
		db.createMigration(
			{ id: "002", description: "Second migration", timestamp: Date.now() },
			() => {
				db.createTableIfNotExists("test_table", ["name"]);
			},
		);
		expect(db.select("migrations", { id: "002" })).toHaveLength(1);
		expect(db.readTables().test_table).toBeDefined();
	});

	it("check if migration is applied creating 2 migrations with the same id", () => {
		db.createMigration(
			{ id: "003", description: "Third migration", timestamp: Date.now() },
			() => {
				db.createTableIfNotExists("test_new_table", ["name"]);
			},
		);
		db.createMigration(
			{ id: "003", description: "Third migration", timestamp: Date.now() },
			() => {
				db.createTableIfNotExists("test_new_table", ["name"]);
			},
		);
		expect(db.select("migrations", { id: "003" })).toHaveLength(1);
		expect(db.readTables().test_new_table).toBeDefined();
	});

	it("should handle migration functions execution", () => {
		let migrationFnExecuted = false;
		db.createMigration(
			{ id: "004", description: "Fourth migration", timestamp: Date.now() },
			() => {
				migrationFnExecuted = true;
			},
		);
		expect(migrationFnExecuted).toBe(true);
	});

	it("should handle migration functions execution with two same migrations", () => {
		let migrationFnExecuted = false;
		db.createMigration(
			{ id: "005", description: "Fifth migration", timestamp: Date.now() },
			() => {
				migrationFnExecuted = true;
			},
		);
		db.createMigration(
			{ id: "005", description: "Fifth migration", timestamp: Date.now() },
			() => {
				migrationFnExecuted = false;
			},
		);
		expect(migrationFnExecuted).toBe(true);
	});
});
