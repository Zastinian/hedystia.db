interface Records {
    [key: string]: unknown;
}
interface Table {
    columns: string[];
    records: Records[];
}
interface Migration {
    id: string;
    description: string;
    timestamp: number;
    applied: boolean;
}
export default class DataBase {
    private queue;
    private password;
    private filePath;
    private tables;
    private migrations;
    private migrationsEnabled;
    constructor(filePath: string, password: string);
    enableMigrations(): void;
    createMigration(migration: Omit<Migration, "applied">, migrationFn: () => void): void;
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
    renameTable(oldTableName: string, newTableName: string): void;
    renameColumn(tableName: string, oldColumnName: string, newColumnName: string): void;
    getTableNames(): string[];
    getColumnNames(tableName: string): string[];
    getRecordCount(tableName: string): number;
    private processQueue;
    private markMigrationAsApplied;
    private insertTable;
    private updateTable;
    private deleteFromTable;
    private dropAllData;
    private renameTableInDb;
    private renameColumnInDb;
    private saveToFile;
    private readFromFile;
}
export {};
