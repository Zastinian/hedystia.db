import fs from "fs";
import cryptoJS from "crypto-js";

const AES = cryptoJS.AES;
const enc = cryptoJS.enc;

interface Records {
	[key: string]: unknown;
}

interface Table {
	columns: string[];
	records: Records[];
}

interface QueueItem {
	method: string;
	table?: string;
	record?: Records;
	query?: Records;
	newData?: Records;
}

interface Migration {
	id: string;
	description: string;
	timestamp: number;
	applied: boolean;
}

export default class DataBase {
	private queue: QueueItem[] = [];
	private password: string;
	private filePath: string;
	private tables: { [key: string]: Table } = {};
	private migrations: Migration[] = [];
	private migrationsEnabled = false;

	constructor(filePath: string, password: string) {
		this.tables = {};
		this.filePath = filePath || "./database.ht";
		this.password = password;
		this.queue = [];
	}

	public enableMigrations(): void {
		this.migrationsEnabled = true;
		this.createTableIfNotExists("migrations", [
			"id",
			"description",
			"timestamp",
			"applied",
		]);
	}

	public createMigration(
		migration: Omit<Migration, "applied">,
		migrationFn: () => void,
	): void {
		if (!this.migrationsEnabled) {
			throw new Error(
				"Migrations are not enabled. Call enableMigrations() first.",
			);
		}
		this.readFromFile();

		const existingMigration = this.select("migrations", {
			id: migration.id,
		}) as unknown as Migration[];
		if (!existingMigration[0] || !existingMigration[0].applied) {
			this.migrations.push({ ...migration, applied: false });
			this.insert("migrations", { ...migration, applied: false });

			this.queue.push({
				method: "migration",
				table: "migrations",
				record: { ...migration, applied: false },
			});
			if (this.queue.length === 1) {
				this.processQueue(migrationFn);
			}
		}
	}

	public createTable(tableName: string, columns: string[] = []): void {
		this.readFromFile();
		if (this.tables[tableName]) {
			throw new Error(`Table "${tableName}" already exists.`);
		}

		this.tables[tableName] = { columns, records: [] };
		this.saveToFile();
	}

	public createTableIfNotExists(tableName: string, columns: string[]): void {
		this.readFromFile();
		if (!this.tables[tableName]) {
			this.tables[tableName] = { columns, records: [] };
			this.saveToFile();
		}
	}

	public deleteTable(tableName: string): void {
		this.readFromFile();
		if (!this.tables[tableName]) {
			throw new Error(`Table "${tableName}" does not exist.`);
		}

		delete this.tables[tableName];
		this.saveToFile();
	}

	public deleteTableIfExists(tableName: string): void {
		this.readFromFile();
		if (this.tables[tableName]) {
			delete this.tables[tableName];
			this.saveToFile();
		}
	}

	public addColumn(
		tableName: string,
		column: string,
		defaultValue?: unknown,
	): void {
		this.readFromFile();
		if (!this.tables[tableName]) {
			throw new Error(`Table "${tableName}" does not exist.`);
		}
		if (this.tables[tableName].columns.includes(column)) {
			throw new Error(
				`Column "${column}" already exists in table "${tableName}".`,
			);
		}

		this.tables[tableName].columns.push(column);
		for (const record of this.tables[tableName].records) {
			record[column] = defaultValue ?? null;
		}
		this.saveToFile();
	}

	public deleteColumn(tableName: string, column: string): void {
		this.readFromFile();
		if (!this.tables[tableName]) {
			throw new Error(`Table "${tableName}" does not exist.`);
		}
		if (!this.tables[tableName].columns.includes(column)) {
			throw new Error(
				`Column "${column}" does not exist in table "${tableName}".`,
			);
		}

		const columnIndex = this.tables[tableName].columns.indexOf(column);
		this.tables[tableName].columns.splice(columnIndex, 1);
		for (const record of this.tables[tableName].records) {
			delete record[column];
		}
		this.saveToFile();
	}

	public insert(tableName: string, record: { [key: string]: unknown }): void {
		this.queue.push({ method: "insert", table: tableName, record });
		if (this.queue.length === 1) {
			this.processQueue();
		}
	}

	public update(
		tableName: string,
		query: { [key: string]: unknown },
		newData: { [key: string]: unknown },
	): void {
		this.queue.push({ method: "update", table: tableName, query, newData });
		if (this.queue.length === 1) {
			this.processQueue();
		}
	}

	public select(
		tableName: string,
		query: { [key: string]: unknown } = {},
	): Records[] {
		this.readFromFile();
		if (!this.tables[tableName]) {
			throw new Error(`Table "${tableName}" does not exist.`);
		}
		return this.tables[tableName].records.filter((record) =>
			Object.entries(query).every(
				([column, value]) => record[column] === value,
			),
		);
	}

