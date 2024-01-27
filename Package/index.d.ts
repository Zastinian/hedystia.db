declare const createDatabase: (filePath: string, password: string) => {
    createTable: (tableName: string, columns: string[]) => void;
    deleteTable: (tableName: string) => void;
    insert: (tableName: string, record: {
        [key: string]: string;
    }) => void;
    update: (tableName: string, query: {
        [key: string]: string;
    }, newData: {
        [key: string]: string;
    }) => void;
    select: (tableName: string, query: {
        [key: string]: string;
    }) => {
        [key: string]: string;
    }[];
    delete: (tableName: string, query: {
        [key: string]: string;
    }) => void;
};
export default createDatabase;
