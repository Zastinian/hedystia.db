declare class Database {
  constructor(file_path: string, password: string);
  createTable(table_name: string, columns: string[]): void;
  deleteTable(table_name: string): void;
  insert(table_name: string, record: Record<string, string>): void;
  update(table_name: string, query: Record<string, string>, new_data: Record<string, string>): void;
  select(table_name: string, query?: Record<string, string>): Record<string, string>[];
  delete(table_name: string, query: Record<string, string>): void;
}

declare function init(file_path: string, password: string): Database;

export default init;
