use super::modal::{Offer, Task};
use chrono::{DateTime, Datelike, Duration, TimeZone, Timelike, Utc, Weekday};
use rand::Rng;
use rusqlite::{params, Connection};
use std::collections::HashMap;
use std::result;

pub struct Time {
    all_h: i32,
    data_materials: i64,
    date_complited: i64,
    data_w: i64,
    field1_end: i64,
    field2_end: i64,
    field3_end: i64,
}

fn generate_random_int() -> i32 {
    let mut rng = rand::rng();
    let random_number = rng.random_range(0..11);
    random_number
}

fn is_holiday(date: &DateTime<Utc>, holidays: &Vec<Offer>) -> bool {
    let d = date.day() as i32;
    let m = date.month() as i32;
    let y = date.year() as i32;

    for h in holidays {
        if h.day == d && h.month == m && h.year == y {
            return true;
        }
    }
    false
}

/// Рассчитывает все временные метки для задачи (дату начала, окончания этапов, завершения и закупки материалов).
fn get_time(
    date: i64,
    field1: i32,
    field2: i32,
    field3: i32,
    holidays: &Vec<Offer>,
    existing_tasks: &Vec<Task>,
) -> Time {
    // Преобразуем входящий timestamp (в мс) в DateTime<Utc>
    let usage1 = calculate_daily_usage(existing_tasks, 1, holidays);
    let usage2 = calculate_daily_usage(existing_tasks, 2, holidays);
    let usage3 = calculate_daily_usage(existing_tasks, 3, holidays);

    let mut current = Utc.timestamp_opt(date / 1000, 0).unwrap();

    let mut task_start_date = 0;

    // 1. ПОИСК ПЕРВОГО РАБОЧЕГО ДНЯ ПО УМОЛЧАНИЮ
    while current.weekday() == Weekday::Sat
        || current.weekday() == Weekday::Sun
        || is_holiday(&current, holidays)
    {
        current = current + Duration::days(1);
    }
    let data_w = current.timestamp();

    // 2. РАСЧЕТ ОКОНЧАНИЯ ЭТАПОВ (Field 1, 2, 3) С УЧЕТОМ ЗАГРУЗКИ
    let mut f1_end = data_w;
    if field1 > 0 {
        let (s, e) = find_slot(&usage1, current, field1, holidays);
        task_start_date = s;
        let mut next = Utc.timestamp_opt(e, 0).unwrap() + Duration::days(1);
        while next.weekday() == Weekday::Sat
            || next.weekday() == Weekday::Sun
            || is_holiday(&next, holidays)
        {
            next = next + Duration::days(1);
        }
        f1_end = next.timestamp();
        current = next;
    }

    let mut f2_end = f1_end;
    if field2 > 0 {
        let (s, e) = find_slot(&usage2, current, field2, holidays);
        if task_start_date == 0 {
            task_start_date = s;
        }
        let mut next = Utc.timestamp_opt(e, 0).unwrap() + Duration::days(1);
        while next.weekday() == Weekday::Sat
            || next.weekday() == Weekday::Sun
            || is_holiday(&next, holidays)
        {
            next = next + Duration::days(1);
        }
        f2_end = next.timestamp();
        current = next;
    }

    let mut f3_end = f2_end;
    if field3 > 0 {
        let (s, e) = find_slot(&usage3, current, field3, holidays);
        if task_start_date == 0 {
            task_start_date = s;
        }
        let mut next = Utc.timestamp_opt(e, 0).unwrap() + Duration::days(1);
        while next.weekday() == Weekday::Sat
            || next.weekday() == Weekday::Sun
            || is_holiday(&next, holidays)
        {
            next = next + Duration::days(1);
        }
        f3_end = next.timestamp();
        current = next;
    }

    let final_data_w = if task_start_date != 0 {
        task_start_date
    } else {
        data_w
    };

    // 3. РАСЧЕТ ДАТЫ ПОСТАВКИ МАТЕРИАЛОВ (data_materials)
    let mut data_materials = Utc.timestamp_opt(final_data_w, 0).unwrap();
    let mut back_count = 0i32;
    while back_count < 2 {
        data_materials = data_materials - Duration::days(1);
        if data_materials.weekday() != Weekday::Sat
            && data_materials.weekday() != Weekday::Sun
            && !is_holiday(&data_materials, holidays)
        {
            back_count += 1;
        }
    }

    let all_h = field1 + field2 + field3;
    Time {
        all_h,
        data_materials: data_materials.timestamp(),
        date_complited: (current - Duration::days(1)).timestamp(),
        data_w: final_data_w,
        field1_end: f1_end,
        field2_end: f2_end,
        field3_end: f3_end,
    }
}

