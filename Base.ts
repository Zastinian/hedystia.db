interface Table {
  columns: string[];
  records: {[key: string]: string}[];
}

class Base {
  tables: {[key: string]: Table};
  filePath: string;
  password: string;

  constructor(filePath: string, password: string) {
    this.tables = {};
    this.filePath = filePath || "./database.esmile";
    this.password = password;
  }
}

export default Base;
