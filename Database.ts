import fs from "fs";
import {AES, enc} from "crypto-js";
import Base from "./Base";

class Database extends Base {
  constructor(filePath: string, password: string) {
    super(filePath, password);
  }

  createTable(tableName: string, columns: string[] = []) {
    this.readFromFile();
    if (this.tables[tableName]) {
      throw new Error(`Table "${tableName}" already exists.`);
    }

    this.tables[tableName] = {columns, records: []};
    this.saveToFile();
  }

  insert(tableName: string, record: {[key: string]: string}) {
    this.readFromFile();
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }

    const table = this.tables[tableName];
    const formattedRecord = table.columns.reduce((obj, column) => ({...obj, [column]: record[column] || null}), {});
    table.records.push(formattedRecord);
    this.saveToFile();
  }

  update(tableName: string, query: {[key: string]: string}, newData: {[key: string]: string}) {
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

  select(tableName: string, query: {[key: string]: string} = {}) {
    this.readFromFile();
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }
    return this.tables[tableName].records.filter((record) => Object.entries(query).every(([column, value]) => record[column] === value));
  }

  delete(tableName: string, query: {[key: string]: string} = {}) {
    this.readFromFile();
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }

    this.tables[tableName].records = this.tables[tableName].records.filter(
      (record) => !Object.entries(query).every(([column, value]) => record[column] === value)
    );
    this.saveToFile();
  }

  private saveToFile() {
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

export default Database;
