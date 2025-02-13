import sqlite3 from "sqlite3";
import fs from "fs";
import config_log from "../config_log.js";

process.on('SIGINT', close_database);
process.on('SIGTERM', close_database);

const logger = config_log.logger;
const dbFile = './meta/eyedeea_photos.db';
export let meta_db = null;


export async function meta_init(callback) {
    const dbExists = fs.existsSync(dbFile);
    meta_db = new sqlite3.Database(dbFile,
        sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
        (err) => {
            if (err) {
                logger.error('Error opening database:', err.message);
                process.exit(1);
            }
            logger.info(`Connected to database: ${dbFile}`);
            if (!dbExists)
                create_tables();
            callback(!dbExists);    //true = newly created
        });
}

function close_database() {
    logger.info('Closing database...');
    meta_db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            logger.info('Database closed successfully.');
        }
        process.exit(0);
    });
}

function create_tables() {
    const createTableQueries = [
        `CREATE TABLE user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            param TEXT,
            param_name TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );`,

        `CREATE TABLE source (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
			url TEXT NOT NULL,
			user TEXT,
			password TEXT,
            config TEXT,
            cache TEXT,            
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT
            );`,

        `CREATE TABLE photo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            photo_id INT UNIQUE NOT NULL,
            filename TEXT NOT NULL, 
            folder_id INT NOT NULL,
            folder_name TEXT,
            time INT,
            type TEXT,
            orientation INT, 
            cache_key TEXT,
            unit_id INT,
            geocoding_id INT,
            tags TEXT,
            address TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );`,

        `CREATE TABLE scan_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            root_folder_id INT,
            root_folder_name TEXT,
            info TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT
            );`,

        `CREATE TABLE scan_log_detail (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            folder_id INT NOT NULL,
            folder_name TEXT NOT NULL,
            info TEXT,
            re_scanned bool default false,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT,
			scan_log_id INT,
			FOREIGN KEY(scan_log_id) REFERENCES scan_log(id)
            );`,

        `CREATE TABLE view_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            photo_id INT NOT NULL UNIQUE,
            count INT NOT NULL DEFAULT 1,
            status INT DEFAULT 0 NOT NULL,
            current BOOL DEFAULT 0,
            view_filter_id INT,
            update_sequence INT default 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT,            
			FOREIGN KEY(view_filter_id) REFERENCES view_filter(id)
            );`,

        `CREATE VIRTUAL TABLE fts 
            USING FTS5(photo_id,folder_name,tags,address);`,

        `CREATE TABLE view_filter (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
            filter_must TEXT NOT NULL,
			filter_option TEXT,
			current BOOL DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );`,

        `CREATE TABLE tag (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
            syno_id INTEGER UNIQUE NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT
            );`
    ];

    createTableQueries.forEach((query) => {
        meta_db.run(query, (err) => {
            if (err) {
                logger.error(err.message);
            } else {
                logger.info('Table created successfully.');
            }
        });
    });
}


export function get_rows(query, callback) {

    meta_db.all(query, (err, rows) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, rows);
        }
    });
}

