interface Table {
  columns: string[];
  records: {
    [key: string]: string;
  }[];
}
declare class Database {
  tables: {
    [key: string]: Table;
  };
  filePath: string;
  password: string;
  constructor(filePath: string, password: string);
  createTable(tableName: string, columns?: string[]): void;
  deleteTable(tableName: string): void;
  insert(
    tableName: string,
    record: {
      [key: string]: string;
    }
  ): void;
  update(
    tableName: string,
    query: {
      [key: string]: string;
    },
    newData: {
      [key: string]: string;
    }
  ): void;
  select(
    tableName: string,
    query?: {
      [key: string]: string;
    }
  ): {
    [key: string]: string;
  }[];
  delete(
    tableName: string,
    query?: {
      [key: string]: string;
    }
  ): void;
  private saveToFile;
  private readFromFile;
}
export default Database;
