
mod commands;
mod db;

use rusqlite::Connection;
use std::sync::Mutex;

struct AppState {
    conn: Mutex<Connection>,
}

impl AppState {
    fn new() -> Self {
        Self {
            conn: Mutex::new(db::init()),
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::new())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::create_task_command,
            commands::get_all_task_command,
            commands::update_task_command,
            commands::delete_task_command,
            commands::create_offer_command,
            commands::get_all_offer_command,
            commands::delete_offer_command,
            ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
