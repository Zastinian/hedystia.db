interface Table {
    columns: string[];
    records: {
        [key: string]: any;
    }[];
}
interface QueueItem {
    method: string;
    table: string;
    record?: {
        [key: string]: any;
    };
    query?: {
        [key: string]: any;
    };
    newData?: {
        [key: string]: any;
    };
}
export default class DataBase {
    queue: QueueItem[];
    password: string;
    filePath: string;
    tables: {
        [key: string]: Table;
    };
    constructor(filePath: string, password: string);
    createTable(tableName: string, columns: string[]): void;
    createTableIfNotExists(tableName: string, columns: string[]): void;
    deleteTable(tableName: string): void;
    deleteTableIfExists(tableName: string): void;
    addColumn(tableName: string, column: string, defaultValue: any): void;
    deleteColumn(tableName: string, column: string): void;
    insert(tableName: string, record: {
        [key: string]: any;
    }): void;
    update(tableName: string, query: {
        [key: string]: any;
    }, newData: {
        [key: string]: any;
    }): void;
    select(tableName: string, query: {
        [key: string]: any;
    }): unknown;
    delete(tableName: string, query: {
        [key: string]: any;
    }): void;
    private processQueue;
    private insertTable;
    private updateTable;
    private deleteFromTable;
    private saveToFile;
    private readFromFile;
}
export {};
