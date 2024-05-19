import fs from "fs";
import cryptoJS from "crypto-js";

const AES = cryptoJS.AES;
const enc = cryptoJS.enc;

interface Table {
  columns: string[];
  records: {
    [key: string]: any;
  }[];
}

interface QueueItem {
  method: string;
  table: string;
  record?: { [key: string]: any };
  query?: { [key: string]: any };
  newData?: { [key: string]: any };
}

export default class DataBase {
  private queue: QueueItem[] = [];
  private password: string;
  private filePath: string;
  private tables: { [key: string]: Table } = {};
  constructor(filePath: string, password: string) {
    this.tables = {};
    this.filePath = filePath || "./database.ht";
    this.password = password;
    this.queue = [];
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

  public addColumn(tableName: string, column: string, defaultValue: any): void {
    this.readFromFile();
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }
    if (this.tables[tableName].columns.includes(column)) {
      throw new Error(`Column "${column}" already exists in table "${tableName}".`);
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
      throw new Error(`Column "${column}" does not exist in table "${tableName}".`);
    }

    const columnIndex = this.tables[tableName].columns.indexOf(column);
    this.tables[tableName].columns.splice(columnIndex, 1);
    for (const record of this.tables[tableName].records) {
      delete record[column];
    }
    this.saveToFile();
  }

  public insert(tableName: string, record: { [key: string]: any }): void {
    this.queue.push({ method: "insert", table: tableName, record });
    if (this.queue.length === 1) {
      this.processQueue();
    }
  }

  public update(tableName: string, query: { [key: string]: any }, newData: { [key: string]: any }): void {
    this.queue.push({ method: "update", table: tableName, query, newData });
    if (this.queue.length === 1) {
      this.processQueue();
    }
  }

  public select(tableName: string, query: { [key: string]: any } = {}): unknown[] {
    this.readFromFile();
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }
    return this.tables[tableName].records.filter((record) => Object.entries(query).every(([column, value]) => record[column] === value));
  }

  public delete(tableName: string, query: { [key: string]: any } = {}): void {
    this.queue.push({ method: "delete", table: tableName, query });
    if (this.queue.length === 1) {
      this.processQueue();
    }
  }

  public readTables(): { [key: string]: Table } {
    this.readFromFile();
    return this.tables;
  }

  private processQueue() {
    const request = this.queue[0];
    switch (request.method) {
      case "insert":
        this.insertTable(request.table, request.record as { [key: string]: any });
        break;
      case "update":
        this.updateTable(request.table, request.query as { [key: string]: any }, request.newData as { [key: string]: any });
        break;
      case "delete":
        this.deleteFromTable(request.table, request.query as { [key: string]: any });
        break;
    }
  }

  private insertTable(tableName: string, record: { [key: string]: any }) {
    this.readFromFile();
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }

    const table = this.tables[tableName];
    const formattedRecord = table.columns.reduce((obj, column) => ({ ...obj, [column]: record[column] || null }), {});
    table.records.push(formattedRecord);
    this.saveToFile();
    this.queue.shift();
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }

  private updateTable(tableName: string, query: { [key: string]: any }, newData: { [key: string]: any }) {
    this.readFromFile();
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }
    const table = this.tables[tableName];
    const updatedRecords = table.records.map((record) => {
      Object.entries(newData).forEach(([column, value]) => {
        if (table.columns.includes(column) && Object.entries(query).every(([qColumn, qValue]) => record[qColumn] === qValue)) {
          record[column] = value;
        }
      });
      return record;
    });
    table.records = updatedRecords;
    this.saveToFile();
    this.queue.shift();
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }

  private deleteFromTable(tableName: string, query: { [key: string]: any }) {
    this.readFromFile();
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }

    this.tables[tableName].records = this.tables[tableName].records.filter(
      (record) => !Object.entries(query).every(([column, value]) => record[column] === value)
    );
    this.saveToFile();
    this.queue.shift();
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }

  private saveToFile() {
    if (!this.filePath.endsWith(".ht")) {
      throw new Error(`File path must include '.ht': ${this.filePath}`);
    }
    const data = JSON.stringify(this.tables);
    const encrypted = AES.encrypt(data, this.password).toString();
    fs.writeFileSync(this.filePath, encrypted);
  }

  private readFromFile() {
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