pub fn get_task(conn: &Connection) -> Result<Vec<Task>, rusqlite::Error> {
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
            field1_end: row.get(8)?,
            field2_end: row.get(9)?,
            field3_end: row.get(10)?,
            all_hour: row.get(11)?,
            is_comlited: row.get(12)?,
            collor: row.get(13)?,
        })
    })?;

    let mut tasks = tasks_iter.collect::<Result<Vec<Task>, rusqlite::Error>>()?;

    let now_ts = Utc::now().timestamp();
    for t in tasks.iter_mut() {
        if t.is_comlited == 0 && t.date_complited > 0 && t.date_complited <= now_ts {
            conn.execute(
                "UPDATE task SET is_comlited = 1 WHERE id = ?1",
                params![t.id],
            )?;
            t.is_comlited = 1;
        }
    }

    Ok(tasks)
}

pub fn create_task(
    conn: &Connection,
    name: String,
    date: i64,
    field1: i32,
    field2: i32,
    field3: i32,
) -> Result<Task, rusqlite::Error> {
    // Fetch offers (holidays)
    let offers = get_offer(conn)?;
    let tasks = get_task(conn)?;
    let time = get_time(date, field1, field2, field3, &offers, &tasks);

    let collor = generate_random_int();
    let mut stmt = conn
        .prepare(
            "INSERT INTO task (
        name,
        date_materials,
        date_working,
        date_complited,
        field1,
        field2,  
        field3,
        field1_end,
        field2_end,  
        field3_end,
        all_hour,
        is_comlited,
        collor
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8,?9,?10,?11,?12,?13)",
        )
        .unwrap();
    stmt.execute(params![
        name,
        time.data_materials,
        time.data_w,
        time.date_complited,
        field1,
        field2,
        field3,
        time.field1_end,
        time.field2_end,
        time.field3_end,
        time.all_h,
        0,
        collor
    ])
    .unwrap();

    let answer = Task {
        id: conn.last_insert_rowid() as i32,
        name: name,
        date_materials: time.data_materials,
        date_working: time.data_w,
        date_complited: time.date_complited,
        field1: field1,
        field2: field2,
        field3: field3,
        field1_end: time.field1_end,
        field2_end: time.field2_end,
        field3_end: time.field3_end,
        all_hour: time.all_h,
        is_comlited: 0,
        collor: collor,
    };
    Ok(answer)
}

pub fn update_task(
    conn: &Connection,
    id: i32,
    name: String,
    date: i64,
    field1: i32,
    field2: i32,
    field3: i32,

    is_comlited: i8,
) -> Result<Task, rusqlite::Error> {
    // Fetch offers (holidays)
    let offers = get_offer(conn)?;
    let all_tasks = get_task(conn)?;
    let existing_tasks: Vec<Task> = all_tasks.iter().filter(|t| t.id != id).cloned().collect();
    let time = get_time(date, field1, field2, field3, &offers, &existing_tasks);

    let mut stmt = conn
        .prepare(
            "UPDATE task SET
        name = ?2,
        date_materials = ?3,
        date_working = ?4,
        date_complited = ?5,
        field1 = ?6,
        field2 = ?7,
        field3 = ?8,
        field1_end = ?9,
        field2_end = ?10,
        field3_end = ?11,
        all_hour = ?12,
        is_comlited = ?13
        WHERE id = ?1",
        )
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
        time.field1_end,
        time.field2_end,
        time.field3_end,
        time.all_h,
        is_comlited,
    ])
    .unwrap();

    let current_color = all_tasks
        .iter()
        .find(|t| t.id == id)
        .map(|t| t.collor)
        .unwrap_or(0);
    let answer = Task {
        id: id,
        name: name,
        date_materials: time.data_materials,
        date_working: time.data_w,
        date_complited: time.date_complited,
        field1: field1,
        field2: field2,
        field3: field3,
        field1_end: time.field1_end,
        field2_end: time.field2_end,
        field3_end: time.field3_end,
        all_hour: time.all_h,
        is_comlited: is_comlited,
        collor: current_color,
    };
    Ok(answer)
}

