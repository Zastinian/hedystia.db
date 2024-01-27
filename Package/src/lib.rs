use std::{collections::HashMap, fs, sync::Mutex};
use std::error::Error;
use std::{io, str};
use std::io::ErrorKind;
use std::iter::repeat;
use crypto::aead::{AeadDecryptor, AeadEncryptor};
use crypto::aes_gcm::AesGcm;
use serde::{Serialize, Deserialize};
use neon::prelude::*;
use std::str::from_utf8;
use std::sync::Arc;

#[derive(Serialize, Deserialize)]
struct Table {
    columns: Vec<String>,
    records: Vec<std::collections::HashMap<String, String>>,
}

struct Database {
    tables: HashMap<String, Table>,
    file_path: String,
    password: String,
    queue: Vec<QueueItem>,
}

struct QueueItem {
    method: String,
    table: String,
    record: Option<std::collections::HashMap<String, String>>,
    query: Option<std::collections::HashMap<String, String>>,
    new_data: Option<std::collections::HashMap<String, String>>,
}

impl Database {
    fn new(file_path: String, password: String) -> Self {
        Database {
            tables: std::collections::HashMap::new(),
            file_path: file_path,
            password: password,
            queue: Vec::new(),
        }
    }

    fn create_table(&mut self, table_name: String, columns: Vec<String>) {
        self.read_from_file();
        if self.tables.contains_key(&table_name) {
            panic!("Table \"{}\" already exists.", table_name);
        }
        self.tables.insert(table_name, Table { columns: columns, records: Vec::new() });
        self.save_to_file();
    }

    fn delete_table(&mut self, table_name: String) {
        self.read_from_file();
        if !self.tables.contains_key(&table_name) {
            panic!("Table \"{}\" does not exist.", table_name);
        }
        self.tables.remove(&table_name);
        self.save_to_file();
    }

    fn insert(&mut self, table_name: String, record: std::collections::HashMap<String, String>) {
        self.queue.push(QueueItem { method: "insert".to_string(), table: table_name, record: Some(record), query: None, new_data: None });
        if self.queue.len() == 1 {
            self.process_queue();
        }
    }

    fn update(&mut self, table_name: String, query: std::collections::HashMap<String, String>, new_data: std::collections::HashMap<String, String>) {
        self.queue.push(QueueItem { method: "update".to_string(), table: table_name, record: None, query: Some(query), new_data: Some(new_data) });
        if self.queue.len() == 1 {
            self.process_queue();
        }
    }

    fn select(&mut self, table_name: String, query: Option<std::collections::HashMap<String, String>>) -> Vec<std::collections::HashMap<String, String>> {
        self.read_from_file();
        if !self.tables.contains_key(&table_name) {
            panic!("Table \"{}\" does not exist.", table_name);
        }
        let table = &self.tables[&table_name];
        if let Some(query_map) = query {
            table.records.iter()
                .filter(|record| query_map.iter().all(|(column, value)| record[column] == *value))
                .cloned()
                .collect()
        } else {
            table.records.clone()
        }
    }

    fn delete(&mut self, table_name: String, query: std::collections::HashMap<String, String>) {
        self.queue.push(QueueItem { method: "delete".to_string(), table: table_name, record: None, query: Some(query), new_data: None });
        if self.queue.len() == 1 {
            self.process_queue();
        }
    }

    fn process_queue(&mut self) {
        if let Some(request) = self.queue.pop() {
            match &request.method[..] {
                "insert" => self.insert_table(&request.table, request.record.as_ref().unwrap()),
                "update" => self.update_table(&request.table, request.query.as_ref().unwrap(), request.new_data.as_ref().unwrap()),
                "delete" => self.delete_from_table(&request.table, request.query.as_ref().unwrap()),
                _ => panic!("Invalid method: {}", request.method),
            }
        }
    }

    fn insert_table(&mut self, table_name: &String, record: &std::collections::HashMap<String, String>) {
        self.read_from_file();
        if !self.tables.contains_key(table_name) {
            panic!("Table \"{}\" does not exist.", table_name);
        }
        let table = self.tables.get_mut(table_name).unwrap();
        let formatted_record: std::collections::HashMap<String, String> = table.columns.iter().map(|column| (column.clone(), record.get(column).cloned().unwrap_or_default())).collect();
        table.records.push(formatted_record);
        self.save_to_file();
        if !self.queue.is_empty() {
            self.queue.remove(0);
            self.process_queue();
        }
    }

