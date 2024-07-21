interface Records {
    [key: string]: unknown;
}
interface Table {
    columns: string[];
    records: Records[];
}
export default class DataBase {
    private queue;
    private password;
    private filePath;
    private tables;
    constructor(filePath: string, password: string);
    createTable(tableName: string, columns?: string[]): void;
    createTableIfNotExists(tableName: string, columns: string[]): void;
    deleteTable(tableName: string): void;
    deleteTableIfExists(tableName: string): void;
    addColumn(tableName: string, column: string, defaultValue?: unknown): void;
    deleteColumn(tableName: string, column: string): void;
    insert(tableName: string, record: {
        [key: string]: unknown;
    }): void;
    update(tableName: string, query: {
        [key: string]: unknown;
    }, newData: {
        [key: string]: unknown;
    }): void;
    select(tableName: string, query?: {
        [key: string]: unknown;
    }): Records[];
    delete(tableName: string, query?: {
        [key: string]: unknown;
    }): void;
    readTables(): {
        [key: string]: Table;
    };
    dropAll(): void;
    private processQueue;
    private insertTable;
    private updateTable;
    private deleteFromTable;
    private saveToFile;
    private readFromFile;
}
export {};
