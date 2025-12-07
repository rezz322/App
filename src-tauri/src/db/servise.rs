use std::result;
use rand::Rng;
use super::modal::{ Task, Offer};
use rusqlite::{params, Connection};
use chrono::{ Duration, TimeZone, Utc, Weekday, Datelike};


pub struct Time{
    all_h:i32,
    data_materials: i64,
    date_complited:i64,
    data_w:i64,

}

fn generate_random_int()-> i32 {

    let mut rng = rand::rng();
    let random_number= rng.random_range(0..11);
    random_number
}
fn get_time(date: i64, field1: i32, field2: i32, field3: i32) -> Time {
    // Convert client ms timestamp to DateTime<Utc> (DB stores seconds)
    let start_dt = Utc.timestamp_opt(date / 1000, 0).unwrap();

    // If start falls on weekend, move to next working day (Mon)
    let mut dt = start_dt;
    while dt.weekday() == Weekday::Sat || dt.weekday() == Weekday::Sun {
        dt = dt + Duration::days(1);
    }

    // Sequentially allocate working days for each dilytsia, skipping weekends
    let mut current = dt;
    let allocate_block = |hours: i32, cur: &mut chrono::DateTime<Utc>| -> Option<chrono::DateTime<Utc>> {
        if hours <= 0 { return None; }
        let mut needed: i64 = ((hours as i64) + 7) / 8; // ceil division
        if needed <= 0 { needed = 1; }
        let mut counted = 0i64;
        let last_day = loop {
            if cur.weekday() != Weekday::Sat && cur.weekday() != Weekday::Sun {
                counted += 1;
                let candidate = *cur;
                if counted >= needed {
                    *cur = candidate + Duration::days(1);
                    break candidate;
                }
            }
            *cur = *cur + Duration::days(1);
        };
        *cur = last_day + Duration::days(1);
        Some(last_day)
    };

    let mut last_allocated: Option<chrono::DateTime<Utc>> = None;
    if let Some(d) = allocate_block(field1, &mut current) { last_allocated = Some(d); }
    if let Some(d) = allocate_block(field2, &mut current) { last_allocated = Some(d); }
    if let Some(d) = allocate_block(field3, &mut current) { last_allocated = Some(d); }

    let data_end = last_allocated.unwrap_or(dt);

    // Materials date: 2 working days before the (adjusted) start
    let mut data_materials = dt;
    let mut back_count = 0i32;
    while back_count < 2 {
        data_materials = data_materials - Duration::days(1);
        if data_materials.weekday() != Weekday::Sat && data_materials.weekday() != Weekday::Sun {
            back_count += 1;
        }
    }

    let date_materials_ts = data_materials.timestamp();
    let date_end_ts = data_end.timestamp();
    let date_w_ts = dt.timestamp();

    let all_hours = field1 + field2 + field3;

    let time = Time {
        all_h: all_hours,
        data_materials: date_materials_ts,
        date_complited: date_end_ts,
        data_w: date_w_ts,
    };

    time
}


pub fn get_task(conn:&Connection) -> Result<Vec<Task>, rusqlite::Error> {
    let mut stmt = conn.prepare("SELECT * FROM task")?;
    let tasks_iter = stmt.query_map(params![], |row| {
            Ok(Task {
                id: row.get(0)?,
                name: row.get(1)?,
                date_materials: row.get(2)?,
                date_working: row.get(3)?,
                date_complited: row.get(4)?,
                field1: row.get(5)?,
                field2: row.get(6)?,
                field3: row.get(7)?,
                all_hour: row.get(8)?,
                is_comlited: row.get(9)?,
                collor: row.get(10)?,
            })
    })?;

    let mut tasks = tasks_iter.collect::<Result<Vec<Task>, rusqlite::Error>>()?;

    // Автоматически отмечаем завершёнными задачи, где дата готовности уже наступила
    let now_ts = Utc::now().timestamp();
    for t in tasks.iter_mut() {
        if t.is_comlited == 0 && t.date_complited > 0 && t.date_complited <= now_ts {
            // update DB
            conn.execute("UPDATE task SET is_comlited = 1 WHERE id = ?1", params![t.id])?;
            t.is_comlited = 1;
        }
    }

    Ok(tasks)
}

