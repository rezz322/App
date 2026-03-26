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

    // Migration 1: Fix decimal hours to minutes (multiplied by 60)
    // and ensure they are INTEGER values by rounding.
    // SQLite allows storing REAL in INTEGER columns, but rusqlite is strict.
    conn.execute(
        "UPDATE task SET 
            field1 = ROUND(field1 * 60), 
            field2 = ROUND(field2 * 60), 
            field3 = ROUND(field3 * 60), 
            all_hour = ROUND(all_hour * 60) 
         WHERE TYPEOF(field1) = 'real'",
        [],
    ).ok();

    // Migration 2: Add material dates for each section if they don't exist
    let cols = vec!["date_materials1", "date_materials2", "date_materials3"];
    for col in cols {
        conn.execute(
            &format!("ALTER TABLE task ADD COLUMN {} INTEGER DEFAULT 0", col),
            [],
        ).ok(); // ok() because if it already exists, this fails
    }

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

