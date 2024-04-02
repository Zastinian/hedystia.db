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
declare const Database: {
    new (filePath: string, password: string): {
        queue: QueueItem[];
        password: string;
        filePath: string;
        tables: {
            [key: string]: Table;
        };
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
        }): {
            [key: string]: string;
        }[];
        delete(tableName: string, query: {
            [key: string]: string;
        }): void;
        processQueue(): void;
        insertTable(tableName: string, record: {
            [key: string]: string;
        }): void;
        updateTable(tableName: string, query: {
            [key: string]: string;
        }, newData: {
            [key: string]: string;
        }): void;
        deleteFromTable(tableName: string, query: {
            [key: string]: string;
        }): void;
        saveToFile(): void;
        readFromFile(): void;
    };
};
export default Database;