pub fn create_task(
    conn:&Connection,
    name:String,
    date: i64,
    field1: i32,
    field2: i32,
    field3: i32,
)-> Result<Task, rusqlite::Error> {

    let time = get_time(
        date,
        field1,
        field2,
        field3,
    );

    let collor= generate_random_int();
    let mut stmt = conn
        .prepare("INSERT INTO task (
        name,
        date_materials,
        date_working,
        date_complited,
        field1,
        field2,  
        field3,
        all_hour,
        is_comlited,
        collor
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8,?9,?10)")
        .unwrap();
        stmt.execute(params![
            name,
            time.data_materials,
            time.data_w,
            time.date_complited,
            field1,
            field2,
            field3,
            time.all_h,
            0,
            collor
            ]).unwrap();

    let answer = Task {
            id: conn.last_insert_rowid() as i32,
            name: name,
            date_materials: time.data_materials,
            date_working:time.data_w,
            date_complited: time.date_complited,
            field1: field1,
            field2: field2,  
            field3: field3,
            all_hour: time.all_h,
            is_comlited: 0,
            collor: collor,
    };
    Ok(
       answer
    )
}

pub fn update_task(
    conn:&Connection,
    id: i32,
    name:String,
    date: i64,
    field1: i32,
    field2: i32,
    field3: i32,
    is_comlited: i8,
)-> Result<Task, rusqlite::Error> {
    let time = get_time(
        date,
        field1,
        field2,
        field3,
    );

    let mut stmt = conn
        .prepare("UPDATE task SET
        name = ?2,
        date_materials = ?3,
        date_working = ?4,
        date_complited = ?5,
        field1 = ?6,
        field2 = ?7,
        field3 = ?8,
        all_hour = ?9,
        is_comlited = ?10
        WHERE id = ?1")
        .unwrap();
        stmt.execute(params![
            id,
            name,
            time.data_materials,
            time.data_w,
            time.date_complited,
            field1,
            field2,
            field3,
            time.all_h,
            is_comlited,
            ]).unwrap();

    let answer = Task {
            id: id,
            name: name,
            date_materials: time.data_materials,
            date_working:time.data_w,
            date_complited: time.date_complited,
            field1: field1 ,
            field2: field2,
            field3: field3,
            all_hour: time.all_h,
            is_comlited: is_comlited,
            collor: 0,
    };
    Ok(
       answer
    )
}



pub fn delete_task(
    conn:&Connection,
    id: i32,
)-> Result<i32, rusqlite::Error> {
    conn.execute("DELETE FROM task WHERE id = ?1", params![id])?;
    Ok(id)
}


pub fn create_offer(
    conn:&Connection,
    day:i32,
    month:i32,
    year:i32,
)-> Result<Offer, rusqlite::Error> {

    let mut stmt = conn
        .prepare("INSERT OR IGNORE INTO Offer (day, month, year) VALUES (?1, ?2, ?3)")
        .unwrap();
        stmt.execute(params![
            day,
            month,
            year
            ]).unwrap();

    let answer = Offer {
            id: conn.last_insert_rowid() as i32,
            day: day,
            month: month,
            year: year,
    };
    Ok(
       answer
    )
}


pub fn get_offer(conn:&Connection) -> Result<Vec<Offer>, rusqlite::Error> {
    let mut stmt = conn.prepare("SELECT * FROM Offer")?;
    let offer_iter = stmt.query_map(params![], |row| {
            Ok(Offer {
                id: row.get(0)?,
                day: row.get(1)?,
                month: row.get(2)?,
                year: row.get(3)?,
            })
    })?;

    let offers = offer_iter.collect::<Result<Vec<Offer>, rusqlite::Error>>()?;
    Ok(offers)
}

pub fn delete_offer (
    conn:&Connection,
) -> result::Result<usize, rusqlite::Error> {
    let answer = conn.execute("DELETE FROM Offer", params![]).unwrap();
    Ok(answer)
}