    fn update_table(&mut self, table_name: &String, query: &std::collections::HashMap<String, String>, new_data: &std::collections::HashMap<String, String>) {
        self.read_from_file();
        if !self.tables.contains_key(table_name) {
            panic!("Table \"{}\" does not exist.", table_name);
        }
        let table = self.tables.get_mut(table_name).unwrap();
        table.records = table.records.iter().map(|record| {
            if query.iter().all(|(column, value)| record[column] == *value) {
                let updated_record: HashMap<String, String> = record
                    .iter()
                    .map(|(k, v)| (k.clone(), v.clone()))
                    .chain(new_data.iter().map(|(k, v)| (k.clone(), v.clone())))
                    .collect();
                updated_record
            } else {
                record.clone()
            }
        }).collect();
        self.save_to_file();
        if !self.queue.is_empty() {
            self.queue.remove(0);
            self.process_queue();
        }
    }

    fn delete_from_table(&mut self, table_name: &String, query: &std::collections::HashMap<String, String>) {
        self.read_from_file();
        if !self.tables.contains_key(table_name) {
            panic!("Table \"{}\" does not exist.", table_name);
        }
        let table = self.tables.get_mut(table_name).unwrap();
        table.records.retain(|record| !query.iter().all(|(column, value)| record[column] == *value));
        self.save_to_file();
        if !self.queue.is_empty() {
            self.queue.remove(0);
            self.process_queue();
        }
    }

    fn save_to_file(&self) {
        if !self.file_path.ends_with(".ht") {
            panic!("File path must include '.ht': {}", self.file_path);
        }
        let data = serde_json::to_string(&self.tables).unwrap();
        let res = encrypt(data.as_bytes(),  &self.password);
        fs::write(&self.file_path, res).unwrap();
    }

    fn read_from_file(&mut self) {
        if !fs::metadata(&self.file_path).is_ok() {
            return;
        }
        let encrypted = fs::read_to_string(&self.file_path).unwrap();
        let data = decrypt(encrypted.as_str(), &self.password).unwrap();
        let data_str = from_utf8(&data).unwrap();
        match serde_json::from_str::<HashMap<String, Table>>(&data_str) {
            Ok(tables) => self.tables = tables,
            Err(err) => {
                eprintln!("Error during deserialization: {:?}", err);
                self.tables = HashMap::new();
            }
        }
    }
}

fn split_iv_data_mac(orig: &str) -> Result<(Vec<u8>, Vec<u8>, Vec<u8>), Box<dyn Error>> {
    let split: Vec<&str> = orig.split('/').into_iter().collect();

    if split.len() != 3 {
        return Err(Box::new(io::Error::from(ErrorKind::Other)));
    }
    let iv_res = hex::decode(split[0]);
    if iv_res.is_err() {
        return Err(Box::new(io::Error::from(ErrorKind::Other)));
    }
    let iv = iv_res.unwrap();

    let data_res = hex::decode(split[1]);
    if data_res.is_err() {
        return Err(Box::new(io::Error::from(ErrorKind::Other)));
    }
    let data = data_res.unwrap();

    let mac_res = hex::decode(split[2]);
    if mac_res.is_err() {
        return Err(Box::new(io::Error::from(ErrorKind::Other)));
    }
    let mac = mac_res.unwrap();

    Ok((iv, data, mac))
}

fn get_valid_key(key: &str) -> Vec<u8> {
    let mut bytes = key.as_bytes().to_vec();
    if bytes.len() < 16 {
        for _j in 0..(16 - bytes.len()) {
            bytes.push(0x00);
        }
    } else if bytes.len() > 16 {
        bytes = bytes[0..16].to_vec();
    }

    bytes
}

pub fn decrypt(iv_data_mac: &str, key: &str) -> Result<Vec<u8>, Box<dyn Error>> {
    let (iv, data, mac) = split_iv_data_mac(iv_data_mac)?;
    let key = get_valid_key(key);

    let key_size = crypto::aes::KeySize::KeySize128;
    let mut decipher = AesGcm::new(key_size, &key, &iv, &[]);
    let mut dst: Vec<u8> = repeat(0).take(data.len()).collect();
    let result = decipher.decrypt(&data, &mut dst, &mac);

    if result { }

    Ok(dst)
}

