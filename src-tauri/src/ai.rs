use anyhow::Result;
use reqwest::Client;
use serde_json::{json, Value};

fn build_messages(body_messages: &[Value]) -> Vec<Value> {
    let mut msgs: Vec<Value> = vec![json!({
        "role": "system",
        "content": "你是一个 Java 算法助手。用户正在做力扣题，请用简洁、准确的中文回答；涉及代码时默认给 Java 实现。"
    })];
    for m in body_messages {
        if m.is_object() {
            msgs.push(m.clone());
        }
    }
    msgs
}

pub async fn chat(api_base: &str, api_key: &str, model: &str, messages: &[Value]) -> Result<Value> {
    let endpoint = api_base.trim();
    if endpoint.is_empty() || api_key.trim().is_empty() || model.trim().is_empty() {
        anyhow::bail!("apiBase, apiKey and model are required");
    }
    if !endpoint.starts_with("http://") && !endpoint.starts_with("https://") {
        anyhow::bail!("apiBase must be an http(s) URL");
    }

    let client = Client::new();
    let payload = json!({
        "model": model.trim(),
        "messages": build_messages(messages),
        "stream": false
    });

    let resp = client
        .post(endpoint)
        .header("content-type", "application/json")
        .header("authorization", format!("Bearer {}", api_key.trim()))
        .json(&payload)
        .send()
        .await?;

    let status = resp.status();
    if !status.is_success() {
        let body = resp.text().await.unwrap_or_default();
        let mut msg = format!("AI 接口返回 {}", status.as_u16());
        if let Ok(parsed) = serde_json::from_str::<Value>(&body) {
            if let Some(m) = parsed.pointer("/error/message").and_then(|v| v.as_str()) {
                msg = m.to_string();
            }
        }
        anyhow::bail!(msg);
    }

    let data: Value = resp.json().await?;
    let content = data
        .pointer("/choices/0/message/content")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    Ok(json!({ "content": content }))
}
