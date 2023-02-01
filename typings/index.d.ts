declare module "*.d.ts" {
  export interface Database {
    createTable(tableName: string, columns?: string[]): void;
    insert(tableName: string, record: {[key: string]: string}): void;
    update(tableName: string, query: {[key: string]: string}, newData: {[key: string]: string}): void;
    select(tableName: string, query?: {[key: string]: string}): Array<{[key: string]: string}>;
    delete(tableName: string, query?: {[key: string]: string}): void;
  }
}
