use crate::db::modal::{Offer, Task};
use crate::db::servise::{
    create_offer, create_task, delete_aii_offer, delete_offer, delete_task,
    find_available_start_date, get_offer, get_task, update_check, update_task,
};
use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
enum MessageType {
    Erorr,
    Success,
    Info,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Message<T> {
    data: T,
    info: MessageType,
}

// Creates a new task in the database
#[tauri::command(rename_all = "snake_case")]
pub fn create_task_command(
    state: State<AppState>,
    name: String,
    date_working: i64,
    field1: i32,
    field2: i32,
    field3: i32,
) -> Message<Task> {
    let conn = state.conn.lock().unwrap();
    let tasks = create_task(&conn, name, date_working, field1, field2, field3).unwrap();

    return Message::<Task> {
        data: tasks,
        info: MessageType::Success,
    };
}

// Retrieves all tasks from the database
#[tauri::command]
pub fn get_all_task_command(state: State<AppState>) -> Message<Vec<Task>> {
    let conn = state.conn.lock().unwrap();
    let tasks = get_task(&conn).expect("Get");
    return Message::<Vec<Task>> {
        data: tasks,
        info: MessageType::Success,
    };
}

// Updates an existing task in the database
#[tauri::command(rename_all = "snake_case")]
pub fn update_task_command(
    state: State<AppState>,
    id: i32,
    name: String,
    date_working: i64,
    field1: i32,
    field2: i32,
    field3: i32,
    is_comlited: i8,
) -> Message<Task> {
    let conn = state.conn.lock().unwrap();
    match update_task(
        &conn,
        id,
        name,
        date_working,
        field1,
        field2,
        field3,
        is_comlited,
    ) {
        Ok(task) => Message {
            data: task,
            info: MessageType::Success,
        },
        Err(_e) => Message {
            data: Task {
                id: 0,
                name: String::new(),
                date_materials: 0,
                date_working: 0,
                date_complited: 0,
                field1: 0,
                field2: 0,
                field3: 0,
                field1_end: 0,
                field2_end: 0,
                field3_end: 0,
                all_hour: 0,
                is_comlited: 0,
                collor: 0,
            },
            info: MessageType::Erorr,
        },
    }
}

// Deletes a task from the database by its ID
#[tauri::command]
pub fn delete_task_command(state: State<AppState>, id: i32) -> Message<i32> {
    let conn = state.conn.lock().unwrap();
    let del_task = delete_task(&conn, id).unwrap();
    return Message::<i32> {
        data: del_task,
        info: MessageType::Success,
    };
}

// Creates a new custom weekend/offer in the database
#[tauri::command]
pub fn create_offer_command(
    state: State<AppState>,
    day: i32,
    month: i32,
    year: i32,
) -> Message<Offer> {
    let conn = state.conn.lock().unwrap();
    println!(
        "Create offer command called with day: {}, month: {}, year: {}",
        day, month, year
    );
    let offer = create_offer(&conn, day, month, year).unwrap();

    return Message::<Offer> {
        data: offer,
        info: MessageType::Success,
    };
}

// Updates the completion status of a task
#[tauri::command(rename_all = "snake_case")]
pub fn update_task_check_command(state: State<AppState>, id: i32, is_comlited: bool) -> i32 {
    let conn: std::sync::MutexGuard<'_, rusqlite::Connection> = state.conn.lock().unwrap();
    let data = update_check(&conn, id, is_comlited).unwrap();
    data
}

// Retrieves all custom weekends from the database
#[tauri::command]
pub fn get_all_offer_command(state: State<AppState>) -> Message<Vec<Offer>> {
    let conn = state.conn.lock().unwrap();
    let offers = get_offer(&conn).expect("Get");
    return Message::<Vec<Offer>> {
        data: offers,
        info: MessageType::Success,
    };
}

// Deletes all custom weekends from the database
#[tauri::command]
pub fn delete_all_offer_command(state: State<AppState>) -> Message<usize> {
    let conn = state.conn.lock().unwrap();
    let answer = delete_aii_offer(&conn).unwrap();
    return Message::<usize> {
        data: answer,
        info: MessageType::Success,
    };
}

// Deletes a custom weekend from the database by its ID
#[tauri::command]
pub fn delete_offer_command(state: State<AppState>, id: i32) -> Message<usize> {
    let conn = state.conn.lock().unwrap();
    let answer = delete_offer(&conn, id).unwrap();
    return Message::<usize> {
        data: answer,
        info: MessageType::Success,
    };
}

// Calculates the next available date for starting work based on current load
#[tauri::command]
pub fn get_next_available_date_command(
    state: State<AppState>,
    field1: i32,
    field2: i32,
    field3: i32,
) -> Message<i64> {
    let conn = state.conn.lock().unwrap();
    match find_available_start_date(&conn, field1, field2, field3) {
        Ok(date) => Message {
            data: date,
            info: MessageType::Success,
        },
        Err(_) => Message {
            data: 0,
            info: MessageType::Erorr,
        },
    }
}
