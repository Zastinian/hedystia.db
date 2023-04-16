const fs = require("fs");
const cryptoJS = require("crypto-js");

const AES = cryptoJS.AES;
const enc = cryptoJS.enc;

const Database = class {
  constructor(filePath, password) {
    this.tables = {};
    this.filePath = filePath || "./database.ht";
    this.password = password;
    this.queue = [];
  }

  createTable(tableName, columns = []) {
    this.readFromFile();
    if (this.tables[tableName]) {
      throw new Error(`Table "${tableName}" already exists.`);
    }

    this.tables[tableName] = {columns, records: []};
    this.saveToFile();
  }

  deleteTable(tableName) {
    this.readFromFile();
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }

    delete this.tables[tableName];
    this.saveToFile();
  }

  insert(tableName, record) {
    this.queue.push({method: "insert", table: tableName, record});
    if (this.queue.length === 1) {
      this.processQueue();
    }
  }

  update(tableName, query, newData) {
    this.queue.push({method: "update", table: tableName, query, newData});
    if (this.queue.length === 1) {
      this.processQueue();
    }
  }

  select(tableName, query = {}) {
    this.readFromFile();
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }
    return this.tables[tableName].records.filter((record) => Object.entries(query).every(([column, value]) => record[column] === value));
  }

  delete(tableName, query = {}) {
    this.queue.push({method: "delete", table: tableName, query});
    if (this.queue.length === 1) {
      this.processQueue();
    }
  }

  processQueue() {
    const request = this.queue[0];
    switch (request.method) {
      case "insert":
        this.insertTable(request.table, request.record);
        break;
      case "update":
        this.updateTable(request.table, request.query, request.newData);
        break;
      case "delete":
        this.deleteFromTable(request.table, request.query);
        break;
    }
  }

  insertTable(tableName, record) {
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

  updateTable(tableName, query, newData) {
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

  deleteFromTable(tableName, query) {
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

module.exports = Database;
