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
  record?: { [key: string]: string };
  query?: { [key: string]: string };
  newData?: { [key: string]: string };
}

const createDatabase = (filePath: string, password: string) => {
  let tables: { [key: string]: Table } = {};
  const queue: QueueItem[] = [];

  const saveToFile = () => {
    if (!filePath.endsWith(".ht")) {
      throw new Error(`File path must include '.ht': ${filePath}`);
    }
    const data = JSON.stringify(tables);
    const encrypted = AES.encrypt(data, password).toString();
    fs.writeFileSync(filePath, encrypted);
  };

  const readFromFile = () => {
    if (!fs.existsSync(filePath)) {
      return;
    }
    const encrypted = fs.readFileSync(filePath, "utf8");
    const data = AES.decrypt(encrypted, password).toString(enc.Utf8);
    try {
      tables = JSON.parse(data);
    } catch {
      tables = {};
    }
  };

  const processQueue = () => {
    const request = queue[0];
    switch (request.method) {
      case "insert":
        insertTable(request.table, request.record as { [key: string]: string });
        break;
      case "update":
        updateTable(request.table, request.query as { [key: string]: string }, request.newData as { [key: string]: string });
        break;
      case "delete":
        deleteFromTable(request.table, request.query as { [key: string]: string });
        break;
    }
  };

  const insertTable = (tableName: string, record: { [key: string]: string }) => {
    readFromFile();
    if (!tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }

    const table = tables[tableName];
    const formattedRecord = table.columns.reduce((obj, column) => ({ ...obj, [column]: record[column] || null }), {});
    table.records.push(formattedRecord);
    saveToFile();
    queue.shift();
    if (queue.length > 0) {
      processQueue();
    }
  };

  const updateTable = (tableName: string, query: { [key: string]: string }, newData: { [key: string]: string }) => {
    readFromFile();
    if (!tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }
    const table = tables[tableName];
    table.records = table.records.map((record) => {
      if (Object.entries(query).every(([column, value]) => record[column] === value)) {
        return { ...record, ...newData };
      }
      return record;
    });
    saveToFile();
    queue.shift();
    if (queue.length > 0) {
      processQueue();
    }
  };

  const deleteFromTable = (tableName: string, query: { [key: string]: string }) => {
    readFromFile();
    if (!tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }

    tables[tableName].records = tables[tableName].records.filter(
      (record) => !Object.entries(query).every(([column, value]) => record[column] === value),
    );
    saveToFile();
    queue.shift();
    if (queue.length > 0) {
      processQueue();
    }
  };

  const createTable = (tableName: string, columns: string[]): void => {
    readFromFile();
    if (tables[tableName]) {
      throw new Error(`Table "${tableName}" already exists.`);
    }

    tables[tableName] = { columns, records: [] };
    saveToFile();
  };

  const deleteTable = (tableName: string) => {
    readFromFile();
    if (!tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }

    delete tables[tableName];
    saveToFile();
  };

  const insert = (tableName: string, record: { [key: string]: string }): void => {
    queue.push({ method: "insert", table: tableName, record });
    if (queue.length === 1) {
      processQueue();
    }
  };

  const update = (tableName: string, query: { [key: string]: string }, newData: { [key: string]: string }): void => {
    queue.push({ method: "update", table: tableName, query, newData });
    if (queue.length === 1) {
      processQueue();
    }
  };

  const select = (tableName: string, query: { [key: string]: string }): { [key: string]: string }[] => {
    readFromFile();
    if (!tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }
    if (!query) {
      return tables[tableName].records;
    }
    return tables[tableName].records.filter((record) => Object.entries(query).every(([column, value]) => record[column] === value));
  };

  const del = (tableName: string, query: { [key: string]: string }): void => {
    queue.push({ method: "delete", table: tableName, query });
    if (queue.length === 1) {
      processQueue();
    }
  };

  return {
    createTable,
    deleteTable,
    insert,
    update,
    select,
    delete: del,
  };
};

export default createDatabase;
