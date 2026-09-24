mod ai;
mod harness;
mod java_runner;
mod problems;
mod types;

#[tauri::command]
async fn list_problems() -> Result<serde_json::Value, String> {
    problems::list_problems().map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_problem(slug: String) -> Result<serde_json::Value, String> {
    problems::get_problem(&slug).map_err(|e| e.to_string())
}

#[tauri::command]
async fn run_java(
    slug: String,
    code: String,
    timeout_ms: Option<u64>,
) -> Result<serde_json::Value, String> {
    java_runner::run_java(&slug, &code, timeout_ms).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn ai_chat(
    api_base: String,
    api_key: String,
    model: String,
    messages: Vec<serde_json::Value>,
) -> Result<serde_json::Value, String> {
    ai::chat(&api_base, &api_key, &model, &messages).await.map_err(|e| e.to_string())
}

#[tauri::command]
fn app_version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_problems,
            get_problem,
            run_java,
            ai_chat,
            app_version,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
