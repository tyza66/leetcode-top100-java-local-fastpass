use crate::harness;
use crate::problems;
use anyhow::Result;
use rand::Rng;
use std::fs;
use std::path::PathBuf;
use std::time::Instant;
use tokio::process::Command;

const COMPILE_TIMEOUT_SECS: u64 = 20;

#[derive(Debug, serde::Serialize)]
pub struct CaseResult {
    pub status: String,
    #[serde(rename = "caseId")]
    pub case_id: i64,
    pub detail: String,
}

fn parse_results(stdout: &str) -> (Vec<CaseResult>, i64, i64) {
    let mut results = Vec::new();
    let mut pass = 0i64;
    let mut total = 0i64;
    for line in stdout.lines() {
        if let Some(cap) = regex::Regex::new(r"^(PASS|FAIL|ERROR) CASE (\d+)(.*)$").unwrap().captures(line) {
            results.push(CaseResult {
                status: cap[1].to_string(),
                case_id: cap[2].parse().unwrap_or(0),
                detail: cap[3].trim().to_string(),
            });
        }
        if let Some(cap) = regex::Regex::new(r"RESULT (\d+)/(\d+)").unwrap().captures(line) {
            pass = cap[1].parse().unwrap_or(0);
            total = cap[2].parse().unwrap_or(0);
        }
    }
    if total == 0 { total = results.len() as i64; }
    (results, pass, total)
}

fn temp_dir() -> PathBuf {
    let mut p = std::env::temp_dir();
    let s: String = rand::thread_rng()
        .sample_iter(&rand::distributions::Alphanumeric)
        .take(10)
        .map(char::from)
        .collect();
    p.push(format!("leetcode-run-{}", s));
    p
}

async fn run_with_timeout(cmd: &mut Command, timeout_secs: u64) -> Result<(String, String, bool, u64)> {
    let start = Instant::now();
    let output = tokio::time::timeout(
        std::time::Duration::from_secs(timeout_secs),
        cmd.output(),
    ).await;
    let runtime_ms = start.elapsed().as_millis() as u64;
    match output {
        Ok(Ok(out)) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            let _timed_out = out.status.code() == Some(1); // our Main exits 1 on failure
            Ok((stdout, stderr, false, runtime_ms))
        }
        Ok(Err(e)) => Err(e.into()),
        Err(_) => Ok((String::new(), String::new(), true, runtime_ms)),
    }
}

pub async fn run_java(slug: &str, code: &str, timeout_ms: Option<u64>) -> Result<serde_json::Value> {
    let problem = problems::get_problem(slug)?;
    let timeout_ms = timeout_ms.unwrap_or(5000);
    let total = problem["tests"].as_array().map(|v| v.len()).unwrap_or(0) as i64;

    let project = harness::build_java_project(&problem, code);
    let dir = temp_dir();
    fs::create_dir_all(&dir)?;

    for (name, source) in &project.files {
        fs::write(dir.join(name), source)?;
    }

    // Compile
    let file_names: Vec<String> = project.files.keys().cloned().collect();
    let mut compile_cmd = Command::new("javac");
    compile_cmd.current_dir(&dir);
    for f in &file_names { compile_cmd.arg(f); }

    let (compile_out, compile_err, compile_timed_out, compile_ms) =
        run_with_timeout(&mut compile_cmd, COMPILE_TIMEOUT_SECS).await?;

    let compile_out_c = compile_out.clone();
    let compile_err_c = compile_err.clone();

    if compile_timed_out {
        let _ = fs::remove_dir_all(&dir);
        return Ok(serde_json::json!({
            "pass": 0, "total": total, "results": [],
            "stdout": compile_out_c, "stderr": compile_err_c,
            "compileError": "编译超时", "runtimeMs": compile_ms, "timedOut": true
        }));
    }

    // Check if compilation succeeded by looking for class files
    let compile_success = dir.join("Main.class").exists() && dir.join("Types.class").exists();
    if !compile_success {
        let err_text = if !compile_err.is_empty() { compile_err } else { compile_out };
        let _ = fs::remove_dir_all(&dir);
        return Ok(serde_json::json!({
            "pass": 0, "total": total, "results": [],
            "stdout": compile_out_c, "stderr": compile_err_c,
            "compileError": err_text.trim().to_string(),
            "runtimeMs": compile_ms, "timedOut": false
        }));
    }

    // Run
    let timeout_secs = (timeout_ms as f64 / 1000.0).max(1.0) as u64;
    let mut run_cmd = Command::new("java");
    run_cmd.current_dir(&dir).arg("Main");

    let (run_out, run_err, run_timed_out, run_ms) =
        run_with_timeout(&mut run_cmd, timeout_secs).await?;

    let _ = fs::remove_dir_all(&dir);

    if run_timed_out {
        return Ok(serde_json::json!({
            "pass": 0, "total": total, "results": [],
            "stdout": run_out, "stderr": run_err,
            "compileError": null, "runtimeMs": run_ms, "timedOut": true
        }));
    }

    let (results, pass, parsed_total) = parse_results(&run_out);
    let total = if parsed_total > 0 { parsed_total } else { total };

    Ok(serde_json::json!({
        "pass": pass, "total": total, "results": results,
        "stdout": run_out, "stderr": run_err,
        "compileError": null, "runtimeMs": run_ms, "timedOut": false
    }))
}
