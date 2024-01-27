"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const crypto_js_1 = __importDefault(require("crypto-js"));
const AES = crypto_js_1.default.AES;
const enc = crypto_js_1.default.enc;
const createDatabase = (filePath, password) => {
    let tables = {};
    const queue = [];
    const saveToFile = () => {
        if (!filePath.endsWith(".ht")) {
            throw new Error(`File path must include '.ht': ${filePath}`);
        }
        const data = JSON.stringify(tables);
        const encrypted = AES.encrypt(data, password).toString();
        fs_1.default.writeFileSync(filePath, encrypted);
    };
    const readFromFile = () => {
        if (!fs_1.default.existsSync(filePath)) {
            return;
        }
        const encrypted = fs_1.default.readFileSync(filePath, "utf8");
        const data = AES.decrypt(encrypted, password).toString(enc.Utf8);
        try {
            tables = JSON.parse(data);
        }
        catch {
            tables = {};
        }
    };
    const processQueue = () => {
        const request = queue[0];
        switch (request.method) {
            case "insert":
                insertTable(request.table, request.record);
                break;
            case "update":
                updateTable(request.table, request.query, request.newData);
                break;
            case "delete":
                deleteFromTable(request.table, request.query);
                break;
        }
    };
    const insertTable = (tableName, record) => {
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
    const updateTable = (tableName, query, newData) => {
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
    const deleteFromTable = (tableName, query) => {
        readFromFile();
        if (!tables[tableName]) {
            throw new Error(`Table "${tableName}" does not exist.`);
        }
        tables[tableName].records = tables[tableName].records.filter((record) => !Object.entries(query).every(([column, value]) => record[column] === value));
        saveToFile();
        queue.shift();
        if (queue.length > 0) {
            processQueue();
        }
    };
    const createTable = (tableName, columns) => {
        readFromFile();
        if (tables[tableName]) {
            throw new Error(`Table "${tableName}" already exists.`);
        }
        tables[tableName] = { columns, records: [] };
        saveToFile();
    };
    const deleteTable = (tableName) => {
        readFromFile();
        if (!tables[tableName]) {
            throw new Error(`Table "${tableName}" does not exist.`);
        }
        delete tables[tableName];
        saveToFile();
    };
    const insert = (tableName, record) => {
        queue.push({ method: "insert", table: tableName, record });
        if (queue.length === 1) {
            processQueue();
        }
    };
    const update = (tableName, query, newData) => {
        queue.push({ method: "update", table: tableName, query, newData });
        if (queue.length === 1) {
            processQueue();
        }
    };
    const select = (tableName, query) => {
        readFromFile();
        if (!tables[tableName]) {
            throw new Error(`Table "${tableName}" does not exist.`);
        }
        if (!query) {
            return tables[tableName].records;
        }
        return tables[tableName].records.filter((record) => Object.entries(query).every(([column, value]) => record[column] === value));
    };
    const del = (tableName, query) => {
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
exports.default = createDatabase;
