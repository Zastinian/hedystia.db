interface Records {
    [key: string]: any;
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
    select(tableName: string, query?: {
        [key: string]: any;
    }): Records[];
    delete(tableName: string, query?: {
        [key: string]: any;
    }): void;
    readTables(): {
        [key: string]: Table;
    };
    private processQueue;
    private insertTable;
    private updateTable;
    private deleteFromTable;
    private saveToFile;
    private readFromFile;
}
export {};
