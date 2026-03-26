use serde::{Deserialize, Serialize};
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: i32,
    pub name: String,
    pub date_materials: i64,
    pub date_working: i64,
    pub date_complited: i64,
    pub field1: i32,
    pub field2: i32,
    pub field3: i32,
    pub field1_end: i64,
    pub field2_end: i64,
    pub field3_end: i64,
    pub all_hour: i32,
    pub is_comlited: i8,
    pub collor: i32,
    pub date_materials1: i64,
    pub date_materials2: i64,
    pub date_materials3: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Offer {
    pub id: i32,
    pub day: i32,
    pub month: i32,
    pub year: i32,
}
