use anyhow::Result;
use include_dir::{include_dir, Dir};

static DATA_DIR: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/../data");

fn read_json(path: &str) -> Result<serde_json::Value> {
    let file = DATA_DIR.get_file(path).ok_or_else(|| anyhow::anyhow!("not found: {}", path))?;
    let contents = file.contents_utf8().ok_or_else(|| anyhow::anyhow!("invalid utf8: {}", path))?;
    Ok(serde_json::from_str(contents)?)
}

pub fn list_problems() -> Result<serde_json::Value> {
    read_json("problems/index.json")
}

pub fn get_problem(slug: &str) -> Result<serde_json::Value> {
    let safe = slug.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-');
    if !safe || slug.is_empty() {
        anyhow::bail!("invalid slug");
    }
    read_json(&format!("problems/{}.json", slug))
}
