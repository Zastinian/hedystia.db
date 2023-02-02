const fs = require("fs");
const cryptoJS = require("crypto-js");

const AES = cryptoJS.AES;
const enc = cryptoJS.enc;

const Database = class {
  constructor(filePath, password) {
    this.tables = {};
    this.filePath = filePath || "./database.es";
    this.password = password;
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
    this.readFromFile();
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }

    const table = this.tables[tableName];
    const formattedRecord = table.columns.reduce((obj, column) => ({...obj, [column]: record[column] || null}), {});
    table.records.push(formattedRecord);
    this.saveToFile();
  }

  update(tableName, query, newData) {
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
  }

  select(tableName, query = {}) {
    this.readFromFile();
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }
    return this.tables[tableName].records.filter((record) => Object.entries(query).every(([column, value]) => record[column] === value));
  }

  delete(tableName, query = {}) {
    this.readFromFile();
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }

    this.tables[tableName].records = this.tables[tableName].records.filter(
      (record) => !Object.entries(query).every(([column, value]) => record[column] === value)
    );
    this.saveToFile();
  }

  saveToFile() {
    if (!this.filePath.endsWith(".es")) {
      throw new Error(`File path must include '.es': ${this.filePath}`);
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
