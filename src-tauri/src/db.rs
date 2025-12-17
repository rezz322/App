pub mod modal;
pub mod servise;

pub fn init() -> rusqlite::Connection {
    let conn = rusqlite::Connection::open("../db.sqlite").unwrap();
    conn.execute(
        "
            CREATE TABLE IF NOT EXISTS task (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            date_materials INTEGER NOT NULL,
            date_working INTEGER NOT NULL,
            date_complited INTEGER NOT NULL,
            field1 INTEGER NOT NULL,
            field2 INTEGER NOT NULL,
            field3 INTEGER NOT NULL,
            field1_end INTEGER NOT NULL,
            field2_end INTEGER NOT NULL,
            field3_end INTEGER NOT NULL,
            all_hour INTEGER NOT NULL,
            is_comlited INTEGER,
            collor INTEGER NOT NULL
        )",
        [],
    ).unwrap();

    conn.execute(
                "
            CREATE TABLE IF NOT EXISTS Offer (
            id INTEGER PRIMARY KEY,
            day INTEGER NOT NULL,
            month INTEGER NOT NULL,
            year INTEGER NOT NULL
        )",
        [],
    ).unwrap();

    conn
}