	public delete(
		tableName: string,
		query: { [key: string]: unknown } = {},
	): void {
		this.queue.push({ method: "delete", table: tableName, query });
		if (this.queue.length === 1) {
			this.processQueue();
		}
	}

	public readTables(): { [key: string]: Table } {
		this.readFromFile();
		return this.tables;
	}

	public dropAll(): void {
		this.queue.push({ method: "dropAllData" });
		if (this.queue.length === 1) {
			this.processQueue();
		}
	}

	private processQueue(migrationFn?: () => void): void {
		const request = this.queue[0];
		switch (request.method) {
			case "insert":
				if (!request.table) {
					throw new Error("Table name is required.");
				}
				this.insertTable(
					request.table,
					request.record as { [key: string]: unknown },
				);
				break;
			case "update":
				if (!request.table) {
					throw new Error("Table name is required.");
				}
				this.updateTable(
					request.table,
					request.query as { [key: string]: unknown },
					request.newData as { [key: string]: unknown },
				);
				break;
			case "delete":
				if (!request.table) {
					throw new Error("Table name is required.");
				}
				this.deleteFromTable(
					request.table,
					request.query as { [key: string]: unknown },
				);
				break;
			case "dropAllData":
				this.dropAllData();
				break;
			case "migration":
				if (migrationFn) {
					migrationFn();
					this.markMigrationAsApplied(request.record?.id as string);
				}
				break;
		}
	}

	private markMigrationAsApplied(migrationId: string): void {
		this.readFromFile();
		const migration = this.select("migrations", {
			id: migrationId,
		}) as unknown as Migration[];
		if (migration.length > 0) {
			this.updateTable(
				"migrations",
				{ id: migrationId },
				{ ...migration[0], applied: true },
			);
		}
		this.queue.shift();
		if (this.queue.length > 0) {
			this.processQueue();
		}
	}

	private insertTable(
		tableName: string,
		record: { [key: string]: unknown },
	): void {
		this.readFromFile();
		if (!this.tables[tableName]) {
			throw new Error(`Table "${tableName}" does not exist.`);
		}

		const table = this.tables[tableName];
		const formattedRecord: { [key: string]: unknown } = {};

		for (const column of table.columns) {
			formattedRecord[column] = record[column] || null;
		}

		table.records.push(formattedRecord);
		this.saveToFile();
		this.queue.shift();
		if (this.queue.length > 0) {
			this.processQueue();
		}
	}

	private updateTable(
		tableName: string,
		query: { [key: string]: unknown },
		newData: { [key: string]: unknown },
	): void {
		this.readFromFile();
		if (!this.tables[tableName]) {
			throw new Error(`Table "${tableName}" does not exist.`);
		}
		const table = this.tables[tableName];
		const updatedRecords = table.records.map((record) => {
			const entries = Object.entries(newData);
			for (const [column, value] of entries) {
				if (
					table.columns.includes(column) &&
					Object.entries(query).every(
						([qColumn, qValue]) => record[qColumn] === qValue,
					)
				) {
					record[column] = value;
				}
			}
			return record;
		});
		table.records = updatedRecords;
		this.saveToFile();
		this.queue.shift();
		if (this.queue.length > 0) {
			this.processQueue();
		}
	}

	private deleteFromTable(
		tableName: string,
		query: { [key: string]: unknown },
	): void {
		this.readFromFile();
		if (!this.tables[tableName]) {
			throw new Error(`Table "${tableName}" does not exist.`);
		}

		this.tables[tableName].records = this.tables[tableName].records.filter(
			(record) =>
				!Object.entries(query).every(
					([column, value]) => record[column] === value,
				),
		);
		this.saveToFile();
		this.queue.shift();
		if (this.queue.length > 0) {
			this.processQueue();
		}
	}

	private dropAllData(): void {
		this.readFromFile();
		for (const tableName in this.tables) {
			this.tables[tableName].records = [];
		}
		this.saveToFile();
		this.queue.shift();
		if (this.queue.length > 0) {
			this.processQueue();
		}
	}

	private saveToFile(): void {
		if (!this.filePath.endsWith(".ht")) {
			throw new Error(`File path must include '.ht': ${this.filePath}`);
		}
		const data = JSON.stringify(this.tables);
		const encrypted = AES.encrypt(data, this.password).toString();
		fs.writeFileSync(this.filePath, encrypted);
	}

	private readFromFile(): void {
		if (!fs.existsSync(this.filePath)) {
			return;
		}
		const encrypted = fs.readFileSync(this.filePath, "utf8");
		const data = AES.decrypt(encrypted, this.password).toString(enc.Utf8);
		try {
			this.tables = JSON.parse(data);
		} catch {
			this.tables = {};
		}
	}
}
