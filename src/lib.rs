mod cache;
mod registry;
mod resolver;
mod semver_utils;
mod types;

use napi_derive::napi;
use types::{CheckOptions, CheckResult, PackageInfo};

#[napi]
pub async fn check_updates(
    packages: Vec<PackageInfo>,
    options: CheckOptions,
) -> napi::Result<CheckResult> {
    let result = resolver::resolve_updates(packages, &options).await;
    Ok(result)
}

#[napi]
pub fn clear_cache(cache_file: Option<String>) -> napi::Result<()> {
    let file_path = cache_file.unwrap_or_else(|| {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        format!("{}/.turbo-ncu-cache.json", home)
    });
    let mut c = cache::Cache::new(&file_path, 0);
    c.clear();
    Ok(())
}