fn get_iv(size: usize) -> Vec<u8> {
    let mut iv = vec![];
    for _j in 0..size {
        let r = rand::random();
        iv.push(r);
    }

    iv
}

pub fn encrypt(data: &[u8], password: &str) -> String {
    let key_size = crypto::aes::KeySize::KeySize128;

    let valid_key = get_valid_key(password);
    let iv = get_iv(12);
    let mut cipher = AesGcm::new(key_size, &valid_key, &iv, &[]);

    let mut encrypted: Vec<u8> = repeat(0).take(data.len()).collect();

    let mut mac: Vec<u8> = repeat(0).take(16).collect();

    cipher.encrypt(data, &mut encrypted, &mut mac[..]);

    let hex_iv = hex::encode(iv);
    let hex_cipher = hex::encode(encrypted);
    let hex_mac = hex::encode(mac);
    let output = format!("{}/{}/{}", hex_iv, hex_cipher, hex_mac);

    output
}


fn create_table(mut cx: FunctionContext, database: Arc<Mutex<Database>>) -> JsResult<JsUndefined> {
    let table_name = cx.argument::<JsString>(0)?.value(&mut cx);
    let columns = cx.argument::<JsArray>(1)?.to_vec(&mut cx)?.into_iter().map(|val| val.downcast::<JsString, _>(&mut cx).unwrap().value(&mut cx)).collect();
    let mut db = database.lock().unwrap();
    db.create_table(table_name, columns);
    Ok(cx.undefined())
}

fn delete_table(mut cx: FunctionContext, database: Arc<Mutex<Database>>) -> JsResult<JsUndefined> {
    let table_name = cx.argument::<JsString>(0)?.value(&mut cx);
    let mut db = database.lock().unwrap();
    db.delete_table(table_name);
    Ok(cx.undefined())
}

fn insert(mut cx: FunctionContext, database: Arc<Mutex<Database>>) -> JsResult<JsUndefined> {
    let table_name = cx.argument::<JsString>(0)?.value(&mut cx);
    let record_obj = cx.argument::<JsObject>(1)?;
    let mut record: std::collections::HashMap<String, String> = HashMap::new();
    let keys = record_obj.get_own_property_names(&mut cx)?.to_vec(&mut cx)?;
    for key in keys {
        let key_str = key.to_string(&mut cx)?.value(&mut cx);
        let value = record_obj.get::<JsString, _, _>(&mut cx, key)?.downcast::<JsString, _>(&mut cx);
        if let Ok(value) = value {
            let value_str = value.value(&mut cx);
            record.insert(key_str, value_str);
        }
    }
    let mut db = database.lock().unwrap();
    db.insert(table_name, record);
    Ok(cx.undefined())
}



fn update(mut cx: FunctionContext, database: Arc<Mutex<Database>>) -> JsResult<JsUndefined> {
    let table_name = cx.argument::<JsString>(0)?.value(&mut cx);
    let query_obj = cx.argument::<JsObject>(1)?;
    let mut query: std::collections::HashMap<String, String> = HashMap::new();
    let keys = query_obj.get_own_property_names(&mut cx)?.to_vec(&mut cx)?;
    for key in keys {
        let key_str = key.to_string(&mut cx)?.value(&mut cx);
        let value = query_obj.get::<JsString, _, _>(&mut cx, key)?.downcast::<JsString, _>(&mut cx);
        if let Ok(value) = value {
            let value_str = value.value(&mut cx);
            query.insert(key_str, value_str);
        }
    }

    let new_data_obj = cx.argument::<JsObject>(2)?;
    let mut new_data: std::collections::HashMap<String, String> = HashMap::new();
    let keys = new_data_obj.get_own_property_names(&mut cx)?.to_vec(&mut cx)?;
    for key in keys {
        let key_str = key.to_string(&mut cx)?.value(&mut cx);
        let value = new_data_obj.get::<JsString, _, _>(&mut cx, key)?.downcast::<JsString, _>(&mut cx);
        if let Ok(value) = value {
            let value_str = value.value(&mut cx);
            new_data.insert(key_str, value_str);
        }
    }

    let mut db = database.lock().unwrap();
    db.update(table_name, query, new_data);
    Ok(cx.undefined())
}

