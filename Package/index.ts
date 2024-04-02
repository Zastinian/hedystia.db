import fs from "fs";
import cryptoJS from "crypto-js";

const AES = cryptoJS.AES;
const enc = cryptoJS.enc;

interface Table {
  columns: string[];
  records: {
    [key: string]: string;
  }[];
}

interface QueueItem {
  method: string;
  table: string;
  record?: {[key: string]: string};
  query?: {[key: string]: string};
  newData?: {[key: string]: string};
}

const Database = class {
  queue: QueueItem[] = [];
  password: string;
  filePath: string;
  tables: {[key: string]: Table} = {};
  constructor(filePath: string, password: string) {
    this.tables = {};
    this.filePath = filePath || "./database.ht";
    this.password = password;
    this.queue = [];
  }

  createTable(tableName: string, columns: string[]): void {
    this.readFromFile();
    if (this.tables[tableName]) {
      throw new Error(`Table "${tableName}" already exists.`);
    }

    this.tables[tableName] = {columns, records: []};
    this.saveToFile();
  }

  deleteTable(tableName: string): void {
    this.readFromFile();
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }

    delete this.tables[tableName];
    this.saveToFile();
  }

  insert(tableName: string, record: {[key: string]: string}): void {
    this.queue.push({method: "insert", table: tableName, record});
    if (this.queue.length === 1) {
      this.processQueue();
    }
  }

  update(tableName: string, query: {[key: string]: string}, newData: {[key: string]: string}): void {
    this.queue.push({method: "update", table: tableName, query, newData});
    if (this.queue.length === 1) {
      this.processQueue();
    }
  }

  select(tableName: string, query: {[key: string]: string}): {[key: string]: string}[] {
    this.readFromFile();
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }
    return this.tables[tableName].records.filter((record) => Object.entries(query).every(([column, value]) => record[column] === value));
  }

  delete(tableName: string, query: {[key: string]: string}): void {
    this.queue.push({method: "delete", table: tableName, query});
    if (this.queue.length === 1) {
      this.processQueue();
    }
  }

  processQueue() {
    const request = this.queue[0];
    switch (request.method) {
      case "insert":
        this.insertTable(request.table, request.record as {[key: string]: string});
        break;
      case "update":
        this.updateTable(request.table, request.query as {[key: string]: string}, request.newData as {[key: string]: string});
        break;
      case "delete":
        this.deleteFromTable(request.table, request.query as {[key: string]: string});
        break;
    }
  }

  insertTable(tableName: string, record: {[key: string]: string}) {
    this.readFromFile();
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }

    const table = this.tables[tableName];
    const formattedRecord = table.columns.reduce((obj, column) => ({...obj, [column]: record[column] || null}), {});
    table.records.push(formattedRecord);
    this.saveToFile();
    this.queue.shift();
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }

  updateTable(tableName: string, query: {[key: string]: string}, newData: {[key: string]: string}) {
    this.readFromFile();
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }
    const table = this.tables[tableName];
    table.records = table.records.map((record) => {
      if (Object.entries(query).every(([column, value]) => record[column] === value)) {
        return {...record, ...newData};
      }
      return record;
    });
    this.saveToFile();
    this.queue.shift();
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }

  deleteFromTable(tableName: string, query: {[key: string]: string}) {
    this.readFromFile();
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }

    this.tables[tableName].records = this.tables[tableName].records.filter(
      (record) => !Object.entries(query).every(([column, value]) => record[column] === value),
    );
    this.saveToFile();
    this.queue.shift();
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }

  saveToFile() {
    if (!this.filePath.endsWith(".ht")) {
      throw new Error(`File path must include '.ht': ${this.filePath}`);
    }
    const data = JSON.stringify(this.tables);
    const encrypted = AES.encrypt(data, this.password).toString();
    fs.writeFileSync(this.filePath, encrypted);
  }

  readFromFile() {
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
};

export default Database;
