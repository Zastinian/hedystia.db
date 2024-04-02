export interface Table {
    columns: string[];
    records: {
        [key: string]: string;
    }[];
}
export interface QueueItem {
    method: string;
    table: string;
    record?: {
        [key: string]: string;
    };
    query?: {
        [key: string]: string;
    };
    newData?: {
        [key: string]: string;
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
    deleteTable(tableName: string): void;
    insert(tableName: string, record: {
        [key: string]: string;
    }): void;
    update(tableName: string, query: {
        [key: string]: string;
    }, newData: {
        [key: string]: string;
    }): void;
    select(tableName: string, query: {
        [key: string]: string;
    }): unknown;
    delete(tableName: string, query: {
        [key: string]: string;
    }): void;
    private processQueue;
    private insertTable;
    private updateTable;
    private deleteFromTable;
    private saveToFile;
    private readFromFile;
}