fn select(mut cx: FunctionContext, database: Arc<Mutex<Database>>) -> JsResult<JsValue> {
    let table_name = cx.argument::<JsString>(0)?.value(&mut cx);
    let query_obj = cx.argument_opt(1);
    let mut query: Option<std::collections::HashMap<String, String>> = None;

    if let Some(query_obj) = query_obj {
        let query_obj = query_obj.downcast::<JsObject, _>(&mut cx);
        if let Ok(query_obj) = query_obj {
            let keys = query_obj.get_own_property_names(&mut cx)?.to_vec(&mut cx)?;
            let mut query_map = std::collections::HashMap::new();
            for key in keys {
                let key_str = key.to_string(&mut cx)?.value(&mut cx);
                let value = query_obj.get::<JsString, _, _>(&mut cx, key)?.downcast::<JsString, _>(&mut cx);
                if let Ok(value) = value {
                    let value_str = value.value(&mut cx);
                    query_map.insert(key_str, value_str);
                }
            }

            query = Some(query_map);
        }
    }

    let mut db = database.lock().unwrap();
    let result = db.select(table_name, query);
    let result = serde_json::to_string(&result).unwrap();
    Ok(cx.string(result).upcast())
}

fn delete(mut cx: FunctionContext, database: Arc<Mutex<Database>>) -> JsResult<JsUndefined> {
    let table_name = cx.argument::<JsString>(0)?.value(&mut cx);
    let query_obj = cx.argument::<JsObject>(1)?;
    let mut query: std::collections::HashMap<String, String> = HashMap::new();
    let keys = query_obj.get_own_property_names(&mut cx)?.to_vec(&mut cx)?;
    for key in keys {
        let key_str = key.to_string(&mut cx)?.value(&mut cx);
        let value = query_obj.get::<JsString, _, _>(&mut cx, key)?.downcast::<JsString, _>(&mut cx);
        if let Ok(value) = value {
            let value_str = value.value(&mut cx);
            query.insert(key_str, value_str);
        }
    }
    let mut db = database.lock().unwrap();
    db.delete(table_name, query);
    Ok(cx.undefined())
}

fn init(mut cx: FunctionContext) -> JsResult<JsObject> {
    let exports = JsObject::new(&mut cx);
    let file_path = cx.argument::<JsString>(0)?.value(&mut cx);
    let password = cx.argument::<JsString>(1)?.value(&mut cx);
    let database = Arc::new(Mutex::new(Database::new(file_path, password)));
    let db = Arc::clone(&database);
    let db2 = Arc::clone(&database);
    let db3 = Arc::clone(&database);
    let db4 = Arc::clone(&database);
    let db5 = Arc::clone(&database);
    let db6 = Arc::clone(&database);
    let create_table_function = JsFunction::new(&mut cx, move|cx | {
        create_table(cx, Arc::clone(&db))
    });
    let delete_table_function = JsFunction::new(&mut cx, move|cx | {
        delete_table(cx, Arc::clone(&db2))
    });
    let insert_function = JsFunction::new(&mut cx, move|cx | {
        insert(cx, Arc::clone(&db3))
    });
    let update_function = JsFunction::new(&mut cx, move|cx | {
        update(cx, Arc::clone(&db4))
    });
    let select_function = JsFunction::new(&mut cx, move|cx| {
        select(cx, Arc::clone(&db5))
    });
    let delete_function = JsFunction::new(&mut cx, move|cx| {
        delete(cx, Arc::clone(&db6))
    });
    exports.set(&mut cx, "createTable", create_table_function?)?;
    exports.set(&mut cx, "deleteTable", delete_table_function?)?;
    exports.set(&mut cx, "insert", insert_function?)?;
    exports.set(&mut cx, "update", update_function?)?;
    exports.set(&mut cx, "select", select_function?)?;
    exports.set(&mut cx, "delete", delete_function?)?;
    Ok(exports)
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("init", init)?;
    Ok(())
}