pub fn delete_task(conn: &Connection, id: i32) -> Result<i32, rusqlite::Error> {
    conn.execute("DELETE FROM task WHERE id = ?1", params![id])?;
    Ok(id)
}

pub fn create_offer(
    conn: &Connection,
    day: i32,
    month: i32,
    year: i32,
) -> Result<Offer, rusqlite::Error> {
    let mut stmt = conn
        .prepare("INSERT OR IGNORE INTO Offer (day, month, year) VALUES (?1, ?2, ?3)")
        .unwrap();
    stmt.execute(params![day, month, year]).unwrap();

    let answer = Offer {
        id: conn.last_insert_rowid() as i32,
        day: day,
        month: month,
        year: year,
    };
    Ok(answer)
}

pub fn get_offer(conn: &Connection) -> Result<Vec<Offer>, rusqlite::Error> {
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

pub fn delete_aii_offer(conn: &Connection) -> result::Result<usize, rusqlite::Error> {
    let answer = conn.execute("DELETE FROM Offer", params![]).unwrap();
    Ok(answer)
}

pub fn delete_offer(conn: &Connection, id: i32) -> result::Result<usize, rusqlite::Error> {
    let answer = conn
        .execute("DELETE FROM Offer WHERE id = ?1;", params![id])
        .unwrap();
    Ok(answer)
}

pub fn update_check(conn: &Connection, id: i32, is_comlited: bool) -> Result<i32, rusqlite::Error> {
    let mut stmt = conn
        .prepare("UPDATE task SET is_comlited = ?2 WHERE id = ?1")
        .unwrap();
    stmt.execute(params![id, is_comlited,]).unwrap();

    Ok(id)
}

fn calculate_daily_usage(
    tasks: &Vec<Task>,
    field_idx: i32,
    holidays: &Vec<Offer>,
) -> HashMap<i64, i32> {
    let mut usage = HashMap::new();

    // Создаем копию для сортировки
    let mut sorted_tasks = tasks.clone();
    sorted_tasks.sort_by(|a, b| {
        let get_start = |t: &Task| {
            if field_idx == 1 {
                t.date_working
            } else if field_idx == 2 {
                if t.field1 > 0 {
                    t.field1_end
                } else {
                    t.date_working
                }
            } else if field_idx == 3 {
                if t.field2 > 0 {
                    t.field2_end
                } else if t.field1 > 0 {
                    t.field1_end
                } else {
                    t.date_working
                }
            } else {
                t.date_working
            }
        };
        let start_a = get_start(a);
        let start_b = get_start(b);
        if start_a != start_b {
            start_a.cmp(&start_b)
        } else {
            a.id.cmp(&b.id)
        }
    });

    for task in sorted_tasks {
        if task.is_comlited == 1 {
            continue;
        }

        // Determine start and hours for the specific field
        let (start_date, hours) = match field_idx {
            1 => (task.date_working, task.field1),
            2 => {
                let s = if task.field1 > 0 {
                    task.field1_end
                } else {
                    task.date_working
                };
                (s, task.field2)
            }
            3 => {
                let s2 = if task.field1 > 0 {
                    task.field1_end
                } else {
                    task.date_working
                };
                let s3 = if task.field2 > 0 { task.field2_end } else { s2 };
                (s3, task.field3)
            }
            _ => (0, 0),
        };

        if hours <= 0 {
            continue;
        }

        let mut current = Utc.timestamp_opt(start_date, 0).unwrap();
        // Skip initial non-working days
        while current.weekday() == Weekday::Sat
            || current.weekday() == Weekday::Sun
            || is_holiday(&current, holidays)
        {
            current = current + Duration::days(1);
        }

        let mut hours_remaining = hours;
        while hours_remaining > 0 {
            let ts = current.timestamp();
            let used = *usage.get(&ts).unwrap_or(&0);
            let available = 8 - used;

            if available > 0 {
                let take = std::cmp::min(hours_remaining, available);
                *usage.entry(ts).or_insert(0) += take;
                hours_remaining -= take;
            }

            if hours_remaining > 0 {
                loop {
                    current = current + Duration::days(1);
                    if current.weekday() != Weekday::Sat
                        && current.weekday() != Weekday::Sun
                        && !is_holiday(&current, holidays)
                    {
                        break;
                    }
                }
            }
        }
    }
    usage
}

fn find_slot(
    usage: &HashMap<i64, i32>,
    start_search_date: DateTime<Utc>,
    duration_hours: i32,
    holidays: &Vec<Offer>,
) -> (i64, i64) {
    let mut current = start_search_date;

    // Always fast-forward to first working day first
    loop {
        if current.weekday() != Weekday::Sat
            && current.weekday() != Weekday::Sun
            && !is_holiday(&current, holidays)
        {
            break;
        }
        current = current + Duration::days(1);
    }

    if duration_hours <= 0 {
        // If 0 duration, start/end is the first available working day (conceptual checkpoint)
        let s = current.timestamp();
        return (s, s);
    }

    let mut hours_remaining = duration_hours;
    let mut start_ts = 0;
    let mut first_day_found = false;

    loop {
        // Double check working day (loop above handles start, but this handles incremental days)
        while current.weekday() == Weekday::Sat
            || current.weekday() == Weekday::Sun
            || is_holiday(&current, holidays)
        {
            current = current + Duration::days(1);
        }

        let ts = current.timestamp();
        let used = *usage.get(&ts).unwrap_or(&0);
        let cap = 8 - used;

        if cap > 0 {
            if !first_day_found {
                start_ts = ts;
                first_day_found = true;
            }

            let take = std::cmp::min(hours_remaining, cap);
            hours_remaining -= take;
        }

        if hours_remaining <= 0 {
            return (start_ts, ts);
        }

        current = current + Duration::days(1);

        // Safety break
        if (current - start_search_date).num_days() > 730 {
            let ts = start_search_date.timestamp();
            return (ts, ts);
        }
    }
}

pub fn find_available_start_date(
    conn: &Connection,
    field1: i32,
    field2: i32,
    field3: i32,
) -> Result<i64, rusqlite::Error> {
    let tasks = get_task(conn)?;
    let holidays = get_offer(conn)?;

    // Build usage maps for each field
    let usage1 = calculate_daily_usage(&tasks, 1, &holidays);
    let usage2 = calculate_daily_usage(&tasks, 2, &holidays);
    let usage3 = calculate_daily_usage(&tasks, 3, &holidays);

    // Start searching from today (midnight)
    let mut start_from = Utc::now()
        .with_hour(0)
        .unwrap()
        .with_minute(0)
        .unwrap()
        .with_second(0)
        .unwrap()
        .with_nanosecond(0)
        .unwrap();

    // Keep track of the start date of the first non‑zero field
    let mut task_start_date: i64 = 0;

    // Helper to process a field
    macro_rules! process_field {
        ($usage:expr, $hours:expr) => {{
            if $hours > 0 {
                let (start, end) = find_slot(&$usage, start_from, $hours, &holidays);
                if task_start_date == 0 {
                    task_start_date = start;
                }
                // Chain the next field to start after this field ends (ensure next day)
                start_from = Utc.timestamp_opt(end, 0).unwrap() + Duration::days(1);
            }
        }};
    }

    // Field 1
    process_field!(usage1, field1);
    // Field 2
    process_field!(usage2, field2);
    // Field 3
    process_field!(usage3, field3);

    // If all fields are zero, return today
    if task_start_date == 0 {
        task_start_date = start_from.timestamp();
    }

    Ok(task_start_date)
}
